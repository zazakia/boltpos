/**
 * Currency Formatting Utilities
 */

import { APP_CONFIG } from '../constants';

/**
 * Format amount as currency with symbol
 */
export function formatCurrency(amount: number): string {
  return `${APP_CONFIG.CURRENCY_SYMBOL} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format price (alias for formatCurrency)
 */
export function formatPrice(price: number): string {
  return formatCurrency(price);
}

/**
 * Parse currency string to number
 */
export function parseCurrency(currencyString: string): number {
  const cleanedString = currencyString.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleanedString) || 0;
}

/**
 * Format number without currency symbol
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}