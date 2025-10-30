/**
 * Calculation Utilities
 * Business calculation logic (tax, totals, etc.)
 */

import { APP_CONFIG } from '../constants';
import { CartItem } from '../types';

/**
 * Calculate tax amount from subtotal
 */
export const calculateTax = (subtotal: number): number => {
  return subtotal * APP_CONFIG.TAX_RATE;
};

/**
 * Calculate total from subtotal (includes tax)
 */
export const calculateTotal = (subtotal: number): number => {
  return subtotal + calculateTax(subtotal);
};

/**
 * Calculate subtotal from cart items
 */
export const calculateCartSubtotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
};

/**
 * Calculate cart summary (subtotal, tax, total, count)
 */
export const calculateCartSummary = (items: CartItem[]) => {
  const subtotal = calculateCartSubtotal(items);
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal,
    tax,
    total,
    itemCount,
  };
};

/**
 * Calculate order item subtotal
 */
export const calculateOrderItemSubtotal = (unitPrice: number, quantity: number): number => {
  return unitPrice * quantity;
};

/**
 * Round to 2 decimal places (for currency)
 */
export const roundCurrency = (value: number): number => {
  return Math.round(value * 100) / 100;
};

/**
 * Calculate discount amount
 */
export const calculateDiscount = (price: number, discountPercent: number): number => {
  return price * (discountPercent / 100);
};

/**
 * Apply discount to price
 */
export const applyDiscount = (price: number, discountPercent: number): number => {
  return price - calculateDiscount(price, discountPercent);
};
