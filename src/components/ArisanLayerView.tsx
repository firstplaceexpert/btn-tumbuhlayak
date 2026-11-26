'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BtnHousingProject, DemoUser, NfcPropertyRecord } from '../types';
import { ARISAN_LOCATION_ZONES, OFFICIAL_REGULATION_SOURCES } from '../data/arisanLocations';
import { BTN_HOUSING_CATALOG, getProjectsByZone } from '../data/btnHousingCatalog';
import { NFC_PROPERTY_REGISTRY } from '../data/nfcPropertyRegistry';
import { findPropertyInRegistry } from '../lib/demoStore';
import {
  calculateDailyOneHouseModel,
  calculateDefaultRentalSimulation,
} from '../lib/dailyArisanEngine';
import { formatRupiah } from '../lib/formatters';
import { BtnLogo } from './BtnLogo';
import { AnimatedNumber } from './AnimatedNumber';
import { PropertyArisanCard } from './PropertyArisanCard';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Building2,
  Calculator,
  Calendar,
  CheckCircle2,
  Dices,
  ExternalLink,
  KeyRound,
  Lock,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Users,
  Wifi,
} from 'lucide-react';

interface ArisanLayerViewProps {
  user: DemoUser;
  nfcRegistry?: NfcPropertyRecord[];
  initialProjectId?: string;
  onGoToNfcScanner: () => void;
}

type ArisanSectionTab = 'katalog' | 'kalkulator' | 'aturan';

export const ArisanLayerView: React.FC<ArisanLayerViewProps> = ({
  user,
  nfcRegistry = NFC_PROPERTY_REGISTRY,
  initialProjectId,
  onGoToNfcScanner,
}) => {
  // Strictly locked to the customer's domicile zone from registration biodata
  const userDomicileZone =
    ARISAN_LOCATION_ZONES.find((z) => z.id === user.domicileZoneId) || ARISAN_LOCATION_ZONES[0];

  const zoneProjects = useMemo(
    () => getProjectsByZone(userDomicileZone.id),
    [userDomicileZone.id]
  );

  const [sectionTab, setSectionTab] = useState<ArisanSectionTab>('katalog');

  // Active selected BTN housing project within the user's domicile zone
  const defaultProject =
    zoneProjects.find((p) => p.id === (initialProjectId || user.selectedProjectId)) ||
    zoneProjects[0];

  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProject.id);
  const [registeredMap, setRegisteredMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    BTN_HOUSING_CATALOG.forEach((p) => {
      map[p.id] = p.registeredMembers;
    });
    return map;
  });
  const [joinedProjects, setJoinedProjects] = useState<Record<string, boolean>>({});

  // Interactive Calculator parameters (synced when user picks a project)
  const [calcHousePrice, setCalcHousePrice] = useState<number>(defaultProject.price);
  const [calcDailyContribution, setCalcDailyContribution] = useState<number>(
    defaultProject.dailyContribution
  );

  // Interactive Anti-Default / Rental Conversion Simulator (Tab 3)
  const [simWonMonth, setSimWonMonth] = useState<number>(2);
  const [simStopMonth, setSimStopMonth] = useState<number>(14);

  useEffect(() => {
    const nextProj =
      zoneProjects.find((p) => p.id === (initialProjectId || user.selectedProjectId)) ||
      zoneProjects[0];
    setSelectedProjectId(nextProj.id);
    setCalcHousePrice(nextProj.price);
    setCalcDailyContribution(nextProj.dailyContribution);
  }, [user.id, user.selectedProjectId, initialProjectId, zoneProjects]);

  const selectedProject: BtnHousingProject =
    zoneProjects.find((p) => p.id === selectedProjectId) || zoneProjects[0];

  const selectedRegistered =
    registeredMap[selectedProject.id] ?? selectedProject.registeredMembers;

  const projectModel = useMemo(
    () =>
      calculateDailyOneHouseModel(
        selectedProject.price,
        selectedProject.dailyContribution,
        selectedRegistered
      ),
    [selectedProject.price, selectedProject.dailyContribution, selectedRegistered]
  );

  const calcModel = useMemo(
    () =>
      calculateDailyOneHouseModel(
        calcHousePrice,
        calcDailyContribution,
        Math.min(Math.ceil(calcHousePrice / Math.max(10000, calcDailyContribution)), selectedRegistered)
      ),
    [calcHousePrice, calcDailyContribution, selectedRegistered]
  );

  const defaultRentalSim = useMemo(
    () =>
      calculateDefaultRentalSimulation(
        calcHousePrice,
        calcDailyContribution,
        simWonMonth,
        Math.max(simWonMonth + 1, simStopMonth)
      ),
    [calcHousePrice, calcDailyContribution, simWonMonth, simStopMonth]
  );

  // Participant's NFC card record & legal occupancy status
  const ownedRecord = user.assignedNfcUid
    ? findPropertyInRegistry(user.assignedNfcUid, nfcRegistry)
    : null;

  const isCardFrozen = ownedRecord?.occupancyStatus === 'dibekukan-tunggakan';
  const isShmReleased = ownedRecord?.occupancyStatus === 'lunas-shm';

  const userPaidDays =
    ownedRecord?.paidDays ?? user.paidDays ?? Math.max(30, user.paidMonths * 30);
  const totalRequiredDays = ownedRecord?.totalRequiredDays ?? projectModel.cycleDays;
  const memberPaymentPct = Math.min(
    100,
    Math.round((userPaidDays / Math.max(1, totalRequiredDays)) * 100)
  );
  const userTotalPaid = userPaidDays * (ownedRecord?.dailyContribution ?? selectedProject.dailyContribution);

  const handleSelectOrJoinProject = (project: BtnHousingProject) => {
    setSelectedProjectId(project.id);
    setCalcHousePrice(project.price);
    setCalcDailyContribution(project.dailyContribution);

    if (!joinedProjects[project.id]) {
      const targetQuota = Math.ceil(project.price / project.dailyContribution);
      setJoinedProjects((prev) => ({ ...prev, [project.id]: true }));
      setRegisteredMap((prev) => ({
        ...prev,
        [project.id]: Math.min(targetQuota, (prev[project.id] ?? project.registeredMembers) + 1),
      }));
    }
  };

  const handleSimulateFullProject = (project: BtnHousingProject) => {
    const targetQuota = Math.ceil(project.price / project.dailyContribution);
    setSelectedProjectId(project.id);
    setRegisteredMap((prev) => ({
      ...prev,
      [project.id]: targetQuota,
    }));
  };

  // Daily contribution comparison rows for Tab 2
  const contributionCompare = useMemo(
    () =>
      [25_000, 50_000, 75_000, 100_000].map((daily) => ({
        daily,
        model: calculateDailyOneHouseModel(calcHousePrice, daily, 0),
      })),
    [calcHousePrice]
  );

  return (
    <div className="space-y-8 animate-panel-enter">
      {/* Header + 3 Structured Sub-Tabs */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-6 border-b border-rule">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-positive-soft text-positive border border-positive-border">
              <MapPin className="w-3 h-3" aria-hidden="true" />
              Otomatis sesuai domisili: {user.domicileCity || userDomicileZone.shortLabel}
            </span>
            <span className="text-ink-secondary">
              · Hanya menampilkan proyek perumahan {userDomicileZone.regionName}
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-ink tracking-[-0.015em] leading-snug">
            Arisan rumah harian Bank BTN (1 rumah diundi setiap hari)
          </h1>
          <p className="text-[14px] text-ink-secondary leading-relaxed">
            Pilih proyek perumahan mitra BTN di wilayah domisili Anda. Kuota dihitung otomatis dari{' '}
            <strong className="text-ink">Harga Rumah ÷ Iuran Harian</strong> — saat kuota terpenuhi, 1 unit rumah diundi setiap hari dengan jaminan sertifikat SHM di Bank BTN.
          </p>
        </div>

        {/* 3 Clean Sub-Tabs */}
        <div
          className="inline-flex self-start xl:self-auto bg-well p-1 rounded-[12px] border border-hairline flex-wrap sm:flex-nowrap flex-shrink-0"
          role="tablist"
          aria-label="Bagian halaman Arisan Rumah Harian"
        >
          {(
            [
              { id: 'katalog', label: 'Katalog & Kuota Unit', icon: Building2 },
              { id: 'kalkulator', label: 'Kalkulator 1 Rumah/Hr', icon: Calculator },
              { id: 'aturan', label: 'Aturan Hak Huni & SHM', icon: Lock },
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
      {/* TAB 1: KATALOG PERUMAHAN DOMISILI & PROGRES KUOTA                     */}
      {/* ===================================================================== */}
      {sectionTab === 'katalog' && (
        <div className="space-y-8 animate-panel-enter">
          {/* Participant Status Card (Frozen Alert / Active NFC Winner / Waiting Member) */}
          {user.hasReceivedUnit && ownedRecord && isCardFrozen ? (
            <section
              aria-label="Status kartu kunci NFC dibekukan"
              className="rounded-card bg-btnred-soft border-2 border-btnred p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-btnred">
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                  <span>KARTU KUNCI NFC DIBEKUKAN · HAK HUNI DICABUT SEMENTARA</span>
                </div>
                <h2 className="font-display text-xl font-bold text-ink">
                  {ownedRecord.clusterName} · {ownedRecord.unitBlock} ({ownedRecord.uid})
                </h2>
                <p className="text-sm text-ink-secondary leading-relaxed">
                  {ownedRecord.freezeReason ||
                    'Terdeteksi tunggakan iuran arisan harian melebihi batas tenggang. Sesuai akad Sewa-Beli (Hak Huni) Bank BTN, akses Kartu Kunci NFC dibekukan, hak menempati unit dicabut, SHM tetap disimpan Bank BTN, dan setoran yang masuk diperhitungkan sebagai biaya sewa (rental).'}
                </p>
              </div>

              <button
                type="button"
                onClick={onGoToNfcScanner}
                className="h-10 px-5 rounded-control bg-btnred hover:bg-btnred-hover text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap flex-shrink-0"
              >
                <Lock className="w-4 h-4" aria-hidden="true" />
                <span>Cek Status Kartu NFC</span>
              </button>
            </section>
          ) : user.hasReceivedUnit && ownedRecord ? (
            <section
              aria-label="Status unit rumah dan kartu kunci NFC"
              className="rounded-card btn-kpi-surface text-white p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-2.5 max-w-xl">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                  <span className="inline-flex items-center gap-1.5 text-blue-100">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    Unit Rumah BTN Telah Diserahkan · Kartu Kunci NFC Aktif (Simulasi)
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      isShmReleased
                        ? 'bg-positive text-white'
                        : 'bg-ochre-gold text-ink'
                    }`}
                  >
                    {isShmReleased
                      ? 'Lunas 100% · SHM Penuh Terbit'
                      : 'Hak Huni Sewa-Beli · SHM Disimpan BTN'}
                  </span>
                </div>

                <h2 className="font-display text-xl font-bold text-white">
                  {ownedRecord.clusterName} · {ownedRecord.unitBlock} ({ownedRecord.houseTypeLabel})
                </h2>

                <p className="text-sm text-blue-100 leading-relaxed">
                  Gunakan kartu kunci NFC{' '}
                  <span className="font-mono font-semibold text-white bg-white/15 px-1.5 py-0.5 rounded">
                    {ownedRecord.uid}
                  </span>{' '}
                  untuk membuka editor denah rumah tumbuh.{' '}
                  {!isShmReleased &&
                    `Lanjutkan autodebet harian (${userPaidDays.toLocaleString('id-ID')} / ${totalRequiredDays.toLocaleString('id-ID')} hari · ${memberPaymentPct}%) untuk pelepasan SHM penuh.`}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 flex-shrink-0">
                <div className="px-4 py-3 rounded-[10px] bg-sheet text-ink min-w-[230px] flex items-center justify-between gap-3">
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
              aria-label="Progres iuran harian peserta"
              className="rounded-[18px] border border-hairline bg-gradient-to-r from-[#EEF4FD] via-[#FCFBF8] to-[#FEF7EA] p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              <div className="lg:col-span-7 space-y-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-secondary">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-brand">
                      <Users className="w-3.5 h-3.5" aria-hidden="true" />
                      Peserta {user.name} · Nomor Undian #{user.arisanSlotNumber}
                    </span>
                    <span>·</span>
                    <span>Target unit: {selectedProject.name}</span>
                  </div>
                  <h2 className="font-display text-lg font-bold text-ink">
                    Progres iuran harian menuju lunas &amp; pelepasan SHM
                  </h2>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="font-display text-lg font-bold text-ink tabular-nums">
                      <AnimatedNumber
                        value={userTotalPaid}
                        format={(n) => formatRupiah(Math.round(n))}
                      />
                      <span className="text-sm font-sans font-normal text-ink-secondary ml-2">
                        ({userPaidDays.toLocaleString('id-ID')} /{' '}
                        {projectModel.cycleDays.toLocaleString('id-ID')} hari setor)
                      </span>
                    </div>
                    <span className="font-mono text-sm font-semibold text-brand tabular-nums">
                      {memberPaymentPct}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-sheet border border-hairline rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand transition-[width] duration-500"
                      style={{ width: `${Math.max(4, memberPaymentPct)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-1">
                  {user.lotteryStatus === 'terpilih-akad' ? (
                    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-control bg-ochre-soft border border-ochre-border text-xs font-semibold text-ochre">
                      <Award className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                      <span>
                        Terpilih Pemenang Undian Harian oleh Admin BTN · menunggu pemrograman Kartu Kunci NFC
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-control bg-sheet border border-hairline text-xs text-ink-secondary">
                      <Calendar className="w-4 h-4 text-brand flex-shrink-0" aria-hidden="true" />
                      <span>
                        Undian 1 rumah setiap hari dilaksanakan oleh{' '}
                        <strong className="text-ink">Admin Operasional BTN</strong> begitu kuota proyek terpenuhi.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-[14px] bg-[#F6F4EF] border border-hairline p-2 shadow-[0_10px_24px_-16px_rgba(31,36,43,0.18)]">
                  <img
                    src="/illustrations/arisan-cluster-community.jpg"
                    alt="Ilustrasi komunitas peserta arisan harian rumah BTN"
                    className="w-full aspect-[4/3] object-cover rounded-[10px] block"
                  />
                </div>
              </div>
            </section>
          )}

          {/* 3 Crystal-Clear Formula Headline Cards for Selected Project */}
          <section
            aria-label="Ringkasan rumus arisan harian proyek terpilih"
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            <div className="p-5 rounded-card border border-hairline bg-sheet space-y-1.5">
              <div className="text-xs text-ink-secondary">
                Harga unit &amp; iuran harian ({selectedProject.name})
              </div>
              <div className="font-display text-2xl font-bold text-ink tabular-nums">
                {formatRupiah(selectedProject.dailyContribution)}
                <span className="text-sm font-sans font-normal text-ink-secondary"> / hari</span>
              </div>
              <p className="text-xs text-ink-secondary tabular-nums">
                Harga unit <strong className="text-brand">{formatRupiah(selectedProject.price)}</strong> · setara{' '}
                {formatRupiah(projectModel.monthlyEquivalent)}/bln selama{' '}
                <strong className="text-ink">
                  {projectModel.cycleYears.toFixed(1).replace('.', ',')} tahun
                </strong>
                .
              </p>
            </div>

            <div className="p-5 rounded-card border border-brand-border bg-brand-soft/45 space-y-1.5">
              <div className="text-xs text-brand font-medium">
                Kuota agar 1 rumah terbeli tiap hari
              </div>
              <div className="font-display text-2xl font-bold text-brand tabular-nums">
                {projectModel.requiredQuota.toLocaleString('id-ID')}
                <span className="text-sm font-sans font-normal text-ink-secondary"> orang</span>
              </div>
              <p className="text-xs text-ink-secondary tabular-nums">
                Dana masuk harian:{' '}
                <strong className="text-ink">{formatRupiah(projectModel.dailyPoolCollected)}/hari</strong>{' '}
                → langsung dibelikan &amp; diundi <strong>1 unit/hari</strong>.
              </p>
            </div>

            <div
              className={`p-5 rounded-card border space-y-1.5 ${
                projectModel.isReadyToStart
                  ? 'border-positive-border bg-positive-soft/50'
                  : 'border-btnred-border bg-btnred-soft/40'
              }`}
            >
              <div
                className={`text-xs font-medium ${
                  projectModel.isReadyToStart ? 'text-positive' : 'text-btnred'
                }`}
              >
                Status kuota berjalan (simulasi)
              </div>
              <div
                className={`font-display text-2xl font-bold tabular-nums ${
                  projectModel.isReadyToStart ? 'text-positive' : 'text-btnred'
                }`}
              >
                {projectModel.isReadyToStart
                  ? 'Siap Undian!'
                  : `Sisa ${projectModel.remainingSlots.toLocaleString('id-ID')} org`}
              </div>
              <p className="text-xs text-ink-secondary tabular-nums">
                Terdaftar{' '}
                <strong className="text-ink">
                  {projectModel.registeredMembers.toLocaleString('id-ID')} /{' '}
                  {projectModel.requiredQuota.toLocaleString('id-ID')}
                </strong>{' '}
                ({projectModel.quotaProgressPercent}%) untuk memulai undian harian.
              </p>
            </div>
          </section>

          {/* Domicile-Locked BTN Properti Housing Catalog Grid */}
          <section aria-label="Katalog proyek perumahan wilayah domisili Anda" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">
                  Perumahan mitra BTN wilayah {userDomicileZone.shortLabel} ({zoneProjects.length} proyek)
                </h2>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Klik salah satu kartu rumah di bawah untuk memilih target unit arisan, mendaftar ke kuota, atau simulasi kuota penuh 100%.
                </p>
              </div>
              <a
                href={OFFICIAL_REGULATION_SOURCES.kepmenPupr689Url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-brand hover:underline inline-flex items-center gap-1"
              >
                <span>Acuan Kepmen PUPR 689/2023</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {zoneProjects.map((project) => (
                <PropertyArisanCard
                  key={project.id}
                  project={project}
                  registeredOverride={registeredMap[project.id]}
                  isSelected={selectedProject.id === project.id}
                  isJoined={Boolean(joinedProjects[project.id])}
                  actionLabel={
                    selectedProject.id === project.id
                      ? 'Daftar Ikut Kuota Unit Ini'
                      : 'Pilih & Ikut Unit Ini'
                  }
                  onAction={handleSelectOrJoinProject}
                  onSimulateFull={handleSimulateFullProject}
                />
              ))}
            </div>
          </section>

          {/* Concise Anti-Default Reminder Strip */}
          <section className="rounded-[16px] border border-btnred-border bg-sheet p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3 max-w-3xl">
              <div className="w-9 h-9 rounded-[10px] bg-btnred-soft text-btnred flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-display font-bold text-ink">
                  Jaminan Keamanan Klaster: Skema Hak Huni (Sewa-Beli) &amp; Penahanan SHM BTN
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Pemenang undian harian langsung menempati unit menggunakan Kartu Kunci NFC, namun{' '}
                  <strong className="text-ink">SHM tetap ditahan BTN sampai iuran lunas 100%</strong>. Jika pemenang berhenti setor, Kartu NFC dibekukan, hak huni dicabut, dan setoran sebelumnya dihitung sebagai biaya sewa (rental).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSectionTab('aturan')}
              className="h-9 px-4 rounded-control border border-btnred-border bg-btnred-soft hover:bg-btnred hover:text-white text-btnred text-xs font-semibold transition-colors whitespace-nowrap self-start md:self-auto"
            >
              Lihat Simulasi Aturan →
            </button>
          </section>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: KALKULATOR INTERAKTIF ARISAN HARIAN (1 RUMAH / HARI)           */}
      {/* ===================================================================== */}
      {sectionTab === 'kalkulator' && (
        <div className="space-y-6 animate-panel-enter">
          <section className="rounded-[18px] border border-brand-border bg-sheet p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-4 border-b border-rule">
              <div>
                <span className="text-xs font-semibold text-brand uppercase tracking-wide">
                  Simulasi Rumus Transparan
                </span>
                <h2 className="font-display text-lg font-bold text-ink mt-0.5">
                  Kalkulator Arisan Harian: Harga Rumah ÷ Iuran/Hari = Kuota Peserta
                </h2>
              </div>

              {/* Quick Project Price Presets */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Contoh Rp 170 Jt', price: 170_000_000, daily: 50_000 },
                  { label: 'Grand Harmoni Rp 185 Jt', price: 185_000_000, daily: 50_000 },
                  { label: 'Keandra Park Rp 168 Jt', price: 168_000_000, daily: 50_000 },
                  { label: 'Komersial Rp 250 Jt', price: 250_000_000, daily: 50_000 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setCalcHousePrice(preset.price);
                      setCalcDailyContribution(preset.daily);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      calcHousePrice === preset.price && calcDailyContribution === preset.daily
                        ? 'bg-brand text-white border-brand'
                        : 'bg-well text-ink-secondary border-hairline hover:text-ink'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Sliders */}
              <div className="lg:col-span-6 space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="calc-price" className="font-semibold text-ink">
                      Harga Unit Rumah Mitra BTN
                    </label>
                    <span className="font-mono text-sm font-bold text-brand tabular-nums">
                      {formatRupiah(calcHousePrice)}
                    </span>
                  </div>
                  <input
                    id="calc-price"
                    type="range"
                    min={150_000_000}
                    max={350_000_000}
                    step={2_000_000}
                    value={calcHousePrice}
                    onChange={(e) => setCalcHousePrice(Number(e.target.value))}
                    className="w-full accent-[#1B56C6]"
                  />
                  <div className="flex justify-between text-[11px] text-ink-subtle tabular-nums">
                    <span>Rp 150 Jt</span>
                    <span>Rp 170 Jt</span>
                    <span>Rp 240 Jt</span>
                    <span>Rp 350 Jt</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="calc-daily" className="font-semibold text-ink">
                      Iuran Harian per Peserta
                    </label>
                    <span className="font-mono text-sm font-bold text-brand tabular-nums">
                      {formatRupiah(calcDailyContribution)} / hari
                    </span>
                  </div>
                  <input
                    id="calc-daily"
                    type="range"
                    min={20_000}
                    max={100_000}
                    step={5_000}
                    value={calcDailyContribution}
                    onChange={(e) => setCalcDailyContribution(Number(e.target.value))}
                    className="w-full accent-[#1B56C6]"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[25_000, 50_000, 75_000, 100_000].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setCalcDailyContribution(v)}
                        className={`px-2.5 py-1 rounded-control text-xs font-mono font-semibold border transition-colors ${
                          calcDailyContribution === v
                            ? 'bg-brand-soft text-brand border-brand-border'
                            : 'bg-well text-ink-secondary border-hairline hover:text-ink'
                        }`}
                      >
                        Rp {(v / 1000).toLocaleString('id-ID')}rb/hr
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Live Formula Result Box */}
              <div className="lg:col-span-6 p-5 rounded-[14px] btn-kpi-surface text-white space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-blue-100">
                  Hasil Perhitungan Arisan 1 Rumah / Hari
                </div>

                <div className="p-3.5 rounded-[10px] bg-white/10 border border-white/15 font-mono text-xs sm:text-sm text-white tabular-nums">
                  {formatRupiah(calcModel.housePrice)} ÷ {formatRupiah(calcModel.dailyContribution)}/hr ={' '}
                  <strong className="text-ochre-gold">
                    {calcModel.requiredQuota.toLocaleString('id-ID')} peserta
                  </strong>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-[10px] bg-white/10">
                    <div className="text-blue-100">Kuota dibutuhkan</div>
                    <div className="font-display text-lg font-bold text-white tabular-nums mt-0.5">
                      {calcModel.requiredQuota.toLocaleString('id-ID')} orang
                    </div>
                  </div>
                  <div className="p-3 rounded-[10px] bg-white/10">
                    <div className="text-blue-100">Lama siklus lunas</div>
                    <div className="font-display text-lg font-bold text-ochre-gold tabular-nums mt-0.5">
                      {calcModel.cycleYears.toFixed(1).replace('.', ',')} tahun
                    </div>
                  </div>
                  <div className="p-3 rounded-[10px] bg-white/10">
                    <div className="text-blue-100">Dana masuk / hari</div>
                    <div className="font-display text-base font-bold text-white tabular-nums mt-0.5">
                      {formatRupiah(calcModel.dailyPoolCollected, true)}
                    </div>
                  </div>
                  <div className="p-3 rounded-[10px] bg-white/10">
                    <div className="text-blue-100">Pemenang undian</div>
                    <div className="font-display text-base font-bold text-white mt-0.5">
                      1 rumah / hari
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Yearly Cumulative Delivery Bar Chart + Comparison Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-7 p-6 rounded-card border border-hairline bg-sheet space-y-4">
              <div>
                <h3 className="font-display text-base font-bold text-ink">
                  Proyeksi penyerahan unit rumah per tahun (365 unit/tahun)
                </h3>
                <p className="text-xs text-ink-secondary">
                  Karena 1 unit rumah diundi setiap hari, dalam 1 tahun 365 keluarga sudah menempati rumah BTN.
                </p>
              </div>

              <div className="space-y-2.5">
                {calcModel.yearlyMilestones.map((m) => (
                  <div key={m.year} className="space-y-1">
                    <div className="flex items-center justify-between text-xs tabular-nums">
                      <span className="font-semibold text-ink">
                        {m.yearLabel} ({m.cumulativeUnits.toLocaleString('id-ID')} rumah terserahkan)
                      </span>
                      <span className="font-mono font-semibold text-brand">
                        {m.cumulativePercent}% · setor {formatRupiah(m.memberPaidCumulative, true)}
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-well rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand transition-[width] duration-300"
                        style={{ width: `${m.cumulativePercent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="lg:col-span-5 p-6 rounded-card border border-hairline bg-sheet space-y-4">
              <div>
                <h3 className="font-display text-base font-bold text-ink">
                  Perbandingan nominal iuran harian
                </h3>
                <p className="text-xs text-ink-secondary">
                  Semakin besar iuran harian, semakin kecil kuota peserta dan semakin cepat siklus lunas untuk harga{' '}
                  <strong>{formatRupiah(calcHousePrice, true)}</strong>.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-hairline text-ink-secondary">
                      <th className="py-2 pr-2 font-medium">Iuran / Hr</th>
                      <th className="py-2 px-2 font-medium text-right">Kuota</th>
                      <th className="py-2 pl-2 font-medium text-right">Durasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule tabular-nums">
                    {contributionCompare.map(({ daily, model }) => {
                      const active = daily === calcDailyContribution;
                      return (
                        <tr
                          key={daily}
                          className={active ? 'bg-brand-soft/60 font-semibold text-brand' : 'text-ink'}
                        >
                          <td className="py-2.5 pr-2 font-mono">{formatRupiah(daily)}</td>
                          <td className="py-2.5 px-2 text-right font-mono">
                            {model.requiredQuota.toLocaleString('id-ID')} org
                          </td>
                          <td className="py-2.5 pl-2 text-right font-mono">
                            {model.cycleYears.toFixed(1).replace('.', ',')} thn
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: ATURAN HAK HUNI (RENTAL), PENAHANAN SHM & SIMULASI ANTI-MANGKIR */}
      {/* ===================================================================== */}
      {sectionTab === 'aturan' && (
        <div className="space-y-6 animate-panel-enter">
          {/* 4-Step Legal Lifecycle */}
          <section className="rounded-[18px] border border-hairline bg-sheet p-6 space-y-5">
            <div>
              <span className="text-xs font-semibold text-btnred uppercase tracking-wide">
                Skema Hukum &amp; Pengamanan Dana Klaster
              </span>
              <h2 className="font-display text-lg font-bold text-ink mt-0.5">
                Mengapa pemenang hari pertama tidak bisa kabur / berhenti bayar?
              </h2>
              <p className="text-xs text-ink-secondary mt-1 max-w-3xl leading-relaxed">
                Bank BTN menerapkan mekanisme <strong>Hak Huni Sewa-Beli (Rent-to-Own)</strong> yang dikunci secara fisik dan hukum lewat <strong>penahanan sertifikat SHM/SHGB oleh Bank BTN</strong> serta <strong>Kartu Kunci Pintar NFC BTN</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  step: 'Tahap 1',
                  title: 'Menang Undian Harian',
                  desc: 'Admin BTN mengundi 1 pemenang/hari dan memprogram Kartu Kunci NFC berstatus "Hak Huni Aktif".',
                  icon: Dices,
                  tone: 'bg-brand-soft text-brand',
                },
                {
                  step: 'Tahap 2',
                  title: 'SHM Disimpan Bank BTN',
                  desc: 'Pemenang boleh langsung menempati rumah, tetapi sertifikat SHM/SHGB tetap disimpan Bank BTN sampai lunas 100%.',
                  icon: ShieldCheck,
                  tone: 'bg-ochre-soft text-ochre',
                },
                {
                  step: 'Tahap 3',
                  title: 'Sanksi Jika Berhenti Bayar',
                  desc: 'Jika menunggak, Admin BTN membekukan Kartu NFC, mencabut hak huni, dan mengonversi setoran menjadi biaya sewa (rental).',
                  icon: Lock,
                  tone: 'bg-btnred-soft text-btnred',
                },
                {
                  step: 'Tahap 4',
                  title: 'Lunas 100% → Serah SHM',
                  desc: 'Begitu seluruh iuran harian lunas (atau pelunasan dipercepat), Bank BTN menyerahkan sertifikat SHM penuh atas nama peserta.',
                  icon: KeyRound,
                  tone: 'bg-positive-soft text-positive',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="p-4 rounded-[14px] bg-well border border-hairline space-y-2">
                    <div className={`w-8 h-8 rounded-[9px] flex items-center justify-center ${item.tone}`}>
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="text-[11px] font-bold text-ink-subtle uppercase">{item.step}</div>
                    <div className="font-display text-sm font-bold text-ink">{item.title}</div>
                    <p className="text-xs text-ink-secondary leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Interactive Rental-Conversion Anti-Default Simulator */}
          <section className="rounded-[18px] border border-btnred-border bg-sheet p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-btnred-soft text-btnred text-xs font-semibold">
                <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                Simulasi Kasus Gagal Bayar (Skema Sewa/Rental)
              </div>
              <h3 className="font-display text-base font-bold text-ink">
                Uji skenario jika pemenang awal berhenti membayar iuran harian
              </h3>

              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <label htmlFor="sim-won-month" className="font-medium text-ink">
                      Menang undian di bulan ke-
                    </label>
                    <strong className="font-mono text-brand">Bulan {simWonMonth}</strong>
                  </div>
                  <input
                    id="sim-won-month"
                    type="range"
                    min={1}
                    max={24}
                    value={simWonMonth}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSimWonMonth(val);
                      if (simStopMonth <= val) setSimStopMonth(val + 6);
                    }}
                    className="w-full accent-[#1B56C6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <label htmlFor="sim-stop-month" className="font-medium text-ink">
                      Berhenti bayar iuran di bulan ke-
                    </label>
                    <strong className="font-mono text-btnred">Bulan {simStopMonth}</strong>
                  </div>
                  <input
                    id="sim-stop-month"
                    type="range"
                    min={simWonMonth + 1}
                    max={60}
                    value={simStopMonth}
                    onChange={(e) => setSimStopMonth(Number(e.target.value))}
                    className="w-full accent-[#C4252E]"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 p-5 rounded-[14px] bg-well border border-hairline space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-rule">
                <span className="text-xs font-bold text-btnred uppercase">
                  Keputusan Sistem &amp; Admin Bank BTN
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-btnred text-white text-[11px] font-semibold">
                  Kartu NFC Dibekukan · Hak Huni Dicabut
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs tabular-nums">
                <div className="p-3 rounded-control bg-sheet border border-hairline">
                  <div className="text-ink-secondary">Durasi unit ditempati</div>
                  <div className="font-display text-base font-bold text-ink mt-0.5">
                    {defaultRentalSim.monthsOccupied} bulan
                  </div>
                </div>
                <div className="p-3 rounded-control bg-sheet border border-btnred-border">
                  <div className="text-btnred font-medium">Dikonversi menjadi biaya sewa (rental)</div>
                  <div className="font-display text-base font-bold text-btnred mt-0.5">
                    {formatRupiah(defaultRentalSim.convertedRentalAmount)}
                  </div>
                </div>
                <div className="p-3 rounded-control bg-sheet border border-hairline">
                  <div className="text-ink-secondary">Status Sertifikat SHM / SHGB</div>
                  <div className="font-semibold text-positive mt-0.5">
                    Tetap disimpan Bank BTN (tidak beralih)
                  </div>
                </div>
                <div className="p-3 rounded-control bg-sheet border border-hairline">
                  <div className="text-ink-secondary">Tindak lanjut unit rumah</div>
                  <div className="font-semibold text-brand mt-0.5">
                    Dialihkan ke peserta pengganti klaster
                  </div>
                </div>
              </div>

              <p className="text-xs text-ink-secondary leading-relaxed">
                Dengan skema ini, peserta yang mangkir setelah menerima unit awal <strong>tidak diuntungkan sama sekali</strong>: hak huni gugur, SHM tidak pernah berpindah, dan setoran selama tinggal berfungsi layaknya <strong>uang sewa rumah (rental)</strong>. Dana {projectModel.requiredQuota.toLocaleString('id-ID')} peserta lainnya tetap terlindungi penuh.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
