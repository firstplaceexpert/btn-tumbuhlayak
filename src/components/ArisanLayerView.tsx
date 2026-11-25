'use client';

import React, { useMemo, useState } from 'react';
import { DemoUser } from '../types';
import { ARISAN_GROUP_SLOTS, findPropertyByNfcUid } from '../data/nfcPropertyRegistry';
import { ARISAN_LOCATION_ZONES, GENZ_ARISAN_PRESETS } from '../data/arisanLocations';
import {
  calculateDailyArisanProjection,
  solveIdealArisanMarkup,
} from '../lib/calculator';
import { formatRupiah } from '../lib/formatters';
import { BtnLogo } from './BtnLogo';
import { ArisanCharts } from './ArisanCharts';
import {
  Wifi,
  Users,
  Calendar,
  MapPin,
  CheckCircle2,
  Award,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Landmark,
  TrendingUp,
  UserPlus,
} from 'lucide-react';

interface ArisanLayerViewProps {
  user: DemoUser;
  onSimulateWinUnit: () => void;
  onGoToNfcScanner: () => void;
}

export const ArisanLayerView: React.FC<ArisanLayerViewProps> = ({
  user,
  onSimulateWinUnit,
  onGoToNfcScanner,
}) => {
  const defaultZone = ARISAN_LOCATION_ZONES[0]; // Jawa Rp 166 Jt (Kepmen PUPR 689/2023)

  // Step 1: Location-first selection & live cluster quota state
  const [selectedZoneId, setSelectedZoneId] = useState<string>(defaultZone.id);
  const [clusterRegisteredMap, setClusterRegisteredMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    ARISAN_LOCATION_ZONES.forEach((z) => {
      map[z.id] = z.registeredMembers;
    });
    return map;
  });
  const [joinedZones, setJoinedZones] = useState<Record<string, boolean>>({});

  // Step 2: Adjustable Gen-Z Daily Micro-Arisan & Inflation Markup Parameters
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
  const [bottomTableTab, setBottomTableTab] = useState<'proyeksi' | 'giliran'>('proyeksi');

  const selectedZone = useMemo(
    () =>
      ARISAN_LOCATION_ZONES.find((z) => z.id === selectedZoneId) || ARISAN_LOCATION_ZONES[0],
    [selectedZoneId]
  );

  const sim = useMemo(
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

  const handleSelectZone = (zoneId: string) => {
    const nextZone = ARISAN_LOCATION_ZONES.find((z) => z.id === zoneId);
    if (!nextZone) return;
    setSelectedZoneId(zoneId);
    setQuotaMembers(nextZone.defaultQuota);
    setDailyContribution(nextZone.defaultDailyContribution);
    setAnnualInflationRate(nextZone.defaultInflationRate);
    setMarkupRate(
      solveIdealArisanMarkup(
        nextZone.officialFlppPrice,
        nextZone.defaultQuota,
        nextZone.defaultDailyContribution,
        nextZone.defaultInflationRate
      )
    );
    setActivePresetId('ideal-genz');
  };

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

  const ownedRecord = user.assignedNfcUid ? findPropertyByNfcUid(user.assignedNfcUid) : null;
  const paidPercent = Math.min(100, Math.round((user.paidMonths / user.totalCycleMonths) * 100));
  const totalUserPaid = user.paidMonths * user.monthlyContribution;

  return (
    <div className="space-y-6 animate-panel-enter">
      {/* Page Title Row */}
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand mb-1">
          <span className="px-2 py-0.5 rounded bg-brand-soft border border-brand-border">
            Arisan Rumah Harian Gen-Z · Rekening Escrow Bank BTN
          </span>
        </div>
        <h1 className="font-display text-[22px] font-bold text-ink tracking-[-0.015em] leading-snug">
          Skema arisan rumah subsidi Bank BTN berbasis lokasi
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Pilih lokasi rumah subsidi resmi BTN (acuan Kepmen PUPR 689/2023), penuhi kuota klaster lewat pembukaan Rekening Tabungan BTN auto-debit harian, dan simulasikan percepatan serah terima 1–2 rumah per hari.
        </p>
      </div>

      {/* Personal Membership & NFC Smart Key Status Banner */}
      {user.hasReceivedUnit && ownedRecord ? (
        <section
          aria-label="Status unit rumah dan kartu kunci NFC"
          className="rounded-card btn-kpi-surface text-white p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
        >
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-semibold text-white">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              Unit Rumah BTN Telah Diserahkan · Kartu Kunci NFC Aktif
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-white">
              {ownedRecord.clusterName} · {ownedRecord.unitBlock} ({ownedRecord.houseTypeLabel})
            </h2>
            <p className="text-[13px] text-blue-100 leading-relaxed">
              Selamat {user.name}, unit rumah inti Anda telah dibangun oleh mitra developer Bank BTN ({ownedRecord.handoverDate}). Gunakan kartu kunci fisik berchip NFC{' '}
              <span className="font-mono font-semibold text-white bg-white/15 px-1.5 py-0.5 rounded">
                {ownedRecord.uid}
              </span>{' '}
              untuk memverifikasi aset serta membuka halaman perencanaan pembangunan dan estimasi harga rumah Anda sekarang.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 flex-shrink-0">
            <div className="px-4 py-3 rounded-[10px] bg-white text-ink border border-white/40 min-w-[230px] flex items-center justify-between gap-3">
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
              className="h-10 px-4 rounded-control bg-btnred hover:bg-btnred-hover text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <span>Scan Kartu Rumah Anda</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </section>
      ) : (
        <section
          aria-label="Status peserta arisan aktif"
          className="rounded-card border border-brand-border bg-brand-soft/60 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sheet border border-brand-border text-xs font-semibold text-brand">
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              {user.arisanGroupName} · Nomor Giliran #{user.arisanSlotNumber}
            </div>
            <h2 className="font-display text-base sm:text-lg font-bold text-ink">
              Progres setoran auto-debit BTN Anda: {user.paidMonths} dari {user.totalCycleMonths} bulan ({paidPercent}%)
            </h2>
            <div className="max-w-xl space-y-1.5">
              <div className="h-2.5 w-full bg-sheet rounded-full overflow-hidden border border-brand-border">
                <div
                  className="h-full bg-brand rounded-full transition-[width] duration-500"
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
              <div className="flex flex-wrap justify-between text-xs text-ink-secondary tabular-nums gap-2">
                <span>
                  Saldo terkumpul di Rekening Escrow BTN:{' '}
                  <strong className="text-ink">{formatRupiah(totalUserPaid)}</strong>
                </span>
                <span>Auto-debit: {formatRupiah(user.monthlyContribution)}/bln</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={onSimulateWinUnit}
              className="h-10 px-4 rounded-control bg-brand hover:bg-brand-hover text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <Award className="w-4 h-4" aria-hidden="true" />
              <span>Simulasi Menang Undian & Terima Kartu NFC</span>
            </button>
            <span className="text-xs text-ink-secondary text-center">
              Terbitkan unit Blok C-08 & kartu kunci NFC BTN
            </span>
          </div>
        </section>
      )}

      {/* STEP 1: LOCATION-FIRST SELECTION & LIVE CLUSTER QUOTA GATE */}
      <section
        aria-label="Pilih lokasi rumah subsidi BTN dan cek kuota peserta"
        className="border border-hairline rounded-card bg-sheet p-5 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
          <div className="max-w-3xl">
            <h2 className="font-display text-[15px] font-semibold text-ink">
              1. Pilih wilayah rumah subsidi BTN & pantau status kuota klaster
            </h2>
            <p className="text-[13px] text-ink-secondary mt-0.5">
              Harga rumah mengikuti plafon resmi rumah subsidi FLPP Bank BTN (Kepmen PUPR No. 689/KPTS/M/2023 berlaku 2024–2026). Siklus arisan dimulai saat kuota wilayah tercapai.
            </p>
          </div>
          <span className="self-start text-xs font-medium text-brand bg-brand-soft border border-brand-border px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
            Wajib Rekening Tabungan BTN
          </span>
        </div>

        {/* 6 Official Indonesian Region Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ARISAN_LOCATION_ZONES.map((zone) => {
            const isSelected = zone.id === selectedZone.id;
            const zoneQuotaTarget = isSelected ? quotaMembers : zone.defaultQuota;
            const zoneReg = Math.min(
              zoneQuotaTarget,
              clusterRegisteredMap[zone.id] ?? zone.registeredMembers
            );
            const pct = Math.min(100, Math.round((zoneReg / Math.max(1, zoneQuotaTarget)) * 100));
            const full = zoneReg >= zoneQuotaTarget;

            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => handleSelectZone(zone.id)}
                className={`text-left p-3.5 rounded-card border transition-colors flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-brand-soft/60 border-brand ring-1 ring-brand'
                    : 'bg-sheet border-hairline hover:border-brand-border hover:bg-well/60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-display text-[13px] font-semibold text-ink">
                      <MapPin
                        className={`w-3.5 h-3.5 flex-shrink-0 ${
                          isSelected ? 'text-brand' : 'text-ink-subtle'
                        }`}
                        aria-hidden="true"
                      />
                      <span>{zone.regionName}</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-brand whitespace-nowrap tabular-nums">
                      {formatRupiah(zone.officialFlppPrice, true)}
                    </span>
                  </div>
                  <p className="text-xs text-ink-secondary line-clamp-1">{zone.sampleCities}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs tabular-nums">
                    <span className={full ? 'text-positive font-semibold' : 'text-ink-secondary'}>
                      {full ? 'Kuota tercapai 100%' : `${zoneReg.toLocaleString('id-ID')} / ${zoneQuotaTarget.toLocaleString('id-ID')} orang`}
                    </span>
                    <span className="font-mono font-semibold text-ink">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-well rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width] duration-300 ${
                        full ? 'bg-positive' : 'bg-brand'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Cluster Quota Status & BTN Account Onboarding Strip */}
        <div
          className={`p-4 rounded-control border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
            isQuotaReached
              ? 'bg-positive-soft/70 border-positive-border'
              : 'bg-well border-hairline'
          }`}
        >
          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-sm font-semibold text-ink">
                {selectedZone.clusterName}
              </span>
              {isQuotaReached ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-positive text-white text-xs font-semibold">
                  <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                  Kuota Tercapai · Siklus Berjalan
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-soft text-brand border border-brand-border text-xs font-semibold">
                  Tahap Pengumpulan Kuota ({quotaProgressPct}%)
                </span>
              )}
              {hasJoinedSelectedZone && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sheet border border-positive-border text-positive text-xs font-medium">
                  Rekening Auto-Debit BTN Terdaftar
                </span>
              )}
            </div>
            <p className="text-xs text-ink-secondary tabular-nums">
              {isQuotaReached ? (
                <>
                  Seluruh <strong className="text-ink">{quotaMembers.toLocaleString('id-ID')} nasabah BTN</strong> telah memenuhi kuota. Auto-debit harian aktif dengan serah terima{' '}
                  <strong className="text-positive">
                    {sim.year1UnitsPerDay.toFixed(2).replace('.', ',')} rumah/hari
                  </strong>{' '}
                  di tahun pertama.
                </>
              ) : (
                <>
                  Terkumpul <strong className="text-ink">{registeredCount.toLocaleString('id-ID')}</strong> dari target{' '}
                  <strong className="text-ink">{quotaMembers.toLocaleString('id-ID')} peserta</strong> (butuh{' '}
                  <strong className="text-brand">{remainingQuotaSlots.toLocaleString('id-ID')} peserta lagi</strong> untuk membuka penarikan unit harian).
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleJoinSelectedCluster}
              disabled={hasJoinedSelectedZone}
              className="h-9 px-3.5 rounded-control bg-brand hover:bg-brand-hover disabled:bg-positive disabled:opacity-100 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {hasJoinedSelectedZone
                  ? 'Sudah Terdaftar di Klaster Ini'
                  : 'Daftar & Buka Rekening BTN'}
              </span>
            </button>

            {!isQuotaReached && (
              <button
                type="button"
                onClick={handleSimulateFullQuota}
                className="h-9 px-3.5 rounded-control border border-control bg-sheet hover:bg-well text-ink text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Simulasi Kuota Penuh 100%
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 4-COLUMN STRATEGIC IMPACT KPI STRIP (FOR BANK BTN & GEN-Z) */}
      <section
        aria-label="Ringkasan dampak strategis untuk Bank BTN dan peserta Gen-Z"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5"
      >
        {/* Lead Solid BTN Blue Card: Daily Subsidized Home Sales Velocity */}
        <div className="p-4 sm:p-5 rounded-card btn-kpi-surface text-white flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-blue-100">
              Penjualan rumah subsidi BTN
            </span>
            <span className="w-2.5 h-1 rounded-full bg-btnred flex-shrink-0" aria-hidden="true" />
          </div>
          <div className="mt-2 font-display text-[26px] leading-tight font-bold text-white tabular-nums">
            {sim.year1UnitsPerDay.toFixed(2).replace('.', ',')} rumah/hari
          </div>
          <div className="mt-2 text-xs text-blue-100 tabular-nums">
            Tahun ke-1 · rata-rata <strong className="text-white">{sim.avgUnitsPerDay.toFixed(2).replace('.', ',')} unit/hari</strong> ({sim.totalUnitsFunded.toLocaleString('id-ID')} unit)
          </div>
        </div>

        {/* Cashflow Masuk Bank BTN */}
        <div className="p-4 sm:p-5 rounded-card border border-hairline border-t-[3px] border-t-btnred bg-sheet flex flex-col justify-center">
          <div className="text-[13px] font-medium text-ink-secondary">
            Arus kas masuk ke Bank BTN
          </div>
          <div className="mt-1.5 font-display text-[20px] leading-tight font-bold text-ink tabular-nums">
            {formatRupiah(sim.dailyCashflowBtn, true)}
            <span className="text-xs font-sans font-normal text-ink-secondary"> / hari</span>
          </div>
          <div className="mt-1.5 text-xs text-ink-secondary tabular-nums">
            {formatRupiah(sim.monthlyCashflowBtn, true)}/bln · {formatRupiah(sim.annualCashflowBtn, true)}/thn
          </div>
        </div>

        {/* Nasabah & Rekening Baru BTN */}
        <div className="p-4 sm:p-5 rounded-card border border-hairline border-t-[3px] border-t-positive bg-sheet flex flex-col justify-center">
          <div className="text-[13px] font-medium text-ink-secondary">
            Nasabah & rekening baru BTN
          </div>
          <div className="mt-1.5 font-display text-[20px] leading-tight font-bold text-positive tabular-nums">
            +{sim.quotaMembers.toLocaleString('id-ID')} Rekening
          </div>
          <div className="mt-1.5 text-xs text-ink-secondary">
            100% auto-debit Tabungan BTN per klaster wilayah
          </div>
        </div>

        {/* Beban Harian & Durasi Gen-Z */}
        <div className="p-4 sm:p-5 rounded-card border border-hairline border-t-[3px] border-t-brand bg-sheet flex flex-col justify-center">
          <div className="text-[13px] font-medium text-ink-secondary">
            Iuran Gen-Z & durasi selesai
          </div>
          <div className="mt-1.5 font-display text-[20px] leading-tight font-bold text-ink tabular-nums">
            {formatRupiah(sim.dailyContribution)}
            <span className="text-xs font-sans font-normal text-ink-secondary"> / hari</span>
          </div>
          <div className="mt-1.5 text-xs text-brand font-medium tabular-nums">
            {formatRupiah(sim.monthlyContribution)}/bln · lunas dalam {sim.cycleYears.toFixed(1).replace('.', ',')} tahun
          </div>
        </div>
      </section>

      {/* STEP 2: INTERACTIVE CALCULATOR & SUSTAINABILITY ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left (7 cols): Interactive Daily Micro-Arisan + Markup Calculator */}
        <section
          aria-label="Kalkulator iuran harian, kuota, dan markup proyeksi inflasi"
          className="lg:col-span-7 border border-hairline rounded-card bg-sheet p-5 space-y-5"
        >
          <div className="pb-3 border-b border-rule">
            <h2 className="font-display text-[15px] font-semibold text-ink">
              2. Kalkulator skema arisan harian & proyeksi markup harga rumah
            </h2>
            <p className="text-[13px] text-ink-secondary mt-0.5">
              Ubah iuran harian, kuota peserta, proyeksi kenaikan harga rumah, dan markup penyangga untuk mencari titik paling realistis bagi Gen-Z sekaligus menguntungkan Bank BTN.
            </p>
          </div>

          {/* Quick Presets Comparing Baseline 20rb vs Tuned Gen-Z Models */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-ink-secondary">
              Pilih preset cepat untuk perbandingan skenario:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {GENZ_ARISAN_PRESETS.map((preset) => {
                const active = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.id)}
                    className={`p-3 rounded-control border text-left transition-colors ${
                      active
                        ? 'bg-brand-soft border-brand text-ink'
                        : 'bg-sheet border-hairline hover:bg-well text-ink'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[13px] font-semibold ${active ? 'text-brand' : 'text-ink'}`}>
                        {preset.label}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${
                          preset.id === 'konsep-awal-20rb'
                            ? 'bg-btnred-soft text-btnred'
                            : active
                            ? 'bg-brand text-white'
                            : 'bg-well text-ink-secondary'
                        }`}
                      >
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-xs text-ink-secondary mt-1 leading-snug">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4 Interactive Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
            {/* Slider 1: Daily Contribution */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2 text-[13px]">
                <label htmlFor="slider-daily" className="font-medium text-ink">
                  Iuran harian per peserta
                </label>
                <span className="font-mono font-bold text-brand tabular-nums">
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
              <div className="flex justify-between text-xs text-ink-secondary tabular-nums">
                <span>Rp 20rb</span>
                <span className="font-medium text-ink">
                  ≈ {formatRupiah(dailyContribution * 30)}/bln
                </span>
                <span>Rp 100rb</span>
              </div>
            </div>

            {/* Slider 2: Quota Members */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2 text-[13px]">
                <label htmlFor="slider-quota" className="font-medium text-ink">
                  Target kuota peserta
                </label>
                <span className="font-mono font-bold text-brand tabular-nums">
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
              <div className="flex justify-between text-xs text-ink-secondary tabular-nums">
                <span>1.000</span>
                <span className="font-medium text-ink">
                  Cashflow {formatRupiah(sim.dailyCashflowBtn, true)}/hr
                </span>
                <span>10.000</span>
              </div>
            </div>

            {/* Slider 3: Annual House Price Inflation */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2 text-[13px]">
                <label htmlFor="slider-inflation" className="font-medium text-ink">
                  Proyeksi kenaikan harga / thn
                </label>
                <span className="font-mono font-bold text-btnred tabular-nums">
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
              <div className="flex justify-between text-xs text-ink-secondary tabular-nums">
                <span>0%</span>
                <span>
                  Thn {sim.yearlySchedule.length}: {formatRupiah(sim.finalYearHousePrice, true)}
                </span>
                <span>10%</span>
              </div>
            </div>

            {/* Slider 4: Projected Markup Buffer */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2 text-[13px]">
                <label htmlFor="slider-markup" className="font-medium text-ink">
                  Markup harga proyeksi
                </label>
                <span className="font-mono font-bold text-brand tabular-nums">
                  +{Math.round(markupRate * 100)}% ({formatRupiah(sim.projectedContractPrice, true)})
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
                <span>0% (Harga awal)</span>
                <button
                  type="button"
                  onClick={() => {
                    setActivePresetId('custom');
                    setMarkupRate(sim.recommendedMarkupRate);
                  }}
                  className="font-semibold text-brand hover:underline"
                >
                  Pakai ideal (+{Math.round(sim.recommendedMarkupRate * 100)}%)
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Right (5 cols): Sustainability Verdict + Strategic Benefits for BTN & Gen-Z */}
        <section
          aria-label="Analisis keseimbangan dana dan manfaat bagi Bank BTN"
          className="lg:col-span-5 border border-hairline rounded-card bg-sheet p-5 flex flex-col justify-between gap-4"
        >
          <div className="space-y-4">
            {/* Sustainability Check Box */}
            {sim.isBalanced ? (
              <div className="p-4 rounded-card bg-positive-soft/75 border border-positive-border space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-positive">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span>Skema Seimbang · 100% Peserta Terjamin Dapat Rumah</span>
                </div>
                <p className="text-xs text-ink leading-relaxed">
                  Dengan markup proyeksi{' '}
                  <strong>+{Math.round(markupRate * 100)}%</strong> ({formatRupiah(sim.projectedContractPrice, true)}), seluruh{' '}
                  <strong>{sim.quotaMembers.toLocaleString('id-ID')} peserta</strong> terpenuhi meski harga rumah naik ke{' '}
                  <strong>{formatRupiah(sim.finalYearHousePrice, true)}</strong> di akhir siklus. Di tahun awal, arus kas langsung menyerap{' '}
                  <strong className="text-brand">
                    {sim.year1UnitsPerDay.toFixed(2).replace('.', ',')} rumah/hari
                  </strong>
                  .
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-card bg-btnred-soft border border-btnred-border space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-btnred">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span>
                    Dana Penyangga Inflasi Kurang ({sim.shortfallMembers.toLocaleString('id-ID')} peserta belum tercover)
                  </span>
                </div>
                <p className="text-xs text-ink leading-relaxed">
                  Karena kenaikan harga rumah {(annualInflationRate * 100).toFixed(1).replace('.', ',')}%/thn membuat harga akhir mencapai{' '}
                  <strong>{formatRupiah(sim.finalYearHousePrice, true)}</strong>, markup saat ini (+{Math.round(markupRate * 100)}%) hanya menutup{' '}
                  <strong>{sim.coveragePercent.toFixed(1).replace('.', ',')}%</strong> peserta.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActivePresetId('custom');
                    setMarkupRate(sim.recommendedMarkupRate);
                  }}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-control bg-brand hover:bg-brand-hover text-white text-xs font-semibold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    Terapkan Markup Ideal (+{Math.round(sim.recommendedMarkupRate * 100)}%)
                  </span>
                </button>
              </div>
            )}

            {/* Price Escalation Summary Strip */}
            <div className="grid grid-cols-3 gap-2 text-xs tabular-nums">
              <div className="p-2.5 rounded-control bg-well border border-hairline">
                <span className="text-ink-secondary block">Harga FLPP awal</span>
                <strong className="text-ink text-[13px]">
                  {formatRupiah(sim.baseHousePrice, true)}
                </strong>
              </div>
              <div className="p-2.5 rounded-control bg-brand-soft/60 border border-brand-border">
                <span className="text-ink-secondary block">Harga proyeksi</span>
                <strong className="text-brand text-[13px]">
                  {formatRupiah(sim.projectedContractPrice, true)}
                </strong>
              </div>
              <div className="p-2.5 rounded-control bg-well border border-hairline">
                <span className="text-ink-secondary block">Harga Thn {sim.yearlySchedule.length}</span>
                <strong className="text-btnred text-[13px]">
                  {formatRupiah(sim.finalYearHousePrice, true)}
                </strong>
              </div>
            </div>

            {/* Why This Model Wins for Bank BTN & Gen-Z */}
            <div className="space-y-2.5 pt-1">
              <div className="text-xs font-semibold text-ink">
                Keunggulan strategis bagi Bank BTN & generasi muda:
              </div>
              <div className="space-y-2 text-xs text-ink-secondary">
                <div className="flex items-start gap-2.5">
                  <Landmark className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong className="text-ink">Akuisisi Nasabah & Dana Murah (CASA):</strong> Setiap peserta wajib membuka rekening Tabungan BTN auto-debit, mendatangkan{' '}
                    <strong className="text-ink">+{sim.quotaMembers.toLocaleString('id-ID')} nasabah baru</strong> dan arus kas rutin{' '}
                    <strong className="text-ink">{formatRupiah(sim.monthlyCashflowBtn, true)}/bln</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <TrendingUp className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong className="text-ink">Serapan Rumah Subsidi 1–2 Unit/Hari:</strong> Developer mitra BTN mendapat kepastian serapan harian tunai tanpa menunggu antrean akad konvensional.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-btnred flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong className="text-ink">Ramah Kantong Gen-Z:</strong> Iuran mikro{' '}
                    <strong className="text-ink">{formatRupiah(sim.dailyContribution)}/hari</strong> terasa ringan seperti jajan harian, tanpa beban DP awal, bebas bunga KPR 20 tahun, dan dapat langsung direnovasi bertahap setelah menerima Kartu Kunci NFC.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-rule text-xs text-ink-secondary flex items-center justify-between gap-2 tabular-nums">
            <span>Total perputaran dana klaster</span>
            <strong className="font-mono text-brand">{formatRupiah(sim.totalCashflowBtn, true)}</strong>
          </div>
        </section>
      </div>

      {/* STEP 3: CHARTS (UNITS/DAY VS INFLATION & CUMULATIVE OWNERSHIP CURVE) */}
      <ArisanCharts sim={sim} regionShortLabel={selectedZone.shortLabel} />

      {/* STEP 4: YEAR-BY-YEAR PROJECTION LEDGER & GROUP DRAW SCHEDULE */}
      <section
        aria-label="Tabel proyeksi tahunan klaster dan jadwal giliran unit"
        className="border border-hairline rounded-card bg-sheet overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-rule flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[15px] font-semibold text-ink">
              {bottomTableTab === 'proyeksi'
                ? `Proyeksi tahunan klaster ${selectedZone.regionName}`
                : 'Daftar giliran & serah terima kartu kunci NFC BTN'}
            </h2>
            <p className="text-[13px] text-ink-secondary mt-0.5">
              {bottomTableTab === 'proyeksi'
                ? 'Rincian penyerahan unit rumah subsidi per tahun, laju penjualan harian, kenaikan harga properti, dan arus kas masuk ke BTN.'
                : 'Transparansi urutan penyerahan rumah inti dan status penerbitan kartu kunci rumah NFC.'}
            </p>
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
              Proyeksi tahunan ({sim.yearlySchedule.length} thn)
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
              <span>Daftar penerima unit</span>
            </button>
          </div>
        </div>

        {bottomTableTab === 'proyeksi' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[740px]">
              <thead>
                <tr className="border-b border-hairline text-xs text-ink-secondary">
                  <th className="py-3 px-5 font-medium">Tahun</th>
                  <th className="py-3 px-3 font-medium text-right">Proyeksi harga rumah</th>
                  <th className="py-3 px-3 font-medium text-right">Rumah terjual / thn</th>
                  <th className="py-3 px-3 font-medium text-right">Laju / hari</th>
                  <th className="py-3 px-3 font-medium text-right">Kumulatif peserta</th>
                  <th className="py-3 px-5 font-medium text-right">Arus kas masuk BTN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule text-[13px] tabular-nums">
                {sim.yearlySchedule.map((row) => (
                  <tr key={row.year} className="hover:bg-well/50 transition-colors">
                    <td className="py-2.5 px-5 font-semibold text-ink">Tahun ke-{row.year}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-ink-secondary">
                      {formatRupiah(row.housePriceInYear)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-ink">
                      {row.unitsHandedOver.toLocaleString('id-ID')} unit
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-semibold ${
                          row.unitsPerDay >= 1.25
                            ? 'bg-brand-soft text-brand'
                            : 'bg-well text-ink-secondary'
                        }`}
                      >
                        {row.unitsPerDay.toFixed(2).replace('.', ',')} / hari
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-ink">
                      {row.cumulativeUnits.toLocaleString('id-ID')}{' '}
                      <span className="text-xs text-positive font-semibold">
                        ({row.cumulativePercent.toFixed(1).replace('.', ',')}%)
                      </span>
                    </td>
                    <td className="py-2.5 px-5 text-right font-mono text-ink-secondary">
                      {formatRupiah(row.annualCashInBtn, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[540px]">
              <thead>
                <tr className="border-b border-hairline text-xs text-ink-secondary">
                  <th className="py-3 px-5 font-medium">No</th>
                  <th className="py-3 px-3 font-medium">Peserta kelompok</th>
                  <th className="py-3 px-3 font-medium">Periode</th>
                  <th className="py-3 px-5 font-medium">Status & Kartu NFC</th>
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
                      <td className="py-3 px-5 font-mono font-medium text-ink-secondary tabular-nums">
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
                      <td className="py-3 px-5">
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
    </div>
  );
};
