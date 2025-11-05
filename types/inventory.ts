// Enhanced Types for InventoryPro System
// Core data models based on PRD requirements

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  image?: string;
  basePrice: number; // Base price in Philippine Peso
  baseUOM: UnitOfMeasure; // Primary unit (bottle, can, carton)
  alternateUOMs: AlternateUOM[];
  minStockLevel: number;
  shelfLife: number; // Days
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface UnitOfMeasure {
  id: string;
  name: string; // bottle, can, carton
  category: string; // container, package, case
}

export interface AlternateUOM {
  name: string;
  quantity: number; // How many of this UOM equals 1 base UOM
  conversionFactor: number;
  price: number; // Price for this UOM
}

export interface InventoryItem {
  id: string;
  productId: string;
  warehouseId: string;
  batchNumber: string;
  quantity: number;
  unitCost: number; // Philippine Peso
  expiryDate: string; // ISO string
  receivedDate: string; // ISO string
  status: 'active' | 'expired';
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  manager: string;
  capacity: number; // Maximum units
  currentUtilization: number; // Current units
  utilizationPercentage: number; // Calculated percentage
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  paymentTerms: 'Net 15' | 'Net 30' | 'Net 60' | 'COD';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // Auto-generated
  supplierId: string;
  items: PurchaseOrderItem[];
  totalAmount: number; // Philippine Peso
  status: 'draft' | 'pending' | 'ordered' | 'received' | 'cancelled';
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number; // Philippine Peso
  subtotal: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string; // Auto-generated
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  items: SalesOrderItem[];
  warehouseId: string;
  totalAmount: number; // Philippine Peso
  status: 'draft' | 'pending' | 'converted' | 'cancelled';
  salesOrderStatus: 'pending' | 'converted';
  deliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number; // Philippine Peso
  subtotal: number;
}

export interface POSSale {
  id: string;
  receiptNumber: string; // Auto-generated
  items: POSSaleItem[];
  subtotal: number; // Philippine Peso
  tax: number; // Philippine Peso (12% VAT)
  totalAmount: number; // Philippine Peso
  paymentMethod: 'cash' | 'card' | 'check' | 'transfer';
  amountReceived: number; // Philippine Peso
  change: number; // Philippine Peso
  createdAt: string;
  convertedFromOrderId?: string;
}

export interface POSSaleItem {
  productId: string;
  quantity: number;
  uom: string; // Unit of measure used
  unitPrice: number; // Philippine Peso
  subtotal: number; // Philippine Peso
}

// Alert System Types
export interface Alert {
  id: string;
  type: 'low_stock' | 'expiring_soon' | 'expired' | 'warehouse_full';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  entityType: 'product' | 'inventory' | 'warehouse';
  entityId: string;
  status: 'active' | 'dismissed';
  createdAt: string;
  dismissedAt?: string;
}

// Dashboard KPI Types
export interface DashboardKPIs {
  totalProducts: number;
  totalStockUnits: number;
  activeOrders: number;
  inventoryValue: number; // Philippine Peso
  todaysPOSSales: number; // Philippine Peso
  deliveryRate: number; // Percentage
  warehouseUtilization: number; // Percentage
}

// Stock Movement Types
export interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  type: 'purchase' | 'sale' | 'transfer' | 'adjustment' | 'expired';
  batchId?: string;
  quantity: number;
  reason?: string;
  referenceId?: string; // PO ID, Order ID, etc.
  unitCost?: number;
  createdAt: string;
  createdBy: string;
}

// Accounting Types
export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number; // Philippine Peso
  vendorId?: string;
  date: string;
  status: 'pending' | 'paid' | 'cancelled';
  receiptNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface AccountsPayable {
  id: string;
  vendorId: string;
  amount: number; // Philippine Peso
  dueDate: string;
  status: 'outstanding' | 'paid' | 'overdue';
  description: string;
  poId?: string;
  invoiceNumber?: string;
  createdAt: string;
  paidAt?: string;
}

export interface AccountsReceivable {
  id: string;
  customerId?: string;
  customerName: string;
  amount: number; // Philippine Peso
  dueDate: string;
  status: 'outstanding' | 'paid' | 'overdue';
  description: string;
  saleId?: string;
  invoiceNumber?: string;
  createdAt: string;
  paidAt?: string;
}

// Report Types
export interface InventoryReport {
  totalValue: number;
  lowStockItems: number;
  expiredItems: number;
  warehouseUtilization: WarehouseUtilization[];
}

export interface WarehouseUtilization {
  warehouseId: string;
  warehouseName: string;
  capacity: number;
  currentUtilization: number;
  utilizationPercentage: number;
}

export interface SalesReport {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  topProducts: TopProduct[];
  salesByDate: DateSales[];
}

export interface TopProduct {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface DateSales {
  date: string;
  revenue: number;
  transactions: number;
}

// Filter and Search Types
export interface ProductFilter {
  category?: string;
  status?: 'active' | 'inactive';
  lowStock?: boolean;
  search?: string;
}

export interface OrderFilter {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  customer?: string;
}

export interface InventoryFilter {
  warehouseId?: string;
  productId?: string;
  expiryFrom?: string;
  expiryTo?: string;
  status?: 'active' | 'expired';
}

// Utility Types
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FormState<T = any> {
  data: T;
  loading: boolean;
  error: string | null;
  validationErrors: Record<string, string>;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface SortInfo {
  field: string;
  direction: 'asc' | 'desc';
}

export interface TableConfig {
  sort: SortInfo;
  pagination: PaginationInfo;
  filters: Record<string, any>;
}

// Enhanced types needed for inventory screen
export interface BatchSummary {
  productId: string;
  productName: string;
  totalQuantity: number;
  averageCost: number;
  oldestBatchDate: string;
  newestBatchDate: string;
  expiringCount: number;
  expiredCount: number;
  warehouseBreakdown: {
    warehouseId: string;
    warehouseName: string;
    quantity: number;
  }[];
}

export interface StockAnalytics {
  totalStockUnits: number;
  totalInventoryValue: number;
  expiringItemsCount: number;
  expiredItemsCount: number;
  healthyItemsCount: number;
  fifoBatchesCount: number;
  averageBatchAge: number;
  warehouseUtilization: {
    warehouseId: string;
    warehouseName: string;
    utilizationPercentage: number;
  }[];
}

export interface StockAdjustmentOptions {
  type: 'increase' | 'decrease' | 'expired' | 'damaged';
  productId: string;
  warehouseId: string;
  quantity: number;
  reason: string;
  unitCost?: number;
  newBatch?: {
    batchNumber: string;
    expiryDate: string;
  };
}

export interface StockTransferOptions {
  fromWarehouseId: string;
  toWarehouseId: string;
  productId: string;
  quantity: number;
  reason: string;
  transferDate?: string;
}

// Enhanced service response types
export interface ServiceResult<T> {
  data: T;
  success: boolean;
  error?: string;
}

// Enhanced Product interface to include price field
export interface ProductWithPrice extends Product {
  price: number; // Current selling price
}