import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchAccountsPayable,
  updatePayablePayment,
} from '@/services/vouchers.service';
import { DollarSign, CreditCard, AlertCircle, CheckCircle, XCircle } from 'lucide-react-native';

export default function PayablesScreen() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [payables, setPayables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'partially_paid' | 'paid'>('all');

  const loadPayables = useCallback(async () => {
    setLoading(true);
    const result = await fetchAccountsPayable();
    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      setPayables(result.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPayables();
  }, [loadPayables]);

  const handleMakePayment = (payable: any) => {
    setSelectedPayable(payable);
    setShowPaymentModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unpaid':
        return '#EF4444';
      case 'partially_paid':
        return '#F59E0B';
      case 'paid':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unpaid':
        return <AlertCircle size={16} color="#EF4444" />;
      case 'partially_paid':
        return <DollarSign size={16} color="#F59E0B" />;
      case 'paid':
        return <CheckCircle size={16} color="#10B981" />;
      default:
        return null;
    }
  };

  const filteredPayables = payables.filter((payable) => {
    if (filter === 'all') return true;
    return payable.status === filter;
  });

  const totalUnpaid = payables
    .filter((p) => p.status !== 'paid')
    .reduce((sum, p) => sum + parseFloat(p.balance || 0), 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading payables...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Accounts Payable</Text>
          <Text style={styles.headerSubtitle}>Track supplier payments</Text>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summarySection}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <DollarSign size={24} color="#EF4444" />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Total Outstanding</Text>
            <Text style={styles.summaryAmount}>${totalUnpaid.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <CreditCard size={24} color="#3B82F6" />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Total Payables</Text>
            <Text style={styles.summaryAmount}>{payables.length}</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}>
        {['all', 'unpaid', 'partially_paid', 'paid'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterTab,
              filter === status && styles.filterTabActive,
            ]}
            onPress={() => setFilter(status as any)}>
            <Text
              style={[
                styles.filterTabText,
                filter === status && styles.filterTabTextActive,
              ]}>
              {status === 'all'
                ? 'All'
                : status === 'unpaid'
                ? 'Unpaid'
                : status === 'partially_paid'
                ? 'Partial'
                : 'Paid'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Payables List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredPayables.length === 0 ? (
          <View style={styles.emptyContainer}>
            <DollarSign size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No payables found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all'
                ? 'Create vouchers to generate payables'
                : `No ${filter.replace('_', ' ')} payables`}
            </Text>
          </View>
        ) : (
          filteredPayables.map((payable) => (
            <View key={payable.id} style={styles.payableCard}>
              <View style={styles.payableHeader}>
                <View style={styles.payableTitleRow}>
                  {getStatusIcon(payable.status)}
                  <Text style={styles.supplierName}>
                    {payable.suppliers?.name || 'Unknown Supplier'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(payable.status) + '20' },
                  ]}>
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(payable.status) },
                    ]}>
                    {payable.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              {payable.vouchers && (
                <Text style={styles.voucherNumber}>
                  Voucher: {payable.vouchers.voucher_number}
                </Text>
              )}

              <View style={styles.amountSection}>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Amount Due:</Text>
                  <Text style={styles.amountValue}>
                    ${parseFloat(payable.amount_due || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Amount Paid:</Text>
                  <Text style={[styles.amountValue, { color: '#10B981' }]}>
                    ${parseFloat(payable.amount_paid || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.amountRow, styles.balanceRow]}>
                  <Text style={styles.balanceLabel}>Balance:</Text>
                  <Text style={styles.balanceValue}>
                    ${parseFloat(payable.balance || 0).toFixed(2)}
                  </Text>
                </View>
              </View>

              {payable.payment_date && (
                <Text style={styles.paymentDate}>
                  Paid on: {new Date(payable.payment_date).toLocaleDateString()}
                </Text>
              )}

              {isAdmin && payable.status !== 'paid' && (
                <TouchableOpacity
                  style={styles.payButton}
                  onPress={() => handleMakePayment(payable)}>
                  <CreditCard size={16} color="#FFFFFF" />
                  <Text style={styles.payButtonText}>Make Payment</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.createdDate}>
                Created: {new Date(payable.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Payment Modal */}
      <PaymentModal
        visible={showPaymentModal}
        payable={selectedPayable}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedPayable(null);
        }}
        onSuccess={() => {
          setShowPaymentModal(false);
          setSelectedPayable(null);
          loadPayables();
        }}
      />
    </SafeAreaView>
  );
}

// Payment Modal Component
function PaymentModal({ visible, payable, onClose, onSuccess }: any) {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (payable) {
      setPaymentAmount('');
    }
  }, [payable]);

  const handleSubmit = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    const amount = parseFloat(paymentAmount);
    const balance = parseFloat(payable.balance || 0);

    if (amount > balance) {
      Alert.alert('Error', 'Payment amount cannot exceed the balance');
      return;
    }

    setLoading(true);
    const result = await updatePayablePayment(payable.id, amount);
    setLoading(false);

    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      Alert.alert('Success', 'Payment recorded successfully!');
      setPaymentAmount('');
      onSuccess();
    }
  };

  if (!payable) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Record Payment</Text>
            <TouchableOpacity onPress={onClose}>
              <XCircle size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.payableInfo}>
              <Text style={styles.infoLabel}>Supplier:</Text>
              <Text style={styles.infoValue}>
                {payable.suppliers?.name || 'Unknown'}
              </Text>
            </View>

            {payable.vouchers && (
              <View style={styles.payableInfo}>
                <Text style={styles.infoLabel}>Voucher:</Text>
                <Text style={styles.infoValue}>
                  {payable.vouchers.voucher_number}
                </Text>
              </View>
            )}

            <View style={styles.payableInfo}>
              <Text style={styles.infoLabel}>Amount Due:</Text>
              <Text style={styles.infoValue}>
                ${parseFloat(payable.amount_due || 0).toFixed(2)}
              </Text>
            </View>

            <View style={styles.payableInfo}>
              <Text style={styles.infoLabel}>Amount Paid:</Text>
              <Text style={styles.infoValue}>
                ${parseFloat(payable.amount_paid || 0).toFixed(2)}
              </Text>
            </View>

            <View style={[styles.payableInfo, styles.balanceInfo]}>
              <Text style={styles.balanceInfoLabel}>Outstanding Balance:</Text>
              <Text style={styles.balanceInfoValue}>
                ${parseFloat(payable.balance || 0).toFixed(2)}
              </Text>
            </View>

            <Text style={styles.label}>Payment Amount *</Text>
            <TextInput
              style={styles.input}
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              placeholder="Enter payment amount"
              keyboardType="decimal-pad"
            />

            <View style={styles.quickAmounts}>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() =>
                  setPaymentAmount((parseFloat(payable.balance || 0) / 2).toFixed(2))
                }>
                <Text style={styles.quickButtonText}>Half</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() =>
                  setPaymentAmount(parseFloat(payable.balance || 0).toFixed(2))
                }>
                <Text style={styles.quickButtonText}>Full</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Record Payment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  summarySection: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  payableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  payableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  payableTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  voucherNumber: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  amountSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  balanceRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: 0,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  paymentDate: {
    fontSize: 12,
    color: '#10B981',
    marginBottom: 8,
  },
  createdDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  payableInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  balanceInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  balanceInfoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  balanceInfoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
