/**
 * Color Constants
 */

export const COLORS = {
  // Primary colors
  PRIMARY: '#007AFF',
  SECONDARY: '#5856D6',

  // Status colors
  SUCCESS: '#34C759',
  WARNING: '#FF9500',
  ERROR: '#FF3B30',
  INFO: '#007AFF',

  // Order status colors
  ORDER_STATUS: {
    pending: '#FF9500',
    completed: '#34C759',
    cancelled: '#FF3B30',
  },

  // Role badge colors
  ROLE: {
    admin: '#FF3B30',
    staff: '#007AFF',
  },

  // Text colors
  TEXT: {
    PRIMARY: '#000000',
    SECONDARY: '#6B7280',
    TERTIARY: '#9CA3AF',
    WHITE: '#FFFFFF',
  },

  // Background colors
  BACKGROUND: {
    PRIMARY: '#FFFFFF',
    SECONDARY: '#F3F4F6',
    TERTIARY: '#E5E7EB',
  },

  // Border colors
  BORDER: {
    LIGHT: '#E5E7EB',
    MEDIUM: '#D1D5DB',
    DARK: '#9CA3AF',
  },

  // Category default colors (for color picker)
  CATEGORY_PALETTE: [
    '#FF3B30', // Red
    '#FF9500', // Orange
    '#FFCC00', // Yellow
    '#34C759', // Green
    '#00C7BE', // Teal
    '#007AFF', // Blue
    '#5856D6', // Purple
    '#FF2D55', // Pink
  ],
} as const;

// Type for order status colors
export type OrderStatusColor = keyof typeof COLORS.ORDER_STATUS;

// Type for role colors
export type RoleColor = keyof typeof COLORS.ROLE;
