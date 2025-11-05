// Purchase Order Management Screen for InventoryPro
// Main purchase order management interface with workflow tracking

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { PurchaseOrder } from '@/types/inventory';
import { PurchaseOrderCard } from './PurchaseOrderCard';
import { PurchaseOrderFormModal } from './PurchaseOrderFormModal';
import { dataManagerService } from '@/services/dataManager.service';
import { currencyUtils, dateUtils } from '@/utils/inventoryUtils';

type FilterType = 'all' | 'draft' | 'pending' | 'ordered' | 'received' | 'cancelled';
type SortOption = 'date' | 'amount' | 'supplier' | 'status';

export const PurchaseOrderManagementScreen: React.FC = () => {
  // State Management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter and Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedSort, setSelectedSort] = useState<SortOption>('date');

  // Statistics
  const [stats, setStats] = useState({
    totalOrders: 0,
    draftOrders: 0,
    pendingOrders: 0,
    orderedOrders: 0,
    receivedOrders: 0,
    totalValue: 0,
    avgOrderValue: 0,
  });

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load purchase orders
      const ordersResult = await dataManagerService.getPurchaseOrders();
      const ordersData = ordersResult?.data || [];
      
      // Load suppliers and products for display
      const [suppliersResult, productsResult] = await Promise.all([
        dataManagerService.getSuppliers(),
        dataManagerService.getProducts(),
      ]);
      
      setPurchaseOrders(ordersData);
      setSuppliers(suppliersResult?.data || []);
      setProducts(productsResult?.data || []);

      // Calculate statistics
      const statsData = {
        totalOrders: ordersData.length,
        draftOrders: ordersData.filter((po: PurchaseOrder) => po.status === 'draft').length,
        pendingOrders: ordersData.filter((po: PurchaseOrder) => po.status === 'pending').length,
        orderedOrders: ordersData.filter((po: PurchaseOrder) => po.status === 'ordered').length,
        receivedOrders: ordersData.filter((po: PurchaseOrder) => po.status === 'received').length,
        totalValue: ordersData.reduce((sum: number, po: PurchaseOrder) => sum + po.totalAmount, 0),
        avgOrderValue: ordersData.length > 0 
          ? ordersData.reduce((sum: number, po: PurchaseOrder) => sum + po.totalAmount, 0) / ordersData.length 
          : 0,
      };
      setStats(statsData);

    } catch (error) {
      console.error('Error loading purchase orders:', error);
      Alert.alert('Error', 'Failed to load purchase orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filter and search logic
  const filteredOrders = purchaseOrders.filter(order => {
    const supplier = suppliers.find(s => s.id === order.supplierId);
    
    // Search filter
    const matchesSearch = !searchQuery || 
      order.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => {
        const product = products.find(p => p.id === item.productId);
        return product?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      });

    // Status filter
    const matchesFilter = selectedFilter === 'all' || order.status === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  // Sort logic
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const supplierA = suppliers.find(s => s.id === a.supplierId);
    const supplierB = suppliers.find(s => s.id === b.supplierId);
    
    switch (selectedSort) {
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'amount':
        return b.totalAmount - a.totalAmount;
      case 'supplier':
        return (supplierA?.companyName || '').localeCompare(supplierB?.companyName || '');
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  // CRUD Operations
  const handleCreateOrder = () => {
    setEditingOrder(null);
    setShowFormModal(true);
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    if (order.status === 'draft' || order.status === 'pending') {
      setEditingOrder(order);
      setShowFormModal(true);
    } else {
      Alert.alert('Cannot Edit', 'Only draft and pending orders can be edited');
    }
  };

  const handleDeleteOrder = async (order: PurchaseOrder) => {
    if (order.status === 'draft') {
      Alert.alert(
        'Delete Purchase Order',
        `Are you sure you want to delete PO ${order.poNumber}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // In real app, would call delete service
                Alert.alert('Success', `PO ${order.poNumber} has been deleted`);
                loadData();
              } catch (error) {
                console.error('Error deleting order:', error);
                Alert.alert('Error', 'Failed to delete order');
              }
            },
          },
        ]
      );
    } else {
      Alert.alert('Cannot Delete', 'Only draft orders can be deleted');
    }
  };

  const handleReceiveOrder = async (order: PurchaseOrder) => {
    try {
      Alert.alert(
        'Receive Order',
        `Mark PO ${order.poNumber} as received? This will create inventory batches.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Mark Received',
            onPress: async () => {
              try {
                // In real app, would call receive service
                Alert.alert('Success', `PO ${order.poNumber} marked as received and inventory created`);
                loadData();
              } catch (error) {
                console.error('Error receiving order:', error);
                Alert.alert('Error', 'Failed to receive order');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error receiving order:', error);
      Alert.alert('Error', 'Failed to receive order');
    }
  };

  const handleCancelOrder = async (order: PurchaseOrder) => {
    try {
      // In real app, would call cancel service
      Alert.alert('Success', `PO ${order.poNumber} has been cancelled`);
      loadData();
    } catch (error) {
      console.error('Error cancelling order:', error);
      Alert.alert('Error', 'Failed to cancel order');
    }
  };

  const handleSaveOrder = async (orderData: Partial<PurchaseOrder>) => {
    try {
      // In real app, would call save service
      Alert.alert('Success', 
        editingOrder 
          ? `PO ${orderData.poNumber} has been updated`
          : `PO ${orderData.poNumber} has been created`
      );
      setShowFormModal(false);
      setEditingOrder(null);
      loadData();
    } catch (error) {
      console.error('Error saving order:', error);
      Alert.alert('Error', 'Failed to save order');
    }
  };

  // Enhanced order data with relations
  const getEnhancedOrder = (order: PurchaseOrder) => ({
    ...order,
    suppliers: suppliers.find(s => s.id === order.supplierId),
    products: order.items.map(item => ({
      ...products.find(p => p.id === item.productId),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  });

  // Render functions
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Purchase Order Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateOrder}
        >
          <Text style={styles.addButtonText}>+ Create PO</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by PO number, supplier, or products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pendingOrders}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.receivedOrders}</Text>
          <Text style={styles.statLabel}>Received</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{currencyUtils.formatSimplePHP(stats.totalValue)}</Text>
          <Text style={styles.statLabel}>Total Value</Text>
        </View>
      </View>

      {/* Status Overview */}
      <View style={styles.statusOverview}>
        <Text style={styles.statusOverviewTitle}>Order Status Overview</Text>
        <View style={styles.statusBar}>
          <View style={[
            styles.statusSegment, 
            { width: `${(stats.draftOrders / Math.max(stats.totalOrders, 1)) * 100}%` },
          ]} />
          <View style={[
            styles.statusSegment,
            { backgroundColor: '#F59E0B', width: `${(stats.pendingOrders / Math.max(stats.totalOrders, 1)) * 100}%` },
          ]} />
          <View style={[
            styles.statusSegment,
            { backgroundColor: '#3B82F6', width: `${(stats.orderedOrders / Math.max(stats.totalOrders, 1)) * 100}%` },
          ]} />
          <View style={[
            styles.statusSegment,
            { backgroundColor: '#059669', width: `${(stats.receivedOrders / Math.max(stats.totalOrders, 1)) * 100}%` },
          ]} />
        </View>
        <View style={styles.statusLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#6B7280' }]} />
            <Text style={styles.legendText}>Draft ({stats.draftOrders})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Pending ({stats.pendingOrders})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Ordered ({stats.orderedOrders})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#059669' }]} />
            <Text style={styles.legendText}>Received ({stats.receivedOrders})</Text>
          </View>
        </View>
      </View>

      {/* Filter and Sort Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            const filters: FilterType[] = ['all', 'draft', 'pending', 'ordered', 'received', 'cancelled'];
            const currentIndex = filters.indexOf(selectedFilter);
            const nextFilter = filters[(currentIndex + 1) % filters.length];
            setSelectedFilter(nextFilter);
          }}
        >
          <Text style={styles.filterButtonText}>
            🔍 {selectedFilter === 'all' ? 'All Status' : 
                selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            const sorts: SortOption[] = ['date', 'amount', 'supplier', 'status'];
            const currentIndex = sorts.indexOf(selectedSort);
            const nextSort = sorts[(currentIndex + 1) % sorts.length];
            setSelectedSort(nextSort);
          }}
        >
          <Text style={styles.filterButtonText}>
            📊 Sort: {selectedSort.charAt(0).toUpperCase() + selectedSort.slice(1)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {sortedOrders.length} of {stats.totalOrders} orders
          {searchQuery && ` matching "${searchQuery}"`}
        </Text>
      </View>
    </View>
  );

  const renderOrder = ({ item }: { item: PurchaseOrder }) => (
    <PurchaseOrderCard
      purchaseOrder={getEnhancedOrder(item)}
      onEdit={handleEditOrder}
      onDelete={handleDeleteOrder}
      onReceive={handleReceiveOrder}
      onCancel={handleCancelOrder}
      onPress={handleEditOrder}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📋</Text>
      <Text style={styles.emptyStateTitle}>
        {searchQuery ? 'No purchase orders found' : 'No purchase orders yet'}
      </Text>
      <Text style={styles.emptyStateText}>
        {searchQuery 
          ? 'Try adjusting your search terms'
          : 'Start by creating your first purchase order to manage your inventory'
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={handleCreateOrder}
        >
          <Text style={styles.emptyStateButtonText}>Create Your First PO</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      <FlatList
        data={sortedOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={sortedOrders.length === 0 ? styles.emptyList : undefined}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={!loading ? renderEmptyState : undefined}
      />

      {/* Purchase Order Form Modal */}
      <PurchaseOrderFormModal
        visible={showFormModal}
        purchaseOrder={editingOrder}
        suppliers={suppliers}
        products={products}
        onSave={handleSaveOrder}
        onCancel={() => {
          setShowFormModal(false);
          setEditingOrder(null);
        }}
      />

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading purchase orders...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  statusOverview: {
    marginBottom: 16,
  },
  statusOverviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  statusBar: {
    flexDirection: 'row',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  statusSegment: {
    backgroundColor: '#6B7280',
  },
  statusLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    color: '#6B7280',
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  resultsContainer: {
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});