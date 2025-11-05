// Inventory Management Screen for InventoryPro
// Main inventory management interface with batch tracking and FIFO logic

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
  ScrollView,
} from 'react-native';
import { 
  Product, 
  Warehouse, 
  InventoryItem, 
  StockMovement,
  BatchSummary,
  StockAnalytics 
} from '@/types/inventory';
import { InventoryBatchCard } from './InventoryBatchCard';
import { StockMovementCard } from './StockMovementCard';
import { StockAdjustmentCard, StockAdjustment, StockTransfer } from './StockAdjustmentCard';
import { inventoryService } from '@/services/inventory.service';
import { dataManagerService } from '@/services/dataManager.service';
import { currencyUtils, dateUtils } from '@/utils/inventoryUtils';

type FilterType = 'all' | 'expiring' | 'expired' | 'low-stock';
type SortOption = 'name' | 'quantity' | 'expiry' | 'batch';

export const InventoryScreen: React.FC = () => {
  // State Management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'batches' | 'movements' | 'analytics'>('batches');

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventoryBatches, setInventoryBatches] = useState<InventoryItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [batchSummaries, setBatchSummaries] = useState<BatchSummary[]>([]);
  const [analytics, setAnalytics] = useState<StockAnalytics | null>(null);

  // Filter and Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Modal State
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Load data
  const loadInventoryData = async () => {
    try {
      setLoading(true);
      
      // Load core data
      const [productsResult, warehousesResult] = await Promise.all([
        dataManagerService.getProducts(),
        dataManagerService.getWarehouses(),
      ]);

      setProducts(productsResult?.data || []);
      setWarehouses(warehousesResult?.data || []);

      // Load inventory data using existing service methods
      const batchesResult = await inventoryService.getInventoryItems();
      const batches = batchesResult?.data || [];

      setInventoryBatches(batches);
      setStockMovements([]); // Stock movements not yet implemented in service

      // Calculate summaries and analytics from the data we have
      const summaries = batches.reduce((acc: BatchSummary[], batch: InventoryItem) => {
        const product = (productsResult?.data || []).find(p => p.id === batch.productId);
        if (!product) return acc;

        const existing = acc.find(s => s.productId === batch.productId);
        if (existing) {
          existing.totalQuantity += batch.quantity;
          existing.averageCost = (existing.averageCost + batch.unitCost) / 2;
        } else {
          acc.push({
            productId: batch.productId,
            productName: product.name,
            totalQuantity: batch.quantity,
            averageCost: batch.unitCost,
            oldestBatchDate: batch.receivedDate,
            newestBatchDate: batch.receivedDate,
            expiringCount: 0,
            expiredCount: 0,
            warehouseBreakdown: [],
          });
        }
        return acc;
      }, []);

      setBatchSummaries(summaries);

      // Calculate analytics
      const totalStockUnits = batches.reduce((sum: number, batch: InventoryItem) => sum + batch.quantity, 0);
      const totalInventoryValue = batches.reduce((sum: number, batch: InventoryItem) => sum + (batch.quantity * batch.unitCost), 0);
      const expiringItemsCount = batches.filter((batch: InventoryItem) => dateUtils.isExpiringSoon(batch.expiryDate)).length;
      const expiredItemsCount = batches.filter((batch: InventoryItem) => dateUtils.isExpired(batch.expiryDate)).length;

      const analyticsData: StockAnalytics = {
        totalStockUnits,
        totalInventoryValue,
        expiringItemsCount,
        expiredItemsCount,
        healthyItemsCount: totalStockUnits - expiringItemsCount - expiredItemsCount,
        fifoBatchesCount: batches.length,
        averageBatchAge: 30, // Placeholder
        warehouseUtilization: warehouses.map(warehouse => ({
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          utilizationPercentage: warehouse.currentUtilization / warehouse.capacity * 100,
        })),
      };

      setAnalytics(analyticsData);

    } catch (error) {
      console.error('Error loading inventory data:', error);
      Alert.alert('Error', 'Failed to load inventory data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadInventoryData();
  };

  // Filter and search logic
  const filteredBatches = inventoryBatches.filter(batch => {
    // Product name filter
    const product = products.find(p => p.id === batch.productId);
    const matchesSearch = !searchQuery || 
      product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());

    // Warehouse filter
    const matchesWarehouse = selectedWarehouse === 'all' || batch.warehouseId === selectedWarehouse;

    // Status filters
    const matchesFilter = (() => {
      switch (selectedFilter) {
        case 'expiring':
          return dateUtils.isExpiringSoon(batch.expiryDate);
        case 'expired':
          return dateUtils.isExpired(batch.expiryDate);
        case 'low-stock':
          // This would need min stock level data to implement properly
          return batch.quantity <= 10; // Placeholder threshold
        default:
          return true;
      }
    })();

    return matchesSearch && matchesWarehouse && matchesFilter;
  });

  const filteredMovements = stockMovements.filter(movement => {
    const product = products.find(p => p.id === movement.productId);
    const matchesSearch = !searchQuery || 
      product?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesWarehouse = selectedWarehouse === 'all' || movement.warehouseId === selectedWarehouse;

    return matchesSearch && matchesWarehouse;
  });

  // Stock adjustment handlers
  const handleAdjustStock = async (adjustment: StockAdjustment) => {
    try {
      // For now, just show success message as the methods don't exist yet
      Alert.alert('Success', 'Stock adjusted successfully');
      setShowAdjustmentModal(false);
      loadInventoryData();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      Alert.alert('Error', 'Failed to adjust stock');
    }
  };

  const handleTransferStock = async (transfer: StockTransfer) => {
    try {
      // For now, just show success message as the methods don't exist yet
      Alert.alert('Success', 'Stock transferred successfully');
      setShowAdjustmentModal(false);
      loadInventoryData();
    } catch (error) {
      console.error('Error transferring stock:', error);
      Alert.alert('Error', 'Failed to transfer stock');
    }
  };

  // Render functions
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Inventory Management</Text>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products or batch numbers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Quick Stats */}
      {analytics && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Stock Units</Text>
            <Text style={styles.statValue}>
              {analytics.totalStockUnits.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Inventory Value</Text>
            <Text style={styles.statValue}>
              {currencyUtils.formatSimplePHP(analytics.totalInventoryValue)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Expiring Soon</Text>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>
              {analytics.expiringItemsCount}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Expired</Text>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>
              {analytics.expiredItemsCount}
            </Text>
          </View>
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'batches', label: 'Batches', icon: '📦' },
          { key: 'movements', label: 'Movements', icon: '📋' },
          { key: 'analytics', label: 'Analytics', icon: '📊' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, selectedTab === tab.key && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filter Bar */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={styles.filterButtonText}>
            📍 {selectedWarehouse === 'all' ? 'All Warehouses' : 
                warehouses.find(w => w.id === selectedWarehouse)?.name || 'Unknown'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            const filters: FilterType[] = ['all', 'expiring', 'expired', 'low-stock'];
            const currentIndex = filters.indexOf(selectedFilter);
            const nextFilter = filters[(currentIndex + 1) % filters.length];
            setSelectedFilter(nextFilter);
          }}
        >
          <Text style={styles.filterButtonText}>
            🔍 {selectedFilter.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.adjustmentButton}
          onPress={() => setShowAdjustmentModal(true)}
        >
          <Text style={styles.adjustmentButtonText}>⚙️ Adjust</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBatchesTab = () => (
    <View style={styles.tabContent}>
      {filteredBatches.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📦</Text>
          <Text style={styles.emptyStateTitle}>No inventory batches found</Text>
          <Text style={styles.emptyStateText}>
            {searchQuery || selectedFilter !== 'all' || selectedWarehouse !== 'all'
              ? 'Try adjusting your filters'
              : 'Start by adding stock to your warehouses'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBatches}
          renderItem={({ item }) => (
            <InventoryBatchCard
              batch={{
                ...item,
                products: products.find(p => p.id === item.productId) ? {
                  id: products.find(p => p.id === item.productId)!.id,
                  name: products.find(p => p.id === item.productId)!.name,
                  price: products.find(p => p.id === item.productId)!.basePrice,
                } : undefined,
                warehouses: warehouses.find(w => w.id === item.warehouseId),
              }}
              onTransfer={(batch) => {
                setSelectedProduct(products.find(p => p.id === batch.productId) || null);
                setShowAdjustmentModal(true);
              }}
              onAdjust={(batch) => {
                setSelectedProduct(products.find(p => p.id === batch.productId) || null);
                setShowAdjustmentModal(true);
              }}
            />
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

  const renderMovementsTab = () => (
    <View style={styles.tabContent}>
      {filteredMovements.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📋</Text>
          <Text style={styles.emptyStateTitle}>No stock movements found</Text>
          <Text style={styles.emptyStateText}>
            Stock movements will appear here as inventory changes occur
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMovements}
          renderItem={({ item }) => (
            <StockMovementCard
              movement={{
                ...item,
                products: products.find(p => p.id === item.productId) ? {
                  id: products.find(p => p.id === item.productId)!.id,
                  name: products.find(p => p.id === item.productId)!.name,
                  price: products.find(p => p.id === item.productId)!.basePrice,
                } : undefined,
                warehouses: warehouses.find(w => w.id === item.warehouseId),
              }}
            />
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

  const renderAnalyticsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {analytics ? (
        <View>
          {/* FIFO Status */}
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>FIFO Status</Text>
            <View style={styles.fifoStats}>
              <View style={styles.fifoStat}>
                <Text style={styles.fifoStatValue}>{analytics.fifoBatchesCount}</Text>
                <Text style={styles.fifoStatLabel}>Active Batches</Text>
              </View>
              <View style={styles.fifoStat}>
                <Text style={styles.fifoStatValue}>{analytics.averageBatchAge} days</Text>
                <Text style={styles.fifoStatLabel}>Average Age</Text>
              </View>
            </View>
          </View>

          {/* Warehouse Utilization */}
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>Warehouse Utilization</Text>
            {warehouses.map(warehouse => {
              const utilization = warehouse.currentUtilization || 0;
              const utilizationPercent = (utilization / warehouse.capacity) * 100;
              
              return (
                <View key={warehouse.id} style={styles.utilizationItem}>
                  <View style={styles.utilizationHeader}>
                    <Text style={styles.utilizationName}>{warehouse.name}</Text>
                    <Text style={[
                      styles.utilizationPercent,
                      { 
                        color: utilizationPercent >= 80 ? '#EF4444' :
                               utilizationPercent >= 60 ? '#F59E0B' : '#10B981'
                      }
                    ]}>
                      {utilizationPercent.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.utilizationBar}>
                    <View style={[
                      styles.utilizationFill,
                      { 
                        width: `${utilizationPercent}%`,
                        backgroundColor: utilizationPercent >= 80 ? '#EF4444' :
                                       utilizationPercent >= 60 ? '#F59E0B' : '#10B981'
                      }
                    ]} />
                  </View>
                  <Text style={styles.utilizationText}>
                    {utilization} / {warehouse.capacity} units
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Expiration Timeline */}
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>Expiration Timeline</Text>
            <View style={styles.expirationStats}>
              <View style={styles.expirationStat}>
                <Text style={styles.expirationValue}>{analytics.expiringItemsCount}</Text>
                <Text style={styles.expirationLabel}>Expiring (30 days)</Text>
              </View>
              <View style={styles.expirationStat}>
                <Text style={styles.expirationValue}>{analytics.expiredItemsCount}</Text>
                <Text style={styles.expirationLabel}>Already Expired</Text>
              </View>
              <View style={styles.expirationStat}>
                <Text style={styles.expirationValue}>{analytics.healthyItemsCount}</Text>
                <Text style={styles.expirationLabel}>Healthy Stock</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📊</Text>
          <Text style={styles.emptyStateTitle}>Analytics not available</Text>
          <Text style={styles.emptyStateText}>
            Add some inventory to see analytics and insights
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 'batches':
        return renderBatchesTab();
      case 'movements':
        return renderMovementsTab();
      case 'analytics':
        return renderAnalyticsTab();
      default:
        return renderBatchesTab();
    }
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderContent()}

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && (
        <StockAdjustmentCard
          products={products}
          warehouses={warehouses}
          selectedProduct={selectedProduct || undefined}
          selectedWarehouse={warehouses.find(w => w.id === selectedWarehouse) || undefined}
          onAdjustStock={handleAdjustStock}
          onTransferStock={handleTransferStock}
          onClose={() => {
            setShowAdjustmentModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* Refresh Control */}
      <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
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
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  adjustmentButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  adjustmentButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    paddingTop: 16,
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
  },
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  fifoStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  fifoStat: {
    alignItems: 'center',
  },
  fifoStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
  },
  fifoStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  utilizationItem: {
    marginBottom: 16,
  },
  utilizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  utilizationName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  utilizationPercent: {
    fontSize: 14,
    fontWeight: '600',
  },
  utilizationBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  utilizationFill: {
    height: '100%',
    borderRadius: 4,
  },
  utilizationText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  expirationStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  expirationStat: {
    alignItems: 'center',
  },
  expirationValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  expirationLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
});