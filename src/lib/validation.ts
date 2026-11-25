/**
 * TumbuhLayak - Defensive Coding & Zod Input Validation
 * Protects against NaN, Infinity, negative values, string overflow, and injection attempts.
 */

import { z } from 'zod';

// Utility to sanitize basic text strings against HTML tag injections
export function sanitizeString(input: unknown, maxLength = 100): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>'"`;()]/g, '')
    .trim()
    .slice(0, maxLength);
}

// Strict login input schema (prototype local authentication)
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(5, 'Masukkan email atau ID nasabah yang valid')
    .max(90, 'Email maksimal 90 karakter')
    .email('Format email tidak valid'),
  pin: z
    .string()
    .trim()
    .min(4, 'Kata sandi atau PIN minimal 4 karakter')
    .max(40, 'Kata sandi maksimal 40 karakter'),
});

// Strict customer registration schema (simulated bank KYC biodata)
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Nama lengkap minimal 3 karakter sesuai KTP')
      .max(80, 'Nama maksimal 80 karakter')
      .transform((val) => sanitizeString(val, 80)),
    nik: z
      .string()
      .trim()
      .regex(/^\d{16}$/, 'NIK harus tepat 16 digit angka sesuai KTP'),
    birthPlace: z
      .string()
      .trim()
      .min(2, 'Tempat lahir wajib diisi')
      .max(50, 'Tempat lahir maksimal 50 karakter')
      .transform((val) => sanitizeString(val, 50)),
    birthDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pilih tanggal lahir yang valid')
      .refine((val) => {
        const year = parseInt(val.slice(0, 4), 10);
        return year >= 1945 && year <= 2008;
      }, 'Usia minimal 18 tahun untuk pendaftaran KPR BTN'),
    hasBtnAccount: z.boolean(),
    btnAccountNumber: z.string().trim().optional(),
    domicileZoneId: z.string().trim().min(2, 'Pilih wilayah domisili'),
    domicileCity: z
      .string()
      .trim()
      .min(2, 'Masukkan kota / kabupaten domisili')
      .max(60, 'Domisili maksimal 60 karakter')
      .transform((val) => sanitizeString(val, 60)),
    email: z
      .string()
      .trim()
      .min(5, 'Masukkan email yang valid')
      .max(90, 'Email maksimal 90 karakter')
      .email('Format email tidak valid'),
    pin: z
      .string()
      .trim()
      .min(6, 'Kata sandi / PIN minimal 6 karakter')
      .max(40, 'Kata sandi maksimal 40 karakter'),
  })
  .refine(
    (data) =>
      !data.hasBtnAccount ||
      /^\d{10,16}$/.test((data.btnAccountNumber || '').replace(/[\s-]/g, '')),
    {
      message: 'Nomor rekening BTN harus berisi 10–16 digit angka (atau centang buka rekening otomatis)',
      path: ['btnAccountNumber'],
    }
  );

// Strict NFC Smart Key Card UID validation
export const nfcUidSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^BTN-NFC-[A-Z0-9]{4}-[0-9]{4}$/,
    'Format nomor seri kartu harus sesuai standar BTN (contoh: BTN-NFC-3672-0014)'
  );

// Strict password update schema for Account Security modal
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .trim()
      .min(4, 'Masukkan kata sandi saat ini'),
    newPassword: z
      .string()
      .trim()
      .min(6, 'Kata sandi baru minimal 6 karakter')
      .max(40, 'Kata sandi maksimal 40 karakter'),
    confirmPassword: z
      .string()
      .trim()
      .min(1, 'Konfirmasi kata sandi baru wajib diisi'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Konfirmasi kata sandi baru tidak cocok',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'Kata sandi baru harus berbeda dari kata sandi saat ini',
    path: ['newPassword'],
  });

// Strict schema for property profile including depreciation assumptions
export const housingProfileSchema = z
  .object({
    namaPemilik: z
      .string()
      .trim()
      .min(2, 'Nama minimal 2 karakter')
      .max(80, 'Nama maksimal 80 karakter')
      .transform((val) => sanitizeString(val, 80)),
    lokasiKota: z
      .string()
      .trim()
      .min(2, 'Lokasi minimal 2 karakter')
      .max(100, 'Lokasi maksimal 100 karakter')
      .transform((val) => sanitizeString(val, 100)),
    luasTanah: z
      .number({ invalid_type_error: 'Luas tanah harus berupa angka valid' })
      .finite('Nilai tidak boleh Infinity')
      .min(20, 'Luas tanah minimal 20 m²')
      .max(2000, 'Luas tanah maksimal 2.000 m²'),
    luasBangunanEksisting: z
      .number({ invalid_type_error: 'Luas bangunan harus berupa angka valid' })
      .finite('Nilai tidak boleh Infinity')
      .min(10, 'Luas bangunan eksisting minimal 10 m²')
      .max(1500, 'Luas bangunan maksimal 1.500 m²'),
    nilaiAwalProperti: z
      .number({ invalid_type_error: 'Nilai properti harus berupa angka valid' })
      .finite('Nilai tidak boleh Infinity')
      .min(10000000, 'Nilai awal properti minimal Rp 10.000.000')
      .max(50000000000, 'Nilai awal properti maksimal Rp 50 Miliar'),
    contingencyRate: z
      .number({ invalid_type_error: 'Biaya tak terduga harus berupa angka valid' })
      .finite('Nilai tidak boleh Infinity')
      .min(0, 'Contingency minimal 0%')
      .max(0.3, 'Contingency maksimal 30%'),
    tahunDibangun: z
      .number({ invalid_type_error: 'Tahun bangun tidak valid' })
      .finite()
      .min(1980, 'Tahun bangun minimal 1980')
      .max(2030, 'Tahun bangun maksimal 2030'),
    usiaBangunanTahun: z
      .number({ invalid_type_error: 'Usia bangunan tidak valid' })
      .finite()
      .min(0, 'Usia bangunan minimal 0 tahun')
      .max(45, 'Usia bangunan maksimal 45 tahun'),
    umurEkonomisTahun: z
      .number({ invalid_type_error: 'Umur ekonomis tidak valid' })
      .finite()
      .min(15, 'Umur ekonomis minimal 15 tahun')
      .max(60, 'Umur ekonomis maksimal 60 tahun'),
    porsiNilaiTanah: z
      .number({ invalid_type_error: 'Porsi nilai tanah tidak valid' })
      .finite()
      .min(0.25, 'Porsi tanah minimal 25%')
      .max(0.85, 'Porsi tanah maksimal 85%'),
    kondisiBangunan: z.enum(['prima', 'terawat', 'perlu-peremajaan']),
  })
  .refine((data) => data.luasBangunanEksisting <= data.luasTanah * 1.5, {
    message: 'Luas bangunan eksisting tidak realistis melebihi 150% luas tanah',
    path: ['luasBangunanEksisting'],
  });

// Strict schema for module editing & overrides
export const moduleOverrideSchema = z.object({
  customVolume: z
    .number({ invalid_type_error: 'Volume harus angka valid' })
    .finite('Volume tidak boleh Infinity')
    .min(1, 'Volume minimal 1 unit/m²')
    .max(200, 'Volume maksimal 200 unit/m²'),
  customUnitPrice: z
    .number({ invalid_type_error: 'Harga satuan harus angka valid' })
    .finite('Harga satuan tidak boleh Infinity')
    .min(100000, 'Harga satuan minimal Rp 100.000')
    .max(30000000, 'Harga satuan maksimal Rp 30.000.000'),
  customMaterialRatio: z
    .number({ invalid_type_error: 'Porsi material harus angka valid' })
    .finite('Porsi material tidak boleh Infinity')
    .min(0.1, 'Porsi material minimal 10%')
    .max(0.9, 'Porsi material maksimal 90%'),
  customLaborRatio: z
    .number({ invalid_type_error: 'Porsi upah harus angka valid' })
    .finite('Porsi upah tidak boleh Infinity')
    .min(0.1, 'Porsi upah minimal 10%')
    .max(0.9, 'Porsi upah maksimal 90%'),
  customValueFactor: z
    .number({ invalid_type_error: 'Faktor nilai harus angka valid' })
    .finite('Faktor nilai tidak boleh Infinity')
    .min(0.5, 'Faktor nilai minimal 0.5')
    .max(2.5, 'Faktor nilai maksimal 2.5'),
});

// Helper to validate and coerce numeric input safely
export function parseSafeNumber(
  val: string | number,
  fallback = 0,
  min = 0,
  max = Number.MAX_SAFE_INTEGER
): number {
  if (typeof val === 'number') {
    if (isNaN(val) || !isFinite(val)) return fallback;
    return Math.max(min, Math.min(max, val));
  }
  const cleanStr = String(val).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleanStr);
  if (isNaN(parsed) || !isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}
