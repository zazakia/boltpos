// Accounting & Financial Management Service for InventoryPro
// Handles Accounts Payable, Accounts Receivable, and Expense Management

import { Expense, AccountsPayable, AccountsReceivable } from '@/types/inventory';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/utils/errorHandler';
import { ServiceResult } from './types';
import { currencyUtils } from '@/utils/inventoryUtils';

export interface PaymentTransaction {
  id: string;
  type: 'payment' | 'receipt';
  amount: number;
  date: string;
  method: 'cash' | 'bank_transfer' | 'check' | 'card';
  reference: string; // PO ID, Sale ID, or expense ID
  notes?: string;
  createdAt: string;
}

export interface FinancialSummary {
  accountsPayable: {
    totalOutstanding: number;
    totalOverdue: number;
    dueThisWeek: number;
    countByStatus: {
      outstanding: number;
      overdue: number;
      paid: number;
    };
  };
  accountsReceivable: {
    totalOutstanding: number;
    totalOverdue: number;
    dueThisWeek: number;
    countByStatus: {
      outstanding: number;
      overdue: number;
      paid: number;
    };
  };
  expenses: {
    totalThisMonth: number;
    totalThisYear: number;
    byCategory: Record<string, number>;
    pendingApprovals: number;
  };
  cashFlow: {
    totalInflow: number;
    totalOutflow: number;
    netCashFlow: number;
    projectedBalance: number;
  };
}

export const accountingService = {
  // =============================================
  // ACCOUNTS PAYABLE (A/P) MANAGEMENT
  // =============================================

  /**
   * Create new accounts payable entry
   */
  createAccountsPayable: async (apData: Omit<AccountsPayable, 'id' | 'createdAt'>): Promise<ServiceResult<AccountsPayable>> => {
    try {
      console.log('accounting.service: Creating new accounts payable:', apData);

      const { data, error } = await supabase
        .from('accounts_payable')
        .insert({
          ...apData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('accounting.service: Supabase error creating accounts payable:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('accounting.service: Accounts payable created successfully');
      return { data, error: null };
    } catch (error) {
      console.error('accounting.service: Error creating accounts payable:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Get all accounts payable with filtering
   */
  getAccountsPayable: async (filters: {
    status?: 'outstanding' | 'paid' | 'overdue';
    vendorId?: string;
    dateFrom?: string;
    dateTo?: string;
    overdueOnly?: boolean;
  } = {}): Promise<ServiceResult<AccountsPayable[]>> => {
    try {
      console.log('accounting.service: Getting accounts payable with filters:', filters);

      let query = supabase
        .from('accounts_payable')
        .select(`
          *,
          suppliers (id, company_name, contact_person, payment_terms)
        `)
        .order('due_date', { ascending: true });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.vendorId) {
        query = query.eq('vendor_id', filters.vendorId);
      }

      if (filters.dateFrom) {
        query = query.gte('due_date', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('due_date', filters.dateTo);
      }

      if (filters.overdueOnly) {
        query = query.eq('status', 'overdue');
      }

      const { data, error } = await query;

      if (error) {
        console.error('accounting.service: Supabase error fetching accounts payable:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('accounting.service: Accounts payable fetched successfully');
      return { data: data || [], error: null };
    } catch (error) {
      console.error('accounting.service: Error fetching accounts payable:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Update accounts payable status
   */
  updateAccountsPayableStatus: async (id: string, status: 'outstanding' | 'paid' | 'overdue'): Promise<ServiceResult<AccountsPayable>> => {
    try {
      console.log('accounting.service: Updating accounts payable status:', id, status);

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('accounts_payable')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('accounting.service: Supabase error updating accounts payable status:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('accounting.service: Accounts payable status updated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('accounting.service: Error updating accounts payable status:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  // =============================================
  // ACCOUNTS RECEIVABLE (A/R) MANAGEMENT
  // =============================================

  /**
   * Create new accounts receivable entry
   */
  createAccountsReceivable: async (arData: Omit<AccountsReceivable, 'id' | 'createdAt'>): Promise<ServiceResult<AccountsReceivable>> => {
    try {
      console.log('accounting.service: Creating new accounts receivable:', arData);

      const { data, error } = await supabase
        .from('accounts_receivable')
        .insert({
          ...arData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('accounting.service: Supabase error creating accounts receivable:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('accounting.service: Accounts receivable created successfully');
      return { data, error: null };
    } catch (error) {
      console.error('accounting.service: Error creating accounts receivable:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Get all accounts receivable with filtering
   */
  getAccountsReceivable: async (filters: {
    status?: 'outstanding' | 'paid' | 'overdue';
    customerName?: string;
    dateFrom?: string;
    dateTo?: string;
    overdueOnly?: boolean;
  } = {}): Promise<ServiceResult<AccountsReceivable[]>> => {
    try {
      console.log('accounting.service: Getting accounts receivable with filters:', filters);

      let query = supabase
        .from('accounts_receivable')
        .select('*')
        .order('due_date', { ascending: true });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.customerName) {
        query = query.ilike('customer_name', `%${filters.customerName}%`);
      }

      if (filters.dateFrom) {
        query = query.gte('due_date', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('due_date', filters.dateTo);
      }

      if (filters.overdueOnly) {
        query = query.eq('status', 'overdue');
      }

      const { data, error } = await query;

      if (error) {
        console.error('accounting.service: Supabase error fetching accounts receivable:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('accounting.service: Accounts receivable fetched successfully');
      return { data: data || [], error: null };
    } catch (error) {
      console.error('accounting.service: Error fetching accounts receivable:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Update accounts receivable status
   */
  updateAccountsReceivableStatus: async (id: string, status: 'outstanding' | 'paid' | 'overdue'): Promise<ServiceResult<AccountsReceivable>> => {
    try {
      console.log('accounting.service: Updating accounts receivable status:', id, status);

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('accounts_receivable')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('accounting.service: Supabase error updating accounts receivable status:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('accounting.service: Accounts receivable status updated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('accounting.service: Error updating accounts receivable status:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  // =============================================
  // EXPENSE MANAGEMENT
  // =============================================

  /**
   * Create new expense entry
   */
  createExpense: async (expenseData: Omit<Expense, 'id' | 'createdAt'>): Promise<ServiceResult<Expense>> => {
    try {
      console.log('accounting.service: Creating new expense:', expenseData);

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expenseData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('accounting.service: Supabase error creating expense:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('accounting.service: Expense created successfully');
      return { data, error: null };
    } catch (error) {
      console.error('accounting.service: Error creating expense:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Get all expenses with filtering and categorization
   */
  getExpenses: async (filters: {
    category?: string;
    status?: 'pending' | 'paid' | 'cancelled';
    dateFrom?: string;
    dateTo?: string;
    vendorId?: string;
  } = {}): Promise<ServiceResult<Expense[]>> => {
    try {
      console.log('accounting.service: Getting expenses with filters:', filters);

      let query = supabase
        .from('expenses')
        .select(`
          *,
          suppliers (id, company_name, contact_person)
        `)
        .order('date', { ascending: false });

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('date', filters.dateTo);
      }

      if (filters.vendorId) {
        query = query.eq('vendor_id', filters.vendorId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('accounting.service: Supabase error fetching expenses:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('accounting.service: Expenses fetched successfully');
      return { data: data || [], error: null };
    } catch (error) {
      console.error('accounting.service: Error fetching expenses:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Update expense status
   */
  updateExpenseStatus: async (id: string, status: 'pending' | 'paid' | 'cancelled'): Promise<ServiceResult<Expense>> => {
    try {
      console.log('accounting.service: Updating expense status:', id, status);

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('accounting.service: Supabase error updating expense status:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('accounting.service: Expense status updated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('accounting.service: Error updating expense status:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Get expense categories with totals
   */
  getExpenseCategories: async (dateFrom?: string, dateTo?: string): Promise<ServiceResult<Record<string, number>>> => {
    try {
      console.log('accounting.service: Getting expense categories');

      let query = supabase
        .from('expenses')
        .select('category, amount')
        .eq('status', 'paid');

      if (dateFrom) {
        query = query.gte('date', dateFrom);
      }

      if (dateTo) {
        query = query.lte('date', dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('accounting.service: Supabase error fetching expense categories:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Aggregate by category
      const categories: Record<string, number> = {};
      data?.forEach(expense => {
        const category = expense.category || 'Uncategorized';
        categories[category] = (categories[category] || 0) + expense.amount;
      });

      console.log('accounting.service: Expense categories calculated successfully');
      return { data: categories, error: null };
    } catch (error) {
      console.error('accounting.service: Error calculating expense categories:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  // =============================================
  // FINANCIAL REPORTING & ANALYSIS
  // =============================================

  /**
   * Get comprehensive financial summary
   */
  getFinancialSummary: async (): Promise<ServiceResult<FinancialSummary>> => {
    try {
      console.log('accounting.service: Getting financial summary');

      const today = new Date();
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const thisYear = new Date(today.getFullYear(), 0, 1);

      // Get A/P data
      const apResult = await accountingService.getAccountsPayable();
      const apData = apResult.data || [];
      
      // Get A/R data
      const arResult = await accountingService.getAccountsReceivable();
      const arData = arResult.data || [];

      // Get expenses
      const expensesResult = await accountingService.getExpenses({
        dateFrom: thisMonth.toISOString(),
      });
      const expensesData = expensesResult.data || [];

      // Calculate A/P metrics
      const accountsPayable = {
        totalOutstanding: apData
          .filter(ap => ap.status === 'outstanding')
          .reduce((sum, ap) => sum + ap.amount, 0),
        totalOverdue: apData
          .filter(ap => ap.status === 'overdue')
          .reduce((sum, ap) => sum + ap.amount, 0),
        dueThisWeek: apData
          .filter(ap => {
            const dueDate = new Date(ap.dueDate);
            const weekFromNow = new Date(today);
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            return ap.status === 'outstanding' && dueDate <= weekFromNow;
          })
          .reduce((sum, ap) => sum + ap.amount, 0),
        countByStatus: {
          outstanding: apData.filter(ap => ap.status === 'outstanding').length,
          overdue: apData.filter(ap => ap.status === 'overdue').length,
          paid: apData.filter(ap => ap.status === 'paid').length,
        },
      };

      // Calculate A/R metrics
      const accountsReceivable = {
        totalOutstanding: arData
          .filter(ar => ar.status === 'outstanding')
          .reduce((sum, ar) => sum + ar.amount, 0),
        totalOverdue: arData
          .filter(ar => ar.status === 'overdue')
          .reduce((sum, ar) => sum + ar.amount, 0),
        dueThisWeek: arData
          .filter(ar => {
            const dueDate = new Date(ar.dueDate);
            const weekFromNow = new Date(today);
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            return ar.status === 'outstanding' && dueDate <= weekFromNow;
          })
          .reduce((sum, ar) => sum + ar.amount, 0),
        countByStatus: {
          outstanding: arData.filter(ar => ar.status === 'outstanding').length,
          overdue: arData.filter(ar => ar.status === 'overdue').length,
          paid: arData.filter(ar => ar.status === 'paid').length,
        },
      };

      // Calculate expense metrics
      const expensesByCategory: Record<string, number> = {};
      expensesData.forEach(expense => {
        const category = expense.category || 'Uncategorized';
        expensesByCategory[category] = (expensesByCategory[category] || 0) + expense.amount;
      });

      const expenses = {
        totalThisMonth: expensesData.reduce((sum, exp) => sum + exp.amount, 0),
        totalThisYear: expensesData
          .filter(exp => new Date(exp.date) >= thisYear)
          .reduce((sum, exp) => sum + exp.amount, 0),
        byCategory: expensesByCategory,
        pendingApprovals: expensesData.filter(exp => exp.status === 'pending').length,
      };

      // Calculate cash flow
      const totalInflow = accountsReceivable.totalOutstanding;
      const totalOutflow = accountsPayable.totalOutstanding + expenses.totalThisMonth;
      const cashFlow = {
        totalInflow,
        totalOutflow,
        netCashFlow: totalInflow - totalOutflow,
        projectedBalance: totalInflow - totalOutflow, // Simplified calculation
      };

      const summary: FinancialSummary = {
        accountsPayable,
        accountsReceivable,
        expenses,
        cashFlow,
      };

      console.log('accounting.service: Financial summary calculated successfully');
      return { data: summary, error: null };
    } catch (error) {
      console.error('accounting.service: Error calculating financial summary:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  // =============================================
  // AUTOMATION & INTEGRATION
  // =============================================

  /**
   * Auto-create A/P entry from Purchase Order
   */
  createAPFromPurchaseOrder: async (poId: string, supplierId: string, totalAmount: number): Promise<ServiceResult<AccountsPayable>> => {
    try {
      console.log('accounting.service: Creating A/P from Purchase Order:', poId);

      // Calculate due date based on supplier payment terms
      const supplierResult = await supabase
        .from('suppliers')
        .select('payment_terms')
        .eq('id', supplierId)
        .single();

      if (supplierResult.error) {
        throw new Error('Failed to fetch supplier payment terms');
      }

      const paymentTerms = supplierResult.data.payment_terms;
      const dueDate = new Date();
      
      switch (paymentTerms) {
        case 'Net 15':
          dueDate.setDate(dueDate.getDate() + 15);
          break;
        case 'Net 30':
          dueDate.setDate(dueDate.getDate() + 30);
          break;
        case 'Net 60':
          dueDate.setDate(dueDate.getDate() + 60);
          break;
        case 'COD':
          dueDate.setDate(dueDate.getDate() + 0); // Due on receipt
          break;
        default:
          dueDate.setDate(dueDate.getDate() + 30); // Default to Net 30
      }

      const apData: Omit<AccountsPayable, 'id' | 'createdAt'> = {
        vendorId: supplierId,
        amount: totalAmount,
        dueDate: dueDate.toISOString(),
        status: 'outstanding',
        description: `Payment for Purchase Order ${poId}`,
        poId,
        invoiceNumber: `PO-${poId}`,
      };

      const result = await accountingService.createAccountsPayable(apData);
      return result;
    } catch (error) {
      console.error('accounting.service: Error creating A/P from PO:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Auto-create A/R entry from POS Sale
   */
  createARFromPOSSale: async (saleId: string, customerName: string, totalAmount: number): Promise<ServiceResult<AccountsReceivable>> => {
    try {
      console.log('accounting.service: Creating A/R from POS Sale:', saleId);

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // Default to Net 30

      const arData: Omit<AccountsReceivable, 'id' | 'createdAt'> = {
        customerName,
        amount: totalAmount,
        dueDate: dueDate.toISOString(),
        status: 'outstanding',
        description: `Payment for POS Sale ${saleId}`,
        saleId,
        invoiceNumber: `POS-${saleId}`,
      };

      const result = await accountingService.createAccountsReceivable(arData);
      return result;
    } catch (error) {
      console.error('accounting.service: Error creating A/R from POS Sale:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Check for overdue accounts and update status
   */
  updateOverdueAccounts: async (): Promise<ServiceResult<{ updatedAP: number; updatedAR: number }>> => {
    try {
      console.log('accounting.service: Updating overdue accounts');

      const today = new Date();
      
      // Update overdue A/P
      let updatedAP = 0;
      const apResult = await supabase
        .from('accounts_payable')
        .update({ status: 'overdue' })
        .eq('status', 'outstanding')
        .lt('due_date', today.toISOString())
        .select('id');

      if (apResult.error) {
        console.error('accounting.service: Error updating overdue A/P:', apResult.error);
      } else {
        updatedAP = apResult.data?.length || 0;
      }

      // Update overdue A/R
      let updatedAR = 0;
      const arResult = await supabase
        .from('accounts_receivable')
        .update({ status: 'overdue' })
        .eq('status', 'outstanding')
        .lt('due_date', today.toISOString())
        .select('id');

      if (arResult.error) {
        console.error('accounting.service: Error updating overdue A/R:', arResult.error);
      } else {
        updatedAR = arResult.data?.length || 0;
      }

      const result = {
        updatedAP,
        updatedAR,
      };

      console.log('accounting.service: Overdue accounts updated successfully');
      return { data: result, error: null };
    } catch (error) {
      console.error('accounting.service: Error updating overdue accounts:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },
};