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
  fetchVouchers,
  fetchVoucherById,
  createVoucher,
  receiveVoucher,
  cancelVoucher,
  fetchActiveSuppliers,
  generateVoucherNumber,
} from '@/services/vouchers.service';
import { fetchActiveProducts } from '@/services/products.service';
import { Plus, FileText, Package, CheckCircle, XCircle, Eye } from 'lucide-react-native';

export default function VouchersScreen() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);

  const loadVouchers = useCallback(async () => {
    setLoading(true);
    const result = await fetchVouchers();
    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      setVouchers(result.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  const handleViewVoucher = async (voucherId: string) => {
    const result = await fetchVoucherById(voucherId);
    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      setSelectedVoucher(result.data);
      setShowDetailModal(true);
    }
  };

  const handleReceiveVoucher = async (voucherId: string) => {
    Alert.alert(
      'Receive Voucher',
      'Are you sure you want to receive this voucher? This will update product stock and create an accounts payable entry.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Receive',
          onPress: async () => {
            const result = await receiveVoucher(voucherId, true);
            if (result.error) {
              Alert.alert('Error', result.error);
            } else {
              Alert.alert('Success', 'Voucher received successfully!');
              setShowDetailModal(false);
              loadVouchers();
            }
          },
        },
      ]
    );
  };

  const handleCancelVoucher = async (voucherId: string) => {
    Alert.alert(
      'Cancel Voucher',
      'Are you sure you want to cancel this voucher?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            const result = await cancelVoucher(voucherId);
            if (result.error) {
              Alert.alert('Error', result.error);
            } else {
              Alert.alert('Success', 'Voucher cancelled successfully!');
              setShowDetailModal(false);
              loadVouchers();
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'received':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received':
        return <CheckCircle size={16} color="#10B981" />;
      case 'cancelled':
        return <XCircle size={16} color="#EF4444" />;
      default:
        return <FileText size={16} color="#F59E0B" />;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading vouchers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Vouchers</Text>
          <Text style={styles.headerSubtitle}>Receive goods from suppliers</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}>
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Voucher List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {vouchers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No vouchers yet</Text>
            <Text style={styles.emptySubtext}>
              Create a voucher to receive goods from suppliers
            </Text>
          </View>
        ) : (
          vouchers.map((voucher) => (
            <TouchableOpacity
              key={voucher.id}
              style={styles.voucherCard}
              onPress={() => handleViewVoucher(voucher.id)}>
              <View style={styles.voucherHeader}>
                <View style={styles.voucherTitleRow}>
                  {getStatusIcon(voucher.status)}
                  <Text style={styles.voucherNumber}>{voucher.voucher_number}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(voucher.status) + '20' },
                  ]}>
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(voucher.status) },
                    ]}>
                    {voucher.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.supplierName}>
                {voucher.suppliers?.name || 'Unknown Supplier'}
              </Text>

              <View style={styles.voucherFooter}>
                <Text style={styles.voucherAmount}>
                  ${voucher.total_amount?.toFixed(2) || '0.00'}
                </Text>
                <Text style={styles.voucherDate}>
                  {new Date(voucher.created_at).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Create Voucher Modal */}
      <CreateVoucherModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          loadVouchers();
        }}
      />

      {/* Voucher Detail Modal */}
      <VoucherDetailModal
        visible={showDetailModal}
        voucher={selectedVoucher}
        onClose={() => setShowDetailModal(false)}
        onReceive={handleReceiveVoucher}
        onCancel={handleCancelVoucher}
        isAdmin={isAdmin}
      />
    </SafeAreaView>
  );
}

// Create Voucher Modal Component
function CreateVoucherModal({ visible, onClose, onSuccess }: any) {
  const { profile } = useAuth();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    const [suppliersResult, productsResult] = await Promise.all([
      fetchActiveSuppliers(),
      fetchActiveProducts(),
    ]);

    if (suppliersResult.data) setSuppliers(suppliersResult.data);
    if (productsResult.data) setProducts(productsResult.data);
  };

  const addItem = (productId: string, quantity: number, unitCost: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const existingIndex = items.findIndex((item) => item.product_id === productId);
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity,
        unit_cost: unitCost,
      };
      setItems(newItems);
    } else {
      setItems([
        ...items,
        {
          product_id: productId,
          product_name: product.name,
          quantity,
          unit_cost: unitCost,
        },
      ]);
    }
    setShowAddItem(false);
  };

  const removeItem = (productId: string) => {
    setItems(items.filter((item) => item.product_id !== productId));
  };

  const handleCreate = async () => {
    if (!selectedSupplier) {
      Alert.alert('Error', 'Please select a supplier');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    setLoading(true);
    const voucherNumberResult = await generateVoucherNumber();
    if (voucherNumberResult.error) {
      Alert.alert('Error', voucherNumberResult.error);
      setLoading(false);
      return;
    }

    const voucherData = {
      voucher_number: voucherNumberResult.data,
      supplier_id: selectedSupplier,
      user_id: profile?.id,
      notes,
      status: 'pending',
    };

    const result = await createVoucher(voucherData, items);
    setLoading(false);

    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      Alert.alert('Success', 'Voucher created successfully!');
      // Reset form
      setSelectedSupplier('');
      setNotes('');
      setItems([]);
      onSuccess();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Voucher</Text>
            <TouchableOpacity onPress={onClose}>
              <XCircle size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Supplier Selection */}
            <Text style={styles.label}>Supplier *</Text>
            <View style={styles.pickerContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {suppliers.map((supplier) => (
                  <TouchableOpacity
                    key={supplier.id}
                    style={[
                      styles.supplierChip,
                      selectedSupplier === supplier.id && styles.supplierChipSelected,
                    ]}
                    onPress={() => setSelectedSupplier(supplier.id)}>
                    <Text
                      style={[
                        styles.supplierChipText,
                        selectedSupplier === supplier.id && styles.supplierChipTextSelected,
                      ]}>
                      {supplier.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Items */}
            <View style={styles.itemsSection}>
              <View style={styles.itemsHeader}>
                <Text style={styles.label}>Items</Text>
                <TouchableOpacity
                  style={styles.addItemButton}
                  onPress={() => setShowAddItem(true)}>
                  <Plus size={16} color="#3B82F6" />
                  <Text style={styles.addItemText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              {items.map((item) => (
                <View key={item.product_id} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.product_name}</Text>
                    <Text style={styles.itemDetails}>
                      Qty: {item.quantity} × ${item.unit_cost.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.itemActions}>
                    <Text style={styles.itemTotal}>
                      ${(item.quantity * item.unit_cost).toFixed(2)}
                    </Text>
                    <TouchableOpacity onPress={() => removeItem(item.product_id)}>
                      <XCircle size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Notes */}
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes (optional)"
              multiline
              numberOfLines={3}
            />

            {/* Total */}
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalAmount}>
                ${items
                  .reduce((sum, item) => sum + item.quantity * item.unit_cost, 0)
                  .toFixed(2)}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreate}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.createButtonText}>Create Voucher</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Add Item Modal */}
        {showAddItem && (
          <AddItemModal
            products={products}
            onAdd={addItem}
            onClose={() => setShowAddItem(false)}
          />
        )}
      </View>
    </Modal>
  );
}

// Add Item Modal Component
function AddItemModal({ products, onAdd, onClose }: any) {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitCost, setUnitCost] = useState('');

  const handleAdd = () => {
    if (!selectedProduct || !quantity || !unitCost) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const qty = parseInt(quantity);
    const cost = parseFloat(unitCost);

    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Invalid quantity');
      return;
    }

    if (isNaN(cost) || cost <= 0) {
      Alert.alert('Error', 'Invalid unit cost');
      return;
    }

    onAdd(selectedProduct, qty, cost);
  };

  return (
    <View style={styles.addItemModal}>
      <View style={styles.addItemContent}>
        <Text style={styles.addItemTitle}>Add Item</Text>

        <Text style={styles.label}>Product *</Text>
        <ScrollView style={styles.productList} showsVerticalScrollIndicator={false}>
          {products.map((product: any) => (
            <TouchableOpacity
              key={product.id}
              style={[
                styles.productItem,
                selectedProduct === product.id && styles.productItemSelected,
              ]}
              onPress={() => setSelectedProduct(product.id)}>
              <Text
                style={[
                  styles.productItemText,
                  selectedProduct === product.id && styles.productItemTextSelected,
                ]}>
                {product.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Quantity *</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          placeholder="Enter quantity"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Unit Cost *</Text>
        <TextInput
          style={styles.input}
          value={unitCost}
          onChangeText={setUnitCost}
          placeholder="Enter unit cost"
          keyboardType="decimal-pad"
        />

        <View style={styles.addItemActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createButton} onPress={handleAdd}>
            <Text style={styles.createButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Voucher Detail Modal Component
function VoucherDetailModal({ visible, voucher, onClose, onReceive, onCancel, isAdmin }: any) {
  if (!voucher) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Voucher Details</Text>
            <TouchableOpacity onPress={onClose}>
              <XCircle size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Voucher Number:</Text>
              <Text style={styles.detailValue}>{voucher.voucher_number}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Supplier:</Text>
              <Text style={styles.detailValue}>{voucher.suppliers?.name}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: getStatusColor(voucher.status) },
                ]}>
                {voucher.status.toUpperCase()}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Amount:</Text>
              <Text style={styles.detailValue}>
                ${voucher.total_amount?.toFixed(2) || '0.00'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Created:</Text>
              <Text style={styles.detailValue}>
                {new Date(voucher.created_at).toLocaleString()}
              </Text>
            </View>

            {voucher.received_date && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Received:</Text>
                <Text style={styles.detailValue}>
                  {new Date(voucher.received_date).toLocaleString()}
                </Text>
              </View>
            )}

            {voucher.notes && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Notes:</Text>
                <Text style={styles.detailValue}>{voucher.notes}</Text>
              </View>
            )}

            <Text style={[styles.label, { marginTop: 16 }]}>Items</Text>
            {voucher.voucher_items?.map((item: any) => (
              <View key={item.id} style={styles.detailItemRow}>
                <Text style={styles.detailItemName}>{item.products?.name}</Text>
                <Text style={styles.detailItemQty}>Qty: {item.quantity}</Text>
                <Text style={styles.detailItemCost}>
                  ${item.unit_cost?.toFixed(2)}
                </Text>
                <Text style={styles.detailItemTotal}>
                  ${item.subtotal?.toFixed(2)}
                </Text>
              </View>
            ))}
          </ScrollView>

          {isAdmin && voucher.status === 'pending' && (
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { flex: 1 }]}
                onPress={() => onCancel(voucher.id)}>
                <Text style={styles.cancelButtonText}>Cancel Voucher</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, { flex: 1 }]}
                onPress={() => onReceive(voucher.id)}>
                <Text style={styles.createButtonText}>Receive</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return '#F59E0B';
    case 'received':
      return '#10B981';
    case 'cancelled':
      return '#EF4444';
    default:
      return '#6B7280';
  }
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
  addButton: {
    backgroundColor: '#3B82F6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  voucherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  voucherTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voucherNumber: {
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
    fontSize: 12,
    fontWeight: '600',
  },
  supplierName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  voucherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voucherAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  voucherDate: {
    fontSize: 12,
    color: '#9CA3AF',
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  supplierChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
  },
  supplierChipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  supplierChipText: {
    fontSize: 14,
    color: '#374151',
  },
  supplierChipTextSelected: {
    color: '#FFFFFF',
  },
  itemsSection: {
    marginBottom: 16,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addItemText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
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
  createButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addItemModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addItemContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  addItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  productList: {
    maxHeight: 150,
    marginBottom: 16,
  },
  productItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 8,
  },
  productItemSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  productItemText: {
    fontSize: 14,
    color: '#374151',
  },
  productItemTextSelected: {
    color: '#FFFFFF',
  },
  addItemActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  detailItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  detailItemName: {
    flex: 2,
    fontSize: 14,
    color: '#111827',
  },
  detailItemQty: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  detailItemCost: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  detailItemTotal: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    textAlign: 'right',
  },
});
