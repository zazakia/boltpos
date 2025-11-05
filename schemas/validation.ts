// Data Validation Schemas for InventoryPro
// Using Zod for runtime type checking and validation

import { z } from 'zod';

// =============================================
// PRODUCT VALIDATION SCHEMAS
// =============================================

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Product name is required').max(100, 'Product name too long'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  image: z.string().url().optional().or(z.literal('')),
  basePrice: z.number().positive('Base price must be positive'),
  baseUOM: z.enum(['bottle', 'can', 'carton', 'pack', 'case']),
  minStockLevel: z.number().int().min(0, 'Minimum stock level cannot be negative'),
  shelfLife: z.number().int().min(1, 'Shelf life must be at least 1 day').max(3650, 'Shelf life too long'),
  status: z.enum(['active', 'inactive']),
});

export const alternateUOMSchema = z.object({
  name: z.string().min(1, 'UOM name is required'),
  quantity: z.number().positive('Quantity must be positive'),
  conversionFactor: z.number().positive('Conversion factor must be positive'),
  price: z.number().positive('Price must be positive'),
});

export const productWithUOMsSchema = productSchema.extend({
  alternateUOMs: z.array(alternateUOMSchema).optional(),
});

// =============================================
// WAREHOUSE VALIDATION SCHEMAS
// =============================================

export const warehouseSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Warehouse name is required').max(100, 'Name too long'),
  location: z.string().min(1, 'Location is required').max(200, 'Location too long'),
  manager: z.string().min(1, 'Manager name is required').max(100, 'Manager name too long'),
  capacity: z.number().int().positive('Capacity must be positive'),
  currentUtilization: z.number().int().min(0, 'Utilization cannot be negative').default(0),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
});

// =============================================
// INVENTORY VALIDATION SCHEMAS
// =============================================

export const inventoryItemSchema = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid('Valid product ID is required'),
  warehouseId: z.string().uuid('Valid warehouse ID is required'),
  batchNumber: z.string().min(1, 'Batch number is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitCost: z.number().positive('Unit cost must be positive'),
  expiryDate: z.string().datetime().optional(),
  receivedDate: z.string().datetime().optional(),
  status: z.enum(['active', 'expired', 'damaged']).default('active'),
});

export const stockMovementSchema = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid('Valid product ID is required'),
  warehouseId: z.string().uuid('Valid warehouse ID is required'),
  type: z.enum(['purchase', 'sale', 'transfer', 'adjustment', 'expired']),
  batchId: z.string().uuid().optional(),
  quantity: z.number().int(),
  reason: z.string().optional(),
  referenceId: z.string().optional(),
  unitCost: z.number().positive().optional(),
});

// =============================================
// SUPPLIER VALIDATION SCHEMAS
// =============================================

export const supplierSchema = z.object({
  id: z.string().uuid().optional(),
  companyName: z.string().min(1, 'Company name is required').max(100, 'Company name too long'),
  contactPerson: z.string().min(1, 'Contact person is required').max(100, 'Contact person name too long'),
  phone: z.string().regex(/^(\+63|0)[9]\d{9}$/, 'Invalid Philippine phone number format'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  paymentTerms: z.enum(['Net 15', 'Net 30', 'Net 60', 'COD']),
  address: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

// =============================================
// PURCHASE ORDER VALIDATION SCHEMAS
// =============================================

export const purchaseOrderItemSchema = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid('Valid product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  receivedQuantity: z.number().int().min(0).default(0),
});

export const purchaseOrderSchema = z.object({
  id: z.string().uuid().optional(),
  poNumber: z.string().optional(),
  supplierId: z.string().uuid('Valid supplier ID is required'),
  items: z.array(purchaseOrderItemSchema).min(1, 'At least one item is required'),
  totalAmount: z.number().min(0, 'Total amount cannot be negative'),
  status: z.enum(['draft', 'pending', 'ordered', 'received', 'cancelled']).default('draft'),
  expectedDeliveryDate: z.string().datetime().optional(),
  actualDeliveryDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// =============================================
// SALES ORDER VALIDATION SCHEMAS
// =============================================

export const salesOrderItemSchema = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid('Valid product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  price: z.number().positive('Price must be positive'),
  subtotal: z.number().positive().optional(),
});

export const salesOrderSchema = z.object({
  id: z.string().uuid().optional(),
  orderNumber: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required').max(100, 'Customer name too long'),
  customerPhone: z.string().regex(/^(\+63|0)[9]\d{9}$/, 'Invalid Philippine phone number format').optional(),
  customerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  deliveryAddress: z.string().optional(),
  items: z.array(salesOrderItemSchema).min(1, 'At least one item is required'),
  warehouseId: z.string().uuid('Valid warehouse ID is required'),
  totalAmount: z.number().min(0, 'Total amount cannot be negative'),
  status: z.enum(['draft', 'pending', 'converted', 'cancelled']).default('draft'),
  salesOrderStatus: z.enum(['pending', 'converted']).default('pending'),
  deliveryDate: z.string().datetime().optional(),
});

// =============================================
// POS SALE VALIDATION SCHEMAS
// =============================================

export const posSaleItemSchema = z.object({
  productId: z.string().uuid('Valid product ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
  uom: z.string().min(1, 'Unit of measure is required'),
  unitPrice: z.number().positive('Unit price must be positive'),
  subtotal: z.number().positive('Subtotal must be positive'),
});

export const posSaleSchema = z.object({
  id: z.string().uuid().optional(),
  receiptNumber: z.string().optional(),
  items: z.array(posSaleItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().min(0, 'Subtotal cannot be negative'),
  tax: z.number().min(0, 'Tax cannot be negative'),
  totalAmount: z.number().positive('Total amount must be positive'),
  paymentMethod: z.enum(['cash', 'card', 'check', 'transfer']),
  amountReceived: z.number().positive('Amount received must be positive'),
  change: z.number().min(0, 'Change cannot be negative'),
  convertedFromOrderId: z.string().uuid().optional(),
});

// =============================================
// ALERT VALIDATION SCHEMAS
// =============================================

export const alertSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['low_stock', 'expiring_soon', 'expired', 'warehouse_full']),
  severity: z.enum(['info', 'warning', 'critical']),
  title: z.string().min(1, 'Alert title is required').max(100, 'Title too long'),
  message: z.string().min(1, 'Alert message is required').max(500, 'Message too long'),
  entityType: z.enum(['product', 'inventory', 'warehouse']),
  entityId: z.string().min(1, 'Entity ID is required'),
  status: z.enum(['active', 'dismissed']).default('active'),
});

// =============================================
// ACCOUNTING VALIDATION SCHEMAS
// =============================================

export const expenseSchema = z.object({
  id: z.string().uuid().optional(),
  description: z.string().min(1, 'Description is required').max(200, 'Description too long'),
  category: z.string().min(1, 'Category is required').max(50, 'Category too long'),
  amount: z.number().positive('Amount must be positive'),
  vendorId: z.string().uuid().optional(),
  date: z.string().datetime().optional(),
  status: z.enum(['pending', 'paid', 'cancelled']).default('pending'),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const accountsPayableSchema = z.object({
  id: z.string().uuid().optional(),
  vendorId: z.string().uuid('Valid vendor ID is required'),
  amount: z.number().positive('Amount must be positive'),
  dueDate: z.string().datetime('Valid due date is required'),
  status: z.enum(['outstanding', 'paid', 'overdue']).default('outstanding'),
  description: z.string().min(1, 'Description is required').max(200, 'Description too long'),
  poId: z.string().uuid().optional(),
  invoiceNumber: z.string().optional(),
});

export const accountsReceivableSchema = z.object({
  id: z.string().uuid().optional(),
  customerName: z.string().min(1, 'Customer name is required').max(100, 'Customer name too long'),
  customerPhone: z.string().regex(/^(\+63|0)[9]\d{9}$/, 'Invalid Philippine phone number format').optional(),
  customerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  amount: z.number().positive('Amount must be positive'),
  dueDate: z.string().datetime('Valid due date is required'),
  status: z.enum(['outstanding', 'paid', 'overdue']).default('outstanding'),
  description: z.string().min(1, 'Description is required').max(200, 'Description too long'),
  saleId: z.string().uuid().optional(),
  invoiceNumber: z.string().optional(),
});

// =============================================
// FILTER AND SEARCH SCHEMAS
// =============================================

export const productFilterSchema = z.object({
  category: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  lowStock: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const orderFilterSchema = z.object({
  status: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  customer: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const inventoryFilterSchema = z.object({
  warehouseId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  expiryFrom: z.string().datetime().optional(),
  expiryTo: z.string().datetime().optional(),
  status: z.enum(['active', 'expired', 'damaged']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// =============================================
// FORM DATA SCHEMAS
// =============================================

export const createProductFormSchema = productWithUOMsSchema.extend({
  categoryId: z.string().uuid('Valid category ID is required'),
});

export const createWarehouseFormSchema = warehouseSchema;

export const createSupplierFormSchema = supplierSchema;

export const createPurchaseOrderFormSchema = purchaseOrderSchema.extend({
  expectedDeliveryDate: z.string().datetime().optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

export const createSalesOrderFormSchema = salesOrderSchema;

export const createExpenseFormSchema = expenseSchema;

// =============================================
// UTILITY TYPES
// =============================================

export type ProductInput = z.infer<typeof productSchema>;
export type ProductWithUOMsInput = z.infer<typeof productWithUOMsSchema>;
export type WarehouseInput = z.infer<typeof warehouseSchema>;
export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
export type SalesOrderInput = z.infer<typeof salesOrderSchema>;
export type POSSaleInput = z.infer<typeof posSaleSchema>;
export type AlertInput = z.infer<typeof alertSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type AccountsPayableInput = z.infer<typeof accountsPayableSchema>;
export type AccountsReceivableInput = z.infer<typeof accountsReceivableSchema>;

export type ProductFilterInput = z.infer<typeof productFilterSchema>;
export type OrderFilterInput = z.infer<typeof orderFilterSchema>;
export type InventoryFilterInput = z.infer<typeof inventoryFilterSchema>;

// =============================================
// VALIDATION HELPERS
// =============================================

export const validationHelpers = {
  /**
   * Validate Philippine peso amount
   */
  isValidPesoAmount: (amount: string | number): boolean => {
    const num = typeof amount === 'string' ? parseFloat(amount.replace(/[₱,]/g, '')) : amount;
    return !isNaN(num) && num >= 0 && num <= 999999999.99;
  },

  /**
   * Validate batch number format
   */
  isValidBatchNumber: (batchNumber: string): boolean => {
    const batchRegex = /^BATCH-[A-F0-9]{8}-\d{8}-\d{3}$/;
    return batchRegex.test(batchNumber);
  },

  /**
   * Validate PO number format
   */
  isValidPONumber: (poNumber: string): boolean => {
    const poRegex = /^PO-\d{6}-\d{3}$/;
    return poRegex.test(poNumber);
  },

  /**
   * Validate receipt number format
   */
  isValidReceiptNumber: (receiptNumber: string): boolean => {
    const receiptRegex = /^REC-\d{8}-\d{3}$/;
    return receiptRegex.test(receiptNumber);
  },

  /**
   * Check if date is in the future
   */
  isFutureDate: (dateString: string): boolean => {
    return new Date(dateString) > new Date();
  },

  /**
   * Check if date is within business hours (8 AM - 6 PM)
   */
  isBusinessHours: (date: Date): boolean => {
    const hour = date.getHours();
    return hour >= 8 && hour <= 18;
  },

  /**
   * Validate UOM conversion factors
   */
  validateUOMConversion: (baseUOM: string, alternateUOMs: any[]): boolean => {
    return alternateUOMs.every(uom => {
      return uom.quantity > 0 && uom.conversionFactor > 0 && uom.price > 0;
    });
  },

  /**
   * Validate inventory quantities against warehouse capacity
   */
  validateWarehouseCapacity: (warehouseId: string, additionalQuantity: number): boolean => {
    // This would be implemented with actual warehouse data
    // For now, return true as placeholder
    return true;
  },
};

// =============================================
// COMPOSITE VALIDATION SCHEMAS
// =============================================

export const completeProductSchema = productWithUOMsSchema.extend({
  id: z.string().uuid(),
  categoryId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const completeWarehouseSchema = warehouseSchema.extend({
  id: z.string().uuid(),
  utilizationPercentage: z.number().min(0).max(100),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const completeInventoryItemSchema = inventoryItemSchema.extend({
  id: z.string().uuid(),
  receivedDate: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const completePurchaseOrderSchema = purchaseOrderSchema.extend({
  id: z.string().uuid(),
  poNumber: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const completeSalesOrderSchema = salesOrderSchema.extend({
  id: z.string().uuid(),
  orderNumber: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});