// Supplier Form Modal Component for InventoryPro
// Form for creating and editing suppliers

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Supplier } from '@/types/inventory';

interface SupplierFormModalProps {
  visible: boolean;
  supplier?: Supplier | null;
  onSave: (supplierData: Partial<Supplier>) => Promise<void> | void;
  onCancel: () => void;
}

interface SupplierFormData {
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  paymentTerms: 'Net 15' | 'Net 30' | 'Net 60' | 'COD';
  status: 'active' | 'inactive';
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  visible,
  supplier,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<SupplierFormData>({
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    paymentTerms: 'Net 30',
    status: 'active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Initialize form data when supplier changes
  useEffect(() => {
    if (supplier) {
      setFormData({
        companyName: supplier.companyName,
        contactPerson: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email,
        paymentTerms: supplier.paymentTerms,
        status: supplier.status,
      });
    } else {
      setFormData({
        companyName: '',
        contactPerson: '',
        phone: '',
        email: '',
        paymentTerms: 'Net 30',
        status: 'active',
      });
    }
    setErrors({});
  }, [supplier, visible]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\-\+\(\)\s]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...formData,
        id: supplier?.id,
        createdAt: supplier?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving supplier:', error);
      Alert.alert('Error', 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof SupplierFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderPaymentTermsOptions = () => (
    <View style={styles.paymentTermsContainer}>
      {[
        { value: 'COD', label: '💵 Cash on Delivery', color: '#059669' },
        { value: 'Net 15', label: '📅 Payment in 15 days', color: '#3B82F6' },
        { value: 'Net 30', label: '📅 Payment in 30 days', color: '#F59E0B' },
        { value: 'Net 60', label: '📅 Payment in 60 days', color: '#EF4444' },
      ].map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.paymentTermOption,
            formData.paymentTerms === option.value && {
              backgroundColor: option.color,
            },
          ]}
          onPress={() => updateField('paymentTerms', option.value as any)}
        >
          <Text
            style={[
              styles.paymentTermText,
              formData.paymentTerms === option.value && { color: '#FFFFFF' },
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStatusOptions = () => (
    <View style={styles.statusContainer}>
      <TouchableOpacity
        style={[
          styles.statusOption,
          formData.status === 'active' && styles.activeStatusOption,
        ]}
        onPress={() => updateField('status', 'active')}
      >
        <Text
          style={[
            styles.statusText,
            formData.status === 'active' && styles.activeStatusText,
          ]}
        >
          🟢 Active Supplier
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.statusOption,
          formData.status === 'inactive' && styles.inactiveStatusOption,
        ]}
        onPress={() => updateField('status', 'inactive')}
      >
        <Text
          style={[
            styles.statusText,
            formData.status === 'inactive' && styles.inactiveStatusText,
          ]}
        >
          🔴 Inactive Supplier
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {supplier ? 'Edit Supplier' : 'Add New Supplier'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          {/* Company Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Company Name *</Text>
            <TextInput
              style={[styles.textInput, errors.companyName && styles.inputError]}
              value={formData.companyName}
              onChangeText={(text) => updateField('companyName', text)}
              placeholder="Enter company name"
              placeholderTextColor="#9CA3AF"
            />
            {errors.companyName && (
              <Text style={styles.errorText}>{errors.companyName}</Text>
            )}
          </View>

          {/* Contact Person */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Contact Person *</Text>
            <TextInput
              style={[styles.textInput, errors.contactPerson && styles.inputError]}
              value={formData.contactPerson}
              onChangeText={(text) => updateField('contactPerson', text)}
              placeholder="Enter contact person name"
              placeholderTextColor="#9CA3AF"
            />
            {errors.contactPerson && (
              <Text style={styles.errorText}>{errors.contactPerson}</Text>
            )}
          </View>

          {/* Phone */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Phone Number *</Text>
            <TextInput
              style={[styles.textInput, errors.phone && styles.inputError]}
              value={formData.phone}
              onChangeText={(text) => updateField('phone', text)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
            />
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email Address *</Text>
            <TextInput
              style={[styles.textInput, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Payment Terms */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Payment Terms *</Text>
            {renderPaymentTermsOptions()}
          </View>

          {/* Status */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Status *</Text>
            {renderStatusOptions()}
          </View>

          {/* Payment Terms Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>💡 Payment Terms Information</Text>
            <View style={styles.infoText}>
              <Text style={styles.infoItem}>• <Text style={styles.infoBold}>COD:</Text> Immediate payment upon delivery</Text>
              <Text style={styles.infoItem}>• <Text style={styles.infoBold}>Net 15/30/60:</Text> Payment due after specified days</Text>
              <Text style={styles.infoItem}>• <Text style={styles.infoBold}>Credit terms:</Text> Requires supplier credit approval</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : (supplier ? 'Update' : 'Create')} Supplier
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
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  paymentTermsContainer: {
    gap: 8,
  },
  paymentTermOption: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  paymentTermText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  activeStatusOption: {
    backgroundColor: '#D1FAE5',
    borderColor: '#059669',
  },
  inactiveStatusOption: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  statusText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  activeStatusText: {
    color: '#065F46',
  },
  inactiveStatusText: {
    color: '#991B1B',
  },
  infoContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    gap: 4,
  },
  infoItem: {
    fontSize: 11,
    color: '#1E3A8A',
    lineHeight: 16,
  },
  infoBold: {
    fontWeight: '600',
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
  saveButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});