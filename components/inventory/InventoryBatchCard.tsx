// Inventory Batch Card Component for InventoryPro
// Displays inventory batch information with FIFO and expiration tracking

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { InventoryItem } from '@/types/inventory';
import { currencyUtils, dateUtils } from '@/utils/inventoryUtils';

interface InventoryBatchCardProps {
  batch: InventoryItem & {
    products?: { id: string; name: string; price: number };
    warehouses?: { id: string; name: string };
  };
  onPress?: (batch: InventoryItem) => void;
  onTransfer?: (batch: InventoryItem) => void;
  onAdjust?: (batch: InventoryItem) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const InventoryBatchCard: React.FC<InventoryBatchCardProps> = ({
  batch,
  onPress,
  onTransfer,
  onAdjust,
  showActions = true,
  compact = false,
}) => {
  const isExpiringSoon = dateUtils.isExpiringSoon(batch.expiryDate);
  const isExpired = dateUtils.isExpired(batch.expiryDate);
  const daysUntilExpiry = dateUtils.getDaysUntilExpiry(batch.expiryDate);

  const handlePress = () => {
    if (onPress) {
      onPress(batch);
    }
  };

  const handleTransfer = () => {
    if (onTransfer) {
      onTransfer(batch);
    }
  };

  const handleAdjust = () => {
    if (onAdjust) {
      onAdjust(batch);
    }
  };

  const getExpiryStatus = () => {
    if (isExpired) {
      return {
        text: `Expired ${Math.abs(daysUntilExpiry)} days ago`,
        color: '#EF4444',
        backgroundColor: '#FEE2E2',
        icon: '⛔',
      };
    } else if (isExpiringSoon) {
      return {
        text: `Expires in ${daysUntilExpiry} days`,
        color: '#F59E0B',
        backgroundColor: '#FEF3C7',
        icon: '⚠️',
      };
    } else {
      return {
        text: `Expires in ${daysUntilExpiry} days`,
        color: '#10B981',
        backgroundColor: '#D1FAE5',
        icon: '✅',
      };
    }
  };

  const getBatchValue = () => {
    return batch.quantity * batch.unitCost;
  };

  const expiryStatus = getExpiryStatus();

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={handlePress}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactProductName}>{batch.products?.name || 'Unknown Product'}</Text>
          <Text style={styles.compactBatchNumber}>{batch.batchNumber}</Text>
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactQuantity}>Qty: {batch.quantity}</Text>
          <Text style={styles.compactExpiry}>{expiryStatus.text}</Text>
          <Text style={styles.compactValue}>{currencyUtils.formatSimplePHP(getBatchValue())}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.productName}>{batch.products?.name || 'Unknown Product'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: expiryStatus.backgroundColor }]}>
            <Text style={[styles.statusText, { color: expiryStatus.color }]}>
              {expiryStatus.icon} {expiryStatus.text}
            </Text>
          </View>
        </View>
        <Text style={styles.batchNumber}>Batch: {batch.batchNumber}</Text>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Warehouse</Text>
            <Text style={styles.detailValue}>{batch.warehouses?.name || 'Unknown'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Quantity</Text>
            <Text style={styles.detailValue}>{batch.quantity} units</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Unit Cost</Text>
            <Text style={styles.detailValue}>{currencyUtils.formatSimplePHP(batch.unitCost)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Total Value</Text>
            <Text style={[styles.detailValue, { fontWeight: '600' }]}>
              {currencyUtils.formatSimplePHP(getBatchValue())}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Received Date</Text>
            <Text style={styles.detailValue}>
              {batch.receivedDate ? dateUtils.formatDate(batch.receivedDate) : 'Unknown'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Expiry Date</Text>
            <Text style={styles.detailValue}>
              {batch.expiryDate ? dateUtils.formatDate(batch.expiryDate) : 'No expiry'}
            </Text>
          </View>
        </View>
      </View>

      {/* FIFO Priority Indicator */}
      {isExpiringSoon || isExpired ? (
        <View style={styles.fifoContainer}>
          <Text style={styles.fifoText}>
            {isExpired ? '🚫 FIFO: PRIORITY REMOVAL' : '⚡ FIFO: PRIORITY SALE'}
          </Text>
        </View>
      ) : (
        <View style={styles.fifoContainer}>
          <Text style={styles.fifoText}>📦 FIFO: Standard rotation</Text>
        </View>
      )}

      {showActions && (onTransfer || onAdjust) && (
        <View style={styles.actionsContainer}>
          {onTransfer && (
            <TouchableOpacity style={styles.transferButton} onPress={handleTransfer}>
              <Text style={styles.transferButtonText}>Transfer</Text>
            </TouchableOpacity>
          )}
          {onAdjust && (
            <TouchableOpacity style={styles.adjustButton} onPress={handleAdjust}>
              <Text style={styles.adjustButtonText}>Adjust</Text>
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
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  compactProductName: {
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
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  batchNumber: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  compactBatchNumber: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'monospace',
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
  },
  compactInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactQuantity: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  compactExpiry: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '500',
  },
  compactValue: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  fifoContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    marginBottom: 12,
  },
  fifoText: {
    fontSize: 10,
    color: '#475569',
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
  transferButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  transferButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  adjustButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#8B5CF6',
    borderRadius: 6,
  },
  adjustButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});