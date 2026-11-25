'use client';

import React, { useState } from 'react';
import { DemoUser } from '../types';
import { DEMO_USERS } from '../data/nfcPropertyRegistry';
import { loginSchema } from '../lib/validation';
import { BtnLogo } from './BtnLogo';
import {
  AlertCircle,
  ArrowRight,
  Lock,
  Mail,
  Wifi,
  Users,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: DemoUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState(DEMO_USERS[0].email);
  const [pin, setPin] = useState('123456');
  const [errors, setErrors] = useState<{ email?: string; pin?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, pin });
    if (!parsed.success) {
      const nextErrs: { email?: string; pin?: string } = {};
      parsed.error.issues.forEach((iss) => {
        const key = iss.path[0] as 'email' | 'pin';
        if (key) nextErrs[key] = iss.message;
      });
      setErrors(nextErrs);
      return;
    }

    setErrors({});
    const matched = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === parsed.data.email.toLowerCase()
    );

    if (matched) {
      onLoginSuccess({ ...matched });
    } else {
      // Allow any valid demo email to enter Layer 1 as a new Arisan participant
      const displayName = parsed.data.email
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      onLoginSuccess({
        id: `user-${Date.now()}`,
        email: parsed.data.email,
        name: displayName || 'Nasabah BTN',
        roleLabel: 'Peserta Arisan Aktif · Menunggu Undian',
        arisanGroupName: 'Kelompok Arisan BTN Sejahtera Cikarang (24 Peserta)',
        arisanSlotNumber: 7,
        paidMonths: 14,
        totalCycleMonths: 48,
        monthlyContribution: 1450000,
        hasReceivedUnit: false,
        assignedNfcUid: null,
      });
    }
  };

  return (
    <div className="min-h-screen bg-frame flex flex-col lg:flex-row">
      {/* Left Brand Showcase Panel (Official btn.co.id Dynamic Blue #125EFA + Stable Red #DC0714) */}
      <section className="order-2 lg:order-1 lg:w-[48%] xl:w-[46%] btn-hero-surface text-white px-6 py-8 sm:px-10 lg:px-12 lg:py-12 flex flex-col justify-between relative overflow-hidden">
        <div className="space-y-8 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <BtnLogo inverted size="lg" showTagline />
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-medium text-white whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-btnred flex-shrink-0" aria-hidden="true" />
              Housingpreneur Batch 3
            </span>
          </div>

          <div className="space-y-3 max-w-lg">
            <h1 className="font-display text-2xl sm:text-3xl lg:text-[32px] font-bold leading-tight tracking-tight text-white">
              Dari arisan rumah kolektif menuju hunian tumbuh bernilai tinggi
            </h1>
            <p className="text-sm sm:text-[15px] text-blue-100 leading-relaxed">
              Ekosistem digital Bank BTN yang menghubungkan skema arisan kepemilikan rumah inti, autentikasi kartu kunci rumah NFC, hingga perencanaan renovasi bertahap dan valuasi penyusutan aset.
            </p>
          </div>

          {/* 3-Step Ecosystem Architecture Preview */}
          <div className="space-y-3 max-w-lg">
            <div className="p-4 rounded-card bg-white/10 border border-white/15 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-control bg-white text-brand flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <div className="font-display font-semibold text-sm text-white">
                  Arisan Rumah Bank BTN
                </div>
                <p className="text-[13px] text-blue-100 mt-0.5 leading-relaxed">
                  Kelompok tabungan hunian kolektif dalam rekening escrow BTN untuk memudahkan kepemilikan rumah inti secara bergilir.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-card bg-white/10 border border-white/15 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-control bg-btnred text-white flex items-center justify-center flex-shrink-0">
                <Wifi className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <div className="font-display font-semibold text-sm text-white">
                  Scan Kartu Kunci Rumah Anda (NFC)
                </div>
                <p className="text-[13px] text-blue-100 mt-0.5 leading-relaxed">
                  Penerima rumah memperoleh kartu kunci fisik berchip NFC. Pindai kartu rumah Anda di web untuk mencocokkan data sertifikat dan denah unit.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-card bg-white/10 border border-white/15 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-control bg-white text-brand flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <div className="font-display font-semibold text-sm text-white">
                  Rencana Pembangunan & Nilai Rumah Sekarang
                </div>
                <p className="text-[13px] text-blue-100 mt-0.5 leading-relaxed">
                  Jika sudah memiliki rumah, Anda dapat merencanakan renovasi bertahap, mengatur denah, serta mengetahui harga rumah sekarang setelah penyusutan maupun renovasi.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-100 relative z-10">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-white" aria-hidden="true" />
            Portal nasabah terenkripsi · Rekening Escrow BTN
          </span>
          <span>PT Bank Tabungan Negara (Persero) Tbk</span>
        </div>
      </section>

      {/* Right Authentication Form Panel */}
      <main className="order-1 lg:order-2 flex-1 flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-[440px] bg-sheet border border-hairline rounded-sheet p-6 sm:p-8 space-y-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <BtnLogo size="sm" />
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-soft text-brand">
                Portal Nasabah
              </span>
            </div>
            <h2 className="font-display text-xl font-bold text-ink pt-1">
              Masuk ke TumbuhLayak
            </h2>
            <p className="text-sm text-ink-secondary">
              Akses kelompok arisan rumah BTN Anda atau pindai kartu kunci NFC untuk mengelola renovasi rumah tumbuh.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-[13px] font-medium text-ink mb-1.5">
                Email / ID Nasabah BTN
              </label>
              <div className="relative">
                <Mail
                  className="w-4 h-4 text-ink-subtle absolute left-3.5 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.id"
                  className="w-full h-11 pl-10 pr-3.5 rounded-control border border-control bg-sheet text-sm text-ink focus:border-brand focus:outline-none"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-btnred flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="login-pin" className="block text-[13px] font-medium text-ink mb-1.5">
                Kata sandi / PIN Akses
              </label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 text-ink-subtle absolute left-3.5 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  id="login-pin"
                  type="password"
                  autoComplete="current-password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full h-11 pl-10 pr-3.5 rounded-control border border-control bg-sheet text-sm text-ink focus:border-brand focus:outline-none"
                />
              </div>
              {errors.pin && (
                <p className="mt-1.5 text-xs text-btnred flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                  {errors.pin}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full h-11 rounded-control bg-brand hover:bg-brand-hover text-white font-display font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
            >
              <span>Masuk ke Portal Arisan & Rumah Tumbuh</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>

          {/* 1-Click Demo Personas for Live Pitching */}
          <div className="pt-5 border-t border-rule space-y-2.5">
            <div className="text-xs font-semibold text-ink-secondary">
              Akses cepat akun demo (untuk presentasi juri)
            </div>
            <div className="space-y-2">
              {DEMO_USERS.map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => onLoginSuccess({ ...demo })}
                  className="w-full text-left p-3 rounded-control border border-hairline bg-well hover:border-brand-border hover:bg-brand-soft/60 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink truncate">
                        {demo.name}
                      </span>
                      {demo.hasReceivedUnit ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-positive-soft text-positive text-xs font-medium whitespace-nowrap">
                          <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                          Punya Kartu NFC
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-brand-soft text-brand text-xs font-medium whitespace-nowrap">
                          Peserta Arisan
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-secondary mt-0.5 truncate">
                      {demo.email} · {demo.hasReceivedUnit ? demo.assignedNfcUid : 'Belum serah terima unit'}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-brand flex-shrink-0" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
