# btn TumbuhLayak
**Ekosistem Arisan Rumah Harian Gen-Z, Kartu Kunci Pintar NFC, Perencanaan Rumah Tumbuh & Valuasi Properti Bank BTN**  
*Diajukan untuk BTN Housingpreneur Batch 3 — Kategori: Housing Innovation*

---

## Ringkasan Konsep

**btn TumbuhLayak** menyatukan seluruh siklus kepemilikan rumah bagi generasi muda (Gen-Z) dan nasabah **Bank BTN** dalam satu platform digital:

1. **Arisan Rumah Harian Gen-Z Berbasis Lokasi (Rekening Escrow BTN)**
   - Menggunakan plafon harga resmi rumah subsidi FLPP Bank BTN per wilayah Indonesia sesuai **Kepmen PUPR No. 689/KPTS/M/2023 (berlaku 2024–2026)**: Jawa & Sumatra (Rp 166 Jt), Sulawesi/Babel/Kepri (Rp 173 Jt), Kalimantan (Rp 182 Jt), Jabodetabek/Bali/Nusra (Rp 185 Jt), serta Papua (Rp 240 Jt).
   - Sistem kuota per wilayah dengan kewajiban pembukaan **Rekening Tabungan BTN auto-debit harian** (menambah nasabah baru & dana murah/CASA Bank BTN).
   - Kalkulator interaktif dengan **proyeksi kenaikan harga tahunan**, **markup penyangga inflasi otomatis (`solveIdealArisanMarkup`)**, **percepatan serah terima 1–2 rumah subsidi per hari di tahun-tahun awal**, serta 2 grafik proyeksi SVG & tabel tahunan.

2. **Jembatan Fisik–Digital: Scan Kartu Kunci Rumah Pintar (NFC)**
   - Penerima serah terima rumah memperoleh **Kartu Kunci Rumah fisik berchip NFC** (`BTN-NFC-XXXX-XXXX`).
   - Mendukung **Web NFC API (`NDEFReader`)** pada Chrome Android serta verifikasi nomor seri kartu tercetak.
   - Menu **Perencanaan & Nilai Rumah** pada bilah navigasi mengambang baru terbuka setelah kartu kunci rumah terverifikasi dan otomatis memuat data sertifikat, tipe kavling, usia bangunan, serta denah awal unit tersebut.

3. **Perencanaan Rumah Tumbuh, Penyusutan & Valuasi Properti**
   - **Editor Denah Arsitektural Interaktif**: 4 tipe kavling (36/72, 21/60, 45/90, Hook 36/96), geser & ubah ukuran ruang tersinkron langsung ke RAB, cermin orientasi, Lantai 1/2, ruang kustom, dan simulasi bukaan daun pintu arsitektural (90°/20°, tunggal/ganda/geser), jendela, kolom struktur, garis as, serta kompas utara.
   - **Perhitungan Penyusutan Bangunan (*Depreciation*) & Nilai Renovasi**: Model penyusutan garis lurus berbasis SPI/MAPPI (tanah tidak menyusut; struktur menyusut sesuai usia, umur ekonomis, dan kondisi fisik) dipadukan dengan proyeksi nilai setelah renovasi, ekuitas bersih, ROI, rasio KDB (≤ 65%), dan grafik proyeksi 5 tahun.
   - **Simulasi KPR Mikro Renovasi BTN & Proposal A4 Siap Cetak**: Uji rasio DSR, rasio LTV jaminan, opsi tabungan mandiri, serta cetak PDF A4 (`window.print()`) berkop resmi **btn**.

---

## Identitas Visual & Arsitektur Teknis

- **Brand Guideline Resmi `btn.co.id`**: Logo resmi `btn` (`public/btn-logo.png`, `public/btn-logo-white.png`), BTN Dynamic Blue (`#125EFA`), BTN Stable Red (`#DC0714`), tipografi **Poppins**, **Plus Jakarta Sans**, dan **IBM Plex Mono**.
- **Stack**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Zod validation, Lucide icons.
- **Mandiri & Deterministik**: Seluruh data acuan FLPP, SNI konstruksi, dan registri NFC lokal berjalan tanpa ketergantungan API pihak ketiga yang rawan gagal saat presentasi, dan seluruh parameter harga dapat disesuaikan langsung oleh pengguna.
- **Keamanan**: Validasi skema Zod (`src/lib/validation.ts`), HTTP security headers & CSP produksi (`next.config.mjs`), serta menu **Keamanan Akun** (ubah kata sandi, OTP 2 langkah, notifikasi scan NFC).

---

## Struktur Proyek

```text
├── next.config.mjs
├── tailwind.config.js
├── public/
│   ├── btn-logo.png
│   └── btn-logo-white.png
└── src/
    ├── app/
    │   ├── globals.css
    │   ├── icon.png
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components/
    │   ├── AppShell.tsx               # Floating top horizontal navbar & account menu
    │   ├── ArisanCharts.tsx           # Dual SVG charts (units/day vs inflation & cumulative curve)
    │   ├── ArisanLayerView.tsx        # Location-first Gen-Z daily micro-arisan & quota calculator
    │   ├── BtnLogo.tsx                # Official Bank BTN logo component
    │   ├── HouseBlueprint.tsx         # Interactive architectural floorplan & door swing editor
    │   ├── LoginScreen.tsx            # Portal login with demo personas
    │   ├── NfcScannerView.tsx         # Pure NFC smart home key verification screen
    │   ├── PlannerWorkspace.tsx       # Phased RAB planner, floorplan & depreciation controls
    │   ├── ProposalPrintView.tsx      # Printable A4 executive proposal
    │   ├── SecurityBadgeModal.tsx     # Account security modal (password, 2FA, NFC lock)
    │   ├── ValuationAnalyticsView.tsx # Valuation, depreciation, KPR BTN, DSR & LTV simulator
    │   └── VisualCharts.tsx           # Property value & 5-year projection charts
    ├── data/
    │   ├── arisanLocations.ts         # Official Kepmen PUPR 689/2023 FLPP regional prices
    │   ├── floorplanPresets.ts        # 4 Indonesian house templates with doors/windows/axes
    │   ├── housingConfig.ts           # Baseline SNI construction modules & BTN rates
    │   └── nfcPropertyRegistry.ts     # Demo accounts & BTN NFC smart key unit registry
    ├── lib/
    │   ├── calculator.ts              # Deterministic RAB, depreciation, valuation & arisan engine
    │   ├── formatters.ts              # IDR (Jt/M/T), area & percentage formatters
    │   └── validation.ts              # Zod validation schemas
    └── types/
        └── index.ts                   # TypeScript domain models
```

---

## Cara Menjalankan Secara Lokal

### Prasyarat
- Node.js v18+ (disarankan v20+)
- npm v9+

### Instalasi & Jalankan Development Server
```bash
npm install
npm run dev
```
Buka browser di `http://localhost:3000`.

### Build Produksi
```bash
npm run build
npm run start
```
