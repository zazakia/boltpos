import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks and validation
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Log environment variable status for debugging
console.log('Supabase: URL exists:', !!supabaseUrl);
console.log('Supabase: Anon key exists:', !!supabaseAnonKey);
console.log('Supabase: URL value:', supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined');

// Validate that we have the required configuration
if (!supabaseUrl) {
  console.error('Supabase: Missing SUPABASE_URL environment variable');
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  console.error('Supabase: Missing SUPABASE_ANON_KEY environment variable');
  throw new Error('Missing SUPABASE_ANON_KEY environment variable');
}

console.log('Supabase: Creating Supabase client');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Service role client for admin operations (bypasses RLS and email confirmation)
export const supabaseService = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZydGlmZWVneWxhbnplaWNnb2FxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA5MTI0NiwiZXhwIjoyMDc3NjY3MjQ2fQ.ChoAehj12NchZsgFS0iGfPaSiX8sA5qLBHaxfwT7zF0', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('Supabase: Client created successfully');

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'admin' | 'staff';
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: 'admin' | 'staff';
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: 'admin' | 'staff';
          active?: boolean;
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
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price: number;
          subtotal: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          price?: number;
          subtotal?: number;
          created_at?: string;
        };
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          contact_person: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_person?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          contact_person?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      vouchers: {
        Row: {
          id: string;
          voucher_number: string;
          supplier_id: string;
          user_id: string;
          total_amount: number;
          status: 'pending' | 'received' | 'cancelled';
          received_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          voucher_number: string;
          supplier_id: string;
          user_id: string;
          total_amount?: number;
          status?: 'pending' | 'received' | 'cancelled';
          received_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          voucher_number?: string;
          supplier_id?: string;
          user_id?: string;
          total_amount?: number;
          status?: 'pending' | 'received' | 'cancelled';
          received_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      voucher_items: {
        Row: {
          id: string;
          voucher_id: string;
          product_id: string;
          quantity: number;
          unit_cost: number;
          subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          voucher_id: string;
          product_id: string;
          quantity: number;
          unit_cost: number;
          subtotal: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          voucher_id?: string;
          product_id?: string;
          quantity?: number;
          unit_cost?: number;
          subtotal?: number;
          created_at?: string;
        };
      };
      accounts_payable: {
        Row: {
          id: string;
          supplier_id: string;
          voucher_id: string | null;
          amount_due: number;
          amount_paid: number;
          balance: number;
          payment_date: string | null;
          status: 'unpaid' | 'partially_paid' | 'paid';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          supplier_id: string;
          voucher_id?: string | null;
          amount_due: number;
          amount_paid?: number;
          payment_date?: string | null;
          status?: 'unpaid' | 'partially_paid' | 'paid';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          supplier_id?: string;
          voucher_id?: string | null;
          amount_due?: number;
          amount_paid?: number;
          payment_date?: string | null;
          status?: 'unpaid' | 'partially_paid' | 'paid';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
