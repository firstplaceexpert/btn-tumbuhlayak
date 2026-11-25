/**
 * Skema Arisan Klaster + KPR FLPP (modul tambahan, berdiri sendiri).
 * Membandingkan dua skema untuk satu klaster peserta:
 *  A. Arisan murni: seluruh iuran dikumpulkan lalu dipakai membeli rumah tunai.
 *  B. Arisan klaster + KPR FLPP: tabungan tetap milik peserta, dipakai sebagai kesiapan akad
 *     (uang muka, biaya akad, cadangan angsuran). Sisa rumah dibiayai KPR FLPP.
 *
 * Semua parameter adalah asumsi simulasi dan harus ditampilkan sebagai asumsi di antarmuka.
 */

export interface ClusterSchemeInput {
  members: number;              // jumlah peserta klaster
  dailyContribution: number;    // iuran per hari (Rp)
  housePrice: number;           // harga rumah saat ini (Rp)
  annualPriceGrowth: number;    // kenaikan harga tahunan, contoh 0.045
  akadPerDay: number;           // kapasitas akad per hari sesuai pasokan developer mitra
  readinessThreshold: number;   // ambang kesiapan akad per peserta (Rp)
  tenorYears: number;           // tenor KPR FLPP, contoh 20 atau 40
  kprRate?: number;             // default 0.05 (FLPP rumah tapak)
  downPaymentShare?: number;    // default 0.01
  horizonYears?: number;        // default 6, titik data per 0,5 tahun
}

export interface ClusterSchemePoint {
  year: number;
  pureArisanHouses: number;
  clusterKprHouses: number;
  savingsBalance: number; // saldo tabungan peserta di bank (Rp), skema B
}

export interface ClusterSchemeResult {
  monthlyInstallment: number;
  installmentPerDay: number;
  renovationSavingsPerDay: number; // sisa iuran setelah angsuran, mengalir ke tabungan renovasi
  contributionCoversInstallment: boolean;
  readinessDays: number;
  annualInflow: number;
  pure: { avgWaitYears: number; lastWaitYears: number };
  cluster: { avgWaitYears: number; lastWaitYears: number };
  points: ClusterSchemePoint[];
}

const DAYS_PER_MONTH = 30.4;

export function calculateClusterScheme(input: ClusterSchemeInput): ClusterSchemeResult {
  const N = Math.max(1, Math.round(input.members));
  const iuran = Math.max(1, input.dailyContribution);
  const price0 = Math.max(1, input.housePrice);
  const g = Math.max(0, input.annualPriceGrowth);
  const cap = Math.max(0.1, input.akadPerDay);
  const thr = Math.max(0, input.readinessThreshold);
  const rate = input.kprRate ?? 0.05;
  const dp = input.downPaymentShare ?? 0.01;
  const horizon = input.horizonYears ?? 6;

  // Angsuran anuitas KPR FLPP
  const principal = price0 * (1 - dp);
  const r = rate / 12;
  const n = Math.max(1, Math.round(input.tenorYears * 12));
  const monthlyInstallment =
    r > 0
      ? Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1))
      : Math.round(principal / n);
  const installmentPerDay = monthlyInstallment / DAYS_PER_MONTH;
  const renovationSavingsPerDay = Math.max(0, iuran - installmentPerDay);

  // Skema B: jadwal akad per peserta
  const readinessDays = Math.ceil(thr / iuran);
  const akadDay: number[] = Array.from({ length: N }, (_, i) => readinessDays + Math.floor(i / cap));

  // Skema A: jumlah rumah kumulatif per hari (iuran tetap, harga naik)
  const pureCum: number[] = [];
  let cum = 0;
  for (let d = 0; d < 365 * 40 && cum < N; d++) {
    cum += (N * iuran) / (price0 * Math.pow(1 + g, d / 365));
    pureCum.push(cum);
  }
  const pureWaits: number[] = [];
  for (let i = 1; i <= N; i++) {
    let lo = 0;
    let hi = pureCum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (pureCum[mid] >= i) hi = mid;
      else lo = mid + 1;
    }
    pureWaits.push(lo / 365);
  }
  const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
  const clusterWaits = akadDay.map((d) => d / 365);

  // Titik data per 0,5 tahun
  const points: ClusterSchemePoint[] = [];
  for (let y = 0; y <= horizon + 1e-9; y += 0.5) {
    const d = Math.round(y * 365);
    const pureHouses =
      d === 0 ? 0 : Math.min(N, Math.round(pureCum[Math.min(d, pureCum.length) - 1] ?? N));
    let done = 0;
    let balance = 0;
    for (let i = 0; i < N; i++) {
      if (akadDay[i] > d) {
        balance += iuran * d;
      } else {
        done++;
        balance += iuran * akadDay[i] - thr + renovationSavingsPerDay * (d - akadDay[i]);
      }
    }
    points.push({
      year: y,
      pureArisanHouses: pureHouses,
      clusterKprHouses: done,
      savingsBalance: Math.round(balance),
    });
  }

  return {
    monthlyInstallment,
    installmentPerDay,
    renovationSavingsPerDay,
    contributionCoversInstallment: iuran >= installmentPerDay,
    readinessDays,
    annualInflow: N * iuran * 365,
    pure: { avgWaitYears: avg(pureWaits), lastWaitYears: pureWaits[N - 1] },
    cluster: { avgWaitYears: avg(clusterWaits), lastWaitYears: clusterWaits[N - 1] },
    points,
  };
}
