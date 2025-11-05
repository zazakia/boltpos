// Enhanced Data Manager Service for InventoryPro
// Provides caching, offline support, and advanced storage patterns

import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/utils/errorHandler';
import { ServiceResult } from './types';
import { storageUtils, performanceUtils, searchUtils } from '@/utils/inventoryUtils';
import { accountingService } from './accounting.service';
import {
  Product,
  Warehouse,
  Supplier,
  PurchaseOrder,
  SalesOrder,
  InventoryItem,
  Alert,
  DashboardKPIs,
  TableConfig,
  SortInfo,
  PaginationInfo,
  StockMovement,
  POSSale,
  POSSaleItem,
} from '@/types/inventory';

// =============================================
// CACHE CONFIGURATION
// =============================================

const CACHE_CONFIG = {
  PRODUCTS: { ttl: 5 * 60 * 1000, key: 'products_cache' }, // 5 minutes
  WAREHOUSES: { ttl: 10 * 60 * 1000, key: 'warehouses_cache' }, // 10 minutes
  SUPPLIERS: { ttl: 15 * 60 * 1000, key: 'suppliers_cache' }, // 15 minutes
  PURCHASE_ORDERS: { ttl: 2 * 60 * 1000, key: 'purchase_orders_cache' }, // 2 minutes
  INVENTORY: { ttl: 2 * 60 * 1000, key: 'inventory_cache' }, // 2 minutes
  ALERTS: { ttl: 1 * 60 * 1000, key: 'alerts_cache' }, // 1 minute
  DASHBOARD: { ttl: 30 * 1000, key: 'dashboard_cache' }, // 30 seconds
};

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version: string;
}

const CACHE_VERSION = '1.0.0';

// =============================================
// OFFLINE STORAGE KEYS
// =============================================

const STORAGE_KEYS = {
  OFFLINE_ACTIONS: 'inventory_offline_actions',
  SYNC_STATUS: 'inventory_sync_status',
  USER_PREFERENCES: 'inventory_user_preferences',
  LAST_SYNC: 'inventory_last_sync',
};

// =============================================
// DATA MANAGER SERVICE
// =============================================

export const dataManagerService = {
  // =============================================
  // CACHE MANAGEMENT
  // =============================================

  /**
   * Get cached data with expiration check
   */
  getCache: <T>(cacheKey: string): T | null => {
    try {
      const cached = storageUtils.load<CacheEntry<T> | null>(cacheKey, null);
      
      if (!cached) return null;
      
      // Check if cache is expired
      const now = Date.now();
      const isExpired = now - cached.timestamp > cached.ttl;
      
      if (isExpired) {
        storageUtils.remove(cacheKey);
        return null;
      }
      
      return cached.data;
    } catch (error) {
      console.error('dataManager.service: Error reading cache:', error);
      return null;
    }
  },

  /**
   * Set data in cache
   */
  setCache: <T>(cacheKey: string, data: T, ttl: number): void => {
    try {
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        version: CACHE_VERSION,
      };
      
      storageUtils.save(cacheKey, cacheEntry);
    } catch (error) {
      console.error('dataManager.service: Error writing cache:', error);
    }
  },

  /**
   * Clear specific cache
   */
  clearCache: (cacheKey: string): void => {
    storageUtils.remove(cacheKey);
  },

  /**
   * Clear all caches
   */
  clearAllCaches: (): void => {
    Object.values(CACHE_CONFIG).forEach(config => {
      storageUtils.remove(config.key);
    });
  },

  /**
   * Invalidate cache by pattern
   */
  invalidateCachePattern: (pattern: string): void => {
    Object.keys(localStorage).forEach(key => {
      if (key.includes(pattern)) {
        storageUtils.remove(key);
      }
    });
  },

  // =============================================
  // CACHED DATA SERVICES
  // =============================================

  /**
   * Get products with caching
   */
  getProducts: async (forceRefresh: boolean = false): Promise<ServiceResult<Product[]>> => {
    try {
      const cacheKey = CACHE_CONFIG.PRODUCTS.key;
      
      if (!forceRefresh) {
        const cached = dataManagerService.getCache<Product[]>(cacheKey);
        if (cached) {
          console.log('dataManager.service: Returning cached products');
          return { data: cached, error: null };
        }
      }

      console.log('dataManager.service: Fetching fresh products from database');
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (id, name),
          alternate_uoms (*)
        `)
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('dataManager.service: Supabase error fetching products:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      const products = data?.map(product => ({
        ...product,
        category: product.categories?.name || 'Uncategorized',
      })) || [];

      // Cache the data
      dataManagerService.setCache(cacheKey, products, CACHE_CONFIG.PRODUCTS.ttl);

      console.log('dataManager.service: Products fetched and cached successfully');
      return { data: products, error: null };
    } catch (error) {
      console.error('dataManager.service: Error fetching products:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Get warehouses with caching
   */
  getWarehouses: async (forceRefresh: boolean = false): Promise<ServiceResult<Warehouse[]>> => {
    try {
      const cacheKey = CACHE_CONFIG.WAREHOUSES.key;
      
      if (!forceRefresh) {
        const cached = dataManagerService.getCache<Warehouse[]>(cacheKey);
        if (cached) {
          console.log('dataManager.service: Returning cached warehouses');
          return { data: cached, error: null };
        }
      }

      console.log('dataManager.service: Fetching fresh warehouses from database');
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('dataManager.service: Supabase error fetching warehouses:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      const warehouses = data?.map(warehouse => ({
        ...warehouse,
        utilizationPercentage: Math.round((warehouse.current_utilization / warehouse.capacity) * 100),
      })) || [];

      // Cache the data
      dataManagerService.setCache(cacheKey, warehouses, CACHE_CONFIG.WAREHOUSES.ttl);

      console.log('dataManager.service: Warehouses fetched and cached successfully');
      return { data: warehouses, error: null };
    } catch (error) {
      console.error('dataManager.service: Error fetching warehouses:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Get suppliers with caching
   */
  getSuppliers: async (forceRefresh: boolean = false): Promise<ServiceResult<Supplier[]>> => {
    try {
      const cacheKey = CACHE_CONFIG.SUPPLIERS.key;
      
      if (!forceRefresh) {
        const cached = dataManagerService.getCache<Supplier[]>(cacheKey);
        if (cached) {
          console.log('dataManager.service: Returning cached suppliers');
          return { data: cached, error: null };
        }
      }

      console.log('dataManager.service: Fetching fresh suppliers from database');
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('status', 'active')
        .order('company_name');

      if (error) {
        console.error('dataManager.service: Supabase error fetching suppliers:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Cache the data
      dataManagerService.setCache(cacheKey, data || [], CACHE_CONFIG.SUPPLIERS.ttl);

      console.log('dataManager.service: Suppliers fetched and cached successfully');
      return { data, error: null };
    } catch (error) {
      console.error('dataManager.service: Error fetching suppliers:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Get purchase orders with caching
   */
  getPurchaseOrders: async (forceRefresh: boolean = false): Promise<ServiceResult<PurchaseOrder[]>> => {
    try {
      const cacheKey = CACHE_CONFIG.PURCHASE_ORDERS.key;
      
      if (!forceRefresh) {
        const cached = dataManagerService.getCache<PurchaseOrder[]>(cacheKey);
        if (cached) {
          console.log('dataManager.service: Returning cached purchase orders');
          return { data: cached, error: null };
        }
      }

      console.log('dataManager.service: Fetching fresh purchase orders from database');
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers (id, company_name, contact_person, phone, email),
          purchase_order_items (*, products (id, name, base_price))
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('dataManager.service: Supabase error fetching purchase orders:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Transform data to match PurchaseOrder interface
      const purchaseOrders: PurchaseOrder[] = data?.map(po => ({
        ...po,
        items: po.purchase_order_items || [],
        supplier: po.suppliers,
      })) || [];

      // Cache the data
      dataManagerService.setCache(cacheKey, purchaseOrders, CACHE_CONFIG.PURCHASE_ORDERS.ttl);

      console.log('dataManager.service: Purchase orders fetched and cached successfully');
      return { data: purchaseOrders, error: null };
    } catch (error) {
      console.error('dataManager.service: Error fetching purchase orders:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Get sales orders with caching
   */
  getSalesOrders: async (forceRefresh: boolean = false): Promise<ServiceResult<SalesOrder[]>> => {
    try {
      const cacheKey = CACHE_CONFIG.PURCHASE_ORDERS.key; // Reuse same cache for now
      
      if (!forceRefresh) {
        const cached = dataManagerService.getCache<SalesOrder[]>(cacheKey);
        if (cached) {
          console.log('dataManager.service: Returning cached sales orders');
          return { data: cached, error: null };
        }
      }

      console.log('dataManager.service: Fetching fresh sales orders from database');
      const { data, error } = await supabase
        .from('sales_orders')
        .select(`
          *,
          warehouses (id, name),
          sales_order_items (*, products (id, name, base_price))
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('dataManager.service: Supabase error fetching sales orders:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Transform data to match SalesOrder interface
      const salesOrders: SalesOrder[] = data?.map(so => ({
        ...so,
        items: so.sales_order_items || [],
      })) || [];

      // Cache the data
      dataManagerService.setCache(cacheKey, salesOrders, CACHE_CONFIG.PURCHASE_ORDERS.ttl);

      console.log('dataManager.service: Sales orders fetched and cached successfully');
      return { data: salesOrders, error: null };
    } catch (error) {
      console.error('dataManager.service: Error fetching sales orders:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Get inventory items with caching
   */
  getInventoryItems: async (forceRefresh: boolean = false): Promise<ServiceResult<InventoryItem[]>> => {
    try {
      const cacheKey = CACHE_CONFIG.INVENTORY.key;
      
      if (!forceRefresh) {
        const cached = dataManagerService.getCache<InventoryItem[]>(cacheKey);
        if (cached) {
          console.log('dataManager.service: Returning cached inventory');
          return { data: cached, error: null };
        }
      }

      console.log('dataManager.service: Fetching fresh inventory from database');
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
        console.error('dataManager.service: Supabase error fetching inventory:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Cache the data
      dataManagerService.setCache(cacheKey, data || [], CACHE_CONFIG.INVENTORY.ttl);

      console.log('dataManager.service: Inventory fetched and cached successfully');
      return { data, error: null };
    } catch (error) {
      console.error('dataManager.service: Error fetching inventory:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Get alerts with caching
   */
  getAlerts: async (forceRefresh: boolean = false): Promise<ServiceResult<Alert[]>> => {
    try {
      const cacheKey = CACHE_CONFIG.ALERTS.key;
      
      if (!forceRefresh) {
        const cached = dataManagerService.getCache<Alert[]>(cacheKey);
        if (cached) {
          console.log('dataManager.service: Returning cached alerts');
          return { data: cached, error: null };
        }
      }

      console.log('dataManager.service: Fetching fresh alerts from database');
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('dataManager.service: Supabase error fetching alerts:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Cache the data
      dataManagerService.setCache(cacheKey, data || [], CACHE_CONFIG.ALERTS.ttl);

      console.log('dataManager.service: Alerts fetched and cached successfully');
      return { data, error: null };
    } catch (error) {
      console.error('dataManager.service: Error fetching alerts:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Get dashboard KPIs with caching
   */
  getDashboardKPIs: async (forceRefresh: boolean = false): Promise<ServiceResult<DashboardKPIs>> => {
    try {
      const cacheKey = CACHE_CONFIG.DASHBOARD.key;
      
      if (!forceRefresh) {
        const cached = dataManagerService.getCache<DashboardKPIs>(cacheKey);
        if (cached) {
          console.log('dataManager.service: Returning cached dashboard KPIs');
          return { data: cached, error: null };
        }
      }

      console.log('dataManager.service: Fetching fresh dashboard KPIs from database');
      const { data, error } = await supabase.rpc('get_dashboard_kpis');

      if (error) {
        console.error('dataManager.service: Supabase error fetching dashboard KPIs:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Cache the data
      dataManagerService.setCache(cacheKey, data, CACHE_CONFIG.DASHBOARD.ttl);

      console.log('dataManager.service: Dashboard KPIs fetched and cached successfully');
      return { data, error: null };
    } catch (error) {
      console.error('dataManager.service: Error fetching dashboard KPIs:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  // =============================================
  // INVENTORY-SPECIFIC METHODS
  // =============================================

  /**
   * Get product by ID
   */
  getProductById: async (id: string): Promise<ServiceResult<Product>> => {
    try {
      console.log('dataManager.service: Getting product by ID:', id);

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (id, name),
          alternate_uoms (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('dataManager.service: Supabase error fetching product:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      const product = {
        ...data,
        category: data.categories?.name || 'Uncategorized',
      };

      console.log('dataManager.service: Product fetched successfully');
      return { data: product, error: null };
    } catch (error) {
      console.error('dataManager.service: Error fetching product:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Get inventory items by product ID
   */
  getInventoryByProduct: async (productId: string): Promise<ServiceResult<InventoryItem[]>> => {
    try {
      console.log('dataManager.service: Getting inventory by product:', productId);

      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          products (id, name, base_price),
          warehouses (id, name)
        `)
        .eq('product_id', productId)
        .eq('status', 'active')
        .order('received_date', { ascending: true }); // FIFO order

      if (error) {
        console.error('dataManager.service: Supabase error fetching inventory:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('dataManager.service: Inventory fetched successfully');
      return { data: data || [], error: null };
    } catch (error) {
      console.error('dataManager.service: Error fetching inventory:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Update inventory batch
   */
  updateInventoryBatch: async (id: string, updates: Partial<InventoryItem>): Promise<ServiceResult<InventoryItem>> => {
    try {
      console.log('dataManager.service: Updating inventory batch:', id, updates);

      const { data, error } = await supabase
        .from('inventory_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('dataManager.service: Supabase error updating inventory batch:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Clear inventory cache
      dataManagerService.clearCache(CACHE_CONFIG.INVENTORY.key);

      console.log('dataManager.service: Inventory batch updated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('dataManager.service: Error updating inventory batch:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Create inventory batch
   */
  createInventoryBatch: async (batchData: Omit<InventoryItem, 'id'>): Promise<ServiceResult<InventoryItem>> => {
    try {
      console.log('dataManager.service: Creating inventory batch:', batchData);

      const { data, error } = await supabase
        .from('inventory_items')
        .insert(batchData)
        .select()
        .single();

      if (error) {
        console.error('dataManager.service: Supabase error creating inventory batch:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Clear inventory cache
      dataManagerService.clearCache(CACHE_CONFIG.INVENTORY.key);

      console.log('dataManager.service: Inventory batch created successfully');
      return { data, error: null };
    } catch (error) {
      console.error('dataManager.service: Error creating inventory batch:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Create stock movement record
   */
  createStockMovement: async (movementData: Omit<StockMovement, 'id' | 'createdAt'>): Promise<ServiceResult<StockMovement>> => {
    try {
      console.log('dataManager.service: Creating stock movement:', movementData);

      const { data, error } = await supabase
        .from('stock_movements')
        .insert({
          ...movementData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('dataManager.service: Supabase error creating stock movement:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('dataManager.service: Stock movement created successfully');
      return { data, error: null };
    } catch (error) {
      console.error('dataManager.service: Error creating stock movement:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  // =============================================
  // SEARCH AND FILTERING
  // =============================================

  /**
   * Search products with filtering and pagination
   */
  searchProducts: async (
    searchTerm: string = '',
    filters: any = {},
    config: TableConfig
  ): Promise<ServiceResult<{ products: Product[], totalCount: number }>> => {
    try {
      console.log('dataManager.service: Searching products with filters:', { searchTerm, filters, config });

      // Build query
      let query = supabase
        .from('products')
        .select(`
          *,
          categories (id, name),
          alternate_uoms (*)
        `, { count: 'exact' })
        .eq('active', true);

      // Apply search term
      if (searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // Apply filters
      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.lowStock) {
        // This would need a more complex query with inventory joins
        // For now, filter client-side
      }

      // Apply sorting
      if (config.sort.field) {
        query = query.order(config.sort.field, { ascending: config.sort.direction === 'asc' });
      } else {
        query = query.order('name');
      }

      // Apply pagination
      const from = (config.pagination.currentPage - 1) * config.pagination.itemsPerPage;
      const to = from + config.pagination.itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('dataManager.service: Supabase error searching products:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      let products = data?.map(product => ({
        ...product,
        category: product.categories?.name || 'Uncategorized',
      })) || [];

      // Apply client-side filtering for low stock if needed
      if (filters.lowStock) {
        // Would need to join with inventory data
        // This is a simplified version
        console.log('dataManager.service: Client-side low stock filtering not implemented');
      }

      console.log('dataManager.service: Product search completed successfully');
      return { 
        data: { 
          products, 
          totalCount: count || 0 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('dataManager.service: Error searching products:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Search inventory items with advanced filtering
   */
  searchInventory: async (
    searchTerm: string = '',
    filters: any = {},
    config: TableConfig
  ): Promise<ServiceResult<{ items: InventoryItem[], totalCount: number }>> => {
    try {
      console.log('dataManager.service: Searching inventory with filters:', { searchTerm, filters, config });

      // Build query
      let query = supabase
        .from('inventory_items')
        .select(`
          *,
          products (id, name, price),
          warehouses (id, name)
        `, { count: 'exact' })
        .eq('status', 'active');

      // Apply search term
      if (searchTerm.trim()) {
        query = query.or(`batch_number.ilike.%${searchTerm}%,products.name.ilike.%${searchTerm}%`);
      }

      // Apply filters
      if (filters.warehouseId) {
        query = query.eq('warehouse_id', filters.warehouseId);
      }

      if (filters.productId) {
        query = query.eq('product_id', filters.productId);
      }

      if (filters.expiryFrom) {
        query = query.gte('expiry_date', filters.expiryFrom);
      }

      if (filters.expiryTo) {
        query = query.lte('expiry_date', filters.expiryTo);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Apply sorting
      if (config.sort.field) {
        query = query.order(config.sort.field, { ascending: config.sort.direction === 'asc' });
      } else {
        query = query.order('received_date', { ascending: false });
      }

      // Apply pagination
      const from = (config.pagination.currentPage - 1) * config.pagination.itemsPerPage;
      const to = from + config.pagination.itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('dataManager.service: Supabase error searching inventory:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      const items = data || [];

      console.log('dataManager.service: Inventory search completed successfully');
      return { 
        data: { 
          items, 
          totalCount: count || 0 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('dataManager.service: Error searching inventory:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  // =============================================
  // OFFLINE SUPPORT
  // =============================================

  /**
   * Store action for offline execution
   */
  storeOfflineAction: (action: any): void => {
    try {
      const actions = storageUtils.load<any[]>(STORAGE_KEYS.OFFLINE_ACTIONS, []);
      actions.push({
        ...action,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        status: 'pending',
      });
      storageUtils.save(STORAGE_KEYS.OFFLINE_ACTIONS, actions);
      console.log('dataManager.service: Offline action stored');
    } catch (error) {
      console.error('dataManager.service: Error storing offline action:', error);
    }
  },

  /**
   * Get pending offline actions
   */
  getOfflineActions: (): any[] => {
    return storageUtils.load<any[]>(STORAGE_KEYS.OFFLINE_ACTIONS, []);
  },

  /**
   * Clear completed offline actions
   */
  clearCompletedActions: (): void => {
    try {
      const actions = dataManagerService.getOfflineActions();
      const pendingActions = actions.filter(action => action.status === 'pending');
      storageUtils.save(STORAGE_KEYS.OFFLINE_ACTIONS, pendingActions);
      console.log('dataManager.service: Completed offline actions cleared');
    } catch (error) {
      console.error('dataManager.service: Error clearing completed actions:', error);
    }
  },

  /**
   * Sync offline actions when back online
   */
  syncOfflineActions: async (): Promise<ServiceResult<any>> => {
    try {
      console.log('dataManager.service: Syncing offline actions');
      
      const actions = dataManagerService.getOfflineActions();
      const results = [];

      for (const action of actions) {
        if (action.status === 'pending') {
          try {
            // Execute the action based on type
            let result;
            switch (action.type) {
              case 'CREATE_PRODUCT':
                result = await supabase.from('products').insert(action.data);
                break;
              case 'UPDATE_PRODUCT':
                result = await supabase.from('products').update(action.data).eq('id', action.id);
                break;
              case 'CREATE_WAREHOUSE':
                result = await supabase.from('warehouses').insert(action.data);
                break;
              // Add more action types as needed
              default:
                console.warn('dataManager.service: Unknown offline action type:', action.type);
                continue;
            }

            if (result.error) {
              console.error('dataManager.service: Error syncing action:', result.error);
              action.status = 'failed';
              action.error = result.error.message;
            } else {
              action.status = 'completed';
              action.result = result.data;
            }
            
            results.push(action);
          } catch (error) {
            console.error('dataManager.service: Error executing offline action:', error);
            action.status = 'failed';
            action.error = getErrorMessage(error);
            results.push(action);
          }
        }
      }

      // Update storage
      storageUtils.save(STORAGE_KEYS.OFFLINE_ACTIONS, actions);
      
      // Update sync timestamp
      storageUtils.save(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

      console.log('dataManager.service: Offline actions sync completed');
      return { data: results, error: null };
    } catch (error) {
      console.error('dataManager.service: Error syncing offline actions:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  // =============================================
  // USER PREFERENCES
  // =============================================

  /**
   * Get user preferences
   */
  getUserPreferences: (): any => {
    return storageUtils.load(STORAGE_KEYS.USER_PREFERENCES, {
      theme: 'light',
      currency: 'PHP',
      language: 'en',
      notifications: true,
      autoRefresh: true,
      defaultWarehouse: null,
      defaultPageSize: 20,
    });
  },

  /**
   * Update user preferences
   */
  updateUserPreferences: (preferences: any): void => {
    try {
      const current = dataManagerService.getUserPreferences();
      const updated = { ...current, ...preferences };
      storageUtils.save(STORAGE_KEYS.USER_PREFERENCES, updated);
      console.log('dataManager.service: User preferences updated');
    } catch (error) {
      console.error('dataManager.service: Error updating user preferences:', error);
    }
  },

  // =============================================
  // PERFORMANCE OPTIMIZATION
  // =============================================

  /**
   * Preload critical data
   */
  preloadCriticalData: async (): Promise<ServiceResult<any>> => {
    try {
      console.log('dataManager.service: Preloading critical data');
      
      const promises = [
        dataManagerService.getProducts(),
        dataManagerService.getWarehouses(),
        dataManagerService.getDashboardKPIs(),
        dataManagerService.getAlerts(),
      ];

      const results = await Promise.allSettled(promises);
      
      const preloadResult = {
        products: results[0].status === 'fulfilled' ? results[0].value : { data: null, error: 'Failed' },
        warehouses: results[1].status === 'fulfilled' ? results[1].value : { data: null, error: 'Failed' },
        dashboard: results[2].status === 'fulfilled' ? results[2].value : { data: null, error: 'Failed' },
        alerts: results[3].status === 'fulfilled' ? results[3].value : { data: null, error: 'Failed' },
      };

      console.log('dataManager.service: Critical data preloaded');
      return { data: preloadResult, error: null };
    } catch (error) {
      console.error('dataManager.service: Error preloading critical data:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Clear all data (for logout/reset)
   */
  clearAllData: (): void => {
    try {
      // Clear all caches
      dataManagerService.clearAllCaches();
      
      // Clear offline actions
      storageUtils.remove(STORAGE_KEYS.OFFLINE_ACTIONS);
      
      // Clear sync status
      storageUtils.remove(STORAGE_KEYS.SYNC_STATUS);
      
      // Keep user preferences
      // storageUtils.remove(STORAGE_KEYS.USER_PREFERENCES);
      
      console.log('dataManager.service: All application data cleared');
    } catch (error) {
      console.error('dataManager.service: Error clearing all data:', error);
    }
  },
};

// =============================================
// DEFAULT TABLE CONFIGS
// =============================================

export const defaultTableConfigs = {
  products: {
    sort: { field: 'name', direction: 'asc' as const },
    pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20 },
    filters: {},
  } as TableConfig,

  inventory: {
    sort: { field: 'received_date', direction: 'desc' as const },
    pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 25 },
    filters: {},
  } as TableConfig,

  orders: {
    sort: { field: 'created_at', direction: 'desc' as const },
    pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20 },
    filters: {},
  } as TableConfig,
};

// =============================================
// BATCH OPERATIONS
// =============================================

export const batchOperationsService = {
  /**
   * Batch update multiple products
   */
  batchUpdateProducts: async (updates: Array<{ id: string; data: Partial<Product> }>): Promise<ServiceResult<any>> => {
    try {
      console.log('dataManager.service: Batch updating products');
      
      const promises = updates.map(update =>
        supabase
          .from('products')
          .update(update.data)
          .eq('id', update.id)
      );

      const results = await Promise.all(promises);
      const failures = results.filter(result => result.error);

      if (failures.length > 0) {
        console.error('dataManager.service: Some batch updates failed:', failures);
        return { data: null, error: `${failures.length} updates failed` };
      }

      // Invalidate products cache
      dataManagerService.clearCache(CACHE_CONFIG.PRODUCTS.key);

      console.log('dataManager.service: Batch product updates completed successfully');
      return { data: results.length, error: null };
    } catch (error) {
      console.error('dataManager.service: Error in batch product updates:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Batch delete multiple items
   */
  batchDelete: async (table: string, ids: string[]): Promise<ServiceResult<any>> => {
    try {
      console.log(`dataManager.service: Batch deleting from ${table}`);
      
      const { error } = await supabase
        .from(table)
        .delete()
        .in('id', ids);

      if (error) {
        console.error('dataManager.service: Batch delete error:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Invalidate relevant cache
      const cacheKey = Object.values(CACHE_CONFIG).find(config => 
        table === 'products' || table === 'warehouses' || table === 'suppliers' || table === 'inventory_items'
      )?.key;

      if (cacheKey) {
        dataManagerService.clearCache(cacheKey);
      }

      console.log('dataManager.service: Batch delete completed successfully');
      return { data: ids.length, error: null };
    } catch (error) {
      console.error('dataManager.service: Error in batch delete:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  // =============================================
  // SUPPLIER CRUD OPERATIONS
  // =============================================

  /**
   * Create new supplier
   */
  createSupplier: async (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResult<Supplier>> => {
    try {
      console.log('dataManager.service: Creating new supplier:', supplierData);

      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          ...supplierData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('dataManager.service: Supabase error creating supplier:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Clear suppliers cache
      dataManagerService.clearCache(CACHE_CONFIG.SUPPLIERS.key);

      console.log('dataManager.service: Supplier created successfully');
      return { data, error: null };
    } catch (error) {
      console.error('dataManager.service: Error creating supplier:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Update supplier
   */
  updateSupplier: async (id: string, updates: Partial<Supplier>): Promise<ServiceResult<Supplier>> => {
    try {
      console.log('dataManager.service: Updating supplier:', id, updates);

      const { data, error } = await supabase
        .from('suppliers')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('dataManager.service: Supabase error updating supplier:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Clear suppliers cache
      dataManagerService.clearCache(CACHE_CONFIG.SUPPLIERS.key);

      console.log('dataManager.service: Supplier updated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('dataManager.service: Error updating supplier:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Delete supplier (soft delete by setting status to inactive)
   */
  deleteSupplier: async (id: string): Promise<ServiceResult<boolean>> => {
    try {
      console.log('dataManager.service: Deleting supplier:', id);

      const { error } = await supabase
        .from('suppliers')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('dataManager.service: Supabase error deleting supplier:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Clear suppliers cache
      dataManagerService.clearCache(CACHE_CONFIG.SUPPLIERS.key);

      console.log('dataManager.service: Supplier deleted successfully');
      return { data: true, error: null };
    } catch (error) {
      console.error('dataManager.service: Error deleting supplier:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  // =============================================
  // PURCHASE ORDER CRUD OPERATIONS
  // =============================================

  /**
   * Create new purchase order
   */
  createPurchaseOrder: async (poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'poNumber'>): Promise<ServiceResult<PurchaseOrder>> => {
    try {
      console.log('dataManager.service: Creating new purchase order:', poData);

      // Generate PO number
      const poNumber = `PO-${Date.now()}`;

      // Create purchase order
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          supplier_id: poData.supplierId,
          total_amount: poData.totalAmount,
          status: poData.status,
          expected_delivery_date: poData.expectedDeliveryDate,
          notes: poData.notes,
          po_number: poNumber,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (poError) {
        console.error('dataManager.service: Supabase error creating purchase order:', poError);
        return { data: null, error: getErrorMessage(poError) };
      }

      // Create purchase order items
      if (poData.items && poData.items.length > 0) {
        const itemsData = poData.items.map(item => ({
          purchase_order_id: po.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          subtotal: item.subtotal,
        }));

        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(itemsData);

        if (itemsError) {
          console.error('dataManager.service: Supabase error creating purchase order items:', itemsError);
          // Clean up the purchase order if items creation fails
          await supabase.from('purchase_orders').delete().eq('id', po.id);
          return { data: null, error: getErrorMessage(itemsError) };
        }
      }

      // Clear purchase orders cache
      dataManagerService.clearCache(CACHE_CONFIG.PURCHASE_ORDERS.key);

      console.log('dataManager.service: Purchase order created successfully');
      return {
        data: {
          ...po,
          items: poData.items || [],
          poNumber,
        },
        error: null
      };
    } catch (error) {
      console.error('dataManager.service: Error creating purchase order:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Update purchase order
   */
  updatePurchaseOrder: async (id: string, updates: Partial<PurchaseOrder>): Promise<ServiceResult<PurchaseOrder>> => {
    try {
      console.log('dataManager.service: Updating purchase order:', id, updates);

      const poUpdate: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.supplierId) poUpdate.supplier_id = updates.supplierId;
      if (updates.totalAmount !== undefined) poUpdate.total_amount = updates.totalAmount;
      if (updates.status) poUpdate.status = updates.status;
      if (updates.expectedDeliveryDate !== undefined) poUpdate.expected_delivery_date = updates.expectedDeliveryDate;
      if (updates.notes !== undefined) poUpdate.notes = updates.notes;

      const { data, error } = await supabase
        .from('purchase_orders')
        .update(poUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('dataManager.service: Supabase error updating purchase order:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Update items if provided
      if (updates.items) {
        // Delete existing items
        await supabase.from('purchase_order_items').delete().eq('purchase_order_id', id);
        
        // Insert new items
        if (updates.items.length > 0) {
          const itemsData = updates.items.map(item => ({
            purchase_order_id: id,
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            subtotal: item.subtotal,
          }));

          const { error: itemsError } = await supabase
            .from('purchase_order_items')
            .insert(itemsData);

          if (itemsError) {
            console.error('dataManager.service: Supabase error updating purchase order items:', itemsError);
            return { data: null, error: getErrorMessage(itemsError) };
          }
        }
      }

      // Clear purchase orders cache
      dataManagerService.clearCache(CACHE_CONFIG.PURCHASE_ORDERS.key);

      console.log('dataManager.service: Purchase order updated successfully');
      return {
        data: {
          ...data,
          items: updates.items || data.purchase_order_items || [],
        },
        error: null
      };
    } catch (error) {
      console.error('dataManager.service: Error updating purchase order:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Delete purchase order (soft delete by setting status to cancelled)
   */
  deletePurchaseOrder: async (id: string): Promise<ServiceResult<boolean>> => {
    try {
      console.log('dataManager.service: Deleting purchase order:', id);

      const { error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('dataManager.service: Supabase error deleting purchase order:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Clear purchase orders cache
      dataManagerService.clearCache(CACHE_CONFIG.PURCHASE_ORDERS.key);

      console.log('dataManager.service: Purchase order deleted successfully');
      return { data: true, error: null };
    } catch (error) {
      console.error('dataManager.service: Error deleting purchase order:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  // =============================================
  // PURCHASE ORDER WORKFLOW AUTOMATION
  // =============================================

  /**
   * Update purchase order status and trigger automatic actions
   */
  updatePurchaseOrderStatus: async (id: string, newStatus: PurchaseOrder['status'], warehouseId?: string): Promise<ServiceResult<PurchaseOrder>> => {
    try {
      console.log('dataManager.service: Updating purchase order status:', id, newStatus);

      // Update the status directly with Supabase
      const updateResult = await supabase
        .from('purchase_orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          actual_delivery_date: newStatus === 'received' ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateResult.error) {
        console.error('dataManager.service: Supabase error updating purchase order status:', updateResult.error);
        return { data: null, error: getErrorMessage(updateResult.error) };
      }

      // If status is 'received', create inventory batches and A/P entry
      if (newStatus === 'received') {
        console.log('dataManager.service: Purchase order received, creating inventory batches and A/P entry');
        
        try {
          // Get purchase order with items and supplier
          const { data: po, error: poError } = await supabase
            .from('purchase_orders')
            .select(`
              *,
              suppliers (id, company_name, payment_terms),
              purchase_order_items (*, products (id, name, shelf_life))
            `)
            .eq('id', id)
            .single();

          if (poError || !po) {
            console.error('dataManager.service: Error fetching purchase order for batch creation:', poError);
          } else {
            // Create A/P entry first (using the service from accounting)
            if (po.supplier_id && po.total_amount) {
              try {
                const apResult = await accountingService.createAPFromPurchaseOrder(
                  po.id,
                  po.supplier_id,
                  po.total_amount
                );
                
                if (apResult.error) {
                  console.warn('dataManager.service: Failed to create A/P entry:', apResult.error);
                } else {
                  console.log('dataManager.service: A/P entry created successfully');
                }
              } catch (error) {
                console.warn('dataManager.service: Error creating A/P entry:', error);
              }
            }

            // Create inventory batches
            const batches = [];

            // Create inventory batch for each item
            for (const item of po.purchase_order_items || []) {
              const batchNumber = `PO-${po.po_number}-${item.product_id}-${Date.now()}`;
              const receivedDate = new Date().toISOString();
              const expiryDate = new Date();
              
              // Calculate expiry date based on product shelf life
              if (item.products?.shelf_life) {
                expiryDate.setDate(expiryDate.getDate() + item.products.shelf_life);
              } else {
                // Default to 30 days if no shelf life specified
                expiryDate.setDate(expiryDate.getDate() + 30);
              }

              const batch = {
                id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                product_id: item.product_id,
                warehouse_id: warehouseId || 'default-warehouse', // Use default warehouse if none specified
                batch_number: batchNumber,
                quantity: item.quantity,
                unit_cost: item.unit_price,
                expiry_date: expiryDate.toISOString(),
                received_date: receivedDate,
                status: 'active',
              };

              batches.push(batch);

              // Create stock movement record
              const stockMovement = {
                id: `movement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                product_id: item.product_id,
                warehouse_id: warehouseId || 'default-warehouse',
                type: 'purchase',
                quantity: item.quantity,
                reason: `Purchase Order ${po.po_number}`,
                reference_id: id,
                unit_cost: item.unit_price,
                created_at: new Date().toISOString(),
                created_by: 'system',
              };

              // Insert inventory batch
              const { error: batchError } = await supabase
                .from('inventory_items')
                .insert(batch);

              if (batchError) {
                console.error('dataManager.service: Error creating inventory batch:', batchError);
              }

              // Insert stock movement
              const { error: movementError } = await supabase
                .from('stock_movements')
                .insert(stockMovement);

              if (movementError) {
                console.error('dataManager.service: Error creating stock movement:', movementError);
              }
            }

            // Clear inventory and stock movement caches
            dataManagerService.clearCache(CACHE_CONFIG.INVENTORY.key);
          }
        } catch (error) {
          console.warn('dataManager.service: Failed to create inventory batches, but PO status updated:', error);
          // Don't fail the entire operation if batch creation fails
        }
      }

      // Clear purchase orders cache
      dataManagerService.clearCache(CACHE_CONFIG.PURCHASE_ORDERS.key);

      console.log('dataManager.service: Purchase order status updated successfully');
      return { data: updateResult.data, error: null };
    } catch (error) {
      console.error('dataManager.service: Error updating purchase order status:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  // =============================================
  // SUPPLIER PERFORMANCE METRICS
  // =============================================

  /**
   * Get supplier performance metrics
   */
  getSupplierPerformance: async (supplierId?: string): Promise<ServiceResult<any>> => {
    try {
      console.log('dataManager.service: Getting supplier performance metrics');

      let query = supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers (id, company_name, contact_person, payment_terms),
          purchase_order_items (*)
        `);

      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('dataManager.service: Supabase error fetching supplier performance:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Calculate metrics
      const performanceMetrics: any = {
        totalOrders: data?.length || 0,
        totalValue: data?.reduce((sum, po) => sum + (po.total_amount || 0), 0) || 0,
        averageOrderValue: 0,
        onTimeDeliveryRate: 0,
        statusBreakdown: {
          draft: 0,
          pending: 0,
          ordered: 0,
          received: 0,
          cancelled: 0,
        },
        recentOrders: data?.slice(0, 5) || [],
        topProducts: {} as any,
      };

      if (data && data.length > 0) {
        performanceMetrics.averageOrderValue = performanceMetrics.totalValue / data.length;
        
        // Calculate status breakdown
        data.forEach((po: any) => {
          const status = po.status as keyof typeof performanceMetrics.statusBreakdown;
          if (performanceMetrics.statusBreakdown.hasOwnProperty(status)) {
            performanceMetrics.statusBreakdown[status]++;
          }
        });

        // Calculate top products
        data.forEach((po: any) => {
          (po.purchase_order_items || []).forEach((item: any) => {
            const key = item.product_id;
            if (!performanceMetrics.topProducts[key]) {
              performanceMetrics.topProducts[key] = {
                productId: item.product_id,
                quantity: 0,
                value: 0,
              };
            }
            performanceMetrics.topProducts[key].quantity += item.quantity;
            performanceMetrics.topProducts[key].value += item.subtotal;
          });
        });

        // Convert top products to array and sort
        performanceMetrics.topProducts = Object.values(performanceMetrics.topProducts)
          .sort((a: any, b: any) => b.value - a.value)
          .slice(0, 5);
      }

      console.log('dataManager.service: Supplier performance metrics calculated successfully');
      return { data: performanceMetrics, error: null };
    } catch (error) {
      console.error('dataManager.service: Error calculating supplier performance:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  // =============================================
  // SALES ORDER CRUD OPERATIONS
  // =============================================

  /**
   * Create new sales order
   */
  createSalesOrder: async (salesOrderData: Omit<SalesOrder, 'id' | 'createdAt' | 'updatedAt' | 'orderNumber'>): Promise<ServiceResult<SalesOrder>> => {
    try {
      console.log('dataManager.service: Creating new sales order:', salesOrderData);

      // Generate order number
      const orderNumber = `SO-${Date.now()}`;

      // Create sales order
      const { data: so, error: soError } = await supabase
        .from('sales_orders')
        .insert({
          customer_name: salesOrderData.customerName,
          customer_phone: salesOrderData.customerPhone,
          customer_email: salesOrderData.customerEmail,
          delivery_address: salesOrderData.deliveryAddress,
          warehouse_id: salesOrderData.warehouseId,
          total_amount: salesOrderData.totalAmount,
          status: salesOrderData.status,
          sales_order_status: salesOrderData.salesOrderStatus,
          delivery_date: salesOrderData.deliveryDate,
          order_number: orderNumber,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (soError) {
        console.error('dataManager.service: Supabase error creating sales order:', soError);
        return { data: null, error: getErrorMessage(soError) };
      }

      // Create sales order items
      if (salesOrderData.items && salesOrderData.items.length > 0) {
        const itemsData = salesOrderData.items.map(item => ({
          sales_order_id: so.id,
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        }));

        const { error: itemsError } = await supabase
          .from('sales_order_items')
          .insert(itemsData);

        if (itemsError) {
          console.error('dataManager.service: Supabase error creating sales order items:', itemsError);
          // Clean up the sales order if items creation fails
          await supabase.from('sales_orders').delete().eq('id', so.id);
          return { data: null, error: getErrorMessage(itemsError) };
        }
      }

      console.log('dataManager.service: Sales order created successfully');
      return {
        data: {
          ...so,
          items: salesOrderData.items || [],
          orderNumber,
        },
        error: null
      };
    } catch (error) {
      console.error('dataManager.service: Error creating sales order:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Update sales order
   */
  updateSalesOrder: async (id: string, updates: Partial<SalesOrder>): Promise<ServiceResult<SalesOrder>> => {
    try {
      console.log('dataManager.service: Updating sales order:', id, updates);

      const soUpdate: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.customerName) soUpdate.customer_name = updates.customerName;
      if (updates.customerPhone) soUpdate.customer_phone = updates.customerPhone;
      if (updates.customerEmail) soUpdate.customer_email = updates.customerEmail;
      if (updates.deliveryAddress) soUpdate.delivery_address = updates.deliveryAddress;
      if (updates.warehouseId) soUpdate.warehouse_id = updates.warehouseId;
      if (updates.totalAmount !== undefined) soUpdate.total_amount = updates.totalAmount;
      if (updates.status) soUpdate.status = updates.status;
      if (updates.salesOrderStatus) soUpdate.sales_order_status = updates.salesOrderStatus;
      if (updates.deliveryDate !== undefined) soUpdate.delivery_date = updates.deliveryDate;

      const { data, error } = await supabase
        .from('sales_orders')
        .update(soUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('dataManager.service: Supabase error updating sales order:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Update items if provided
      if (updates.items) {
        // Delete existing items
        await supabase.from('sales_order_items').delete().eq('sales_order_id', id);
        
        // Insert new items
        if (updates.items.length > 0) {
          const itemsData = updates.items.map(item => ({
            sales_order_id: id,
            product_id: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          }));

          const { error: itemsError } = await supabase
            .from('sales_order_items')
            .insert(itemsData);

          if (itemsError) {
            console.error('dataManager.service: Supabase error updating sales order items:', itemsError);
            return { data: null, error: getErrorMessage(itemsError) };
          }
        }
      }

      console.log('dataManager.service: Sales order updated successfully');
      return {
        data: {
          ...data,
          items: updates.items || data.sales_order_items || [],
        },
        error: null
      };
    } catch (error) {
      console.error('dataManager.service: Error updating sales order:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  // =============================================
  // POS SALES OPERATIONS
  // =============================================

  /**
   * Create new POS sale
   */
  createPOSSale: async (saleData: POSSale): Promise<ServiceResult<POSSale>> => {
    try {
      console.log('dataManager.service: Creating new POS sale:', saleData);

      // Create POS sale record
      const { data: sale, error: saleError } = await supabase
        .from('pos_sales')
        .insert({
          receipt_number: saleData.receiptNumber,
          subtotal: saleData.subtotal,
          tax: saleData.tax,
          total_amount: saleData.totalAmount,
          payment_method: saleData.paymentMethod,
          amount_received: saleData.amountReceived,
          change: saleData.change,
          converted_from_order_id: saleData.convertedFromOrderId || null,
          created_at: saleData.createdAt,
        })
        .select()
        .single();

      if (saleError) {
        console.error('dataManager.service: Supabase error creating POS sale:', saleError);
        return { data: null, error: getErrorMessage(saleError) };
      }

      // Create POS sale items
      if (saleData.items && saleData.items.length > 0) {
        const itemsData = saleData.items.map((item: POSSaleItem) => ({
          pos_sale_id: sale.id,
          product_id: item.productId,
          quantity: item.quantity,
          uom: item.uom,
          unit_price: item.unitPrice,
          subtotal: item.subtotal,
        }));

        const { error: itemsError } = await supabase
          .from('pos_sale_items')
          .insert(itemsData);

        if (itemsError) {
          console.error('dataManager.service: Supabase error creating POS sale items:', itemsError);
          // Clean up the POS sale if items creation fails
          await supabase.from('pos_sales').delete().eq('id', sale.id);
          return { data: null, error: getErrorMessage(itemsError) };
        }
      }

      console.log('dataManager.service: POS sale created successfully');
      
      // Create A/R entry automatically for credit payments or converted sales orders
      if (['check', 'transfer'].includes(saleData.paymentMethod) || saleData.convertedFromOrderId) {
        try {
          const customerName = saleData.convertedFromOrderId ? 'Customer' : 'Walk-in Customer';
          const arResult = await accountingService.createARFromPOSSale(
            sale.id,
            customerName,
            saleData.totalAmount
          );
          
          if (arResult.error) {
            console.warn('dataManager.service: Failed to create A/R entry:', arResult.error);
          } else {
            console.log('dataManager.service: A/R entry created successfully');
          }
        } catch (error) {
          console.warn('dataManager.service: Error creating A/R entry:', error);
        }
      }

      return {
        data: {
          ...sale,
          items: saleData.items || [],
        },
        error: null
      };
    } catch (error) {
      console.error('dataManager.service: Error creating POS sale:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Get today's POS sales summary
   */
  getTodaysPOSSales: async (): Promise<ServiceResult<{
    totalTransactions: number;
    totalRevenue: number;
    averageTransactionValue: number;
  }>> => {
    try {
      console.log('dataManager.service: Getting today\'s POS sales summary');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('pos_sales')
        .select('total_amount')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      if (error) {
        console.error('dataManager.service: Supabase error fetching POS sales:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      const totalTransactions = data?.length || 0;
      const totalRevenue = data?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
      const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      const summary = {
        totalTransactions,
        totalRevenue,
        averageTransactionValue,
      };

      console.log('dataManager.service: Today\'s POS sales summary calculated successfully');
      return { data: summary, error: null };
    } catch (error) {
      console.error('dataManager.service: Error calculating today\'s POS sales summary:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },
};