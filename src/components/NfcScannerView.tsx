'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DemoUser, NfcPropertyRecord } from '../types';
import { NFC_PROPERTY_REGISTRY } from '../data/nfcPropertyRegistry';
import { decodeNdefRecordText, resolveNfcPayload } from '../lib/nfcPayload';
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
  Lock,
  X,
} from 'lucide-react';

interface NfcScannerViewProps {
  user: DemoUser;
  activeNfcRecord: NfcPropertyRecord | null;
  nfcRegistry?: NfcPropertyRecord[];
  onPropertyUnlocked: (record: NfcPropertyRecord) => void;
  onGoToLayer2: () => void;
}

type ScanPhase = 'idle' | 'scanning' | 'matched' | 'frozen' | 'error';

export const NfcScannerView: React.FC<NfcScannerViewProps> = ({
  user,
  activeNfcRecord,
  nfcRegistry = NFC_PROPERTY_REGISTRY,
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
  const [hardwareSerial, setHardwareSerial] = useState<string>('');
  const [hasWebNfc, setHasWebNfc] = useState(false);
  const scanAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setHasWebNfc(typeof window !== 'undefined' && 'NDEFReader' in window);
    return () => {
      if (scanAbortRef.current) {
        scanAbortRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!manualUid && user.assignedNfcUid) {
      setManualUid(user.assignedNfcUid);
    }
  }, [user.assignedNfcUid, manualUid]);

  // Reflect frozen active card if navigated directly from a frozen ?nfc=... tap
  useEffect(() => {
    if (!activeNfcRecord && user.assignedNfcUid) {
      const resolved = resolveNfcPayload(user.assignedNfcUid, nfcRegistry);
      if (resolved.record?.occupancyStatus === 'dibekukan-tunggakan') {
        setScanPhase('frozen');
        setMatchedRecord(resolved.record);
        setManualUid(resolved.record.uid);
        setScanMessage(
          resolved.record.freezeReason ||
            `Kartu Kunci NFC ${resolved.record.uid} DIBEKUKAN oleh Admin BTN karena tunggakan iuran arisan harian.`
        );
      }
    }
  }, [activeNfcRecord, user.assignedNfcUid, nfcRegistry]);

  const stopPhysicalScan = () => {
    if (scanAbortRef.current) {
      scanAbortRef.current.abort();
      scanAbortRef.current = null;
    }
    if (scanPhase === 'scanning') {
      setScanPhase('idle');
      setScanMessage(
        'Pemindaian sensor NFC dihentikan. Klik tombol di bawah untuk memindai lagi atau masukkan nomor seri manual.'
      );
    }
  };

  const triggerVerification = (
    rawInput: string,
    opts?: { fromHardware?: boolean; chipSerial?: string }
  ) => {
    const resolved = resolveNfcPayload(rawInput, nfcRegistry);
    if (!resolved.uid) {
      setScanPhase('error');
      setMatchedRecord(null);
      setScanMessage('Format nomor seri atau Smart URL kartu rumah tidak valid.');
      return;
    }

    setManualUid(resolved.uid);
    if (opts?.chipSerial) setHardwareSerial(opts.chipSerial);
    setScanPhase('scanning');
    setScanMessage(
      opts?.fromHardware
        ? `Chip NFC fisik terbaca (${resolved.uid}). Mencocokkan data sertifikat rumah BTN...`
        : `Membaca kartu ${resolved.uid} dan mencocokkan data sertifikat rumah BTN Anda...`
    );

    window.setTimeout(() => {
      const found = resolved.record;
      if (!found) {
        setScanPhase('error');
        setMatchedRecord(null);
        setScanMessage(
          `Nomor kartu ${resolved.uid} tidak ditemukan pada data serah terima rumah Bank BTN. Pastikan kartu telah diprogram oleh Admin BTN.`
        );
        return;
      }

      if (found.occupancyStatus === 'dibekukan-tunggakan') {
        setScanPhase('frozen');
        setMatchedRecord(found);
        setScanMessage(
          found.freezeReason ||
            `Kartu Kunci NFC ${found.uid} DIBEKUKAN oleh Admin BTN karena tunggakan iuran arisan harian. Sesuai skema Hak Huni Sewa-Beli BTN, hak menempati unit dicabut, SHM tetap disimpan Bank BTN, dan setoran sebelumnya dihitung sebagai biaya sewa (rental).`
        );
        return;
      }

      setScanPhase('matched');
      setMatchedRecord(found);
      setScanMessage(
        `${opts?.fromHardware ? 'Chip NFC Fisik Terverifikasi! ' : ''}Data rumah ditemukan: ${found.clusterName} ${found.unitBlock} (${found.houseTypeLabel}). Akses perencanaan pembangunan & nilai rumah kini terbuka.`
      );
      onPropertyUnlocked(found);
    }, opts?.fromHardware ? 300 : 600);
  };

  // Real browser Web NFC API (Android Chrome: reads URL, Text, and detects blank physical tags!)
  const handleScanButtonClick = async () => {
    if (hasWebNfc) {
      if (scanAbortRef.current) scanAbortRef.current.abort();
      const controller = new AbortController();
      scanAbortRef.current = controller;

      try {
        setScanPhase('scanning');
        setHardwareSerial('');
        setScanMessage(
          'Sensor NFC aktif! Dekatkan & tahan Kartu Kunci Rumah BTN ke bagian belakang HP Android Anda...'
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ReaderCtor = (window as any).NDEFReader;
        const ndef = new ReaderCtor();
        await ndef.scan({ signal: controller.signal });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ndef.onreadingerror = () => {
          setScanPhase('error');
          setScanMessage(
            'Kartu NFC terdeteksi tetapi tidak dapat dibaca. Coba geser sedikit posisi kartu di belakang HP lalu tempelkan kembali.'
          );
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ndef.onreading = (event: any) => {
          const chipSerial: string = event.serialNumber || '';
          const records = event.message?.records || [];
          let extractedPayload = '';

          // Priority 1: Smart URL record (written by Admin BTN or NFC Tools URL record)
          for (const rec of records) {
            if (rec.recordType === 'url' || rec.recordType === 'absolute-url') {
              const decoded = decodeNdefRecordText(rec);
              if (decoded) {
                extractedPayload = decoded;
                break;
              }
            }
          }

          // Priority 2: Text record (plain UID or Smart URL stored as text)
          if (!extractedPayload) {
            for (const rec of records) {
              if (rec.recordType === 'text') {
                const decoded = decodeNdefRecordText(rec);
                if (decoded) {
                  extractedPayload = decoded;
                  break;
                }
              }
            }
          }

          // Priority 3: Any other decodable record containing BTN-NFC or nfc=
          if (!extractedPayload) {
            for (const rec of records) {
              const decoded = decodeNdefRecordText(rec);
              if (decoded && (decoded.includes('BTN-NFC-') || decoded.includes('nfc='))) {
                extractedPayload = decoded;
                break;
              }
            }
          }

          controller.abort();
          scanAbortRef.current = null;

          if (extractedPayload) {
            triggerVerification(extractedPayload, { fromHardware: true, chipSerial });
          } else {
            setHardwareSerial(chipSerial);
            setScanPhase('error');
            setMatchedRecord(null);
            setScanMessage(
              `Kartu NFC fisik terdeteksi${chipSerial ? ` (Serial Chip: ${chipSerial})` : ''}, namun chip masih kosong atau belum diprogram oleh Admin Operasional BTN. Program kartu terlebih dahulu di menu Portal Admin BTN.`
            );
          }
        };
      } catch (err: unknown) {
        scanAbortRef.current = null;
        if (controller.signal.aborted) return;
        const errName = (err as { name?: string })?.name || '';
        setScanPhase('error');
        setScanMessage(
          errName === 'NotAllowedError'
            ? 'Izin NFC belum diaktifkan. Nyalakan fitur NFC di HP Android Anda dan beri izin akses NFC di Chrome.'
            : 'Sensor NFC belum bisa diaktifkan pada perangkat ini. Anda tetap bisa menempelkan kartu langsung di layar utama HP atau mengetik nomor seri di bawah.'
        );
      }
      return;
    }

    // Device without native Web NFC sensor (Desktop / iPhone): verify entered/assigned UID or focus manual input
    if (manualUid.trim()) {
      triggerVerification(manualUid);
    } else {
      setScanPhase('idle');
      setScanMessage(
        'Browser ini tidak mendukung Web NFC langsung (gunakan Chrome Android untuk scan sensor, atau di iPhone cukup tempel kartu Smart URL langsung dari layar utama). Anda juga bisa mengetik nomor seri di bawah.'
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

        {matchedRecord && scanPhase === 'matched' && (
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

      {/* Balanced 2-Column NFC Scanner Workspace with Friendly BTN Illustration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left (5 cols): Friendly BTN Cartoon Illustration + Compact 3-Step Guide */}
        <aside className="lg:col-span-5 space-y-4">
          <div className="rounded-[18px] border border-hairline bg-gradient-to-b from-[#EEF4FD] to-[#FCFBF8] p-3.5 shadow-[0_12px_28px_-18px_rgba(31,36,43,0.16)]">
            <img
              src="/illustrations/nfc-smart-card-scan.jpg"
              alt="Ilustrasi pemilik rumah BTN memindai kartu kunci pintar NFC ke perangkat"
              className="w-full aspect-[4/3] object-cover rounded-[12px] block"
            />
          </div>

          <section
            aria-label="Panduan pemindaian kartu kunci rumah"
            className="rounded-card border border-hairline bg-well p-4 space-y-3"
          >
            <div className="text-xs font-semibold text-ink">Cara memindai kartu kunci BTN</div>
            <ol className="space-y-2.5 text-xs text-ink-secondary">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-soft text-brand font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  1
                </span>
                <span>
                  <strong className="text-ink">Siapkan Kartu Kunci BTN</strong> berchip NFC yang diterima saat serah terima unit.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-btnred-soft text-btnred font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  2
                </span>
                <span>
                  <strong className="text-ink">Tempel atau ketik nomor seri</strong> yang tercetak pada bagian belakang kartu.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-positive-soft text-positive font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  3
                </span>
                <span>
                  <strong className="text-ink">Buka akses rumah Anda</strong> — denah asli, rencana renovasi, dan valuasi otomatis terbuka.
                </span>
              </li>
            </ol>
          </section>
        </aside>

        {/* Right (7 cols): Interactive Pure NFC Sensor Pad & Manual Verification */}
        <section
          aria-label="Pemindai kartu kunci rumah NFC BTN"
          className="lg:col-span-7 border border-hairline rounded-[18px] bg-sheet p-6 sm:p-7 space-y-6"
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
                    : scanPhase === 'frozen' || scanPhase === 'error'
                    ? 'bg-btnred-soft border-btnred text-btnred'
                    : scanPhase === 'scanning'
                    ? 'bg-brand text-white border-brand'
                    : 'bg-brand-soft border-brand-border text-brand'
                }`}
              >
                {scanPhase === 'matched' ? (
                  <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
                ) : scanPhase === 'frozen' ? (
                  <Lock className="w-7 h-7" aria-hidden="true" />
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
                  : scanPhase === 'frozen'
                  ? 'Kartu Kunci NFC Dibekukan (Tunggakan Iuran)'
                  : scanPhase === 'error'
                  ? 'Verifikasi Kartu Gagal'
                  : 'Siap Memindai Kartu Kunci Rumah'}
              </div>
              <p
                className={`text-[13px] leading-relaxed ${
                  scanPhase === 'error' || scanPhase === 'frozen' ? 'text-btnred' : 'text-ink-secondary'
                }`}
              >
                {scanMessage}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleScanButtonClick}
                disabled={scanPhase === 'scanning'}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-control bg-brand hover:bg-brand-hover disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {hasWebNfc ? (
                  <>
                    <Smartphone className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {scanPhase === 'scanning'
                        ? 'Sensor NFC Aktif — Tempel Kartu...'
                        : 'Aktifkan Sensor NFC & Pindai'}
                    </span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4" aria-hidden="true" />
                    <span>Pindai Kartu Rumah Anda</span>
                  </>
                )}
              </button>

              {scanPhase === 'scanning' && hasWebNfc && (
                <button
                  type="button"
                  onClick={stopPhysicalScan}
                  className="inline-flex items-center gap-1 h-10 px-3.5 rounded-control border border-control bg-sheet hover:bg-well text-ink text-xs font-semibold transition-colors"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Berhenti</span>
                </button>
              )}
            </div>

            {hardwareSerial && (
              <div className="text-[11px] font-mono text-ink-subtle">
                Hardware Chip Serial: {hardwareSerial}
              </div>
            )}
          </div>

          {/* Frozen NFC Card Enforcement Notice (Anti-Default Rental Safeguard) */}
          {matchedRecord && scanPhase === 'frozen' && (
            <div className="p-5 rounded-card bg-btnred-soft/75 border-2 border-btnred space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-btnred inline-flex items-center gap-1.5">
                  <Lock className="w-4 h-4" aria-hidden="true" />
                  Akses Unit &amp; Hak Huni Dibekukan Bank BTN
                </span>
                <span className="text-xs font-mono font-semibold text-ink">
                  {matchedRecord.uid}
                </span>
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Unit <strong>{matchedRecord.clusterName} {matchedRecord.unitBlock}</strong> atas nama{' '}
                <strong>{matchedRecord.ownerName}</strong> berstatus <strong>Tunggakan Iuran Harian</strong>. Sesuai akad Sewa-Beli (Hak Huni) BTN: sertifikat{' '}
                <strong>{matchedRecord.certificateNo}</strong> tetap disimpan Bank BTN, hak menempati unit dicabut, dan setoran yang masuk sebelumnya diperhitungkan sebagai biaya sewa (rental).
              </p>
            </div>
          )}

          {/* Verified Unit Summary & Direct Access CTA */}
          {matchedRecord && scanPhase === 'matched' && (
            <div className="p-5 rounded-card bg-positive-soft/70 border border-positive-border space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-positive inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  Data Unit Rumah Terverifikasi ·{' '}
                  {matchedRecord.occupancyStatus === 'lunas-shm'
                    ? 'Lunas 100% · SHM Penuh'
                    : 'Hak Huni Aktif · SHM Disimpan BTN'}
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
                  onChange={(e) => {
                    const v = e.target.value;
                    setManualUid(v.includes('http') || v.includes('nfc=') ? v : v.toUpperCase());
                  }}
                  placeholder="Contoh: BTN-NFC-3672-0014 atau Smart URL NFC"
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
      </div>
    </div>
  );
};
