import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UnitOfMeasure } from '@/lib/supabase';
import { formatUOMDisplay } from '@/utils/uom';

interface UOMSelectorProps {
  uomList: UnitOfMeasure[];
  selectedUOM: string;
  onSelect: (uom: string) => void;
  disabled?: boolean;
}

export default function UOMSelector({
  uomList,
  selectedUOM,
  onSelect,
  disabled = false,
}: UOMSelectorProps) {
  // If there's only one UOM, don't show the selector
  if (uomList.length === 1) {
    return (
      <View style={styles.singleUomContainer}>
        <Text style={styles.singleUomText}>{uomList[0].name}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Unit</Text>
      <View style={styles.optionsContainer}>
        {uomList.map((uom) => {
          const isSelected = selectedUOM === uom.name;
          return (
            <TouchableOpacity
              key={uom.name}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
                disabled && styles.optionDisabled,
              ]}
              onPress={() => !disabled && onSelect(uom.name)}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                  disabled && styles.optionTextDisabled,
                ]}
              >
                {formatUOMDisplay(uom.name, uomList)}
              </Text>
              {uom.is_base && (
                <View style={styles.baseBadge}>
                  <Text style={styles.baseBadgeText}>BASE</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  optionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  optionTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  optionTextDisabled: {
    color: '#9ca3af',
  },
  baseBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  baseBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  singleUomContainer: {
    marginBottom: 8,
  },
  singleUomText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});
