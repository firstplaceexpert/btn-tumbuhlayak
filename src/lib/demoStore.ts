/**
 * TumbuhLayak - Local Demo Persistence Store (Users, NFC Smart Key Registry, & Admin Audit Logs)
 * Enables seamless end-to-end demo synchronization between Customer Registration,
 * Admin BTN Lottery & NFC Card Programming, and Customer NFC Scanning within the browser.
 */

import { AdminAuditLog, DemoUser, NfcPropertyRecord } from '../types';
import { DEMO_USERS, NFC_PROPERTY_REGISTRY } from '../data/nfcPropertyRegistry';

const STORAGE_KEY = 'btn_tumbuhlayak_demo_state_v2';

export interface DemoStoreState {
  users: DemoUser[];
  nfcRegistry: NfcPropertyRecord[];
  auditLogs: AdminAuditLog[];
}

export function getInitialDemoStoreState(): DemoStoreState {
  return {
    users: DEMO_USERS.map((u) => ({ ...u })),
    nfcRegistry: NFC_PROPERTY_REGISTRY.map((r) => ({ ...r })),
    auditLogs: [
      {
        id: 'log-seed-1',
        timestamp: '14 Agu 2022 · 10:15',
        action: 'program-nfc',
        participantName: 'Budi Santoso',
        zoneLabel: 'Jabodetabek',
        detail:
          'Kartu BTN-NFC-3672-0014 (GRAND HARMONI PARK · Blok B-14) diterbitkan dengan status Hak Huni Aktif · SHM disimpan Bank BTN.',
      },
    ],
  };
}

export function loadDemoStoreState(): DemoStoreState {
  const fallback = getInitialDemoStoreState();
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<DemoStoreState>;
    if (!Array.isArray(parsed.users) || !Array.isArray(parsed.nfcRegistry)) {
      return fallback;
    }

    // Ensure baseline admin account always exists even after older local storage states
    const hasAdmin = parsed.users.some((u) => u.role === 'admin');
    const mergedUsers = hasAdmin
      ? parsed.users
      : [fallback.users[0], ...parsed.users];

    return {
      users: mergedUsers,
      nfcRegistry: parsed.nfcRegistry,
      auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : fallback.auditLogs,
    };
  } catch {
    return fallback;
  }
}

export function saveDemoStoreState(state: DemoStoreState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors in restricted/private mode
  }
}

export function resetDemoStoreState(): DemoStoreState {
  const fresh = getInitialDemoStoreState();
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
  return fresh;
}

export function findPropertyInRegistry(
  uid: string,
  registry: NfcPropertyRecord[]
): NfcPropertyRecord | undefined {
  const normalized = uid.trim().toUpperCase();
  return registry.find((rec) => rec.uid.toUpperCase() === normalized);
}

/** Generate a realistic BTN NFC UID matching /^BTN-NFC-[A-Z0-9]{4}-[0-9]{4}$/ */
export function generateBtnNfcUid(templateId: string, existingRegistry: NfcPropertyRecord[]): string {
  const codeMap: Record<string, string> = {
    'tipe-36-72': '3672',
    'tipe-36-60': '3660',
    'tipe-30-60': '3060',
    'tipe-21-60': '2160',
    'tipe-45-90': '4590',
    'kavling-hook-96': '96HK',
  };
  const typeCode = codeMap[templateId] || '3660';
  const existingSet = new Set(existingRegistry.map((r) => r.uid.toUpperCase()));

  for (let seq = 101; seq < 9999; seq++) {
    const candidate = `BTN-NFC-${typeCode}-${String(seq).padStart(4, '0')}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }
  return `BTN-NFC-${typeCode}-${String(Math.floor(1000 + Math.random() * 8999))}`;
}

export function formatNowIndonesian(): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}
