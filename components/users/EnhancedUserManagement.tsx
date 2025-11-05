import React, { useState, useEffect } from 'react';
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
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { 
  fetchAllUsers,
  updateUserProfile,
  toggleUserActiveStatus
} from '@/services/users.service';
import RBACService from '@/services/rbac.service';
import { 
  User, 
  Shield, 
  Edit2, 
  Key, 
  Power, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Clock,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  Building
} from 'lucide-react-native';

interface EnhancedUser {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'staff';
  active: boolean;
  warehouse_id?: string;
  phone?: string;
  department?: string;
  last_login_at?: string;
  failed_login_attempts: number;
  account_locked_until?: string;
  email_verified: boolean;
  invitation_accepted: boolean;
  last_activity_at?: string;
  session_timeout_hours: number;
  created_at: string;
  roles?: any[];
  warehouse?: any;
  permissions?: any[];
}

interface FilterOptions {
  status: 'all' | 'active' | 'inactive' | 'locked';
  role: 'all' | 'admin' | 'staff' | 'manager' | 'sales_manager' | 'warehouse_manager' | 'pos_operator' | 'read_only';
  warehouse: 'all' | string;
  email_verified: 'all' | 'verified' | 'unverified';
}

// Detail Row Component
const DetailRow: React.FC<{ label: string; value: string; color?: string }> = ({ 
  label, 
  value, 
  color = '#374151' 
}) => (
  <View style={detailRowStyles.row}>
    <Text style={detailRowStyles.label}>{label}</Text>
    <Text style={[detailRowStyles.value, { color }]}>{value}</Text>
  </View>
);

const detailRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 2,
    textAlign: 'right',
  },
});

export default function EnhancedUserManagement() {
  const { profile: currentUser } = useAuth();
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<EnhancedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [userDetailModal, setUserDetailModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [roleModal, setRoleModal] = useState(false);
  const [inviteModal, setInviteModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  
  // Selected user states
  const [selectedUser, setSelectedUser] = useState<EnhancedUser | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showSelectionMode, setShowSelectionMode] = useState(false);
  
  // Form data states
  const [formData, setFormData] = useState({
    full_name: '',
    role: 'staff' as 'admin' | 'staff',
    phone: '',
    department: '',
    warehouse_id: '',
    session_timeout_hours: 8,
  });
  
  const [inviteData, setInviteData] = useState({
    email: '',
    full_name: '',
    role: 'staff' as 'admin' | 'staff',
    warehouse_id: '',
  });
  
  // Filter and sort states
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    role: 'all',
    warehouse: 'all',
    email_verified: 'all',
  });
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'last_login' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    locked: 0,
    pending_verification: 0,
    admins: 0,
  });

  // Check permissions
  const [permissions, setPermissions] = useState<string[]>([]);
  const canViewUsers = permissions.includes('view_users');
  const canCreateUsers = permissions.includes('create_users');
  const canEditUsers = permissions.includes('edit_users');
  const canDeleteUsers = permissions.includes('delete_users');
  const canManageRoles = permissions.includes('manage_roles');
  const canAdminUsers = permissions.includes('admin_users');

  // Load permissions and data
  useEffect(() => {
    if (currentUser?.id) {
      loadPermissions();
      loadUsers();
    }
  }, [currentUser]);

  // Apply filters and search
  useEffect(() => {
    applyFiltersAndSearch();
  }, [users, searchQuery, filters, sortBy, sortOrder]);

  const loadPermissions = async () => {
    if (!currentUser?.id) return;
    
    const result = await RBACService.getUserPermissions(currentUser.id);
    if (result.data) {
      setPermissions(result.data.map(p => p.permission_name));
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const result = await fetchAllUsers();
      
      if (result.error) throw new Error(result.error);
      
      // Enhance user data with additional info
      const enhancedUsers = await Promise.all(
        (result.data || []).map(async (user: any) => {
          // Get user roles
          const rolesResult = await RBACService.getUserRoles(user.id);
          const roles = rolesResult.data?.map(ra => ra.role) || [];
          
          // Get last activity
          const activityResult = await RBACService.getUserActivity(user.id, 1);
          const lastActivity = activityResult.data?.[0];
          
          return {
            ...user,
            roles,
            last_activity_at: lastActivity?.created_at || user.last_activity_at,
          };
        })
      );
      
      setUsers(enhancedUsers);
      calculateStats(enhancedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (userList: EnhancedUser[]) => {
    const now = new Date();
    
    setStats({
      total: userList.length,
      active: userList.filter(u => u.active).length,
      inactive: userList.filter(u => !u.active).length,
      locked: userList.filter(u => 
        u.account_locked_until && new Date(u.account_locked_until) > now
      ).length,
      pending_verification: userList.filter(u => !u.email_verified).length,
      admins: userList.filter(u => u.roles?.some(r => ['admin', 'super_admin'].includes(r.name))).length,
    });
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...users];

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    if (filters.status !== 'all') {
      const now = new Date();
      filtered = filtered.filter(user => {
        switch (filters.status) {
          case 'active':
            return user.active;
          case 'inactive':
            return !user.active;
          case 'locked':
            return user.account_locked_until && new Date(user.account_locked_until) > now;
          default:
            return true;
        }
      });
    }

    if (filters.role !== 'all') {
      filtered = filtered.filter(user =>
        user.roles?.some(role => role.name === filters.role)
      );
    }

    if (filters.email_verified !== 'all') {
      filtered = filtered.filter(user =>
        filters.email_verified === 'verified' ? user.email_verified : !user.email_verified
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.full_name || '';
          bValue = b.full_name || '';
          break;
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'role':
          aValue = a.roles?.[0]?.display_name || '';
          bValue = b.roles?.[0]?.display_name || '';
          break;
        case 'last_login':
          aValue = new Date(a.last_login_at || '1970-01-01');
          bValue = new Date(b.last_login_at || '1970-01-01');
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
  };

  const openUserDetail = (user: EnhancedUser) => {
    setSelectedUser(user);
    setUserDetailModal(true);
  };

  const openEditModal = (user: EnhancedUser) => {
    setSelectedUser(user);
    setFormData({
      full_name: user.full_name || '',
      role: user.role,
      phone: user.phone || '',
      department: user.department || '',
      warehouse_id: user.warehouse_id || '',
      session_timeout_hours: user.session_timeout_hours || 8,
    });
    setEditModal(true);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      Alert.alert('No Selection', 'Please select users to perform this action.');
      return;
    }

    Alert.alert(
      'Bulk Action',
      `Are you sure you want to ${action} ${selectedUsers.length} selected users?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              // Implement bulk actions here
              console.log(`Bulk ${action} for users:`, selectedUsers);
              setShowSelectionMode(false);
              setSelectedUsers([]);
              loadUsers();
            } catch (error) {
              Alert.alert('Error', `Failed to ${action} users`);
            }
          },
        },
      ]
    );
  };

  const getStatusInfo = (user: EnhancedUser) => {
    const now = new Date();
    
    if (user.account_locked_until && new Date(user.account_locked_until) > now) {
      return {
        text: 'Locked',
        color: '#EF4444',
        bgColor: '#FEE2E2',
        icon: <XCircle size={12} color="#EF4444" />,
      };
    }
    
    if (!user.active) {
      return {
        text: 'Inactive',
        color: '#6B7280',
        bgColor: '#F3F4F6',
        icon: <XCircle size={12} color="#6B7280" />,
      };
    }
    
    if (!user.email_verified) {
      return {
        text: 'Unverified',
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        icon: <AlertCircle size={12} color="#F59E0B" />,
      };
    }
    
    return {
      text: 'Active',
      color: '#10B981',
      bgColor: '#D1FAE5',
      icon: <CheckCircle size={12} color="#10B981" />,
    };
  };

  if (!canViewUsers && !canAdminUsers) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>User Management</Text>
        </View>
        <View style={styles.accessDenied}>
          <Shield size={48} color="#EF4444" />
          <Text style={styles.accessDeniedText}>Access Denied</Text>
          <Text style={styles.accessDeniedSubtext}>
            You don't have permission to view user management
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>User Management</Text>
          <Text style={styles.headerSubtitle}>
            {filteredUsers.length} of {stats.total} users
          </Text>
        </View>
        <View style={styles.headerRight}>
          {canCreateUsers && (
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={() => setInviteModal(true)}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.inviteButtonText}>Invite</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Statistics Cards */}
      <ScrollView horizontal style={styles.statsContainer} showsHorizontalScrollIndicator={false}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F3F4F6' }]}>
          <Text style={[styles.statNumber, { color: '#6B7280' }]}>{stats.inactive}</Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
          <Text style={[styles.statNumber, { color: '#EF4444' }]}>{stats.locked}</Text>
          <Text style={styles.statLabel}>Locked</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{stats.pending_verification}</Text>
          <Text style={styles.statLabel}>Unverified</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
          <Text style={[styles.statNumber, { color: '#3B82F6' }]}>{stats.admins}</Text>
          <Text style={styles.statLabel}>Admins</Text>
        </View>
      </ScrollView>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchText}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* User List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadUsers} />
        }
      >
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color="#6B7280" />
            <Text style={styles.emptyStateText}>
              {searchQuery || Object.values(filters).some(f => f !== 'all') 
                ? 'No users match your criteria'
                : 'No users found'
              }
            </Text>
          </View>
        ) : (
          filteredUsers.map((user) => {
            const statusInfo = getStatusInfo(user);
            const primaryRole = user.roles?.[0];
            
            return (
              <TouchableOpacity
                key={user.id}
                style={[
                  styles.userCard,
                  { opacity: user.active ? 1 : 0.6 },
                  selectedUsers.includes(user.id) && styles.selectedUserCard,
                ]}
                onPress={() => openUserDetail(user)}
              >
                {showSelectionMode && (
                  <View style={styles.selectionCheckbox}>
                    <Text style={styles.selectionCheckboxText}>
                      {selectedUsers.includes(user.id) ? '✓' : ''}
                    </Text>
                  </View>
                )}
                
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <User size={24} color="#3B82F6" />
                  </View>
                  <View style={styles.userDetails}>
                    <View style={styles.userHeader}>
                      <Text style={styles.userName}>
                        {user.full_name || 'Unnamed User'}
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: statusInfo.bgColor }
                      ]}>
                        {statusInfo.icon}
                        <Text style={[
                          styles.statusText,
                          { color: statusInfo.color }
                        ]}>
                          {statusInfo.text}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.userEmail}>{user.email}</Text>
                    
                    <View style={styles.userMeta}>
                      {primaryRole && (
                        <View style={styles.roleBadge}>
                          <Text style={styles.roleText}>{primaryRole.display_name}</Text>
                        </View>
                      )}
                      
                      {user.last_login_at && (
                        <View style={styles.metaItem}>
                          <Clock size={12} color="#6B7280" />
                          <Text style={styles.metaText}>
                            Last login: {new Date(user.last_login_at).toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                      
                      {user.warehouse && (
                        <View style={styles.metaItem}>
                          <Building size={12} color="#6B7280" />
                          <Text style={styles.metaText}>{user.warehouse.name}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.userActions}>
                  {(canEditUsers || user.id === currentUser?.id) && (
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEditModal(user)}
                    >
                      <Edit2 size={18} color="#3B82F6" />
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.moreButton}
                    onPress={() => {
                      // Show context menu
                    }}
                  >
                    <MoreVertical size={18} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* User Detail Modal */}
      <Modal
        visible={userDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setUserDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>User Details</Text>
            {selectedUser && (
              <ScrollView style={styles.detailContent}>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Basic Information</Text>
                  <DetailRow label="Name" value={selectedUser.full_name || 'N/A'} />
                  <DetailRow label="Email" value={selectedUser.email} />
                  <DetailRow label="Phone" value={selectedUser.phone || 'N/A'} />
                  <DetailRow label="Department" value={selectedUser.department || 'N/A'} />
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Roles & Permissions</Text>
                  {selectedUser.roles?.map((role, index) => (
                    <DetailRow key={index} label="Role" value={role.display_name} />
                  ))}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Security Status</Text>
                  <DetailRow 
                    label="Status" 
                    value={getStatusInfo(selectedUser).text} 
                    color={getStatusInfo(selectedUser).color}
                  />
                  <DetailRow 
                    label="Email Verified" 
                    value={selectedUser.email_verified ? 'Yes' : 'No'}
                    color={selectedUser.email_verified ? '#10B981' : '#EF4444'}
                  />
                  <DetailRow 
                    label="Failed Login Attempts" 
                    value={selectedUser.failed_login_attempts.toString()}
                  />
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Activity</Text>
                  <DetailRow 
                    label="Last Login" 
                    value={selectedUser.last_login_at ? 
                      new Date(selectedUser.last_login_at).toLocaleString() : 'Never'
                    }
                  />
                  <DetailRow 
                    label="Last Activity" 
                    value={selectedUser.last_activity_at ? 
                      new Date(selectedUser.last_activity_at).toLocaleString() : 'Never'
                    }
                  />
                  <DetailRow 
                    label="Created" 
                    value={new Date(selectedUser.created_at).toLocaleString()}
                  />
                </View>
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setUserDetailModal(false)}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
              {(canEditUsers || selectedUser?.id === currentUser?.id) && (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => {
                    setUserDetailModal(false);
                    openEditModal(selectedUser!);
                  }}
                >
                  <Text style={styles.saveButtonText}>Edit User</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        visible={editModal}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit User</Text>

            <View style={styles.form}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={formData.full_name}
                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                placeholder="Enter full name"
              />

              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Department</Text>
              <TextInput
                style={styles.input}
                value={formData.department}
                onChangeText={(text) => setFormData({ ...formData, department: text })}
                placeholder="Enter department"
              />

              <Text style={styles.label}>Session Timeout (hours)</Text>
              <TextInput
                style={styles.input}
                value={formData.session_timeout_hours.toString()}
                onChangeText={(text) => setFormData({ ...formData, session_timeout_hours: parseInt(text) || 8 })}
                placeholder="8"
                keyboardType="numeric"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={async () => {
                    try {
                      if (!selectedUser) return;
                      
                      const result = await updateUserProfile(selectedUser.id, formData);
                      if (result.error) throw new Error(result.error);
                      
                      Alert.alert('Success', 'User updated successfully');
                      setEditModal(false);
                      loadUsers();
                    } catch (error: any) {
                      Alert.alert('Error', error.message || 'Failed to update user');
                    }
                  }}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Invite User Modal */}
      <Modal
        visible={inviteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invite New User</Text>

            <View style={styles.form}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={inviteData.email}
                onChangeText={(text) => setInviteData({ ...inviteData, email: text })}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={inviteData.full_name}
                onChangeText={(text) => setInviteData({ ...inviteData, full_name: text })}
                placeholder="Enter full name"
              />

              <Text style={styles.label}>Department</Text>
              <TextInput
                style={styles.input}
                value={inviteData.department || ''}
                onChangeText={(text) => setInviteData({ ...inviteData, department: text })}
                placeholder="Enter department"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setInviteModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={async () => {
                    try {
                      // TODO: Implement user invitation logic
                      Alert.alert('Coming Soon', 'User invitation feature will be implemented in Phase 11.5');
                      setInviteModal(false);
                    } catch (error: any) {
                      Alert.alert('Error', error.message || 'Failed to invite user');
                    }
                  }}
                >
                  <Text style={styles.saveButtonText}>Send Invitation</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  inviteButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  statsContainer: {
    padding: 16,
  },
  statCard: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 16,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedUserCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  selectionCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectionCheckboxText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
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
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  detailContent: {
    maxHeight: 400,
    marginBottom: 24,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
