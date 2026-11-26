'use client';

import React from 'react';
import { BtnLogo } from './BtnLogo';
import { CheckCircle2, Lock, Smartphone, Wifi, X, AlertCircle } from 'lucide-react';

export type NfcModalPhase = 'waiting' | 'processing' | 'success' | 'error' | 'frozen';

interface NfcTapModalProps {
  isOpen: boolean;
  mode: 'write' | 'read';
  phase: NfcModalPhase;
  title: string;
  message: string;
  cardUid?: string;
  cardSubtitle?: string;
  payloadBytes?: number;
  onCancel: () => void;
  onRetry?: () => void;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
}

/**
 * Indonesian Mobile-Banking e-Money Style NFC Tap Bottom Sheet / Modal.
 * Provides familiar "Tempelkan Kartu di Belakang HP" visual feedback for both
 * Admin BTN NFC programming (write) and Customer NFC verification (read).
 */
export const NfcTapModal: React.FC<NfcTapModalProps> = ({
  isOpen,
  mode,
  phase,
  title,
  message,
  cardUid,
  cardSubtitle,
  payloadBytes,
  onCancel,
  onRetry,
  onPrimaryAction,
  primaryActionLabel,
}) => {
  if (!isOpen) return null;

  const isActiveSensor = phase === 'waiting' || phase === 'processing';
  const isDanger = phase === 'error' || phase === 'frozen';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[95] bg-ink/55 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-panel-enter"
    >
      <div className="w-full sm:max-w-[430px] rounded-t-[26px] sm:rounded-[24px] bg-sheet border border-hairline shadow-[0_24px_64px_-16px_rgba(15,23,42,0.38)] overflow-hidden">
        {/* Top Handle Bar (Mobile Sheet Feel) */}
        <div className="pt-3 px-5 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand">
            <Wifi className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{mode === 'write' ? 'Pemrograman Chip NFC BTN' : 'Verifikasi Kartu NFC BTN'}</span>
          </span>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Tutup panel NFC"
            className="w-8 h-8 rounded-full hover:bg-well flex items-center justify-center text-ink-secondary hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Main Center Visual (e-Money Tap Graphic) */}
        <div className="px-6 pt-5 pb-6 flex flex-col items-center text-center space-y-5">
          {/* Animated Phone + NFC Card Proximity Visual */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            {isActiveSensor && (
              <>
                <span className="absolute inset-0 rounded-full border-2 border-brand/60 animate-nfc-ripple" />
                <span
                  className="absolute inset-3 rounded-full border-2 border-brand/40 animate-nfc-ripple"
                  style={{ animationDelay: '0.5s' }}
                />
              </>
            )}

            <div
              className={`relative z-10 w-24 h-24 rounded-[24px] border-2 flex flex-col items-center justify-center gap-1.5 shadow-sm transition-colors ${
                phase === 'success'
                  ? 'bg-positive-soft border-positive text-positive'
                  : isDanger
                  ? 'bg-btnred-soft border-btnred text-btnred'
                  : 'bg-brand-soft border-brand text-brand'
              }`}
            >
              {phase === 'success' ? (
                <CheckCircle2 className="w-10 h-10" aria-hidden="true" />
              ) : phase === 'frozen' ? (
                <Lock className="w-10 h-10" aria-hidden="true" />
              ) : phase === 'error' ? (
                <AlertCircle className="w-10 h-10" aria-hidden="true" />
              ) : (
                <>
                  <Smartphone className="w-8 h-8" aria-hidden="true" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">NFC Ready</span>
                </>
              )}
            </div>
          </div>

          {/* Live Copy */}
          <div className="space-y-1.5 max-w-sm">
            <h3 className="font-display text-lg font-extrabold text-ink leading-snug">{title}</h3>
            <p
              className={`text-xs sm:text-[13px] leading-relaxed ${
                isDanger ? 'text-btnred font-medium' : 'text-ink-secondary'
              }`}
            >
              {message}
            </p>
          </div>

          {/* Mini BTN Card Preview Pill */}
          {(cardUid || cardSubtitle) && (
            <div className="w-full p-3.5 rounded-[14px] bg-well border border-hairline flex items-center justify-between gap-3 text-left">
              <div className="min-w-0 space-y-0.5">
                <div className="font-mono text-xs font-bold text-brand truncate">
                  {cardUid || 'Menunggu chip...'}
                </div>
                {cardSubtitle && (
                  <div className="text-[11px] text-ink-secondary truncate">{cardSubtitle}</div>
                )}
              </div>
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <BtnLogo size="sm" />
                {payloadBytes ? (
                  <span className="text-[10px] font-mono text-ink-subtle">~{payloadBytes} B</span>
                ) : null}
              </div>
            </div>
          )}

          {/* 3-Step Micro Progress Dots (Like e-Money Top Up!) */}
          <div className="w-full grid grid-cols-3 gap-2 text-[11px] font-semibold">
            <div
              className={`py-1.5 px-2 rounded-control border ${
                phase === 'waiting'
                  ? 'bg-brand-soft border-brand text-brand'
                  : isDanger && !cardUid
                  ? 'bg-btnred-soft border-btnred-border text-btnred'
                  : 'bg-positive-soft/60 border-positive-border text-positive'
              }`}
            >
              1. Tempel Kartu
            </div>
            <div
              className={`py-1.5 px-2 rounded-control border ${
                phase === 'processing'
                  ? 'bg-brand-soft border-brand text-brand'
                  : phase === 'success'
                  ? 'bg-positive-soft/60 border-positive-border text-positive'
                  : isDanger
                  ? 'bg-btnred-soft border-btnred-border text-btnred'
                  : 'bg-well border-hairline text-ink-subtle'
              }`}
            >
              2. {mode === 'write' ? 'Tulis Chip' : 'Cek Pemilik'}
            </div>
            <div
              className={`py-1.5 px-2 rounded-control border ${
                phase === 'success'
                  ? 'bg-positive text-white border-positive'
                  : isDanger
                  ? 'bg-btnred text-white border-btnred'
                  : 'bg-well border-hairline text-ink-subtle'
              }`}
            >
              3. {phase === 'success' ? 'Selesai' : isDanger ? 'Ditolak' : 'Aktif'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex items-center gap-2.5 pt-1">
            {phase === 'success' && onPrimaryAction ? (
              <button
                type="button"
                onClick={onPrimaryAction}
                className="flex-1 h-11 rounded-control bg-brand hover:bg-brand-hover text-white font-display font-semibold text-sm transition-colors"
              >
                {primaryActionLabel || 'Selesai'}
              </button>
            ) : isDanger && onRetry ? (
              <>
                <button
                  type="button"
                  onClick={onCancel}
                  className="h-11 px-4 rounded-control border border-control bg-sheet hover:bg-well text-ink text-xs font-semibold transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex-1 h-11 rounded-control bg-brand hover:bg-brand-hover text-white font-display font-semibold text-sm transition-colors"
                >
                  Coba Tempel Ulang
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onCancel}
                className="w-full h-11 rounded-control border border-control bg-sheet hover:bg-well text-ink font-semibold text-sm transition-colors"
              >
                {phase === 'success' ? 'Selesai' : isDanger ? 'Mengerti · Tutup' : 'Batalkan'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
