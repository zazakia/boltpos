// Enhanced utilities for InventoryPro System
import { InventoryItem, Warehouse, Alert, DashboardKPIs } from '@/types/inventory';

// Philippine Peso Currency Formatting
export const currencyUtils = {
  /**
   * Format amount as Philippine Peso with proper formatting
   */
  formatPHP: (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  /**
   * Format amount as simple PHP string (₱1,234.56)
   */
  formatSimplePHP: (amount: number): string => {
    return `₱${amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  },

  /**
   * Format amount for display in forms and inputs
   */
  formatInput: (amount: number): string => {
    return amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  },

  /**
   * Parse currency input to number
   */
  parseCurrency: (value: string): number => {
    return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
  },
};

// Date and Time Utilities
export const dateUtils = {
  /**
   * Format date as readable string
   */
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  /**
   * Format date and time
   */
  formatDateTime: (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  /**
   * Check if item is expiring soon (within 30 days)
   */
  isExpiringSoon: (expiryDate: string, days: number = 30): boolean => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= days;
  },

  /**
   * Check if item is expired
   */
  isExpired: (expiryDate: string): boolean => {
    return new Date(expiryDate) < new Date();
  },

  /**
   * Get days until expiry
   */
  getDaysUntilExpiry: (expiryDate: string): number => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Get future date by adding days
   */
  addDays: (date: Date, days: number): string => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString();
  },
};

// Stock and Inventory Utilities
export const inventoryUtils = {
  /**
   * Calculate warehouse utilization percentage
   */
  calculateUtilization: (warehouse: Warehouse): number => {
    if (warehouse.capacity === 0) return 0;
    return Math.round((warehouse.currentUtilization / warehouse.capacity) * 100);
  },

  /**
   * Get utilization status color
   */
  getUtilizationColor: (percentage: number): 'green' | 'yellow' | 'red' => {
    if (percentage < 60) return 'green';
    if (percentage < 80) return 'yellow';
    return 'red';
  },

  /**
   * Check if warehouse is over capacity
   */
  isOverCapacity: (warehouse: Warehouse): boolean => {
    return warehouse.currentUtilization > warehouse.capacity;
  },

  /**
   * Calculate total stock value
   */
  calculateTotalValue: (items: InventoryItem[]): number => {
    return items.reduce((total, item) => total + (item.quantity * item.unitCost), 0);
  },

  /**
   * Get stock status for a product
   */
  getStockStatus: (currentStock: number, minStockLevel: number): 'low' | 'normal' | 'out' => {
    if (currentStock === 0) return 'out';
    if (currentStock <= minStockLevel) return 'low';
    return 'normal';
  },

  /**
   * Calculate FIFO inventory value (First In, First Out)
   */
  calculateFIFOValue: (items: InventoryItem[]): number => {
    return items
      .sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime())
      .reduce((total, item) => total + (item.quantity * item.unitCost), 0);
  },
};

// Alert Utilities
export const alertUtils = {
  /**
   * Generate alert title based on type
   */
  getAlertTitle: (alert: Alert): string => {
    switch (alert.type) {
      case 'low_stock':
        return 'Low Stock Alert';
      case 'expiring_soon':
        return 'Expiring Soon';
      case 'expired':
        return 'Expired Items';
      case 'warehouse_full':
        return 'Warehouse Capacity Alert';
      default:
        return 'Alert';
    }
  },

  /**
   * Get alert severity color
   */
  getSeverityColor: (severity: Alert['severity']): 'info' | 'warning' | 'error' => {
    switch (severity) {
      case 'info':
        return 'info';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'info';
    }
  },

  /**
   * Check if alert requires immediate action
   */
  isCritical: (alert: Alert): boolean => {
    return alert.severity === 'critical' || alert.type === 'expired';
  },
};

// Unit of Measure Utilities
export const uomUtils = {
  /**
   * Convert quantity from one UOM to another
   */
  convertUOM: (quantity: number, fromUOM: string, toUOM: string, conversionFactor: number): number => {
    if (fromUOM === toUOM) return quantity;
    // Assume conversion factor is from alternate UOM to base UOM
    return quantity * conversionFactor;
  },

  /**
   * Format UOM display name
   */
  formatUOM: (uom: string): string => {
    const uomMap: Record<string, string> = {
      'bottle': 'Bottle',
      'can': 'Can',
      'carton': 'Carton',
      'pack': 'Pack',
      'case': 'Case',
    };
    return uomMap[uom.toLowerCase()] || uom;
  },

  /**
   * Calculate price for different UOM
   */
  calculateUOMPrice: (basePrice: number, baseUOM: string, alternateUOM: any): number => {
    if (alternateUOM.name === baseUOM) return basePrice;
    return basePrice * alternateUOM.conversionFactor;
  },
};

// Business Logic Utilities
export const businessUtils = {
  /**
   * Calculate tax amount (Philippine VAT 12%)
   */
  calculateTax: (subtotal: number, taxRate: number = 12): number => {
    return subtotal * (taxRate / 100);
  },

  /**
   * Generate PO number
   */
  generatePONumber: (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PO-${year}${month}-${random}`;
  },

  /**
   * Generate sales order number
   */
  generateSalesOrderNumber: (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SO-${year}${month}-${random}`;
  },

  /**
   * Generate receipt number
   */
  generateReceiptNumber: (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `REC-${year}${month}${day}-${random}`;
  },

  /**
   * Generate batch number
   */
  generateBatchNumber: (productId: string): string => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BATCH-${productId.slice(0, 8)}-${dateStr}-${random}`;
  },
};

// Validation Utilities
export const validationUtils = {
  /**
   * Validate email format
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone number (Philippine format)
   */
  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^(\+63|0)[9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  },

  /**
   * Validate currency amount
   */
  isValidAmount: (amount: string | number): boolean => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return !isNaN(num) && num >= 0;
  },

  /**
   * Validate date is in the future
   */
  isFutureDate: (date: string): boolean => {
    return new Date(date) > new Date();
  },

  /**
   * Validate required field
   */
  isRequired: (value: any): boolean => {
    return value !== null && value !== undefined && value !== '';
  },
};

// Search and Filter Utilities
export const searchUtils = {
  /**
   * Normalize string for search
   */
  normalizeString: (str: string): string => {
    return str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  },

  /**
   * Search in array of objects
   */
  searchInArray: <T>(
    array: T[],
    searchTerm: string,
    searchFields: (keyof T)[]
  ): T[] => {
    if (!searchTerm.trim()) return array;

    const normalizedSearch = searchUtils.normalizeString(searchTerm);
    return array.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return value && searchUtils.normalizeString(String(value)).includes(normalizedSearch);
      })
    );
  },

  /**
   * Filter array by criteria
   */
  filterByCriteria: <T>(array: T[], criteria: Partial<T>): T[] => {
    return array.filter(item =>
      Object.entries(criteria).every(([key, value]) => {
        if (value === undefined || value === null) return true;
        return item[key as keyof T] === value;
      })
    );
  },
};

// Local Storage Utilities for client-side persistence
export const storageUtils = {
  /**
   * Save to localStorage with error handling
   */
  save: <T>(key: string, data: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return false;
    }
  },

  /**
   * Load from localStorage with error handling
   */
  load: <T>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return defaultValue;
    }
  },

  /**
   * Remove from localStorage
   */
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
      return false;
    }
  },

  /**
   * Clear all localStorage data
   */
  clear: (): boolean => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  },
};

// Performance and Debouncing Utilities
export const performanceUtils = {
  /**
   * Debounce function
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Throttle function
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
};