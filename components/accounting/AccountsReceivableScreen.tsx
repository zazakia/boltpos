// Accounts Receivable Management Screen for InventoryPro
// Comprehensive A/R management with customer payments and invoice tracking

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import { AccountsReceivable } from '@/types/inventory';
import { accountingService } from '@/services/accounting.service';
import { currencyUtils, dateUtils } from '@/utils/inventoryUtils';

interface AccountsReceivableScreenProps {
  onBack: () => void;
}

interface PaymentModalData {
  visible: boolean;
  ar: AccountsReceivable | null;
  amount: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'card';
  notes: string;
}

export const AccountsReceivableScreen: React.FC<AccountsReceivableScreenProps> = ({ onBack }) => {
  const [accountsReceivable, setAccountsReceivable] = useState<AccountsReceivable[]>([]);
  const [filteredAR, setFilteredAR] = useState<AccountsReceivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'outstanding' | 'paid' | 'overdue'>('all');
  const [paymentModal, setPaymentModal] = useState<PaymentModalData>({
    visible: false,
    ar: null,
    amount: '',
    paymentMethod: 'cash',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAccountsReceivable();
  }, [accountsReceivable, searchQuery, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const result = await accountingService.getAccountsReceivable();

      if (result.error) {
        throw new Error(result.error);
      }

      setAccountsReceivable(result.data || []);
      
    } catch (error) {
      console.error('AccountsReceivableScreen: Error loading data:', error);
      Alert.alert('Error', 'Failed to load accounts receivable data');
    } finally {
      setLoading(false);
    }
  };

  const filterAccountsReceivable = () => {
    let filtered = accountsReceivable;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(ar => 
        ar.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ar.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ar.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ar => ar.status === statusFilter);
    }

    setFilteredAR(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'outstanding': return '#F59E0B';
      case 'overdue': return '#EF4444';
      case 'paid': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'outstanding': return 'Outstanding';
      case 'overdue': return 'Overdue';
      case 'paid': return 'Paid';
      default: return status;
    }
  };

  const openPaymentModal = (ar: AccountsReceivable) => {
    setPaymentModal({
      visible: true,
      ar,
      amount: ar.amount.toString(),
      paymentMethod: 'cash',
      notes: '',
    });
  };

  const closePaymentModal = () => {
    setPaymentModal({
      visible: false,
      ar: null,
      amount: '',
      paymentMethod: 'cash',
      notes: '',
    });
  };

  const processPayment = async () => {
    if (!paymentModal.ar) return;

    try {
      const amount = parseFloat(paymentModal.amount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }

      // Update A/R status to paid
      const result = await accountingService.updateAccountsReceivableStatus(
        paymentModal.ar.id,
        'paid'
      );

      if (result.error) {
        throw new Error(result.error);
      }

      // Record payment transaction
      console.log('Payment recorded:', {
        arId: paymentModal.ar.id,
        customerName: paymentModal.ar.customerName,
        amount,
        method: paymentModal.paymentMethod,
        notes: paymentModal.notes,
      });

      Alert.alert('Success', 'Payment recorded successfully');
      closePaymentModal();
      loadData(); // Refresh data
      
    } catch (error) {
      console.error('AccountsReceivableScreen: Error processing payment:', error);
      Alert.alert('Error', 'Failed to process payment');
    }
  };

  const renderARItem = ({ item }: { item: AccountsReceivable }) => {
    const dueDate = new Date(item.dueDate);
    const isOverdue = item.status === 'outstanding' && dueDate < new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return (
      <View style={styles.arCard}>
        <View style={styles.arHeader}>
          <View style={styles.arInfo}>
            <Text style={styles.arDescription}>{item.description}</Text>
            <Text style={styles.arInvoice}>{item.invoiceNumber}</Text>
            <Text style={styles.arCustomer}>{item.customerName}</Text>
          </View>
          <View style={styles.arAmount}>
            <Text style={styles.arAmountText}>
              {currencyUtils.formatSimplePHP(item.amount)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusBadgeText}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.arDetails}>
          <View style={styles.arDetailRow}>
            <Text style={styles.arDetailLabel}>Invoice Date:</Text>
            <Text style={styles.arDetailValue}>{dateUtils.formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.arDetailRow}>
            <Text style={styles.arDetailLabel}>Due Date:</Text>
            <Text style={[
              styles.arDetailValue,
              isOverdue ? styles.overdueText : daysUntilDue <= 7 ? styles.warningText : null
            ]}>
              {dateUtils.formatDate(item.dueDate)}
              {isOverdue && ` (${Math.abs(daysUntilDue)} days overdue)`}
              {!isOverdue && daysUntilDue <= 7 && daysUntilDue >= 0 && ` (${daysUntilDue} days)`}
            </Text>
          </View>
        </View>

        {item.status === 'outstanding' && (
          <TouchableOpacity 
            style={styles.collectButton} 
            onPress={() => openPaymentModal(item)}
          >
            <Text style={styles.collectButtonText}>Record Payment</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderPaymentModal = () => (
    <Modal
      visible={paymentModal.visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closePaymentModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={closePaymentModal}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Record Payment</Text>
          <TouchableOpacity onPress={processPayment}>
            <Text style={styles.modalSave}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {paymentModal.ar && (
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentCustomer}>{paymentModal.ar.customerName}</Text>
              <Text style={styles.paymentDescription}>{paymentModal.ar.description}</Text>
              <Text style={styles.paymentAmount}>
                {currencyUtils.formatSimplePHP(paymentModal.ar.amount)}
              </Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Payment Amount</Text>
            <TextInput
              style={styles.textInput}
              value={paymentModal.amount}
              onChangeText={(text) => setPaymentModal(prev => ({ ...prev, amount: text }))}
              placeholder="Enter amount"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Payment Method</Text>
            <View style={styles.paymentMethodContainer}>
              {['cash', 'bank_transfer', 'check', 'card'].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.paymentMethodButton,
                    paymentModal.paymentMethod === method && styles.paymentMethodButtonActive
                  ]}
                  onPress={() => setPaymentModal(prev => ({ ...prev, paymentMethod: method as any }))}
                >
                  <Text style={[
                    styles.paymentMethodText,
                    paymentModal.paymentMethod === method && styles.paymentMethodTextActive
                  ]}>
                    {method.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={paymentModal.notes}
              onChangeText={(text) => setPaymentModal(prev => ({ ...prev, notes: text }))}
              placeholder="Add payment notes..."
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Accounts Receivable...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Accounts Receivable</Text>
        <TouchableOpacity onPress={loadData}>
          <Text style={styles.refreshButton}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {currencyUtils.formatSimplePHP(
              filteredAR.filter(ar => ar.status === 'outstanding').reduce((sum, ar) => sum + ar.amount, 0)
            )}
          </Text>
          <Text style={styles.summaryLabel}>Outstanding</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {currencyUtils.formatSimplePHP(
              filteredAR.filter(ar => ar.status === 'overdue').reduce((sum, ar) => sum + ar.amount, 0)
            )}
          </Text>
          <Text style={styles.summaryLabel}>Overdue</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {filteredAR.filter(ar => ar.status === 'outstanding').length}
          </Text>
          <Text style={styles.summaryLabel}>Invoices</Text>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers, invoices, descriptions..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
          {['all', 'outstanding', 'overdue', 'paid'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterTab,
                statusFilter === status && styles.filterTabActive
              ]}
              onPress={() => setStatusFilter(status as any)}
            >
              <Text style={[
                styles.filterTabText,
                statusFilter === status && styles.filterTabTextActive
              ]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Accounts Receivable List */}
      <FlatList
        data={filteredAR}
        renderItem={renderARItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No accounts receivable found</Text>
          </View>
        }
      />

      {renderPaymentModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  refreshButton: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  filterTabs: {
    marginTop: 4,
  },
  filterTab: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 12,
    color: '#374151',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  arCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  arHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  arInfo: {
    flex: 1,
  },
  arDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  arInvoice: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  arCustomer: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  arAmount: {
    alignItems: 'flex-end',
  },
  arAmountText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  arDetails: {
    marginBottom: 12,
  },
  arDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  arDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  arDetailValue: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  overdueText: {
    color: '#EF4444',
  },
  warningText: {
    color: '#F59E0B',
  },
  collectButton: {
    backgroundColor: '#059669',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  collectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalSave: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  paymentInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  paymentCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  paymentMethodButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  paymentMethodButtonActive: {
    backgroundColor: '#3B82F6',
  },
  paymentMethodText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  paymentMethodTextActive: {
    color: '#FFFFFF',
  },
});