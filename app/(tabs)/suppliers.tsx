import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '@/services/vouchers.service';
import { Plus, Building2, XCircle, Edit, Trash2 } from 'lucide-react-native';

export default function SuppliersScreen() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    const result = await fetchSuppliers();
    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      setSuppliers(result.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  const handleDelete = (supplier: any) => {
    Alert.alert(
      'Delete Supplier',
      `Are you sure you want to delete ${supplier.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteSupplier(supplier.id);
            if (result.error) {
              Alert.alert('Error', result.error);
            } else {
              Alert.alert('Success', 'Supplier deleted successfully!');
              loadSuppliers();
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading suppliers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Suppliers</Text>
          <Text style={styles.headerSubtitle}>Manage your suppliers</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setEditingSupplier(null);
              setShowModal(true);
            }}>
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Suppliers List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {suppliers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Building2 size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No suppliers yet</Text>
            <Text style={styles.emptySubtext}>
              Add suppliers to start creating vouchers
            </Text>
          </View>
        ) : (
          suppliers.map((supplier) => (
            <View
              key={supplier.id}
              style={[
                styles.supplierCard,
                !supplier.active && styles.supplierCardInactive,
              ]}>
              <View style={styles.supplierHeader}>
                <View style={styles.supplierIcon}>
                  <Building2 size={24} color="#3B82F6" />
                </View>
                <View style={styles.supplierInfo}>
                  <Text style={styles.supplierName}>{supplier.name}</Text>
                  {supplier.contact_person && (
                    <Text style={styles.supplierContact}>
                      Contact: {supplier.contact_person}
                    </Text>
                  )}
                </View>
              </View>

              {(supplier.email || supplier.phone) && (
                <View style={styles.supplierDetails}>
                  {supplier.email && (
                    <Text style={styles.supplierDetailText}>
                      📧 {supplier.email}
                    </Text>
                  )}
                  {supplier.phone && (
                    <Text style={styles.supplierDetailText}>
                      📞 {supplier.phone}
                    </Text>
                  )}
                  {supplier.address && (
                    <Text style={styles.supplierDetailText}>
                      📍 {supplier.address}
                    </Text>
                  )}
                </View>
              )}

              {isAdmin && (
                <View style={styles.supplierActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEdit(supplier)}>
                    <Edit size={16} color="#3B82F6" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(supplier)}>
                    <Trash2 size={16} color="#EF4444" />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {!supplier.active && (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveBadgeText}>INACTIVE</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Supplier Form Modal */}
      <SupplierFormModal
        visible={showModal}
        supplier={editingSupplier}
        onClose={() => {
          setShowModal(false);
          setEditingSupplier(null);
        }}
        onSuccess={() => {
          setShowModal(false);
          setEditingSupplier(null);
          loadSuppliers();
        }}
      />
    </SafeAreaView>
  );
}

// Supplier Form Modal Component
function SupplierFormModal({ visible, supplier, onClose, onSuccess }: any) {
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (supplier) {
      setName(supplier.name || '');
      setContactPerson(supplier.contact_person || '');
      setEmail(supplier.email || '');
      setPhone(supplier.phone || '');
      setAddress(supplier.address || '');
    } else {
      resetForm();
    }
  }, [supplier]);

  const resetForm = () => {
    setName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setAddress('');
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter supplier name');
      return;
    }

    setLoading(true);
    const supplierData = {
      name: name.trim(),
      contact_person: contactPerson.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      active: true,
    };

    const result = supplier
      ? await updateSupplier(supplier.id, supplierData)
      : await createSupplier(supplierData);

    setLoading(false);

    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      Alert.alert(
        'Success',
        `Supplier ${supplier ? 'updated' : 'created'} successfully!`
      );
      resetForm();
      onSuccess();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {supplier ? 'Edit Supplier' : 'Add Supplier'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <XCircle size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.label}>Supplier Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter supplier name"
            />

            <Text style={styles.label}>Contact Person</Text>
            <TextInput
              style={styles.input}
              value={contactPerson}
              onChangeText={setContactPerson}
              placeholder="Enter contact person name"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter address"
              multiline
              numberOfLines={3}
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSubmit}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {supplier ? 'Update' : 'Create'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  supplierCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  supplierCardInactive: {
    opacity: 0.6,
  },
  supplierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  supplierIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  supplierContact: {
    fontSize: 14,
    color: '#6B7280',
  },
  supplierDetails: {
    marginBottom: 12,
  },
  supplierDetailText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  supplierActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  deleteButton: {
    borderColor: '#EF4444',
  },
  deleteButtonText: {
    color: '#EF4444',
  },
  inactiveBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  inactiveBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
