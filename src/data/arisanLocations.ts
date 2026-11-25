/**
 * Official Bank BTN Subsidized Housing (KPR FLPP) Regional Price Zones
 * Source: Keputusan Menteri PUPR No. 689/KPTS/M/2023 (berlaku 2024-2026)
 * Self-contained local dataset for location-first Gen-Z Daily Micro-Arisan BTN.
 */

import { ArisanLocationZone } from '../types';

export const ARISAN_LOCATION_ZONES: ArisanLocationZone[] = [
  {
    id: 'jawa',
    regionName: 'Jawa (Non-Jabodetabek)',
    shortLabel: 'Jawa',
    sampleCities: 'Bandung Raya, Semarang, Yogyakarta, Solo, Surabaya, Malang',
    clusterName: 'Klaster Gen-Z BTN Harmoni Jawa',
    officialFlppPrice: 166000000,
    regulationNote: 'Kepmen PUPR 689/2023 · Zona Jawa',
    defaultQuota: 5000,
    registeredMembers: 4420,
    defaultDailyContribution: 50000,
    defaultInflationRate: 0.045,
    developerPartner: 'Konsorsium Developer Mitra FLPP BTN Jawa',
  },
  {
    id: 'jabodetabek',
    regionName: 'Jabodetabek, Bali & Nusa Tenggara',
    shortLabel: 'Jabodetabek & Bali',
    sampleCities: 'Bekasi, Cikarang, Bogor, Depok, Tangerang, Denpasar, Mataram',
    clusterName: 'Klaster Gen-Z BTN Griya Jabodetabek',
    officialFlppPrice: 185000000,
    regulationNote: 'Kepmen PUPR 689/2023 · Zona Jabodetabek/Bali',
    defaultQuota: 5500,
    registeredMembers: 5115,
    defaultDailyContribution: 55000,
    defaultInflationRate: 0.05,
    developerPartner: 'Mitra Developer Rumah Subsidi BTN Jabodetabek',
  },
  {
    id: 'sumatra',
    regionName: 'Sumatra (Daratan)',
    shortLabel: 'Sumatra',
    sampleCities: 'Medan, Palembang, Pekanbaru, Padang, Jambi, Bandar Lampung',
    clusterName: 'Klaster Gen-Z BTN Sejahtera Sumatra',
    officialFlppPrice: 166000000,
    regulationNote: 'Kepmen PUPR 689/2023 · Zona Sumatra',
    defaultQuota: 4500,
    registeredMembers: 3690,
    defaultDailyContribution: 45000,
    defaultInflationRate: 0.045,
    developerPartner: 'Asosiasi Developer Subsidi BTN Sumatra',
  },
  {
    id: 'sulawesi-kepri',
    regionName: 'Sulawesi, Babel & Kep. Riau',
    shortLabel: 'Sulawesi & Kepri',
    sampleCities: 'Makassar, Manado, Kendari, Batam, Pangkalpinang',
    clusterName: 'Klaster Gen-Z BTN Nusantara Sulawesi',
    officialFlppPrice: 173000000,
    regulationNote: 'Kepmen PUPR 689/2023 · Zona Sulawesi/Kepri',
    defaultQuota: 4000,
    registeredMembers: 3120,
    defaultDailyContribution: 50000,
    defaultInflationRate: 0.045,
    developerPartner: 'Mitra Developer FLPP BTN Sulawesi',
  },
  {
    id: 'kalimantan',
    regionName: 'Kalimantan',
    shortLabel: 'Kalimantan',
    sampleCities: 'Balikpapan, Samarinda, Pontianak, Banjarmasin, Penyangga IKN',
    clusterName: 'Klaster Gen-Z BTN Borneo Raya',
    officialFlppPrice: 182000000,
    regulationNote: 'Kepmen PUPR 689/2023 · Zona Kalimantan',
    defaultQuota: 4500,
    registeredMembers: 3825,
    defaultDailyContribution: 50000,
    defaultInflationRate: 0.05,
    developerPartner: 'Mitra Developer Subsidi BTN Kalimantan',
  },
  {
    id: 'papua',
    regionName: 'Papua & Papua Barat',
    shortLabel: 'Papua',
    sampleCities: 'Jayapura, Sorong, Timika, Merauke, Manokwari',
    clusterName: 'Klaster Gen-Z BTN Cenderawasih',
    officialFlppPrice: 240000000,
    regulationNote: 'Kepmen PUPR 689/2023 · Zona Papua',
    defaultQuota: 3500,
    registeredMembers: 2450,
    defaultDailyContribution: 65000,
    defaultInflationRate: 0.05,
    developerPartner: 'Mitra Developer FLPP BTN Papua',
  },
];

export interface ArisanPresetScenario {
  id: string;
  label: string;
  badge: string;
  dailyContribution: number;
  quotaMembers: number;
  annualInflationRate: number;
  useAutoMarkup: boolean;
  manualMarkupRate?: number;
  description: string;
}

export const GENZ_ARISAN_PRESETS: ArisanPresetScenario[] = [
  {
    id: 'ideal-genz',
    label: 'Ideal Gen-Z',
    badge: 'Disarankan',
    dailyContribution: 50000,
    quotaMembers: 5000,
    annualInflationRate: 0.045,
    useAutoMarkup: true,
    description: 'Rp 50rb/hari (~1,5 Jt/bln) · 5.000 peserta · ~1,5 rumah/hari di awal & selesai ~11 thn',
  },
  {
    id: 'akselerasi-2unit',
    label: 'Akselerasi 2 Unit/Hari',
    badge: '2 Rumah/Hari',
    dailyContribution: 45000,
    quotaMembers: 7500,
    annualInflationRate: 0.045,
    useAutoMarkup: true,
    description: 'Rp 45rb/hari · 7.500 peserta · cashflow Rp 337,5 Jt/hari → 2 rumah laku tiap hari di awal',
  },
  {
    id: 'cepat-8thn',
    label: 'Ekspres 8–9 Tahun',
    badge: 'Paling Cepat',
    dailyContribution: 65000,
    quotaMembers: 5000,
    annualInflationRate: 0.045,
    useAutoMarkup: true,
    description: 'Rp 65rb/hari (~1,95 Jt/bln) · semua peserta selesai dapat rumah dalam 8–9 tahun',
  },
  {
    id: 'konsep-awal-20rb',
    label: 'Baseline Rp 20rb/Hari',
    badge: 'Pembanding',
    dailyContribution: 20000,
    quotaMembers: 7500,
    annualInflationRate: 0.045,
    useAutoMarkup: false,
    manualMarkupRate: 0.0,
    description: 'Pembanding konsep awal Rp 20rb/hari · 7.500 peserta (durasi ~22 thn & rentan inflasi)',
  },
];
