'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Lock,
  ShieldCheck,
  KeyRound,
  Smartphone,
  Wifi,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { DemoUser, NfcPropertyRecord } from '../types';
import { changePasswordSchema } from '../lib/validation';

interface SecurityBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: DemoUser;
  activeNfcRecord: NfcPropertyRecord | null;
  onDisconnectNfc?: () => void;
}

export const SecurityBadgeModal: React.FC<SecurityBadgeModalProps> = ({
  isOpen,
  onClose,
  user,
  activeNfcRecord,
  onDisconnectNfc,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [otpEnabled, setOtpEnabled] = useState(true);
  const [nfcAlertEnabled, setNfcAlertEnabled] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaved(false);

    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!parsed.success) {
      const nextErrs: {
        currentPassword?: string;
        newPassword?: string;
        confirmPassword?: string;
      } = {};
      parsed.error.issues.forEach((iss) => {
        const key = iss.path[0] as 'currentPassword' | 'newPassword' | 'confirmPassword';
        if (key && !nextErrs[key]) nextErrs[key] = iss.message;
      });
      setFieldErrors(nextErrs);
      return;
    }

    setFieldErrors({});
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSaved(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="security-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-sheet rounded-sheet shadow-xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-hairline"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-rule flex items-start justify-between gap-4 flex-shrink-0 bg-sheet">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-control bg-brand-soft text-brand flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="security-modal-title"
                className="font-display text-base font-semibold text-ink"
              >
                Keamanan akun
              </h2>
              <p className="text-xs text-ink-secondary mt-0.5">
                Kelola kata sandi, verifikasi dua langkah, dan akses kartu kunci rumah Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-control text-ink-secondary hover:bg-well hover:text-ink transition-colors"
            aria-label="Tutup pengaturan keamanan"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm overflow-y-auto flex-1">
          {/* 1. Ubah Kata Sandi / PIN */}
          <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-display font-semibold text-ink text-sm">
                <KeyRound className="w-4 h-4 text-brand flex-shrink-0" aria-hidden="true" />
                <span>Ubah kata sandi / PIN akses</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswords((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-medium text-ink-secondary hover:text-ink"
              >
                {showPasswords ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Sembunyikan</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Tampilkan</span>
                  </>
                )}
              </button>
            </div>

            {passwordSaved && (
              <div className="p-3 rounded-control bg-positive-soft border border-positive-border text-xs text-positive flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span>Kata sandi berhasil diperbarui. Gunakan kata sandi baru saat masuk berikutnya.</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="sec-current-pw"
                  className="block text-xs font-medium text-ink mb-1"
                >
                  Kata sandi / PIN saat ini
                </label>
                <input
                  id="sec-current-pw"
                  type={showPasswords ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan kata sandi saat ini"
                  className="w-full h-10 px-3 rounded-control border border-control bg-sheet text-sm text-ink focus:border-brand focus:outline-none"
                />
                {fieldErrors.currentPassword && (
                  <p className="mt-1 text-xs text-btnred flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                    {fieldErrors.currentPassword}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="sec-new-pw"
                    className="block text-xs font-medium text-ink mb-1"
                  >
                    Kata sandi baru
                  </label>
                  <input
                    id="sec-new-pw"
                    type={showPasswords ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full h-10 px-3 rounded-control border border-control bg-sheet text-sm text-ink focus:border-brand focus:outline-none"
                  />
                  {fieldErrors.newPassword && (
                    <p className="mt-1 text-xs text-btnred flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                      {fieldErrors.newPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="sec-confirm-pw"
                    className="block text-xs font-medium text-ink mb-1"
                  >
                    Konfirmasi kata sandi baru
                  </label>
                  <input
                    id="sec-confirm-pw"
                    type={showPasswords ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className="w-full h-10 px-3 rounded-control border border-control bg-sheet text-sm text-ink focus:border-brand focus:outline-none"
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-btnred flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="h-9 px-4 rounded-control bg-brand hover:bg-brand-hover text-white text-xs font-semibold transition-colors"
              >
                Simpan kata sandi baru
              </button>
            </div>
          </form>

          {/* 2. Proteksi Masuk & Notifikasi */}
          <div className="pt-5 border-t border-rule space-y-3">
            <div className="flex items-center gap-2 font-display font-semibold text-ink text-sm">
              <Lock className="w-4 h-4 text-brand flex-shrink-0" aria-hidden="true" />
              <span>Proteksi masuk & notifikasi</span>
            </div>

            <div className="divide-y divide-rule border border-hairline rounded-card bg-well/50">
              <div className="p-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[13px] font-medium text-ink">
                    Verifikasi 2 langkah (OTP)
                  </div>
                  <div className="text-xs text-ink-secondary">
                    Kirim kode verifikasi saat masuk dari perangkat baru.
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={otpEnabled}
                  aria-label="Aktifkan verifikasi 2 langkah"
                  onClick={() => setOtpEnabled((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                    otpEnabled ? 'bg-brand' : 'bg-control'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      otpEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="p-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[13px] font-medium text-ink">
                    Notifikasi scan kartu kunci rumah
                  </div>
                  <div className="text-xs text-ink-secondary">
                    Beri peringatan setiap kali kartu kunci NFC unit Anda dipindai.
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={nfcAlertEnabled}
                  aria-label="Aktifkan notifikasi scan kartu kunci rumah"
                  onClick={() => setNfcAlertEnabled((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                    nfcAlertEnabled ? 'bg-brand' : 'bg-control'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      nfcAlertEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* 3. Status Kartu Kunci & Sesi Perangkat */}
          <div className="pt-5 border-t border-rule grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-card border border-hairline bg-well/50 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Wifi className="w-3.5 h-3.5 text-brand" aria-hidden="true" />
                <span>Kartu kunci rumah terhubung</span>
              </div>
              {activeNfcRecord ? (
                <div className="space-y-2">
                  <div className="text-xs font-mono font-semibold text-positive">
                    {activeNfcRecord.uid}
                  </div>
                  <div className="text-xs text-ink-secondary">
                    {activeNfcRecord.unitBlock} · {activeNfcRecord.clusterName}
                  </div>
                  {onDisconnectNfc && (
                    <button
                      type="button"
                      onClick={() => {
                        onDisconnectNfc();
                        onClose();
                      }}
                      className="text-xs font-medium text-btnred hover:underline"
                    >
                      Kunci kembali akses unit
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-ink-secondary">
                  Belum ada kartu kunci rumah yang dipindai pada sesi ini.
                </p>
              )}
            </div>

            <div className="p-3.5 rounded-card border border-hairline bg-well/50 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Smartphone className="w-3.5 h-3.5 text-brand" aria-hidden="true" />
                <span>Sesi masuk aktif</span>
              </div>
              <div className="text-xs font-medium text-ink truncate">{user.name}</div>
              <div className="text-xs text-ink-secondary truncate">{user.email}</div>
              <div className="text-xs text-positive font-medium">Perangkat ini · Aktif sekarang</div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-rule bg-well/60 flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-control border border-control bg-sheet hover:bg-well text-ink text-xs font-semibold transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
