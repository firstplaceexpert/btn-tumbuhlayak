import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'btn TumbuhLayak: Arisan Rumah BTN, Smart Key NFC & Valuasi Rumah Tumbuh',
  description:
    'Platform BTN Housingpreneur Batch 3 (Housing Innovation) dengan skema arisan rumah BTN, autentikasi kartu kunci rumah NFC, editor denah arsitektural, perhitungan penyusutan & proyeksi nilai properti.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-frame text-ink antialiased selection:bg-brand-soft selection:text-brand">
        {children}
      </body>
    </html>
  );
}
