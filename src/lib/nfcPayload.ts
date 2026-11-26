/**
 * TumbuhLayak - Cross-Device Physical NFC Payload Codec (NTAG213 / NTAG215 / NTAG216)
 *
 * Encodes a programmed BTN house record into a super-compact HTTPS Smart URL (<125 bytes)
 * so it fits even on small 144-byte NTAG213 tags AND works across:
 *   1. Android Chrome Web NFC (NDEFReader.write + NDEFReader.scan)
 *   2. iPhone / iOS Native Background NFC Tag Reading (opens Smart URL directly!)
 *   3. Manual programming via free "NFC Tools" app (Write -> URL or Text record)
 */

import { NfcPropertyRecord, OccupancyLegalStatus } from '../types';
import { BTN_HOUSING_CATALOG } from '../data/btnHousingCatalog';
import { HOUSE_TEMPLATES } from '../data/floorplanPresets';
import { findPropertyInRegistry } from './demoStore';
import { nfcUidSchema, sanitizeString } from './validation';

const PRODUCTION_ORIGIN = 'https://tumbuhlayak.vercel.app';

const STATUS_TO_CODE: Record<OccupancyLegalStatus, string> = {
  'hak-huni-aktif': 'a',
  'lunas-shm': 'l',
  'dibekukan-tunggakan': 'f',
};

const CODE_TO_STATUS: Record<string, OccupancyLegalStatus> = {
  a: 'hak-huni-aktif',
  l: 'lunas-shm',
  f: 'dibekukan-tunggakan',
};

export function getPublicAppOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    // Prefer production origin when programming on localhost so physical cards work on any phone!
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) {
      return PRODUCTION_ORIGIN;
    }
    return window.location.origin;
  }
  return PRODUCTION_ORIGIN;
}

/**
 * Builds an ultra-compact Smart URL for a physical NFC card.
 * Example (~105 bytes, fits NTAG213 144-byte limit comfortably!):
 *   https://tumbuhlayak.vercel.app/?nfc=BTN-NFC-3660-0101&p=keandra-park-tahap-2&b=Blok+C-01&o=Siti+Rahma&t=1&v=168&s=a
 */
export function buildNfcSmartUrl(record: NfcPropertyRecord, originOverride?: string): string {
  const origin = originOverride || getPublicAppOrigin();
  const params = new URLSearchParams();
  params.set('nfc', record.uid.toUpperCase());

  // Use short project index if found in catalog (saves ~18 bytes vs slug on NTAG213!)
  const projIdx = record.projectId
    ? BTN_HOUSING_CATALOG.findIndex((p) => p.id === record.projectId)
    : -1;
  if (projIdx >= 0) {
    params.set('pi', String(projIdx));
  } else {
    params.set('cl', sanitizeString(record.clusterName, 24));
  }

  const tplIdx = HOUSE_TEMPLATES.findIndex((t) => t.id === record.templateId);
  if (tplIdx >= 0) {
    params.set('t', String(tplIdx));
  }

  params.set('b', sanitizeString(record.unitBlock, 14));
  params.set('o', sanitizeString(record.ownerName, 22));
  params.set('v', String(Math.round(record.nilaiSerahTerimaAwal / 1_000_000)));
  params.set('y', String(record.tahunDibangun || 2025));
  params.set('s', STATUS_TO_CODE[record.occupancyStatus || 'hak-huni-aktif'] || 'a');

  return `${origin}/?${params.toString()}`;
}

/**
 * Ultra-minimal fallback URL (<56 bytes) if a card has tiny memory (e.g. NTAG213 locked sectors)
 */
export function buildMinimalNfcUrl(uid: string, originOverride?: string): string {
  const origin = originOverride || getPublicAppOrigin();
  return `${origin}/?nfc=${encodeURIComponent(uid.trim().toUpperCase())}`;
}

/**
 * Estimates NDEF URI record byte footprint (HTTPS prefix compresses 'https://' -> 1 byte per NFC Forum RTD)
 */
export function estimateNdefUrlBytes(url: string): number {
  const withoutScheme = url.replace(/^https:\/\//i, '');
  // NDEF TLV + URI record header (~7 bytes) + 1 prefix byte + payload bytes
  return 8 + new TextEncoder().encode(withoutScheme).length;
}

/**
 * Decodes ANY physical NFC scan input (Smart URL, query string, or plain UID text)
 * into a full NfcPropertyRecord — even on a brand-new phone that has never seen this UID!
 */
export function resolveNfcPayload(
  rawInput: string,
  localRegistry: NfcPropertyRecord[]
): { uid: string; record: NfcPropertyRecord | null; fromChipPayload: boolean } {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { uid: '', record: null, fromChipPayload: false };
  }

  // Case 1: Full URL or query string containing ?nfc=... or nfc=...
  let searchParams: URLSearchParams | null = null;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsedUrl = new URL(trimmed);
      searchParams = parsedUrl.searchParams;
    } catch {
      // Fallback below
    }
  } else if (trimmed.includes('nfc=')) {
    const queryPart = trimmed.includes('?') ? trimmed.slice(trimmed.indexOf('?') + 1) : trimmed;
    searchParams = new URLSearchParams(queryPart);
  }

  if (searchParams && searchParams.get('nfc')) {
    const rawUid = (searchParams.get('nfc') || '').trim().toUpperCase();
    const uidCheck = nfcUidSchema.safeParse(rawUid);
    if (!uidCheck.success) {
      return { uid: rawUid, record: null, fromChipPayload: false };
    }
    const uid = uidCheck.data;

    // Check if local registry already has this UID (e.g. same phone or updated Admin status)
    const localMatch = findPropertyInRegistry(uid, localRegistry);

    // Check if URL carries embedded cross-device unit metadata (pi / cl / o / b / t / v / s)
    const hasEmbeddedMeta = Boolean(
      searchParams.get('o') || searchParams.get('pi') || searchParams.get('cl') || searchParams.get('s')
    );

    if (localMatch && !hasEmbeddedMeta) {
      return { uid, record: localMatch, fromChipPayload: false };
    }

    if (hasEmbeddedMeta) {
      const piRaw = searchParams.get('pi');
      const proj =
        piRaw !== null && !Number.isNaN(Number(piRaw))
          ? BTN_HOUSING_CATALOG[Number(piRaw)]
          : undefined;

      const tRaw = searchParams.get('t');
      const tpl =
        (tRaw !== null && !Number.isNaN(Number(tRaw)) ? HOUSE_TEMPLATES[Number(tRaw)] : undefined) ||
        (proj ? HOUSE_TEMPLATES.find((h) => h.id === proj.templateId) : undefined) ||
        HOUSE_TEMPLATES[1];

      const statusCode = (searchParams.get('s') || 'a').toLowerCase();
      const chipStatus: OccupancyLegalStatus = CODE_TO_STATUS[statusCode] || 'hak-huni-aktif';

      // If local Admin froze/updated this exact UID on the SAME device, prefer local status if modified;
      // otherwise trust the chip's embedded status (works seamlessly across different phones!)
      const effectiveStatus = localMatch ? localMatch.occupancyStatus || chipStatus : chipStatus;

      const ownerName = sanitizeString(searchParams.get('o') || localMatch?.ownerName || 'Nasabah BTN', 60);
      const unitBlock = sanitizeString(searchParams.get('b') || localMatch?.unitBlock || 'Blok A-01', 30);
      const clusterName = sanitizeString(
        proj?.name || searchParams.get('cl') || localMatch?.clusterName || 'Perumahan Mitra BTN',
        70
      );
      const lokasiKota = proj?.city || localMatch?.lokasiKota || 'Indonesia';
      const priceMillions = Number(searchParams.get('v'));
      const nilaiAwal =
        !Number.isNaN(priceMillions) && priceMillions >= 50
          ? priceMillions * 1_000_000
          : proj?.price || localMatch?.nilaiSerahTerimaAwal || tpl.nilaiAwalProperti;
      const tahunDibangun = Number(searchParams.get('y')) || localMatch?.tahunDibangun || 2025;
      const currentYear = new Date().getFullYear();
      const usiaBangunanTahun = Math.max(0, Math.min(35, currentYear - tahunDibangun));
      const dailyContribution = proj?.dailyContribution || localMatch?.dailyContribution || 50_000;
      const totalRequiredDays = Math.ceil(nilaiAwal / dailyContribution);
      const seq = uid.split('-').pop() || '0101';

      const reconstructed: NfcPropertyRecord = {
        uid,
        certificateNo: localMatch?.certificateNo || `SHGB-BTN-NFC-${seq}`,
        clusterName,
        unitBlock,
        ownerName,
        lokasiKota,
        templateId: tpl.id,
        houseTypeLabel: `${tpl.shortLabel} (${tpl.programBadge})`,
        luasTanah: tpl.luasTanah,
        luasBangunanEksisting: tpl.luasBangunanEksisting,
        nilaiSerahTerimaAwal: nilaiAwal,
        tahunDibangun,
        usiaBangunanTahun,
        umurEkonomisTahun: 30,
        porsiNilaiTanah: 0.55,
        kondisiBangunan: localMatch?.kondisiBangunan || 'prima',
        arisanBatchLabel: `Arisan Harian ${clusterName} · Kartu NFC Fisik`,
        handoverDate: localMatch?.handoverDate || 'Terverifikasi dari Chip NFC Fisik',
        projectId: proj?.id || localMatch?.projectId,
        occupancyStatus: effectiveStatus,
        dailyContribution,
        paidDays:
          effectiveStatus === 'lunas-shm'
            ? totalRequiredDays
            : localMatch?.paidDays ?? 365,
        totalRequiredDays,
        freezeReason:
          effectiveStatus === 'dibekukan-tunggakan'
            ? localMatch?.freezeReason ||
              'Kartu NFC dibekukan Admin BTN akibat tunggakan iuran harian. Hak huni dicabut, SHM tetap disimpan Bank BTN, setoran dikonversi sebagai biaya sewa (rental).'
            : undefined,
      };

      return { uid, record: reconstructed, fromChipPayload: true };
    }

    return { uid, record: localMatch || null, fromChipPayload: false };
  }

  // Case 2: Plain UID text (e.g. "BTN-NFC-3672-0014" written via NFC Tools Text Record)
  const uidMatch = trimmed.toUpperCase().match(/BTN-NFC-[A-Z0-9]{4}-[0-9]{4}/);
  const candidateUid = uidMatch ? uidMatch[0] : trimmed.toUpperCase();
  const parsed = nfcUidSchema.safeParse(candidateUid);
  if (!parsed.success) {
    return { uid: trimmed, record: null, fromChipPayload: false };
  }

  const found = findPropertyInRegistry(parsed.data, localRegistry);
  return { uid: parsed.data, record: found || null, fromChipPayload: false };
}

/**
 * Decodes an NDEFRecord from Web NFC API (supports 'url', 'absolute-url', 'text', and unknown bytes)
 */
export function decodeNdefRecordText(record: {
  recordType?: string;
  encoding?: string;
  data?: DataView | ArrayBuffer;
}): string {
  if (!record?.data) return '';
  try {
    const decoder = new TextDecoder(record.encoding || 'utf-8');
    return decoder.decode(record.data).trim();
  } catch {
    return '';
  }
}
