// Supplier Card Component for InventoryPro
// Displays supplier information with contact details and payment terms

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Supplier } from '@/types/inventory';
import { currencyUtils } from '@/utils/inventoryUtils';

interface SupplierCardProps {
  supplier: Supplier;
  onPress?: (supplier: Supplier) => void;
  onEdit?: (supplier: Supplier) => void;
  onDelete?: (supplier: Supplier) => void;
  onViewOrders?: (supplier: Supplier) => void;
  showActions?: boolean;
  compact?: boolean;
  orderStats?: {
    totalOrders: number;
    totalSpent: number;
    lastOrderDate?: string;
    avgOrderValue: number;
  };
}

export const SupplierCard: React.FC<SupplierCardProps> = ({
  supplier,
  onPress,
  onEdit,
  onDelete,
  onViewOrders,
  showActions = true,
  compact = false,
  orderStats,
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress(supplier);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(supplier);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Supplier',
      `Are you sure you want to delete ${supplier.companyName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(supplier),
        },
      ]
    );
  };

  const handleViewOrders = () => {
    if (onViewOrders) {
      onViewOrders(supplier);
    }
  };

  const getPaymentTermsColor = (terms: string) => {
    switch (terms) {
      case 'COD':
        return '#059669'; // Green - immediate payment
      case 'Net 15':
        return '#3B82F6'; // Blue - short term
      case 'Net 30':
        return '#F59E0B'; // Orange - medium term
      case 'Net 60':
        return '#EF4444'; // Red - longer term
      default:
        return '#6B7280'; // Gray
    }
  };

  const getPaymentTermsLabel = (terms: string) => {
    switch (terms) {
      case 'COD':
        return '💵 Cash on Delivery';
      case 'Net 15':
        return '📅 Payment in 15 days';
      case 'Net 30':
        return '📅 Payment in 30 days';
      case 'Net 60':
        return '📅 Payment in 60 days';
      default:
        return terms;
    }
  };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={handlePress}>
        <View style={styles.compactHeader}>
          <View style={styles.compactTitleSection}>
            <Text style={styles.compactCompanyName}>{supplier.companyName}</Text>
            <View style={[
              styles.compactStatusBadge,
              { backgroundColor: supplier.status === 'active' ? '#D1FAE5' : '#FEE2E2' }
            ]}>
              <Text style={[
                styles.compactStatusText,
                { color: supplier.status === 'active' ? '#065F46' : '#991B1B' }
              ]}>
                {supplier.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.compactContact}>{supplier.contactPerson}</Text>
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactTerms}>
            {getPaymentTermsLabel(supplier.paymentTerms)}
          </Text>
          {orderStats && (
            <Text style={styles.compactStats}>
              {orderStats.totalOrders} orders • {currencyUtils.formatSimplePHP(orderStats.totalSpent)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.companyName}>{supplier.companyName}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: supplier.status === 'active' ? '#D1FAE5' : '#FEE2E2' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: supplier.status === 'active' ? '#065F46' : '#991B1B' }
            ]}>
              {supplier.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Contact Person</Text>
            <Text style={styles.detailValue}>{supplier.contactPerson}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{supplier.phone}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{supplier.email}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Payment Terms</Text>
            <View style={styles.paymentTermsContainer}>
              <View style={[
                styles.paymentTermsIndicator,
                { backgroundColor: getPaymentTermsColor(supplier.paymentTerms) }
              ]} />
              <Text style={styles.paymentTermsText}>
                {getPaymentTermsLabel(supplier.paymentTerms)}
              </Text>
            </View>
          </View>
        </View>

        {orderStats && (
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Total Orders</Text>
              <Text style={styles.detailValue}>{orderStats.totalOrders}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Total Spent</Text>
              <Text style={styles.detailValue}>
                {currencyUtils.formatSimplePHP(orderStats.totalSpent)}
              </Text>
            </View>
          </View>
        )}

        {orderStats && orderStats.lastOrderDate && (
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Last Order</Text>
              <Text style={styles.detailValue}>{orderStats.lastOrderDate}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Avg Order Value</Text>
              <Text style={styles.detailValue}>
                {currencyUtils.formatSimplePHP(orderStats.avgOrderValue)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValue}>
              {new Date(supplier.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Last Updated</Text>
            <Text style={styles.detailValue}>
              {new Date(supplier.updatedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      {showActions && (onEdit || onDelete || onViewOrders) && (
        <View style={styles.actionsContainer}>
          {onViewOrders && (
            <TouchableOpacity style={styles.viewOrdersButton} onPress={handleViewOrders}>
              <Text style={styles.viewOrdersButtonText}>📋 View Orders</Text>
            </TouchableOpacity>
          )}
          {onEdit && (
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Text style={styles.editButtonText}>✏️ Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
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
  companyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  compactCompanyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
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
    fontSize: 10,
    fontWeight: '700',
  },
  compactStatusText: {
    fontSize: 8,
    fontWeight: '700',
  },
  compactContact: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailsGrid: {
    marginBottom: 12,
  },
  compactInfo: {
    marginTop: 4,
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
  compactTerms: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  compactStats: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  paymentTermsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentTermsIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  paymentTermsText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
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
  viewOrdersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  viewOrdersButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F59E0B',
    borderRadius: 6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EF4444',
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});