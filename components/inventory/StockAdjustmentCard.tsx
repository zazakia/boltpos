// Stock Adjustment Card Component for InventoryPro
// Handles stock adjustments and transfers between warehouses

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Product, Warehouse, InventoryItem } from '@/types/inventory';
import { currencyUtils, dateUtils } from '@/utils/inventoryUtils';

interface StockAdjustmentCardProps {
  products: Product[];
  warehouses: Warehouse[];
  selectedProduct?: Product;
  selectedWarehouse?: Warehouse;
  onAdjustStock?: (adjustment: StockAdjustment) => void;
  onTransferStock?: (transfer: StockTransfer) => void;
  onClose?: () => void;
}

export interface StockAdjustment {
  type: 'increase' | 'decrease' | 'expired' | 'damaged';
  productId: string;
  warehouseId: string;
  quantity: number;
  reason: string;
  unitCost?: number;
  newBatch?: {
    batchNumber: string;
    expiryDate: string;
  };
}

export interface StockTransfer {
  fromWarehouseId: string;
  toWarehouseId: string;
  productId: string;
  quantity: number;
  reason: string;
  transferDate?: string;
}

export const StockAdjustmentCard: React.FC<StockAdjustmentCardProps> = ({
  products,
  warehouses,
  selectedProduct,
  selectedWarehouse,
  onAdjustStock,
  onTransferStock,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'adjust' | 'transfer'>('adjust');
  const [adjustment, setAdjustment] = useState<StockAdjustment>({
    type: 'increase',
    productId: selectedProduct?.id || '',
    warehouseId: selectedWarehouse?.id || '',
    quantity: 0,
    reason: '',
    unitCost: 0,
  });

  const [transfer, setTransfer] = useState<StockTransfer>({
    fromWarehouseId: selectedWarehouse?.id || '',
    toWarehouseId: '',
    productId: selectedProduct?.id || '',
    quantity: 0,
    reason: '',
  });

  const generateBatchNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BATCH-${timestamp}-${random}`;
  };

  const generateExpiryDate = (shelfLifeDays: number = 365) => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + shelfLifeDays);
    return dateUtils.formatDate(expiryDate.toISOString());
  };

  const handleAdjustmentSubmit = () => {
    if (!adjustment.productId || !adjustment.warehouseId || adjustment.quantity <= 0 || !adjustment.reason.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const adjustedAdjustment = {
      ...adjustment,
      newBatch: adjustment.type === 'increase' ? {
        batchNumber: generateBatchNumber(),
        expiryDate: generateExpiryDate(365), // Default 1 year shelf life
      } : undefined,
    };

    if (onAdjustStock) {
      onAdjustStock(adjustedAdjustment);
    }
  };

  const handleTransferSubmit = () => {
    if (!transfer.fromWarehouseId || !transfer.toWarehouseId || !transfer.productId || 
        transfer.quantity <= 0 || !transfer.reason.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (transfer.fromWarehouseId === transfer.toWarehouseId) {
      Alert.alert('Error', 'Source and destination warehouses cannot be the same');
      return;
    }

    if (onTransferStock) {
      onTransferStock(transfer);
    }
  };

  const renderAdjustmentForm = () => (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
      {/* Product Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Product *</Text>
        <TouchableOpacity
          style={styles.pickerContainer}
          onPress={() => {/* Show product picker modal */}}
        >
          <Text style={styles.pickerText}>
            {products.find(p => p.id === adjustment.productId)?.name || 'Select Product'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Warehouse Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Warehouse *</Text>
        <TouchableOpacity
          style={styles.pickerContainer}
          onPress={() => {/* Show warehouse picker modal */}}
        >
          <Text style={styles.pickerText}>
            {warehouses.find(w => w.id === adjustment.warehouseId)?.name || 'Select Warehouse'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Adjustment Type */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Adjustment Type *</Text>
        <View style={styles.typeButtonsContainer}>
          {[
            { key: 'increase', label: 'Increase Stock', color: '#10B981', icon: '📦' },
            { key: 'decrease', label: 'Decrease Stock', color: '#EF4444', icon: '🗑️' },
            { key: 'expired', label: 'Mark Expired', color: '#7C2D12', icon: '⛔' },
            { key: 'damaged', label: 'Mark Damaged', color: '#B91C1C', icon: '💔' },
          ].map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.typeButton,
                adjustment.type === type.key && { backgroundColor: type.color }
              ]}
              onPress={() => setAdjustment(prev => ({ ...prev, type: type.key as any }))}
            >
              <Text style={styles.typeButtonIcon}>{type.icon}</Text>
              <Text style={[
                styles.typeButtonText,
                adjustment.type === type.key && { color: '#FFFFFF' }
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quantity */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Quantity *</Text>
        <TextInput
          style={styles.textInput}
          value={adjustment.quantity.toString()}
          onChangeText={(text) => setAdjustment(prev => ({ ...prev, quantity: parseInt(text) || 0 }))}
          keyboardType="numeric"
          placeholder="Enter quantity"
        />
      </View>

      {/* Unit Cost (for increases only) */}
      {adjustment.type === 'increase' && (
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Unit Cost (₱) *</Text>
          <TextInput
            style={styles.textInput}
            value={adjustment.unitCost?.toString() || ''}
            onChangeText={(text) => setAdjustment(prev => ({ ...prev, unitCost: parseFloat(text) || 0 }))}
            keyboardType="numeric"
            placeholder="Enter unit cost"
          />
        </View>
      )}

      {/* Reason */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Reason *</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={adjustment.reason}
          onChangeText={(text) => setAdjustment(prev => ({ ...prev, reason: text }))}
          multiline
          placeholder="Explain the reason for this adjustment"
          numberOfLines={3}
        />
      </View>

      {/* New Batch Information (for increases) */}
      {adjustment.type === 'increase' && adjustment.unitCost && adjustment.unitCost > 0 && (
        <View style={styles.batchInfoContainer}>
          <Text style={styles.batchInfoTitle}>New Batch Information</Text>
          <Text style={styles.batchInfoText}>Batch Number: {generateBatchNumber()}</Text>
          <Text style={styles.batchInfoText}>Expiry Date: {generateExpiryDate(365)}</Text>
          <Text style={styles.batchInfoText}>Received Date: {dateUtils.formatDate(new Date().toISOString())}</Text>
        </View>
      )}

      {/* FIFO Impact Warning */}
      {(adjustment.type === 'decrease' || adjustment.type === 'expired' || adjustment.type === 'damaged') && (
        <View style={styles.fifoWarningContainer}>
          <Text style={styles.fifoWarningIcon}>⚠️</Text>
          <Text style={styles.fifoWarningText}>
            This adjustment will affect FIFO stock rotation and may impact existing batch priorities.
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const renderTransferForm = () => (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
      {/* Product Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Product *</Text>
        <TouchableOpacity
          style={styles.pickerContainer}
          onPress={() => {/* Show product picker modal */}}
        >
          <Text style={styles.pickerText}>
            {products.find(p => p.id === transfer.productId)?.name || 'Select Product'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Source Warehouse */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>From Warehouse *</Text>
        <TouchableOpacity
          style={styles.pickerContainer}
          onPress={() => {/* Show warehouse picker modal */}}
        >
          <Text style={styles.pickerText}>
            {warehouses.find(w => w.id === transfer.fromWarehouseId)?.name || 'Select Source Warehouse'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Destination Warehouse */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>To Warehouse *</Text>
        <TouchableOpacity
          style={styles.pickerContainer}
          onPress={() => {/* Show warehouse picker modal */}}
        >
          <Text style={styles.pickerText}>
            {warehouses.find(w => w.id === transfer.toWarehouseId)?.name || 'Select Destination Warehouse'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quantity */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Quantity to Transfer *</Text>
        <TextInput
          style={styles.textInput}
          value={transfer.quantity.toString()}
          onChangeText={(text) => setTransfer(prev => ({ ...prev, quantity: parseInt(text) || 0 }))}
          keyboardType="numeric"
          placeholder="Enter quantity to transfer"
        />
      </View>

      {/* Transfer Date */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Transfer Date</Text>
        <TouchableOpacity
          style={styles.pickerContainer}
          onPress={() => {/* Show date picker */}}
        >
          <Text style={styles.pickerText}>
            {transfer.transferDate ? dateUtils.formatDate(transfer.transferDate) : 'Today'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reason */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Reason *</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={transfer.reason}
          onChangeText={(text) => setTransfer(prev => ({ ...prev, reason: text }))}
          multiline
          placeholder="Explain the reason for this transfer"
          numberOfLines={3}
        />
      </View>

      {/* FIFO Impact Warning */}
      <View style={styles.fifoWarningContainer}>
        <Text style={styles.fifoWarningIcon}>⚠️</Text>
        <Text style={styles.fifoWarningText}>
          Transfer will maintain FIFO order. Items will be transferred in chronological order based on received date.
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Stock Adjustment</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'adjust' && styles.activeTab]}
            onPress={() => setActiveTab('adjust')}
          >
            <Text style={[styles.tabText, activeTab === 'adjust' && styles.activeTabText]}>
              Adjust Stock
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'transfer' && styles.activeTab]}
            onPress={() => setActiveTab('transfer')}
          >
            <Text style={[styles.tabText, activeTab === 'transfer' && styles.activeTabText]}>
              Transfer Stock
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'adjust' ? renderAdjustmentForm() : renderTransferForm()}

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={activeTab === 'adjust' ? handleAdjustmentSubmit : handleTransferSubmit}
          >
            <Text style={styles.submitButtonText}>
              {activeTab === 'adjust' ? 'Apply Adjustment' : 'Transfer Stock'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerText: {
    fontSize: 14,
    color: '#111827',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  typeButtonIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  typeButtonText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  batchInfoContainer: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  batchInfoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0C4A6E',
    marginBottom: 8,
  },
  batchInfoText: {
    fontSize: 11,
    color: '#075985',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  fifoWarningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  fifoWarningIcon: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },
  fifoWarningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  submitButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});