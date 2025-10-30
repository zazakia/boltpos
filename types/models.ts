/**
 * Domain Models
 * Centralized type definitions for all domain entities
 */

// User & Authentication Types
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'staff';
  created_at: string;
}

// Product & Category Types
export interface Category {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  categories?: Category | null;
}

export interface ProductWithCategory extends Product {
  categories: Category;
}

// Order Types
export type OrderStatus = 'pending' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'mobile_money';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  products?: Product | null;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  tax_amount: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  created_at: string;
  profiles?: UserProfile | null;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export interface OrderWithDetails extends Order {
  order_items: (OrderItem & { products: Product })[];
  profiles: UserProfile;
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartSummary {
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
}
