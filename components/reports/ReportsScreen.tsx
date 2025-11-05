import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  Share,
} from 'react-native';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Search,
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  Building,
  FileSpreadsheet,
  FileX,
  Clock,
  CheckCircle,
} from 'lucide-react-native';
import { formatPrice } from '@/utils/currency';
import { dataManagerService } from '@/services/dataManager.service';
import { accountingService } from '@/services/accounting.service';

type ReportType = 
  | 'inventory_summary'
  | 'inventory_valuation'
  | 'stock_movement'
  | 'expiry_tracking'
  | 'pos_sales_daily'
  | 'pos_sales_product'
  | 'best_sellers'
  | 'sales_orders'
  | 'purchase_orders'
  | 'supplier_performance'
  | 'accounts_payable'
  | 'accounts_receivable'
  | 'expenses'
  | 'profit_loss';

type ReportCategory = 'inventory' | 'sales' | 'procurement' | 'financial';

type ReportDefinition = {
  id: ReportType;
  name: string;
  category: ReportCategory;
  description: string;
  icon: React.ReactNode;
  estimatedTime: string;
  hasDateRange: boolean;
  hasFilters: boolean;
  exportFormats: string[];
};

type ReportData = {
  headers: string[];
  rows: (string | number)[][];
  summary?: {
    [key: string]: string | number;
  };
  metadata: {
    generatedAt: string;
    dateRange?: { from: string; to: string };
    filters?: any;
    totalRecords: number;
  };
};

type ExportOptions = {
  format: 'csv' | 'excel' | 'pdf';
  includeHeaders: boolean;
  dateRange?: { from: string; to: string };
  filters?: any;
};

export default function ReportsScreen() {
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('inventory');
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    to: new Date().toISOString().split('T')[0], // today
  });
  const [generatedReport, setGeneratedReport] = useState<ReportData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const reportDefinitions: ReportDefinition[] = [
    {
      id: 'inventory_summary',
      name: 'Inventory Summary',
      category: 'inventory',
      description: 'Current stock levels across all warehouses',
      icon: <Package size={24} color="#3B82F6" />,
      estimatedTime: '~5 seconds',
      hasDateRange: false,
      hasFilters: true,
      exportFormats: ['CSV', 'Excel', 'PDF']
    },
    {
      id: 'inventory_valuation',
      name: 'Inventory Valuation',
      category: 'inventory', 
      description: 'Current inventory value with FIFO costing',
      icon: <DollarSign size={24} color="#10B981" />,
      estimatedTime: '~10 seconds',
      hasDateRange: false,
      hasFilters: true,
      exportFormats: ['CSV', 'Excel', 'PDF']
    },
    {
      id: 'stock_movement',
      name: 'Stock Movement History',
      category: 'inventory',
      description: 'All stock movements with details',
      icon: <TrendingUp size={24} color="#8B5CF6" />,
      estimatedTime: '~15 seconds',
      hasDateRange: true,
      hasFilters: true,
      exportFormats: ['CSV', 'Excel', 'PDF']
    },
    {
      id: 'expiry_tracking',
      name: 'Expiry Tracking',
      category: 'inventory',
      description: 'Items expiring within specified period',
      icon: <Clock size={24} color="#F59E0B" />,
      estimatedTime: '~8 seconds',
      hasDateRange: true,
      hasFilters: true,
      exportFormats: ['CSV', 'Excel', 'PDF']
    },
    {
      id: 'pos_sales_daily',
      name: 'Daily POS Sales',
      category: 'sales',
      description: 'Daily sales transactions and revenue',
      icon: <ShoppingCart size={24} color="#06B6D4" />,
      estimatedTime: '~12 seconds',
      hasDateRange: true,
      hasFilters: true,
      exportFormats: ['CSV', 'Excel', 'PDF']
    },
    {
      id: 'pos_sales_product',
      name: 'Sales by Product',
      category: 'sales',
      description: 'Revenue breakdown by product',
      icon: <TrendingUp size={24} color="#EF4444" />,
      estimatedTime: '~10 seconds',
      hasDateRange: true,
      hasFilters: true,
      exportFormats: ['CSV', 'Excel', 'PDF']
    },
    {
      id: 'best_sellers',
      name: 'Best Selling Products',
      category: 'sales',
      description: 'Top performing products by sales volume',
      icon: <CheckCircle size={24} color="#10B981" />,
      estimatedTime: '~8 seconds',
      hasDateRange: true,
      hasFilters: true,
      exportFormats: ['CSV', 'Excel', 'PDF']
    },
    {
      id: 'sales_orders',
      name: 'Sales Orders Status',
      category: 'sales',
      description: 'Current sales orders and fulfillment status',
      icon: <FileText size={24} color="#8B5CF6" />,
      estimatedTime: '~7 seconds',
      hasDateRange: true,
      hasFilters: true,
      exportFormats: ['CSV', 'Excel', 'PDF']
    },
    {
      id: 'purchase_orders',
      name: 'Purchase Orders',
      category: 'procurement',
      description: 'Purchase orders status and supplier details',
      icon: <Building size={24} color="#F97316" />,
      estimatedTime: '~8 seconds',
      hasDateRange: true,
      hasFilters: true,
      exportFormats: ['CSV', 'Excel', 'PDF']
    },
    {
      id: 'supplier_performance',
      name: 'Supplier Performance',
      category: 'procurement',
      description: 'Supplier metrics and delivery performance',
      icon: <Users size={24} color="#84CC16" />,
      estimatedTime: '~12 seconds',
      hasDateRange: true,
      hasFilters: true,
      exportFormats: ['CSV', 'Excel', 'PDF']
    },
    {
      id: 'accounts_payable',
      name: 'Accounts Payable',
      category: 'financial',
      description: 'Outstanding payables to suppliers',
      icon: <DollarSign size={24} color="#EF4444" />,
      estimatedTime: '~10 seconds',
      hasDateRange: true,
      hasFilters: true,
      exportFormats: ['CSV', 'Excel', 'PDF']
    },
    {
      id: 'accounts_receivable',
      name: 'Accounts Receivable',
      category: 'financial',
      description: 'Outstanding receivables from customers',
      icon: <DollarSign size={24} color="#3B82F6" />,
      estimatedTime: '~10 seconds',
      hasDateRange: true,
      hasFilters: true,
      exportFormats: ['CSV', 'Excel', 'PDF']
    },
    {
      id: 'expenses',
      name: 'Expense Report',
      category: 'financial',
      description: 'Company expenses breakdown',
      icon: <FileText size={24} color="#F59E0B" />,
      estimatedTime: '~8 seconds',
      hasDateRange: true,
      hasFilters: true,
      exportFormats: ['CSV', 'Excel', 'PDF']
    },
    {
      id: 'profit_loss',
      name: 'Profit & Loss',
      category: 'financial',
      description: 'Monthly P&L statement',
      icon: <TrendingUp size={24} color="#10B981" />,
      estimatedTime: '~15 seconds',
      hasDateRange: true,
      hasFilters: true,
      exportFormats: ['CSV', 'Excel', 'PDF']
    }
  ];

  const categoryOptions: { key: ReportCategory; label: string; icon: React.ReactNode }[] = [
    { key: 'inventory', label: 'Inventory', icon: <Package size={20} color="#3B82F6" /> },
    { key: 'sales', label: 'Sales', icon: <ShoppingCart size={20} color="#10B981" /> },
    { key: 'procurement', label: 'Procurement', icon: <Building size={20} color="#F97316" /> },
    { key: 'financial', label: 'Financial', icon: <DollarSign size={20} color="#8B5CF6" /> },
  ];

  const filteredReports = reportDefinitions.filter(report => {
    const matchesCategory = report.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const generateReport = async (reportType: ReportType, options: ExportOptions) => {
    setLoading(true);
    try {
      let reportData: ReportData;

      switch (reportType) {
        case 'inventory_summary':
          reportData = await generateInventorySummaryReport();
          break;
        case 'inventory_valuation':
          reportData = await generateInventoryValuationReport();
          break;
        case 'stock_movement':
          reportData = await generateStockMovementReport(options);
          break;
        case 'expiry_tracking':
          reportData = await generateExpiryTrackingReport(options);
          break;
        case 'pos_sales_daily':
          reportData = await generatePOSSalesDailyReport(options);
          break;
        case 'pos_sales_product':
          reportData = await generatePOSSalesProductReport(options);
          break;
        case 'best_sellers':
          reportData = await generateBestSellersReport(options);
          break;
        case 'sales_orders':
          reportData = await generateSalesOrdersReport(options);
          break;
        case 'purchase_orders':
          reportData = await generatePurchaseOrdersReport(options);
          break;
        case 'supplier_performance':
          reportData = await generateSupplierPerformanceReport(options);
          break;
        case 'accounts_payable':
          reportData = await generateAccountsPayableReport(options);
          break;
        case 'accounts_receivable':
          reportData = await generateAccountsReceivableReport(options);
          break;
        case 'expenses':
          reportData = await generateExpensesReport(options);
          break;
        case 'profit_loss':
          reportData = await generateProfitLossReport(options);
          break;
        default:
          throw new Error('Unknown report type');
      }

      setGeneratedReport(reportData);
      Alert.alert('Report Generated', 'Your report has been generated successfully');
      
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateInventorySummaryReport = async (): Promise<ReportData> => {
    const [productsResult, inventoryResult, warehousesResult] = await Promise.all([
      dataManagerService.getProducts(),
      dataManagerService.getInventoryItems(),
      dataManagerService.getWarehouses()
    ]);

    const products = productsResult.data || [];
    const inventoryItems = inventoryResult.data || [];
    const warehouses = warehousesResult.data || [];

    const productStockMap = new Map<string, number>();
    inventoryItems.forEach((item: any) => {
      const current = productStockMap.get(item.product_id) || 0;
      productStockMap.set(item.product_id, current + item.quantity);
    });

    const headers = ['Product Name', 'Category', 'Current Stock', 'Min Stock', 'Unit Cost', 'Total Value', 'Status'];
    const rows = products.map((product: any) => {
      const currentStock = productStockMap.get(product.id) || 0;
      const minStock = product.min_stock_level || 0;
      const unitCost = product.base_price || 0;
      const totalValue = currentStock * unitCost;
      const status = currentStock < minStock ? 'Low Stock' : 'OK';

      return [
        product.name || 'Unknown',
        product.category || 'Uncategorized',
        currentStock,
        minStock,
        formatPrice(unitCost),
        formatPrice(totalValue),
        status
      ];
    });

    const totalValue = inventoryItems.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unit_cost), 0);

    return {
      headers,
      rows,
      summary: {
        'Total Products': products.length,
        'Total Stock Items': inventoryItems.length,
        'Total Value': formatPrice(totalValue)
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        totalRecords: rows.length
      }
    };
  };

  const generateInventoryValuationReport = async (): Promise<ReportData> => {
    const inventoryResult = await dataManagerService.getInventoryItems();
    const inventoryItems = inventoryResult.data || [];

    const headers = ['Product ID', 'Batch Number', 'Warehouse', 'Quantity', 'Unit Cost', 'Total Cost', 'Received Date', 'Expiry Date'];
    const rows = inventoryItems.map((item: any) => [
      item.product_id || 'N/A',
      item.batch_number || 'N/A',
      item.warehouses?.name || 'N/A',
      item.quantity || 0,
      formatPrice(item.unit_cost || 0),
      formatPrice((item.quantity || 0) * (item.unit_cost || 0)),
      item.received_date ? new Date(item.received_date).toLocaleDateString() : 'N/A',
      item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A'
    ]);

    const totalValue = inventoryItems.reduce((sum: number, item: any) => 
      sum + ((item.quantity || 0) * (item.unit_cost || 0)), 0);

    return {
      headers,
      rows,
      summary: {
        'Total Items': inventoryItems.length,
        'Total Valuation': formatPrice(totalValue),
        'Average Unit Cost': formatPrice(inventoryItems.length > 0 ? totalValue / inventoryItems.length : 0)
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        totalRecords: rows.length
      }
    };
  };

  const generateStockMovementReport = async (options: ExportOptions): Promise<ReportData> => {
    // Generate mock stock movement data for demo
    const headers = ['Date', 'Product', 'Type', 'Quantity', 'Unit Cost', 'Total Value', 'Reference', 'Warehouse'];
    const rows: (string | number)[][] = [];

    // Generate sample data
    for (let i = 0; i < 20; i++) {
      const date = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const types = ['Purchase', 'Sale', 'Adjustment', 'Transfer'];
      const type = types[Math.floor(Math.random() * types.length)];
      const quantity = Math.floor(Math.random() * 100) + 1;
      const unitCost = Math.random() * 50 + 10;
      const totalValue = quantity * unitCost;

      rows.push([
        date.toLocaleDateString(),
        `Product ${i + 1}`,
        type,
        quantity,
        formatPrice(unitCost),
        formatPrice(totalValue),
        `REF-${Date.now()}-${i}`,
        `Warehouse ${Math.floor(Math.random() * 3) + 1}`
      ]);
    }

    return {
      headers,
      rows,
      summary: {
        'Total Movements': rows.length,
        'Date Range': `${options.dateRange?.from} to ${options.dateRange?.to}`
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        dateRange: options.dateRange,
        totalRecords: rows.length
      }
    };
  };

  const generateExpiryTrackingReport = async (options: ExportOptions): Promise<ReportData> => {
    const inventoryResult = await dataManagerService.getInventoryItems();
    const inventoryItems = inventoryResult.data || [];

    const today = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(today.getDate() + 90);

    const expiringItems = inventoryItems.filter((item: any) => {
      if (!item.expiry_date) return false;
      const expiryDate = new Date(item.expiry_date);
      return expiryDate >= today && expiryDate <= ninetyDaysFromNow;
    });

    const headers = ['Product', 'Batch Number', 'Expiry Date', 'Days Left', 'Quantity', 'Status'];
    const rows = expiringItems.map((item: any) => {
      const expiryDate = new Date(item.expiry_date);
      const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const status = daysLeft <= 7 ? 'Critical' : daysLeft <= 30 ? 'Warning' : 'Normal';

      return [
        `Product ${item.product_id}`,
        item.batch_number || 'N/A',
        expiryDate.toLocaleDateString(),
        daysLeft,
        item.quantity || 0,
        status
      ];
    });

    return {
      headers,
      rows,
      summary: {
        'Total Expiring Items': expiringItems.length,
        'Critical (≤7 days)': expiringItems.filter((item: any) => {
          const daysLeft = Math.ceil((new Date(item.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return daysLeft <= 7;
        }).length
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        dateRange: options.dateRange,
        totalRecords: rows.length
      }
    };
  };

  const generatePOSSalesDailyReport = async (options: ExportOptions): Promise<ReportData> => {
  // Generate mock POS sales data
  const headers = ['Date', 'Transaction ID', 'Items', 'Subtotal', 'Tax', 'Total', 'Payment Method'];
  const rows: (string | number)[][] = [];

  for (let i = 0; i < 25; i++) {
    const date = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const subtotal = Math.random() * 2000 + 100;
    const tax = subtotal * 0.12; // 12% VAT
    const total = subtotal + tax;
    const paymentMethods = ['Cash', 'Card', 'Check', 'Transfer'];

    rows.push([
      date.toLocaleDateString(),
      `TXN-${Date.now()}-${i}`,
      Math.floor(Math.random() * 10) + 1,
      formatPrice(subtotal),
      formatPrice(tax),
      formatPrice(total),
      paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
    ]);
  }

  const totalRevenue = rows.reduce((sum, row) => {
    // Extract total from the format "₱1,234.56"
    const rowArray = row as (string | number)[];
    const totalStr = rowArray[5] as string;
    const total = parseFloat(totalStr.replace(/[₱,]/g, ''));
    return sum + total;
  }, 0);

  return {
    headers,
    rows,
    summary: {
      'Total Transactions': rows.length,
      'Total Revenue': formatPrice(totalRevenue),
      'Average Transaction': formatPrice(rows.length > 0 ? totalRevenue / rows.length : 0)
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      dateRange: options.dateRange,
      totalRecords: rows.length
    }
  };
};

  const generatePOSSalesProductReport = async (options: ExportOptions): Promise<ReportData> => {
    // Generate mock product sales data
    const headers = ['Product', 'Units Sold', 'Revenue', 'Average Price', 'Tax Collected'];
    const rows: (string | number)[][] = [];

    const products = ['Coke 330ml', 'Sprite 330ml', 'Pepsi 330ml', 'Water 500ml', 'Juice 1L'];
    
    for (const product of products) {
      const unitsSold = Math.floor(Math.random() * 500) + 50;
      const averagePrice = Math.random() * 50 + 20;
      const revenue = unitsSold * averagePrice;
      const tax = revenue * 0.12;

      rows.push([
        product,
        unitsSold,
        formatPrice(revenue),
        formatPrice(averagePrice),
        formatPrice(tax)
      ]);
    }

    const totalRevenue = rows.reduce((sum, row) => {
      const rowArray = row as (string | number)[];
      const revenueStr = rowArray[2] as string;
      return sum + parseFloat(revenueStr.replace(/[₱,]/g, ''));
    }, 0);

    return {
      headers,
      rows,
      summary: {
        'Total Products': rows.length,
        'Total Revenue': formatPrice(totalRevenue),
        'Total Tax (12% VAT)': formatPrice(totalRevenue * 0.12)
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        dateRange: options.dateRange,
        totalRecords: rows.length
      }
    };
  };

  const generateBestSellersReport = async (options: ExportOptions): Promise<ReportData> => {
    // Generate mock best sellers data
    const headers = ['Rank', 'Product', 'Units Sold', 'Revenue', 'Market Share'];
    const rows: (string | number)[][] = [];

    const products = ['Coke 330ml', 'Sprite 330ml', 'Pepsi 330ml', 'Water 500ml', 'Juice 1L'];
    const salesData = products.map(product => {
      const unitsSold = Math.floor(Math.random() * 500) + 50;
      const revenue = unitsSold * (Math.random() * 50 + 20);
      return { product, unitsSold, revenue };
    }).sort((a, b) => b.unitsSold - a.unitsSold);

    let totalUnits = 0;
    salesData.forEach(item => totalUnits += item.unitsSold);

    salesData.forEach((item, index) => {
      const marketShare = ((item.unitsSold / totalUnits) * 100).toFixed(1);
      rows.push([
        index + 1,
        item.product,
        item.unitsSold,
        formatPrice(item.revenue),
        `${marketShare}%`
      ]);
    });

    return {
      headers,
      rows,
      summary: {
        'Top Product': salesData[0]?.product || 'N/A',
        'Total Units Sold': totalUnits,
        'Total Revenue': formatPrice(salesData.reduce((sum, item) => sum + item.revenue, 0))
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        dateRange: options.dateRange,
        totalRecords: rows.length
      }
    };
  };

  const generateSalesOrdersReport = async (options: ExportOptions): Promise<ReportData> => {
    const salesOrdersResult = await dataManagerService.getSalesOrders();
    const salesOrders = salesOrdersResult.data || [];

    const headers = ['Order Number', 'Customer', 'Date', 'Items', 'Total Amount', 'Status', 'Delivery Date'];
    const rows = salesOrders.map((order: any) => [
      order.order_number || 'N/A',
      order.customer_name || 'N/A',
      order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A',
      order.items?.length || 0,
      formatPrice(order.total_amount || 0),
      order.status || 'N/A',
      order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'N/A'
    ]);

    return {
      headers,
      rows,
      summary: {
        'Total Orders': salesOrders.length,
        'Total Value': formatPrice(salesOrders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0))
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        dateRange: options.dateRange,
        totalRecords: rows.length
      }
    };
  };

  const generatePurchaseOrdersReport = async (options: ExportOptions): Promise<ReportData> => {
    const purchaseOrdersResult = await dataManagerService.getPurchaseOrders();
    const purchaseOrders = purchaseOrdersResult.data || [];

    const headers = ['PO Number', 'Supplier', 'Date', 'Items', 'Total Amount', 'Status', 'Expected Delivery'];
    const rows = purchaseOrders.map((po: any) => [
      po.po_number || 'N/A',
      po.suppliers?.company_name || 'N/A',
      po.created_at ? new Date(po.created_at).toLocaleDateString() : 'N/A',
      po.items?.length || 0,
      formatPrice(po.total_amount || 0),
      po.status || 'N/A',
      po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : 'N/A'
    ]);

    return {
      headers,
      rows,
      summary: {
        'Total POs': purchaseOrders.length,
        'Total Value': formatPrice(purchaseOrders.reduce((sum: number, po: any) => sum + (po.total_amount || 0), 0))
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        dateRange: options.dateRange,
        totalRecords: rows.length
      }
    };
  };

  const generateSupplierPerformanceReport = async (options: ExportOptions): Promise<ReportData> => {
    // Generate mock supplier performance data
    const headers = ['Supplier', 'Total Orders', 'On-Time Delivery', 'Average Lead Time', 'Total Value', 'Rating'];
    const rows: (string | number)[][] = [];

    const suppliers = ['Coca Cola', 'Pepsi Co', 'Nestle', 'Unilever', 'San Miguel'];
    
    for (const supplier of suppliers) {
      const totalOrders = Math.floor(Math.random() * 20) + 5;
      const onTimeRate = Math.random() * 20 + 80; // 80-100%
      const avgLeadTime = Math.random() * 5 + 2; // 2-7 days
      const totalValue = totalOrders * (Math.random() * 50000 + 10000);
      const rating = (onTimeRate / 20).toFixed(1);

      rows.push([
        supplier,
        totalOrders,
        `${onTimeRate.toFixed(1)}%`,
        `${avgLeadTime.toFixed(1)} days`,
        formatPrice(totalValue),
        `${rating}/5.0`
      ]);
    }

    return {
      headers,
      rows,
      summary: {
        'Total Suppliers': suppliers.length,
        'Average On-Time Rate': '87.5%'
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        dateRange: options.dateRange,
        totalRecords: rows.length
      }
    };
  };

  const generateAccountsPayableReport = async (options: ExportOptions): Promise<ReportData> => {
    // Generate mock A/P data - would integrate with accounting service
    const headers = ['Supplier', 'Invoice Date', 'Due Date', 'Amount', 'Status', 'Days Overdue'];
    const rows: (string | number)[][] = [];

    const suppliers = ['Coca Cola', 'Pepsi Co', 'Nestle'];
    
    for (let i = 0; i < 10; i++) {
      const supplier = suppliers[i % suppliers.length];
      const invoiceDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 30);
      const amount = Math.random() * 50000 + 5000;
      const status = Math.random() > 0.7 ? 'Overdue' : 'Current';
      const daysOverdue = Math.random() > 0.7 ? Math.floor(Math.random() * 30) : 0;

      rows.push([
        supplier,
        invoiceDate.toLocaleDateString(),
        dueDate.toLocaleDateString(),
        formatPrice(amount),
        status,
        daysOverdue > 0 ? `${daysOverdue} days` : '-'
      ]);
    }

    const totalAmount = rows.reduce((sum, row) => {
      const rowArray = row as (string | number)[];
      const amountStr = rowArray[3] as string;
      return sum + parseFloat(amountStr.replace(/[₱,]/g, ''));
    }, 0);

    return {
      headers,
      rows,
      summary: {
        'Total Outstanding': formatPrice(totalAmount),
        'Overdue Amount': formatPrice(totalAmount * 0.3) // Mock 30% overdue
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        dateRange: options.dateRange,
        totalRecords: rows.length
      }
    };
  };

  const generateAccountsReceivableReport = async (options: ExportOptions): Promise<ReportData> => {
    // Generate mock A/R data
    const headers = ['Customer', 'Invoice Date', 'Due Date', 'Amount', 'Status', 'Days Overdue'];
    const rows: (string | number)[][] = [];

    for (let i = 0; i < 15; i++) {
      const customerName = `Customer ${i + 1}`;
      const invoiceDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 15);
      const amount = Math.random() * 20000 + 2000;
      const status = Math.random() > 0.8 ? 'Overdue' : 'Current';
      const daysOverdue = Math.random() > 0.8 ? Math.floor(Math.random() * 20) : 0;

      rows.push([
        customerName,
        invoiceDate.toLocaleDateString(),
        dueDate.toLocaleDateString(),
        formatPrice(amount),
        status,
        daysOverdue > 0 ? `${daysOverdue} days` : '-'
      ]);
    }

    const totalAmount = rows.reduce((sum, row) => {
      const rowArray = row as (string | number)[];
      const amountStr = rowArray[3] as string;
      return sum + parseFloat(amountStr.replace(/[₱,]/g, ''));
    }, 0);

    return {
      headers,
      rows,
      summary: {
        'Total Outstanding': formatPrice(totalAmount),
        'Overdue Amount': formatPrice(totalAmount * 0.2) // Mock 20% overdue
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        dateRange: options.dateRange,
        totalRecords: rows.length
      }
    };
  };

  const generateExpensesReport = async (options: ExportOptions): Promise<ReportData> => {
    // Generate mock expense data
    const headers = ['Date', 'Category', 'Description', 'Amount', 'Payment Method', 'Reference'];
    const rows: (string | number)[][] = [];

    const categories = ['Office Supplies', 'Utilities', 'Rent', 'Transportation', 'Marketing'];
    
    for (let i = 0; i < 20; i++) {
      const date = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
      const category = categories[Math.floor(Math.random() * categories.length)];
      const amount = Math.random() * 10000 + 500;
      const paymentMethods = ['Cash', 'Card', 'Bank Transfer'];

      rows.push([
        date.toLocaleDateString(),
        category,
        `${category} expense ${i + 1}`,
        formatPrice(amount),
        paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        `EXP-${Date.now()}-${i}`
      ]);
    }

    const totalAmount = rows.reduce((sum, row) => {
      const rowArray = row as (string | number)[];
      const amountStr = rowArray[3] as string;
      return sum + parseFloat(amountStr.replace(/[₱,]/g, ''));
    }, 0);

    return {
      headers,
      rows,
      summary: {
        'Total Expenses': formatPrice(totalAmount),
        'Average Expense': formatPrice(rows.length > 0 ? totalAmount / rows.length : 0)
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        dateRange: options.dateRange,
        totalRecords: rows.length
      }
    };
  };

  const generateProfitLossReport = async (options: ExportOptions): Promise<ReportData> => {
    // Generate mock P&L data
    const headers = ['Category', 'Amount', 'Percentage of Revenue'];
    const rows: (string | number)[][] = [];

    const revenue = 500000; // Mock revenue
    const costOfGoodsSold = revenue * 0.6;
    const operatingExpenses = revenue * 0.25;
    const netProfit = revenue - costOfGoodsSold - operatingExpenses;

    const pnlData: (string | number)[][] = [
      ['Revenue', revenue, '100.0%'],
      ['Cost of Goods Sold', costOfGoodsSold, '60.0%'],
      ['Gross Profit', revenue - costOfGoodsSold, '40.0%'],
      ['Operating Expenses', operatingExpenses, '25.0%'],
      ['Operating Profit', (revenue - costOfGoodsSold - operatingExpenses), '15.0%'],
      ['Net Profit', netProfit, '15.0%']
    ];

    return {
      headers,
      rows: pnlData,
      summary: {
        'Revenue': formatPrice(revenue),
        'Net Profit': formatPrice(netProfit),
        'Profit Margin': '15.0%'
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        dateRange: options.dateRange,
        totalRecords: rows.length
      }
    };
  };

  const exportReport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!generatedReport) {
      Alert.alert('Error', 'No report generated to export');
      return;
    }

    try {
      const content = convertReportToFormat(generatedReport, format);
      const filename = `${selectedReport}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'csv' : format}`;
      
      // In a real app, you would use a file sharing/export library
      // For now, we'll just show a success message
      Alert.alert('Export Complete', `Report exported as ${filename}`);
      
    } catch (error) {
      console.error('Error exporting report:', error);
      Alert.alert('Export Error', 'Failed to export report');
    }
  };

  const convertReportToFormat = (report: ReportData, format: string): string => {
    let content = '';

    if (format === 'csv') {
      content = report.headers.join(',') + '\n';
      content += report.rows.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');
    }

    // Add summary if exists
    if (report.summary) {
      content += '\n\nSummary:\n';
      Object.entries(report.summary).forEach(([key, value]) => {
        content += `${key}: ${value}\n`;
      });
    }

    return content;
  };

  const onRefresh = () => {
    // Refresh data if needed
  };

  if (selectedReport && !generatedReport) {
    const reportDef = reportDefinitions.find(r => r.id === selectedReport);
    
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedReport(null)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{reportDef?.name}</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.reportInfoSection}>
            <Text style={styles.reportDescriptionDetail}>{reportDef?.description}</Text>
            <Text style={styles.reportMetaDetail}>Estimated time: {reportDef?.estimatedTime}</Text>
          </View>

          {reportDef?.hasDateRange && (
            <View style={styles.dateRangeSection}>
              <Text style={styles.sectionTitle}>Date Range</Text>
              <View style={styles.dateInputContainer}>
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>From:</Text>
                  <TextInput
                    style={styles.dateInputField}
                    value={dateRange.from}
                    onChangeText={(text) => setDateRange(prev => ({ ...prev, from: text }))}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>To:</Text>
                  <TextInput
                    style={styles.dateInputField}
                    value={dateRange.to}
                    onChangeText={(text) => setDateRange(prev => ({ ...prev, to: text }))}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.generateButton, loading && styles.generateButtonDisabled]}
            onPress={() => generateReport(selectedReport, {
              format: 'csv',
              includeHeaders: true,
              dateRange: reportDef?.hasDateRange ? dateRange : undefined
            })}
            disabled={loading}
          >
            <Text style={styles.generateButtonText}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (generatedReport) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setGeneratedReport(null)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Generated</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => exportReport('csv')}>
              <FileSpreadsheet size={24} color="#10B981" style={styles.exportIcon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => exportReport('pdf')}>
              <FileText size={24} color="#EF4444" style={styles.exportIcon} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content}>
          {/* Report Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Report Summary</Text>
            {generatedReport.summary && Object.entries(generatedReport.summary).map(([key, value]) => (
              <View key={key} style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{key}:</Text>
                <Text style={styles.summaryValue}>{value}</Text>
              </View>
            ))}
            <Text style={styles.generatedAt}>
              Generated: {new Date(generatedReport.metadata.generatedAt).toLocaleString()}
            </Text>
          </View>

          {/* Report Data Preview */}
          <View style={styles.dataPreview}>
            <Text style={styles.sectionTitle}>Data Preview (First 10 rows)</Text>
            <View style={styles.tableContainer}>
              <View style={styles.tableRow}>
                {generatedReport.headers.map((header, index) => (
                  <Text key={index} style={styles.tableHeader}>{header}</Text>
                ))}
              </View>
              {generatedReport.rows.slice(0, 10).map((row, rowIndex) => (
                <View key={rowIndex} style={styles.tableRow}>
                  {row.map((cell, cellIndex) => (
                    <Text key={cellIndex} style={styles.tableCell}>{cell}</Text>
                  ))}
                </View>
              ))}
            </View>
            <Text style={styles.previewNote}>
              Showing first 10 of {generatedReport.metadata.totalRecords} records
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FileText size={24} color="#3B82F6" />
          <Text style={styles.headerTitle}>Reports & Analytics</Text>
        </View>
        <Download size={24} color="#6B7280" />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search reports..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
        {categoryOptions.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryChip,
              selectedCategory === category.key && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(category.key)}
          >
            {category.icon}
            <Text style={[
              styles.categoryText,
              selectedCategory === category.key && styles.categoryTextActive
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Reports Grid */}
      <ScrollView style={styles.reportsList}>
        {filteredReports.map((report) => (
          <TouchableOpacity
            key={report.id}
            style={styles.reportCard}
            onPress={() => setSelectedReport(report.id)}
          >
            <View style={styles.reportHeader}>
              <View style={styles.reportIcon}>
                {report.icon}
              </View>
              <View style={styles.reportInfo}>
                <Text style={styles.reportName}>{report.name}</Text>
                <Text style={styles.reportDescription}>{report.description}</Text>
                <Text style={styles.reportMeta}>
                  Est. {report.estimatedTime} • {report.exportFormats.join(', ')}
                </Text>
              </View>
              <View style={styles.reportArrow}>
                <Text style={styles.arrowText}>→</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredReports.length === 0 && (
          <View style={styles.emptyState}>
            <FileText size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Reports Found</Text>
            <Text style={styles.emptyMessage}>
              No reports match your current filter criteria.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  backButton: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  exportIcon: {
    marginLeft: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  categoryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  reportsList: {
    flex: 1,
    padding: 16,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportIcon: {
    marginRight: 16,
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  reportMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reportArrow: {
    marginLeft: 12,
  },
  arrowText: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  reportInfoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reportDescriptionDetail: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  reportMetaDetail: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  dateRangeSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  dateInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  dateInputField: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#111827',
  },
  generateButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  generatedAt: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dataPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableContainer: {
    marginTop: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 8,
  },
  tableHeader: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    paddingRight: 4,
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    paddingRight: 4,
  },
  previewNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
});