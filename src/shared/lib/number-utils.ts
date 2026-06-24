/**
 * Number formatting utilities
 */

export interface FormatNumberOptions {
  /**
   * Locale for formatting (default: 'vi-VN')
   */
  locale?: string;
  /**
   * Minimum number of fraction digits (default: 0)
   */
  minimumFractionDigits?: number;
  /**
   * Maximum number of fraction digits (default: 2)
   */
  maximumFractionDigits?: number;
  /**
   * Whether to use grouping separators (default: true)
   */
  useGrouping?: boolean;
}

/**
 * Format number with thousand separators
 * @example
 * formatNumber(1234567.89) // "1,234,567.89"
 * formatNumber(1234567.89, { locale: 'vi-VN' }) // "1.234.567,89"
 * formatNumber(1234567, { minimumFractionDigits: 2 }) // "1,234,567.00"
 */
export function formatNumber(
  value: number | string | null | undefined,
  options?: FormatNumberOptions,
): string {
  if (value === null || value === undefined || value === '') {
    return '0';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return '0';
  }

  const {
    locale = 'en-US',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    useGrouping = true,
  } = options || {};

  return num.toLocaleString(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
  });
}

/**
 * Format number with Vietnamese locale (1.234.567,89)
 * @example
 * formatNumberVN(1234567.89) // "1.234.567,89"
 */
export function formatNumberVN(
  value: number | string | null | undefined,
  options?: Omit<FormatNumberOptions, 'locale'>,
): string {
  return formatNumber(value, { ...options, locale: 'vi-VN' });
}

/**
 * Format currency with symbol
 * @example
 * formatCurrency(1234567.89) // "$1,234,567.89"
 * formatCurrency(1234567.89, 'VND') // "1.234.567,89 ₫"
 * formatCurrency(1234567.89, 'USD', 'vi-VN') // "1.234.567,89 US$"
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currency: string = 'USD',
  locale: string = 'en-US',
): string {
  if (value === null || value === undefined || value === '') {
    return '0';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return '0';
  }

  return num.toLocaleString(locale, {
    style: 'currency',
    currency,
  });
}

/**
 * Format currency in VND (Vietnamese Dong)
 * @example
 * formatCurrencyVND(1234567) // "1.234.567 ₫"
 */
export function formatCurrencyVND(
  value: number | string | null | undefined,
): string {
  return formatCurrency(value, 'VND', 'vi-VN');
}

/**
 * Format number to compact notation (K, M, B, T)
 * @example
 * formatCompactNumber(1234) // "1.2K"
 * formatCompactNumber(1234567) // "1.2M"
 * formatCompactNumber(1234567890) // "1.2B"
 */
export function formatCompactNumber(
  value: number | string | null | undefined,
  locale: string = 'en-US',
): string {
  if (value === null || value === undefined || value === '') {
    return '0';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return '0';
  }

  // For browsers that support Intl.NumberFormat with notation
  if (
    typeof Intl !== 'undefined' &&
    Intl.NumberFormat &&
    'notation' in Intl.NumberFormat.prototype
  ) {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
  }

  // Fallback for older browsers
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1e12) {
    return sign + (absNum / 1e12).toFixed(1) + 'T';
  }
  if (absNum >= 1e9) {
    return sign + (absNum / 1e9).toFixed(1) + 'B';
  }
  if (absNum >= 1e6) {
    return sign + (absNum / 1e6).toFixed(1) + 'M';
  }
  if (absNum >= 1e3) {
    return sign + (absNum / 1e3).toFixed(1) + 'K';
  }

  return num.toString();
}

/**
 * Format percentage
 * @example
 * formatPercent(0.1234) // "12.34%"
 * formatPercent(0.1234, 0) // "12%"
 */
export function formatPercent(
  value: number | string | null | undefined,
  decimals: number = 2,
): string {
  if (value === null || value === undefined || value === '') {
    return '0%';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return '0%';
  }

  return (num * 100).toFixed(decimals) + '%';
}

/**
 * Format file size
 * @example
 * formatFileSize(1024) // "1 KB"
 * formatFileSize(1048576) // "1 MB"
 * formatFileSize(1073741824) // "1 GB"
 */
export function formatFileSize(
  bytes: number | string | null | undefined,
  decimals: number = 2,
): string {
  if (bytes === null || bytes === undefined || bytes === '') {
    return '0 Bytes';
  }

  const num = typeof bytes === 'string' ? parseFloat(bytes) : bytes;

  if (isNaN(num) || num === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(num) / Math.log(k));

  return parseFloat((num / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Parse formatted number string to number
 * @example
 * parseFormattedNumber("1,234,567.89") // 1234567.89
 * parseFormattedNumber("1.234.567,89") // 1234567.89
 */
export function parseFormattedNumber(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }

  // Remove all non-digit characters except dots and commas
  let cleaned = value.replace(/[^\d.,]/g, '');

  // Detect if comma is decimal separator (European format)
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  if (lastComma > lastDot) {
    // European format: 1.234.567,89
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // US format: 1,234,567.89
    cleaned = cleaned.replace(/,/g, '');
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Format number with ordinal suffix
 * @example
 * formatOrdinal(1) // "1st"
 * formatOrdinal(2) // "2nd"
 * formatOrdinal(3) // "3rd"
 * formatOrdinal(4) // "4th"
 */
export function formatOrdinal(value: number | string): string {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;

  if (isNaN(num)) {
    return '0';
  }

  const j = num % 10;
  const k = num % 100;

  if (j === 1 && k !== 11) {
    return num + 'st';
  }
  if (j === 2 && k !== 12) {
    return num + 'nd';
  }
  if (j === 3 && k !== 13) {
    return num + 'rd';
  }

  return num + 'th';
}

/**
 * Clamp number between min and max
 * @example
 * clamp(5, 0, 10) // 5
 * clamp(-5, 0, 10) // 0
 * clamp(15, 0, 10) // 10
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Round number to specified decimal places
 * @example
 * roundTo(1.2345, 2) // 1.23
 * roundTo(1.2355, 2) // 1.24
 */
export function roundTo(value: number, decimals: number = 0): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Check if value is a valid number
 * @example
 * isValidNumber(123) // true
 * isValidNumber("123") // true
 * isValidNumber("abc") // false
 * isValidNumber(NaN) // false
 */
export function isValidNumber(value: unknown): boolean {
  if (value === null || value === undefined || value === '') {
    return false;
  }

  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return !isNaN(num) && isFinite(num);
}
