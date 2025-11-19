import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { BarChart, LineChart, PieChart, Cell, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  MapPin,
  RefreshCw,
  Shield,
  Lock
} from 'lucide-react-native';
import { formatPrice } from '@/utils/currency';
import { dataManagerService } from '@/services/dataManager.service';
import { accountingService } from '@/services/accounting.service';
import { Area, Pie, Bar } from 'recharts';

const { width } = Dimensions.get('window');

type KPICardData = {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  color: string;
  permission?: string;
};

type ChartData = {
  name: string;
  value?: number;
  sales?: number;
  stock?: number;
  transactions?: number;
};

type LowStockItem = {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
  shortage: number;
};

type ExpiringItem = {
  id: string;
  name: string;
  batchNumber: string;
  expiryDate: string;
  daysLeft: number;
  quantity: number;
};

export default function DashboardScreen() {
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpiData, setKpiData] = useState<KPICardData[]>([]);
  const [visibleKPIs, setVisibleKPIs] = useState<KPICardData[]>([]);
  const [salesChartData, setSalesChartData] = useState<ChartData[]>([]);
  const [inventoryChartData, setInventoryChartData] = useState<ChartData[]>([]);
  const [warehouseUtilizationData, setWarehouseUtilizationData] = useState<ChartData[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    // Filter KPIs based on permissions
    const filteredKPIs = kpiData.filter(kpi =>
      !kpi.permission || hasPermission(kpi.permission)
    );
    setVisibleKPIs(filteredKPIs);
  }, [kpiData, hasPermission]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all necessary data using correct method names
      const [
        productsResult,
        inventoryResult,
        warehousesResult,
        salesOrdersResult,
        suppliersResult
      ] = await Promise.all([
        dataManagerService.getProducts(),
        dataManagerService.getInventoryItems(),
        dataManagerService.getWarehouses(),
        dataManagerService.getSalesOrders(),
        dataManagerService.getSuppliers()
      ]);

      const products = productsResult.data || [];
      const inventoryItems = inventoryResult.data || [];
      const warehouses = warehousesResult.data || [];
      const salesOrders = salesOrdersResult.data || [];
      const suppliers = suppliersResult.data || [];

      // Generate mock POS sales data for demo
      const todaysPOSSales = {
        totalTransactions: Math.floor(Math.random() * 50) + 10,
        totalRevenue: Math.floor(Math.random() * 100000) + 50000,
        averageTransactionValue: Math.floor(Math.random() * 5000) + 2000
      };

      const mockPOSSales = [
        {
          id: '1',
          createdAt: new Date().toISOString(),
          totalAmount: todaysPOSSales.totalRevenue
        }
      ];

      // Calculate KPI data
      const totalProducts = products.filter((p: any) => p.active || p.status === 'active').length;
      const totalStock = inventoryItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
      const totalInventoryValue = inventoryItems.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_cost), 0);
      const activeOrders = salesOrders.filter((o: any) => o.status === 'pending' || o.status === 'draft').length;
      const todaySalesTransactions = todaysPOSSales.totalTransactions || 0;
      const todaySalesAmount = todaysPOSSales.totalRevenue || 0;
      const totalCustomers = new Set(salesOrders.map((o: any) => o.customer_email)).size;
      const totalSuppliers = suppliers.filter((s: any) => s.status === 'active').length;

      setKpiData([
        {
          title: 'Total Products',
          value: totalProducts.toString(),
          change: '+2.5%',
          changeType: 'positive',
          icon: <Package size={24} color="#3B82F6" />,
          color: '#3B82F6',
          permission: PERMISSIONS.VIEW_PRODUCTS
        },
        {
          title: 'Total Stock Units',
          value: totalStock.toLocaleString(),
          change: '+156',
          changeType: 'positive',
          icon: <TrendingUp size={24} color="#10B981" />,
          color: '#10B981',
          permission: PERMISSIONS.VIEW_INVENTORY
        },
        {
          title: 'Active Orders',
          value: activeOrders.toString(),
          change: '-12%',
          changeType: 'negative',
          icon: <ShoppingCart size={24} color="#F59E0B" />,
          color: '#F59E0B',
          permission: PERMISSIONS.VIEW_SALES_ORDERS
        },
        {
          title: 'Inventory Value',
          value: formatPrice(totalInventoryValue),
          change: '+8.2%',
          changeType: 'positive',
          icon: <DollarSign size={24} color="#8B5CF6" />,
          color: '#8B5CF6',
          permission: PERMISSIONS.VIEW_ACCOUNTING
        },
        {
          title: "Today's POS Sales",
          value: todaySalesTransactions.toString(),
          change: formatPrice(todaySalesAmount),
          changeType: 'neutral',
          icon: <DollarSign size={24} color="#06B6D4" />,
          color: '#06B6D4',
          permission: PERMISSIONS.VIEW_POS_REPORTS
        },
        {
          title: 'Active Customers',
          value: totalCustomers.toString(),
          change: '+5',
          changeType: 'positive',
          icon: <Users size={24} color="#EF4444" />,
          color: '#EF4444',
          permission: PERMISSIONS.VIEW_SALES_ORDERS
        },
        {
          title: 'Active Suppliers',
          value: totalSuppliers.toString(),
          change: '+1',
          changeType: 'positive',
          icon: <Users size={24} color="#84CC16" />,
          color: '#84CC16',
          permission: PERMISSIONS.VIEW_SUPPLIERS
        },
        {
          title: 'Total Warehouses',
          value: warehouses.length.toString(),
          change: '+0%',
          changeType: 'neutral',
          icon: <MapPin size={24} color="#F97316" />,
          color: '#F97316',
          permission: PERMISSIONS.VIEW_WAREHOUSES
        }
      ]);

      // Generate sales chart data (last 7 days)
      const salesData = generateSalesChartData(mockPOSSales);
      setSalesChartData(salesData);

      // Generate inventory chart data (by category)
      const inventoryData = generateInventoryChartData(products, inventoryItems);
      setInventoryChartData(inventoryData);

      // Generate warehouse utilization data
      const utilizationData = warehouses.map((warehouse: any) => ({
        name: warehouse.name || 'Unknown',
        value: Math.round(((warehouse.current_utilization || 0) / (warehouse.capacity || 100)) * 100),
        capacity: warehouse.capacity || 100,
        current: warehouse.current_utilization || 0
      }));
      setWarehouseUtilizationData(utilizationData);

      // Calculate low stock items
      const lowStock = calculateLowStockItems(products, inventoryItems);
      setLowStockItems(lowStock);

      // Calculate expiring items (within 30 days)
      const expiring = calculateExpiringItems(inventoryItems);
      setExpiringItems(expiring);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateSalesChartData = (sales: any[]) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const salesByDay = days.map((day, index) => {
      // For demo, distribute sales evenly with some variation
      const baseAmount = Math.random() * 50000 + 10000;
      const transactions = Math.floor(Math.random() * 20) + 5;
      
      return {
        name: day,
        sales: Math.round(baseAmount),
        transactions: transactions
      };
    });
    
    return salesByDay;
  };

  const generateInventoryChartData = (products: any[], inventoryItems: any[]) => {
    const categoryMap = new Map();
    
    // Default categories for demo
    const categories = ['Carbonated Drinks', 'Juices', 'Energy Drinks', 'Water', 'Sports Drinks'];
    categories.forEach(cat => {
      categoryMap.set(cat, Math.floor(Math.random() * 1000) + 100);
    });
    
    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value: value as number
    }));
  };

  const calculateLowStockItems = (products: any[], inventoryItems: any[]) => {
    const productStockMap = new Map();
    
    // Calculate total stock per product
    inventoryItems.forEach((item: any) => {
      const current = productStockMap.get(item.product_id) || 0;
      productStockMap.set(item.product_id, current + item.quantity);
    });
    
    return products
      .filter((product: any) => {
        const currentStock = productStockMap.get(product.id) || 0;
        return currentStock < (product.min_stock_level || 10) && currentStock > 0;
      })
      .map((product: any) => ({
        id: product.id,
        name: product.name || 'Unknown Product',
        currentStock: productStockMap.get(product.id) || 0,
        minStock: product.min_stock_level || 10,
        shortage: (product.min_stock_level || 10) - (productStockMap.get(product.id) || 0)
      }))
      .sort((a, b) => b.shortage - a.shortage)
      .slice(0, 5);
  };

  const calculateExpiringItems = (inventoryItems: any[]) => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    return inventoryItems
      .filter((item: any) => {
        if (!item.expiry_date) return false;
        const expiryDate = new Date(item.expiry_date);
        return expiryDate > today && expiryDate <= thirtyDaysFromNow && item.status === 'active';
      })
      .map((item: any) => {
        const expiryDate = new Date(item.expiry_date);
        const today = new Date();
        const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: item.id,
          name: `Product ${item.product_id}`,
          batchNumber: item.batch_number || 'N/A',
          expiryDate: item.expiry_date,
          daysLeft: daysLeft,
          quantity: item.quantity
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading || permissionsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <RefreshCw size={32} color="#3B82F6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PermissionGuard permissions={[PERMISSIONS.VIEW_DASHBOARD]} fallback={
        <View style={styles.accessDenied}>
          <Shield size={48} color="#EF4444" />
          <Text style={styles.accessDeniedText}>Access Denied</Text>
          <Text style={styles.accessDeniedSubtext}>
            You don't have permission to view the dashboard
          </Text>
        </View>
      }>
        <ScrollView
          style={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
          }
        >
          {/* KPI Cards Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
            {visibleKPIs.length === 0 ? (
              <View style={styles.noDataMessage}>
                <Lock size={32} color="#9CA3AF" />
                <Text style={styles.noDataText}>No KPI data available</Text>
                <Text style={styles.noDataSubtext}>Contact administrator for dashboard permissions</Text>
              </View>
            ) : (
              <View style={styles.kpiGrid}>
                {visibleKPIs.map((kpi, index) => (
                  <TouchableOpacity key={index} style={[styles.kpiCard, { borderLeftColor: kpi.color }]}>
                    <View style={styles.kpiHeader}>
                      {kpi.icon}
                      <Text style={styles.kpiTitle}>{kpi.title}</Text>
                    </View>
                    <Text style={styles.kpiValue}>{kpi.value}</Text>
                    <Text style={[
                      styles.kpiChange,
                      kpi.changeType === 'positive' && styles.kpiChangePositive,
                      kpi.changeType === 'negative' && styles.kpiChangeNegative,
                      kpi.changeType === 'neutral' && styles.kpiChangeNeutral
                    ]}>
                      {kpi.change}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Charts Section */}
          <PermissionGuard permissions={[PERMISSIONS.VIEW_ANALYTICS]} fallback={
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Analytics & Trends</Text>
              <View style={styles.noDataMessage}>
                <Lock size={32} color="#9CA3AF" />
                <Text style={styles.noDataText}>Analytics Not Available</Text>
                <Text style={styles.noDataSubtext}>Contact administrator for analytics permissions</Text>
              </View>
            </View>
          }>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Analytics & Trends</Text>
              
              {/* Sales Chart */}
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Weekly Sales Trend (₱)</Text>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(value) => `₱${value.toLocaleString()}`} />
                    <Tooltip
                      formatter={(value: any) => [formatPrice(value), 'Sales']}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </View>

              {/* Inventory Distribution Chart */}
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Stock Distribution by Category</Text>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={inventoryChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      fontSize={10}
                    >
                      {inventoryChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'][index % 6]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [value.toLocaleString(), 'Units']} />
                  </PieChart>
                </ResponsiveContainer>
              </View>

              {/* Warehouse Utilization Chart */}
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Warehouse Utilization (%)</Text>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={warehouseUtilizationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip
                      formatter={(value: any) => [`${value}%`, 'Utilization']}
                      contentStyle={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}
                    />
                    <Bar
                      dataKey="value"
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </View>
            </View>
          </PermissionGuard>

          {/* Alerts Section */}
          <PermissionGuard permissions={[PERMISSIONS.VIEW_DASHBOARD_ALERTS]}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Alerts & Monitoring</Text>
              
              {/* Low Stock Alert */}
              {lowStockItems.length > 0 && (
                <View style={styles.alertCard}>
                  <View style={styles.alertHeader}>
                    <AlertTriangle size={20} color="#F59E0B" />
                    <Text style={styles.alertTitle}>Low Stock Alerts ({lowStockItems.length})</Text>
                  </View>
                  {lowStockItems.map((item) => (
                    <View key={item.id} style={styles.alertItem}>
                      <Text style={styles.alertItemName}>{item.name}</Text>
                      <Text style={styles.alertItemDetail}>
                        Current: {item.currentStock} | Min: {item.minStock} | Shortage: {item.shortage}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Expiring Items Alert */}
              {expiringItems.length > 0 && (
                <View style={styles.alertCard}>
                  <View style={styles.alertHeader}>
                    <Clock size={20} color="#EF4444" />
                    <Text style={styles.alertTitle}>Items Expiring Soon ({expiringItems.length})</Text>
                  </View>
                  {expiringItems.map((item) => (
                    <View key={item.id} style={styles.alertItem}>
                      <Text style={styles.alertItemName}>{item.name}</Text>
                      <Text style={styles.alertItemDetail}>
                        Batch: {item.batchNumber} | Expires in: {item.daysLeft} days | Qty: {item.quantity}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {lowStockItems.length === 0 && expiringItems.length === 0 && (
                <View style={styles.alertCard}>
                  <View style={styles.alertHeader}>
                    <Package size={20} color="#10B981" />
                    <Text style={styles.alertTitle}>All Good!</Text>
                  </View>
                  <Text style={styles.alertItemDetail}>
                    No low stock or expiring items at the moment.
                  </Text>
                </View>
              )}
            </View>
          </PermissionGuard>
        </ScrollView>
      </PermissionGuard>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  kpiCard: {
    width: (width - 52) / 2, // Account for padding and gap
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  kpiChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  kpiChangePositive: {
    color: '#10B981',
  },
  kpiChangeNegative: {
    color: '#EF4444',
  },
  kpiChangeNeutral: {
    color: '#6B7280',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  alertItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  alertItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  alertItemDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  accessDeniedText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedSubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  noDataMessage: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});