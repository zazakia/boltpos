// Purchase Order Form Modal for InventoryPro
// Handles creation and editing of purchase orders

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { PurchaseOrder } from '@/types/inventory';
import { dataManagerService } from '@/services/dataManager.service';
import { currencyUtils, dateUtils } from '@/utils/inventoryUtils';

interface Supplier {
  id: string;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  payment_terms: string;
  status: string;
}

interface Product {
  id: string;
  name: string;
  base_price: number;
  base_uom: string;
}

interface LocalPurchaseOrderItem {
  id?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: Product;
}

interface PurchaseOrderFormModalProps {
  visible: boolean;
  purchaseOrder?: PurchaseOrder | null;
  suppliers: Supplier[];
  products: Product[];
  onSave: (purchaseOrder: Partial<PurchaseOrder>) => Promise<void>;
  onCancel: () => void;
}

type POStatus = 'draft' | 'pending' | 'ordered' | 'received' | 'cancelled';

export const PurchaseOrderFormModal: React.FC<PurchaseOrderFormModalProps> = ({
  visible,
  purchaseOrder,
  suppliers,
  products,
  onSave,
  onCancel,
}) => {
  // Form state
  const [loading, setLoading] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<POStatus>('draft');
  
  // Items state
  const [items, setItems] = useState<LocalPurchaseOrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');

  // Effects
  useEffect(() => {
    if (purchaseOrder) {
      // Edit mode - populate form
      setSupplierId(purchaseOrder.supplierId);
      setExpectedDeliveryDate(purchaseOrder.expectedDeliveryDate || '');
      setNotes(purchaseOrder.notes || '');
      setStatus(purchaseOrder.status || 'draft');
      setItems(purchaseOrder.items || []);
    } else {
      // Create mode - reset form
      resetForm();
    }
  }, [purchaseOrder, visible]);

  // Reset form
  const resetForm = () => {
    setSupplierId('');
    setExpectedDeliveryDate('');
    setNotes('');
    setStatus('draft');
    setItems([]);
    setSelectedProductId('');
    setQuantity('');
    setUnitPrice('');
  };

  // Add item to order
  const addItem = () => {
    if (!selectedProductId || !quantity || !unitPrice) {
      Alert.alert('Error', 'Please fill in all item fields');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) {
      Alert.alert('Error', 'Product not found');
      return;
    }

    const qty = parseFloat(quantity);
    const price = parseFloat(unitPrice);
    
    if (isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
      Alert.alert('Error', 'Please enter valid quantity and price');
      return;
    }

    const newItem: LocalPurchaseOrderItem = {
      productId: selectedProductId,
      quantity: qty,
      unitPrice: price,
      subtotal: qty * price,
      product,
    };

    setItems([...items, newItem]);
    
    // Reset item fields
    setSelectedProductId('');
    setQuantity('');
    setUnitPrice('');
  };

  // Remove item from order
  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // Calculate totals
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItems = items.length;

  // Handle save
  const handleSave = async () => {
    if (!supplierId) {
      Alert.alert('Error', 'Please select a supplier');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item to the order');
      return;
    }

    setLoading(true);

    try {
      const purchaseOrderData: Partial<PurchaseOrder> = {
        supplierId,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        notes: notes || '',
        status,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        } as import('@/types/inventory').PurchaseOrderItem)),
        totalAmount,
        poNumber: purchaseOrder?.poNumber || `PO-${Date.now()}`,
        id: purchaseOrder?.id,
      };

      await onSave(purchaseOrderData);
      resetForm();
    } catch (error) {
      console.error('Error saving purchase order:', error);
      Alert.alert('Error', 'Failed to save purchase order');
    } finally {
      setLoading(false);
    }
  };

  // Render form sections
  const renderBasicInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Order Information</Text>
      
      {/* Supplier Selection */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Supplier *</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.supplierScroll}
        >
          {suppliers.map(supplier => (
            <TouchableOpacity
              key={supplier.id}
              style={[
                styles.supplierChip,
                supplierId === supplier.id && styles.supplierChipSelected,
              ]}
              onPress={() => setSupplierId(supplier.id)}
            >
              <Text style={[
                styles.supplierChipText,
                supplierId === supplier.id && styles.supplierChipTextSelected,
              ]}>
                {supplier.company_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Expected Delivery Date */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Expected Delivery Date</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD (optional)"
          value={expectedDeliveryDate}
          onChangeText={setExpectedDeliveryDate}
        />
      </View>

      {/* Status */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Status</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statusScroll}
        >
          {['draft', 'pending', 'ordered', 'received', 'cancelled'].map(statusOption => (
            <TouchableOpacity
              key={statusOption}
              style={[
                styles.statusChip,
                status === statusOption && styles.statusChipSelected,
              ]}
              onPress={() => setStatus(statusOption as POStatus)}
            >
              <Text style={[
                styles.statusChipText,
                status === statusOption && styles.statusChipTextSelected,
              ]}>
                {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Notes */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Add notes or special instructions..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  const renderItemsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Order Items</Text>
      
      {/* Add Item */}
      <View style={styles.addItemContainer}>
        <Text style={styles.inputLabel}>Add Product</Text>
        
        {/* Product Selection */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.productScroll}
        >
          {products.map(product => (
            <TouchableOpacity
              key={product.id}
              style={[
                styles.productChip,
                selectedProductId === product.id && styles.productChipSelected,
              ]}
              onPress={() => {
                setSelectedProductId(product.id);
                setUnitPrice(product.base_price.toString());
              }}
            >
              <Text style={[
                styles.productChipText,
                selectedProductId === product.id && styles.productChipTextSelected,
              ]}>
                {product.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quantity and Price Inputs */}
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Unit Price (₱)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={unitPrice}
              onChangeText={setUnitPrice}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={addItem}>
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      {items.length > 0 && (
        <View style={styles.itemsList}>
          <Text style={styles.itemsHeader}>
            Items ({totalItems}) - {currencyUtils.formatSimplePHP(totalAmount)}
          </Text>
          
          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product?.name}</Text>
                <Text style={styles.itemDetails}>
                  {item.quantity} × {currencyUtils.formatSimplePHP(item.unitPrice)}
                </Text>
              </View>
              
              <View style={styles.itemActions}>
                <Text style={styles.itemTotal}>
                  {currencyUtils.formatSimplePHP(item.subtotal)}
                </Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeItem(index)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>
            {purchaseOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}
          </Text>
          
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderBasicInfo()}
          {renderItemsSection()}
        </ScrollView>

        {/* Total Summary */}
        {items.length > 0 && (
          <View style={styles.totalBar}>
            <View style={styles.totalInfo}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                {currencyUtils.formatSimplePHP(totalAmount)}
              </Text>
            </View>
            <Text style={styles.totalItems}>
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  supplierScroll: {
    marginTop: 8,
  },
  supplierChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  supplierChipSelected: {
    backgroundColor: '#3B82F6',
  },
  supplierChipText: {
    fontSize: 14,
    color: '#374151',
  },
  supplierChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  statusScroll: {
    marginTop: 8,
  },
  statusChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  statusChipSelected: {
    backgroundColor: '#059669',
  },
  statusChipText: {
    fontSize: 12,
    color: '#374151',
  },
  statusChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  addItemContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  productScroll: {
    marginTop: 8,
    marginBottom: 12,
  },
  productChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  productChipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  productChipText: {
    fontSize: 12,
    color: '#374151',
  },
  productChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  itemsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemsHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  itemDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  removeButton: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 12,
    color: '#DC2626',
  },
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  totalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  totalItems: {
    fontSize: 14,
    color: '#6B7280',
  },
});