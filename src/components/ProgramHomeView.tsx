'use client';

import React, { useMemo, useState } from 'react';
import { DemoUser } from '../types';
import { ARISAN_LOCATION_ZONES, OFFICIAL_REGULATION_SOURCES } from '../data/arisanLocations';
import { calculateClusterScheme } from '../lib/clusterScheme';
import { formatRupiah } from '../lib/formatters';
import { BtnLogo } from './BtnLogo';
import { AnimatedNumber } from './AnimatedNumber';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  MapPin,
  ShieldCheck,
  Building2,
  Users,
  Wifi,
  Home,
  CreditCard,
} from 'lucide-react';

interface ProgramHomeViewProps {
  /** When logged in, renders as the personalized Beranda inside AppShell; when null, renders the full public promotional landing page */
  user: DemoUser | null;
  hasUnlockedNfc?: boolean;
  onOpenRegister?: (preselectedZoneId?: string) => void;
  onOpenLogin?: () => void;
  onGoToArisan?: (zoneId?: string) => void;
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
  const initialZoneId =
    user?.domicileZoneId && ARISAN_LOCATION_ZONES.some((z) => z.id === user.domicileZoneId)
      ? user.domicileZoneId
      : ARISAN_LOCATION_ZONES[0].id;

  const [previewZoneId, setPreviewZoneId] = useState<string>(initialZoneId);

  const previewZone = useMemo(
    () =>
      ARISAN_LOCATION_ZONES.find((z) => z.id === previewZoneId) || ARISAN_LOCATION_ZONES[0],
    [previewZoneId]
  );

  const previewSim = useMemo(
    () =>
      calculateClusterScheme({
        members: previewZone.defaultQuota,
        dailyContribution: previewZone.defaultDailyContribution,
        housePrice: previewZone.officialFlppPrice,
        annualPriceGrowth: previewZone.defaultInflationRate,
        akadPerDay: 5,
        readinessThreshold: 15000000,
        tenorYears: 20,
        kprRate: 0.05,
        downPaymentShare: 0.01,
        horizonYears: 6,
      }),
    [previewZone]
  );

  const isPublic = !user;

  const content = (
    <div className="space-y-10 animate-panel-enter">
      {/* ================================================================= */}
      {/* COLORFUL HERO BANNER (BTN Royal Blue + Red + Gold + Warm Cream)   */}
      {/* ================================================================= */}
      <section className="rounded-[20px] border border-hairline bg-gradient-to-br from-[#EEF4FD] via-[#FCFBF8] to-[#FEF7EA] p-6 sm:p-8 lg:p-10 overflow-hidden relative">
        {/* Soft decorative BTN color accents (gentle pastel, low glare) */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-brand/10 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/3 w-56 h-56 rounded-full bg-ochre-gold/15 blur-2xl"
          aria-hidden="true"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Copy & Action Buttons */}
          <div className="lg:col-span-6 space-y-5">
            {isPublic ? (
              <div className="inline-flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand text-white text-xs font-semibold">
                  <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Program BTN Housingpreneur Batch 3
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-btnred-soft text-btnred border border-btnred-border text-xs font-semibold">
                  Arisan Klaster + KPR FLPP
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
                  Punya rumah BTN pertama lebih ringan,{' '}
                  <span className="text-brand">tumbuh bersama keluarga</span>
                </>
              ) : (
                <>
                  Siap wujudkan rumah impian BTN di{' '}
                  <span className="text-brand">{previewZone.shortLabel}</span>?
                </>
              )}
            </h1>

            <p className="text-[15px] text-ink-secondary leading-relaxed">
              {isPublic
                ? 'Mulai nabung harian bareng klaster wilayah domisili Anda untuk menyiapkan akad KPR FLPP BTN, terima Kartu Kunci Pintar NFC, dan rancang denah rumah tumbuh sesuai rencana keluarga.'
                : 'Wilayah klaster arisan Anda otomatis disesuaikan dengan data domisili di akun BTN Anda. Pantau kesiapan akad, cek kelayakan, atau kelola denah rumah tumbuh kapan saja.'}
            </p>

            {/* Primary CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {isPublic ? (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenRegister?.(previewZone.id)}
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

            {/* Warm Trust Highlights */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-xs text-ink-secondary">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand" aria-hidden="true" />
                Acuan resmi Kepmen PUPR 689/2023
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-btnred" aria-hidden="true" />
                Bunga KPR FLPP 5% tetap
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-positive" aria-hidden="true" />
                Tabungan tetap milik nasabah
              </span>
            </div>
          </div>

          {/* Right Friendly BTN Cartoon Illustration */}
          <div className="lg:col-span-6">
            <div className="relative rounded-[18px] bg-[#F6F4EF] border border-hairline p-3 sm:p-4 shadow-[0_14px_34px_-18px_rgba(31,36,43,0.18)]">
              <img
                src="/illustrations/hero-home-btn.jpg"
                alt="Ilustrasi keluarga muda Indonesia di depan rumah KPR BTN memegang kunci dan kartu pintar"
                className="w-full h-auto rounded-[13px] object-cover block"
              />
              {/* Friendly colorful floating pill badges */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5 px-0.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sheet border border-hairline text-[11px] font-semibold text-brand whitespace-nowrap">
                  <Home className="w-3 h-3" aria-hidden="true" />
                  Tipe 36/60 · 30/60 · 36/72
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ochre-soft border border-ochre-border text-[11px] font-semibold text-ochre whitespace-nowrap">
                  Mulai Rp 50rb/hari
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-positive-soft border border-positive-border text-[11px] font-semibold text-positive whitespace-nowrap">
                  Kartu Kunci NFC
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
              <span className="text-ink-secondary">Zona KPR otomatis:</span>{' '}
              <strong className="text-brand">{previewZone.regionName}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onGoToArisan?.(user.domicileZoneId)}
            className="self-start md:self-auto text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 whitespace-nowrap"
          >
            <span>Lihat klaster domisili saya</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </section>
      )}

      {/* ================================================================= */}
      {/* INTERACTIVE QUICK TOOL: "TERTARIK? CEK ESTIMASI WILAYAHMU DULU!"  */}
      {/* ================================================================= */}
      <section
        id="cek-wilayah"
        aria-label="Alat cek cepat estimasi rumah subsidi per wilayah"
        className="rounded-[18px] border border-brand-border/80 bg-sheet p-6 sm:p-7 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-btnred uppercase tracking-wide">
              {isPublic ? 'Cek cepat 10 detik' : 'Ringkasan domisili akun'}
            </span>
            <h2 className="font-display text-lg sm:text-xl font-bold text-ink mt-0.5">
              {isPublic
                ? 'Pilih domisili Anda untuk melihat harga rumah subsidi BTN'
                : `Harga & estimasi rumah subsidi BTN wilayah ${previewZone.regionName}`}
            </h2>
          </div>
          <a
            href={OFFICIAL_REGULATION_SOURCES.kepmenPupr689Url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand font-medium hover:underline"
          >
            Acuan Kepmen PUPR 689/2023 (berlaku sejak 2024)
          </a>
        </div>

        {/* Friendly 7-Region Pill Selector (Public visitors only; logged-in users stay strictly on their domicile!) */}
        {isPublic && (
          <div className="flex flex-wrap gap-2">
            {ARISAN_LOCATION_ZONES.map((z) => {
              const active = z.id === previewZone.id;
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setPreviewZoneId(z.id)}
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

        {/* 3 Colorful, Easy-to-Read Summary Cards + Direct Register CTA */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
          <div className="p-4 rounded-[14px] bg-brand-soft/75 border border-brand-border space-y-1">
            <div className="text-xs text-brand font-medium">Plafon rumah subsidi</div>
            <div className="font-display text-xl font-bold text-ink tabular-nums">
              <AnimatedNumber
                value={previewZone.officialFlppPrice}
                format={(n) => formatRupiah(n, true)}
              />
            </div>
            <div className="text-xs text-ink-secondary truncate">{previewZone.sampleCities}</div>
          </div>

          <div className="p-4 rounded-[14px] bg-ochre-soft/80 border border-ochre-border space-y-1">
            <div className="text-xs text-ochre font-medium">Bantuan uang muka (SBUM)</div>
            <div className="font-display text-xl font-bold text-ink tabular-nums">
              {formatRupiah(previewZone.sbumAmount, true)}
            </div>
            <div className="text-xs text-ink-secondary">Bantuan pemerintah resmi</div>
          </div>

          <div className="p-4 rounded-[14px] bg-positive-soft/80 border border-positive-border space-y-1">
            <div className="text-xs text-positive font-medium">Estimasi angsuran FLPP</div>
            <div className="font-display text-xl font-bold text-ink tabular-nums">
              <AnimatedNumber
                value={previewSim.monthlyInstallment}
                format={(n) => formatRupiah(Math.round(n))}
              />
              <span className="text-xs font-sans font-normal text-ink-secondary">/bln</span>
            </div>
            <div className="text-xs text-ink-secondary">Tenor 20 thn · bunga 5%</div>
          </div>

          <div className="p-4 rounded-[14px] btn-kpi-surface text-white flex flex-col justify-between gap-3">
            <div className="text-xs text-blue-100 leading-snug">
              Tertarik dengan klaster <strong className="text-white">{previewZone.shortLabel}</strong>?
            </div>
            <button
              type="button"
              onClick={() =>
                isPublic
                  ? onOpenRegister?.(previewZone.id)
                  : onGoToArisan?.(previewZone.id)
              }
              className="w-full h-10 px-3 rounded-[9px] bg-sheet text-brand hover:bg-brand-soft font-display font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>{isPublic ? 'Daftar Wilayah Ini' : 'Buka Wilayah Ini'}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3 COLORFUL ILLUSTRATED PROGRAM STORY CARDS                        */}
      {/* ================================================================= */}
      <section id="cara-kerja" aria-label="Tiga langkah mudah program btn TumbuhLayak" className="space-y-5">
        <div className="text-center max-w-2xl mx-auto space-y-1.5">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-ochre-soft text-ochre border border-ochre-border text-xs font-semibold">
            3 Langkah Sederhana · Tanpa Ribet
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-ink">
            Bagaimana btn TumbuhLayak membantu Anda punya rumah?
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Arisan Klaster */}
          <article className="rounded-[18px] border border-brand-border/80 bg-sheet overflow-hidden flex flex-col">
            <div className="bg-[#FCFBF8] p-4 border-b border-rule">
              <img
                src="/illustrations/step-arisan-saving.jpg"
                alt="Ilustrasi menabung bersama di klaster rumah BTN"
                className="w-full aspect-[4/3] object-cover rounded-[12px]"
              />
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between gap-3">
              <div className="space-y-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-brand-soft text-brand text-xs font-bold">
                  Langkah 1 · Menabung Kolektif
                </span>
                <h3 className="font-display text-base font-bold text-ink">
                  Arisan Klaster + KPR FLPP BTN
                </h3>
                <p className="text-[13px] text-ink-secondary leading-relaxed">
                  Tabung rutin sesuai kemampuan di rekening BTN milik sendiri untuk menyiapkan DP & biaya akad, sehingga waktu tunggu jauh lebih singkat dibanding arisan tunai biasa.
                </p>
              </div>
            </div>
          </article>

          {/* Card 2: Kartu Kunci NFC */}
          <article className="rounded-[18px] border border-btnred-border bg-sheet overflow-hidden flex flex-col">
            <div className="bg-gradient-to-br from-[#163F92] to-[#1B56C6] p-6 aspect-[4/3] flex flex-col items-center justify-center relative overflow-hidden border-b border-rule">
              <div
                className="w-40 h-40 rounded-full bg-white/10 absolute -top-10 -right-10"
                aria-hidden="true"
              />
              <div
                className="w-32 h-32 rounded-full bg-btnred/30 absolute -bottom-10 -left-8"
                aria-hidden="true"
              />
              {/* Stylized BTN Smart Key Card Visual */}
              <div className="relative z-10 w-full max-w-[260px] rounded-[16px] bg-sheet text-ink p-4 shadow-[0_14px_30px_-10px_rgba(0,0,0,0.35)] border border-white/60 space-y-4">
                <div className="flex items-center justify-between">
                  <BtnLogo size="sm" />
                  <span className="w-8 h-8 rounded-full bg-brand-soft text-brand flex items-center justify-center">
                    <Wifi className="w-4 h-4" aria-hidden="true" />
                  </span>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] uppercase tracking-wider text-ink-subtle font-semibold">
                    Kartu Kunci Pintar NFC
                  </div>
                  <div className="font-mono text-sm font-bold text-brand">BTN-NFC-3672-0014</div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-ink-secondary pt-1 border-t border-rule">
                  <span>Tipe 36/72 BTN</span>
                  <span className="px-2 py-0.5 rounded-full bg-positive-soft text-positive font-semibold">
                    Terverifikasi
                  </span>
                </div>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between gap-3">
              <div className="space-y-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-btnred-soft text-btnred text-xs font-bold">
                  Langkah 2 · Serah Terima Digital
                </span>
                <h3 className="font-display text-base font-bold text-ink">
                  Kartu Kunci Pintar NFC BTN
                </h3>
                <p className="text-[13px] text-ink-secondary leading-relaxed">
                  Saat akad selesai, Anda menerima kartu kunci fisik berchip NFC. Cukup pindai di website untuk membuka data sertifikat, denah asli rumah, dan estimasi nilainya.
                </p>
              </div>
            </div>
          </article>

          {/* Card 3: Rumah Tumbuh & Denah */}
          <article className="rounded-[18px] border border-positive-border bg-sheet overflow-hidden flex flex-col">
            <div className="bg-[#FCFBF8] p-4 border-b border-rule">
              <img
                src="/illustrations/step-growing-house.jpg"
                alt="Ilustrasi rumah tumbuh BTN berkembang menjadi dua lantai lengkap dengan denah"
                className="w-full aspect-[4/3] object-cover rounded-[12px]"
              />
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between gap-3">
              <div className="space-y-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-positive-soft text-positive text-xs font-bold">
                  Langkah 3 · Tumbuh Bertahap
                </span>
                <h3 className="font-display text-base font-bold text-ink">
                  Editor Denah & Nilai Rumah Tumbuh
                </h3>
                <p className="text-[13px] text-ink-secondary leading-relaxed">
                  Susun rencana dapur, kanopi, kamar tambahan, hingga lantai 2 langsung di denah rumah BTN Anda, lengkap dengan estimasi biaya RAB dan proyeksi nilai aset.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* ================================================================= */}
      {/* FRIENDLY PROMO CTA FOOTER BANNER (Public Mode)                    */}
      {/* ================================================================= */}
      {isPublic && (
        <section className="rounded-[20px] btn-hero-surface text-white p-7 sm:p-9 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-ochre-gold">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>Simulasi pendaftaran cepat · data domisili langsung tersinkron</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
              Tertarik ikut Arisan Rumah BTN di wilayah Anda?
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              Daftarkan data diri (Nama, NIK, TTL, No. Rekening BTN & Domisili) dalam 1 menit — wilayah klaster akan otomatis menyesuaikan biodata Anda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => onOpenRegister?.(previewZone.id)}
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

  // Inside AppShell (logged-in): render content directly
  if (!isPublic) {
    return content;
  }

  // Public Promotional Landing Page: wrap with its own clean floating BTN navbar + footer
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
              onClick={() => onOpenRegister?.(previewZone.id)}
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
          <span>Data peserta & simulasi bersifat ilustratif · acuan harga resmi Kepmen PUPR 689/2023</span>
        </div>
      </footer>
    </div>
  );
};
