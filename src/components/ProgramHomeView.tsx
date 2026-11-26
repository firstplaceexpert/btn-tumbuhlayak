'use client';

import React, { useMemo, useState } from 'react';
import { BtnHousingProject, DemoUser } from '../types';
import { ARISAN_LOCATION_ZONES } from '../data/arisanLocations';
import { getProjectsByZone } from '../data/btnHousingCatalog';
import { PropertyArisanCard } from './PropertyArisanCard';
import { BtnLogo } from './BtnLogo';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Compass,
  CreditCard,
  Dices,
  Home,
  KeyRound,
  Lock,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Users,
  Wifi,
} from 'lucide-react';

interface ProgramHomeViewProps {
  /** When logged in, renders as personalized Beranda inside AppShell; when null, renders public landing page */
  user: DemoUser | null;
  hasUnlockedNfc?: boolean;
  onOpenRegister?: (preselectedZoneId?: string, preselectedProjectId?: string) => void;
  onOpenLogin?: () => void;
  onGoToArisan?: (zoneId?: string, projectId?: string) => void;
  onGoToNfc?: () => void;
  onGoToPlanner?: () => void;
}

export const ProgramHomeView: React.FC<ProgramHomeViewProps> = ({
  user,
  hasUnlockedNfc = false,
  onOpenRegister,
  onOpenLogin,
  onGoToArisan,
  onGoToNfc,
  onGoToPlanner,
}) => {
  const isPublic = !user;

  const userZone = useMemo(
    () =>
      ARISAN_LOCATION_ZONES.find((z) => z.id === user?.domicileZoneId) ||
      ARISAN_LOCATION_ZONES[0],
    [user?.domicileZoneId]
  );

  // Public visitors filter strictly per region;
  // Logged-in customers are strictly locked to their own domicile zone.
  const [selectedFilterZone, setSelectedFilterZone] = useState<string>(
    ARISAN_LOCATION_ZONES[0].id
  );
  // Interactive toggle for the Anti-Mangkir visual showcase
  const [safetyView, setSafetyView] = useState<'lancar' | 'mangkir'>('mangkir');

  const visibleProjects: BtnHousingProject[] = useMemo(() => {
    if (!isPublic) {
      return getProjectsByZone(userZone.id);
    }
    return getProjectsByZone(selectedFilterZone);
  }, [isPublic, userZone.id, selectedFilterZone]);

  const handleSelectProject = (project: BtnHousingProject) => {
    if (isPublic) {
      onOpenRegister?.(project.zoneId, project.id);
    } else {
      onGoToArisan?.(project.zoneId, project.id);
    }
  };

  const content = (
    <div className="space-y-12 animate-panel-enter">
      {/* ================================================================= */}
      {/* 1. VISUAL-FIRST HERO (Punchy, Bold Numbers, Minimal Text!)        */}
      {/* ================================================================= */}
      <section className="rounded-[24px] border border-hairline bg-gradient-to-br from-[#EAF2FF] via-[#FCFBF8] to-[#FEF6E6] p-6 sm:p-9 lg:p-10 overflow-hidden relative">
        <div
          className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-brand/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-1/3 w-64 h-64 rounded-full bg-ochre-gold/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-6 space-y-6">
            {isPublic ? (
              <div className="inline-flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand text-white text-xs font-semibold whitespace-nowrap">
                  <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                  BTN Housingpreneur Batch 3
                </span>
                <span className="px-2.5 py-1 rounded-full bg-btnred-soft text-btnred border border-btnred-border text-xs font-bold whitespace-nowrap">
                  1 Rumah / Hari
                </span>
              </div>
            ) : (
              <div className="inline-flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-soft text-brand border border-brand-border text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Halo, {user.name}
                </span>
                {user.domicileCity && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-positive-soft text-positive border border-positive-border text-xs font-medium">
                    <MapPin className="w-3 h-3" aria-hidden="true" />
                    {user.domicileCity}
                  </span>
                )}
              </div>
            )}

            <div className="space-y-3">
              <h1 className="font-display text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-ink leading-[1.14] tracking-[-0.025em]">
                {isPublic ? (
                  <>
                    Punya Rumah BTN mulai{' '}
                    <span className="text-brand">Rp 50rb/hari</span>
                  </>
                ) : (
                  <>
                    Rumah impian BTN di{' '}
                    <span className="text-brand">{userZone.shortLabel}</span>
                  </>
                )}
              </h1>

              <p className="text-[15px] text-ink-secondary leading-relaxed max-w-lg">
                {isPublic
                  ? 'Arisan harian resmi mitra Bank BTN. 1 rumah diundi setiap hari, terima Kartu Kunci NFC, lalu kembangkan rumah tumbuh Anda.'
                  : 'Pantau sisa kuota perumahan sesuai domisili Anda atau pindai Kartu Kunci NFC untuk merancang denah rumah tumbuh.'}
              </p>
            </div>

            {/* 3 Scannable Big Stat Chips (Replaces wordy formula paragraph!) */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              <div className="p-3 rounded-[14px] bg-sheet/95 border border-hairline shadow-sm">
                <div className="font-display text-base sm:text-lg font-extrabold text-brand tabular-nums">
                  Rp 50rb
                </div>
                <div className="text-[11px] text-ink-secondary font-medium">Iuran / hari</div>
              </div>
              <div className="p-3 rounded-[14px] bg-sheet/95 border border-hairline shadow-sm">
                <div className="font-display text-base sm:text-lg font-extrabold text-ochre tabular-nums">
                  1 Rumah
                </div>
                <div className="text-[11px] text-ink-secondary font-medium">Diundi / hari</div>
              </div>
              <div className="p-3 rounded-[14px] bg-sheet/95 border border-hairline shadow-sm">
                <div className="font-display text-base sm:text-lg font-extrabold text-positive">
                  100% Aman
                </div>
                <div className="text-[11px] text-ink-secondary font-medium">SHM di BTN</div>
              </div>
            </div>

            {/* Primary CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {isPublic ? (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenRegister?.('jabodetabek', 'grand-harmoni-park')}
                    className="h-12 px-6 rounded-[12px] bg-brand hover:bg-brand-hover text-white font-display font-semibold text-sm inline-flex items-center gap-2 shadow-[0_8px_20px_-6px_rgba(27,86,198,0.55)] transition-all hover:-translate-y-0.5"
                  >
                    <span>Daftar Sekarang</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="h-12 px-5 rounded-[12px] border border-control bg-sheet hover:bg-well text-ink font-display font-semibold text-sm transition-colors"
                  >
                    Masuk Akun
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onGoToArisan?.(user.domicileZoneId)}
                    className="h-11 px-5 rounded-[11px] bg-brand hover:bg-brand-hover text-white font-display font-semibold text-sm inline-flex items-center gap-2 transition-colors"
                  >
                    <Users className="w-4 h-4" aria-hidden="true" />
                    <span>Buka Arisan Wilayah Saya</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={hasUnlockedNfc ? onGoToPlanner : onGoToNfc}
                    className="h-11 px-5 rounded-[11px] border border-brand-border bg-sheet hover:bg-brand-soft text-brand font-display font-semibold text-sm inline-flex items-center gap-2 transition-colors"
                  >
                    {hasUnlockedNfc ? (
                      <>
                        <Compass className="w-4 h-4" aria-hidden="true" />
                        <span>Buka Denah Rumah</span>
                      </>
                    ) : (
                      <>
                        <Wifi className="w-4 h-4" aria-hidden="true" />
                        <span>Scan Kartu NFC</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Friendly BTN Cartoon Illustration */}
          <div className="lg:col-span-6">
            <div className="relative rounded-[20px] bg-[#F6F4EF] border border-hairline p-3 shadow-[0_18px_40px_-20px_rgba(31,36,43,0.2)]">
              <img
                src="/illustrations/hero-home-btn.jpg"
                alt="Ilustrasi keluarga muda Indonesia di depan rumah BTN memegang kunci dan kartu pintar NFC"
                className="w-full h-auto rounded-[14px] object-cover block"
              />
              <div className="mt-2.5 flex items-center justify-between gap-2 px-1 text-[11px] font-semibold">
                <span className="inline-flex items-center gap-1 text-brand">
                  <Home className="w-3.5 h-3.5" aria-hidden="true" />
                  Contoh: Rp 170 Jt = 3.400 org (9,3 thn)
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-positive-soft text-positive">
                  Kartu NFC Aktif
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logged-in Compact Biodata Strip */}
      {!isPublic && (
        <section
          aria-label="Ringkasan biodata nasabah"
          className="rounded-card border border-hairline bg-well px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-brand" aria-hidden="true" />
              <strong className="font-mono text-ink">
                {user.btnAccountNumber || 'Rekening BTN Aktif'}
              </strong>
            </span>
            <span className="text-ink-secondary">
              Zona: <strong className="text-brand">{userZone.shortLabel}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => onGoToArisan?.(user.domicileZoneId)}
            className="font-semibold text-brand hover:underline inline-flex items-center gap-1"
          >
            <span>Lihat detail arisan</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </section>
      )}

      {/* ================================================================= */}
      {/* 2. KATALOG PERUMAHAN MITRA BTN (Visual BTN Properti Cards)        */}
      {/* ================================================================= */}
      <section
        id="katalog-perumahan"
        aria-label="Katalog perumahan mitra BTN"
        className="space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-btnred uppercase tracking-wider">
              {isPublic ? 'Pilih Rumah Impianmu' : `Wilayah ${userZone.shortLabel}`}
            </span>
            <h2 className="font-display text-2xl font-extrabold text-ink mt-0.5">
              Perumahan Mitra Bank BTN
            </h2>
          </div>
          <span className="text-xs text-ink-secondary">
            Kuota = Harga ÷ Iuran Harian · data peserta simulasi
          </span>
        </div>

        {/* Region Filter Pills (Public only; logged-in customers stay domicile-locked) */}
        {isPublic && (
          <div className="flex flex-wrap gap-2">
            {ARISAN_LOCATION_ZONES.map((z) => {
              const active = z.id === selectedFilterZone;
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setSelectedFilterZone(z.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    active
                      ? 'bg-brand text-white border-brand shadow-[0_4px_12px_-4px_rgba(27,86,198,0.45)]'
                      : 'bg-well text-ink-secondary border-hairline hover:border-brand-border hover:text-ink'
                  }`}
                >
                  {z.shortLabel}
                </button>
              );
            })}
          </div>
        )}

        {/* 3-Column Property Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleProjects.map((project) => (
            <PropertyArisanCard
              key={project.id}
              project={project}
              actionLabel={isPublic ? 'Ikut Arisan' : 'Pilih Unit'}
              onAction={handleSelectProject}
            />
          ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. KEUNGGULAN VISUAL (3 Illustrated Bento Cards — Minim Teks!)    */}
      {/* ================================================================= */}
      <section aria-label="Keunggulan btn TumbuhLayak" className="space-y-6">
        <div className="text-center space-y-1.5">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-soft text-brand text-xs font-bold">
            Kenapa btn TumbuhLayak?
          </span>
          <h2 className="font-display text-2xl sm:text-[26px] font-extrabold text-ink">
            Ringan dicicil, seru diundi tiap hari
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Benefit 1: Daily Saving Illustration */}
          <article className="rounded-[20px] border border-brand-border/80 bg-sheet overflow-hidden shadow-[0_10px_26px_-18px_rgba(27,86,198,0.25)] flex flex-col">
            <div className="p-3.5 bg-gradient-to-b from-[#EEF4FD] to-[#FCFBF8] relative">
              <img
                src="/illustrations/step-arisan-saving.jpg"
                alt="Ilustrasi menabung harian ringan bersama komunitas BTN"
                className="w-full aspect-[16/10] object-cover rounded-[13px] block"
              />
              <span className="absolute top-6 left-6 px-3 py-1 rounded-full bg-brand text-white text-xs font-display font-bold shadow-sm">
                Rp 50rb / hari
              </span>
            </div>
            <div className="p-5 space-y-1.5">
              <h3 className="font-display text-base font-extrabold text-ink">
                Tanpa DP Besar di Awal
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Harga rumah dibagi kuota pas — 100% iuran utuh untuk rumah Anda.
              </p>
            </div>
          </article>

          {/* Benefit 2: Smart Key NFC Card Showcase (With Official Opsi 2 Logo!) */}
          <article className="rounded-[20px] border border-brand bg-gradient-to-br from-[#163F92] via-[#1B56C6] to-[#1D4FA8] text-white overflow-hidden shadow-[0_14px_30px_-16px_rgba(27,86,198,0.45)] flex flex-col">
            <div className="p-5 aspect-[16/10] flex flex-col items-center justify-center relative overflow-hidden">
              <div className="w-40 h-40 rounded-full bg-white/10 absolute -top-12 -right-10" aria-hidden="true" />
              <div className="w-28 h-28 rounded-full bg-btnred/30 absolute -bottom-10 -left-8" aria-hidden="true" />
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-ochre-gold text-ink text-xs font-display font-bold shadow-sm">
                1 Rumah / Hari
              </span>
              <div className="relative z-10 w-full max-w-[245px] rounded-[15px] bg-sheet text-ink p-4 shadow-[0_14px_30px_-10px_rgba(0,0,0,0.35)] space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <BtnLogo size="sm" />
                  <span className="w-7 h-7 rounded-full bg-brand-soft text-brand flex items-center justify-center">
                    <Wifi className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                </div>
                <div className="font-mono text-xs font-bold text-brand">BTN-NFC-3672-0014</div>
                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-rule">
                  <span className="text-ink-secondary font-medium">Grand Harmoni Park</span>
                  <span className="px-2 py-0.5 rounded-full bg-positive-soft text-positive font-bold">
                    Aktif
                  </span>
                </div>
              </div>
            </div>
            <div className="p-5 pt-2 space-y-1.5">
              <h3 className="font-display text-base font-extrabold text-white">
                Undian Harian + Kartu NFC
              </h3>
              <p className="text-xs text-blue-100 leading-relaxed">
                365 pemenang tiap tahun langsung terima kunci pintar &amp; huni unitnya.
              </p>
            </div>
          </article>

          {/* Benefit 3: Growing Home Illustration */}
          <article className="rounded-[20px] border border-positive-border bg-sheet overflow-hidden shadow-[0_10px_26px_-18px_rgba(29,122,78,0.22)] flex flex-col">
            <div className="p-3.5 bg-gradient-to-b from-[#EAF7F0] to-[#FCFBF8] relative">
              <img
                src="/illustrations/step-growing-house.jpg"
                alt="Ilustrasi rumah tumbuh bertahap 2 lantai dengan denah"
                className="w-full aspect-[16/10] object-cover rounded-[13px] block"
              />
              <span className="absolute top-6 left-6 px-3 py-1 rounded-full bg-positive text-white text-xs font-display font-bold shadow-sm">
                Denah + RAB
              </span>
            </div>
            <div className="p-5 space-y-1.5">
              <h3 className="font-display text-base font-extrabold text-ink">
                Tumbuh Bersama Keluarga
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Rancang renovasi bertahap langsung di denah &amp; pantau nilai rumah.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. PROTEKSI ANTI-MANGKIR (Interactive Visual Toggle — No Wall!)   */}
      {/* ================================================================= */}
      <section
        aria-label="Jaminan keamanan dan penanganan peserta mangkir"
        className="rounded-[22px] border border-hairline bg-sheet overflow-hidden shadow-[0_12px_30px_-18px_rgba(31,36,43,0.16)]"
      >
        {/* Compact Top Bar with Interactive Toggle */}
        <div className="bg-gradient-to-r from-[#EEF4FD] via-[#FCFBF8] to-[#FDF1F2] px-6 py-5 border-b border-rule flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-btnred">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>Jaminan Keamanan Bank BTN · SHM Aman 100%</span>
            </div>
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-ink">
              Takut pemenang awal kabur? Ini proteksi kami
            </h2>
          </div>

          {/* Interactive 2-State Pill Switcher */}
          <div
            className="inline-flex self-start md:self-auto bg-sheet p-1 rounded-[12px] border border-hairline shadow-sm"
            role="tablist"
            aria-label="Simulasi skenario pembayaran pemenang"
          >
            <button
              type="button"
              role="tab"
              aria-selected={safetyView === 'mangkir'}
              onClick={() => setSafetyView('mangkir')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] text-xs font-bold transition-colors whitespace-nowrap ${
                safetyView === 'mangkir'
                  ? 'bg-btnred text-white shadow-sm'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Jika Berhenti Bayar</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={safetyView === 'lancar'}
              onClick={() => setSafetyView('lancar')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] text-xs font-bold transition-colors whitespace-nowrap ${
                safetyView === 'lancar'
                  ? 'bg-positive text-white shadow-sm'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Jika Iuran Lancar</span>
            </button>
          </div>
        </div>

        {/* Visual 3-Step Horizontal Icon Cards (Super Scannable!) */}
        <div className="p-6">
          {safetyView === 'mangkir' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-panel-enter">
              <div className="p-4 rounded-[16px] bg-btnred-soft/50 border border-btnred-border flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-[11px] bg-btnred text-white flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold text-btnred uppercase">1 · Akses Dibekukan</div>
                  <div className="font-display text-sm font-bold text-ink">
                    Kartu NFC Mati &amp; Hak Huni Dicabut
                  </div>
                  <p className="text-xs text-ink-secondary">
                    Pemenang yang mangkir tidak bisa lagi menempati unit.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-[16px] bg-ochre-soft/55 border border-ochre-border flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-[11px] bg-ochre text-white flex items-center justify-center flex-shrink-0">
                  <KeyRound className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold text-ochre uppercase">2 · Skema Sewa (Rental)</div>
                  <div className="font-display text-sm font-bold text-ink">
                    Setoran Jadi Biaya Sewa · SHM di BTN
                  </div>
                  <p className="text-xs text-ink-secondary">
                    Sertifikat tetap ditahan BTN — mustahil digadaikan sepihak.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-[16px] bg-brand-soft/60 border border-brand-border flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-[11px] bg-brand text-white flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold text-brand uppercase">3 · Klaster Tetap Aman</div>
                  <div className="font-display text-sm font-bold text-ink">
                    Unit Dialihkan ke Peserta Pengganti
                  </div>
                  <p className="text-xs text-ink-secondary">
                    Kas arisan harian tetap 100% utuh untuk peserta lain.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-panel-enter">
              <div className="p-4 rounded-[16px] bg-brand-soft/60 border border-brand-border flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-[11px] bg-brand text-white flex items-center justify-center flex-shrink-0">
                  <Dices className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold text-brand uppercase">1 · Menang Undian</div>
                  <div className="font-display text-sm font-bold text-ink">
                    Langsung Huni Pakai Kartu NFC
                  </div>
                  <p className="text-xs text-ink-secondary">
                    Begitu terpilih, rumah langsung bisa ditempati bersama keluarga.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-[16px] bg-ochre-soft/55 border border-ochre-border flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-[11px] bg-ochre text-white flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold text-ochre uppercase">2 · Autodebet Ringan</div>
                  <div className="font-display text-sm font-bold text-ink">
                    Lanjut Setor Rp 50rb/Hari di BTN
                  </div>
                  <p className="text-xs text-ink-secondary">
                    Progres pelunasan tercatat otomatis setiap hari di akun Anda.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-[16px] bg-positive-soft/65 border border-positive-border flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-[11px] bg-positive text-white flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold text-positive uppercase">3 · Lunas 100%</div>
                  <div className="font-display text-sm font-bold text-ink">
                    SHM Penuh Diserahkan ke Anda
                  </div>
                  <p className="text-xs text-ink-secondary">
                    Rumah &amp; sertifikat SHM resmi sepenuhnya atas nama Anda.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================= */}
      {/* 5. SHORT, BOLD CTA FOOTER BANNER (Public Mode)                    */}
      {/* ================================================================= */}
      {isPublic && (
        <section className="rounded-[22px] btn-hero-surface text-white px-7 py-8 sm:px-9 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white">
              Siap punya rumah BTN pertamamu?
            </h2>
            <p className="text-sm text-blue-100">
              Daftar 1 menit — pilih proyek mitra BTN sesuai domisili Anda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => onOpenRegister?.('jabodetabek', 'grand-harmoni-park')}
              className="h-12 px-6 rounded-[12px] bg-btnred hover:bg-btnred-hover text-white font-display font-semibold text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm"
            >
              <span>Daftar Sekarang</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onOpenLogin}
              className="h-12 px-5 rounded-[12px] bg-white/15 hover:bg-white/25 border border-white/25 text-white font-display font-semibold text-sm transition-colors whitespace-nowrap"
            >
              Masuk
            </button>
          </div>
        </section>
      )}
    </div>
  );

  if (!isPublic) {
    return content;
  }

  // Public Landing Page Shell (Clean header: ONLY btn TumbuhLayak, Masuk, Daftar)
  return (
    <div className="min-h-screen bg-frame flex flex-col">
      <div className="sticky top-3 z-40 px-3 sm:px-6 pt-3">
        <header className="max-w-[1220px] mx-auto bg-sheet/95 backdrop-blur-md border border-hairline rounded-[16px] shadow-[0_8px_28px_-10px_rgba(31,36,43,0.12)] px-3.5 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="hidden sm:block">
            <BtnLogo size="md" showTagline />
          </div>
          <div className="sm:hidden">
            <BtnLogo size="sm" />
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={onOpenLogin}
              className="h-9 px-3.5 sm:px-4 rounded-[9px] border border-control bg-sheet hover:bg-well text-[13px] font-semibold text-ink transition-colors whitespace-nowrap"
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => onOpenRegister?.('jabodetabek', 'grand-harmoni-park')}
              className="h-9 px-3.5 sm:px-4 rounded-[9px] bg-brand hover:bg-brand-hover text-white text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <span>Daftar</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </header>
      </div>

      <main className="flex-1 px-3 sm:px-6 pt-6 pb-12">
        <div className="max-w-[1220px] mx-auto">{content}</div>
      </main>

      <footer className="border-t border-hairline bg-sheet/70 py-5 px-4">
        <div className="max-w-[1220px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-ink-secondary">
          <span>btn TumbuhLayak · BTN Housingpreneur Batch 3</span>
          <span>Acuan Kepmen PUPR 689/2023 · angka peserta bersifat simulasi</span>
        </div>
      </footer>
    </div>
  );
};
