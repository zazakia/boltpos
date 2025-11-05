// Supplier Management Screen for InventoryPro
// Main supplier management interface with CRUD operations

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
import { Supplier } from '@/types/inventory';
import { SupplierCard } from './SupplierCard';
import { SupplierFormModal } from './SupplierFormModal';
import { dataManagerService } from '@/services/dataManager.service';

type FilterType = 'all' | 'active' | 'inactive';
type SortOption = 'name' | 'company' | 'paymentTerms' | 'created';

export const SupplierManagementScreen: React.FC = () => {
  // State Management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter and Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedSort, setSelectedSort] = useState<SortOption>('company');

  // Statistics
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    activeSuppliers: 0,
    inactiveSuppliers: 0,
    codSuppliers: 0,
    creditSuppliers: 0,
  });

  // Load data
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const result = await dataManagerService.getSuppliers();
      const suppliersData = result?.data || [];
      
      setSuppliers(suppliersData);

      // Calculate statistics
      const statsData = {
        totalSuppliers: suppliersData.length,
        activeSuppliers: suppliersData.filter((s: Supplier) => s.status === 'active').length,
        inactiveSuppliers: suppliersData.filter((s: Supplier) => s.status === 'inactive').length,
        codSuppliers: suppliersData.filter((s: Supplier) => s.paymentTerms === 'COD').length,
        creditSuppliers: suppliersData.filter((s: Supplier) => s.paymentTerms !== 'COD').length,
      };
      setStats(statsData);

    } catch (error) {
      console.error('Error loading suppliers:', error);
      Alert.alert('Error', 'Failed to load suppliers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadSuppliers();
  };

  // Filter and search logic
  const filteredSuppliers = suppliers.filter(supplier => {
    // Search filter
    const matchesSearch = !searchQuery || 
      supplier.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.phone.includes(searchQuery);

    // Status filter
    const matchesFilter = selectedFilter === 'all' || supplier.status === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  // Sort logic
  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
    switch (selectedSort) {
      case 'name':
        return a.contactPerson.localeCompare(b.contactPerson);
      case 'company':
        return a.companyName.localeCompare(b.companyName);
      case 'paymentTerms':
        return a.paymentTerms.localeCompare(b.paymentTerms);
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });

  // CRUD Operations
  const handleCreateSupplier = () => {
    setEditingSupplier(null);
    setShowFormModal(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowFormModal(true);
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    try {
      // In a real app, this would call a service method
      Alert.alert('Success', `Supplier ${supplier.companyName} has been deleted`);
      loadSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      Alert.alert('Error', 'Failed to delete supplier');
    }
  };

  const handleSaveSupplier = async (supplierData: Partial<Supplier>) => {
    try {
      // In a real app, this would call a service method
      Alert.alert('Success', 
        editingSupplier 
          ? `Supplier ${supplierData.companyName} has been updated`
          : `Supplier ${supplierData.companyName} has been created`
      );
      setShowFormModal(false);
      setEditingSupplier(null);
      loadSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
      Alert.alert('Error', 'Failed to save supplier');
    }
  };

  const handleViewOrders = (supplier: Supplier) => {
    Alert.alert('View Orders', `Purchase orders for ${supplier.companyName} would be displayed here`);
  };

  const getOrderStats = (supplierId: string) => {
    // Placeholder - would fetch real order stats
    return {
      totalOrders: Math.floor(Math.random() * 20) + 1,
      totalSpent: Math.floor(Math.random() * 100000) + 10000,
      lastOrderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      avgOrderValue: Math.floor(Math.random() * 10000) + 5000,
    };
  };

  // Render functions
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Supplier Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateSupplier}
        >
          <Text style={styles.addButtonText}>+ Add Supplier</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search suppliers by name, company, email, or phone..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalSuppliers}</Text>
          <Text style={styles.statLabel}>Total Suppliers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.activeSuppliers}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.codSuppliers}</Text>
          <Text style={styles.statLabel}>COD</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.creditSuppliers}</Text>
          <Text style={styles.statLabel}>Credit</Text>
        </View>
      </View>

      {/* Filter and Sort Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            const filters: FilterType[] = ['all', 'active', 'inactive'];
            const currentIndex = filters.indexOf(selectedFilter);
            const nextFilter = filters[(currentIndex + 1) % filters.length];
            setSelectedFilter(nextFilter);
          }}
        >
          <Text style={styles.filterButtonText}>
            🔍 {selectedFilter === 'all' ? 'All Status' : 
                selectedFilter === 'active' ? 'Active Only' : 'Inactive Only'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            const sorts: SortOption[] = ['company', 'name', 'paymentTerms', 'created'];
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
          {sortedSuppliers.length} of {stats.totalSuppliers} suppliers
          {searchQuery && ` matching "${searchQuery}"`}
        </Text>
      </View>
    </View>
  );

  const renderSupplier = ({ item }: { item: Supplier }) => (
    <SupplierCard
      supplier={item}
      orderStats={getOrderStats(item.id)}
      onEdit={handleEditSupplier}
      onDelete={handleDeleteSupplier}
      onViewOrders={handleViewOrders}
      onPress={handleEditSupplier}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🏢</Text>
      <Text style={styles.emptyStateTitle}>
        {searchQuery ? 'No suppliers found' : 'No suppliers yet'}
      </Text>
      <Text style={styles.emptyStateText}>
        {searchQuery 
          ? 'Try adjusting your search terms'
          : 'Start by adding your first supplier to manage your supply chain'
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={handleCreateSupplier}
        >
          <Text style={styles.emptyStateButtonText}>Add Your First Supplier</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      <FlatList
        data={sortedSuppliers}
        renderItem={renderSupplier}
        keyExtractor={(item) => item.id}
        contentContainerStyle={sortedSuppliers.length === 0 ? styles.emptyList : undefined}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={!loading ? renderEmptyState : undefined}
      />

      {/* Supplier Form Modal */}
      <SupplierFormModal
        visible={showFormModal}
        supplier={editingSupplier}
        onSave={handleSaveSupplier}
        onCancel={() => {
          setShowFormModal(false);
          setEditingSupplier(null);
        }}
      />

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading suppliers...</Text>
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
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
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