/**
 * Acuan Harga Rumah Tapak Subsidi (KPR FLPP) & Batas Penghasilan MBR
 * Sumber Harga & SBUM: Keputusan Menteri PUPR No. 689/KPTS/M/2023 (berlaku sejak 2024, cek pembaruan)
 * Sumber Batas MBR: Peraturan Menteri PKP Nomor 5 Tahun 2025
 *
 * Catatan: Jumlah pendaftar (registeredMembers), nama klaster, dan kapasitas akad adalah DATA SIMULASI.
 */

import { ArisanLocationZone } from '../types';

export const OFFICIAL_REGULATION_SOURCES = {
  kepmenPupr689Url:
    'https://jdih.pu.go.id/internal/assets/assets/produk/KepmenPUPR/2023/06/2023kmpupr689.pdf',
  kepmenPupr689Label: 'Kepmen PUPR No. 689/KPTS/M/2023 (JDIH PU · berlaku sejak 2024, cek pembaruan)',
  permenPkp5Label: 'Permen PKP No. 5 Tahun 2025 (Zonasi Batas Penghasilan MBR)',
  priceUpdateReferenceUrl:
    'https://ekonomi.bisnis.com/read/20250710/47/1892186/wacana-rumah-subsidi-mini-batal-cek-harga-ukuran-yang-berlaku-saat-ini',
};

export const ARISAN_LOCATION_ZONES: ArisanLocationZone[] = [
  {
    id: 'jawa',
    regionName: 'Jawa (Non-Jabodetabek)',
    shortLabel: 'Jawa',
    sampleCities: 'Bandung Raya, Semarang, Yogyakarta, Solo, Surabaya, Malang',
    clusterName: 'Simulasi Klaster Jawa',
    officialFlppPrice: 166000000,
    sbumAmount: 4000000,
    regulationNote: 'Kepmen PUPR 689/2023 · berlaku sejak 2024, cek pembaruan',
    mbrZoneLabel: 'Zona 1 MBR (Permen PKP 5/2025)',
    mbrMaxIncomeSingle: 8500000,
    mbrMaxIncomeMarried: 10000000,
    defaultQuota: 5000,
    registeredMembers: 4420,
    defaultDailyContribution: 50000,
    defaultInflationRate: 0.045,
    developerPartner: 'Mitra Pengembang Subsidi Jawa (simulasi)',
  },
  {
    id: 'jabodetabek',
    regionName: 'Jabodetabek',
    shortLabel: 'Jabodetabek',
    sampleCities: 'Jakarta, Bogor, Depok, Tangerang, Bekasi, Cikarang',
    clusterName: 'Simulasi Klaster Jabodetabek',
    officialFlppPrice: 185000000,
    sbumAmount: 4000000,
    regulationNote: 'Kepmen PUPR 689/2023 · kelompok harga Rp 185 Jt (berlaku sejak 2024)',
    mbrZoneLabel: 'Zona 4 MBR (Permen PKP 5/2025)',
    mbrMaxIncomeSingle: 12000000,
    mbrMaxIncomeMarried: 14000000,
    defaultQuota: 5500,
    registeredMembers: 5115,
    defaultDailyContribution: 55000,
    defaultInflationRate: 0.05,
    developerPartner: 'Mitra Pengembang Subsidi Jabodetabek (simulasi)',
  },
  {
    id: 'bali-nusra-maluku',
    regionName: 'Bali, Nusa Tenggara, Maluku & Maluku Utara',
    shortLabel: 'Bali, Nusra & Maluku',
    sampleCities: 'Denpasar, Mataram, Kupang, Ambon, Ternate, Anambas, Murung Raya, Mahakam Ulu',
    clusterName: 'Simulasi Klaster Bali, Nusra & Maluku',
    officialFlppPrice: 185000000,
    sbumAmount: 4000000,
    regulationNote:
      'Kepmen PUPR 689/2023 · kelompok harga Rp 185 Jt termasuk Kep. Anambas, Murung Raya & Mahakam Ulu',
    mbrZoneLabel: 'Zona 2 MBR (Bali/Maluku) · Zona 1 untuk NTT/NTB',
    mbrMaxIncomeSingle: 9000000,
    mbrMaxIncomeMarried: 11000000,
    mbrNote: 'Untuk NTT & NTB masuk Zona 1 MBR (maks. Rp 8,5 Jt lajang / Rp 10 Jt menikah).',
    defaultQuota: 4500,
    registeredMembers: 3540,
    defaultDailyContribution: 55000,
    defaultInflationRate: 0.045,
    developerPartner: 'Mitra Pengembang Wilayah Timur (simulasi)',
  },
  {
    id: 'sumatra',
    regionName: 'Sumatra (Kec. Kepri, Babel & Mentawai)',
    shortLabel: 'Sumatra',
    sampleCities: 'Medan, Palembang, Pekanbaru, Padang, Jambi, Bandar Lampung',
    clusterName: 'Simulasi Klaster Sumatra',
    officialFlppPrice: 166000000,
    sbumAmount: 4000000,
    regulationNote: 'Kepmen PUPR 689/2023 · berlaku sejak 2024, cek pembaruan',
    mbrZoneLabel: 'Zona 1 MBR (Permen PKP 5/2025)',
    mbrMaxIncomeSingle: 8500000,
    mbrMaxIncomeMarried: 10000000,
    defaultQuota: 4500,
    registeredMembers: 3690,
    defaultDailyContribution: 45000,
    defaultInflationRate: 0.045,
    developerPartner: 'Mitra Pengembang Subsidi Sumatra (simulasi)',
  },
  {
    id: 'sulawesi-kepri',
    regionName: 'Sulawesi, Babel, Mentawai & Kep. Riau',
    shortLabel: 'Sulawesi & Kepri',
    sampleCities: 'Makassar, Manado, Kendari, Batam, Pangkalpinang (kec. Kep. Anambas)',
    clusterName: 'Simulasi Klaster Sulawesi & Kepri',
    officialFlppPrice: 173000000,
    sbumAmount: 4000000,
    regulationNote: 'Kepmen PUPR 689/2023 · berlaku sejak 2024, cek pembaruan',
    mbrZoneLabel: 'Zona 2 MBR (Permen PKP 5/2025)',
    mbrMaxIncomeSingle: 9000000,
    mbrMaxIncomeMarried: 11000000,
    defaultQuota: 4000,
    registeredMembers: 3120,
    defaultDailyContribution: 50000,
    defaultInflationRate: 0.045,
    developerPartner: 'Mitra Pengembang Sulawesi & Kepri (simulasi)',
  },
  {
    id: 'kalimantan',
    regionName: 'Kalimantan (Kec. Murung Raya & Mahakam Ulu)',
    shortLabel: 'Kalimantan',
    sampleCities: 'Balikpapan, Samarinda, Pontianak, Banjarmasin, Penyangga IKN',
    clusterName: 'Simulasi Klaster Kalimantan',
    officialFlppPrice: 182000000,
    sbumAmount: 4000000,
    regulationNote: 'Kepmen PUPR 689/2023 · berlaku sejak 2024, cek pembaruan',
    mbrZoneLabel: 'Zona 2 MBR (Permen PKP 5/2025)',
    mbrMaxIncomeSingle: 9000000,
    mbrMaxIncomeMarried: 11000000,
    defaultQuota: 4500,
    registeredMembers: 3825,
    defaultDailyContribution: 50000,
    defaultInflationRate: 0.05,
    developerPartner: 'Mitra Pengembang Kalimantan (simulasi)',
  },
  {
    id: 'papua',
    regionName: 'Papua & Papua Barat (Seluruh Provinsi Papua)',
    shortLabel: 'Papua',
    sampleCities: 'Jayapura, Sorong, Timika, Merauke, Manokwari',
    clusterName: 'Simulasi Klaster Papua',
    officialFlppPrice: 240000000,
    sbumAmount: 10000000,
    regulationNote: 'Kepmen PUPR 689/2023 · SBUM Rp 10 Jt khusus Papua (berlaku sejak 2024)',
    mbrZoneLabel: 'Zona 3 MBR (Permen PKP 5/2025)',
    mbrMaxIncomeSingle: 10500000,
    mbrMaxIncomeMarried: 12000000,
    defaultQuota: 3500,
    registeredMembers: 2450,
    defaultDailyContribution: 65000,
    defaultInflationRate: 0.05,
    developerPartner: 'Mitra Pengembang Papua (simulasi)',
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
    badge: 'Simulasi',
    dailyContribution: 50000,
    quotaMembers: 5000,
    annualInflationRate: 0.045,
    useAutoMarkup: true,
    description:
      'Rp 50rb/hari (~1,5 Jt/bln) · 5.000 peserta · ~1,5 rumah/hari di tahun-tahun awal, melambat seiring kenaikan harga',
  },
  {
    id: 'akselerasi-2unit',
    label: 'Akselerasi Awal',
    badge: '~2 Unit/Hari Awal',
    dailyContribution: 45000,
    quotaMembers: 7500,
    annualInflationRate: 0.045,
    useAutoMarkup: true,
    description:
      'Rp 45rb/hari · 7.500 peserta · ~1,8–2 rumah/hari di tahun-tahun awal, lalu turun bertahap saat harga properti naik',
  },
  {
    id: 'cepat-8thn',
    label: 'Siklus Lebih Singkat',
    badge: '8–10 Tahun',
    dailyContribution: 65000,
    quotaMembers: 5000,
    annualInflationRate: 0.045,
    useAutoMarkup: true,
    description:
      'Rp 65rb/hari (~1,95 Jt/bln) · memperpendek waktu tunggu peserta terakhir menjadi ~8–10 tahun (simulasi)',
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
    description:
      'Pembanding konsep awal Rp 20rb/hari tanpa markup: durasi >22 thn dan defisit penyangga inflasi',
  },
];
