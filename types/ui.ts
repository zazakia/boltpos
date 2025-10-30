/**
 * UI Types
 * Types specific to UI components and state
 */

// Modal Types
export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// Form Types
export interface FormFieldError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: FormFieldError[];
  isSubmitting: boolean;
  isDirty: boolean;
}

// Loading States
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// Table/List Types
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

// Navigation Types
export type TabRoute = 'index' | 'cart' | 'products' | 'orders' | 'users' | 'profile';
export type AuthRoute = 'login' | 'signup';
