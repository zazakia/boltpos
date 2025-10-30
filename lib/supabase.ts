import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks and validation
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate that we have the required configuration
if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing SUPABASE_ANON_KEY environment variable');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Unit of Measure type
export type UnitOfMeasure = {
  name: string;
  conversion_to_base: number;
  is_base: boolean;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'admin' | 'staff';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: 'admin' | 'staff';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: 'admin' | 'staff';
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          price: number;
          category_id: string | null;
          image_url: string | null;
          stock: number;
          active: boolean;
          base_uom: string;
          uom_list: UnitOfMeasure[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          category_id?: string | null;
          image_url?: string | null;
          stock?: number;
          active?: boolean;
          base_uom?: string;
          uom_list?: UnitOfMeasure[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          category_id?: string | null;
          image_url?: string | null;
          stock?: number;
          active?: boolean;
          base_uom?: string;
          uom_list?: UnitOfMeasure[];
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          total: number;
          tax: number;
          status: 'completed' | 'refunded' | 'cancelled';
          payment_method: 'cash' | 'card' | 'mobile';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total: number;
          tax?: number;
          status?: 'completed' | 'refunded' | 'cancelled';
          payment_method?: 'cash' | 'card' | 'mobile';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          total?: number;
          tax?: number;
          status?: 'completed' | 'refunded' | 'cancelled';
          payment_method?: 'cash' | 'card' | 'mobile';
          created_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price: number;
          subtotal: number;
          uom: string;
          conversion_to_base: number;
          base_quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price: number;
          subtotal: number;
          uom?: string;
          conversion_to_base?: number;
          base_quantity?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          price?: number;
          subtotal?: number;
          uom?: string;
          conversion_to_base?: number;
          base_quantity?: number;
          created_at?: string;
        };
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          contact_person: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_person?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          contact_person?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      branches: {
        Row: {
          id: string;
          code: string;
          name: string;
          address: string | null;
          phone: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          address?: string | null;
          phone?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          address?: string | null;
          phone?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      receiving_vouchers: {
        Row: {
          id: string;
          reference_number: string;
          supplier_id: string | null;
          user_id: string;
          total_amount: number;
          remarks: string | null;
          status: 'completed' | 'cancelled';
          received_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference_number: string;
          supplier_id?: string | null;
          user_id: string;
          total_amount?: number;
          remarks?: string | null;
          status?: 'completed' | 'cancelled';
          received_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference_number?: string;
          supplier_id?: string | null;
          user_id?: string;
          total_amount?: number;
          remarks?: string | null;
          status?: 'completed' | 'cancelled';
          received_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      receiving_voucher_items: {
        Row: {
          id: string;
          receiving_voucher_id: string;
          product_id: string;
          quantity: number;
          uom: string;
          conversion_to_base: number;
          base_quantity: number;
          unit_cost: number;
          total_cost: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          receiving_voucher_id: string;
          product_id: string;
          quantity: number;
          uom: string;
          conversion_to_base?: number;
          base_quantity: number;
          unit_cost: number;
          total_cost: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          receiving_voucher_id?: string;
          product_id?: string;
          quantity?: number;
          uom?: string;
          conversion_to_base?: number;
          base_quantity?: number;
          unit_cost?: number;
          total_cost?: number;
          created_at?: string;
        };
      };
      inventory_adjustments: {
        Row: {
          id: string;
          reference_number: string;
          user_id: string;
          adjustment_type: 'in' | 'out';
          reason: string | null;
          remarks: string | null;
          status: 'completed' | 'cancelled';
          adjustment_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference_number: string;
          user_id: string;
          adjustment_type: 'in' | 'out';
          reason?: string | null;
          remarks?: string | null;
          status?: 'completed' | 'cancelled';
          adjustment_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference_number?: string;
          user_id?: string;
          adjustment_type?: 'in' | 'out';
          reason?: string | null;
          remarks?: string | null;
          status?: 'completed' | 'cancelled';
          adjustment_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory_adjustment_items: {
        Row: {
          id: string;
          adjustment_id: string;
          product_id: string;
          quantity: number;
          uom: string;
          conversion_to_base: number;
          base_quantity: number;
          remarks: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          adjustment_id: string;
          product_id: string;
          quantity: number;
          uom: string;
          conversion_to_base?: number;
          base_quantity: number;
          remarks?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          adjustment_id?: string;
          product_id?: string;
          quantity?: number;
          uom?: string;
          conversion_to_base?: number;
          base_quantity?: number;
          remarks?: string | null;
          created_at?: string;
        };
      };
      transfers: {
        Row: {
          id: string;
          reference_number: string;
          from_branch_id: string;
          to_branch_id: string;
          user_id: string;
          remarks: string | null;
          status: 'pending' | 'in_transit' | 'received' | 'cancelled';
          transfer_date: string;
          received_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference_number: string;
          from_branch_id: string;
          to_branch_id: string;
          user_id: string;
          remarks?: string | null;
          status?: 'pending' | 'in_transit' | 'received' | 'cancelled';
          transfer_date?: string;
          received_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference_number?: string;
          from_branch_id?: string;
          to_branch_id?: string;
          user_id?: string;
          remarks?: string | null;
          status?: 'pending' | 'in_transit' | 'received' | 'cancelled';
          transfer_date?: string;
          received_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      transfer_items: {
        Row: {
          id: string;
          transfer_id: string;
          product_id: string;
          quantity: number;
          uom: string;
          conversion_to_base: number;
          base_quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          transfer_id: string;
          product_id: string;
          quantity: number;
          uom: string;
          conversion_to_base?: number;
          base_quantity: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          transfer_id?: string;
          product_id?: string;
          quantity?: number;
          uom?: string;
          conversion_to_base?: number;
          base_quantity?: number;
          created_at?: string;
        };
      };
      customer_returns: {
        Row: {
          id: string;
          reference_number: string;
          order_id: string | null;
          user_id: string;
          total_amount: number;
          reason: string | null;
          remarks: string | null;
          status: 'completed' | 'cancelled';
          return_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference_number: string;
          order_id?: string | null;
          user_id: string;
          total_amount?: number;
          reason?: string | null;
          remarks?: string | null;
          status?: 'completed' | 'cancelled';
          return_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference_number?: string;
          order_id?: string | null;
          user_id?: string;
          total_amount?: number;
          reason?: string | null;
          remarks?: string | null;
          status?: 'completed' | 'cancelled';
          return_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      customer_return_items: {
        Row: {
          id: string;
          return_id: string;
          product_id: string;
          quantity: number;
          uom: string;
          conversion_to_base: number;
          base_quantity: number;
          unit_price: number;
          total_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          return_id: string;
          product_id: string;
          quantity: number;
          uom: string;
          conversion_to_base?: number;
          base_quantity: number;
          unit_price: number;
          total_amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          return_id?: string;
          product_id?: string;
          quantity?: number;
          uom?: string;
          conversion_to_base?: number;
          base_quantity?: number;
          unit_price?: number;
          total_amount?: number;
          created_at?: string;
        };
      };
      supplier_returns: {
        Row: {
          id: string;
          reference_number: string;
          receiving_voucher_id: string | null;
          supplier_id: string | null;
          user_id: string;
          total_amount: number;
          reason: string | null;
          remarks: string | null;
          status: 'completed' | 'cancelled';
          return_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference_number: string;
          receiving_voucher_id?: string | null;
          supplier_id?: string | null;
          user_id: string;
          total_amount?: number;
          reason?: string | null;
          remarks?: string | null;
          status?: 'completed' | 'cancelled';
          return_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference_number?: string;
          receiving_voucher_id?: string | null;
          supplier_id?: string | null;
          user_id?: string;
          total_amount?: number;
          reason?: string | null;
          remarks?: string | null;
          status?: 'completed' | 'cancelled';
          return_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      supplier_return_items: {
        Row: {
          id: string;
          return_id: string;
          product_id: string;
          quantity: number;
          uom: string;
          conversion_to_base: number;
          base_quantity: number;
          unit_cost: number;
          total_cost: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          return_id: string;
          product_id: string;
          quantity: number;
          uom: string;
          conversion_to_base?: number;
          base_quantity: number;
          unit_cost: number;
          total_cost: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          return_id?: string;
          product_id?: string;
          quantity?: number;
          uom?: string;
          conversion_to_base?: number;
          base_quantity?: number;
          unit_cost?: number;
          total_cost?: number;
          created_at?: string;
        };
      };
    };
  };
};
