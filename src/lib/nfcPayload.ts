/**
 * TumbuhLayak - Private Non-URL Physical NFC Chip Codec (e-Money Style Security)
 *
 * Security Architecture (2-Factor Authentication):
 *   - NEVER stores a public auto-login URL on the NFC card!
 *   - Writes a compact private NDEF Text Record token (~70 bytes, fits NTAG213/215/216):
 *       BTNL1|<UID>|<projectIndex>|<templateIndex>|<unitBlock>|<ownerName>|<priceJt>|<year>|<statusCode>
 *   - If a physical card is lost or stolen, tapping it on a stranger's phone will NOT
 *     open the website or bypass login. The holder must log in to the owner's BTN account
 *     first, navigate to "Scan Kartu", and scan the card inside the authenticated web session
 *     where the system also verifies Account Owner <-> Card Owner match.
 */

import { DemoUser, NfcPropertyRecord, OccupancyLegalStatus } from '../types';
import { BTN_HOUSING_CATALOG } from '../data/btnHousingCatalog';
import { HOUSE_TEMPLATES } from '../data/floorplanPresets';
import { findPropertyInRegistry } from './demoStore';
import { nfcUidSchema, sanitizeString } from './validation';

const TOKEN_PREFIX = 'BTNL1';

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

function cleanTokenField(value: string, maxLen: number): string {
  return sanitizeString(value, maxLen).replace(/\|/g, ' ').trim();
}

/**
 * Encodes a BTN house record into a private non-URL NDEF Text token (~70-85 bytes).
 * Fits comfortably inside NTAG213 (144 B), NTAG215 (504 B), and NTAG216 (888 B).
 */
export function buildNfcChipToken(record: NfcPropertyRecord): string {
  const uid = record.uid.trim().toUpperCase();
  const projIdx = record.projectId
    ? BTN_HOUSING_CATALOG.findIndex((p) => p.id === record.projectId)
    : -1;
  const projRef = projIdx >= 0 ? String(projIdx) : cleanTokenField(record.clusterName, 22);

  const tplIdx = Math.max(
    0,
    HOUSE_TEMPLATES.findIndex((t) => t.id === record.templateId)
  );
  const block = cleanTokenField(record.unitBlock, 14);
  const owner = cleanTokenField(record.ownerName, 24);
  const priceJt = String(Math.round(record.nilaiSerahTerimaAwal / 1_000_000));
  const year = String(record.tahunDibangun || 2025);
  const statusCode = STATUS_TO_CODE[record.occupancyStatus || 'hak-huni-aktif'] || 'a';

  return [TOKEN_PREFIX, uid, projRef, String(tplIdx), block, owner, priceJt, year, statusCode].join(
    '|'
  );
}

/**
 * Estimates NDEF Text Record byte footprint (header + lang 'en' + UTF-8 text payload)
 */
export function estimateNdefTextBytes(text: string): number {
  return 10 + new TextEncoder().encode(text).length;
}

/**
 * Verifies whether a scanned NFC card legally belongs to the currently authenticated BTN account.
 * Prevents stolen-card access even if someone logs in with another account!
 */
export function verifyCardBelongsToUser(
  record: NfcPropertyRecord,
  user: DemoUser
): { allowed: boolean; reason?: string } {
  if (user.role === 'admin') {
    return { allowed: true };
  }

  // Exact UID assigned to this user account
  if (user.assignedNfcUid && user.assignedNfcUid.toUpperCase() === record.uid.toUpperCase()) {
    return { allowed: true };
  }

  // Normalized name match (handles honorifics like "Keluarga Budi Santoso", "Ibu Siti Rahmawati", "Bpk. Hendra Wijaya")
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/\b(keluarga|ibu|bpk|bapak|sdr|sdri|ny|tn)\b\.?/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const userNorm = normalize(user.name);
  const ownerNorm = normalize(record.ownerName);

  if (
    userNorm &&
    ownerNorm &&
    (ownerNorm.includes(userNorm) || userNorm.includes(ownerNorm))
  ) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Kartu Kunci NFC ${record.uid} terdaftar atas nama ${record.ownerName} — tidak sesuai dengan akun yang sedang masuk (${user.name}). Demi keamanan nasabah BTN, akses ditolak.`,
  };
}

/**
 * Decodes a physical NFC Text record (private BTNL1|... token or plain BTN-NFC-XXXX-XXXX UID)
 * into a full NfcPropertyRecord — works cross-device without exposing any public auto-login URL!
 */
export function resolveNfcPayload(
  rawInput: string,
  localRegistry: NfcPropertyRecord[]
): { uid: string; record: NfcPropertyRecord | null; fromChipPayload: boolean } {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { uid: '', record: null, fromChipPayload: false };
  }

  // Case 1: Private BTN Chip Token ("BTNL1|BTN-NFC-3660-0101|0|1|Blok C-01|Siti Rahmawati|168|2025|a")
  if (trimmed.startsWith(`${TOKEN_PREFIX}|`)) {
    const parts = trimmed.split('|');
    if (parts.length >= 9) {
      const uidCheck = nfcUidSchema.safeParse(parts[1]);
      if (!uidCheck.success) {
        return { uid: parts[1] || '', record: null, fromChipPayload: false };
      }

      const uid = uidCheck.data;
      const localMatch = findPropertyInRegistry(uid, localRegistry);

      const projRef = parts[2];
      const proj =
        /^\d+$/.test(projRef) && BTN_HOUSING_CATALOG[Number(projRef)]
          ? BTN_HOUSING_CATALOG[Number(projRef)]
          : undefined;

      const tplIdx = Number(parts[3]);
      const tpl =
        (!Number.isNaN(tplIdx) ? HOUSE_TEMPLATES[tplIdx] : undefined) ||
        (proj ? HOUSE_TEMPLATES.find((h) => h.id === proj.templateId) : undefined) ||
        HOUSE_TEMPLATES[1];

      const unitBlock = sanitizeString(parts[4] || localMatch?.unitBlock || 'Blok A-01', 30);
      const ownerName = sanitizeString(parts[5] || localMatch?.ownerName || 'Nasabah BTN', 60);
      const priceMillions = Number(parts[6]);
      const nilaiAwal =
        !Number.isNaN(priceMillions) && priceMillions >= 50
          ? priceMillions * 1_000_000
          : proj?.price || localMatch?.nilaiSerahTerimaAwal || tpl.nilaiAwalProperti;
      const tahunDibangun = Number(parts[7]) || localMatch?.tahunDibangun || 2025;
      const chipStatus: OccupancyLegalStatus =
        CODE_TO_STATUS[(parts[8] || 'a').toLowerCase()] || 'hak-huni-aktif';

      // Prefer local Admin status if Admin updated this exact UID on the same browser;
      // otherwise use the chip's embedded status (works cross-device!)
      const effectiveStatus = localMatch ? localMatch.occupancyStatus || chipStatus : chipStatus;
      const clusterName = sanitizeString(
        proj?.name || (!/^\d+$/.test(projRef) ? projRef : '') || localMatch?.clusterName || 'Perumahan Mitra BTN',
        70
      );
      const lokasiKota = proj?.city || localMatch?.lokasiKota || 'Indonesia';
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
  }

  // Case 2: Plain UID Text (e.g. "BTN-NFC-3672-0014")
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
 * Decodes an NDEFRecord from Web NFC API (supports 'text' and fallback string records)
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
