// Warehouse Card Component for InventoryPro
// Displays warehouse information with capacity visualization

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Warehouse } from '@/types/inventory';
import { currencyUtils, inventoryUtils } from '@/utils/inventoryUtils';

interface WarehouseCardProps {
  warehouse: Warehouse;
  onPress?: (warehouse: Warehouse) => void;
  onEdit?: (warehouse: Warehouse) => void;
  onDelete?: (warehouse: Warehouse) => void;
  showActions?: boolean;
}

export const WarehouseCard: React.FC<WarehouseCardProps> = ({
  warehouse,
  onPress,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const utilizationPercentage = warehouse.utilizationPercentage || 0;
  const utilizationColor = inventoryUtils.getUtilizationColor(utilizationPercentage);

  const handlePress = () => {
    if (onPress) {
      onPress(warehouse);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(warehouse);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Warehouse',
      `Are you sure you want to delete ${warehouse.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete && onDelete(warehouse),
        },
      ]
    );
  };

  const getUtilizationBarColor = () => {
    switch (utilizationColor) {
      case 'green':
        return '#10B981';
      case 'yellow':
        return '#F59E0B';
      case 'red':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusColor = () => {
    switch (warehouse.status) {
      case 'active':
        return '#10B981';
      case 'maintenance':
        return '#F59E0B';
      case 'inactive':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.name}>{warehouse.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{warehouse.status.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.location}>{warehouse.location}</Text>
      </View>

      <View style={styles.managerSection}>
        <Text style={styles.managerLabel}>Manager:</Text>
        <Text style={styles.managerName}>{warehouse.manager}</Text>
      </View>

      <View style={styles.capacitySection}>
        <View style={styles.capacityHeader}>
          <Text style={styles.capacityLabel}>Capacity Usage</Text>
          <Text style={styles.capacityText}>
            {warehouse.currentUtilization.toLocaleString()} / {warehouse.capacity.toLocaleString()} units
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(utilizationPercentage, 100)}%`,
                  backgroundColor: getUtilizationBarColor(),
                }
              ]} 
            />
          </View>
          <Text style={styles.utilizationPercentage}>
            {utilizationPercentage}%
          </Text>
        </View>

        {utilizationPercentage > 80 && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚠️ {utilizationPercentage >= 95 ? 'Critical' : 'Warning'}: 
              Warehouse {utilizationPercentage >= 95 ? 'almost full' : 'near capacity'}
            </Text>
          </View>
        )}
      </View>

      {showActions && (onEdit || onDelete) && (
        <View style={styles.actionsContainer}>
          {onEdit && (
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && warehouse.status !== 'active' && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>Delete</Text>
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
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    marginBottom: 12,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
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
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
  },
  managerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  managerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginRight: 8,
  },
  managerName: {
    fontSize: 14,
    color: '#111827',
  },
  capacitySection: {
    marginBottom: 12,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  capacityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  capacityText: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  utilizationPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    minWidth: 40,
    textAlign: 'right',
  },
  warningContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
  },
  warningText: {
    fontSize: 11,
    color: '#92400E',
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
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EF4444',
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});