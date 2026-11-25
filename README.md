# btn TumbuhLayak
**Ekosistem Arisan Rumah Harian Gen-Z, Kartu Kunci Pintar NFC, Perencanaan Rumah Tumbuh & Valuasi Properti Bank BTN**  
*Diajukan untuk BTN Housingpreneur Batch 3 — Kategori: Housing Innovation*

---

## Ringkasan Konsep

**btn TumbuhLayak** menyatukan seluruh siklus kepemilikan rumah bagi generasi muda (Gen-Z) dan nasabah **Bank BTN** dalam satu platform digital:

1. **Arisan Rumah Harian Gen-Z Berbasis Lokasi (Arisan Klaster + KPR FLPP vs Arisan Murni)**
   - Menggunakan plafon harga resmi rumah subsidi FLPP & SBUM (Rp 4 Jt non-Papua, Rp 10 Jt Papua) per wilayah Indonesia sesuai **[Kepmen PUPR No. 689/KPTS/M/2023](https://jdih.pu.go.id/internal/assets/assets/produk/KepmenPUPR/2023/06/2023kmpupr689.pdf) (berlaku sejak 2024, cek pembaruan)**: Jawa & Sumatra (Rp 166 Jt), Sulawesi/Babel/Mentawai/Kepri (Rp 173 Jt), Kalimantan (Rp 182 Jt), Jabodetabek serta Bali, Nusa Tenggara, Maluku, Maluku Utara, Kep. Anambas, Murung Raya & Mahakam Ulu (Rp 185 Jt), serta Papua (Rp 240 Jt).
   - Dilengkapi toggle perbandingan **Arisan klaster + KPR FLPP** (`src/lib/clusterScheme.ts`) vs **Arisan murni**, Dashboard Peserta, Dashboard BTN (rekening baru, dana masuk harian, kapasitas akad, CASA), **pemeriksaan kelayakan MBR (Permen PKP No. 5/2025) & DSR**, serta panel asumsi dan tautan sumber resmi.

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
    │   ├── ArisanCharts.tsx           # Dual SVG charts for pure arisan projection
    │   ├── ArisanLayerView.tsx        # Location-first arisan, cluster+KPR toggle, dashboards & MBR/DSR
    │   ├── BtnLogo.tsx                # Official Bank BTN logo component
    │   ├── ClusterSchemeCharts.tsx    # 3 SVG charts for Arisan Klaster + KPR FLPP vs Arisan Murni
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
    │   ├── calculator.ts              # Deterministic RAB, depreciation, valuation & pure arisan engine
    │   ├── clusterScheme.ts           # Standalone Arisan Klaster + KPR FLPP comparison simulator
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
