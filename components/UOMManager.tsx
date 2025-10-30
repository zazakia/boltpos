import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { UnitOfMeasure } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface UOMManagerProps {
  baseUom: string;
  uomList: UnitOfMeasure[];
  onChange: (baseUom: string, uomList: UnitOfMeasure[]) => void;
  disabled?: boolean;
}

export default function UOMManager({
  baseUom,
  uomList,
  onChange,
  disabled = false,
}: UOMManagerProps) {
  const [newUomName, setNewUomName] = useState('');
  const [newUomConversion, setNewUomConversion] = useState('');
  const [editingUom, setEditingUom] = useState<string | null>(null);
  const [editConversion, setEditConversion] = useState('');

  const handleAddUOM = () => {
    if (!newUomName.trim()) {
      Alert.alert('Error', 'Please enter a UOM name');
      return;
    }

    const conversion = parseFloat(newUomConversion);
    if (isNaN(conversion) || conversion <= 0) {
      Alert.alert('Error', 'Please enter a valid conversion rate (greater than 0)');
      return;
    }

    // Check if UOM already exists
    if (uomList.some((u) => u.name.toLowerCase() === newUomName.trim().toLowerCase())) {
      Alert.alert('Error', 'This UOM already exists');
      return;
    }

    const newUOM: UnitOfMeasure = {
      name: newUomName.trim(),
      conversion_to_base: conversion,
      is_base: false,
    };

    onChange(baseUom, [...uomList, newUOM]);
    setNewUomName('');
    setNewUomConversion('');
  };

  const handleRemoveUOM = (uomName: string) => {
    const uom = uomList.find((u) => u.name === uomName);
    if (uom?.is_base) {
      Alert.alert('Error', 'Cannot remove the base UOM');
      return;
    }

    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to remove "${uomName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onChange(
              baseUom,
              uomList.filter((u) => u.name !== uomName)
            );
          },
        },
      ]
    );
  };

  const handleStartEdit = (uom: UnitOfMeasure) => {
    if (uom.is_base) {
      Alert.alert('Info', 'Base UOM conversion rate is always 1 and cannot be changed');
      return;
    }
    setEditingUom(uom.name);
    setEditConversion(uom.conversion_to_base.toString());
  };

  const handleSaveEdit = () => {
    if (!editingUom) return;

    const conversion = parseFloat(editConversion);
    if (isNaN(conversion) || conversion <= 0) {
      Alert.alert('Error', 'Please enter a valid conversion rate (greater than 0)');
      return;
    }

    onChange(
      baseUom,
      uomList.map((u) =>
        u.name === editingUom ? { ...u, conversion_to_base: conversion } : u
      )
    );

    setEditingUom(null);
    setEditConversion('');
  };

  const handleCancelEdit = () => {
    setEditingUom(null);
    setEditConversion('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Unit of Measure (UOM)</Text>

      {/* Base UOM Display */}
      <View style={styles.baseUomContainer}>
        <Text style={styles.label}>Base UOM</Text>
        <View style={styles.baseUomBadge}>
          <Text style={styles.baseUomText}>{baseUom}</Text>
          <Text style={styles.baseUomSubtext}>(Conversion: 1.0)</Text>
        </View>
      </View>

      {/* UOM List */}
      <Text style={styles.label}>Additional Units</Text>
      <ScrollView style={styles.uomList}>
        {uomList
          .filter((u) => !u.is_base)
          .map((uom) => (
            <View key={uom.name} style={styles.uomItem}>
              {editingUom === uom.name ? (
                <View style={styles.editContainer}>
                  <View style={styles.editInputContainer}>
                    <Text style={styles.uomName}>{uom.name}</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editConversion}
                      onChangeText={setEditConversion}
                      keyboardType="decimal-pad"
                      placeholder="Conversion rate"
                      autoFocus
                    />
                  </View>
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.saveButton]}
                      onPress={handleSaveEdit}
                    >
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={handleCancelEdit}
                    >
                      <Ionicons name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.uomInfo}>
                    <Text style={styles.uomName}>{uom.name}</Text>
                    <Text style={styles.uomConversion}>
                      1 {uom.name} = {uom.conversion_to_base} {baseUom}
                    </Text>
                  </View>
                  {!disabled && (
                    <View style={styles.uomActions}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => handleStartEdit(uom)}
                      >
                        <Ionicons name="pencil" size={18} color="#3b82f6" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => handleRemoveUOM(uom.name)}
                      >
                        <Ionicons name="trash" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          ))}

        {uomList.filter((u) => !u.is_base).length === 0 && (
          <Text style={styles.emptyText}>No additional units added yet</Text>
        )}
      </ScrollView>

      {/* Add New UOM */}
      {!disabled && (
        <View style={styles.addUomContainer}>
          <Text style={styles.label}>Add New Unit</Text>
          <View style={styles.addUomForm}>
            <TextInput
              style={[styles.input, styles.uomNameInput]}
              placeholder="Unit name (e.g., sack, box)"
              value={newUomName}
              onChangeText={setNewUomName}
            />
            <TextInput
              style={[styles.input, styles.conversionInput]}
              placeholder={`Qty per ${baseUom}`}
              value={newUomConversion}
              onChangeText={setNewUomConversion}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddUOM}>
              <Ionicons name="add-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.helpText}>
            Example: If 1 sack = 50 {baseUom}, enter "sack" and "50"
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  baseUomContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  baseUomBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  baseUomText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  baseUomSubtext: {
    fontSize: 12,
    color: '#dbeafe',
    marginTop: 2,
  },
  uomList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  uomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  uomInfo: {
    flex: 1,
  },
  uomName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  uomConversion: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  uomActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  editContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editInputContainer: {
    flex: 1,
  },
  editInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    marginTop: 4,
  },
  editActions: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
  addUomContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  addUomForm: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  uomNameInput: {
    flex: 2,
  },
  conversionInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    width: 44,
    height: 44,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});
