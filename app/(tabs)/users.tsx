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
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchAllUsers,
  updateUserProfile,
  toggleUserActiveStatus
} from '@/services/users.service';
import { resetUserPassword } from '@/services/auth.service';
import { User, Shield, Edit2, Key, Power } from 'lucide-react-native';

type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'staff';
  active: boolean;
  created_at: string;
};

export default function UsersScreen() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminCount, setAdminCount] = useState<number>(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    role: 'staff' as 'admin' | 'staff',
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    userId: '',
    email: '',
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
      const result = await fetchAllUsers();

      if (result.error) throw new Error(result.error);
      setUsers(result.data || []);
      
      // Count active admins for validation
      const activeAdmins = (result.data || []).filter(u => u.role === 'admin' && u.active).length;
      setAdminCount(activeAdmins);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
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

  const openPasswordModal = (userId: string, userEmail: string) => {
    setPasswordData({
      userId,
      email: userEmail,
    });
    setShowPasswordModal(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    // Validation: Prevent removing the last admin
    if (editingUser.role === 'admin' && formData.role === 'staff') {
      if (adminCount <= 1) {
        Alert.alert('Cannot change role', 'At least one admin must remain in the system.');
        return;
      }
    }

    try {
      const result = await updateUserProfile(editingUser.id, {
        full_name: formData.full_name,
        role: formData.role,
      });

      if (result.error) throw new Error(result.error);
      setModalVisible(false);
      loadUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      Alert.alert('Error', error.message || 'Failed to update user');
    }
  };

  const handleToggleUserActive = async (userId: string, currentActive: boolean, userRole: string) => {
    // Validation: Prevent deactivating the last admin
    if (currentActive === true && userRole === 'admin') {
      if (adminCount <= 1) {
        Alert.alert('Cannot deactivate', 'At least one admin must remain active in the system.');
        return;
      }
    }

    Alert.alert(
      currentActive ? 'Deactivate User' : 'Reactivate User',
      `This user will ${currentActive ? 'no longer' : 'now be able to'} access the system.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const result = await toggleUserActiveStatus(userId, !currentActive);

              if (result.error) throw new Error(result.error);
              
              Alert.alert(
                'Success',
                `User ${currentActive ? 'deactivated' : 'reactivated'} successfully.`
              );
              loadUsers();
            } catch (error: any) {
              console.error('Error toggling user active status:', error);
              Alert.alert('Error', error.message || 'Failed to update user status');
            }
          },
        },
      ]
    );
  };

  const handleResetPassword = async () => {
    try {
      const result = await resetUserPassword(passwordData.email, '/(auth)/login');

      if (result.error) throw new Error(result.error);

      Alert.alert('Success', 'Password reset email sent. The user will receive an email with instructions.');
      setShowPasswordModal(false);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      Alert.alert('Error', error.message || 'Failed to send password reset email');
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
              <View key={user.id} style={[styles.userCard, { opacity: user.active ? 1 : 0.6 }]}>
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
                      ]}>
                      <Text
                        style={[
                          styles.roleText,
                          { color: roleBadge.color },
                        ]}>
                        {roleBadge.text}
                      </Text>
                    </View>
                    {!user.active && (
                      <View
                        style={[
                          styles.roleBadge,
                          {
                            backgroundColor: '#FEE2E2',
                            marginLeft: 8,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.roleText,
                            { color: '#EF4444' },
                          ]}>
                          Inactive
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.userActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(user)}>
                    <Edit2 size={18} color="#3B82F6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.passwordButton}
                    onPress={() => openPasswordModal(user.id, user.email)}>
                    <Key size={18} color="#8B5CF6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.deactivateButton,
                      {
                        backgroundColor: user.active ? '#FEE2E2' : '#D1FAE5',
                      },
                    ]}
                    onPress={() => handleToggleUserActive(user.id, user.active, user.role)}>
                    <Power
                      size={18}
                      color={user.active ? '#EF4444' : '#10B981'}
                    />
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
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingUser ? 'Edit User' : 'Add User'}
            </Text>

            <View style={styles.form}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={formData.full_name}
                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                placeholder="Enter full name"
              />

              <Text style={styles.label}>Role</Text>
              <View style={styles.rolePicker}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    formData.role === 'staff' && styles.roleOptionSelected,
                    editingUser?.role === 'admin' && adminCount <= 1 && { opacity: 0.5 },
                  ]}
                  onPress={() => setFormData({ ...formData, role: 'staff' })}
                  disabled={editingUser?.role === 'admin' && adminCount <= 1}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      formData.role === 'staff' && styles.roleOptionTextSelected,
                      editingUser?.role === 'admin' && adminCount <= 1 && { color: '#9CA3AF' },
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
                      formData.role === 'admin' && styles.roleOptionTextSelected,
                    ]}
                  >
                    Admin
                  </Text>
                </TouchableOpacity>
              </View>
              
              {editingUser?.role === 'admin' && adminCount <= 1 && (
                <Text style={styles.warningText}>
                  ⚠️ This is the last active admin. Role cannot be changed to Staff.
                </Text>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Password Reset Email</Text>

            <View style={styles.form}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={passwordData.email}
                editable={false}
                placeholder="User email"
              />
              <Text style={styles.infoText}>
                A password reset email will be sent to the user's email address.
                {'\n'}
                The user will receive instructions to reset their password securely.
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowPasswordModal(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleResetPassword}>
                  <Text style={styles.saveButtonText}>Send Reset Email</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  deactivateButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 8,
  },
});