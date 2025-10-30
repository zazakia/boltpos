/**
 * API Types
 * Types for API requests and responses
 */

import { OrderStatus, PaymentMethod } from './models';

// Generic API Response
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

// Product API Types
export interface CreateProductDto {
  name: string;
  description?: string | null;
  price: number;
  category_id?: string | null;
  stock_quantity: number;
  is_active?: boolean;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  id: string;
}

// Category API Types
export interface CreateCategoryDto {
  name: string;
  color: string;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {
  id: string;
}

// Order API Types
export interface CreateOrderDto {
  user_id: string;
  total_amount: number;
  tax_amount: number;
  status?: OrderStatus;
  payment_method: PaymentMethod;
}

export interface CreateOrderItemDto {
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface CreateOrderWithItemsDto {
  order: CreateOrderDto;
  items: Omit<CreateOrderItemDto, 'order_id'>[];
}

// User API Types
export interface CreateUserDto {
  email: string;
  password: string;
  full_name?: string;
  role?: 'admin' | 'staff';
}

export interface UpdateUserDto {
  id: string;
  full_name?: string;
  role?: 'admin' | 'staff';
}

export interface UpdatePasswordDto {
  userId: string;
  newPassword: string;
}

// Auth API Types
export interface SignInDto {
  email: string;
  password: string;
}

export interface SignUpDto {
  email: string;
  password: string;
  full_name?: string;
}

// Query Types
export interface OrderFilters {
  userId?: string;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
}

export interface ProductFilters {
  categoryId?: string;
  isActive?: boolean;
  searchTerm?: string;
}
