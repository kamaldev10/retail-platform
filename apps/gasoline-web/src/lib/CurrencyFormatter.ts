/**
 * Utility functions for formatting and parsing Indonesian Rupiah currency.
 */

/**
 * Formats a numeric value into standard Indonesian Rupiah currency string (e.g., Rp100.000).
 */
export function formatRupiah(value: number): string {
  if (isNaN(value)) return 'Rp0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Parses a numeric input or string containing currency characters to a raw number.
 */
export function parseRupiah(value: string | number): number {
  if (typeof value === 'number') return value;
  const clean = value.replace(/[^0-9-]/g, '');
  return parseInt(clean, 10) || 0;
}

/**
 * Formats a raw number string into Indonesian styled dotted format (e.g., 1000000 -> 1.000.000) for interactive inputs.
 */
export function formatInputNumber(value: string | number): string {
  const cleanStr = String(value).replace(/[^0-9]/g, '');
  if (!cleanStr) return '';
  const num = parseInt(cleanStr, 10);
  return num.toLocaleString('id-ID');
}
