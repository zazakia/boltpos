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
  Switch,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import RBACService from '@/services/rbac.service';
import { 
  Shield, 
  Edit2, 
  Plus, 
  MoreVertical, 
  ArrowRight,
  Users,
  Settings,
  Eye,
  Lock,
  Check,
  X,
  Trash2,
  Copy,
  Crown,
  UserCheck,
  UserX,
  AlertTriangle,
  Search,
  Filter,
} from 'lucide-react-native';

interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  level: number;
  parent_role_id: string | null;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
  permissions?: Permission[];
  children?: Role[];
  user_count?: number;
}

interface Permission {
  id: string;
  name: string;
  display_name: string;
  category: string;
  description: string | null;
  is_system_permission: boolean;
}

interface RoleFormData {
  name: string;
  display_name: string;
  description: string;
  parent_role_id: string | null;
  permissions: string[];
}

const ROLE_LEVELS = {
  1: { name: 'Level 1', color: '#EF4444', icon: <Crown size={16} color="#EF4444" /> },
  2: { name: 'Level 2', color: '#F59E0B', icon: <Shield size={16} color="#F59E0B" /> },
  3: { name: 'Level 3', color: '#3B82F6', icon: <Settings size={16} color="#3B82F6" /> },
  4: { name: 'Level 4', color: '#10B981', icon: <UserCheck size={16} color="#10B981" /> },
  5: { name: 'Level 5', color: '#6B7280', icon: <Users size={16} color="#6B7280" /> },
  6: { name: 'Level 6', color: '#9CA3AF', icon: <Eye size={16} color="#9CA3AF" /> },
  7: { name: 'Level 7', color: '#9CA3AF', icon: <Eye size={16} color="#9CA3AF" /> },
  8: { name: 'Level 8', color: '#9CA3AF', icon: <Eye size={16} color="#9CA3AF" /> },
};

const PERMISSION_CATEGORIES = {
  'Dashboard': { icon: <Eye size={16} color="#3B82F6" />, color: '#DBEAFE' },
  'Products': { icon: <Settings size={16} color="#10B981" />, color: '#D1FAE5' },
  'Inventory': { icon: <Lock size={16} color="#F59E0B" />, color: '#FEF3C7' },
  'POS': { icon: <UserCheck size={16} color="#8B5CF6" />, color: '#EDE9FE' },
  'Reports': { icon: <Filter size={16} color="#06B6D4" />, color: '#CFFAFE' },
  'Users': { icon: <Users size={16} color="#84CC16" />, color: '#ECFCCB' },
  'Accounting': { icon: <Shield size={16} color="#EF4444" />, color: '#FEE2E2' },
  'System': { icon: <Settings size={16} color="#6B7280" />, color: '#F3F4F6' },
};

export default function RoleManagement() {
  const { profile: currentUser } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [permissionModal, setPermissionModal] = useState(false);
  const [hierarchyModal, setHierarchyModal] = useState(false);
  
  // Selected states
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'hierarchy'>('grid');
  
  // Form states
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    display_name: '',
    description: '',
    parent_role_id: null,
    permissions: [],
  });

  // Check permissions
  const [permissionsList, setPermissionsList] = useState<string[]>([]);
  const canCreateRoles = permissionsList.includes('manage_roles');
  const canEditRoles = permissionsList.includes('edit_roles');
  const canDeleteRoles = permissionsList.includes('delete_roles');
  const canManagePermissions = permissionsList.includes('manage_permissions');
  const canViewRoles = permissionsList.includes('view_users') || canEditRoles || canCreateRoles;

  useEffect(() => {
    if (currentUser?.id) {
      loadPermissions();
    }
  }, [currentUser]);

  useEffect(() => {
    if (permissionsList.length > 0) {
      loadData();
    }
  }, [permissionsList]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [roles, searchQuery, filterLevel]);

  const loadPermissions = async () => {
    if (!currentUser?.id) return;
    
    const result = await RBACService.getUserPermissions(currentUser.id);
    if (result.data) {
      setPermissionsList(result.data.map(p => p.permission_name));
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load roles and permissions in parallel
      const [rolesResult, permissionsResult] = await Promise.all([
        RBACService.getRoles(),
        RBACService.getPermissions(),
      ]);

      if (rolesResult.error) throw new Error(rolesResult.error);
      if (permissionsResult.error) throw new Error(permissionsResult.error);

      const rolesData = rolesResult.data || [];
      const permissionsData = permissionsResult.data || [];

      // Enhance roles with user counts
      const enhancedRoles = await Promise.all(
        rolesData.map(async (role: any) => {
          const roleAssignmentsResult = await RBACService.getRoleAssignments(role.id);
          const userCount = roleAssignmentsResult.data?.length || 0;
          
          return {
            ...role,
            user_count: userCount,
          };
        })
      );

      // Build role hierarchy
      const rolesWithHierarchy = buildRoleHierarchy(enhancedRoles);

      setRoles(rolesWithHierarchy);
      setPermissions(permissionsData);
    } catch (error) {
      console.error('Error loading role data:', error);
      Alert.alert('Error', 'Failed to load role data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const buildRoleHierarchy = (roles: Role[]): Role[] => {
    const roleMap = new Map<string, Role>();
    const rootRoles: Role[] = [];

    // Create map and initialize children
    roles.forEach(role => {
      roleMap.set(role.id, { ...role, children: [] });
    });

    // Build hierarchy
    roles.forEach(role => {
      const roleWithChildren = roleMap.get(role.id)!;
      if (role.parent_role_id) {
        const parent = roleMap.get(role.parent_role_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(roleWithChildren);
        }
      } else {
        rootRoles.push(roleWithChildren);
      }
    });

    return rootRoles;
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...roles];

    // Apply search query
    if (searchQuery) {
      filtered = filterRolesBySearch(filtered, searchQuery);
    }

    // Apply level filter
    if (filterLevel !== 'all') {
      filtered = filtered.filter(role => role.level === filterLevel);
    }

    setFilteredRoles(filtered);
  };

  const filterRolesBySearch = (rolesList: Role[], query: string): Role[] => {
    const lowerQuery = query.toLowerCase();
    const result: Role[] = [];

    rolesList.forEach(role => {
      const matchesRole = 
        role.display_name.toLowerCase().includes(lowerQuery) ||
        role.name.toLowerCase().includes(lowerQuery) ||
        role.description?.toLowerCase().includes(lowerQuery);

      const matchingChildren = role.children ? filterRolesBySearch(role.children, query) : [];

      if (matchesRole || matchingChildren.length > 0) {
        result.push({
          ...role,
          children: matchingChildren,
        });
      }
    });

    return result;
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      parent_role_id: null,
      permissions: [],
    });
    setCreateModal(true);
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      display_name: role.display_name,
      description: role.description || '',
      parent_role_id: role.parent_role_id,
      permissions: role.permissions?.map(p => p.name) || [],
    });
    setEditModal(true);
  };

  const openPermissionModal = (role: Role) => {
    setSelectedRole(role);
    setPermissionModal(true);
  };

  const handleCreateRole = async () => {
    try {
      // Validate form
      if (!formData.name || !formData.display_name) {
        Alert.alert('Validation Error', 'Name and display name are required.');
        return;
      }

      // Check for duplicate role names
      const existingRole = roles.find(role => 
        role.name === formData.name || role.display_name === formData.display_name
      );
      if (existingRole) {
        Alert.alert('Validation Error', 'A role with this name already exists.');
        return;
      }

      const result = await RBACService.createRole({
        name: formData.name,
        display_name: formData.display_name,
        description: formData.description || null,
        parent_role_id: formData.parent_role_id,
        level: formData.parent_role_id ? 
          (roles.find(r => r.id === formData.parent_role_id)?.level || 1) + 1 : 1,
      });

      if (result.error) throw new Error(result.error);
      if (!result.data) throw new Error('Failed to create role - no data returned');

      // Assign permissions if any
      if (formData.permissions.length > 0) {
        for (const permissionName of formData.permissions) {
          await RBACService.assignPermissionToRole(result.data.id, permissionName);
        }
      }

      Alert.alert('Success', 'Role created successfully');
      setCreateModal(false);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create role');
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;

    try {
      // Prevent editing system roles
      if (selectedRole.is_system_role) {
        Alert.alert('Error', 'System roles cannot be edited.');
        return;
      }

      const result = await RBACService.updateRole(selectedRole.id, {
        name: formData.name,
        display_name: formData.display_name,
        description: formData.description || null,
        parent_role_id: formData.parent_role_id,
      });

      if (result.error) throw new Error(result.error);

      // Update permissions
      const currentPermissions = selectedRole.permissions?.map(p => p.name) || [];
      const permissionsToAdd = formData.permissions.filter(p => !currentPermissions.includes(p));
      const permissionsToRemove = currentPermissions.filter(p => !formData.permissions.includes(p));

      // Add new permissions
      for (const permissionName of permissionsToAdd) {
        await RBACService.assignPermissionToRole(selectedRole.id, permissionName);
      }

      // Remove old permissions
      for (const permissionName of permissionsToRemove) {
        await RBACService.removePermissionFromRole(selectedRole.id, permissionName);
      }

      Alert.alert('Success', 'Role updated successfully');
      setEditModal(false);
      setSelectedRole(null);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update role');
    }
  };

  const handleDeleteRole = async (role: Role) => {
    try {
      // Prevent deleting system roles or roles with users
      if (role.is_system_role) {
        Alert.alert('Error', 'System roles cannot be deleted.');
        return;
      }

      if (role.user_count && role.user_count > 0) {
        Alert.alert('Error', `Cannot delete role with ${role.user_count} assigned users. Please reassign users first.`);
        return;
      }

      // Check for child roles
      const hasChildren = roles.some(r => r.parent_role_id === role.id);
      if (hasChildren) {
        Alert.alert('Error', 'Cannot delete role with child roles. Please delete or reassign child roles first.');
        return;
      }

      Alert.alert(
        'Delete Role',
        `Are you sure you want to delete the "${role.display_name}" role?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const result = await RBACService.deleteRole(role.id);
                if (result.error) throw new Error(result.error);
                
                Alert.alert('Success', 'Role deleted successfully');
                loadData();
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to delete role');
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete role');
    }
  };

  const handleDuplicateRole = async (role: Role) => {
    try {
      const newRoleData = {
        name: `${role.name}_copy`,
        display_name: `${role.display_name} (Copy)`,
        description: role.description,
        parent_role_id: role.parent_role_id,
        level: role.level,
      };

      const result = await RBACService.createRole(newRoleData);
      if (result.error) throw new Error(result.error);
      if (!result.data) throw new Error('Failed to create role - no data returned');

      // Copy permissions
      if (role.permissions && role.permissions.length > 0) {
        for (const permission of role.permissions) {
          await RBACService.assignPermissionToRole(result.data.id, permission.name);
        }
      }

      Alert.alert('Success', 'Role duplicated successfully');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to duplicate role');
    }
  };

  const getPermissionsByCategory = () => {
    const grouped: { [key: string]: Permission[] } = {};
    
    permissions.forEach(permission => {
      if (!grouped[permission.category]) {
        grouped[permission.category] = [];
      }
      grouped[permission.category].push(permission);
    });

    return grouped;
  };

  const togglePermission = (permissionName: string) => {
    const newPermissions = formData.permissions.includes(permissionName)
      ? formData.permissions.filter(p => p !== permissionName)
      : [...formData.permissions, permissionName];
    
    setFormData({ ...formData, permissions: newPermissions });
  };

  const getRoleLevelInfo = (level: number) => {
    return ROLE_LEVELS[level as keyof typeof ROLE_LEVELS] || ROLE_LEVELS[8];
  };

  const renderRoleCard = (role: Role, depth: number = 0) => {
    const levelInfo = getRoleLevelInfo(role.level);
    const hasChildren = role.children && role.children.length > 0;
    
    return (
      <View key={role.id} style={[styles.roleCard, { marginLeft: depth * 20 }]}>
        <View style={styles.roleHeader}>
          <View style={styles.roleInfo}>
            <View style={styles.roleTitle}>
              <View style={styles.roleLevel}>
                {levelInfo.icon}
                <Text style={[styles.roleLevelText, { color: levelInfo.color }]}>
                  {levelInfo.name}
                </Text>
              </View>
              <Text style={styles.roleName}>{role.display_name}</Text>
              {role.is_system_role && (
                <View style={styles.systemBadge}>
                  <Text style={styles.systemBadgeText}>SYSTEM</Text>
                </View>
              )}
            </View>
            <Text style={styles.roleDescription}>{role.description || 'No description'}</Text>
            <View style={styles.roleMeta}>
              <Text style={styles.userCount}>
                {role.user_count || 0} users assigned
              </Text>
              {hasChildren && (
                <Text style={styles.childCount}>
                  {role.children!.length} child roles
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.roleActions}>
            {canViewRoles && (
              <>
                {canManagePermissions && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openPermissionModal(role)}
                  >
                    <Settings size={16} color="#6B7280" />
                  </TouchableOpacity>
                )}
                
                {(canEditRoles && !role.is_system_role) && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openEditModal(role)}
                  >
                    <Edit2 size={16} color="#3B82F6" />
                  </TouchableOpacity>
                )}
                
                {canCreateRoles && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDuplicateRole(role)}
                  >
                    <Copy size={16} color="#8B5CF6" />
                  </TouchableOpacity>
                )}
                
                {(canDeleteRoles && !role.is_system_role && role.user_count === 0 && !hasChildren) && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteRole(role)}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
        
        {hasChildren && (
          <View style={styles.childrenContainer}>
            {role.children!.map(child => renderRoleCard(child, depth + 1))}
          </View>
        )}
      </View>
    );
  };

  if (!canViewRoles) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDenied}>
          <Shield size={48} color="#EF4444" />
          <Text style={styles.accessDeniedText}>Access Denied</Text>
          <Text style={styles.accessDeniedSubtext}>
            You don't have permission to view role management
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
          <Text style={styles.headerTitle}>Role Management</Text>
          <Text style={styles.headerSubtitle}>
            {filteredRoles.length} of {roles.length} roles
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
              onPress={() => setViewMode('grid')}
            >
              <Text style={[styles.viewButtonText, viewMode === 'grid' && styles.viewButtonTextActive]}>
                Grid
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'hierarchy' && styles.viewButtonActive]}
              onPress={() => setViewMode('hierarchy')}
            >
              <Text style={[styles.viewButtonText, viewMode === 'hierarchy' && styles.viewButtonTextActive]}>
                Hierarchy
              </Text>
            </TouchableOpacity>
          </View>
          
          {canCreateRoles && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={openCreateModal}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>New Role</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchText}
            placeholder="Search roles..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Level:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, filterLevel === 'all' && styles.filterChipActive]}
              onPress={() => setFilterLevel('all')}
            >
              <Text style={[styles.filterChipText, filterLevel === 'all' && styles.filterChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            
            {[1, 2, 3, 4, 5, 6, 7, 8].map(level => (
              <TouchableOpacity
                key={level}
                style={[styles.filterChip, filterLevel === level && styles.filterChipActive]}
                onPress={() => setFilterLevel(level)}
              >
                <Text style={[styles.filterChipText, filterLevel === level && styles.filterChipTextActive]}>
                  L{level}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Role List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} />
        }
      >
        {filteredRoles.length === 0 ? (
          <View style={styles.emptyState}>
            <Shield size={48} color="#6B7280" />
            <Text style={styles.emptyStateText}>
              {searchQuery || filterLevel !== 'all' 
                ? 'No roles match your criteria'
                : 'No roles found'
              }
            </Text>
            {canCreateRoles && !searchQuery && filterLevel === 'all' && (
              <TouchableOpacity style={styles.emptyStateButton} onPress={openCreateModal}>
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.emptyStateButtonText}>Create First Role</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredRoles.map(role => renderRoleCard(role))
        )}
      </ScrollView>

      {/* Create Role Modal */}
      <Modal
        visible={createModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <Text style={styles.modalTitle}>Create New Role</Text>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Role Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter role name (e.g., sales_manager)"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={formData.display_name}
                onChangeText={(text) => setFormData({ ...formData, display_name: text })}
                placeholder="Enter display name (e.g., Sales Manager)"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter role description"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Parent Role</Text>
              <View style={styles.pickerContainer}>
                {roles
                  .filter(role => role.level < 7) // Max level 8, so parent must be <= 7
                  .map(role => (
                    <TouchableOpacity
                      key={role.id}
                      style={[
                        styles.pickerOption,
                        formData.parent_role_id === role.id && styles.pickerOptionSelected
                      ]}
                      onPress={() => setFormData({ 
                        ...formData, 
                        parent_role_id: formData.parent_role_id === role.id ? null : role.id 
                      })}
                    >
                      <View style={styles.roleOptionContent}>
                        <Text style={styles.pickerOptionText}>
                          {role.display_name}
                        </Text>
                        <Text style={styles.pickerOptionLevel}>
                          Level {role.level}
                        </Text>
                      </View>
                      {formData.parent_role_id === role.id && (
                        <Check size={16} color="#3B82F6" />
                      )}
                    </TouchableOpacity>
                  ))
                }
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    formData.parent_role_id === null && styles.pickerOptionSelected
                  ]}
                  onPress={() => setFormData({ ...formData, parent_role_id: null })}
                >
                  <Text style={styles.pickerOptionText}>No Parent (Top Level)</Text>
                  {formData.parent_role_id === null && (
                    <Check size={16} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setCreateModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleCreateRole}
                >
                  <Text style={styles.saveButtonText}>Create Role</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        visible={editModal}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <Text style={styles.modalTitle}>Edit Role</Text>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Role Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter role name"
                autoCapitalize="none"
                editable={!selectedRole?.is_system_role}
              />

              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={formData.display_name}
                onChangeText={(text) => setFormData({ ...formData, display_name: text })}
                placeholder="Enter display name"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter role description"
                multiline
                numberOfLines={3}
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
                  onPress={handleUpdateRole}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Permission Assignment Modal */}
      <Modal
        visible={permissionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setPermissionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <Text style={styles.modalTitle}>
              Assign Permissions to {selectedRole?.display_name}
            </Text>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
                <View key={category} style={styles.permissionCategory}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryIcon}>
                      {PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES]?.icon}
                    </View>
                    <Text style={styles.categoryTitle}>{category}</Text>
                    <Text style={styles.permissionCount}>
                      {formData.permissions.filter(p => 
                        categoryPermissions.some(cp => cp.name === p)
                      ).length} / {categoryPermissions.length}
                    </Text>
                  </View>
                  
                  <View style={styles.permissionList}>
                    {categoryPermissions.map(permission => {
                      const isAssigned = formData.permissions.includes(permission.name);
                      return (
                        <TouchableOpacity
                          key={permission.id}
                          style={[
                            styles.permissionItem,
                            isAssigned && styles.permissionItemAssigned
                          ]}
                          onPress={() => togglePermission(permission.name)}
                        >
                          <View style={styles.permissionInfo}>
                            <Text style={[
                              styles.permissionName,
                              isAssigned && styles.permissionNameAssigned
                            ]}>
                              {permission.display_name}
                            </Text>
                            {permission.description && (
                              <Text style={styles.permissionDescription}>
                                {permission.description}
                              </Text>
                            )}
                          </View>
                          <View style={[
                            styles.permissionCheckbox,
                            isAssigned && styles.permissionCheckboxChecked
                          ]}>
                            {isAssigned && <Check size={16} color="#FFFFFF" />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setPermissionModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => {
                    setPermissionModal(false);
                    handleUpdateRole();
                  }}
                >
                  <Text style={styles.saveButtonText}>Save Permissions</Text>
                </TouchableOpacity>
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
    alignItems: 'center',
    gap: 12,
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
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  viewButtonTextActive: {
    color: '#3B82F6',
  },
  createButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
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
  filterContainer: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 64,
    gap: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptyStateButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  roleLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleLevelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  roleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  systemBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  systemBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
  },
  roleDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  roleMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  userCount: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  childCount: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  roleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  childrenContainer: {
    marginTop: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
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
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    gap: 8,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  pickerOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  roleOptionContent: {
    flex: 1,
  },
  pickerOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  pickerOptionLevel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  permissionCategory: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  permissionCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  permissionList: {
    gap: 8,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  permissionItemAssigned: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  permissionInfo: {
    flex: 1,
  },
  permissionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  permissionNameAssigned: {
    color: '#3B82F6',
  },
  permissionDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  permissionCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionCheckboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
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