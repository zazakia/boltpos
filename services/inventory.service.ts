import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/utils/errorHandler';
import { ServiceResult } from './types';
import {
  Warehouse,
  Supplier,
  PurchaseOrder,
  SalesOrder,
  InventoryItem,
  Alert,
  StockMovement,
  Expense,
  AccountsPayable,
  AccountsReceivable,
  DashboardKPIs,
} from '@/types/inventory';
import { storageUtils, businessUtils } from '@/utils/inventoryUtils';

// =============================================
// WAREHOUSE SERVICES
// =============================================

export const warehouseService = {
  /**
   * Get all warehouses
   */
  getWarehouses: async (): Promise<ServiceResult<Warehouse[]>> => {
    try {
      console.log('inventory.service: Fetching warehouses');
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .order('name');

      if (error) {
        console.error('inventory.service: Supabase error fetching warehouses:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Calculate utilization percentage for each warehouse
      const warehouses = data?.map(warehouse => ({
        ...warehouse,
        utilizationPercentage: Math.round((warehouse.current_utilization / warehouse.capacity) * 100),
      })) || [];

      console.log('inventory.service: Warehouses fetched successfully');
      return { data: warehouses, error: null };
    } catch (error) {
      console.error('inventory.service: Error fetching warehouses:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Create new warehouse
   */
  createWarehouse: async (warehouseData: Omit<Warehouse, 'id' | 'utilizationPercentage' | 'createdAt' | 'updatedAt'>): Promise<ServiceResult<Warehouse>> => {
    try {
      console.log('inventory.service: Creating warehouse');
      const { data, error } = await supabase
        .from('warehouses')
        .insert({
          ...warehouseData,
          current_utilization: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('inventory.service: Supabase error creating warehouse:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Warehouse created successfully');
      return { 
        data: {
          ...data,
          utilizationPercentage: Math.round((data.current_utilization / data.capacity) * 100),
        }, 
        error: null 
      };
    } catch (error) {
      console.error('inventory.service: Error creating warehouse:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Update warehouse
   */
  updateWarehouse: async (id: string, warehouseData: Partial<Warehouse>): Promise<ServiceResult<Warehouse>> => {
    try {
      console.log('inventory.service: Updating warehouse:', id);
      const { data, error } = await supabase
        .from('warehouses')
        .update(warehouseData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('inventory.service: Supabase error updating warehouse:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Warehouse updated successfully');
      return { 
        data: {
          ...data,
          utilizationPercentage: Math.round((data.current_utilization / data.capacity) * 100),
        }, 
        error: null 
      };
    } catch (error) {
      console.error('inventory.service: Error updating warehouse:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Delete warehouse (soft delete)
   */
  deleteWarehouse: async (id: string): Promise<ServiceResult<Warehouse>> => {
    try {
      console.log('inventory.service: Deleting warehouse:', id);
      const { data, error } = await supabase
        .from('warehouses')
        .update({ status: 'inactive' })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('inventory.service: Supabase error deleting warehouse:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Warehouse deleted successfully');
      return { 
        data: {
          ...data,
          utilizationPercentage: Math.round((data.current_utilization / data.capacity) * 100),
        }, 
        error: null 
      };
    } catch (error) {
      console.error('inventory.service: Error deleting warehouse:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },
};

// =============================================
// SUPPLIER SERVICES
// =============================================

export const supplierService = {
  /**
   * Get all suppliers
   */
  getSuppliers: async (): Promise<ServiceResult<Supplier[]>> => {
    try {
      console.log('inventory.service: Fetching suppliers');
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('status', 'active')
        .order('company_name');

      if (error) {
        console.error('inventory.service: Supabase error fetching suppliers:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Suppliers fetched successfully');
      return { data, error: null };
    } catch (error) {
      console.error('inventory.service: Error fetching suppliers:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Create new supplier
   */
  createSupplier: async (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResult<Supplier>> => {
    try {
      console.log('inventory.service: Creating supplier');
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplierData)
        .select()
        .single();

      if (error) {
        console.error('inventory.service: Supabase error creating supplier:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Supplier created successfully');
      return { data, error: null };
    } catch (error) {
      console.error('inventory.service: Error creating supplier:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Update supplier
   */
  updateSupplier: async (id: string, supplierData: Partial<Supplier>): Promise<ServiceResult<Supplier>> => {
    try {
      console.log('inventory.service: Updating supplier:', id);
      const { data, error } = await supabase
        .from('suppliers')
        .update(supplierData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('inventory.service: Supabase error updating supplier:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Supplier updated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('inventory.service: Error updating supplier:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Delete supplier (soft delete)
   */
  deleteSupplier: async (id: string): Promise<ServiceResult<Supplier>> => {
    try {
      console.log('inventory.service: Deleting supplier:', id);
      const { data, error } = await supabase
        .from('suppliers')
        .update({ status: 'inactive' })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('inventory.service: Supabase error deleting supplier:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Supplier deleted successfully');
      return { data, error: null };
    } catch (error) {
      console.error('inventory.service: Error deleting supplier:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },
};

// =============================================
// INVENTORY SERVICES
// =============================================

export const inventoryService = {
  /**
   * Get all inventory items
   */
  getInventoryItems: async (): Promise<ServiceResult<InventoryItem[]>> => {
    try {
      console.log('inventory.service: Fetching inventory items');
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          products (id, name, price),
          warehouses (id, name)
        `)
        .eq('status', 'active')
        .order('received_date', { ascending: false });

      if (error) {
        console.error('inventory.service: Supabase error fetching inventory:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Inventory items fetched successfully');
      return { data, error: null };
    } catch (error) {
      console.error('inventory.service: Error fetching inventory:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Add new inventory batch
   */
  addInventoryBatch: async (batchData: Omit<InventoryItem, 'id' | 'receivedDate' | 'createdAt' | 'updatedAt'>): Promise<ServiceResult<InventoryItem>> => {
    try {
      console.log('inventory.service: Adding inventory batch');
      
      // Start a transaction-like approach
      const { data: batch, error: batchError } = await supabase
        .from('inventory_items')
        .insert({
          ...batchData,
          batch_number: businessUtils.generateBatchNumber(batchData.productId),
          received_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (batchError) {
        console.error('inventory.service: Supabase error adding inventory batch:', batchError);
        return { data: null, error: getErrorMessage(batchError) };
      }

      // Update warehouse utilization
      const { error: warehouseError } = await supabase.rpc('update_warehouse_utilization', {
        warehouse_id: batchData.warehouseId,
        quantity_change: batchData.quantity,
      });

      if (warehouseError) {
        console.warn('inventory.service: Warning - failed to update warehouse utilization:', warehouseError);
      }

      console.log('inventory.service: Inventory batch added successfully');
      return { data: batch, error: null };
    } catch (error) {
      console.error('inventory.service: Error adding inventory batch:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Get inventory by product
   */
  getInventoryByProduct: async (productId: string): Promise<ServiceResult<InventoryItem[]>> => {
    try {
      console.log('inventory.service: Fetching inventory for product:', productId);
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'active')
        .order('received_date', { ascending: true }); // FIFO order

      if (error) {
        console.error('inventory.service: Supabase error fetching product inventory:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Product inventory fetched successfully');
      return { data, error: null };
    } catch (error) {
      console.error('inventory.service: Error fetching product inventory:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Deduct stock using FIFO method
   */
  deductStockFIFO: async (productId: string, quantity: number, warehouseId: string): Promise<ServiceResult<any>> => {
    try {
      console.log('inventory.service: Deducting stock using FIFO for product:', productId);
      
      const { data, error } = await supabase.rpc('deduct_stock_fifo', {
        p_product_id: productId,
        p_warehouse_id: warehouseId,
        p_quantity: quantity,
      });

      if (error) {
        console.error('inventory.service: Supabase error deducting stock:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Stock deducted successfully using FIFO');
      return { data, error: null };
    } catch (error) {
      console.error('inventory.service: Error deducting stock:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Mark expired items
   */
  markExpiredItems: async (): Promise<ServiceResult<any>> => {
    try {
      console.log('inventory.service: Marking expired items');
      
      const { data, error } = await supabase.rpc('mark_expired_items');

      if (error) {
        console.error('inventory.service: Supabase error marking expired items:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Expired items marked successfully');
      return { data, error: null };
    } catch (error) {
      console.error('inventory.service: Error marking expired items:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },
};

// =============================================
// PURCHASE ORDER SERVICES
// =============================================

export const purchaseOrderService = {
  /**
   * Get all purchase orders
   */
  getPurchaseOrders: async (): Promise<ServiceResult<PurchaseOrder[]>> => {
    try {
      console.log('inventory.service: Fetching purchase orders');
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers (id, company_name, contact_person),
          purchase_order_items (*, products (id, name))
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('inventory.service: Supabase error fetching purchase orders:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Purchase orders fetched successfully');
      return { data, error: null };
    } catch (error) {
      console.error('inventory.service: Error fetching purchase orders:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Create new purchase order
   */
  createPurchaseOrder: async (
    supplierId: string,
    items: Array<{ productId: string; quantity: number; unitPrice: number }>,
    expectedDeliveryDate?: string,
    notes?: string
  ): Promise<ServiceResult<PurchaseOrder>> => {
    try {
      console.log('inventory.service: Creating purchase order');
      
      const { data, error } = await supabase.rpc('create_purchase_order', {
        p_supplier_id: supplierId,
        p_items: items,
        p_expected_delivery_date: expectedDeliveryDate,
        p_notes: notes,
      });

      if (error) {
        console.error('inventory.service: Supabase error creating purchase order:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Purchase order created successfully');
      return { data, error: null };
    } catch (error) {
      console.error('inventory.service: Error creating purchase order:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Update purchase order status
   */
  updatePurchaseOrderStatus: async (id: string, status: PurchaseOrder['status']): Promise<ServiceResult<PurchaseOrder>> => {
    try {
      console.log('inventory.service: Updating purchase order status:', id, status);
      
      const { data, error } = await supabase.rpc('update_purchase_order_status', {
        p_order_id: id,
        p_status: status,
      });

      if (error) {
        console.error('inventory.service: Supabase error updating purchase order status:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Purchase order status updated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('inventory.service: Error updating purchase order status:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },
};

// =============================================
// ALERT SERVICES
// =============================================

export const alertService = {
  /**
   * Get all active alerts
   */
  getAlerts: async (): Promise<ServiceResult<Alert[]>> => {
    try {
      console.log('inventory.service: Fetching alerts');
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('inventory.service: Supabase error fetching alerts:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Alerts fetched successfully');
      return { data, error: null };
    } catch (error) {
      console.error('inventory.service: Error fetching alerts:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Dismiss alert
   */
  dismissAlert: async (id: string): Promise<ServiceResult<Alert>> => {
    try {
      console.log('inventory.service: Dismissing alert:', id);
      const { data, error } = await supabase
        .from('alerts')
        .update({ 
          status: 'dismissed',
          dismissed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('inventory.service: Supabase error dismissing alert:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Alert dismissed successfully');
      return { data, error: null };
    } catch (error) {
      console.error('inventory.service: Error dismissing alert:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Generate alerts for low stock and expiring items
   */
  generateAlerts: async (): Promise<ServiceResult<any>> => {
    try {
      console.log('inventory.service: Generating alerts');
      
      const { data, error } = await supabase.rpc('generate_alerts');

      if (error) {
        console.error('inventory.service: Supabase error generating alerts:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Alerts generated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('inventory.service: Error generating alerts:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },
};

// =============================================
// DASHBOARD SERVICES
// =============================================

export const dashboardService = {
  /**
   * Get dashboard KPIs
   */
  getDashboardKPIs: async (): Promise<ServiceResult<DashboardKPIs>> => {
    try {
      console.log('inventory.service: Fetching dashboard KPIs');
      
      const { data, error } = await supabase.rpc('get_dashboard_kpis');

      if (error) {
        console.error('inventory.service: Supabase error fetching KPIs:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Dashboard KPIs fetched successfully');
      return { data, error: null };
    } catch (error) {
      console.error('inventory.service: Error fetching KPIs:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Get low stock products
   */
  getLowStockProducts: async (): Promise<ServiceResult<any[]>> => {
    try {
      console.log('inventory.service: Fetching low stock products');
      
      const { data, error } = await supabase.rpc('get_low_stock_products');

      if (error) {
        console.error('inventory.service: Supabase error fetching low stock products:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Low stock products fetched successfully');
      return { data, error: null };
    } catch (error) {
      console.error('inventory.service: Error fetching low stock products:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Get expiring items
   */
  getExpiringItems: async (days: number = 30): Promise<ServiceResult<any[]>> => {
    try {
      console.log('inventory.service: Fetching expiring items');
      
      const { data, error } = await supabase.rpc('get_expiring_items', { p_days: days });

      if (error) {
        console.error('inventory.service: Supabase error fetching expiring items:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Expiring items fetched successfully');
      return { data, error: null };
    } catch (error) {
      console.error('inventory.service: Error fetching expiring items:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },
};

// =============================================
// ACCOUNTING SERVICES
// =============================================

export const accountingService = {
  /**
   * Create expense
   */
  createExpense: async (expenseData: Omit<Expense, 'id' | 'createdAt'>): Promise<ServiceResult<Expense>> => {
    try {
      console.log('inventory.service: Creating expense');
      const { data, error } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select()
        .single();

      if (error) {
        console.error('inventory.service: Supabase error creating expense:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Expense created successfully');
      return { data, error: null };
    } catch (error) {
      console.error('inventory.service: Error creating expense:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Get expenses
   */
  getExpenses: async (): Promise<ServiceResult<Expense[]>> => {
    try {
      console.log('inventory.service: Fetching expenses');
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('inventory.service: Supabase error fetching expenses:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Expenses fetched successfully');
      return { data, error: null };
    } catch (error) {
      console.error('inventory.service: Error fetching expenses:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Get accounts payable
   */
  getAccountsPayable: async (): Promise<ServiceResult<AccountsPayable[]>> => {
    try {
      console.log('inventory.service: Fetching accounts payable');
      const { data, error } = await supabase
        .from('accounts_payable')
        .select(`
          *,
          suppliers (id, company_name)
        `)
        .order('due_date');

      if (error) {
        console.error('inventory.service: Supabase error fetching accounts payable:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Accounts payable fetched successfully');
      return { data, error: null };
    } catch (error) {
      console.error('inventory.service: Error fetching accounts payable:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Get accounts receivable
   */
  getAccountsReceivable: async (): Promise<ServiceResult<AccountsReceivable[]>> => {
    try {
      console.log('inventory.service: Fetching accounts receivable');
      const { data, error } = await supabase
        .from('accounts_receivable')
        .select('*')
        .order('due_date');

      if (error) {
        console.error('inventory.service: Supabase error fetching accounts receivable:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('inventory.service: Accounts receivable fetched successfully');
      return { data, error: null };
    } catch (error) {
      console.error('inventory.service: Error fetching accounts receivable:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },
};