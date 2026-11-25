'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DemoUser, NfcPropertyRecord } from '../types';
import { findPropertyByNfcUid } from '../data/nfcPropertyRegistry';
import { nfcUidSchema } from '../lib/validation';
import { formatRupiah } from '../lib/formatters';
import {
  Wifi,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  Smartphone,
  ShieldCheck,
  Search,
} from 'lucide-react';

interface NfcScannerViewProps {
  user: DemoUser;
  activeNfcRecord: NfcPropertyRecord | null;
  onPropertyUnlocked: (record: NfcPropertyRecord) => void;
  onGoToLayer2: () => void;
}

type ScanPhase = 'idle' | 'scanning' | 'matched' | 'error';

export const NfcScannerView: React.FC<NfcScannerViewProps> = ({
  user,
  activeNfcRecord,
  onPropertyUnlocked,
  onGoToLayer2,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [manualUid, setManualUid] = useState(
    activeNfcRecord?.uid || user.assignedNfcUid || ''
  );
  const [scanPhase, setScanPhase] = useState<ScanPhase>(activeNfcRecord ? 'matched' : 'idle');
  const [scanMessage, setScanMessage] = useState<string>(
    activeNfcRecord
      ? `Kartu ${activeNfcRecord.uid} terverifikasi atas nama ${activeNfcRecord.ownerName}.`
      : 'Tempelkan kartu kunci rumah NFC BTN pada perangkat Anda, atau masukkan nomor seri yang tercetak di belakang kartu.'
  );
  const [matchedRecord, setMatchedRecord] = useState<NfcPropertyRecord | null>(activeNfcRecord);
  const [hasWebNfc, setHasWebNfc] = useState(false);

  useEffect(() => {
    setHasWebNfc(typeof window !== 'undefined' && 'NDEFReader' in window);
  }, []);

  useEffect(() => {
    if (!manualUid && user.assignedNfcUid) {
      setManualUid(user.assignedNfcUid);
    }
  }, [user.assignedNfcUid, manualUid]);

  const triggerVerification = (uidInput: string) => {
    const parsed = nfcUidSchema.safeParse(uidInput);
    if (!parsed.success) {
      setScanPhase('error');
      setMatchedRecord(null);
      setScanMessage(
        parsed.error.issues[0]?.message || 'Format nomor seri kartu rumah tidak valid.'
      );
      return;
    }

    const uid = parsed.data;
    setManualUid(uid);
    setScanPhase('scanning');
    setScanMessage(`Membaca kartu ${uid} dan mencocokkan data sertifikat rumah BTN Anda...`);

    window.setTimeout(() => {
      const found = findPropertyByNfcUid(uid);
      if (!found) {
        setScanPhase('error');
        setMatchedRecord(null);
        setScanMessage(
          `Nomor kartu ${uid} tidak ditemukan pada data serah terima rumah Bank BTN. Pastikan Anda menggunakan kartu kunci resmi.`
        );
        return;
      }

      setScanPhase('matched');
      setMatchedRecord(found);
      setScanMessage(
        `Data rumah ditemukan: ${found.clusterName} ${found.unitBlock} (${found.houseTypeLabel}). Akses perencanaan pembangunan & nilai rumah kini terbuka.`
      );
      onPropertyUnlocked(found);
    }, 650);
  };

  // Real browser Web NFC API (Android Chrome) or clean serial-number prompt on devices without NFC hardware
  const handleScanButtonClick = async () => {
    if (hasWebNfc) {
      try {
        setScanPhase('scanning');
        setScanMessage('Sensor NFC aktif. Dekatkan kartu kunci rumah BTN ke bagian belakang perangkat Anda...');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ReaderCtor = (window as any).NDEFReader;
        const ndef = new ReaderCtor();
        await ndef.scan();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ndef.onreading = (event: any) => {
          const decoder = new TextDecoder();
          let readText = '';
          for (const rec of event.message?.records || []) {
            if (rec.recordType === 'text') {
              readText = decoder.decode(rec.data);
              break;
            }
          }
          if (readText) {
            triggerVerification(readText);
          } else {
            setScanPhase('error');
            setScanMessage(
              'Chip NFC terbaca tetapi data nomor kartu kosong. Silakan masukkan nomor seri secara manual.'
            );
          }
        };
      } catch {
        setScanPhase('error');
        setScanMessage(
          'Sensor NFC belum diizinkan pada perangkat ini. Silakan masukkan nomor seri yang tercetak di kartu rumah Anda.'
        );
      }
      return;
    }

    // Device without native Web NFC sensor: verify entered/assigned UID or focus manual input
    if (manualUid.trim()) {
      triggerVerification(manualUid);
    } else {
      setScanPhase('idle');
      setScanMessage(
        'Perangkat ini tidak memiliki sensor NFC bawaan. Masukkan nomor seri kartu kunci rumah BTN Anda di kolom di bawah.'
      );
      inputRef.current?.focus();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerVerification(manualUid);
  };

  return (
    <div className="space-y-6 animate-panel-enter">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-btnred mb-1">
            <span className="px-2 py-0.5 rounded bg-btnred-soft border border-btnred-border">
              Scan Kartu Rumah Anda
            </span>
            <span>Verifikasi Akses Pemilik Unit BTN</span>
          </div>
          <h1 className="font-display text-[22px] font-bold text-ink tracking-[-0.015em] leading-snug">
            Pindai kartu kunci rumah pintar BTN
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Pindai kartu kunci rumah berchip NFC yang Anda terima saat serah terima unit untuk membuka halaman perencanaan pembangunan dan estimasi harga rumah Anda sekarang.
          </p>
        </div>

        {matchedRecord && (
          <button
            type="button"
            onClick={onGoToLayer2}
            className="self-start sm:self-auto inline-flex items-center gap-2 h-10 px-4 rounded-control bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors whitespace-nowrap"
          >
            <span>Buka Perencanaan & Nilai Rumah</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Centered Pure NFC Scanner Workspace */}
      <div className="max-w-2xl mx-auto space-y-5">
        <section
          aria-label="Pemindai kartu kunci rumah NFC BTN"
          className="border border-hairline rounded-card bg-sheet p-6 sm:p-8 space-y-6"
        >
          {/* Visual NFC Sensor Pad */}
          <div className="p-6 sm:p-8 rounded-card bg-well border border-hairline flex flex-col items-center text-center space-y-4">
            <div className="relative flex items-center justify-center w-24 h-24">
              {scanPhase === 'scanning' && (
                <>
                  <span className="absolute inset-0 rounded-full border-2 border-brand animate-nfc-ripple" />
                  <span
                    className="absolute inset-2 rounded-full border-2 border-brand/60 animate-nfc-ripple"
                    style={{ animationDelay: '0.45s' }}
                  />
                </>
              )}
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-colors relative z-10 ${
                  scanPhase === 'matched'
                    ? 'bg-positive-soft border-positive text-positive'
                    : scanPhase === 'error'
                    ? 'bg-btnred-soft border-btnred text-btnred'
                    : scanPhase === 'scanning'
                    ? 'bg-brand text-white border-brand'
                    : 'bg-brand-soft border-brand-border text-brand'
                }`}
              >
                {scanPhase === 'matched' ? (
                  <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
                ) : scanPhase === 'error' ? (
                  <AlertCircle className="w-7 h-7" aria-hidden="true" />
                ) : (
                  <Wifi className="w-7 h-7" aria-hidden="true" />
                )}
              </div>
            </div>

            <div className="space-y-1.5 max-w-md">
              <div className="font-display font-semibold text-base text-ink">
                {scanPhase === 'scanning'
                  ? 'Memindai kartu kunci rumah...'
                  : scanPhase === 'matched'
                  ? 'Kartu Kunci Rumah BTN Terverifikasi'
                  : scanPhase === 'error'
                  ? 'Verifikasi Kartu Gagal'
                  : 'Siap Memindai Kartu Kunci Rumah'}
              </div>
              <p
                className={`text-[13px] leading-relaxed ${
                  scanPhase === 'error' ? 'text-btnred' : 'text-ink-secondary'
                }`}
              >
                {scanMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={handleScanButtonClick}
              disabled={scanPhase === 'scanning'}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-control bg-brand hover:bg-brand-hover disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {hasWebNfc ? (
                <>
                  <Smartphone className="w-4 h-4" aria-hidden="true" />
                  <span>Aktifkan Sensor NFC & Pindai</span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4" aria-hidden="true" />
                  <span>Pindai Kartu Rumah Anda</span>
                </>
              )}
            </button>
          </div>

          {/* Verified Unit Summary & Direct Access CTA */}
          {matchedRecord && scanPhase === 'matched' && (
            <div className="p-5 rounded-card bg-positive-soft/70 border border-positive-border space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-positive inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  Data Unit Rumah Terverifikasi
                </span>
                <span className="text-xs font-mono font-semibold text-ink">
                  {matchedRecord.certificateNo}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-ink-secondary block">Pemilik & Unit</span>
                  <strong className="text-ink block mt-0.5">{matchedRecord.ownerName}</strong>
                  <span className="text-ink-secondary">{matchedRecord.unitBlock}</span>
                </div>
                <div>
                  <span className="text-ink-secondary block">Tipe Rumah</span>
                  <strong className="text-ink block mt-0.5">{matchedRecord.houseTypeLabel}</strong>
                  <span className="text-ink-secondary">{matchedRecord.clusterName}</span>
                </div>
                <div>
                  <span className="text-ink-secondary block">Tahun Bangun</span>
                  <strong className="text-ink block mt-0.5 tabular-nums">
                    {matchedRecord.tahunDibangun} ({matchedRecord.usiaBangunanTahun} thn)
                  </strong>
                </div>
                <div>
                  <span className="text-ink-secondary block">Nilai Awal Serah Terima</span>
                  <strong className="text-brand block mt-0.5 tabular-nums">
                    {formatRupiah(matchedRecord.nilaiSerahTerimaAwal)}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={onGoToLayer2}
                className="w-full h-11 rounded-control bg-brand hover:bg-brand-hover text-white font-display font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
              >
                <span>Buka Perencanaan & Nilai Rumah</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Manual Serial Number Verification Form */}
          <form onSubmit={handleManualSubmit} className="pt-5 border-t border-rule space-y-2.5">
            <label htmlFor="nfc-uid-input" className="block text-[13px] font-medium text-ink">
              Atau masukkan nomor seri yang tercetak pada kartu kunci rumah Anda
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <KeyRound
                  className="w-4 h-4 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  ref={inputRef}
                  id="nfc-uid-input"
                  type="text"
                  value={manualUid}
                  onChange={(e) => setManualUid(e.target.value.toUpperCase())}
                  placeholder="Contoh: BTN-NFC-3672-0014"
                  className="w-full h-10 pl-9 pr-3 rounded-control border border-control bg-sheet text-sm font-mono text-ink focus:border-brand focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={scanPhase === 'scanning'}
                className="h-10 px-5 rounded-control bg-ink hover:bg-ink/90 disabled:opacity-60 text-white text-sm font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Search className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Verifikasi Kartu</span>
              </button>
            </div>
          </form>
        </section>

        {/* Clean 3-Step Usage Guide */}
        <section
          aria-label="Panduan pemindaian kartu kunci rumah"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3.5"
        >
          <div className="p-4 rounded-card border border-hairline bg-sheet space-y-1">
            <div className="text-xs font-semibold text-brand">Langkah 1</div>
            <div className="text-[13px] font-semibold text-ink">Siapkan Kartu Kunci BTN</div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Gunakan kartu kunci rumah resmi berchip NFC yang diterima saat serah terima unit.
            </p>
          </div>
          <div className="p-4 rounded-card border border-hairline bg-sheet space-y-1">
            <div className="text-xs font-semibold text-brand">Langkah 2</div>
            <div className="text-[13px] font-semibold text-ink">Tempel atau Ketik Nomor</div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Dekatkan kartu ke sensor NFC ponsel atau ketik nomor seri di bagian belakang kartu.
            </p>
          </div>
          <div className="p-4 rounded-card border border-hairline bg-sheet space-y-1">
            <div className="text-xs font-semibold text-brand">Langkah 3</div>
            <div className="text-[13px] font-semibold text-ink">Buka Akses Rumah Anda</div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Denah rumah, rencana renovasi bertahap, dan nilai rumah saat ini otomatis terbuka.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
