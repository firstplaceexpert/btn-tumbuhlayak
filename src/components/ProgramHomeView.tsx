'use client';

import React, { useMemo, useState } from 'react';
import { BtnHousingProject, DemoUser } from '../types';
import { ARISAN_LOCATION_ZONES } from '../data/arisanLocations';
import { BTN_HOUSING_CATALOG, getProjectsByZone } from '../data/btnHousingCatalog';
import { PropertyArisanCard } from './PropertyArisanCard';
import { BtnLogo } from './BtnLogo';
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  Compass,
  CreditCard,
  Dices,
  Home,
  Lock,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Users,
  Wifi,
} from 'lucide-react';

interface ProgramHomeViewProps {
  /** When logged in, renders as personalized Beranda inside AppShell; when null, renders full public landing page */
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

  // Public visitors can browse Featured ("pilihan") or any of the 7 zones;
  // Logged-in customers are strictly locked to their own domicile zone.
  const [selectedFilterZone, setSelectedFilterZone] = useState<string>('pilihan');

  const visibleProjects: BtnHousingProject[] = useMemo(() => {
    if (!isPublic) {
      return getProjectsByZone(userZone.id);
    }
    if (selectedFilterZone === 'pilihan') {
      // Showcase real reference projects: Grand Harmoni Park (Bekasi), Keandra Park Tahap 2 (Cirebon), & Pesona Ungaran Rp 170 Jt (3.400 org)
      const featuredIds = [
        'grand-harmoni-park',
        'keandra-park-tahap-2',
        'pesona-ungaran-residence',
      ];
      return featuredIds
        .map((id) => BTN_HOUSING_CATALOG.find((p) => p.id === id))
        .filter((p): p is BtnHousingProject => Boolean(p));
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
    <div className="space-y-10 animate-panel-enter">
      {/* ================================================================= */}
      {/* 1. COLORFUL BTN HERO BANNER (Konsep Arisan Harian 1 Rumah / Hari) */}
      {/* ================================================================= */}
      <section className="rounded-[20px] border border-hairline bg-gradient-to-br from-[#EEF4FD] via-[#FCFBF8] to-[#FEF7EA] p-6 sm:p-8 lg:p-10 overflow-hidden relative">
        <div
          className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-brand/10 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/3 w-56 h-56 rounded-full bg-ochre-gold/15 blur-2xl"
          aria-hidden="true"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-6 space-y-5">
            {isPublic ? (
              <div className="inline-flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand text-white text-xs font-semibold">
                  <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Program BTN Housingpreneur Batch 3
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-btnred-soft text-btnred border border-btnred-border text-xs font-semibold">
                  Arisan Harian · 1 Rumah / Hari
                </span>
              </div>
            ) : (
              <div className="inline-flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-soft text-brand border border-brand-border text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Selamat datang, {user.name}
                </span>
                {user.domicileCity && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-positive-soft text-positive border border-positive-border text-xs font-medium">
                    <MapPin className="w-3 h-3" aria-hidden="true" />
                    Domisili: {user.domicileCity}
                  </span>
                )}
              </div>
            )}

            <h1 className="font-display text-2xl sm:text-3xl lg:text-[34px] font-bold text-ink leading-[1.2] tracking-[-0.02em]">
              {isPublic ? (
                <>
                  Arisan rumah BTN harian:{' '}
                  <span className="text-brand">Rp 50rb/hari, 1 rumah diundi tiap hari</span>
                </>
              ) : (
                <>
                  Pilih perumahan BTN di{' '}
                  <span className="text-brand">{userZone.shortLabel}</span> &amp; pantau kuota arisan harian
                </>
              )}
            </h1>

            <p className="text-[15px] text-ink-secondary leading-relaxed">
              {isPublic
                ? 'Pilih proyek perumahan mitra Bank BTN seperti Grand Harmoni Park atau Keandra Park. Harga rumah dibagi Rp 50.000/hari menentukan kuota klaster — begitu kuota terpenuhi, 1 unit rumah diundi setiap hari dengan jaminan sertifikat SHM di Bank BTN.'
                : 'Daftar proyek perumahan otomatis disaring sesuai wilayah domisili akun Anda. Pilih proyek, cek sisa kuota agar undian harian berjalan, atau pindai Kartu Kunci NFC untuk membuka denah rumah tumbuh.'}
            </p>

            {/* Clear Formula Strip */}
            <div className="p-3.5 rounded-[12px] bg-sheet/90 border border-brand-border/80 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
              <span className="font-semibold text-brand">Contoh nyata:</span>
              <span className="text-ink tabular-nums">
                Rumah <strong>Rp 170 Jt</strong> ÷ <strong>Rp 50rb/hari</strong> ={' '}
                <strong className="text-brand">3.400 peserta</strong> ·{' '}
                <strong className="text-positive">1 unit diundi setiap hari</strong> · durasi{' '}
                <strong>9,3 tahun</strong>
              </span>
            </div>

            {/* Primary CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {isPublic ? (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenRegister?.('jabodetabek', 'grand-harmoni-park')}
                    className="h-12 px-6 rounded-[11px] bg-brand hover:bg-brand-hover text-white font-display font-semibold text-sm inline-flex items-center gap-2 shadow-[0_6px_18px_-6px_rgba(27,86,198,0.5)] transition-colors"
                  >
                    <span>Tertarik? Daftar Sekarang</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="h-12 px-5 rounded-[11px] border border-control bg-sheet hover:bg-well text-ink font-display font-semibold text-sm transition-colors"
                  >
                    Sudah punya akun? Masuk
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onGoToArisan?.(user.domicileZoneId)}
                    className="h-11 px-5 rounded-[10px] bg-brand hover:bg-brand-hover text-white font-display font-semibold text-sm inline-flex items-center gap-2 transition-colors"
                  >
                    <Users className="w-4 h-4" aria-hidden="true" />
                    <span>Buka Arisan Wilayah Saya</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={hasUnlockedNfc ? onGoToPlanner : onGoToNfc}
                    className="h-11 px-5 rounded-[10px] border border-brand-border bg-sheet hover:bg-brand-soft text-brand font-display font-semibold text-sm inline-flex items-center gap-2 transition-colors"
                  >
                    {hasUnlockedNfc ? (
                      <>
                        <Compass className="w-4 h-4" aria-hidden="true" />
                        <span>Buka Denah Rumah Tumbuh</span>
                      </>
                    ) : (
                      <>
                        <Wifi className="w-4 h-4" aria-hidden="true" />
                        <span>Scan Kartu Kunci NFC</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Friendly BTN Cartoon Illustration */}
          <div className="lg:col-span-6">
            <div className="relative rounded-[18px] bg-[#F6F4EF] border border-hairline p-3 sm:p-4 shadow-[0_14px_34px_-18px_rgba(31,36,43,0.18)]">
              <img
                src="/illustrations/hero-home-btn.jpg"
                alt="Ilustrasi keluarga muda Indonesia di depan rumah BTN memegang kunci dan kartu pintar NFC"
                className="w-full h-auto rounded-[13px] object-cover block"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5 px-0.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sheet border border-hairline text-[11px] font-semibold text-brand whitespace-nowrap">
                  <Home className="w-3 h-3" aria-hidden="true" />
                  Katalog Mitra BTN Properti
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ochre-soft border border-ochre-border text-[11px] font-semibold text-ochre whitespace-nowrap">
                  Undian Harian · Rp 50rb/hr
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-positive-soft border border-positive-border text-[11px] font-semibold text-positive whitespace-nowrap">
                  Jaminan SHM &amp; Kartu NFC
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logged-in Biodata & Domicile Sync Strip */}
      {!isPublic && (
        <section
          aria-label="Ringkasan biodata nasabah"
          className="rounded-card border border-hairline bg-well p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand flex-shrink-0" aria-hidden="true" />
              <span className="text-ink-secondary">Rekening BTN:</span>
              <strong className="font-mono text-ink">
                {user.btnAccountNumber || 'Simulasi Terverifikasi'}
              </strong>
            </div>
            {user.nik && (
              <div>
                <span className="text-ink-secondary">NIK:</span>{' '}
                <strong className="font-mono text-ink">
                  {user.nik.slice(0, 6)}••••••{user.nik.slice(-4)}
                </strong>
              </div>
            )}
            <div>
              <span className="text-ink-secondary">Wilayah domisili:</span>{' '}
              <strong className="text-brand">{userZone.regionName}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onGoToArisan?.(user.domicileZoneId)}
            className="self-start md:self-auto text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 whitespace-nowrap"
          >
            <span>Lihat detail arisan wilayah saya</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </section>
      )}

      {/* ================================================================= */}
      {/* 2. KATALOG PERUMAHAN MITRA BTN (Kartu Ala BTN Properti + Kuota)   */}
      {/* ================================================================= */}
      <section
        id="katalog-perumahan"
        aria-label="Katalog perumahan mitra BTN untuk arisan harian"
        className="space-y-5"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-btnred uppercase tracking-wide">
              {isPublic
                ? 'Katalog Perumahan Mitra Bank BTN'
                : `Katalog Perumahan Wilayah ${userZone.shortLabel}`}
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-ink">
              {isPublic
                ? 'Pilih rumah BTN impian, cek iuran harian & sisa kuota klaster'
                : `Unit perumahan mitra BTN sesuai domisili Anda (${user.domicileCity || userZone.shortLabel})`}
            </h2>
            <p className="text-xs text-ink-secondary">
              Kuota otomatis dihitung dari <strong>Harga Rumah ÷ Iuran Harian</strong> agar setiap hari terkumpul tepat 1 unit rumah untuk diundi. Angka peserta terdaftar adalah data simulasi.
            </p>
          </div>
        </div>

        {/* Region Filter Pills (Public only; logged-in customers see ONLY their domicile zone) */}
        {isPublic && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedFilterZone('pilihan')}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors ${
                selectedFilterZone === 'pilihan'
                  ? 'bg-brand text-white border-brand shadow-[0_4px_12px_-4px_rgba(27,86,198,0.45)]'
                  : 'bg-well text-ink-secondary border-hairline hover:border-brand-border hover:text-ink'
              }`}
            >
              Pilihan Utama (Grand Harmoni &amp; Keandra)
            </button>
            {ARISAN_LOCATION_ZONES.map((z) => {
              const active = z.id === selectedFilterZone;
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setSelectedFilterZone(z.id)}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors ${
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

        {/* 3-Column BTN Properti Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleProjects.map((project) => (
            <PropertyArisanCard
              key={project.id}
              project={project}
              actionLabel={isPublic ? 'Daftar Ikut Unit Ini' : 'Pilih & Simulasikan Unit'}
              onAction={handleSelectProject}
            />
          ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. STRUKTUR KONSEP JELAS: 4 PILAR ARISAN HARIAN + SKEMA RENTAL    */}
      {/* ================================================================= */}
      <section
        aria-label="Struktur konsep arisan harian dan perlindungan gagal bayar"
        className="space-y-6"
      >
        <div className="text-center max-w-2xl mx-auto space-y-1.5">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-ochre-soft text-ochre border border-ochre-border text-xs font-semibold">
            Struktur Konsep Jelas &amp; Terukur
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-ink">
            Cara kerja Arisan Rumah Harian &amp; Proteksi Anti-Mangkir BTN
          </h2>
        </div>

        {/* 4 Structured Pillar Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <article className="p-5 rounded-[16px] border border-hairline bg-sheet space-y-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-brand-soft text-brand flex items-center justify-center">
              <Building2 className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-brand">
              1 · Data Perumahan BTN
            </div>
            <h3 className="font-display text-[15px] font-bold text-ink">
              Proyek nyata mitra BTN
            </h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Mengambil unit perumahan resmi mitra Bank BTN (mis. Grand Harmoni Park Rp 185 Jt atau Keandra Park Rp 168 Jt) sesuai wilayah domisili peserta.
            </p>
          </article>

          <article className="p-5 rounded-[16px] border border-hairline bg-sheet space-y-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-ochre-soft text-ochre flex items-center justify-center">
              <CalendarClock className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-ochre">
              2 · Rumus Kuota Pas
            </div>
            <h3 className="font-display text-[15px] font-bold text-ink">
              Harga ÷ Rp 50rb/hari
            </h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Contoh rumah Rp 170 Jt ÷ Rp 50rb/hr = <strong>3.400 peserta</strong>. Begitu kuota terpenuhi, terkumpul Rp 170 Jt tiap hari selama 9,3 tahun.
            </p>
          </article>

          <article className="p-5 rounded-[16px] border border-hairline bg-sheet space-y-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-positive-soft text-positive flex items-center justify-center">
              <Dices className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-positive">
              3 · Undian Setiap Hari
            </div>
            <h3 className="font-display text-[15px] font-bold text-ink">
              1 pemenang tiap hari
            </h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Diundi setiap hari oleh Admin Operasional BTN sehingga peserta antusias — setiap hari ada 1 keluarga yang langsung terima Kartu Kunci NFC.
            </p>
          </article>

          <article className="p-5 rounded-[16px] border border-btnred-border bg-btnred-soft/35 space-y-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-btnred text-white flex items-center justify-center">
              <Lock className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-btnred">
              4 · Skema Hak Huni &amp; SHM
            </div>
            <h3 className="font-display text-[15px] font-bold text-ink">
              Anti gagal bayar (seperti sewa)
            </h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              SHM tetap ditahan BTN sampai lunas. Jika pemenang berhenti setor, Kartu NFC dibekukan, hak huni dicabut, dan setoran dihitung sebagai biaya sewa (rental).
            </p>
          </article>
        </div>

        {/* Dedicated Anti-Default / Rental-Conversion Safeguard Box */}
        <div className="rounded-[18px] border border-hairline bg-sheet p-6 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-btnred-soft text-btnred border border-btnred-border text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
              Menjawab Risiko Terbesar Arisan
            </span>
            <h3 className="font-display text-lg font-bold text-ink leading-snug">
              Bagaimana jika pemenang hari pertama berhenti bayar iuran harian?
            </h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Di <strong>btn TumbuhLayak</strong>, pemenang undian awal <strong>tidak langsung menerima sertifikat SHM</strong>. Sebelum seluruh iuran harian lunas 100%, akad berjalan dengan <strong>Skema Hak Huni Sewa-Beli (Rent-to-Own)</strong> dengan sertifikat ditahan Bank BTN &amp; dikendalikan Kartu Kunci Pintar NFC.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-[14px] bg-positive-soft/60 border border-positive-border space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-positive">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span>Jika Iuran Harian Lancar</span>
              </div>
              <ul className="space-y-1.5 text-xs text-ink-secondary leading-relaxed list-disc pl-4">
                <li>Pemenang langsung menghuni rumah dengan <strong>Kartu Kunci NFC Aktif</strong>.</li>
                <li>Autodebet harian Rp 50rb dari rekening BTN terus mencatat progres kepemilikan.</li>
                <li>Saat kewajiban iuran lunas 100%, Bank BTN menyerahkan <strong>SHM penuh atas nama peserta</strong>.</li>
              </ul>
            </div>

            <div className="p-4 rounded-[14px] bg-btnred-soft/60 border border-btnred-border space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-btnred">
                <Lock className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span>Jika Berhenti Bayar (Mangkir)</span>
              </div>
              <ul className="space-y-1.5 text-xs text-ink-secondary leading-relaxed list-disc pl-4">
                <li><strong>Kartu Kunci NFC dibekukan</strong> oleh Admin BTN &amp; hak huni rumah dicabut (tidak boleh menempati unit).</li>
                <li><strong>SHM/SHGB tetap aman disimpan Bank BTN</strong> — mustahil digadaikan atau dijual sepihak.</li>
                <li>Setoran sebelumnya <strong>dikonversi sebagai biaya sewa (rental)</strong> selama masa tinggal, dan unit dialihkan ke peserta pengganti agar kas arisan aman 100%.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. PROMO CTA FOOTER BANNER (Public Mode)                          */}
      {/* ================================================================= */}
      {isPublic && (
        <section className="rounded-[20px] btn-hero-surface text-white p-7 sm:p-9 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-ochre-gold">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>Simulasi pendaftaran 1 menit · domisili otomatis tersinkron</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
              Siap ikut Arisan Rumah Harian BTN di wilayah Anda?
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              Daftarkan biodata (Nama, NIK, TTL, No. Rekening BTN &amp; Domisili) untuk memilih perumahan mitra BTN di wilayah Anda dan memantau kuota undian harian.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => onOpenRegister?.('jabodetabek', 'grand-harmoni-park')}
              className="h-12 px-6 rounded-[11px] bg-btnred hover:bg-btnred-hover text-white font-display font-semibold text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <span>Daftar Sekarang</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onOpenLogin}
              className="h-12 px-5 rounded-[11px] bg-white/15 hover:bg-white/25 border border-white/25 text-white font-display font-semibold text-sm transition-colors whitespace-nowrap"
            >
              Masuk Akun
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
        <header className="max-w-[1220px] mx-auto bg-sheet/95 backdrop-blur-md border border-hairline rounded-[16px] shadow-[0_8px_28px_-10px_rgba(31,36,43,0.12)] px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <BtnLogo size="md" showTagline />

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={onOpenLogin}
              className="h-9 px-4 rounded-[9px] border border-control bg-sheet hover:bg-well text-[13px] font-semibold text-ink transition-colors"
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => onOpenRegister?.('jabodetabek', 'grand-harmoni-park')}
              className="h-9 px-4 rounded-[9px] bg-brand hover:bg-brand-hover text-white text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors"
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
          <span>btn TumbuhLayak · Prototipe Inovasi BTN Housingpreneur Batch 3</span>
          <span>Data proyek merujuk publikasi pengembang &amp; Kepmen PUPR 689/2023 · kuota peserta bersifat simulasi</span>
        </div>
      </footer>
    </div>
  );
};
