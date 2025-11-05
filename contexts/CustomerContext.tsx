import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  credit_limit?: number;
  current_balance?: number;
  loyalty_points?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

type CustomerWithStats = Customer & {
  total_orders?: number;
  total_spent?: number;
  avg_order_value?: number;
  last_order_date?: string;
};

type CustomerContextType = {
  customers: CustomerWithStats[];
  selectedCustomer: CustomerWithStats | null;
  loading: boolean;
  searchCustomers: (query: string) => Promise<Customer[]>;
  selectCustomer: (customer: CustomerWithStats | null) => void;
  addCustomer: (
    customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>,
  ) => Promise<Customer>;
  updateCustomer: (
    id: string,
    customer: Partial<Customer>,
  ) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  loadCustomers: () => Promise<void>;
  clearSelectedCustomer: () => void;
};

const CustomerContext = createContext<CustomerContextType | undefined>(
  undefined,
);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerWithStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customer_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchCustomers = async (query: string): Promise<Customer[]> => {
    try {
      if (!query.trim()) return [];

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(
          `name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`,
        )
        .eq('is_active', true)
        .limit(20)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  };

  const selectCustomer = (customer: CustomerWithStats | null) => {
    setSelectedCustomer(customer);
  };

  const addCustomer = async (
    customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Customer> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...customerData,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      await loadCustomers();
      return data;
    } catch (error: any) {
      console.error('Error adding customer:', error);
      throw new Error(error.message || 'Failed to add customer');
    }
  };

  const updateCustomer = async (
    id: string,
    customerData: Partial<Customer>,
  ): Promise<Customer> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update({
          ...customerData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await loadCustomers();

      // Update selected customer if it's the one being edited
      if (selectedCustomer?.id === id) {
        setSelectedCustomer((prev) => (prev ? { ...prev, ...data } : null));
      }

      return data;
    } catch (error: any) {
      console.error('Error updating customer:', error);
      throw new Error(error.message || 'Failed to update customer');
    }
  };

  const deleteCustomer = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      await loadCustomers();

      // Clear selected customer if it's the one being deleted
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(null);
      }
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      throw new Error(error.message || 'Failed to delete customer');
    }
  };

  const clearSelectedCustomer = () => {
    setSelectedCustomer(null);
  };

  const value = {
    customers,
    selectedCustomer,
    loading,
    searchCustomers,
    selectCustomer,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    loadCustomers,
    clearSelectedCustomer,
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}
