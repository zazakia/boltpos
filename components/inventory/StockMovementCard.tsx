// Stock Movement Card Component for InventoryPro
// Displays inventory movement history with FIFO tracking

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StockMovement } from '@/types/inventory';
import { currencyUtils, dateUtils } from '@/utils/inventoryUtils';

interface StockMovementCardProps {
  movement: StockMovement & {
    products?: { id: string; name: string; price: number };
    warehouses?: { id: string; name: string };
    inventory_items?: {
      id: string;
      batchNumber: string;
      expiryDate?: string;
      products: { id: string; name: string };
    };
  };
  onPress?: (movement: StockMovement) => void;
  showBatchDetails?: boolean;
  compact?: boolean;
}

export const StockMovementCard: React.FC<StockMovementCardProps> = ({
  movement,
  onPress,
  showBatchDetails = true,
  compact = false,
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress(movement);
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return '📦'; // Received/Added stock
      case 'sale':
        return '🛒'; // Sold/Deducted stock
      case 'transfer':
        return '🚚'; // Transfer between warehouses
      case 'adjustment':
        return '⚙️'; // Stock adjustment
      case 'expired':
        return '⛔'; // Expired items removed
      default:
        return '📋';
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'in':
        return {
          text: '#059669', // Green
          background: '#D1FAE5',
          border: '#A7F3D0',
        };
      case 'out':
        return {
          text: '#DC2626', // Red
          background: '#FEE2E2',
          border: '#FECACA',
        };
      case 'transfer':
        return {
          text: '#2563EB', // Blue
          background: '#DBEAFE',
          border: '#BFDBFE',
        };
      case 'adjustment':
        return {
          text: '#F59E0B', // Orange
          background: '#FEF3C7',
          border: '#FDE68A',
        };
      case 'expired':
      case 'damaged':
        return {
          text: '#7C2D12', // Dark red/brown
          background: '#FEF7ED',
          border: '#FED7AA',
        };
      default:
        return {
          text: '#6B7280', // Gray
          background: '#F9FAFB',
          border: '#E5E7EB',
        };
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'in':
        return 'Stock Received';
      case 'out':
        return 'Stock Sold';
      case 'transfer':
        return 'Stock Transfer';
      case 'adjustment':
        return 'Stock Adjustment';
      case 'expired':
        return 'Expired Items';
      case 'damaged':
        return 'Damaged Items';
      default:
        return 'Stock Movement';
    }
  };

  const getFifoPriority = () => {
    // FIFO priority calculation based on expiry date
    if (movement.type === 'sale' && movement.inventory_items?.expiryDate) {
      const expiryDate = movement.inventory_items.expiryDate;
      const daysUntilExpiry = dateUtils.getDaysUntilExpiry(expiryDate);
      
      if (daysUntilExpiry < 0) {
        return { text: '🚫 FIFO: EXPIRED REMOVAL', color: '#EF4444' };
      } else if (daysUntilExpiry <= 7) {
        return { text: '⚡ FIFO: HIGH PRIORITY', color: '#F59E0B' };
      } else if (daysUntilExpiry <= 30) {
        return { text: '📦 FIFO: MEDIUM PRIORITY', color: '#3B82F6' };
      }
    }
    return null;
  };

  const fifoPriority = getFifoPriority();
  const movementColor = getMovementColor(movement.type);
  const movementIcon = getMovementIcon(movement.type);
  const movementLabel = getMovementLabel(movement.type);

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={handlePress}>
        <View style={styles.compactHeader}>
          <View style={[styles.compactTypeBadge, { backgroundColor: movementColor.background }]}>
            <Text style={[styles.compactTypeText, { color: movementColor.text }]}>
              {movementIcon} {movement.type.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.compactDate}>
            {dateUtils.formatDate(movement.createdAt)}
          </Text>
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactProduct}>
            {movement.products?.name || 'Unknown Product'} ({movement.quantity} units)
          </Text>
          {movement.referenceId && (
            <Text style={styles.compactReference}>{movement.referenceId}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.movementTitle}>
            {movementIcon} {movementLabel}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: movementColor.background }]}>
            <Text style={[styles.typeText, { color: movementColor.text }]}>
              {movement.type.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.date}>
          {dateUtils.formatDateTime(movement.createdAt)}
        </Text>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Product</Text>
            <Text style={styles.detailValue}>
              {movement.products?.name || 'Unknown Product'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Quantity</Text>
            <Text style={[
              styles.detailValue,
              {
                color: movement.type === 'sale' ? '#DC2626' :
                       movement.type === 'purchase' ? '#059669' : '#374151'
              }
            ]}>
              {movement.type === 'purchase' ? '+' : movement.type === 'sale' ? '-' : ''}
              {movement.quantity} units
            </Text>
          </View>
        </View>

        {showBatchDetails && movement.inventory_items && (
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Batch Number</Text>
              <Text style={styles.detailValue}>
                {movement.inventory_items.batchNumber || 'N/A'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Unit Cost</Text>
              <Text style={styles.detailValue}>
                {movement.unitCost ? currencyUtils.formatSimplePHP(movement.unitCost) : 'N/A'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Warehouse</Text>
            <Text style={styles.detailValue}>
              {movement.warehouses?.name || 'Unknown'}
            </Text>
          </View>
          {movement.referenceId && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Reference</Text>
              <Text style={styles.detailValue}>{movement.referenceId}</Text>
            </View>
          )}
        </View>

        {movement.reason && (
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Reason</Text>
              <Text style={styles.detailValue}>{movement.reason}</Text>
            </View>
          </View>
        )}
      </View>

      {/* FIFO Priority Indicator for outgoing stock */}
      {fifoPriority && (
        <View style={styles.fifoContainer}>
          <Text style={[styles.fifoText, { color: fifoPriority.color }]}>
            {fifoPriority.text}
          </Text>
        </View>
      )}

      {/* Movement Impact Indicator */}
      <View style={styles.impactContainer}>
        <Text style={styles.impactText}>
          {movement.type === 'purchase' && '✅ Added to available stock'}
          {movement.type === 'sale' && '🛒 Deducted from available stock'}
          {movement.type === 'transfer' && `📦 Transferred to ${movement.warehouses?.name}`}
          {movement.type === 'adjustment' && '⚙️ Stock level adjusted'}
          {movement.type === 'expired' && '⛔ Removed from available stock'}
        </Text>
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  movementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compactTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  compactTypeText: {
    fontSize: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
  },
  compactDate: {
    fontSize: 10,
    color: '#6B7280',
  },
  detailsGrid: {
    marginBottom: 12,
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
  compactInfo: {
    marginTop: 8,
  },
  compactProduct: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 4,
  },
  compactReference: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  fifoContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    marginBottom: 8,
  },
  fifoText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  impactContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEF7ED',
    borderRadius: 6,
  },
  impactText: {
    fontSize: 10,
    color: '#92400E',
    textAlign: 'center',
  },
});