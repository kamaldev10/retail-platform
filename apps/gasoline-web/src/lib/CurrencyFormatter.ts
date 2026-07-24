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

/**
 * Formats a float/number with a comma as decimal separator (e.g., 1.2 -> "1,20", 1 -> "1,00").
 */
export function formatFloatComma(value: number, decimals: number = 2): string {
  if (isNaN(value)) return '0,' + '0'.repeat(decimals);
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formats a float/number with a dot as decimal separator (e.g., 1.2 -> "1.20", 1 -> "1.00").
 */
export function formatFloatDot(value: number, decimals: number = 2): string {
  if (isNaN(value)) return '0.' + '0'.repeat(decimals);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Universal helper that formats float with either comma or dot.
 */
export function formatFloat(value: number, format: 'comma' | 'dot' = 'comma', decimals: number = 2): string {
  return format === 'comma' ? formatFloatComma(value, decimals) : formatFloatDot(value, decimals);
}

