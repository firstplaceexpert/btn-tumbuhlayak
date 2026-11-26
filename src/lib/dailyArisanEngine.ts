/**
 * TumbuhLayak - Mesin Perhitungan Arisan Rumah Harian (1 Rumah / Hari)
 *
 * Rumus inti:
 *   Kuota Peserta (N) = ceil(Harga Rumah / Iuran Harian)
 *   Contoh: Rp 170.000.000 / Rp 50.000 = 3.400 orang
 *   Dana Terkumpul per Hari = N x Iuran Harian = 100% Harga 1 Unit Rumah
 *   Frekuensi Undian = 1 pemenang unit rumah setiap hari (365 unit/tahun)
 *   Durasi Siklus Lunas = N / 365 tahun (contoh: 3.400 / 365 = 9,3 tahun)
 *
 * Pengamanan Anti-Gagal Bayar (Skema Hak Huni Sewa-Beli & Penahanan SHM Bank BTN):
 *   Pemenang undian langsung menempati unit dengan Kartu Kunci NFC BTN,
 *   namun SHM/SHGB tetap disimpan Bank BTN hingga iuran harian lunas 100%.
 *   Jika pemenang berhenti membayar setelah menempati rumah, Kartu NFC dibekukan,
 *   hak huni dicabut, dan setoran yang masuk diperhitungkan sebagai biaya sewa (rental).
 */

export interface DailyArisanYearMilestone {
  year: number;
  yearLabel: string;
  unitsDeliveredInYear: number;
  cumulativeUnits: number;
  cumulativePercent: number;
  memberPaidCumulative: number;
  memberPaidPercent: number;
}

export interface DailyOneHouseModel {
  housePrice: number;
  dailyContribution: number;
  monthlyEquivalent: number;
  requiredQuota: number;
  dailyPoolCollected: number;
  cycleDays: number;
  cycleYears: number;
  registeredMembers: number;
  remainingSlots: number;
  quotaProgressPercent: number;
  isReadyToStart: boolean;
  yearlyMilestones: DailyArisanYearMilestone[];
}

export interface DefaultRentalSimulation {
  wonAtMonth: number;
  stoppedAtMonth: number;
  monthsOccupied: number;
  totalPaidBeforeDefault: number;
  convertedRentalAmount: number;
  unpaidPrincipalRemaining: number;
  shmReleased: boolean;
  nfcFrozen: boolean;
  unitReallocatedToCluster: boolean;
}

export function calculateDailyOneHouseModel(
  housePrice: number,
  dailyContribution: number,
  registeredMembers = 0
): DailyOneHouseModel {
  const safePrice = Math.max(50_000_000, housePrice);
  const safeDaily = Math.max(10_000, dailyContribution);

  const requiredQuota = Math.ceil(safePrice / safeDaily);
  const dailyPoolCollected = requiredQuota * safeDaily;
  const cycleDays = requiredQuota;
  const cycleYears = Number((cycleDays / 365).toFixed(1));
  const monthlyEquivalent = safeDaily * 30;

  const clampedRegistered = Math.max(0, Math.min(requiredQuota, Math.round(registeredMembers)));
  const remainingSlots = Math.max(0, requiredQuota - clampedRegistered);
  const quotaProgressPercent = Math.min(
    100,
    Number(((clampedRegistered / Math.max(1, requiredQuota)) * 100).toFixed(1))
  );
  const isReadyToStart = remainingSlots === 0;

  const totalYearsCeil = Math.ceil(cycleDays / 365);
  const yearlyMilestones: DailyArisanYearMilestone[] = [];
  let cumulativeUnits = 0;

  for (let year = 1; year <= totalYearsCeil; year++) {
    const daysInYear = Math.min(365, cycleDays - (year - 1) * 365);
    cumulativeUnits += daysInYear;
    const memberPaidCumulative = Math.min(safePrice, cumulativeUnits * safeDaily);

    yearlyMilestones.push({
      year,
      yearLabel: `Thn ${year}`,
      unitsDeliveredInYear: daysInYear,
      cumulativeUnits,
      cumulativePercent: Number(((cumulativeUnits / requiredQuota) * 100).toFixed(1)),
      memberPaidCumulative,
      memberPaidPercent: Number(((memberPaidCumulative / safePrice) * 100).toFixed(1)),
    });
  }

  return {
    housePrice: safePrice,
    dailyContribution: safeDaily,
    monthlyEquivalent,
    requiredQuota,
    dailyPoolCollected,
    cycleDays,
    cycleYears,
    registeredMembers: clampedRegistered,
    remainingSlots,
    quotaProgressPercent,
    isReadyToStart,
    yearlyMilestones,
  };
}

export function calculateDefaultRentalSimulation(
  housePrice: number,
  dailyContribution: number,
  wonAtMonth: number,
  stoppedAtMonth: number
): DefaultRentalSimulation {
  const safeWon = Math.max(1, wonAtMonth);
  const safeStopped = Math.max(safeWon + 1, stoppedAtMonth);
  const monthsOccupied = safeStopped - safeWon;
  const monthlyPayment = dailyContribution * 30;
  const totalPaidBeforeDefault = Math.min(housePrice, safeStopped * monthlyPayment);
  const convertedRentalAmount = Math.min(totalPaidBeforeDefault, monthsOccupied * monthlyPayment);
  const unpaidPrincipalRemaining = Math.max(0, housePrice - totalPaidBeforeDefault);

  return {
    wonAtMonth: safeWon,
    stoppedAtMonth: safeStopped,
    monthsOccupied,
    totalPaidBeforeDefault,
    convertedRentalAmount,
    unpaidPrincipalRemaining,
    shmReleased: false,
    nfcFrozen: true,
    unitReallocatedToCluster: true,
  };
}
