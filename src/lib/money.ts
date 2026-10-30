/**
 * Financial money formatting and conversion utilities for LedgerLite.
 * All monetary amounts in database are stored as integers in minor units (e.g., 100 paise = 1.00 INR).
 */

export function formatMoney(amountMinor: number | bigint | null | undefined, currency: string = 'INR'): string {
  const num = typeof amountMinor === 'bigint' ? Number(amountMinor) : (amountMinor || 0);
  const major = num / 100;

  try {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(major);
  } catch {
    // Fallback if currency is unusual
    return `${currency} ${major.toFixed(2)}`;
  }
}

export function formatMoneyWithoutSymbol(amountMinor: number | bigint | null | undefined): string {
  const num = typeof amountMinor === 'bigint' ? Number(amountMinor) : (amountMinor || 0);
  const major = num / 100;
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);
}

export function parseMoneyToMinor(input: string | number): number {
  if (typeof input === 'number') {
    return Math.round(input * 100);
  }
  const cleaned = input.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}
