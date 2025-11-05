// Expense Management Screen for InventoryPro
// Comprehensive expense tracking and approval workflow

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
import { Expense } from '@/types/inventory';
import { accountingService } from '@/services/accounting.service';
import { currencyUtils, dateUtils } from '@/utils/inventoryUtils';

interface ExpenseManagementScreenProps {
  onBack: () => void;
}

interface ExpenseModalData {
  visible: boolean;
  expense: Expense | null;
  isEdit: boolean;
  description: string;
  category: string;
  amount: string;
  vendorId: string;
  date: string;
  status: 'pending' | 'paid' | 'cancelled';
  receiptNumber: string;
  notes: string;
}

interface ApprovalModalData {
  visible: boolean;
  expense: Expense | null;
  approvalStatus: 'approved' | 'rejected';
  notes: string;
}

export const ExpenseManagementScreen: React.FC<ExpenseManagementScreenProps> = ({ onBack }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all');
  
  const [expenseModal, setExpenseModal] = useState<ExpenseModalData>({
    visible: false,
    expense: null,
    isEdit: false,
    description: '',
    category: '',
    amount: '',
    vendorId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    receiptNumber: '',
    notes: '',
  });

  const [approvalModal, setApprovalModal] = useState<ApprovalModalData>({
    visible: false,
    expense: null,
    approvalStatus: 'approved',
    notes: '',
  });

  const expenseCategories = [
    'Utilities', 'Rent', 'Salaries', 'Marketing', 'Transportation', 
    'Office Supplies', 'Equipment', 'Insurance', 'Legal', 'Professional Services',
    'Maintenance', 'Training', 'Travel', 'Meals', 'Other'
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchQuery, categoryFilter, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const result = await accountingService.getExpenses();

      if (result.error) {
        throw new Error(result.error);
      }

      setExpenses(result.data || []);
      
    } catch (error) {
      console.error('ExpenseManagementScreen: Error loading data:', error);
      Alert.alert('Error', 'Failed to load expenses data');
    } finally {
      setLoading(false);
    }
  };

  const filterExpenses = () => {
    let filtered = expenses;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(expense => 
        expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(expense => expense.category === categoryFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(expense => expense.status === statusFilter);
    }

    setFilteredExpenses(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'paid': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'paid': return 'Paid';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const openExpenseModal = (expense?: Expense) => {
    if (expense) {
      // Edit mode
      setExpenseModal({
        visible: true,
        expense,
        isEdit: true,
        description: expense.description || '',
        category: expense.category || '',
        amount: expense.amount.toString(),
        vendorId: expense.vendorId || '',
        date: expense.date,
        status: expense.status || 'pending',
        receiptNumber: expense.receiptNumber || '',
        notes: expense.notes || '',
      });
    } else {
      // New mode
      setExpenseModal({
        visible: true,
        expense: null,
        isEdit: false,
        description: '',
        category: '',
        amount: '',
        vendorId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        receiptNumber: '',
        notes: '',
      });
    }
  };

  const closeExpenseModal = () => {
    setExpenseModal({
      visible: false,
      expense: null,
      isEdit: false,
      description: '',
      category: '',
      amount: '',
      vendorId: '',
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      receiptNumber: '',
      notes: '',
    });
  };

  const saveExpense = async () => {
    try {
      const { isEdit, expense, description, category, amount, vendorId, date, status, receiptNumber, notes } = expenseModal;
      
      if (!description.trim() || !category.trim() || !amount.trim()) {
        Alert.alert('Error', 'Please fill in required fields');
        return;
      }

      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }

      if (isEdit && expense) {
        // Update existing expense
        const updateData = {
          ...expense,
          description,
          category,
          amount: amountValue,
          vendorId,
          date,
          status,
          receiptNumber,
          notes,
        };

        const result = await accountingService.updateExpenseStatus(
          expense.id, 
          updateData.status
        );
        
        if (result.error) {
          throw new Error(result.error);
        }
      } else {
        // Create new expense
        const newExpense = {
          description,
          category,
          amount: amountValue,
          vendorId,
          date,
          status,
          receiptNumber,
          notes,
        };

        const result = await accountingService.createExpense(newExpense);
        
        if (result.error) {
          throw new Error(result.error);
        }
      }

      Alert.alert('Success', `Expense ${isEdit ? 'updated' : 'created'} successfully`);
      closeExpenseModal();
      loadData();
      
    } catch (error) {
      console.error('ExpenseManagementScreen: Error saving expense:', error);
      Alert.alert('Error', 'Failed to save expense');
    }
  };

  const openApprovalModal = (expense: Expense) => {
    setApprovalModal({
      visible: true,
      expense,
      approvalStatus: 'approved',
      notes: '',
    });
  };

  const closeApprovalModal = () => {
    setApprovalModal({
      visible: false,
      expense: null,
      approvalStatus: 'approved',
      notes: '',
    });
  };

  const processApproval = async () => {
    if (!approvalModal.expense) return;

    try {
      const { expense, approvalStatus, notes } = approvalModal;
      
      const newStatus = approvalStatus === 'approved' ? 'pending' as const : 'cancelled' as const;
      
      const updateData = {
        ...expense,
        status: newStatus,
        notes: notes ? `${expense.notes || ''}\nApproval notes: ${notes}`.trim() : expense.notes,
      };

      const result = await accountingService.updateExpenseStatus(
          expense.id,
          newStatus
        );
      
      if (result.error) {
        throw new Error(result.error);
      }

      Alert.alert('Success', `Expense ${approvalStatus} successfully`);
      closeApprovalModal();
      loadData();
      
    } catch (error) {
      console.error('ExpenseManagementScreen: Error processing approval:', error);
      Alert.alert('Error', 'Failed to process approval');
    }
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseDescription}>{item.description}</Text>
          <Text style={styles.expenseCategory}>{item.category}</Text>
          {item.receiptNumber && (
            <Text style={styles.expenseReceipt}>Receipt: {item.receiptNumber}</Text>
          )}
        </View>
        <View style={styles.expenseAmount}>
          <Text style={styles.expenseAmountText}>
            {currencyUtils.formatSimplePHP(item.amount)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusBadgeText}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.expenseDetails}>
        <View style={styles.expenseDetailRow}>
          <Text style={styles.expenseDetailLabel}>Date:</Text>
          <Text style={styles.expenseDetailValue}>{dateUtils.formatDate(item.date)}</Text>
        </View>
        {item.vendorId && (
          <View style={styles.expenseDetailRow}>
            <Text style={styles.expenseDetailLabel}>Vendor:</Text>
            <Text style={styles.expenseDetailValue}>{item.vendorId}</Text>
          </View>
        )}
      </View>

      <View style={styles.expenseActions}>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => openExpenseModal(item)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        
        {item.status === 'pending' && (
          <TouchableOpacity 
            style={styles.approveButton} 
            onPress={() => openApprovalModal(item)}
          >
            <Text style={styles.approveButtonText}>Approve</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderExpenseModal = () => (
    <Modal
      visible={expenseModal.visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeExpenseModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={closeExpenseModal}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {expenseModal.isEdit ? 'Edit Expense' : 'New Expense'}
          </Text>
          <TouchableOpacity onPress={saveExpense}>
            <Text style={styles.modalSave}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={styles.textInput}
              value={expenseModal.description}
              onChangeText={(text) => setExpenseModal(prev => ({ ...prev, description: text }))}
              placeholder="Enter expense description"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category *</Text>
            <View style={styles.categoryContainer}>
              {expenseCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    expenseModal.category === category && styles.categoryButtonActive
                  ]}
                  onPress={() => setExpenseModal(prev => ({ ...prev, category }))}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    expenseModal.category === category && styles.categoryButtonTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount *</Text>
            <TextInput
              style={styles.textInput}
              value={expenseModal.amount}
              onChangeText={(text) => setExpenseModal(prev => ({ ...prev, amount: text }))}
              placeholder="Enter amount"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              style={styles.textInput}
              value={expenseModal.date}
              onChangeText={(text) => setExpenseModal(prev => ({ ...prev, date: text }))}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Vendor</Text>
            <TextInput
              style={styles.textInput}
              value={expenseModal.vendorId}
              onChangeText={(text) => setExpenseModal(prev => ({ ...prev, vendorId: text }))}
              placeholder="Enter vendor name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Receipt Number</Text>
            <TextInput
              style={styles.textInput}
              value={expenseModal.receiptNumber}
              onChangeText={(text) => setExpenseModal(prev => ({ ...prev, receiptNumber: text }))}
              placeholder="Enter receipt number"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={expenseModal.notes}
              onChangeText={(text) => setExpenseModal(prev => ({ ...prev, notes: text }))}
              placeholder="Add notes..."
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderApprovalModal = () => (
    <Modal
      visible={approvalModal.visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeApprovalModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={closeApprovalModal}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Expense Approval</Text>
          <TouchableOpacity onPress={processApproval}>
            <Text style={styles.modalSave}>Submit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {approvalModal.expense && (
            <View style={styles.approvalInfo}>
              <Text style={styles.approvalDescription}>{approvalModal.expense.description}</Text>
              <Text style={styles.approvalAmount}>
                {currencyUtils.formatSimplePHP(approvalModal.expense.amount)}
              </Text>
              <Text style={styles.approvalCategory}>{approvalModal.expense.category}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Decision</Text>
            <View style={styles.approvalDecisionContainer}>
              <TouchableOpacity
                style={[
                  styles.decisionButton,
                  styles.approveDecisionButton,
                  approvalModal.approvalStatus === 'approved' && styles.decisionButtonActive
                ]}
                onPress={() => setApprovalModal(prev => ({ ...prev, approvalStatus: 'approved' }))}
              >
                <Text style={[
                  styles.decisionButtonText,
                  styles.approveDecisionButtonText,
                  approvalModal.approvalStatus === 'approved' && styles.decisionButtonTextActive
                ]}>
                  APPROVE
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.decisionButton,
                  styles.rejectDecisionButton,
                  approvalModal.approvalStatus === 'rejected' && styles.decisionButtonActive
                ]}
                onPress={() => setApprovalModal(prev => ({ ...prev, approvalStatus: 'rejected' }))}
              >
                <Text style={[
                  styles.decisionButtonText,
                  styles.rejectDecisionButtonText,
                  approvalModal.approvalStatus === 'rejected' && styles.decisionButtonTextActive
                ]}>
                  REJECT
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Approval Notes</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={approvalModal.notes}
              onChangeText={(text) => setApprovalModal(prev => ({ ...prev, notes: text }))}
              placeholder="Add approval notes..."
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
        <Text style={styles.loadingText}>Loading Expenses...</Text>
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
        <Text style={styles.title}>Expense Management</Text>
        <TouchableOpacity onPress={() => openExpenseModal()}>
          <Text style={styles.addButton}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {currencyUtils.formatSimplePHP(
              filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
            )}
          </Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {filteredExpenses.filter(exp => exp.status === 'pending').length}
          </Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {currencyUtils.formatSimplePHP(
              filteredExpenses.filter(exp => exp.status === 'paid').reduce((sum, exp) => sum + exp.amount, 0)
            )}
          </Text>
          <Text style={styles.summaryLabel}>Paid</Text>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search expenses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              statusFilter === 'all' && styles.filterTabActive
            ]}
            onPress={() => setStatusFilter('all')}
          >
            <Text style={[
              styles.filterTabText,
              statusFilter === 'all' && styles.filterTabTextActive
            ]}>
              All
            </Text>
          </TouchableOpacity>
          {['pending', 'paid', 'cancelled'].map((status) => (
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

      {/* Expenses List */}
      <FlatList
        data={filteredExpenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No expenses found</Text>
          </View>
        }
      />

      {renderExpenseModal()}
      {renderApprovalModal()}
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
  addButton: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
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
  expenseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  expenseReceipt: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  expenseAmountText: {
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
  expenseDetails: {
    marginBottom: 12,
  },
  expenseDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  expenseDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  expenseDetailValue: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  expenseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
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
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#3B82F6',
  },
  categoryButtonText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  approvalInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  approvalDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  approvalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  approvalCategory: {
    fontSize: 12,
    color: '#6B7280',
  },
  approvalDecisionContainer: {
    flexDirection: 'row',
  },
  decisionButton: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  decisionButtonActive: {
    borderColor: '#3B82F6',
  },
  approveDecisionButton: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  rejectDecisionButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    marginRight: 0,
  },
  decisionButtonText: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
  approveDecisionButtonText: {
    color: '#10B981',
  },
  rejectDecisionButtonText: {
    color: '#EF4444',
  },
  decisionButtonTextActive: {
    color: '#3B82F6',
  },
});