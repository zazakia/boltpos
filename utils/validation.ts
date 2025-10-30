/**
 * Validation Utilities
 * Reusable validation functions
 */

import { MESSAGES, APP_CONFIG } from '../constants';

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= APP_CONFIG.MIN_PASSWORD_LENGTH;
};

/**
 * Validate positive number
 */
export const isPositiveNumber = (value: number): boolean => {
  return !isNaN(value) && value > 0;
};

/**
 * Validate non-negative number
 */
export const isNonNegativeNumber = (value: number): boolean => {
  return !isNaN(value) && value >= 0;
};

/**
 * Validate required field
 */
export const isRequired = (value: string | null | undefined): boolean => {
  return value !== null && value !== undefined && value.trim().length > 0;
};

/**
 * Validate product data
 */
export interface ProductValidationResult {
  isValid: boolean;
  errors: { field: string; message: string }[];
}

export const validateProduct = (data: {
  name: string;
  price: number;
  stock_quantity: number;
}): ProductValidationResult => {
  const errors: { field: string; message: string }[] = [];

  if (!isRequired(data.name)) {
    errors.push({ field: 'name', message: MESSAGES.VALIDATION.REQUIRED_FIELD });
  }

  if (!isPositiveNumber(data.price)) {
    errors.push({ field: 'price', message: MESSAGES.VALIDATION.INVALID_PRICE });
  }

  if (!isNonNegativeNumber(data.stock_quantity)) {
    errors.push({ field: 'stock_quantity', message: MESSAGES.VALIDATION.INVALID_STOCK });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate category data
 */
export const validateCategory = (data: {
  name: string;
  color: string;
}): ProductValidationResult => {
  const errors: { field: string; message: string }[] = [];

  if (!isRequired(data.name)) {
    errors.push({ field: 'name', message: MESSAGES.VALIDATION.REQUIRED_FIELD });
  }

  if (!isRequired(data.color)) {
    errors.push({ field: 'color', message: MESSAGES.VALIDATION.REQUIRED_FIELD });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate user data
 */
export const validateUser = (data: {
  email: string;
  password?: string;
}): ProductValidationResult => {
  const errors: { field: string; message: string }[] = [];

  if (!isRequired(data.email)) {
    errors.push({ field: 'email', message: MESSAGES.VALIDATION.REQUIRED_FIELD });
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: 'email', message: MESSAGES.VALIDATION.INVALID_EMAIL });
  }

  if (data.password !== undefined) {
    if (!isRequired(data.password)) {
      errors.push({ field: 'password', message: MESSAGES.VALIDATION.REQUIRED_FIELD });
    } else if (!isValidPassword(data.password)) {
      errors.push({ field: 'password', message: MESSAGES.VALIDATION.PASSWORD_TOO_SHORT });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate order item quantity
 */
export const validateQuantity = (quantity: number, stockAvailable?: number): {
  isValid: boolean;
  error?: string;
} => {
  if (!isPositiveNumber(quantity)) {
    return { isValid: false, error: MESSAGES.VALIDATION.INVALID_QUANTITY };
  }

  if (stockAvailable !== undefined && quantity > stockAvailable) {
    return { isValid: false, error: MESSAGES.ERROR.OUT_OF_STOCK };
  }

  return { isValid: true };
};
