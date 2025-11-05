import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  TrendingDown,
  Filter,
  Search,
  Settings,
  Trash2,
  Eye,
} from 'lucide-react-native';
import { formatPrice } from '@/utils/currency';
import { dataManagerService } from '@/services/dataManager.service';

type AlertItem = {
  id: string;
  type: 'low_stock' | 'expiring' | 'expired' | 'overdue' | 'warehouse_capacity';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'dismissed' | 'resolved';
  createdAt: string;
  productName?: string;
  currentValue?: number;
  thresholdValue?: number;
  actions?: AlertAction[];
  metadata?: any;
};

type AlertAction = {
  id: string;
  label: string;
  type: 'button' | 'link';
  action: () => void;
};

type AlertSettings = {
  notifications: {
    low_stock: boolean;
    expiring: boolean;
    expired: boolean;
    overdue: boolean;
    warehouse_capacity: boolean;
  };
  thresholds: {
    low_stock_minimum: number;
    expiring_days: number;
    warehouse_capacity_warning: number;
    warehouse_capacity_critical: number;
  };
  auto_dismiss: {
    enabled: boolean;
    days: number;
  };
};

export default function AlertManagementScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<AlertItem[]>([]);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    notifications: {
      low_stock: true,
      expiring: true,
      expired: true,
      overdue: true,
      warehouse_capacity: true,
    },
    thresholds: {
      low_stock_minimum: 10,
      expiring_days: 30,
      warehouse_capacity_warning: 75,
      warehouse_capacity_critical: 90,
    },
    auto_dismiss: {
      enabled: false,
      days: 7,
    },
  });
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadAlerts();
    loadSettings();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, selectedFilter, searchQuery]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      
      // Generate comprehensive alert data
      const alertData = await generateAlertData();
      setAlerts(alertData);
      
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAlertData = async (): Promise<AlertItem[]> => {
    try {
      // Get data from services
      const [
        productsResult,
        inventoryResult,
        warehousesResult
      ] = await Promise.all([
        dataManagerService.getProducts(),
        dataManagerService.getInventoryItems(),
        dataManagerService.getWarehouses()
      ]);

      const products = productsResult.data || [];
      const inventoryItems = inventoryResult.data || [];
      const warehouses = warehousesResult.data || [];

      const alertData: AlertItem[] = [];

      // Generate low stock alerts
      const productStockMap = new Map<string, number>();
      inventoryItems.forEach((item: any) => {
        const current = productStockMap.get(item.product_id) || 0;
        productStockMap.set(item.product_id, current + item.quantity);
      });

      products.forEach((product: any) => {
        const currentStock = productStockMap.get(product.id) || 0;
        const minStock = product.min_stock_level || alertSettings.thresholds.low_stock_minimum;
        
        if (currentStock < minStock && currentStock > 0) {
          alertData.push({
            id: `low_stock_${product.id}`,
            type: 'low_stock',
            title: 'Low Stock Alert',
            message: `${product.name} is running low with only ${currentStock} units remaining`,
            severity: currentStock < (minStock * 0.5) ? 'high' : 'medium',
            status: 'active',
            createdAt: new Date().toISOString(),
            productName: product.name,
            currentValue: currentStock,
            thresholdValue: minStock,
            actions: [
              {
                id: 'view_product',
                label: 'View Product',
                type: 'button',
                action: () => Alert.alert('View Product', `Opening details for ${product.name}`)
              },
              {
                id: 'create_po',
                label: 'Create PO',
                type: 'button', 
                action: () => Alert.alert('Create PO', `Creating purchase order for ${product.name}`)
              }
            ]
          });
        }
      });

      // Generate expiring alerts
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + alertSettings.thresholds.expiring_days);

      inventoryItems.forEach((item: any) => {
        if (!item.expiry_date || item.status !== 'active') return;
        
        const expiryDate = new Date(item.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 0) {
          // Expired items
          alertData.push({
            id: `expired_${item.id}`,
            type: 'expired',
            title: 'Expired Item',
            message: `${item.batch_number} has expired`,
            severity: 'critical',
            status: 'active',
            createdAt: new Date().toISOString(),
            productName: `Product ${item.product_id}`,
            actions: [
              {
                id: 'remove_expired',
                label: 'Remove from Stock',
                type: 'button',
                action: () => Alert.alert('Remove Expired', `Removing expired batch ${item.batch_number}`)
              }
            ]
          });
        } else if (daysUntilExpiry <= alertSettings.thresholds.expiring_days) {
          // Expiring soon
          alertData.push({
            id: `expiring_${item.id}`,
            type: 'expiring',
            title: 'Item Expiring Soon',
            message: `${item.batch_number} expires in ${daysUntilExpiry} days`,
            severity: daysUntilExpiry <= 7 ? 'high' : 'medium',
            status: 'active',
            createdAt: new Date().toISOString(),
            productName: `Product ${item.product_id}`,
            currentValue: daysUntilExpiry,
            thresholdValue: alertSettings.thresholds.expiring_days,
            actions: [
              {
                id: 'move_to_front',
                label: 'Move to Front',
                type: 'button',
                action: () => Alert.alert('Move to Front', `Moving ${item.batch_number} to front of shelf`)
              }
            ]
          });
        }
      });

      // Generate warehouse capacity alerts
      warehouses.forEach((warehouse: any) => {
        const utilization = (warehouse.current_utilization / warehouse.capacity) * 100;
        
        if (utilization >= alertSettings.thresholds.warehouse_capacity_critical) {
          alertData.push({
            id: `capacity_critical_${warehouse.id}`,
            type: 'warehouse_capacity',
            title: 'Critical Warehouse Capacity',
            message: `${warehouse.name} is at ${utilization.toFixed(1)}% capacity`,
            severity: 'critical',
            status: 'active',
            createdAt: new Date().toISOString(),
            productName: warehouse.name,
            currentValue: utilization,
            thresholdValue: alertSettings.thresholds.warehouse_capacity_critical,
            actions: [
              {
                id: 'optimize_storage',
                label: 'Optimize Storage',
                type: 'button',
                action: () => Alert.alert('Optimize Storage', `Opening storage optimization for ${warehouse.name}`)
              }
            ]
          });
        } else if (utilization >= alertSettings.thresholds.warehouse_capacity_warning) {
          alertData.push({
            id: `capacity_warning_${warehouse.id}`,
            type: 'warehouse_capacity',
            title: 'Warehouse Capacity Warning',
            message: `${warehouse.name} is at ${utilization.toFixed(1)}% capacity`,
            severity: 'medium',
            status: 'active',
            createdAt: new Date().toISOString(),
            productName: warehouse.name,
            currentValue: utilization,
            thresholdValue: alertSettings.thresholds.warehouse_capacity_warning,
            actions: [
              {
                id: 'review_inventory',
                label: 'Review Inventory',
                type: 'button',
                action: () => Alert.alert('Review Inventory', `Reviewing inventory in ${warehouse.name}`)
              }
            ]
          });
        }
      });

      return alertData.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });

    } catch (error) {
      console.error('Error generating alert data:', error);
      return [];
    }
  };

  const loadSettings = () => {
    // Load settings from local storage
    const savedSettings = localStorage.getItem('alertSettings');
    if (savedSettings) {
      try {
        setAlertSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading alert settings:', error);
      }
    }
  };

  const saveSettings = (settings: AlertSettings) => {
    setAlertSettings(settings);
    localStorage.setItem('alertSettings', JSON.stringify(settings));
    Alert.alert('Settings Saved', 'Alert settings have been updated successfully');
    setShowSettings(false);
    loadAlerts(); // Reload alerts with new thresholds
  };

  const filterAlerts = () => {
    let filtered = alerts;

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(alert => alert.status === selectedFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(alert => 
        alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (alert.productName && alert.productName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredAlerts(filtered);
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'dismissed' } : alert
    ));
    Alert.alert('Alert Dismissed', 'Alert has been dismissed');
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'resolved' } : alert
    ));
    Alert.alert('Alert Resolved', 'Alert has been marked as resolved');
  };

  const dismissAllAlerts = () => {
    Alert.alert(
      'Dismiss All Alerts',
      'Are you sure you want to dismiss all active alerts?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss All',
          style: 'destructive',
          onPress: () => {
            setAlerts(prev => prev.map(alert => ({ ...alert, status: 'dismissed' })));
            Alert.alert('All Alerts Dismissed', 'All active alerts have been dismissed');
          }
        }
      ]
    );
  };

  const getAlertIcon = (type: AlertItem['type'], severity: AlertItem['severity']) => {
    switch (type) {
      case 'low_stock':
        return <TrendingDown size={20} color={getSeverityColor(severity)} />;
      case 'expiring':
      case 'expired':
        return <Clock size={20} color={getSeverityColor(severity)} />;
      case 'warehouse_capacity':
        return <Package size={20} color={getSeverityColor(severity)} />;
      default:
        return <AlertTriangle size={20} color={getSeverityColor(severity)} />;
    }
  };

  const getSeverityColor = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: AlertItem['status']) => {
    switch (status) {
      case 'active': return '#F59E0B';
      case 'dismissed': return '#6B7280';
      case 'resolved': return '#10B981';
      default: return '#6B7280';
    }
  };

  const filterOptions = [
    { key: 'all', label: 'All Alerts', count: alerts.filter(a => a.status === 'active').length },
    { key: 'active', label: 'Active', count: alerts.filter(a => a.status === 'active').length },
    { key: 'low_stock', label: 'Low Stock', count: alerts.filter(a => a.type === 'low_stock' && a.status === 'active').length },
    { key: 'expiring', label: 'Expiring', count: alerts.filter(a => (a.type === 'expiring' || a.type === 'expired') && a.status === 'active').length },
    { key: 'warehouse_capacity', label: 'Capacity', count: alerts.filter(a => a.type === 'warehouse_capacity' && a.status === 'active').length },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    loadAlerts();
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Bell size={32} color="#3B82F6" />
        <Text style={styles.loadingText}>Loading alerts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Bell size={24} color="#3B82F6" />
          <Text style={styles.headerTitle}>Alerts & Monitoring</Text>
        </View>
        <TouchableOpacity onPress={() => setShowSettings(!showSettings)}>
          <Settings size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search alerts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterChip,
              selectedFilter === option.key && styles.filterChipActive
            ]}
            onPress={() => setSelectedFilter(option.key)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === option.key && styles.filterTextActive
            ]}>
              {option.label} ({option.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Alert Summary */}
      <View style={styles.summaryContainer}>
        <TouchableOpacity style={styles.summaryCard} onPress={dismissAllAlerts}>
          <View style={styles.summaryContent}>
            <AlertTriangle size={20} color="#F59E0B" />
            <View style={styles.summaryText}>
              <Text style={styles.summaryTitle}>Active Alerts</Text>
              <Text style={styles.summaryValue}>{filteredAlerts.filter(a => a.status === 'active').length}</Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <CheckCircle size={20} color="#10B981" />
            <View style={styles.summaryText}>
              <Text style={styles.summaryTitle}>Resolved</Text>
              <Text style={styles.summaryValue}>{filteredAlerts.filter(a => a.status === 'resolved').length}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Alerts List */}
      <ScrollView 
        style={styles.alertsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
      >
        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle size={48} color="#10B981" />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptyMessage}>
              {selectedFilter === 'all' 
                ? 'No active alerts at the moment.'
                : `No ${selectedFilter} alerts found.`
              }
            </Text>
          </View>
        ) : (
          filteredAlerts.map((alert) => (
            <View
              key={alert.id}
              style={[
                styles.alertCard,
                { borderLeftColor: getSeverityColor(alert.severity) },
                alert.status === 'dismissed' && styles.alertCardDismissed,
                alert.status === 'resolved' && styles.alertCardResolved
              ]}
            >
              <View style={styles.alertHeader}>
                <View style={styles.alertIconContainer}>
                  {getAlertIcon(alert.type, alert.severity)}
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  {alert.productName && (
                    <Text style={styles.alertProductName}>{alert.productName}</Text>
                  )}
                  {alert.currentValue !== undefined && alert.thresholdValue !== undefined && (
                    <Text style={styles.alertValues}>
                      Current: {alert.currentValue} | Threshold: {alert.thresholdValue}
                    </Text>
                  )}
                </View>
                <View style={styles.alertActions}>
                  <Text style={[
                    styles.alertSeverity,
                    { color: getSeverityColor(alert.severity) }
                  ]}>
                    {alert.severity.toUpperCase()}
                  </Text>
                  <Text style={[
                    styles.alertStatus,
                    { color: getStatusColor(alert.status) }
                  ]}>
                    {alert.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {alert.status === 'active' && (
                <View style={styles.alertActionButtons}>
                  {alert.actions?.map((action) => (
                    <TouchableOpacity
                      key={action.id}
                      style={styles.actionButton}
                      onPress={action.action}
                    >
                      <Text style={styles.actionButtonText}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dismissButton]}
                    onPress={() => dismissAlert(alert.id)}
                  >
                    <Text style={styles.dismissButtonText}>Dismiss</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.resolveButton]}
                    onPress={() => resolveAlert(alert.id)}
                  >
                    <Text style={styles.resolveButtonText}>Resolve</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Settings Modal would go here - simplified for now */}
      {showSettings && (
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsModal}>
            <Text style={styles.settingsTitle}>Alert Settings</Text>
            <Text style={styles.settingsText}>Settings modal would be implemented here</Text>
            <TouchableOpacity
              style={styles.closeSettingsButton}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.closeSettingsText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
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
    marginLeft: 8,
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
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    marginLeft: 12,
  },
  summaryTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  alertsList: {
    flex: 1,
    padding: 16,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  alertCardDismissed: {
    opacity: 0.6,
  },
  alertCardResolved: {
    opacity: 0.8,
    borderLeftColor: '#10B981',
  },
  alertHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  alertIconContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  alertProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 2,
  },
  alertValues: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  alertActions: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  alertSeverity: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  alertStatus: {
    fontSize: 10,
    fontWeight: '700',
  },
  alertActionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dismissButton: {
    backgroundColor: '#6B7280',
  },
  dismissButtonText: {
    color: '#FFFFFF',
  },
  resolveButton: {
    backgroundColor: '#10B981',
  },
  resolveButtonText: {
    color: '#FFFFFF',
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
  settingsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 24,
    maxWidth: 320,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  settingsText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  closeSettingsButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeSettingsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});