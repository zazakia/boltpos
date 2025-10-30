import { formatCurrency, formatPrice } from '../currency';

describe('Currency Utilities', () => {
  describe('formatCurrency', () => {
    it('should format whole numbers with two decimal places', () => {
      expect(formatCurrency(100)).toBe('₱100.00');
      expect(formatCurrency(1000)).toBe('₱1000.00');
      expect(formatCurrency(0)).toBe('₱0.00');
    });

    it('should format decimal numbers with two decimal places', () => {
      expect(formatCurrency(99.99)).toBe('₱99.99');
      expect(formatCurrency(1.5)).toBe('₱1.50');
      expect(formatCurrency(0.99)).toBe('₱0.99');
    });

    it('should round to two decimal places', () => {
      expect(formatCurrency(99.999)).toBe('₱100.00');
      expect(formatCurrency(99.994)).toBe('₱99.99');
      expect(formatCurrency(1.006)).toBe('₱1.01');
    });

    it('should handle negative numbers', () => {
      expect(formatCurrency(-100)).toBe('₱-100.00');
      expect(formatCurrency(-99.99)).toBe('₱-99.99');
      expect(formatCurrency(-0.01)).toBe('₱-0.01');
    });

    it('should handle very large numbers', () => {
      expect(formatCurrency(999999.99)).toBe('₱999999.99');
      expect(formatCurrency(1000000)).toBe('₱1000000.00');
    });

    it('should handle very small numbers', () => {
      expect(formatCurrency(0.01)).toBe('₱0.01');
      expect(formatCurrency(0.001)).toBe('₱0.00');
    });
  });

  describe('formatPrice', () => {
    it('should format whole numbers with two decimal places', () => {
      expect(formatPrice(100)).toBe('₱100.00');
      expect(formatPrice(1000)).toBe('₱1000.00');
      expect(formatPrice(0)).toBe('₱0.00');
    });

    it('should format decimal numbers with two decimal places', () => {
      expect(formatPrice(99.99)).toBe('₱99.99');
      expect(formatPrice(1.5)).toBe('₱1.50');
      expect(formatPrice(0.99)).toBe('₱0.99');
    });

    it('should round to two decimal places', () => {
      expect(formatPrice(99.999)).toBe('₱100.00');
      expect(formatPrice(99.994)).toBe('₱99.99');
      expect(formatPrice(1.006)).toBe('₱1.01');
    });

    it('should handle negative numbers', () => {
      expect(formatPrice(-100)).toBe('₱-100.00');
      expect(formatPrice(-99.99)).toBe('₱-99.99');
      expect(formatPrice(-0.01)).toBe('₱-0.01');
    });

    it('should handle very large numbers', () => {
      expect(formatPrice(999999.99)).toBe('₱999999.99');
      expect(formatPrice(1000000)).toBe('₱1000000.00');
    });

    it('should handle very small numbers', () => {
      expect(formatPrice(0.01)).toBe('₱0.01');
      expect(formatPrice(0.001)).toBe('₱0.00');
    });
  });

  describe('formatCurrency vs formatPrice', () => {
    it('should produce identical results for same input', () => {
      const testValues = [0, 1, 99.99, 100, 1000.50, -50];

      testValues.forEach(value => {
        expect(formatCurrency(value)).toBe(formatPrice(value));
      });
    });
  });
});
