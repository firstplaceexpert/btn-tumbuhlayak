'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DemoUser } from '../types';
import { ARISAN_GROUP_SLOTS, findPropertyByNfcUid } from '../data/nfcPropertyRegistry';
import {
  ARISAN_LOCATION_ZONES,
  GENZ_ARISAN_PRESETS,
  OFFICIAL_REGULATION_SOURCES,
} from '../data/arisanLocations';
import {
  calculateDailyArisanProjection,
  solveIdealArisanMarkup,
} from '../lib/calculator';
import { calculateClusterScheme } from '../lib/clusterScheme';
import { formatRupiah } from '../lib/formatters';
import { BtnLogo } from './BtnLogo';
import { ArisanCharts } from './ArisanCharts';
import { ClusterSchemeCharts } from './ClusterSchemeCharts';
import { AnimatedNumber } from './AnimatedNumber';
import {
  Wifi,
  Users,
  Calendar,
  MapPin,
  CheckCircle2,
  Award,
  ArrowRight,
  AlertCircle,
  Landmark,
  UserPlus,
  ExternalLink,
  ClipboardCheck,
  Info,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ArisanLayerViewProps {
  user: DemoUser;
  initialZoneId?: string;
  onSimulateWinUnit: () => void;
  onGoToNfcScanner: () => void;
}

type ArisanSchemeMode = 'cluster-kpr' | 'pure-arisan';
type ArisanSectionTab = 'ringkasan' | 'simulasi' | 'kelayakan';

export const ArisanLayerView: React.FC<ArisanLayerViewProps> = ({
  user,
  initialZoneId,
  onSimulateWinUnit,
  onGoToNfcScanner,
}) => {
  const userDomicileZone =
    ARISAN_LOCATION_ZONES.find((z) => z.id === user.domicileZoneId) || ARISAN_LOCATION_ZONES[0];
  const defaultZone =
    ARISAN_LOCATION_ZONES.find((z) => z.id === initialZoneId) || userDomicileZone;

  // Calm progressive sub-tabs so users never get hit by 15 numbers & 3 charts at once
  const [sectionTab, setSectionTab] = useState<ArisanSectionTab>('ringkasan');
  const [showAssumptionsInline, setShowAssumptionsInline] = useState(false);

  // Mode toggle: Arisan klaster + KPR FLPP (default) vs Arisan murni
  const [schemeMode, setSchemeMode] = useState<ArisanSchemeMode>('cluster-kpr');

  // Locked strictly to user's domicile zone from registration/biodata
  const selectedZone = userDomicileZone;
  const [clusterRegisteredMap, setClusterRegisteredMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    ARISAN_LOCATION_ZONES.forEach((z) => {
      map[z.id] = z.registeredMembers;
    });
    return map;
  });
  const [joinedZones, setJoinedZones] = useState<Record<string, boolean>>({});

  // Adjustable Parameters
  const [dailyContribution, setDailyContribution] = useState<number>(
    defaultZone.defaultDailyContribution
  );
  const [quotaMembers, setQuotaMembers] = useState<number>(defaultZone.defaultQuota);
  const [annualInflationRate, setAnnualInflationRate] = useState<number>(
    defaultZone.defaultInflationRate
  );
  const [markupRate, setMarkupRate] = useState<number>(() =>
    solveIdealArisanMarkup(
      defaultZone.officialFlppPrice,
      defaultZone.defaultQuota,
      defaultZone.defaultDailyContribution,
      defaultZone.defaultInflationRate
    )
  );
  const [activePresetId, setActivePresetId] = useState<string>('ideal-genz');

  // Cluster + KPR FLPP parameters
  const [akadPerDay, setAkadPerDay] = useState<number>(5);
  const [readinessThreshold, setReadinessThreshold] = useState<number>(15000000);
  const [flppTenorYears, setFlppTenorYears] = useState<number>(20);

  // MBR & DSR Pre-Registration Eligibility Checker state
  const [maritalStatus, setMaritalStatus] = useState<'lajang' | 'menikah'>('lajang');
  const [applicantIncome, setApplicantIncome] = useState<number>(5500000);

  const [bottomTableTab, setBottomTableTab] = useState<'proyeksi' | 'giliran'>('proyeksi');

  // Pure Arisan calculation
  const pureSim = useMemo(
    () =>
      calculateDailyArisanProjection({
        baseHousePrice: selectedZone.officialFlppPrice,
        quotaMembers,
        dailyContribution,
        annualInflationRate,
        markupRate,
      }),
    [selectedZone.officialFlppPrice, quotaMembers, dailyContribution, annualInflationRate, markupRate]
  );

  // Cluster + KPR FLPP calculation
  const clusterSim = useMemo(
    () =>
      calculateClusterScheme({
        members: quotaMembers,
        dailyContribution,
        housePrice: selectedZone.officialFlppPrice,
        annualPriceGrowth: annualInflationRate,
        akadPerDay,
        readinessThreshold,
        tenorYears: flppTenorYears,
        kprRate: 0.05,
        downPaymentShare: 0.01,
        horizonYears: 6,
      }),
    [
      quotaMembers,
      dailyContribution,
      selectedZone.officialFlppPrice,
      annualInflationRate,
      akadPerDay,
      readinessThreshold,
      flppTenorYears,
    ]
  );

  const registeredCount = Math.min(
    quotaMembers,
    clusterRegisteredMap[selectedZone.id] ?? selectedZone.registeredMembers
  );
  const quotaProgressPct = Math.min(
    100,
    Number(((registeredCount / Math.max(1, quotaMembers)) * 100).toFixed(1))
  );
  const isQuotaReached = registeredCount >= quotaMembers;
  const remainingQuotaSlots = Math.max(0, quotaMembers - registeredCount);
  const hasJoinedSelectedZone = Boolean(joinedZones[selectedZone.id]);

  // Participant metrics
  const ownedRecord = user.assignedNfcUid ? findPropertyByNfcUid(user.assignedNfcUid) : null;
  const userSavingsBalance = user.paidMonths * user.monthlyContribution;
  const readinessProgressPct = Math.min(
    100,
    Math.round((userSavingsBalance / Math.max(1, readinessThreshold)) * 100)
  );
  const remainingToReadiness = Math.max(0, readinessThreshold - userSavingsBalance);
  const daysToReadiness = Math.ceil(remainingToReadiness / Math.max(1, dailyContribution));
  const estAkadMonthsFromNow = Math.max(
    1,
    Math.ceil((daysToReadiness + Math.floor(user.arisanSlotNumber / Math.max(0.1, akadPerDay))) / 30.4)
  );

  // MBR & DSR Eligibility Check
  const maxMbrIncome =
    maritalStatus === 'lajang'
      ? selectedZone.mbrMaxIncomeSingle
      : selectedZone.mbrMaxIncomeMarried;
  const isMbrEligible = applicantIncome > 0 && applicantIncome <= maxMbrIncome;
  const flppDsrRatio =
    applicantIncome > 0 ? clusterSim.monthlyInstallment / applicantIncome : 1;
  const dsrLabel =
    flppDsrRatio <= 0.3
      ? { text: 'Aman (≤ 30%)', cls: 'bg-positive-soft text-positive border-positive-border' }
      : flppDsrRatio <= 0.35
      ? { text: 'Waspada (30–35%)', cls: 'bg-ochre-soft text-ochre border-ochre-border' }
      : { text: 'Ketat (> 35%)', cls: 'bg-btnred-soft text-btnred border-btnred-border' };

  const peakClusterSavings = useMemo(
    () => Math.max(0, ...clusterSim.points.map((p) => p.savingsBalance)),
    [clusterSim.points]
  );

  // Auto-sync simulation baseline when user account or domicile changes
  useEffect(() => {
    setQuotaMembers(userDomicileZone.defaultQuota);
    setDailyContribution(userDomicileZone.defaultDailyContribution);
    setAnnualInflationRate(userDomicileZone.defaultInflationRate);
    setMarkupRate(
      solveIdealArisanMarkup(
        userDomicileZone.officialFlppPrice,
        userDomicileZone.defaultQuota,
        userDomicileZone.defaultDailyContribution,
        userDomicileZone.defaultInflationRate
      )
    );
    setActivePresetId('ideal-genz');
  }, [user.id, userDomicileZone]);

  const handleApplyPreset = (presetId: string) => {
    const preset = GENZ_ARISAN_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetId(preset.id);
    setDailyContribution(preset.dailyContribution);
    setQuotaMembers(preset.quotaMembers);
    setAnnualInflationRate(preset.annualInflationRate);

    if (preset.useAutoMarkup) {
      setMarkupRate(
        solveIdealArisanMarkup(
          selectedZone.officialFlppPrice,
          preset.quotaMembers,
          preset.dailyContribution,
          preset.annualInflationRate
        )
      );
    } else {
      setMarkupRate(preset.manualMarkupRate ?? 0);
    }
  };

  const handleJoinSelectedCluster = () => {
    if (hasJoinedSelectedZone) return;
    setJoinedZones((prev) => ({ ...prev, [selectedZone.id]: true }));
    setClusterRegisteredMap((prev) => ({
      ...prev,
      [selectedZone.id]: Math.min(quotaMembers, (prev[selectedZone.id] ?? 0) + 1),
    }));
  };

  const handleSimulateFullQuota = () => {
    setClusterRegisteredMap((prev) => ({
      ...prev,
      [selectedZone.id]: quotaMembers,
    }));
  };

  const renderAssumptionsContent = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed text-xs text-ink-secondary">
      <div className="space-y-2">
        <div className="font-semibold text-ink">Sumber regulasi resmi yang dirujuk:</div>
        <ul className="list-disc pl-4 space-y-1.5">
          <li>
            <a
              href={OFFICIAL_REGULATION_SOURCES.kepmenPupr689Url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand font-medium hover:underline inline-flex items-center gap-1"
            >
              <span>{OFFICIAL_REGULATION_SOURCES.kepmenPupr689Label}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            </a>{' '}
            — batas harga jual rumah tapak subsidi (Rp 166 Jt – Rp 240 Jt) & SBUM (Rp 4 Jt non-Papua, Rp 10 Jt Papua), berlaku sejak 2024 (cek pembaruan).
          </li>
          <li>
            <strong className="text-ink">{OFFICIAL_REGULATION_SOURCES.permenPkp5Label}</strong> — 4 zonasi batas penghasilan MBR (Lajang Rp 8,5–12 Jt; Menikah Rp 10–14 Jt).
          </li>
          <li>
            Pembaruan acuan harga rumah subsidi 2025:{' '}
            <a
              href={OFFICIAL_REGULATION_SOURCES.priceUpdateReferenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline inline-flex items-center gap-0.5"
            >
              <span>Bisnis.com (Juli 2025)</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            </a>
            .
          </li>
        </ul>
      </div>

      <div className="space-y-2">
        <div className="font-semibold text-ink">Parameter yang bersifat asumsi simulasi:</div>
        <ul className="list-disc pl-4 space-y-1.5">
          <li>
            Jumlah pendaftar klaster, nama klaster, pengembang mitra, kapasitas akad ({akadPerDay} akad/hr), dan ambang kesiapan akad ({formatRupiah(readinessThreshold, true)}) adalah <strong className="text-ink">data simulasi</strong>.
          </li>
          <li>
            Kenaikan harga rumah ({(annualInflationRate * 100).toFixed(1).replace('.', ',')}%/thn), bunga FLPP 5% p.a. (DP 1%), serta bunga kredit renovasi (8,25%–9,75% p.a.) merupakan asumsi simulasi — cek ketentuan resmi di <strong className="text-ink">btn.co.id</strong>.
          </li>
          <li>
            Model penyusutan dan proyeksi valuasi renovasi berbasis asumsi heuristik (bukan laporan resmi KJPP).
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-panel-enter">
      {/* Calm Header + Focused 3-Tab View Switcher */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-6 border-b border-rule">
        <div className="max-w-xl space-y-2">
          <h1 className="font-display text-2xl font-bold text-ink tracking-[-0.015em] leading-snug">
            Arisan rumah subsidi Bank BTN
          </h1>
          <p className="text-[14px] text-ink-secondary leading-relaxed">
            Tabung rutin bersama klaster wilayah pilihan untuk menyiapkan akad KPR FLPP. Plafon harga merujuk{' '}
            <a
              href={OFFICIAL_REGULATION_SOURCES.kepmenPupr689Url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand font-medium hover:underline"
            >
              Kepmen PUPR 689/2023
            </a>{' '}
            (berlaku sejak 2024, cek pembaruan) · angka peserta bersifat data simulasi.
          </p>
        </div>

        {/* 3 Spacious Sub-Tabs on a single clean row */}
        <div
          className="inline-flex self-start xl:self-auto bg-well p-1 rounded-[12px] border border-hairline flex-wrap sm:flex-nowrap flex-shrink-0"
          role="tablist"
          aria-label="Bagian halaman Arisan Rumah"
        >
          {(
            [
              { id: 'ringkasan', label: 'Ringkasan & Wilayah', icon: MapPin },
              { id: 'simulasi', label: 'Simulasi & Grafik', icon: SlidersHorizontal },
              { id: 'kelayakan', label: 'Cek MBR & Jadwal', icon: ClipboardCheck },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const active = sectionTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSectionTab(t.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-[9px] text-[13px] font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-sheet text-brand font-semibold border border-hairline shadow-[0_1px_2px_rgba(31,36,43,0.06)]'
                    : 'text-ink-secondary hover:text-ink border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: RINGKASAN & WILAYAH (Tenang, lapang, minim angka sekaligus)    */}
      {/* ===================================================================== */}
      {sectionTab === 'ringkasan' && (
        <div className="space-y-8 animate-panel-enter">
          {/* Calm Participant Welcome & Progress Card */}
          {user.hasReceivedUnit && ownedRecord ? (
            <section
              aria-label="Status unit rumah dan kartu kunci NFC"
              className="rounded-card btn-kpi-surface text-white p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-100">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>Unit Rumah BTN Telah Diserahkan · Kartu Kunci NFC Aktif (Simulasi)</span>
                </div>
                <h2 className="font-display text-xl font-bold text-white">
                  {ownedRecord.clusterName} · {ownedRecord.unitBlock} ({ownedRecord.houseTypeLabel})
                </h2>
                <p className="text-sm text-blue-100 leading-relaxed">
                  Gunakan kartu kunci NFC{' '}
                  <span className="font-mono font-semibold text-white bg-white/15 px-1.5 py-0.5 rounded">
                    {ownedRecord.uid}
                  </span>{' '}
                  untuk membuka editor denah rumah tumbuh dan estimasi nilai properti Anda.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 flex-shrink-0">
                <div className="px-4 py-3 rounded-[10px] bg-sheet text-ink min-w-[225px] flex items-center justify-between gap-3">
                  <div>
                    <BtnLogo size="sm" />
                    <div className="text-xs font-mono font-semibold text-ink mt-1.5">
                      {ownedRecord.uid}
                    </div>
                    <div className="text-xs text-ink-secondary">{ownedRecord.unitBlock}</div>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-brand-soft text-brand flex items-center justify-center flex-shrink-0">
                    <Wifi className="w-4 h-4" aria-hidden="true" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onGoToNfcScanner}
                  className="h-10 px-5 rounded-control bg-btnred hover:bg-btnred-hover text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <span>Scan Kartu Rumah Anda</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </section>
          ) : (
            <section
              aria-label="Progres kesiapan peserta"
              className="rounded-[18px] border border-hairline bg-gradient-to-r from-[#EEF4FD] via-[#FCFBF8] to-[#FEF7EA] p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              <div className="lg:col-span-7 space-y-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-secondary">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-brand">
                      <Users className="w-3.5 h-3.5" aria-hidden="true" />
                      Peserta {user.name} · Giliran #{user.arisanSlotNumber}
                    </span>
                    <span>·</span>
                    <span>
                      {readinessProgressPct >= 100
                        ? 'Siap akad (antrean aktif)'
                        : `Estimasi siap akad ±${estAkadMonthsFromNow} bulan lagi`}
                    </span>
                  </div>
                  <h2 className="font-display text-lg font-bold text-ink">
                    Progres kesiapan akad klaster {selectedZone.shortLabel}
                  </h2>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="font-display text-lg font-bold text-ink tabular-nums">
                      <AnimatedNumber
                        value={userSavingsBalance}
                        format={(n) => formatRupiah(Math.round(n))}
                      />
                      <span className="text-sm font-sans font-normal text-ink-secondary ml-2">
                        dari target kesiapan {formatRupiah(readinessThreshold, true)}
                      </span>
                    </div>
                    <span className="font-mono text-sm font-semibold text-brand tabular-nums">
                      <AnimatedNumber value={readinessProgressPct} format={(n) => `${Math.round(n)}%`} />
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-sheet border border-hairline rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 chart-bar-x ${
                        readinessProgressPct >= 100 ? 'bg-positive' : 'bg-brand'
                      }`}
                      style={{ width: `${readinessProgressPct}%` }}
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onSimulateWinUnit}
                    className="h-10 px-5 rounded-control bg-brand hover:bg-brand-hover text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                  >
                    <Award className="w-4 h-4" aria-hidden="true" />
                    <span>Simulasi Akad & Terima Kartu NFC</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-[14px] bg-[#F6F4EF] border border-hairline p-2 shadow-[0_10px_24px_-16px_rgba(31,36,43,0.18)]">
                  <img
                    src="/illustrations/arisan-cluster-community.jpg"
                    alt="Ilustrasi komunitas peserta arisan klaster rumah subsidi BTN"
                    className="w-full aspect-[4/3] object-cover rounded-[10px] block"
                  />
                </div>
              </div>
            </section>
          )}

          {/* 3 Calm Headline Numbers ONLY (No 4x2 wall of numbers!) */}
          <section aria-label="Ringkasan angka utama wilayah terpilih" className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-card border border-hairline bg-sheet space-y-2">
              <div className="text-[13px] text-ink-secondary">
                Estimasi angsuran FLPP ({flppTenorYears} thn · 5%)
              </div>
              <div className="font-display text-2xl font-bold text-ink tabular-nums">
                <AnimatedNumber
                  value={clusterSim.monthlyInstallment}
                  format={(n) => formatRupiah(Math.round(n))}
                />
                <span className="text-sm font-sans font-normal text-ink-secondary"> / bln</span>
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed tabular-nums">
                Dari iuran {formatRupiah(dailyContribution)}/hr, sisa{' '}
                <strong className="text-positive">
                  {formatRupiah(Math.round(clusterSim.renovationSavingsPerDay))}/hr
                </strong>{' '}
                mengalir ke tabungan renovasi.
              </p>
            </div>

            <div className="p-6 rounded-card border border-hairline bg-sheet space-y-2">
              <div className="text-[13px] text-ink-secondary">Rata-rata waktu tunggu akad</div>
              <div className="font-display text-2xl font-bold text-brand tabular-nums">
                <AnimatedNumber
                  value={clusterSim.cluster.avgWaitYears}
                  format={(n) => `${n.toFixed(1).replace('.', ',')} tahun`}
                />
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed tabular-nums">
                Lebih cepat dibanding arisan murni{' '}
                <strong className="text-ink">
                  {clusterSim.pure.avgWaitYears.toFixed(1).replace('.', ',')} thn
                </strong>{' '}
                (peserta terakhir {clusterSim.cluster.lastWaitYears.toFixed(1).replace('.', ',')} vs{' '}
                {clusterSim.pure.lastWaitYears.toFixed(1).replace('.', ',')} thn).
              </p>
            </div>

            <div className="p-6 rounded-card border border-hairline bg-sheet space-y-2">
              <div className="text-[13px] text-ink-secondary">
                Potensi dana masuk BTN ({selectedZone.shortLabel})
              </div>
              <div className="font-display text-2xl font-bold text-ink tabular-nums">
                <AnimatedNumber
                  value={clusterSim.annualInflow}
                  format={(n) => formatRupiah(n, true)}
                />
                <span className="text-sm font-sans font-normal text-ink-secondary"> / thn</span>
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed tabular-nums">
                +{quotaMembers.toLocaleString('id-ID')} rekening baru · kapasitas {akadPerDay} akad/hari · puncak saldo{' '}
                {formatRupiah(peakClusterSavings, true)}.
              </p>
            </div>
          </section>

          {/* Single Focused Domicile Cluster Card (Only displays the user's own domicile region!) */}
          <section aria-label="Klaster wilayah domisili Anda" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-base font-semibold text-ink">
                  Klaster wilayah domisili Anda
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-positive-soft text-positive border border-positive-border text-[11px] font-semibold">
                  <MapPin className="w-3 h-3" aria-hidden="true" />
                  Otomatis sesuai domisili: {user.domicileCity || selectedZone.shortLabel}
                </span>
              </div>
              <span className="text-xs text-ink-secondary">
                Hanya menampilkan klaster sesuai domisili akun Anda
              </span>
            </div>

            <div className="rounded-[18px] border border-brand-border bg-sheet p-6 space-y-5">
              {/* Top Row: Cluster Name + Price & SBUM */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-rule">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-brand-soft text-brand border border-brand-border text-xs font-semibold">
                      {selectedZone.regionName}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-positive-soft text-positive text-xs font-semibold">
                      Domisili Anda
                    </span>
                    {isQuotaReached && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-positive text-white text-xs font-semibold">
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                        Kuota Tercapai · Siklus Berjalan
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink">
                    {selectedZone.clusterName}
                  </h3>
                  <p className="text-xs text-ink-secondary">
                    Cakupan wilayah: {selectedZone.sampleCities} · {selectedZone.regulationNote}
                  </p>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 flex-shrink-0">
                  <div className="px-4 py-2.5 rounded-control bg-brand-soft/70 border border-brand-border">
                    <div className="text-[11px] text-brand font-medium">Plafon harga FLPP</div>
                    <div className="font-display text-lg font-bold text-ink tabular-nums">
                      {formatRupiah(selectedZone.officialFlppPrice, true)}
                    </div>
                  </div>
                  <div className="px-4 py-2.5 rounded-control bg-ochre-soft/75 border border-ochre-border">
                    <div className="text-[11px] text-ochre font-medium">SBUM resmi</div>
                    <div className="font-display text-lg font-bold text-ink tabular-nums">
                      {formatRupiah(selectedZone.sbumAmount, true)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle: Quota Progress Bar */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums">
                  <span className="font-medium text-ink">
                    Progres kuota klaster (data simulasi):{' '}
                    <strong className="font-mono">
                      {registeredCount.toLocaleString('id-ID')} / {quotaMembers.toLocaleString('id-ID')} peserta
                    </strong>
                    {!isQuotaReached && (
                      <span className="text-ink-secondary font-normal">
                        {' '}· butuh {remainingQuotaSlots.toLocaleString('id-ID')} peserta lagi
                      </span>
                    )}
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      isQuotaReached ? 'text-positive' : 'text-brand'
                    }`}
                  >
                    {quotaProgressPct}%
                  </span>
                </div>
                <div className="h-2.5 w-full bg-well rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-[width] duration-300 ${
                      isQuotaReached ? 'bg-positive' : 'bg-brand'
                    }`}
                    style={{ width: `${quotaProgressPct}%` }}
                  />
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleJoinSelectedCluster}
                    disabled={hasJoinedSelectedZone}
                    className="h-9 px-4 rounded-control bg-brand hover:bg-brand-hover disabled:bg-positive disabled:opacity-100 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {hasJoinedSelectedZone ? 'Terdaftar (Simulasi)' : 'Daftar & Buka Rekening BTN'}
                    </span>
                  </button>

                  {!isQuotaReached && (
                    <button
                      type="button"
                      onClick={handleSimulateFullQuota}
                      className="h-9 px-3.5 rounded-control border border-control bg-sheet hover:bg-well text-ink text-xs font-medium transition-colors whitespace-nowrap"
                    >
                      Simulasi Kuota Penuh 100%
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSectionTab('simulasi')}
                  className="h-9 px-3.5 rounded-control text-brand hover:bg-brand-soft text-xs font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                >
                  <span>Lihat grafik & hitung</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </section>

          {/* Quiet Expandable Assumptions & Official Sources Disclosure */}
          <div className="border border-hairline rounded-card bg-well/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAssumptionsInline((prev) => !prev)}
              aria-expanded={showAssumptionsInline}
              className="w-full px-5 py-3.5 flex items-center justify-between gap-3 text-left text-xs font-medium text-ink-secondary hover:text-ink transition-colors"
            >
              <span className="inline-flex items-center gap-2">
                <Info className="w-4 h-4 text-brand flex-shrink-0" aria-hidden="true" />
                <span>Catatan asumsi simulasi & tautan sumber regulasi resmi (Kepmen PUPR 689/2023 · Permen PKP 5/2025)</span>
              </span>
              {showAssumptionsInline ? (
                <ChevronUp className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              )}
            </button>
            {showAssumptionsInline && (
              <div className="px-5 pb-5 pt-2 border-t border-rule">{renderAssumptionsContent()}</div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: SIMULASI & GRAFIK (Kalkulator + Perbandingan Grafik Tenang)    */}
      {/* ===================================================================== */}
      {sectionTab === 'simulasi' && (
        <div className="space-y-8 animate-panel-enter">
          {/* Scheme Mode Toggle + Active Region Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-card bg-well border border-hairline">
            <div className="text-sm text-ink-secondary">
              Wilayah aktif:{' '}
              <strong className="text-ink">{selectedZone.regionName}</strong> ({formatRupiah(selectedZone.officialFlppPrice)})
            </div>

            <div
              className="inline-flex self-start sm:self-auto bg-sheet p-1 rounded-[10px] border border-hairline"
              role="tablist"
              aria-label="Pilih skema arisan"
            >
              <button
                type="button"
                role="tab"
                aria-selected={schemeMode === 'cluster-kpr'}
                onClick={() => setSchemeMode('cluster-kpr')}
                className={`px-3.5 py-1.5 rounded-[7px] text-xs font-semibold transition-colors whitespace-nowrap ${
                  schemeMode === 'cluster-kpr'
                    ? 'bg-brand text-white'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                Arisan klaster + KPR FLPP
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={schemeMode === 'pure-arisan'}
                onClick={() => setSchemeMode('pure-arisan')}
                className={`px-3.5 py-1.5 rounded-[7px] text-xs font-semibold transition-colors whitespace-nowrap ${
                  schemeMode === 'pure-arisan'
                    ? 'bg-brand text-white'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                Arisan murni
              </button>
            </div>
          </div>

          {/* Spacious Calculator Card */}
          <section
            aria-label="Kalkulator parameter skema arisan"
            className="border border-hairline rounded-card bg-sheet p-6 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-rule">
              <div>
                <h2 className="font-display text-base font-semibold text-ink">
                  {schemeMode === 'cluster-kpr'
                    ? 'Parameter Arisan Klaster + KPR FLPP'
                    : 'Parameter Arisan Murni & Penyangga Inflasi'}
                </h2>
                <p className="text-[13px] text-ink-secondary mt-0.5">
                  {schemeMode === 'cluster-kpr'
                    ? 'Tabungan tetap milik peserta untuk kesiapan akad; sisa rumah dibiayai KPR FLPP 5%.'
                    : 'Seluruh iuran dikumpulkan untuk membeli rumah tunai bergilir dengan penyangga inflasi.'}
                </p>
              </div>
              <span className="text-xs text-ink-secondary">Geser parameter untuk melihat dampak di grafik</span>
            </div>

            {/* Compact Presets Strip */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-ink-secondary mr-1">Preset cepat:</span>
              {GENZ_ARISAN_PRESETS.map((preset) => {
                const active = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.id)}
                    className={`px-3 py-1.5 rounded-control border text-xs font-medium transition-colors ${
                      active
                        ? 'bg-brand-soft border-brand text-brand font-semibold'
                        : 'bg-well/60 border-hairline text-ink-secondary hover:text-ink'
                    }`}
                    title={preset.description}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Clean 2-Column Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between text-[13px]">
                  <label htmlFor="slider-daily" className="font-medium text-ink">
                    Iuran harian / peserta
                  </label>
                  <span className="font-mono font-semibold text-brand tabular-nums">
                    {formatRupiah(dailyContribution)}/hr
                  </span>
                </div>
                <input
                  id="slider-daily"
                  type="range"
                  min={20000}
                  max={100000}
                  step={5000}
                  value={dailyContribution}
                  onChange={(e) => {
                    setActivePresetId('custom');
                    setDailyContribution(Number(e.target.value));
                  }}
                  className="w-full studio-range"
                />
                <div className="text-xs text-ink-secondary tabular-nums">
                  ≈ {formatRupiah(dailyContribution * 30)}/bulan
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between text-[13px]">
                  <label htmlFor="slider-quota" className="font-medium text-ink">
                    Jumlah peserta klaster
                  </label>
                  <span className="font-mono font-semibold text-brand tabular-nums">
                    {quotaMembers.toLocaleString('id-ID')} orang
                  </span>
                </div>
                <input
                  id="slider-quota"
                  type="range"
                  min={1000}
                  max={10000}
                  step={250}
                  value={quotaMembers}
                  onChange={(e) => {
                    setActivePresetId('custom');
                    setQuotaMembers(Number(e.target.value));
                  }}
                  className="w-full studio-range"
                />
                <div className="text-xs text-ink-secondary tabular-nums">
                  Dana masuk {formatRupiah(quotaMembers * dailyContribution, true)}/hari
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between text-[13px]">
                  <label htmlFor="slider-inflation" className="font-medium text-ink">
                    Asumsi kenaikan harga / thn
                  </label>
                  <span className="font-mono font-semibold text-btnred tabular-nums">
                    {(annualInflationRate * 100).toFixed(1).replace('.', ',')}%/thn
                  </span>
                </div>
                <input
                  id="slider-inflation"
                  type="range"
                  min={0}
                  max={0.1}
                  step={0.005}
                  value={annualInflationRate}
                  onChange={(e) => {
                    setActivePresetId('custom');
                    setAnnualInflationRate(parseFloat(e.target.value));
                  }}
                  className="w-full studio-range"
                />
                <div className="text-xs text-ink-secondary">Asumsi simulasi inflasi properti</div>
              </div>

              {schemeMode === 'cluster-kpr' ? (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between text-[13px]">
                      <label htmlFor="slider-akad-cap" className="font-medium text-ink">
                        Kapasitas akad / hari
                      </label>
                      <span className="font-mono font-semibold text-brand tabular-nums">
                        {akadPerDay} akad/hr
                      </span>
                    </div>
                    <input
                      id="slider-akad-cap"
                      type="range"
                      min={1}
                      max={15}
                      step={1}
                      value={akadPerDay}
                      onChange={(e) => setAkadPerDay(Number(e.target.value))}
                      className="w-full studio-range"
                    />
                    <div className="text-xs text-ink-secondary">Sesuai pasokan pengembang mitra</div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between text-[13px]">
                      <label htmlFor="slider-readiness" className="font-medium text-ink">
                        Ambang kesiapan akad
                      </label>
                      <span className="font-mono font-semibold text-brand tabular-nums">
                        {formatRupiah(readinessThreshold, true)}
                      </span>
                    </div>
                    <input
                      id="slider-readiness"
                      type="range"
                      min={5000000}
                      max={30000000}
                      step={1000000}
                      value={readinessThreshold}
                      onChange={(e) => setReadinessThreshold(Number(e.target.value))}
                      className="w-full studio-range"
                    />
                    <div className="text-xs text-ink-secondary tabular-nums">
                      Tercapai ±{clusterSim.readinessDays} hari menabung
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="select-flpp-tenor" className="block text-[13px] font-medium text-ink">
                      Tenor KPR FLPP (5% p.a.)
                    </label>
                    <select
                      id="select-flpp-tenor"
                      value={flppTenorYears}
                      onChange={(e) => setFlppTenorYears(Number(e.target.value))}
                      className="w-full h-9 px-3 rounded-control border border-control bg-sheet text-sm font-medium text-ink focus:border-brand focus:outline-none"
                    >
                      <option value={15}>15 tahun (180 bulan)</option>
                      <option value={20}>20 tahun (standar FLPP)</option>
                      <option value={30}>30 tahun (simulasi)</option>
                      <option value={40}>40 tahun (simulasi)</option>
                    </select>
                    <div className="text-xs text-ink-secondary tabular-nums">
                      Angsuran {formatRupiah(clusterSim.monthlyInstallment)}/bln
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5 md:col-span-2 lg:col-span-3 max-w-md">
                  <div className="flex items-baseline justify-between text-[13px]">
                    <label htmlFor="slider-markup" className="font-medium text-ink">
                      Markup penyangga inflasi
                    </label>
                    <span className="font-mono font-semibold text-brand tabular-nums">
                      +{Math.round(markupRate * 100)}% ({formatRupiah(pureSim.projectedContractPrice, true)})
                    </span>
                  </div>
                  <input
                    id="slider-markup"
                    type="range"
                    min={0}
                    max={1.0}
                    step={0.01}
                    value={markupRate}
                    onChange={(e) => {
                      setActivePresetId('custom');
                      setMarkupRate(parseFloat(e.target.value));
                    }}
                    className="w-full studio-range"
                  />
                  <div className="flex items-center justify-between text-xs text-ink-secondary">
                    <span>0% (Tanpa penyangga)</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActivePresetId('custom');
                        setMarkupRate(pureSim.recommendedMarkupRate);
                      }}
                      className="font-semibold text-brand hover:underline"
                    >
                      Pakai ideal (+{Math.round(pureSim.recommendedMarkupRate * 100)}%)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {schemeMode === 'pure-arisan' && !pureSim.isBalanced && (
              <div className="p-4 rounded-control bg-btnred-soft border border-btnred-border flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-btnred flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  Penyangga inflasi kurang ({pureSim.shortfallMembers.toLocaleString('id-ID')} peserta belum tercover).
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActivePresetId('custom');
                    setMarkupRate(pureSim.recommendedMarkupRate);
                  }}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-control bg-brand hover:bg-brand-hover text-white font-semibold transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Terapkan Markup Ideal (+{Math.round(pureSim.recommendedMarkupRate * 100)}%)</span>
                </button>
              </div>
            )}
          </section>

          {/* Animated Visual Charts */}
          {schemeMode === 'cluster-kpr' ? (
            <ClusterSchemeCharts
              key={`cluster-${selectedZone.id}`}
              result={clusterSim}
              members={quotaMembers}
              dailyContribution={dailyContribution}
              regionShortLabel={selectedZone.shortLabel}
            />
          ) : (
            <ArisanCharts
              key={`pure-${selectedZone.id}`}
              sim={pureSim}
              regionShortLabel={selectedZone.shortLabel}
            />
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: CEK MBR, JADWAL & SUMBER REGULASI                              */}
      {/* ===================================================================== */}
      {sectionTab === 'kelayakan' && (
        <div className="space-y-8 animate-panel-enter">
          {/* MBR & DSR Pre-Registration Eligibility Checker */}
          <section
            aria-label="Pemeriksaan kelayakan MBR dan DSR di awal pendaftaran"
            className="border border-hairline rounded-card bg-sheet p-6 space-y-5"
          >
            <div className="pb-4 border-b border-rule flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-semibold text-ink inline-flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-brand" aria-hidden="true" />
                  <span>Cek kelayakan MBR & DSR pendaftaran</span>
                </h2>
                <p className="text-[13px] text-ink-secondary mt-0.5">
                  {selectedZone.regionName} · {selectedZone.mbrZoneLabel} · acuan batas penghasilan Permen PKP No. 5/2025
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-brand">
                Plafon {formatRupiah(selectedZone.officialFlppPrice)} · SBUM {formatRupiah(selectedZone.sbumAmount, true)}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-medium text-ink mb-1.5">Status perkawinan</span>
                  <div className="grid grid-cols-2 gap-1 bg-well p-1 rounded-control border border-hairline">
                    <button
                      type="button"
                      onClick={() => setMaritalStatus('lajang')}
                      className={`h-8 rounded-[6px] text-xs font-medium transition-colors ${
                        maritalStatus === 'lajang'
                          ? 'bg-sheet text-brand font-semibold border border-hairline'
                          : 'text-ink-secondary hover:text-ink'
                      }`}
                    >
                      Lajang
                    </button>
                    <button
                      type="button"
                      onClick={() => setMaritalStatus('menikah')}
                      className={`h-8 rounded-[6px] text-xs font-medium transition-colors ${
                        maritalStatus === 'menikah'
                          ? 'bg-sheet text-brand font-semibold border border-hairline'
                          : 'text-ink-secondary hover:text-ink'
                      }`}
                    >
                      Menikah
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="mbr-income-input" className="block text-xs font-medium text-ink mb-1.5">
                    Penghasilan / bulan (Rp)
                  </label>
                  <input
                    id="mbr-income-input"
                    type="number"
                    min={1000000}
                    step={500000}
                    value={applicantIncome || ''}
                    onChange={(e) => setApplicantIncome(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full h-10 px-3 rounded-control border border-control bg-sheet text-sm font-mono tabular-nums text-ink focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div
                  className={`p-4 rounded-control border space-y-1 ${
                    isMbrEligible
                      ? 'bg-positive-soft/75 border-positive-border text-positive'
                      : 'bg-btnred-soft border-btnred-border text-btnred'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1.5">
                    {isMbrEligible ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    )}
                    <span>
                      {isMbrEligible
                        ? 'Memenuhi batas penghasilan MBR'
                        : 'Melebihi batas penghasilan MBR'}
                    </span>
                  </div>
                  <div className="text-ink-secondary tabular-nums">
                    Batas maks. ({maritalStatus}):{' '}
                    <strong className="text-ink">{formatRupiah(maxMbrIncome)}/bln</strong>
                  </div>
                </div>

                <div className={`p-4 rounded-control border space-y-1 ${dsrLabel.cls}`}>
                  <div className="font-semibold tabular-nums">
                    DSR FLPP ({flppTenorYears} thn): {(flppDsrRatio * 100).toFixed(1).replace('.', ',')}% · {dsrLabel.text}
                  </div>
                  <div className="text-ink-secondary tabular-nums">
                    Angsuran {formatRupiah(clusterSim.monthlyInstallment)}/bln dari {formatRupiah(applicantIncome)}/bln
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Projection Table & Member Schedule */}
          <section
            aria-label="Tabel proyeksi klaster dan jadwal giliran unit"
            className="border border-hairline rounded-card bg-sheet overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-rule flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold text-ink">
                  {bottomTableTab === 'proyeksi'
                    ? `Tabel proyeksi simulasi · ${selectedZone.regionName}`
                    : 'Daftar giliran & kartu kunci NFC (data simulasi)'}
                </h2>
              </div>

              <div
                className="inline-flex bg-well p-0.5 rounded-control border border-hairline"
                role="tablist"
                aria-label="Pilih tampilan tabel arisan"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={bottomTableTab === 'proyeksi'}
                  onClick={() => setBottomTableTab('proyeksi')}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors ${
                    bottomTableTab === 'proyeksi'
                      ? 'bg-sheet text-brand font-semibold border border-hairline'
                      : 'text-ink-secondary hover:text-ink border border-transparent'
                  }`}
                >
                  Proyeksi 0–6 thn
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={bottomTableTab === 'giliran'}
                  onClick={() => setBottomTableTab('giliran')}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                    bottomTableTab === 'giliran'
                      ? 'bg-sheet text-brand font-semibold border border-hairline'
                      : 'text-ink-secondary hover:text-ink border border-transparent'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Daftar penerima</span>
                </button>
              </div>
            </div>

            {bottomTableTab === 'proyeksi' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-hairline text-xs text-ink-secondary">
                      <th className="py-3 px-6 font-medium">Tahun</th>
                      <th className="py-3 px-3 font-medium text-right">Klaster + KPR FLPP</th>
                      <th className="py-3 px-3 font-medium text-right">Arisan murni</th>
                      <th className="py-3 px-3 font-medium text-right">Selisih lebih cepat</th>
                      <th className="py-3 px-6 font-medium text-right">Saldo tabungan di BTN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule text-[13px] tabular-nums">
                    {clusterSim.points.map((pt) => {
                      const diff = pt.clusterKprHouses - pt.pureArisanHouses;
                      return (
                        <tr key={pt.year} className="hover:bg-well/50 transition-colors">
                          <td className="py-2.5 px-6 font-semibold text-ink">
                            Tahun {pt.year.toFixed(1).replace('.', ',')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-brand">
                            {pt.clusterKprHouses.toLocaleString('id-ID')} unit
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-btnred">
                            {pt.pureArisanHouses.toLocaleString('id-ID')} unit
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-positive font-semibold">
                            {diff >= 0 ? '+' : ''}
                            {diff.toLocaleString('id-ID')} unit
                          </td>
                          <td className="py-2.5 px-6 text-right font-mono text-ink">
                            {formatRupiah(pt.savingsBalance, true)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[540px]">
                  <thead>
                    <tr className="border-b border-hairline text-xs text-ink-secondary">
                      <th className="py-3 px-6 font-medium">No</th>
                      <th className="py-3 px-3 font-medium">Peserta (data simulasi)</th>
                      <th className="py-3 px-3 font-medium">Periode</th>
                      <th className="py-3 px-6 font-medium">Status & Kartu NFC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule text-[13px]">
                    {ARISAN_GROUP_SLOTS.map((slot) => {
                      const isMe =
                        slot.memberName.toLowerCase() === user.name.toLowerCase() ||
                        (user.hasReceivedUnit && slot.nfcUid === user.assignedNfcUid);

                      const effectiveDelivered =
                        slot.status === 'unit-diserahkan' || (isMe && user.hasReceivedUnit);

                      return (
                        <tr
                          key={slot.slotNo}
                          className={isMe ? 'bg-brand-soft/60' : 'hover:bg-well/60'}
                        >
                          <td className="py-3 px-6 font-mono font-medium text-ink-secondary tabular-nums">
                            #{slot.slotNo}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-medium text-ink flex items-center gap-1.5">
                              <span>{slot.memberName}</span>
                              {isMe && (
                                <span className="px-1.5 py-0.5 rounded bg-brand text-white text-[11px] font-semibold">
                                  Anda
                                </span>
                              )}
                            </div>
                            {slot.unitBlock && (
                              <div className="text-xs text-ink-secondary">{slot.unitBlock}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-ink-secondary">{slot.periodeBulan}</td>
                          <td className="py-3 px-6">
                            {effectiveDelivered ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-positive-soft text-positive border border-positive-border text-xs font-medium">
                                  <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                                  Unit Diserahkan
                                </span>
                                <div className="text-xs font-mono text-ink-secondary">
                                  {isMe && user.assignedNfcUid ? user.assignedNfcUid : slot.nfcUid}
                                </div>
                              </div>
                            ) : slot.status === 'undian-aktif' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-brand-soft text-brand border border-brand-border text-xs font-medium">
                                Undian periode ini
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-well text-ink-secondary border border-hairline text-xs font-medium">
                                Terjadwal
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Full Transparent Assumptions & Official Sources Panel */}
          <section
            aria-label="Panel asumsi simulasi dan sumber regulasi resmi"
            className="border border-hairline rounded-card bg-well/70 p-6 space-y-3"
          >
            <div className="flex items-center gap-2 font-display text-sm font-semibold text-ink">
              <Landmark className="w-4 h-4 text-brand flex-shrink-0" aria-hidden="true" />
              <span>Panel asumsi simulasi & sumber regulasi resmi</span>
            </div>
            {renderAssumptionsContent()}
          </section>
        </div>
      )}
    </div>
  );
};
