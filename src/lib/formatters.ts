/**
 * TumbuhLayak - Currency and Format Utilities
 * Formats numbers into clear, professional Indonesian Rupiah and units.
 */

export function formatRupiah(amount: number, compact = false): string {
  if (isNaN(amount) || !isFinite(amount)) return 'Rp 0';

  if (compact) {
    if (Math.abs(amount) >= 1_000_000_000_000) {
      return `Rp ${(amount / 1_000_000_000_000).toFixed(2).replace('.', ',')} T`;
    }
    if (Math.abs(amount) >= 1_000_000_000) {
      return `Rp ${(amount / 1_000_000_000).toFixed(2).replace('.', ',')} M`;
    }
    if (Math.abs(amount) >= 1_000_000) {
      return `Rp ${(amount / 1_000_000).toFixed(1).replace('.', ',')} Jt`;
    }
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatArea(squareMeters: number): string {
  if (isNaN(squareMeters) || !isFinite(squareMeters)) return '0 m²';
  return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(squareMeters)} m²`;
}

export function formatPercent(decimal: number, fractionDigits = 1): string {
  if (isNaN(decimal) || !isFinite(decimal)) return '0%';
  return `${(decimal * 100).toFixed(fractionDigits).replace('.', ',')}%`;
}

export function formatNumber(num: number): string {
  if (isNaN(num) || !isFinite(num)) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
}
