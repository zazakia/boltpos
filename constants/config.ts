/**
 * Application Configuration Constants
 */

export const APP_CONFIG = {
  // Tax configuration
  TAX_RATE: 0.1, // 10% tax rate

  // Pagination
  DEFAULT_PAGE_SIZE: 20,

  // Currency
  CURRENCY: 'UGX',
  CURRENCY_SYMBOL: 'UGX',

  // Order defaults
  DEFAULT_ORDER_STATUS: 'pending' as const,

  // Product defaults
  DEFAULT_STOCK_QUANTITY: 0,
  MIN_STOCK_WARNING: 10,

  // Password requirements
  MIN_PASSWORD_LENGTH: 6,

  // Timeouts
  API_TIMEOUT: 30000, // 30 seconds

  // Retry config
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

export const ROUTES = {
  AUTH: {
    LOGIN: '/login',
    SIGNUP: '/signup',
  },
  TABS: {
    POS: '/',
    CART: '/cart',
    PRODUCTS: '/products',
    ORDERS: '/orders',
    USERS: '/users',
    PROFILE: '/profile',
  },
} as const;
