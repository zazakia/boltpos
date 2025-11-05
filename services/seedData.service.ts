// Seed Data Service for InventoryPro
// Provides comprehensive test data for development and demonstration

import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/utils/errorHandler';
import { ServiceResult } from './types';
import { businessUtils, dateUtils } from '@/utils/inventoryUtils';
import { productSchema, supplierSchema, warehouseSchema } from '@/schemas/validation';

// =============================================
// CATEGORY SEED DATA
// =============================================

const PH_FILIPINO_SOFT_DRINK_CATEGORIES = [
  { name: 'Carbonated Drinks', color: '#DC2626' },
  { name: 'Fruit Juices', color: '#F59E0B' },
  { name: 'Energy Drinks', color: '#7C3AED' },
  { name: 'Bottled Water', color: '#06B6D4' },
  { name: 'Sports Drinks', color: '#10B981' },
  { name: 'Tea & Coffee', color: '#8B5CF6' },
  { name: 'Milk Products', color: '#F3F4F6' },
  { name: 'Snacks', color: '#F97316' },
];

// =============================================
// PHILIPPINE PRODUCT SEED DATA
// =============================================

const PH_SOFT_DRINK_PRODUCTS = [
  // Coca-Cola Products
  {
    name: 'Coca-Cola Classic 330ml',
    description: 'Classic Coca-Cola soft drink in 330ml can',
    category: 'Carbonated Drinks',
    basePrice: 25.00,
    baseUOM: 'can',
    minStockLevel: 50,
    shelfLife: 365,
    alternateUOMs: [
      { name: 'pack', quantity: 6, conversionFactor: 6, price: 150.00 },
      { name: 'carton', quantity: 24, conversionFactor: 24, price: 600.00 },
    ],
  },
  {
    name: 'Coca-Cola Zero Sugar 330ml',
    description: 'Coca-Cola Zero Sugar in 330ml can',
    category: 'Carbonated Drinks',
    basePrice: 25.00,
    baseUOM: 'can',
    minStockLevel: 30,
    shelfLife: 365,
    alternateUOMs: [
      { name: 'pack', quantity: 6, conversionFactor: 6, price: 150.00 },
    ],
  },
  {
    name: 'Sprite 330ml',
    description: 'Lemon-lime flavored soft drink in 330ml can',
    category: 'Carbonated Drinks',
    basePrice: 25.00,
    baseUOM: 'can',
    minStockLevel: 40,
    shelfLife: 365,
    alternateUOMs: [
      { name: 'pack', quantity: 6, conversionFactor: 6, price: 150.00 },
      { name: 'carton', quantity: 24, conversionFactor: 24, price: 600.00 },
    ],
  },

  // Pepsi Products
  {
    name: 'Pepsi Cola 330ml',
    description: 'Pepsi Cola soft drink in 330ml can',
    category: 'Carbonated Drinks',
    basePrice: 23.00,
    baseUOM: 'can',
    minStockLevel: 45,
    shelfLife: 365,
    alternateUOMs: [
      { name: 'pack', quantity: 6, conversionFactor: 6, price: 138.00 },
      { name: 'carton', quantity: 24, conversionFactor: 24, price: 552.00 },
    ],
  },
  {
    name: 'Mountain Dew 330ml',
    description: 'Mountain Dew citrus flavored drink in 330ml can',
    category: 'Energy Drinks',
    basePrice: 28.00,
    baseUOM: 'can',
    minStockLevel: 35,
    shelfLife: 365,
    alternateUOMs: [
      { name: 'pack', quantity: 6, conversionFactor: 6, price: 168.00 },
    ],
  },

  // Local Filipino Brands
  {
    name: 'Sarsi 330ml',
    description: 'Sarsi sarsaparilla soft drink in 330ml can',
    category: 'Carbonated Drinks',
    basePrice: 22.00,
    baseUOM: 'can',
    minStockLevel: 40,
    shelfLife: 365,
    alternateUOMs: [
      { name: 'pack', quantity: 6, conversionFactor: 6, price: 132.00 },
    ],
  },
  {
    name: 'Coke Light 330ml',
    description: 'Coke Light diet cola in 330ml can',
    category: 'Carbonated Drinks',
    basePrice: 25.00,
    baseUOM: 'can',
    minStockLevel: 25,
    shelfLife: 365,
    alternateUOMs: [
      { name: 'pack', quantity: 6, conversionFactor: 6, price: 150.00 },
    ],
  },

  // Bottled Water
  {
    name: 'Evian 500ml',
    description: 'Evian natural mineral water 500ml bottle',
    category: 'Bottled Water',
    basePrice: 15.00,
    baseUOM: 'bottle',
    minStockLevel: 100,
    shelfLife: 1095, // 3 years
    alternateUOMs: [
      { name: 'case', quantity: 24, conversionFactor: 24, price: 360.00 },
    ],
  },
  {
    name: 'Aqua 1.5L',
    description: 'Aqua bottled water 1.5L bottle',
    category: 'Bottled Water',
    basePrice: 20.00,
    baseUOM: 'bottle',
    minStockLevel: 60,
    shelfLife: 1095,
    alternateUOMs: [
      { name: 'case', quantity: 12, conversionFactor: 12, price: 240.00 },
    ],
  },

  // Fruit Juices
  {
    name: 'Mango Juice 200ml',
    description: 'Mango juice drink in 200ml carton',
    category: 'Fruit Juices',
    basePrice: 18.00,
    baseUOM: 'carton',
    minStockLevel: 80,
    shelfLife: 180,
    alternateUOMs: [
      { name: 'pack', quantity: 6, conversionFactor: 6, price: 108.00 },
      { name: 'case', quantity: 24, conversionFactor: 24, price: 432.00 },
    ],
  },
  {
    name: 'Calamansi Juice 250ml',
    description: 'Calamansi citrus juice in 250ml bottle',
    category: 'Fruit Juices',
    basePrice: 22.00,
    baseUOM: 'bottle',
    minStockLevel: 60,
    shelfLife: 270,
    alternateUOMs: [
      { name: 'pack', quantity: 4, conversionFactor: 4, price: 88.00 },
    ],
  },

  // Energy Drinks
  {
    name: 'Red Bull 250ml',
    description: 'Red Bull energy drink 250ml can',
    category: 'Energy Drinks',
    basePrice: 65.00,
    baseUOM: 'can',
    minStockLevel: 20,
    shelfLife: 730,
    alternateUOMs: [
      { name: 'pack', quantity: 4, conversionFactor: 4, price: 260.00 },
      { name: 'case', quantity: 24, conversionFactor: 24, price: 1560.00 },
    ],
  },
  {
    name: 'Krating Daeng 150ml',
    description: 'Krating Daeng energy drink 150ml bottle',
    category: 'Energy Drinks',
    basePrice: 35.00,
    baseUOM: 'bottle',
    minStockLevel: 30,
    shelfLife: 730,
    alternateUOMs: [
      { name: 'pack', quantity: 6, conversionFactor: 6, price: 210.00 },
    ],
  },

  // Sports Drinks
  {
    name: 'Gatorade Orange 500ml',
    description: 'Gatorade sports drink orange flavor 500ml bottle',
    category: 'Sports Drinks',
    basePrice: 30.00,
    baseUOM: 'bottle',
    minStockLevel: 40,
    shelfLife: 365,
    alternateUOMs: [
      { name: 'case', quantity: 24, conversionFactor: 24, price: 720.00 },
    ],
  },
  {
    name: 'Powerade Mountain Blast 400ml',
    description: 'Powerade sports drink mountain blast 400ml bottle',
    category: 'Sports Drinks',
    basePrice: 25.00,
    baseUOM: 'bottle',
    minStockLevel: 50,
    shelfLife: 365,
    alternateUOMs: [
      { name: 'case', quantity: 24, conversionFactor: 24, price: 600.00 },
    ],
  },
];

// =============================================
// PHILIPPINE SUPPLIER SEED DATA
// =============================================

const PH_SUPPLIERS = [
  {
    companyName: 'Coca-Cola Beverages Philippines, Inc.',
    contactPerson: 'Ana Martinez',
    phone: '+639171234567',
    email: 'ana.martinez@coca-cola.com',
    paymentTerms: 'Net 30' as const,
    address: 'North Ave, Taguig City, Metro Manila',
  },
  {
    companyName: 'Pepsi-Cola Products Philippines, Inc.',
    contactPerson: 'Carlos Rivera',
    phone: '+639171234568',
    email: 'carlos.rivara@pepsico.com',
    paymentTerms: 'Net 15' as const,
    address: 'Ortigas, Pasig City, Metro Manila',
  },
  {
    companyName: 'Red Bull Philippines',
    contactPerson: 'Lisa Chen',
    phone: '+639171234569',
    email: 'lisa.chen@redbull.com',
    paymentTerms: 'Net 60' as const,
    address: 'Bonifacio Global City, Taguig',
  },
  {
    companyName: 'Montreal Trading Corporation',
    contactPerson: 'Miguel Santos',
    phone: '+639171234570',
    email: 'miguel.santos@montreal.com.ph',
    paymentTerms: 'COD' as const,
    address: 'Taft Avenue, Manila',
  },
  {
    companyName: 'Nestle Philippines',
    contactPerson: 'Jocelyn Garcia',
    phone: '+639171234571',
    email: 'jocelyn.garcia@nestle.com',
    paymentTerms: 'Net 30' as const,
    address: 'Buendia, Makati City',
  },
  {
    companyName: 'Mondeelez International Philippines',
    contactPerson: 'Roberto Lim',
    phone: '+639171234572',
    email: 'roberto.lim@mondelez.com',
    paymentTerms: 'Net 45' as const,
    address: 'Alabang, Muntinlupa City',
  },
];

// =============================================
// WAREHOUSE SEED DATA
// =============================================

const PH_WAREHOUSES = [
  {
    name: 'Manila Central Warehouse',
    location: 'Tondo, Manila',
    manager: 'Juan Dela Cruz',
    capacity: 10000,
    currentUtilization: 3500,
    status: 'active' as const,
  },
  {
    name: 'North Metro Manila Hub',
    location: 'Quezon City',
    manager: 'Maria Santos',
    capacity: 8000,
    currentUtilization: 2100,
    status: 'active' as const,
  },
  {
    name: 'South Manila Distribution',
    location: 'Makati City',
    manager: 'Pedro Garcia',
    capacity: 6000,
    currentUtilization: 1800,
    status: 'active' as const,
  },
  {
    name: 'Cebu Central Hub',
    location: 'Cebu City',
    manager: 'Liza Torres',
    capacity: 7500,
    currentUtilization: 2200,
    status: 'active' as const,
  },
  {
    name: 'Davao Regional Warehouse',
    location: 'Davao City',
    manager: 'Harold Mendoza',
    capacity: 5000,
    currentUtilization: 1200,
    status: 'active' as const,
  },
];

// =============================================
// SEED DATA SERVICE
// =============================================

export const seedDataService = {
  /**
   * Initialize all seed data
   */
  initializeAllData: async (): Promise<ServiceResult<any>> => {
    try {
      console.log('seedData.service: Starting comprehensive data seeding');
      
      const results = {
        categories: await seedDataService.seedCategories(),
        suppliers: await seedDataService.seedSuppliers(),
        warehouses: await seedDataService.seedWarehouses(),
        products: await seedDataService.seedProducts(),
        inventory: await seedDataService.seedInventoryBatches(),
        purchaseOrders: await seedDataService.seedSamplePurchaseOrders(),
        alerts: await seedDataService.generateInitialAlerts(),
      };

      console.log('seedData.service: All seed data initialized successfully');
      return { data: results, error: null };
    } catch (error) {
      console.error('seedData.service: Error initializing seed data:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Seed product categories
   */
  seedCategories: async (): Promise<ServiceResult<any[]>> => {
    try {
      console.log('seedData.service: Seeding categories');
      
      const categoriesData = PH_FILIPINO_SOFT_DRINK_CATEGORIES.map(category => ({
        name: category.name,
        color: category.color,
      }));

      const { data, error } = await supabase
        .from('categories')
        .insert(categoriesData)
        .select();

      if (error) {
        console.error('seedData.service: Error seeding categories:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('seedData.service: Categories seeded successfully');
      return { data, error: null };
    } catch (error) {
      console.error('seedData.service: Error seeding categories:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Seed suppliers
   */
  seedSuppliers: async (): Promise<ServiceResult<any[]>> => {
    try {
      console.log('seedData.service: Seeding suppliers');
      
      // Validate supplier data
      const validatedSuppliers = PH_SUPPLIERS.map(supplier => {
        const validated = supplierSchema.parse(supplier);
        return validated;
      });

      const { data, error } = await supabase
        .from('suppliers')
        .insert(validatedSuppliers)
        .select();

      if (error) {
        console.error('seedData.service: Error seeding suppliers:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('seedData.service: Suppliers seeded successfully');
      return { data, error: null };
    } catch (error) {
      console.error('seedData.service: Error seeding suppliers:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Seed warehouses
   */
  seedWarehouses: async (): Promise<ServiceResult<any[]>> => {
    try {
      console.log('seedData.service: Seeding warehouses');
      
      // Validate warehouse data
      const validatedWarehouses = PH_WAREHOUSES.map(warehouse => {
        const validated = warehouseSchema.parse(warehouse);
        return validated;
      });

      const { data, error } = await supabase
        .from('warehouses')
        .insert(validatedWarehouses)
        .select();

      if (error) {
        console.error('seedData.service: Error seeding warehouses:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('seedData.service: Warehouses seeded successfully');
      return { data, error: null };
    } catch (error) {
      console.error('seedData.service: Error seeding warehouses:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Seed products
   */
  seedProducts: async (): Promise<ServiceResult<any[]>> => {
    try {
      console.log('seedData.service: Seeding products');
      
      // First, get categories to map category names to IDs
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name');

      if (!categories) {
        return { data: null, error: 'Failed to fetch categories for product seeding' };
      }

      const categoryMap = categories.reduce((acc, cat) => {
        acc[cat.name] = cat.id;
        return acc;
      }, {} as Record<string, string>);

      const products = [];

      for (const productData of PH_SOFT_DRINK_PRODUCTS) {
        // Create product
        const productPayload = {
          name: productData.name,
          description: productData.description,
          basePrice: productData.basePrice,
          baseUOM: productData.baseUOM,
          minStockLevel: productData.minStockLevel,
          shelfLife: productData.shelfLife,
          categoryId: categoryMap[productData.category],
          status: 'active' as const,
        };

        const { data: product, error: productError } = await supabase
          .from('products')
          .insert(productPayload)
          .select()
          .single();

        if (productError) {
          console.error('seedData.service: Error creating product:', productError);
          continue;
        }

        // Create alternate UOMs if any
        if (productData.alternateUOMs && productData.alternateUOMs.length > 0) {
          const uomPayloads = productData.alternateUOMs.map(uom => ({
            product_id: product.id,
            name: uom.name,
            quantity: uom.quantity,
            conversion_factor: uom.conversionFactor,
            price: uom.price,
          }));

          const { error: uomError } = await supabase
            .from('alternate_uoms')
            .insert(uomPayloads);

          if (uomError) {
            console.error('seedData.service: Error creating alternate UOMs:', uomError);
          }
        }

        products.push(product);
      }

      console.log('seedData.service: Products seeded successfully');
      return { data: products, error: null };
    } catch (error) {
      console.error('seedData.service: Error seeding products:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Seed inventory batches
   */
  seedInventoryBatches: async (): Promise<ServiceResult<any[]>> => {
    try {
      console.log('seedData.service: Seeding inventory batches');
      
      // Get all products and warehouses
      const { data: products } = await supabase
        .from('products')
        .select('id, shelfLife')
        .eq('status', 'active');

      const { data: warehouses } = await supabase
        .from('warehouses')
        .select('id')
        .eq('status', 'active');

      if (!products || !warehouses) {
        return { data: null, error: 'Failed to fetch products or warehouses for inventory seeding' };
      }

      const inventoryBatches = [];

      for (const product of products.slice(0, 10)) { // Seed first 10 products
        for (const warehouse of warehouses.slice(0, 3)) { // Distribute across first 3 warehouses
          // Create 2-3 batches per product per warehouse
          const batchCount = Math.floor(Math.random() * 2) + 2;
          
          for (let i = 0; i < batchCount; i++) {
            const batchQuantity = Math.floor(Math.random() * 100) + 50; // 50-150 units
            const expiryDays = Math.floor(Math.random() * product.shelfLife) + 30; // 30 days to shelf life
            
            const { data: batch, error: batchError } = await supabase
              .from('inventory_items')
              .insert({
                product_id: product.id,
                warehouse_id: warehouse.id,
                batch_number: businessUtils.generateBatchNumber(product.id),
                quantity: batchQuantity,
                unit_cost: 15 + Math.random() * 10, // Random cost between 15-25
                expiry_date: dateUtils.addDays(new Date(), expiryDays),
                status: 'active',
              })
              .select()
              .single();

            if (batchError) {
              console.error('seedData.service: Error creating inventory batch:', batchError);
              continue;
            }

            inventoryBatches.push(batch);
          }
        }
      }

      console.log('seedData.service: Inventory batches seeded successfully');
      return { data: inventoryBatches, error: null };
    } catch (error) {
      console.error('seedData.service: Error seeding inventory batches:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Seed sample purchase orders
   */
  seedSamplePurchaseOrders: async (): Promise<ServiceResult<any[]>> => {
    try {
      console.log('seedData.service: Seeding sample purchase orders');
      
      // Get suppliers and products
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id')
        .eq('status', 'active')
        .limit(3);

      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('status', 'active')
        .limit(5);

      if (!suppliers || !products) {
        return { data: null, error: 'Failed to fetch suppliers or products for PO seeding' };
      }

      const purchaseOrders = [];

      // Create sample POs in different statuses
      for (let i = 0; i < suppliers.length; i++) {
        const supplier = suppliers[i];
        const status = ['draft', 'pending', 'ordered'][i] as 'draft' | 'pending' | 'ordered';
        
        // Create PO items
        const poItems = products.slice(0, 3).map(product => ({
          productId: product.id,
          quantity: Math.floor(Math.random() * 50) + 20, // 20-70 units
          unitPrice: 20 + Math.random() * 10, // 20-30 peso
        }));

        const { data: po, error: poError } = await supabase
          .rpc('create_purchase_order', {
            p_supplier_id: supplier.id,
            p_items: poItems,
            p_expected_delivery_date: dateUtils.addDays(new Date(), 7 + i * 3),
            p_notes: `Sample purchase order ${i + 1} for testing`,
          });

        if (poError) {
          console.error('seedData.service: Error creating purchase order:', poError);
          continue;
        }

        // Update status for some POs
        if (status !== 'draft') {
          await supabase.rpc('update_purchase_order_status', {
            p_order_id: po.id,
            p_status: status,
          });
        }

        purchaseOrders.push(po);
      }

      console.log('seedData.service: Sample purchase orders seeded successfully');
      return { data: purchaseOrders, error: null };
    } catch (error) {
      console.error('seedData.service: Error seeding sample purchase orders:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Generate initial alerts
   */
  generateInitialAlerts: async (): Promise<ServiceResult<any[]>> => {
    try {
      console.log('seedData.service: Generating initial alerts');
      
      const { data, error } = await supabase.rpc('generate_alerts');

      if (error) {
        console.error('seedData.service: Error generating initial alerts:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('seedData.service: Initial alerts generated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('seedData.service: Error generating initial alerts:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Clear all seed data (for development/testing)
   */
  clearAllData: async (): Promise<ServiceResult<any>> => {
    try {
      console.log('seedData.service: Clearing all data');
      
      // Clear data in reverse dependency order
      const tables = [
        'alerts',
        'stock_movements',
        'purchase_order_items',
        'purchase_orders',
        'inventory_items',
        'alternate_uoms',
        'expenses',
        'accounts_payable',
        'accounts_receivable',
        'products',
        'warehouses',
        'suppliers',
        'categories',
      ];

      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (error) {
          console.warn(`seedData.service: Warning - could not clear ${table}:`, error);
        }
      }

      console.log('seedData.service: All data cleared successfully');
      return { data: true, error: null };
    } catch (error) {
      console.error('seedData.service: Error clearing data:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Check if data is already seeded
   */
  isAlreadySeeded: async (): Promise<ServiceResult<boolean>> => {
    try {
      console.log('seedData.service: Checking if data is already seeded');
      
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .limit(1);

      const isSeeded = products && products.length > 0;
      
      console.log('seedData.service: Data seeding check completed');
      return { data: isSeeded, error: null };
    } catch (error) {
      console.error('seedData.service: Error checking seed status:', error);
      return { data: false, error: getErrorMessage(error) };
    }
  },
};