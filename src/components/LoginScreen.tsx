'use client';

import React, { useState } from 'react';
import { DemoUser } from '../types';
import { DEMO_USERS } from '../data/nfcPropertyRegistry';
import { ARISAN_LOCATION_ZONES } from '../data/arisanLocations';
import { loginSchema, registerSchema } from '../lib/validation';
import { BtnLogo } from './BtnLogo';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Lock,
  Mail,
  Wifi,
  Users,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  User,
  CreditCard,
  MapPin,
  Calendar,
  IdCard,
} from 'lucide-react';

interface LoginScreenProps {
  initialMode?: 'login' | 'register';
  preselectedZoneId?: string;
  allUsers?: DemoUser[];
  onBackToHome?: () => void;
  onLoginSuccess: (user: DemoUser, isNewRegistration?: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  initialMode = 'login',
  preselectedZoneId,
  allUsers = DEMO_USERS,
  onBackToHome,
  onLoginSuccess,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>(initialMode);

  // Login state (default to Budi Santoso customer demo email)
  const defaultCustomer = allUsers.find((u) => u.role !== 'admin') || DEMO_USERS[0];
  const [email, setEmail] = useState(defaultCustomer.email);
  const [pin, setPin] = useState('123456');
  const [loginErrors, setLoginErrors] = useState<{ email?: string; pin?: string }>({});

  // Registration KYC state
  const defaultZoneId =
    preselectedZoneId && ARISAN_LOCATION_ZONES.some((z) => z.id === preselectedZoneId)
      ? preselectedZoneId
      : ARISAN_LOCATION_ZONES[0].id;

  const [regName, setRegName] = useState('');
  const [regNik, setRegNik] = useState('');
  const [regBirthPlace, setRegBirthPlace] = useState('');
  const [regBirthDate, setRegBirthDate] = useState('1997-06-15');
  const [hasBtnAccount, setHasBtnAccount] = useState(true);
  const [regBtnAccount, setRegBtnAccount] = useState('');
  const [regDomicileZoneId, setRegDomicileZoneId] = useState(defaultZoneId);
  const [regDomicileCity, setRegDomicileCity] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  const selectedRegZone =
    ARISAN_LOCATION_ZONES.find((z) => z.id === regDomicileZoneId) || ARISAN_LOCATION_ZONES[0];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, pin });
    if (!parsed.success) {
      const nextErrs: { email?: string; pin?: string } = {};
      parsed.error.issues.forEach((iss) => {
        const key = iss.path[0] as 'email' | 'pin';
        if (key) nextErrs[key] = iss.message;
      });
      setLoginErrors(nextErrs);
      return;
    }

    setLoginErrors({});
    const matched = allUsers.find(
      (u) => u.email.toLowerCase() === parsed.data.email.toLowerCase()
    );

    if (matched) {
      onLoginSuccess({ ...matched });
    } else {
      const displayName = parsed.data.email
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      onLoginSuccess(
        {
          id: `user-${Date.now()}`,
          role: 'customer',
          email: parsed.data.email,
          name: displayName || 'Nasabah BTN',
          roleLabel: 'Peserta Arisan Aktif · Menunggu Undian',
          domicileCity: 'Bandung, Jawa Barat',
          domicileZoneId: 'jawa',
          lotteryStatus: 'menunggu',
          btnAccountNumber: '0026015004821901',
          arisanGroupName: 'Simulasi Klaster Jawa',
          arisanSlotNumber: 7,
          paidMonths: 10,
          totalCycleMonths: 48,
          monthlyContribution: 1500000,
          hasReceivedUnit: false,
          assignedNfcUid: null,
        },
        true
      );
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = registerSchema.safeParse({
      name: regName,
      nik: regNik.replace(/\D/g, ''),
      birthPlace: regBirthPlace,
      birthDate: regBirthDate,
      hasBtnAccount,
      btnAccountNumber: regBtnAccount,
      domicileZoneId: regDomicileZoneId,
      domicileCity: regDomicileCity,
      email: regEmail,
      pin: regPin,
    });

    if (!parsed.success) {
      const nextErrs: Record<string, string> = {};
      parsed.error.issues.forEach((iss) => {
        const key = String(iss.path[0] || '');
        if (key && !nextErrs[key]) nextErrs[key] = iss.message;
      });
      setRegErrors(nextErrs);
      return;
    }

    setRegErrors({});
    const zone =
      ARISAN_LOCATION_ZONES.find((z) => z.id === parsed.data.domicileZoneId) ||
      ARISAN_LOCATION_ZONES[0];

    const cleanedAcc = parsed.data.hasBtnAccount
      ? (parsed.data.btnAccountNumber || '').replace(/[\s-]/g, '')
      : `00260150${String(Date.now()).slice(-8)}`;

    onLoginSuccess(
      {
        id: `user-${Date.now()}`,
        role: 'customer',
        email: parsed.data.email,
        name: parsed.data.name,
        nik: parsed.data.nik,
        birthPlace: parsed.data.birthPlace,
        birthDate: parsed.data.birthDate,
        btnAccountNumber: cleanedAcc,
        domicileCity: parsed.data.domicileCity,
        domicileZoneId: zone.id,
        lotteryStatus: 'menunggu',
        roleLabel: `Peserta Baru · ${zone.shortLabel}`,
        arisanGroupName: zone.clusterName,
        arisanSlotNumber: zone.registeredMembers + 1,
        paidMonths: 1,
        totalCycleMonths: 48,
        monthlyContribution: zone.defaultDailyContribution * 30,
        hasReceivedUnit: false,
        assignedNfcUid: null,
      },
      true
    );
  };

  return (
    <div className="min-h-screen bg-frame flex flex-col lg:flex-row">
      {/* Left Shared BTN Showcase Panel (Identical design for both Login & Register!) */}
      <section className="order-2 lg:order-1 lg:w-[46%] xl:w-[44%] btn-hero-surface text-white px-6 py-8 sm:px-10 lg:px-11 lg:py-10 flex flex-col justify-between relative overflow-hidden">
        <div className="space-y-6 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <BtnLogo inverted size="lg" showTagline />
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-medium text-white whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-ochre-gold flex-shrink-0" aria-hidden="true" />
              Housingpreneur Batch 3
            </span>
          </div>

          {/* Warm BTN Cartoon Illustration Card */}
          <div className="rounded-[16px] bg-[#F6F4EF] p-2.5 shadow-[0_14px_30px_-14px_rgba(0,0,0,0.35)] max-w-md">
            <img
              src="/illustrations/hero-home-btn.jpg"
              alt="Ilustrasi keluarga muda Indonesia di depan rumah KPR BTN"
              className="w-full h-auto rounded-[11px] block"
            />
          </div>

          <div className="space-y-2 max-w-lg">
            <h1 className="font-display text-2xl sm:text-[26px] font-bold leading-snug tracking-tight text-white">
              {authMode === 'register'
                ? 'Satu langkah mudah menuju rumah BTN pertama Anda'
                : 'Dari arisan rumah kolektif menuju hunian tumbuh bernilai tinggi'}
            </h1>
            <p className="text-[13.5px] text-blue-100 leading-relaxed">
              {authMode === 'register'
                ? 'Lengkapi biodata nasabah agar sistem otomatis menyesuaikan klaster rumah subsidi dan plafon KPR FLPP sesuai domisili Anda.'
                : 'Ekosistem digital Bank BTN yang menghubungkan arisan klaster KPR FLPP, kartu kunci rumah NFC, dan editor denah rumah tumbuh.'}
            </p>
          </div>

          {/* Compact 3-Step Highlights */}
          <div className="space-y-2.5 max-w-lg">
            <div className="p-3.5 rounded-card bg-white/10 border border-white/15 flex items-center gap-3">
              <div className="w-8 h-8 rounded-control bg-white text-brand flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="text-[13px] text-blue-50">
                <strong className="text-white">Arisan Klaster + KPR FLPP</strong> · wilayah otomatis sesuai domisili biodata
              </div>
            </div>

            <div className="p-3.5 rounded-card bg-white/10 border border-white/15 flex items-center gap-3">
              <div className="w-8 h-8 rounded-control bg-btnred text-white flex items-center justify-center flex-shrink-0">
                <Wifi className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="text-[13px] text-blue-50">
                <strong className="text-white">Kartu Kunci Pintar NFC</strong> · verifikasi sertifikat & denah rumah asli
              </div>
            </div>

            <div className="p-3.5 rounded-card bg-white/10 border border-white/15 flex items-center gap-3">
              <div className="w-8 h-8 rounded-control bg-ochre-gold text-ink flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="text-[13px] text-blue-50">
                <strong className="text-white">Denah & Nilai Rumah Tumbuh</strong> · rencanakan renovasi bertahap + RAB
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-100 relative z-10">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-white" aria-hidden="true" />
            Portal nasabah · Rekening BTN
          </span>
          <span>PT Bank Tabungan Negara (Persero) Tbk</span>
        </div>
      </section>

      {/* Right Unified Authentication Card (Same visual system for Login & Registration) */}
      <main className="order-1 lg:order-2 flex-1 flex items-center justify-center px-4 py-8 sm:px-8 lg:px-10">
        <div
          className={`w-full ${
            authMode === 'register' ? 'max-w-[540px]' : 'max-w-[440px]'
          } bg-sheet border border-hairline rounded-sheet p-6 sm:p-8 space-y-5 transition-[max-width] duration-200`}
        >
          {/* Back to Promotional Beranda + Unified Masuk/Daftar Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {onBackToHome ? (
              <button
                type="button"
                onClick={onBackToHome}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-brand transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Kembali ke Beranda</span>
              </button>
            ) : (
              <BtnLogo size="sm" />
            )}

            <div
              className="inline-flex bg-well p-1 rounded-[10px] border border-hairline"
              role="tablist"
              aria-label="Pilih masuk atau daftar akun baru"
            >
              <button
                type="button"
                role="tab"
                aria-selected={authMode === 'login'}
                onClick={() => setAuthMode('login')}
                className={`px-3.5 py-1.5 rounded-[7px] text-xs font-semibold transition-colors ${
                  authMode === 'login'
                    ? 'bg-sheet text-brand border border-hairline shadow-[0_1px_2px_rgba(31,36,43,0.06)]'
                    : 'text-ink-secondary hover:text-ink border border-transparent'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={authMode === 'register'}
                onClick={() => setAuthMode('register')}
                className={`px-3.5 py-1.5 rounded-[7px] text-xs font-semibold transition-colors ${
                  authMode === 'register'
                    ? 'bg-sheet text-brand border border-hairline shadow-[0_1px_2px_rgba(31,36,43,0.06)]'
                    : 'text-ink-secondary hover:text-ink border border-transparent'
                }`}
              >
                Daftar Sekarang
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="font-display text-xl font-bold text-ink">
              {authMode === 'login'
                ? 'Masuk ke TumbuhLayak'
                : 'Daftar Peserta Arisan Rumah BTN'}
            </h2>
            <p className="text-[13px] text-ink-secondary">
              {authMode === 'login'
                ? 'Akses kelompok arisan rumah BTN Anda atau pindai kartu kunci NFC.'
                : 'Lengkapi data diri seperti pembukaan rekening perbankan agar klaster wilayah langsung menyesuaikan domisili Anda.'}
            </p>
          </div>

          {/* =============================================================== */}
          {/* MODE 1: LOGIN FORM                                              */}
          {/* =============================================================== */}
          {authMode === 'login' ? (
            <>
              <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
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
                  {loginErrors.email && (
                    <p className="mt-1.5 text-xs text-btnred flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                      {loginErrors.email}
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
                  {loginErrors.pin && (
                    <p className="mt-1.5 text-xs text-btnred flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                      {loginErrors.pin}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-control bg-brand hover:bg-brand-hover text-white font-display font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Masuk ke Portal TumbuhLayak</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </form>

              {/* 1-Click Demo Personas (Admin BTN + 2 Customers + any newly registered user) */}
              <div className="pt-4 border-t border-rule space-y-2.5">
                <div className="text-xs font-semibold text-ink-secondary">
                  Akses cepat akun demo (Admin BTN &amp; Nasabah)
                </div>
                <div className="space-y-2">
                  {allUsers
                    .filter(
                      (u) =>
                        u.id === 'admin-btn-01' ||
                        u.id === 'user-budi' ||
                        u.id === 'user-siti' ||
                        u.id.startsWith('user-1')
                    )
                    .slice(0, 4)
                    .map((demo) => (
                      <button
                        key={demo.id}
                        type="button"
                        onClick={() => onLoginSuccess({ ...demo })}
                        className={`w-full text-left p-3 rounded-control border transition-colors flex items-center justify-between gap-3 ${
                          demo.role === 'admin'
                            ? 'border-btnred-border bg-btnred-soft/50 hover:bg-btnred-soft'
                            : 'border-hairline bg-well hover:border-brand-border hover:bg-brand-soft/60'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-ink truncate">
                              {demo.name}
                            </span>
                            {demo.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-btnred text-white text-[11px] font-semibold whitespace-nowrap">
                                <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                                Admin BTN
                              </span>
                            ) : demo.hasReceivedUnit ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-positive-soft text-positive text-xs font-medium whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                                Punya Kartu NFC
                              </span>
                            ) : demo.lotteryStatus === 'terpilih-akad' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-ochre-soft text-ochre text-xs font-medium whitespace-nowrap">
                                Terpilih Akad
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-brand-soft text-brand text-xs font-medium whitespace-nowrap">
                                Peserta Arisan
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-ink-secondary mt-0.5 truncate">
                            {demo.role === 'admin'
                              ? `${demo.email} · Undian arisan & pemrograman Kartu NFC`
                              : `${demo.domicileCity || 'Indonesia'} · ${
                                  demo.hasReceivedUnit
                                    ? demo.assignedNfcUid
                                    : demo.lotteryStatus === 'terpilih-akad'
                                    ? 'Menunggu kartu NFC diprogram Admin'
                                    : 'Menunggu undian Admin BTN'
                                }`}
                          </div>
                        </div>
                        <ArrowRight
                          className={`w-4 h-4 flex-shrink-0 ${
                            demo.role === 'admin' ? 'text-btnred' : 'text-brand'
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    ))}
                </div>
              </div>
            </>
          ) : (
            /* ============================================================= */
            /* MODE 2: BANK KYC REGISTRATION FORM                            */
            /* ============================================================= */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5" noValidate>
              {/* Row 1: Nama Lengkap + NIK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-medium text-ink mb-1">
                    Nama lengkap (sesuai KTP)
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      id="reg-name"
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Contoh: Raka Pratama"
                      className="w-full h-10 pl-9 pr-3 rounded-control border border-control bg-sheet text-sm text-ink focus:border-brand focus:outline-none"
                    />
                  </div>
                  {regErrors.name && (
                    <p className="mt-1 text-[11px] text-btnred">{regErrors.name}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="reg-nik" className="text-xs font-medium text-ink">
                      NIK (16 digit KTP)
                    </label>
                    <span className="text-[11px] font-mono text-ink-subtle">
                      {regNik.replace(/\D/g, '').length}/16
                    </span>
                  </div>
                  <div className="relative">
                    <IdCard className="w-3.5 h-3.5 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      id="reg-nik"
                      type="text"
                      inputMode="numeric"
                      maxLength={16}
                      value={regNik}
                      onChange={(e) => setRegNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      placeholder="327501xxxxxxxxxx"
                      className="w-full h-10 pl-9 pr-3 rounded-control border border-control bg-sheet text-sm font-mono tabular-nums text-ink focus:border-brand focus:outline-none"
                    />
                  </div>
                  {regErrors.nik && (
                    <p className="mt-1 text-[11px] text-btnred">{regErrors.nik}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Tempat & Tanggal Lahir (TTL) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-birthplace" className="block text-xs font-medium text-ink mb-1">
                    Tempat lahir
                  </label>
                  <input
                    id="reg-birthplace"
                    type="text"
                    value={regBirthPlace}
                    onChange={(e) => setRegBirthPlace(e.target.value)}
                    placeholder="Contoh: Makassar"
                    className="w-full h-10 px-3 rounded-control border border-control bg-sheet text-sm text-ink focus:border-brand focus:outline-none"
                  />
                  {regErrors.birthPlace && (
                    <p className="mt-1 text-[11px] text-btnred">{regErrors.birthPlace}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="reg-birthdate" className="block text-xs font-medium text-ink mb-1">
                    Tanggal lahir
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                    <input
                      id="reg-birthdate"
                      type="date"
                      value={regBirthDate}
                      onChange={(e) => setRegBirthDate(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 rounded-control border border-control bg-sheet text-sm font-mono text-ink focus:border-brand focus:outline-none"
                    />
                  </div>
                  {regErrors.birthDate && (
                    <p className="mt-1 text-[11px] text-btnred">{regErrors.birthDate}</p>
                  )}
                </div>
              </div>

              {/* Row 3: Domisili Wilayah (Auto-syncs Ringkasan & Wilayah!) + Kota */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-zone" className="block text-xs font-medium text-ink mb-1">
                    Wilayah domisili (Zona FLPP)
                  </label>
                  <select
                    id="reg-zone"
                    value={regDomicileZoneId}
                    onChange={(e) => setRegDomicileZoneId(e.target.value)}
                    className="w-full h-10 px-3 rounded-control border border-control bg-sheet text-sm text-ink focus:border-brand focus:outline-none"
                  >
                    {ARISAN_LOCATION_ZONES.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.shortLabel} · Rp {Math.round(z.officialFlppPrice / 1000000)} Jt
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="reg-city" className="block text-xs font-medium text-ink mb-1">
                    Kota / Kabupaten domisili
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      id="reg-city"
                      type="text"
                      value={regDomicileCity}
                      onChange={(e) => setRegDomicileCity(e.target.value)}
                      placeholder={selectedRegZone.sampleCities.split(',')[0]}
                      className="w-full h-10 pl-9 pr-3 rounded-control border border-control bg-sheet text-sm text-ink focus:border-brand focus:outline-none"
                    />
                  </div>
                  {regErrors.domicileCity && (
                    <p className="mt-1 text-[11px] text-btnred">{regErrors.domicileCity}</p>
                  )}
                </div>
              </div>

              {/* Row 4: No. Rekening BTN + auto-open option */}
              <div className="p-3 rounded-control bg-well border border-hairline space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="reg-btn-acc" className="text-xs font-medium text-ink">
                    Nomor Rekening Bank BTN
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-[11px] text-brand font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!hasBtnAccount}
                      onChange={(e) => setHasBtnAccount(!e.target.checked)}
                      className="rounded border-control text-brand focus:ring-brand"
                    />
                    <span>Belum punya? Simulasi buka rekening otomatis</span>
                  </label>
                </div>

                {hasBtnAccount ? (
                  <div className="relative">
                    <CreditCard className="w-3.5 h-3.5 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      id="reg-btn-acc"
                      type="text"
                      inputMode="numeric"
                      maxLength={16}
                      value={regBtnAccount}
                      onChange={(e) => setRegBtnAccount(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      placeholder="10–16 digit nomor rekening BTN Anda"
                      className="w-full h-9 pl-9 pr-3 rounded-control border border-control bg-sheet text-sm font-mono tabular-nums text-ink focus:border-brand focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="text-xs text-positive font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                    <span>Rekening simulasi BTN akan dibuat otomatis setelah daftar.</span>
                  </div>
                )}
                {regErrors.btnAccountNumber && (
                  <p className="text-[11px] text-btnred">{regErrors.btnAccountNumber}</p>
                )}
              </div>

              {/* Row 5: Email + Kata Sandi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-email" className="block text-xs font-medium text-ink mb-1">
                    Email aktif
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      id="reg-email"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="nama@email.id"
                      className="w-full h-10 pl-9 pr-3 rounded-control border border-control bg-sheet text-sm text-ink focus:border-brand focus:outline-none"
                    />
                  </div>
                  {regErrors.email && (
                    <p className="mt-1 text-[11px] text-btnred">{regErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="reg-pin" className="block text-xs font-medium text-ink mb-1">
                    Kata sandi / PIN (min. 6)
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      id="reg-pin"
                      type="password"
                      value={regPin}
                      onChange={(e) => setRegPin(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full h-10 pl-9 pr-3 rounded-control border border-control bg-sheet text-sm text-ink focus:border-brand focus:outline-none"
                    />
                  </div>
                  {regErrors.pin && (
                    <p className="mt-1 text-[11px] text-btnred">{regErrors.pin}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-control bg-brand hover:bg-brand-hover text-white font-display font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
              >
                <span>Daftar & Sesuaikan Klaster {selectedRegZone.shortLabel}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <p className="text-[11px] text-ink-secondary leading-relaxed text-center">
                Mode simulasi demo · biodata hanya disimpan sementara di browser Anda untuk sinkronisasi wilayah otomatis dan tidak dikirim ke server.
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
