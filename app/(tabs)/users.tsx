import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { User, Shield, Edit2, Key } from 'lucide-react-native';

type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'staff';
  created_at: string;
};

export default function UsersScreen() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    role: 'staff' as 'admin' | 'staff',
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    userId: '',
    password: '',
  });

  const isAdmin = profile?.role === 'admin';

  // Redirect non-admin users
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      // In a real app, you might want to redirect or show an error
      console.log('Access denied: Admin privileges required');
    } else {
      loadUsers();
    }
  }, [profile]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || '',
      role: user.role,
    });
    setModalVisible(true);
  };

  const openPasswordModal = (userId: string) => {
    setPasswordData({
      userId,
      password: '',
    });
    setShowPasswordModal(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          role: formData.role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUser.id);

      if (error) throw error;
      setModalVisible(false);
      loadUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      Alert.alert('Error', error.message || 'Failed to update user');
    }
  };

  const handleResetPassword = async () => {
    if (!passwordData.password) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    try {
      // Note: In a real app, you would use Supabase's admin API to reset passwords
      // This is a simplified example
      Alert.alert(
        'Info',
        'Password reset functionality would be implemented here',
      );
      setShowPasswordModal(false);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      Alert.alert('Error', error.message || 'Failed to reset password');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { text: 'Administrator', color: '#10B981', bgColor: '#D1FAE5' };
      case 'staff':
        return { text: 'Staff', color: '#3B82F6', bgColor: '#DBEAFE' };
      default:
        return { text: role, color: '#6B7280', bgColor: '#F3F4F6' };
    }
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Users</Text>
        </View>
        <View style={styles.accessDenied}>
          <Shield size={48} color="#EF4444" />
          <Text style={styles.accessDeniedText}>Access Denied</Text>
          <Text style={styles.accessDeniedSubtext}>
            You don't have permission to view this page
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Users</Text>
      </View>

      <ScrollView style={styles.content}>
        {users.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No users found</Text>
          </View>
        ) : (
          users.map((user) => {
            const roleBadge = getRoleBadge(user.role);
            return (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <User size={24} color="#3B82F6" />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>
                      {user.full_name || 'Unnamed User'}
                    </Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View
                      style={[
                        styles.roleBadge,
                        {
                          backgroundColor: roleBadge.bgColor,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.roleText, { color: roleBadge.color }]}
                      >
                        {roleBadge.text}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.userActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(user)}
                  >
                    <Edit2 size={18} color="#3B82F6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.passwordButton}
                    onPress={() => openPasswordModal(user.id)}
                  >
                    <Key size={18} color="#8B5CF6" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Edit User Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingUser ? 'Edit User' : 'Add User'}
            </Text>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.form}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.full_name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, full_name: text })
                  }
                  placeholder="Enter full name"
                />

                <Text style={styles.label}>Role</Text>
                <View style={styles.rolePicker}>
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      formData.role === 'staff' && styles.roleOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, role: 'staff' })}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        formData.role === 'staff' &&
                          styles.roleOptionTextSelected,
                      ]}
                    >
                      Staff
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      formData.role === 'admin' && styles.roleOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, role: 'admin' })}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        formData.role === 'admin' &&
                          styles.roleOptionTextSelected,
                      ]}
                    >
                      Admin
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.form}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={passwordData.password}
                  onChangeText={(text) =>
                    setPasswordData({ ...passwordData, password: text })
                  }
                  placeholder="Enter new password"
                  secureTextEntry
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowPasswordModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleResetPassword}
                  >
                    <Text style={styles.saveButtonText}>Reset Password</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  accessDeniedText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedSubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalScroll: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  rolePicker: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  roleOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  roleOptionTextSelected: {
    color: '#3B82F6',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    padding: 12,
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
