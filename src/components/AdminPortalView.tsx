'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AdminAuditLog,
  BuildingCondition,
  DemoUser,
  NfcPropertyRecord,
  OccupancyLegalStatus,
} from '../types';
import { ARISAN_LOCATION_ZONES } from '../data/arisanLocations';
import { BTN_HOUSING_CATALOG, getProjectsByZone } from '../data/btnHousingCatalog';
import { HOUSE_TEMPLATES } from '../data/floorplanPresets';
import { formatRupiah } from '../lib/formatters';
import { nfcUidSchema, sanitizeString } from '../lib/validation';
import { generateBtnNfcUid } from '../lib/demoStore';
import { BtnLogo } from './BtnLogo';
import { AnimatedNumber } from './AnimatedNumber';
import {
  Award,
  Building2,
  CheckCircle2,
  Cpu,
  Dices,
  History,
  KeyRound,
  Lock,
  MapPin,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Unlock,
  Users,
  Wifi,
  AlertCircle,
  ArrowRight,
  Edit3,
} from 'lucide-react';

interface AdminPortalViewProps {
  adminUser: DemoUser;
  users: DemoUser[];
  nfcRegistry: NfcPropertyRecord[];
  auditLogs: AdminAuditLog[];
  onSelectWinner: (userId: string, method: 'undian-acak' | 'penetapan-manual') => void;
  onProgramNfcCard: (userId: string, record: NfcPropertyRecord) => void;
  onUpdateNfcOccupancyStatus: (
    uid: string,
    status: OccupancyLegalStatus,
    reason?: string
  ) => void;
  onResetDemoData: () => void;
}

type AdminTab = 'undian' | 'program-nfc' | 'riwayat';

const READINESS_THRESHOLD = 15000000;

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  adminUser,
  users,
  nfcRegistry,
  auditLogs,
  onSelectWinner,
  onProgramNfcCard,
  onUpdateNfcOccupancyStatus,
  onResetDemoData,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('undian');

  // Tab 1: Lottery & Manual Assignment state
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [onlyReadyCandidates, setOnlyReadyCandidates] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [rouletteName, setRouletteName] = useState<string>('');
  const [recentWinnerId, setRecentWinnerId] = useState<string | null>(null);
  const spinTimerRef = useRef<number | null>(null);

  // Tab 2: NFC Card Programmer state
  const customers = useMemo(() => users.filter((u) => u.role !== 'admin'), [users]);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>(BTN_HOUSING_CATALOG[0].id);
  const [nfcUid, setNfcUid] = useState<string>('');
  const [certificateNo, setCertificateNo] = useState<string>('');
  const [clusterName, setClusterName] = useState<string>('');
  const [unitBlock, setUnitBlock] = useState<string>('Blok C-12');
  const [templateId, setTemplateId] = useState<string>('tipe-36-60');
  const [lokasiKota, setLokasiKota] = useState<string>('');
  const [tahunDibangun, setTahunDibangun] = useState<number>(2025);
  const [kondisiBangunan, setKondisiBangunan] = useState<BuildingCondition>('prima');
  const [nilaiAwal, setNilaiAwal] = useState<number>(185000000);
  const [occupancyStatus, setOccupancyStatus] = useState<OccupancyLegalStatus>('hak-huni-aktif');
  const [programError, setProgramError] = useState<string>('');
  const [programStatus, setProgramStatus] = useState<'idle' | 'writing' | 'success'>('idle');
  const [programMessage, setProgramMessage] = useState<string>('');
  const [hasWebNfc, setHasWebNfc] = useState<boolean>(false);

  useEffect(() => {
    setHasWebNfc(typeof window !== 'undefined' && 'NDEFReader' in window);
    return () => {
      if (spinTimerRef.current) window.clearInterval(spinTimerRef.current);
    };
  }, []);

  const getZoneLabel = (zoneId?: string) =>
    ARISAN_LOCATION_ZONES.find((z) => z.id === zoneId)?.shortLabel || 'Jawa';

  const getUserBalance = (u: DemoUser) => u.paidMonths * u.monthlyContribution;

  const getEffectiveStatus = (u: DemoUser) => {
    if (u.hasReceivedUnit && u.assignedNfcUid) return 'kartu-aktif' as const;
    if (u.lotteryStatus === 'terpilih-akad') return 'terpilih-akad' as const;
    return 'menunggu' as const;
  };

  // Summary counts
  const waitingCount = customers.filter((u) => getEffectiveStatus(u) === 'menunggu').length;
  const readyToProgramCount = customers.filter(
    (u) => getEffectiveStatus(u) === 'terpilih-akad'
  ).length;
  const activeCardCount = nfcRegistry.length;

  const filteredCustomers = useMemo(() => {
    return customers.filter((u) => {
      if (zoneFilter !== 'all' && u.domicileZoneId !== zoneFilter) return false;
      return true;
    });
  }, [customers, zoneFilter]);

  const eligibleForDraw = useMemo(() => {
    return filteredCustomers.filter((u) => {
      if (getEffectiveStatus(u) !== 'menunggu') return false;
      if (onlyReadyCandidates && getUserBalance(u) < READINESS_THRESHOLD) return false;
      return true;
    });
  }, [filteredCustomers, onlyReadyCandidates]);

  const recentWinner = useMemo(
    () => customers.find((u) => u.id === recentWinnerId) || null,
    [customers, recentWinnerId]
  );

  // Hydrate NFC programmer fields cleanly without forcing a tab switch
  const hydrateProgrammerForUser = (userObj: DemoUser) => {
    setTargetUserId(userObj.id);
    setProgramError('');
    setProgramStatus('idle');
    setProgramMessage('');

    const existingCard = userObj.assignedNfcUid
      ? nfcRegistry.find((r) => r.uid.toUpperCase() === userObj.assignedNfcUid?.toUpperCase())
      : undefined;

    if (existingCard) {
      setProjectId(existingCard.projectId || BTN_HOUSING_CATALOG[0].id);
      setNfcUid(existingCard.uid);
      setCertificateNo(existingCard.certificateNo);
      setClusterName(existingCard.clusterName);
      setUnitBlock(existingCard.unitBlock);
      setTemplateId(existingCard.templateId);
      setLokasiKota(existingCard.lokasiKota);
      setTahunDibangun(existingCard.tahunDibangun);
      setKondisiBangunan(existingCard.kondisiBangunan);
      setNilaiAwal(existingCard.nilaiSerahTerimaAwal);
      setOccupancyStatus(existingCard.occupancyStatus || 'hak-huni-aktif');
      return;
    }

    const zone =
      ARISAN_LOCATION_ZONES.find((z) => z.id === userObj.domicileZoneId) ||
      ARISAN_LOCATION_ZONES[0];
    const zoneProjs = getProjectsByZone(zone.id);
    const preferredProj =
      zoneProjs.find((p) => p.id === userObj.selectedProjectId) || zoneProjs[0];
    const defaultTplId = preferredProj?.templateId || 'tipe-36-60';
    const nextUid = generateBtnNfcUid(defaultTplId, nfcRegistry);
    const seq = nextUid.split('-').pop() || '0101';

    setProjectId(preferredProj?.id || BTN_HOUSING_CATALOG[0].id);
    setTemplateId(defaultTplId);
    setNfcUid(nextUid);
    setCertificateNo(`SHGB-BTN-${zone.shortLabel.slice(0, 3).toUpperCase()}-${seq}`);
    setClusterName(preferredProj?.name || `BTN Griya ${zone.shortLabel}`);
    setUnitBlock(`Blok C-${seq.slice(-2)}`);
    setLokasiKota(preferredProj?.city || userObj.domicileCity || zone.sampleCities.split(',')[0]);
    setTahunDibangun(2025);
    setKondisiBangunan('prima');
    setNilaiAwal(preferredProj?.price || zone.officialFlppPrice);
    setOccupancyStatus('hak-huni-aktif');
  };

  // Explicit click from Tab 1 / Winner Card: hydrate AND open Tab 2
  const openProgrammerForUser = (userObj: DemoUser) => {
    hydrateProgrammerForUser(userObj);
    setActiveTab('program-nfc');
  };

  // Pick initial target user for Tab 2 quietly in background (keep Tab 1 active on entry!)
  useEffect(() => {
    if (!targetUserId && customers.length > 0) {
      const preferred =
        customers.find((u) => getEffectiveStatus(u) === 'terpilih-akad') ||
        customers.find((u) => getEffectiveStatus(u) === 'menunggu') ||
        customers[0];
      if (preferred) {
        hydrateProgrammerForUser(preferred);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers.length]);

  const handleRunRandomDraw = () => {
    if (isSpinning || eligibleForDraw.length === 0) return;
    setIsSpinning(true);
    setRecentWinnerId(null);

    // Cryptographically fair index selection
    let chosenIdx = 0;
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      const arr = new Uint32Array(1);
      window.crypto.getRandomValues(arr);
      chosenIdx = arr[0] % eligibleForDraw.length;
    } else {
      chosenIdx = Math.floor(Math.random() * eligibleForDraw.length);
    }
    const winner = eligibleForDraw[chosenIdx];

    let tick = 0;
    const totalTicks = 14;
    if (spinTimerRef.current) window.clearInterval(spinTimerRef.current);

    spinTimerRef.current = window.setInterval(() => {
      tick += 1;
      const preview = eligibleForDraw[tick % eligibleForDraw.length];
      setRouletteName(preview.name);

      if (tick >= totalTicks) {
        if (spinTimerRef.current) window.clearInterval(spinTimerRef.current);
        spinTimerRef.current = null;
        setRouletteName(winner.name);
        setIsSpinning(false);
        setRecentWinnerId(winner.id);
        onSelectWinner(winner.id, 'undian-acak');
      }
    }, 85);
  };

  const handleManualAssign = (userId: string) => {
    setRecentWinnerId(userId);
    onSelectWinner(userId, 'penetapan-manual');
  };

  const selectedTemplate =
    HOUSE_TEMPLATES.find((t) => t.id === templateId) || HOUSE_TEMPLATES[0];
  const selectedTargetUser =
    customers.find((u) => u.id === targetUserId) || customers[0] || null;

  const handleProjectSelect = (nextProjectId: string) => {
    setProjectId(nextProjectId);
    const proj = BTN_HOUSING_CATALOG.find((p) => p.id === nextProjectId);
    if (!proj) return;
    setClusterName(proj.name);
    setLokasiKota(proj.city);
    setTemplateId(proj.templateId);
    setNilaiAwal(proj.price);
    if (!selectedTargetUser?.assignedNfcUid) {
      setNfcUid(generateBtnNfcUid(proj.templateId, nfcRegistry));
    }
  };

  const handleTemplateSelect = (nextTplId: string) => {
    setTemplateId(nextTplId);
    const tpl = HOUSE_TEMPLATES.find((t) => t.id === nextTplId);
    if (!tpl) return;
    setNilaiAwal(tpl.nilaiAwalProperti);
    // Regenerate UID prefix to match house type if not already an existing active card
    if (!selectedTargetUser?.assignedNfcUid) {
      setNfcUid(generateBtnNfcUid(nextTplId, nfcRegistry));
    }
  };

  const handleProgramCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProgramError('');
    setProgramMessage('');

    if (!selectedTargetUser) {
      setProgramError('Pilih peserta penerima unit terlebih dahulu.');
      return;
    }

    const uidParsed = nfcUidSchema.safeParse(nfcUid);
    if (!uidParsed.success) {
      setProgramError(uidParsed.error.issues[0]?.message || 'Format UID NFC tidak valid.');
      return;
    }

    const cleanCert = sanitizeString(certificateNo, 40);
    const cleanCluster = sanitizeString(clusterName, 70);
    const cleanBlock = sanitizeString(unitBlock, 30);
    const cleanCity = sanitizeString(lokasiKota, 80);

    if (cleanCert.length < 4 || cleanCluster.length < 3 || cleanBlock.length < 2) {
      setProgramError('Nomor sertifikat, nama klaster, dan blok unit wajib diisi lengkap.');
      return;
    }

    setProgramStatus('writing');
    const finalUid = uidParsed.data;

    // Optional physical Web NFC NDEF write on Android Chrome if supported
    let physicalWriteNote = 'Simulasi enkripsi chip NFC berhasil ditulis ke registri lokal BTN.';
    if (hasWebNfc) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ReaderCtor = (window as any).NDEFReader;
        const ndef = new ReaderCtor();
        await ndef.write({
          records: [{ recordType: 'text', data: finalUid }],
        });
        physicalWriteNote = `Berhasil menulis UID ${finalUid} ke chip NFC fisik melalui Web NFC.`;
      } catch {
        physicalWriteNote = `Chip fisik tidak terdeteksi — UID ${finalUid} tetap diterbitkan ke registri simulasi BTN.`;
      }
    }

    const currentYear = new Date().getFullYear();
    const ageYears = Math.max(0, Math.min(35, currentYear - tahunDibangun));
    const todayStr = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    const matchedProj = BTN_HOUSING_CATALOG.find((p) => p.id === projectId);
    const dailyAmt = matchedProj?.dailyContribution ?? 50000;
    const safePrice = Math.max(50000000, nilaiAwal);
    const totalReqDays = Math.ceil(safePrice / dailyAmt);

    const newRecord: NfcPropertyRecord = {
      uid: finalUid,
      certificateNo: cleanCert,
      clusterName: cleanCluster,
      unitBlock: cleanBlock,
      ownerName: selectedTargetUser.name,
      lokasiKota: cleanCity || selectedTargetUser.domicileCity || 'Indonesia',
      templateId: selectedTemplate.id,
      houseTypeLabel: `${selectedTemplate.shortLabel} (${selectedTemplate.programBadge})`,
      luasTanah: selectedTemplate.luasTanah,
      luasBangunanEksisting: selectedTemplate.luasBangunanEksisting,
      nilaiSerahTerimaAwal: safePrice,
      tahunDibangun,
      usiaBangunanTahun: ageYears,
      umurEkonomisTahun: 30,
      porsiNilaiTanah: 0.55,
      kondisiBangunan,
      arisanBatchLabel: `Arisan Harian ${cleanCluster} · Pemenang Hari #${selectedTargetUser.arisanSlotNumber}`,
      handoverDate: todayStr,
      projectId: matchedProj?.id,
      occupancyStatus,
      dailyContribution: dailyAmt,
      paidDays:
        occupancyStatus === 'lunas-shm'
          ? totalReqDays
          : selectedTargetUser.paidDays ?? Math.max(30, selectedTargetUser.paidMonths * 30),
      totalRequiredDays: totalReqDays,
      freezeReason:
        occupancyStatus === 'dibekukan-tunggakan'
          ? 'Kartu NFC dibekukan Admin BTN akibat tunggakan iuran harian (Hak Huni dicabut · skema sewa/rental).'
          : undefined,
    };

    window.setTimeout(() => {
      onProgramNfcCard(selectedTargetUser.id, newRecord);
      setProgramStatus('success');
      setProgramMessage(
        `${physicalWriteNote} Akun ${selectedTargetUser.name} kini dapat langsung memindai ${finalUid} pada menu Scan Kartu.`
      );
    }, 450);
  };

  return (
    <div className="space-y-8 animate-panel-enter">
      {/* Warm Illustrated Admin Header Banner */}
      <section className="rounded-[20px] border border-hairline bg-gradient-to-r from-[#EEF4FD] via-[#FCFBF8] to-[#FEF7EA] p-6 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8 space-y-3">
          <div className="inline-flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-btnred text-white">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              Portal Operasional Admin BTN
            </span>
            <span className="px-2.5 py-1 rounded-full bg-sheet border border-hairline text-ink-secondary">
              {adminUser.name} · Simulasi lokal terhubung antar akun
            </span>
          </div>

          <h1 className="font-display text-2xl font-bold text-ink tracking-[-0.015em] leading-snug">
            Kendali undian arisan & pemrograman Kartu Kunci NFC BTN
          </h1>
          <p className="text-sm text-ink-secondary leading-relaxed max-w-2xl">
            Tentukan pemenang arisan melalui undian acak transparan atau penetapan antrean kesiapan akad, lalu program data sertifikat dan denah rumah ke Kartu Kunci Pintar NFC agar langsung aktif di akun nasabah.
          </p>

          {/* 3 Focused Sub-Tabs */}
          <div
            className="inline-flex bg-sheet p-1 rounded-[12px] border border-hairline flex-wrap sm:flex-nowrap pt-1"
            role="tablist"
            aria-label="Menu operasional Admin BTN"
          >
            {(
              [
                { id: 'undian', label: 'Undian & Akad Arisan', icon: Dices },
                {
                  id: 'program-nfc',
                  label: `Program Kartu NFC${readyToProgramCount > 0 ? ` (${readyToProgramCount})` : ''}`,
                  icon: Cpu,
                },
                { id: 'riwayat', label: 'Daftar Unit & Riwayat', icon: History },
              ] as const
            ).map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(t.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] text-[13px] font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-brand text-white font-semibold'
                      : 'text-ink-secondary hover:text-ink'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="rounded-[14px] bg-[#F6F4EF] border border-hairline p-2 shadow-[0_10px_24px_-16px_rgba(31,36,43,0.18)]">
            <img
              src="/illustrations/admin-btn-console.jpg"
              alt="Ilustrasi petugas operasional Bank BTN memprogram kartu kunci pintar NFC dan mengelola undian"
              className="w-full aspect-[4/3] object-cover rounded-[10px] block"
            />
          </div>
        </div>
      </section>

      {/* 3 Calm Summary Cards */}
      <section aria-label="Ringkasan status operasional klaster" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-card border border-hairline bg-sheet space-y-1">
          <div className="text-xs text-ink-secondary">Peserta menunggu undian / akad</div>
          <div className="font-display text-2xl font-bold text-ink tabular-nums">
            <AnimatedNumber value={waitingCount} format={(n) => `${Math.round(n)} peserta`} />
          </div>
          <div className="text-xs text-ink-secondary">Tersebar di seluruh wilayah domisili terdaftar</div>
        </div>

        <div className="p-5 rounded-card border border-ochre-border bg-ochre-soft/50 space-y-1">
          <div className="text-xs text-ochre font-medium">Terpilih akad · siap program NFC</div>
          <div className="font-display text-2xl font-bold text-ochre tabular-nums">
            <AnimatedNumber value={readyToProgramCount} format={(n) => `${Math.round(n)} nasabah`} />
          </div>
          <div className="text-xs text-ink-secondary">Menunggu petugas memprogram chip kartu rumah</div>
        </div>

        <div className="p-5 rounded-card border border-positive-border bg-positive-soft/50 space-y-1">
          <div className="text-xs text-positive font-medium">Kartu Kunci NFC aktif terbit</div>
          <div className="font-display text-2xl font-bold text-positive tabular-nums">
            <AnimatedNumber value={activeCardCount} format={(n) => `${Math.round(n)} unit`} />
          </div>
          <div className="text-xs text-ink-secondary">Siap dipindai nasabah untuk membuka denah rumah</div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* TAB 1: UNDIAN ACAK & PENETAPAN MANUAL AKAD ARISAN                     */}
      {/* ===================================================================== */}
      {activeTab === 'undian' && (
        <div className="space-y-6 animate-panel-enter">
          {/* Interactive Fair Random Draw Box */}
          <section
            aria-label="Mesin undian arisan transparan"
            className="rounded-[18px] border border-brand-border bg-sheet p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
          >
            <div className="lg:col-span-7 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-soft text-brand text-xs font-semibold">
                  <Dices className="w-3.5 h-3.5" aria-hidden="true" />
                  Undian Acak Transparan
                </span>
                <span className="text-xs text-ink-secondary tabular-nums">
                  {eligibleForDraw.length} kandidat memenuhi filter
                </span>
              </div>

              <h2 className="font-display text-lg font-bold text-ink">
                Putar undian pemenang periode ini
              </h2>
              <p className="text-[13px] text-ink-secondary leading-relaxed">
                Sistem mengundi secara acak dari daftar peserta yang belum menerima unit. Anda juga dapat memprioritaskan peserta yang saldonya sudah mencapai ambang kesiapan akad ({formatRupiah(READINESS_THRESHOLD, true)}).
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <select
                  aria-label="Filter wilayah undian"
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                  className="h-10 px-3 rounded-control border border-control bg-sheet text-xs font-medium text-ink focus:border-brand focus:outline-none"
                >
                  <option value="all">Semua wilayah ({customers.length} peserta)</option>
                  {ARISAN_LOCATION_ZONES.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.shortLabel}
                    </option>
                  ))}
                </select>

                <label className="inline-flex items-center gap-2 text-xs text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyReadyCandidates}
                    onChange={(e) => setOnlyReadyCandidates(e.target.checked)}
                    className="rounded border-control text-brand focus:ring-brand"
                  />
                  <span>Hanya yang siap akad (saldo ≥ Rp 15 Jt)</span>
                </label>
              </div>
            </div>

            {/* Right Roulette Display & Trigger Button */}
            <div className="lg:col-span-5 p-5 rounded-[14px] bg-well border border-hairline text-center space-y-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
                {isSpinning
                  ? 'Mengundi kandidat secara acak...'
                  : recentWinner
                  ? 'Pemenang Terpilih'
                  : 'Hasil Undian'}
              </div>

              <div
                className={`min-h-[56px] px-4 py-3 rounded-[10px] border flex flex-col items-center justify-center transition-colors ${
                  recentWinner && !isSpinning
                    ? 'bg-positive-soft border-positive-border'
                    : 'bg-sheet border-hairline'
                }`}
              >
                <div className="font-display text-lg font-bold text-ink">
                  {rouletteName || recentWinner?.name || 'Siap diundi'}
                </div>
                {recentWinner && !isSpinning && (
                  <div className="text-xs text-positive font-medium mt-0.5">
                    {recentWinner.domicileCity || getZoneLabel(recentWinner.domicileZoneId)} · Giliran #{recentWinner.arisanSlotNumber}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch justify-center gap-2">
                <button
                  type="button"
                  onClick={handleRunRandomDraw}
                  disabled={isSpinning || eligibleForDraw.length === 0}
                  className="flex-1 h-10 px-4 rounded-control bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Dices className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} aria-hidden="true" />
                  <span>{isSpinning ? 'Mengundi...' : 'Putar Undian Acak'}</span>
                </button>

                {recentWinner && !isSpinning && (
                  <button
                    type="button"
                    onClick={() => openProgrammerForUser(recentWinner)}
                    className="h-10 px-4 rounded-control bg-btnred hover:bg-btnred-hover text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Program Kartu NFC</span>
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Participant Roster Table (Manual Award + Direct NFC Provisioning) */}
          <section
            aria-label="Daftar peserta klaster untuk penetapan manual"
            className="border border-hairline rounded-card bg-sheet overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-rule flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-semibold text-ink">
                  Daftar peserta klaster & penetapan akad manual
                </h2>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Termasuk akun peserta yang baru mendaftar dari form pendaftaran — klik &quot;Tetapkan Akad&quot; atau langsung program Kartu NFC.
                </p>
              </div>
              <span className="text-xs font-medium text-ink-secondary">
                Menampilkan {filteredCustomers.length} peserta
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr className="border-b border-hairline text-xs text-ink-secondary">
                    <th className="py-3 px-6 font-medium">Peserta & Biodata</th>
                    <th className="py-3 px-3 font-medium">Wilayah Domisili</th>
                    <th className="py-3 px-3 font-medium text-right">Saldo Kesiapan</th>
                    <th className="py-3 px-3 font-medium">Status & NFC</th>
                    <th className="py-3 px-6 font-medium text-right">Tindakan Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule text-[13px]">
                  {filteredCustomers.map((u) => {
                    const status = getEffectiveStatus(u);
                    const bal = getUserBalance(u);
                    const pct = Math.min(100, Math.round((bal / READINESS_THRESHOLD) * 100));
                    const userNfc = u.assignedNfcUid
                      ? nfcRegistry.find(
                          (r) => r.uid.toUpperCase() === u.assignedNfcUid?.toUpperCase()
                        )
                      : undefined;
                    const occ = userNfc?.occupancyStatus || 'hak-huni-aktif';

                    return (
                      <tr key={u.id} className="hover:bg-well/50 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="font-semibold text-ink">{u.name}</div>
                          <div className="text-xs text-ink-secondary font-mono">
                            {u.email} {u.nik ? `· NIK ${u.nik.slice(0, 6)}••••` : ''}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-medium text-ink inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-brand flex-shrink-0" aria-hidden="true" />
                            <span>{getZoneLabel(u.domicileZoneId)}</span>
                          </div>
                          <div className="text-xs text-ink-secondary">{u.domicileCity || '-'}</div>
                        </td>
                        <td className="py-3.5 px-3 text-right tabular-nums">
                          <div className="font-mono font-semibold text-ink">
                            {formatRupiah(bal, true)}
                          </div>
                          <div
                            className={`text-xs font-medium ${
                              pct >= 100 ? 'text-positive' : 'text-ink-secondary'
                            }`}
                          >
                            {pct}% {pct >= 100 ? '· Iuran lancar' : 'menabung harian'}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          {status === 'kartu-aktif' ? (
                            <div className="space-y-1">
                              {occ === 'dibekukan-tunggakan' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-btnred-soft text-btnred border border-btnred-border text-xs font-semibold">
                                  <Lock className="w-3 h-3" aria-hidden="true" />
                                  Dibekukan · Tunggakan
                                </span>
                              ) : occ === 'lunas-shm' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-positive text-white text-xs font-semibold">
                                  <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                                  Lunas 100% · SHM Penuh
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-positive-soft text-positive border border-positive-border text-xs font-semibold">
                                  <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                                  Hak Huni Aktif · SHM Disimpan BTN
                                </span>
                              )}
                              <div className="font-mono text-xs text-brand font-semibold">
                                {u.assignedNfcUid}
                              </div>
                            </div>
                          ) : status === 'terpilih-akad' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ochre-soft text-ochre border border-ochre-border text-xs font-semibold">
                              <Award className="w-3 h-3" aria-hidden="true" />
                              Menang Undian · Belum Program NFC
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-well text-ink-secondary border border-hairline text-xs font-medium">
                              Menunggu Undian Harian
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="inline-flex flex-wrap justify-end items-center gap-1.5">
                            {status === 'menunggu' && (
                              <button
                                type="button"
                                onClick={() => handleManualAssign(u.id)}
                                className="h-8 px-3 rounded-control border border-brand-border bg-brand-soft hover:bg-brand hover:text-white text-brand text-xs font-semibold transition-colors whitespace-nowrap"
                              >
                                Tetapkan Akad
                              </button>
                            )}
                            {status === 'terpilih-akad' && (
                              <button
                                type="button"
                                onClick={() => openProgrammerForUser(u)}
                                className="h-8 px-3 rounded-control bg-brand hover:bg-brand-hover text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                              >
                                <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Program Kartu NFC</span>
                              </button>
                            )}
                            {status === 'kartu-aktif' && u.assignedNfcUid && (
                              <>
                                {occ === 'dibekukan-tunggakan' ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateNfcOccupancyStatus(u.assignedNfcUid!, 'hak-huni-aktif')
                                    }
                                    className="h-8 px-2.5 rounded-control bg-positive hover:bg-positive/90 text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                                  >
                                    <Unlock className="w-3 h-3" aria-hidden="true" />
                                    <span>Aktifkan NFC</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateNfcOccupancyStatus(
                                        u.assignedNfcUid!,
                                        'dibekukan-tunggakan',
                                        'Tunggakan iuran harian > 60 hari. Hak huni dicabut, SHM tetap ditahan Bank BTN, setoran sebelumnya diperhitungkan sebagai biaya sewa (rental).'
                                      )
                                    }
                                    className="h-8 px-2.5 rounded-control border border-btnred-border bg-btnred-soft hover:bg-btnred hover:text-white text-btnred text-xs font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                                  >
                                    <Lock className="w-3 h-3" aria-hidden="true" />
                                    <span>Bekukan (Tunggakan)</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openProgrammerForUser(u)}
                                  className="h-8 px-2.5 rounded-control border border-control bg-sheet hover:bg-well text-ink text-xs font-medium inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                                >
                                  <Edit3 className="w-3 h-3" aria-hidden="true" />
                                  <span>Ubah</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: PEMROGRAMAN & PENERBITAN KARTU KUNCI PINTAR NFC BTN            */}
      {/* ===================================================================== */}
      {activeTab === 'program-nfc' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-panel-enter">
          {/* Left (7 cols): NFC Provisioning Form */}
          <form
            onSubmit={handleProgramCardSubmit}
            noValidate
            className="lg:col-span-7 border border-hairline rounded-[18px] bg-sheet p-6 space-y-5"
          >
            <div className="pb-4 border-b border-rule space-y-1">
              <h2 className="font-display text-base font-semibold text-ink inline-flex items-center gap-2">
                <Cpu className="w-4 h-4 text-brand" aria-hidden="true" />
                <span>Pemrograman data rumah ke Kartu Kunci NFC BTN</span>
              </h2>
              <p className="text-xs text-ink-secondary">
                Tulis identitas sertifikat, tipe denah rumah BTN, dan nilai serah terima ke chip NFC agar nasabah dapat memindainya di menu Scan Kartu.
              </p>
            </div>

            {/* Select Target Participant */}
            <div>
              <label htmlFor="admin-target-user" className="block text-xs font-medium text-ink mb-1.5">
                Pilih nasabah penerima unit rumah
              </label>
              <select
                id="admin-target-user"
                value={targetUserId}
                onChange={(e) => {
                  const found = customers.find((u) => u.id === e.target.value);
                  if (found) openProgrammerForUser(found);
                }}
                className="w-full h-10 px-3 rounded-control border border-control bg-sheet text-sm font-medium text-ink focus:border-brand focus:outline-none"
              >
                {customers.map((u) => {
                  const st = getEffectiveStatus(u);
                  const badge =
                    st === 'terpilih-akad'
                      ? '★ Terpilih Akad'
                      : st === 'kartu-aktif'
                      ? '✓ Kartu Aktif'
                      : 'Menunggu';
                  return (
                    <option key={u.id} value={u.id}>
                      {u.name} ({getZoneLabel(u.domicileZoneId)}) — {badge}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* UID NFC + Auto-Generate & Certificate No */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="admin-nfc-uid" className="text-xs font-medium text-ink">
                    Nomor Seri Kartu NFC (UID)
                  </label>
                  <button
                    type="button"
                    onClick={() => setNfcUid(generateBtnNfcUid(templateId, nfcRegistry))}
                    className="text-[11px] font-semibold text-brand hover:underline inline-flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" aria-hidden="true" />
                    <span>Acak baru</span>
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    id="admin-nfc-uid"
                    type="text"
                    value={nfcUid}
                    onChange={(e) => setNfcUid(e.target.value.toUpperCase())}
                    placeholder="BTN-NFC-3660-0101"
                    className="w-full h-10 pl-9 pr-3 rounded-control border border-control bg-sheet text-sm font-mono text-ink focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="admin-cert-no" className="block text-xs font-medium text-ink mb-1.5">
                  Nomor Sertifikat (SHGB / SHM)
                </label>
                <input
                  id="admin-cert-no"
                  type="text"
                  value={certificateNo}
                  onChange={(e) => setCertificateNo(e.target.value.toUpperCase())}
                  placeholder="SHGB-BTN-JAW-0101"
                  className="w-full h-10 px-3 rounded-control border border-control bg-sheet text-sm font-mono text-ink focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            {/* Select BTN Partner Housing Project (Auto-fills Cluster, City, Template & Price!) */}
            <div>
              <label htmlFor="admin-project" className="block text-xs font-medium text-ink mb-1.5">
                Proyek Perumahan Mitra BTN (otomatis mengisi harga &amp; lokasi)
              </label>
              <div className="relative">
                <Building2
                  className="w-3.5 h-3.5 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <select
                  id="admin-project"
                  value={projectId}
                  onChange={(e) => handleProjectSelect(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-control border border-control bg-sheet text-sm font-medium text-ink focus:border-brand focus:outline-none"
                >
                  {BTN_HOUSING_CATALOG.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.city} ({formatRupiah(p.price, true)} · {p.developer})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* House Template (Maps directly to authentic BTN floorplan!) */}
            <div>
              <label htmlFor="admin-template" className="block text-xs font-medium text-ink mb-1.5">
                Tipe Rumah &amp; Denah Bawaan BTN
              </label>
              <select
                id="admin-template"
                value={templateId}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full h-10 px-3 rounded-control border border-control bg-sheet text-sm font-medium text-ink focus:border-brand focus:outline-none"
              >
                {HOUSE_TEMPLATES.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} · LT {tpl.luasTanah} m² / LB {tpl.luasBangunanEksisting} m² ({tpl.programBadge})
                  </option>
                ))}
              </select>
              <div className="mt-1 text-[11px] text-ink-secondary">
                {selectedTemplate.regulationBasis}
              </div>
            </div>

            {/* Cluster Name + Block Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="admin-cluster" className="block text-xs font-medium text-ink mb-1.5">
                  Nama Perumahan / Klaster BTN
                </label>
                <input
                  id="admin-cluster"
                  type="text"
                  value={clusterName}
                  onChange={(e) => setClusterName(e.target.value)}
                  placeholder="BTN Griya Harmoni"
                  className="w-full h-10 px-3 rounded-control border border-control bg-sheet text-sm text-ink focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="admin-block" className="block text-xs font-medium text-ink mb-1.5">
                  Blok & Nomor Unit
                </label>
                <input
                  id="admin-block"
                  type="text"
                  value={unitBlock}
                  onChange={(e) => setUnitBlock(e.target.value)}
                  placeholder="Blok C-12"
                  className="w-full h-10 px-3 rounded-control border border-control bg-sheet text-sm text-ink focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            {/* City, Build Year, Physical Condition, Initial Value */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="admin-city" className="block text-xs font-medium text-ink mb-1.5">
                  Lokasi Kota / Kabupaten
                </label>
                <input
                  id="admin-city"
                  type="text"
                  value={lokasiKota}
                  onChange={(e) => setLokasiKota(e.target.value)}
                  className="w-full h-10 px-3 rounded-control border border-control bg-sheet text-sm text-ink focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="admin-value" className="block text-xs font-medium text-ink mb-1.5">
                  Nilai Awal Serah Terima (Rp)
                </label>
                <input
                  id="admin-value"
                  type="number"
                  step={1000000}
                  min={50000000}
                  value={nilaiAwal || ''}
                  onChange={(e) => setNilaiAwal(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full h-10 px-3 rounded-control border border-control bg-sheet text-sm font-mono tabular-nums text-ink focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="admin-year" className="block text-xs font-medium text-ink mb-1.5">
                  Tahun Dibangun / Serah Terima
                </label>
                <input
                  id="admin-year"
                  type="number"
                  min={2005}
                  max={2030}
                  value={tahunDibangun}
                  onChange={(e) => setTahunDibangun(Number(e.target.value) || 2025)}
                  className="w-full h-10 px-3 rounded-control border border-control bg-sheet text-sm font-mono tabular-nums text-ink focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="admin-cond" className="block text-xs font-medium text-ink mb-1.5">
                  Kondisi Fisik Saat Serah Terima
                </label>
                <select
                  id="admin-cond"
                  value={kondisiBangunan}
                  onChange={(e) => setKondisiBangunan(e.target.value as BuildingCondition)}
                  className="w-full h-10 px-3 rounded-control border border-control bg-sheet text-sm text-ink focus:border-brand focus:outline-none"
                >
                  <option value="prima">Prima (unit baru serah terima)</option>
                  <option value="terawat">Terawat normal</option>
                  <option value="perlu-peremajaan">Perlu peremajaan</option>
                </select>
              </div>
            </div>

            {/* Legal Occupancy / SHM Safekeeping Chip Status */}
            <div>
              <label htmlFor="admin-occupancy" className="block text-xs font-medium text-ink mb-1.5">
                Status Legalitas Chip NFC &amp; Sertifikat SHM Bank BTN
              </label>
              <select
                id="admin-occupancy"
                value={occupancyStatus}
                onChange={(e) => setOccupancyStatus(e.target.value as OccupancyLegalStatus)}
                className="w-full h-10 px-3 rounded-control border border-control bg-sheet text-sm font-medium text-ink focus:border-brand focus:outline-none"
              >
                <option value="hak-huni-aktif">
                  Hak Huni Sewa-Beli Aktif (SHM disimpan Bank BTN s/d iuran lunas)
                </option>
                <option value="lunas-shm">Lunas 100% (SHM/SHGB penuh diserahkan ke nasabah)</option>
                <option value="dibekukan-tunggakan">
                  Dibekukan — Tunggakan Iuran Harian (Hak huni dicabut · skema sewa/rental)
                </option>
              </select>
            </div>

            {programError && (
              <div className="p-3 rounded-control bg-btnred-soft border border-btnred-border text-xs text-btnred flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span>{programError}</span>
              </div>
            )}

            {programStatus === 'success' && programMessage && (
              <div className="p-4 rounded-control bg-positive-soft border border-positive-border text-xs text-positive space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span>Kartu Kunci Pintar NFC Berhasil Diprogram & Diaktifkan</span>
                </div>
                <p className="text-ink-secondary leading-relaxed">{programMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={programStatus === 'writing'}
              className="w-full h-11 rounded-control bg-brand hover:bg-brand-hover disabled:opacity-60 text-white font-display font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
            >
              {hasWebNfc ? (
                <Smartphone className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Wifi className="w-4 h-4" aria-hidden="true" />
              )}
              <span>
                {programStatus === 'writing'
                  ? 'Menulis data rumah ke chip NFC...'
                  : hasWebNfc
                  ? 'Tulis ke Chip NFC Fisik & Aktifkan Unit'
                  : 'Program & Terbitkan Kartu Kunci NFC BTN'}
              </span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>

          {/* Right (5 cols): Live Smart Key Card Visual Preview */}
          <aside className="lg:col-span-5 space-y-4">
            <div className="rounded-[18px] btn-hero-surface text-white p-6 space-y-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">
                  Pratinjau Kartu Kunci NFC
                </span>
                <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                  <Wifi className="w-4 h-4 text-white" aria-hidden="true" />
                </span>
              </div>

              {/* Card Face */}
              <div className="rounded-[16px] bg-sheet text-ink p-5 shadow-[0_14px_30px_-10px_rgba(0,0,0,0.35)] space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <BtnLogo size="sm" />
                  <span className="px-2 py-0.5 rounded-full bg-brand-soft text-brand text-[10px] font-bold uppercase tracking-wider">
                    NFC Smart Key
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[11px] text-ink-subtle">Nomor Seri Chip (UID)</div>
                  <div className="font-mono text-base font-bold text-brand">
                    {nfcUid || 'BTN-NFC-XXXX-XXXX'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-rule text-xs">
                  <div>
                    <div className="text-[11px] text-ink-subtle">Pemilik Unit</div>
                    <div className="font-semibold text-ink truncate">
                      {selectedTargetUser?.name || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-ink-subtle">Tipe Rumah</div>
                    <div className="font-semibold text-ink truncate">
                      {selectedTemplate.shortLabel}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-ink-subtle">Klaster & Blok</div>
                    <div className="font-medium text-ink truncate">
                      {clusterName || '-'} · {unitBlock || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-ink-subtle">Sertifikat</div>
                    <div className="font-mono font-medium text-ink truncate">
                      {certificateNo || '-'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-blue-100 leading-relaxed space-y-1">
                <div className="font-semibold text-white">Payload data tertanam:</div>
                <div>
                  • Luas Tanah {selectedTemplate.luasTanah} m² · Bangunan Eksisting{' '}
                  {selectedTemplate.luasBangunanEksisting} m²
                </div>
                <div>• Nilai Serah Terima: {formatRupiah(nilaiAwal)}</div>
                <div>• Lokasi: {lokasiKota || '-'}</div>
              </div>
            </div>

            <div className="p-4 rounded-card border border-hairline bg-well text-xs text-ink-secondary leading-relaxed">
              <strong className="text-ink">Cara uji end-to-end:</strong> Setelah klik{' '}
              <em>Program &amp; Terbitkan Kartu Kunci NFC BTN</em>, keluar dari akun Admin lalu masuk menggunakan akun nasabah yang baru diprogram. Kartu NFC tersebut otomatis aktif dan langsung bisa dipindai di menu <strong>Scan Kartu</strong>.
            </div>
          </aside>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: DAFTAR UNIT TERBIT & RIWAYAT AUDIT ADMIN                       */}
      {/* ===================================================================== */}
      {activeTab === 'riwayat' && (
        <div className="space-y-6 animate-panel-enter">
          <section
            aria-label="Registri kartu kunci NFC BTN aktif"
            className="border border-hairline rounded-card bg-sheet overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-rule flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold text-ink">
                  Daftar Kartu Kunci NFC BTN terbit ({nfcRegistry.length} unit)
                </h2>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Seluruh kartu di bawah ini aktif dan dapat dipindai pada halaman Scan Kartu Rumah.
                </p>
              </div>

              <button
                type="button"
                onClick={onResetDemoData}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-control border border-control bg-sheet hover:bg-well text-xs font-medium text-ink-secondary hover:text-btnred transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset Data Simulasi</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-hairline text-xs text-ink-secondary">
                    <th className="py-3 px-6 font-medium">UID Kartu NFC</th>
                    <th className="py-3 px-3 font-medium">Pemilik &amp; Sertifikat</th>
                    <th className="py-3 px-3 font-medium">Proyek &amp; Blok</th>
                    <th className="py-3 px-3 font-medium">Status Hak Huni / SHM</th>
                    <th className="py-3 px-6 font-medium text-right">Kontrol Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule text-[13px]">
                  {nfcRegistry.map((rec) => {
                    const occ = rec.occupancyStatus || 'hak-huni-aktif';
                    return (
                      <tr key={rec.uid} className="hover:bg-well/50 transition-colors">
                        <td className="py-3 px-6 font-mono font-semibold text-brand">{rec.uid}</td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-ink">{rec.ownerName}</div>
                          <div className="text-xs font-mono text-ink-secondary">{rec.certificateNo}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-ink">{rec.clusterName}</div>
                          <div className="text-xs text-ink-secondary">
                            {rec.unitBlock} · {formatRupiah(rec.nilaiSerahTerimaAwal, true)}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {occ === 'dibekukan-tunggakan' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-btnred-soft text-btnred border border-btnred-border text-xs font-semibold">
                              <Lock className="w-3 h-3" aria-hidden="true" />
                              Dibekukan (Tunggakan)
                            </span>
                          ) : occ === 'lunas-shm' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-positive text-white text-xs font-semibold">
                              <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                              Lunas · SHM Penuh
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-positive-soft text-positive border border-positive-border text-xs font-semibold">
                              <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                              Hak Huni · SHM di BTN
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {occ === 'dibekukan-tunggakan' ? (
                              <button
                                type="button"
                                onClick={() => onUpdateNfcOccupancyStatus(rec.uid, 'hak-huni-aktif')}
                                className="h-7 px-2.5 rounded-control bg-positive text-white text-xs font-semibold whitespace-nowrap"
                              >
                                Aktifkan
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateNfcOccupancyStatus(
                                      rec.uid,
                                      'dibekukan-tunggakan',
                                      'Tunggakan iuran harian. Hak huni dicabut, SHM tetap ditahan Bank BTN, setoran dikonversi sebagai biaya sewa (rental).'
                                    )
                                  }
                                  className="h-7 px-2.5 rounded-control border border-btnred-border bg-btnred-soft hover:bg-btnred hover:text-white text-btnred text-xs font-semibold transition-colors whitespace-nowrap"
                                >
                                  Bekukan
                                </button>
                                {occ !== 'lunas-shm' && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdateNfcOccupancyStatus(rec.uid, 'lunas-shm')}
                                    className="h-7 px-2.5 rounded-control border border-positive-border bg-positive-soft hover:bg-positive hover:text-white text-positive text-xs font-semibold transition-colors whitespace-nowrap"
                                  >
                                    Lunas SHM
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section
            aria-label="Riwayat audit undian dan pemrograman kartu"
            className="border border-hairline rounded-card bg-sheet p-6 space-y-4"
          >
            <div className="flex items-center gap-2 font-display text-base font-semibold text-ink">
              <Users className="w-4 h-4 text-brand" aria-hidden="true" />
              <span>Riwayat undian & penerbitan kartu ({auditLogs.length})</span>
            </div>

            <div className="divide-y divide-rule">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold ${
                          log.action === 'bekukan-nfc'
                            ? 'bg-btnred-soft text-btnred'
                            : log.action === 'program-nfc' ||
                              log.action === 'aktifkan-nfc' ||
                              log.action === 'lunas-shm'
                            ? 'bg-positive-soft text-positive'
                            : log.action === 'undian-acak'
                            ? 'bg-brand-soft text-brand'
                            : 'bg-ochre-soft text-ochre'
                        }`}
                      >
                        {log.action === 'program-nfc'
                          ? 'Program Kartu NFC'
                          : log.action === 'undian-acak'
                          ? 'Undian Acak'
                          : log.action === 'bekukan-nfc'
                          ? 'Bekukan NFC (Tunggakan)'
                          : log.action === 'aktifkan-nfc'
                          ? 'Aktifkan Kembali NFC'
                          : log.action === 'lunas-shm'
                          ? 'Pelepasan SHM Penuh'
                          : 'Penetapan Manual'}
                      </span>
                      <strong className="text-ink text-[13px]">{log.participantName}</strong>
                      <span className="text-ink-secondary">· {log.zoneLabel}</span>
                    </div>
                    <p className="text-ink-secondary">{log.detail}</p>
                  </div>
                  <span className="font-mono text-ink-subtle whitespace-nowrap">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
