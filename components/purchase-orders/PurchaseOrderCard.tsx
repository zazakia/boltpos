// Purchase Order Card Component for InventoryPro
// Displays purchase order information with status tracking and inventory integration

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { PurchaseOrder, PurchaseOrderItem } from '@/types/inventory';
import { currencyUtils, dateUtils } from '@/utils/inventoryUtils';

interface PurchaseOrderCardProps {
  purchaseOrder: PurchaseOrder & {
    suppliers?: { 
      id: string; 
      companyName: string; 
      contactPerson: string; 
      paymentTerms: string; 
    };
    products?: Array<{
      id: string;
      name: string;
      category: string;
    }>;
  };
  onPress?: (purchaseOrder: PurchaseOrder) => void;
  onEdit?: (purchaseOrder: PurchaseOrder) => void;
  onDelete?: (purchaseOrder: PurchaseOrder) => void;
  onReceive?: (purchaseOrder: PurchaseOrder) => void;
  onCancel?: (purchaseOrder: PurchaseOrder) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const PurchaseOrderCard: React.FC<PurchaseOrderCardProps> = ({
  purchaseOrder,
  onPress,
  onEdit,
  onDelete,
  onReceive,
  onCancel,
  showActions = true,
  compact = false,
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress(purchaseOrder);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(purchaseOrder);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Purchase Order',
      `Are you sure you want to delete PO ${purchaseOrder.poNumber}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(purchaseOrder),
        },
      ]
    );
  };

  const handleReceive = () => {
    if (onReceive) {
      onReceive(purchaseOrder);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Purchase Order',
      `Are you sure you want to cancel PO ${purchaseOrder.poNumber}?`,
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: () => onCancel?.(purchaseOrder),
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return {
          text: '#6B7280', // Gray
          background: '#F3F4F6',
          border: '#D1D5DB',
          icon: '📄',
        };
      case 'pending':
        return {
          text: '#F59E0B', // Orange
          background: '#FEF3C7',
          border: '#FDE68A',
          icon: '⏳',
        };
      case 'ordered':
        return {
          text: '#3B82F6', // Blue
          background: '#DBEAFE',
          border: '#BFDBFE',
          icon: '📋',
        };
      case 'received':
        return {
          text: '#059669', // Green
          background: '#D1FAE5',
          border: '#A7F3D0',
          icon: '✅',
        };
      case 'cancelled':
        return {
          text: '#DC2626', // Red
          background: '#FEE2E2',
          border: '#FECACA',
          icon: '❌',
        };
      default:
        return {
          text: '#6B7280', // Gray
          background: '#F3F4F6',
          border: '#D1D5DB',
          icon: '📄',
        };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'pending':
        return 'Pending Approval';
      case 'ordered':
        return 'Sent to Supplier';
      case 'received':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getTotalItems = () => {
    return purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getUniqueProducts = () => {
    return purchaseOrder.items.length;
  };

  const getPaymentTermsInfo = (terms: string) => {
    const termData = getStatusColor(terms === 'COD' ? 'pending' : terms);
    return {
      label: terms,
      color: termData.text,
      background: termData.background,
    };
  };

  const statusData = getStatusColor(purchaseOrder.status);
  const paymentData = getPaymentTermsInfo(purchaseOrder.suppliers?.paymentTerms || 'Net 30');
  const totalItems = getTotalItems();
  const uniqueProducts = getUniqueProducts();

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={handlePress}>
        <View style={styles.compactHeader}>
          <View style={styles.compactTitleSection}>
            <Text style={styles.compactPoNumber}>{purchaseOrder.poNumber}</Text>
            <View style={[
              styles.compactStatusBadge,
              { backgroundColor: statusData.background }
            ]}>
              <Text style={[
                styles.compactStatusText,
                { color: statusData.text }
              ]}>
                {statusData.icon} {getStatusLabel(purchaseOrder.status)}
              </Text>
            </View>
          </View>
          <Text style={styles.compactSupplier}>
            {purchaseOrder.suppliers?.companyName || 'Unknown Supplier'}
          </Text>
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactAmount}>
            {currencyUtils.formatSimplePHP(purchaseOrder.totalAmount)}
          </Text>
          <Text style={styles.compactDetails}>
            {totalItems} items • {uniqueProducts} products
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.poNumber}>PO #{purchaseOrder.poNumber}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: statusData.background }
          ]}>
            <Text style={[
              styles.statusText,
              { color: statusData.text }
            ]}>
              {statusData.icon} {getStatusLabel(purchaseOrder.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.supplier}>
          {purchaseOrder.suppliers?.companyName || 'Unknown Supplier'} • 
          Contact: {purchaseOrder.suppliers?.contactPerson || 'N/A'}
        </Text>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Total Amount</Text>
            <Text style={[styles.detailValue, { fontWeight: '700', fontSize: 16 }]}>
              {currencyUtils.formatSimplePHP(purchaseOrder.totalAmount)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Items / Products</Text>
            <Text style={styles.detailValue}>
              {totalItems} items • {uniqueProducts} unique products
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Expected Delivery</Text>
            <Text style={styles.detailValue}>
              {purchaseOrder.expectedDeliveryDate 
                ? dateUtils.formatDate(purchaseOrder.expectedDeliveryDate)
                : 'Not specified'
              }
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Payment Terms</Text>
            <View style={styles.paymentTermsContainer}>
              <Text style={[
                styles.paymentTermsText,
                { color: paymentData.color }
              ]}>
                💳 {paymentData.label}
              </Text>
            </View>
          </View>
        </View>

        {purchaseOrder.actualDeliveryDate && (
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Actual Delivery</Text>
              <Text style={[styles.detailValue, { color: '#059669' }]}>
                ✅ {dateUtils.formatDate(purchaseOrder.actualDeliveryDate)}
              </Text>
            </View>
          </View>
        )}

        {purchaseOrder.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{purchaseOrder.notes}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValue}>
              {dateUtils.formatDate(purchaseOrder.createdAt)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Updated</Text>
            <Text style={styles.detailValue}>
              {dateUtils.formatDate(purchaseOrder.updatedAt)}
            </Text>
          </View>
        </View>
      </View>

      {/* Inventory Integration Indicator */}
      {purchaseOrder.status === 'received' && (
        <View style={styles.inventoryIntegration}>
          <Text style={styles.integrationText}>
            📦 Auto-created inventory batches for {uniqueProducts} products
          </Text>
        </View>
      )}

      {showActions && (onEdit || onDelete || onReceive || onCancel) && (
        <View style={styles.actionsContainer}>
          {purchaseOrder.status === 'draft' && onEdit && (
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Text style={styles.editButtonText}>✏️ Edit</Text>
            </TouchableOpacity>
          )}
          
          {(purchaseOrder.status === 'pending' || purchaseOrder.status === 'ordered') && onCancel && (
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>❌ Cancel</Text>
            </TouchableOpacity>
          )}
          
          {purchaseOrder.status === 'ordered' && onReceive && (
            <TouchableOpacity style={styles.receiveButton} onPress={handleReceive}>
              <Text style={styles.receiveButtonText}>📦 Mark Received</Text>
            </TouchableOpacity>
          )}
          
          {onDelete && purchaseOrder.status === 'draft' && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  compactContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    marginBottom: 12,
  },
  compactHeader: {
    marginBottom: 8,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  compactTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  poNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  compactPoNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compactStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  compactStatusText: {
    fontSize: 9,
    fontWeight: '600',
  },
  supplier: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  compactSupplier: {
    fontSize: 12,
    color: '#6B7280',
  },
  detailsGrid: {
    marginBottom: 12,
  },
  compactInfo: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  compactAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  compactDetails: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  paymentTermsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentTermsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notesSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  inventoryIntegration: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  integrationText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '500',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EF4444',
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  receiveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#059669',
    borderRadius: 6,
  },
  receiveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#DC2626',
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});