/**
 * User-facing Messages and Error Messages
 */

export const MESSAGES = {
  // Success messages
  SUCCESS: {
    PRODUCT_CREATED: 'Product created successfully',
    PRODUCT_UPDATED: 'Product updated successfully',
    PRODUCT_DELETED: 'Product deleted successfully',

    CATEGORY_CREATED: 'Category created successfully',
    CATEGORY_UPDATED: 'Category updated successfully',
    CATEGORY_DELETED: 'Category deleted successfully',

    ORDER_CREATED: 'Order created successfully',
    ORDER_UPDATED: 'Order updated successfully',

    USER_CREATED: 'User created successfully',
    USER_UPDATED: 'User updated successfully',
    USER_DELETED: 'User deleted successfully',

    PASSWORD_UPDATED: 'Password updated successfully',
    PROFILE_UPDATED: 'Profile updated successfully',

    LOGIN_SUCCESS: 'Logged in successfully',
    LOGOUT_SUCCESS: 'Logged out successfully',
    SIGNUP_SUCCESS: 'Account created successfully',

    CART_ITEM_ADDED: 'Item added to cart',
    CART_CLEARED: 'Cart cleared',
  },

  // Error messages
  ERROR: {
    GENERIC: 'An error occurred. Please try again.',
    NETWORK: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    NOT_FOUND: 'Resource not found.',

    PRODUCT_LOAD_FAILED: 'Failed to load products',
    PRODUCT_CREATE_FAILED: 'Failed to create product',
    PRODUCT_UPDATE_FAILED: 'Failed to update product',
    PRODUCT_DELETE_FAILED: 'Failed to delete product',

    CATEGORY_LOAD_FAILED: 'Failed to load categories',
    CATEGORY_CREATE_FAILED: 'Failed to create category',
    CATEGORY_UPDATE_FAILED: 'Failed to update category',
    CATEGORY_DELETE_FAILED: 'Failed to delete category',

    ORDER_LOAD_FAILED: 'Failed to load orders',
    ORDER_CREATE_FAILED: 'Failed to create order',
    ORDER_UPDATE_FAILED: 'Failed to update order',

    USER_LOAD_FAILED: 'Failed to load users',
    USER_CREATE_FAILED: 'Failed to create user',
    USER_UPDATE_FAILED: 'Failed to update user',
    USER_DELETE_FAILED: 'Failed to delete user',

    PASSWORD_UPDATE_FAILED: 'Failed to update password',
    PROFILE_UPDATE_FAILED: 'Failed to update profile',
    PROFILE_LOAD_FAILED: 'Failed to load profile',

    LOGIN_FAILED: 'Invalid email or password',
    SIGNUP_FAILED: 'Failed to create account',
    LOGOUT_FAILED: 'Failed to log out',

    CART_EMPTY: 'Cart is empty',
    INVALID_QUANTITY: 'Invalid quantity',
    OUT_OF_STOCK: 'Product is out of stock',
  },

  // Validation messages
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Invalid email address',
    PASSWORD_TOO_SHORT: 'Password must be at least 6 characters',
    INVALID_PRICE: 'Price must be greater than 0',
    INVALID_QUANTITY: 'Quantity must be greater than 0',
    INVALID_STOCK: 'Stock quantity cannot be negative',
  },

  // Confirmation messages
  CONFIRM: {
    DELETE_PRODUCT: 'Are you sure you want to delete this product?',
    DELETE_CATEGORY: 'Are you sure you want to delete this category?',
    DELETE_USER: 'Are you sure you want to delete this user?',
    CANCEL_ORDER: 'Are you sure you want to cancel this order?',
    CLEAR_CART: 'Are you sure you want to clear the cart?',
    LOGOUT: 'Are you sure you want to log out?',
  },

  // Info messages
  INFO: {
    NO_PRODUCTS: 'No products found',
    NO_CATEGORIES: 'No categories found',
    NO_ORDERS: 'No orders found',
    NO_USERS: 'No users found',
    EMPTY_CART: 'Your cart is empty',
    ADMIN_ONLY: 'This feature is only available to administrators',
  },
} as const;
