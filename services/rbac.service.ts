// =====================================================
// COMPREHENSIVE RBAC SERVICE
// =====================================================
// Enhanced Role-Based Access Control Service
// Provides permission checking, role management, and access control

import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/utils/errorHandler';
import { ServiceResult } from './types';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  level: number;
  parent_role_id: string | null;
  is_system_role: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  category: string;
  resource: string;
  action: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  assigned_at: string;
  assigned_by: string | null;
  expires_at: string | null;
  is_active: boolean;
  role?: Role;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  granted_at: string;
  granted_by: string | null;
  is_active: boolean;
  permission?: Permission;
}

export interface UserPermission {
  permission_name: string;
  category: string;
  resource: string;
  action: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_values: any | null;
  new_values: any | null;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export interface UserActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  module_accessed: string | null;
  metadata: any | null;
  created_at: string;
}

export interface SecurityConfig {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string | null;
  is_active: boolean;
  updated_at: string;
  updated_by: string | null;
}

// =====================================================
// RBAC SERVICE CLASS
// =====================================================

export class RBACService {
  
  // =====================================================
  // ROLE MANAGEMENT
  // =====================================================

  /**
   * Get all roles with hierarchy information
   */
  static async getAllRoles(): Promise<ServiceResult<Role[]>> {
    try {
      console.log('RBACService: Fetching all roles');
      
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true });

      if (error) {
        console.error('RBACService: Supabase error fetching roles:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('RBACService: Roles fetched successfully');
      return { data, error: null };
    } catch (error) {
      console.error('RBACService: Error fetching roles:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  /**
   * Get role hierarchy as a tree structure
   */
  static async getRoleHierarchy(): Promise<ServiceResult<Role[]>> {
    try {
      console.log('RBACService: Building role hierarchy');
      
      const { data: roles, error } = await supabase
        .from('roles')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true });

      if (error) {
        return { data: null, error: getErrorMessage(error) };
      }

      // Build hierarchy tree
      const roleMap = new Map<string, Role & { children: Role[] }>();
      const rootRoles: (Role & { children: Role[] })[] = [];

      // First pass: create map with children arrays
      roles?.forEach(role => {
        roleMap.set(role.id, { ...role, children: [] });
      });

      // Second pass: build hierarchy
      roles?.forEach(role => {
        const roleWithChildren = roleMap.get(role.id)!;
        if (role.parent_role_id) {
          const parent = roleMap.get(role.parent_role_id);
          if (parent) {
            parent.children.push(roleWithChildren);
          }
        } else {
          rootRoles.push(roleWithChildren);
        }
      });

      console.log('RBACService: Role hierarchy built successfully');
      return { data: rootRoles as Role[], error: null };
    } catch (error) {
      console.error('RBACService: Error building role hierarchy:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  // =====================================================
  // PERMISSION MANAGEMENT
  // =====================================================

  /**
   * Get all permissions
   */
  static async getAllPermissions(): Promise<ServiceResult<Permission[]>> {
    try {
      console.log('RBACService: Fetching all permissions');
      
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) {
        console.error('RBACService: Supabase error fetching permissions:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('RBACService: Permissions fetched successfully');
      return { data, error: null };
    } catch (error) {
      console.error('RBACService: Error fetching permissions:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  /**
   * Get permissions by category
   */
  static async getPermissionsByCategory(category: string): Promise<ServiceResult<Permission[]>> {
    try {
      console.log('RBACService: Fetching permissions by category:', category);
      
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('resource', { ascending: true });

      if (error) {
        console.error('RBACService: Supabase error fetching permissions by category:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('RBACService: Category permissions fetched successfully');
      return { data, error: null };
    } catch (error) {
      console.error('RBACService: Error fetching permissions by category:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  // =====================================================
  // USER PERMISSION CHECKING
  // =====================================================

  /**
   * Check if user has specific permission
   */
  static async hasPermission(userId: string, permissionName: string): Promise<ServiceResult<boolean>> {
    try {
      console.log('RBACService: Checking permission:', permissionName, 'for user:', userId);
      
      // Use the PostgreSQL function has_permission
      const { data, error } = await supabase
        .rpc('has_permission', { 
          user_id_param: userId, 
          permission_name_param: permissionName 
        });

      if (error) {
        console.error('RBACService: Supabase error checking permission:', error);
        return { data: false, error: getErrorMessage(error) };
      }

      console.log('RBACService: Permission check result:', data);
      return { data: data || false, error: null };
    } catch (error) {
      console.error('RBACService: Error checking permission:', error);
      return { data: false, error: getErrorMessage(error) };
    }
  }

  /**
   * Get all permissions for a user
   */
  static async getUserPermissions(userId: string): Promise<ServiceResult<UserPermission[]>> {
    try {
      console.log('RBACService: Fetching permissions for user:', userId);
      
      // Use the PostgreSQL function get_user_permissions
      const { data, error } = await supabase
        .rpc('get_user_permissions', { user_id_param: userId });

      if (error) {
        console.error('RBACService: Supabase error fetching user permissions:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('RBACService: User permissions fetched successfully');
      return { data: data || [], error: null };
    } catch (error) {
      console.error('RBACService: Error fetching user permissions:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  /**
   * Check if user has any permission from a list
   */
  static async hasAnyPermission(userId: string, permissionNames: string[]): Promise<ServiceResult<boolean>> {
    try {
      console.log('RBACService: Checking if user has any permission from list:', permissionNames);
      
      // Check permissions in parallel
      const permissionChecks = await Promise.all(
        permissionNames.map(permission => this.hasPermission(userId, permission))
      );

      const hasPermission = permissionChecks.some(result => result.data);
      
      console.log('RBACService: Any permission check result:', hasPermission);
      return { data: hasPermission, error: null };
    } catch (error) {
      console.error('RBACService: Error checking any permission:', error);
      return { data: false, error: getErrorMessage(error) };
    }
  }

  /**
   * Check if user has all permissions from a list
   */
  static async hasAllPermissions(userId: string, permissionNames: string[]): Promise<ServiceResult<boolean>> {
    try {
      console.log('RBACService: Checking if user has all permissions from list:', permissionNames);
      
      // Check permissions in parallel
      const permissionChecks = await Promise.all(
        permissionNames.map(permission => this.hasPermission(userId, permission))
      );

      const hasAllPermissions = permissionChecks.every(result => result.data);
      
      console.log('RBACService: All permissions check result:', hasAllPermissions);
      return { data: hasAllPermissions, error: null };
    } catch (error) {
      console.error('RBACService: Error checking all permissions:', error);
      return { data: false, error: getErrorMessage(error) };
    }
  }

  // =====================================================
  // USER ROLE ASSIGNMENTS
  // =====================================================

  /**
   * Get user role assignments
   */
  static async getUserRoles(userId: string): Promise<ServiceResult<UserRoleAssignment[]>> {
    try {
      console.log('RBACService: Fetching roles for user:', userId);
      
      const { data, error } = await supabase
        .from('user_role_assignments')
        .select(`
          *,
          role:roles(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('RBACService: Supabase error fetching user roles:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('RBACService: User roles fetched successfully');
      return { data: data || [], error: null };
    } catch (error) {
      console.error('RBACService: Error fetching user roles:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  /**
   * Assign role to user
   */
  static async assignRoleToUser(userId: string, roleId: string, assignedBy: string): Promise<ServiceResult<any>> {
    try {
      console.log('RBACService: Assigning role to user');
      
      const { data, error } = await supabase
        .from('user_role_assignments')
        .insert({
          user_id: userId,
          role_id: roleId,
          assigned_by: assignedBy,
          assigned_at: new Date().toISOString(),
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('RBACService: Supabase error assigning role:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Log the assignment
      await this.logAuditEvent({
        user_id: assignedBy,
        action: 'assign_role',
        resource_type: 'user_role_assignment',
        resource_id: data.id,
        new_values: { user_id: userId, role_id: roleId },
        success: true
      });

      console.log('RBACService: Role assigned successfully');
      return { data, error: null };
    } catch (error) {
      console.error('RBACService: Error assigning role:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  /**
   * Remove role from user
   */
  static async removeRoleFromUser(userId: string, roleId: string, removedBy: string): Promise<ServiceResult<any>> {
    try {
      console.log('RBACService: Removing role from user');
      
      const { data, error } = await supabase
        .from('user_role_assignments')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('role_id', roleId)
        .eq('is_active', true)
        .select()
        .single();

      if (error) {
        console.error('RBACService: Supabase error removing role:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Log the removal
      await this.logAuditEvent({
        user_id: removedBy,
        action: 'remove_role',
        resource_type: 'user_role_assignment',
        resource_id: data.id,
        old_values: { user_id: userId, role_id: roleId },
        success: true
      });

      console.log('RBACService: Role removed successfully');
      return { data, error: null };
    } catch (error) {
      console.error('RBACService: Error removing role:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  // =====================================================
  // AUDIT LOGGING
  // =====================================================

  /**
   * Log audit event
   */
  static async logAuditEvent(auditData: {
    user_id: string | null;
    action: string;
    resource_type: string;
    resource_id?: string | null;
    old_values?: any;
    new_values?: any;
    ip_address?: string | null;
    user_agent?: string | null;
    session_id?: string | null;
    success?: boolean;
    error_message?: string | null;
  }): Promise<ServiceResult<any>> {
    try {
      console.log('RBACService: Logging audit event:', auditData.action);
      
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: auditData.user_id,
          action: auditData.action,
          resource_type: auditData.resource_type,
          resource_id: auditData.resource_id || null,
          old_values: auditData.old_values || null,
          new_values: auditData.new_values || null,
          ip_address: auditData.ip_address || null,
          user_agent: auditData.user_agent || null,
          session_id: auditData.session_id || null,
          success: auditData.success !== false,
          error_message: auditData.error_message || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('RBACService: Supabase error logging audit event:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      return { data, error: null };
    } catch (error) {
      console.error('RBACService: Error logging audit event:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  /**
   * Get audit logs
   */
  static async getAuditLogs(filters?: {
    user_id?: string;
    action?: string;
    resource_type?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  }): Promise<ServiceResult<AuditLog[]>> {
    try {
      console.log('RBACService: Fetching audit logs with filters:', filters);
      
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.resource_type) {
        query = query.eq('resource_type', filters.resource_type);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('RBACService: Supabase error fetching audit logs:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('RBACService: Audit logs fetched successfully');
      return { data: data || [], error: null };
    } catch (error) {
      console.error('RBACService: Error fetching audit logs:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  // =====================================================
  // USER ACTIVITY TRACKING
  // =====================================================

  /**
   * Log user activity
   */
  static async logUserActivity(activityData: {
    user_id: string;
    activity_type: string;
    description?: string;
    ip_address?: string;
    user_agent?: string;
    session_id?: string;
    module_accessed?: string;
    metadata?: any;
  }): Promise<ServiceResult<any>> {
    try {
      console.log('RBACService: Logging user activity:', activityData.activity_type);
      
      const { data, error } = await supabase
        .from('user_activity_logs')
        .insert({
          user_id: activityData.user_id,
          activity_type: activityData.activity_type,
          description: activityData.description || null,
          ip_address: activityData.ip_address || null,
          user_agent: activityData.user_agent || null,
          session_id: activityData.session_id || null,
          module_accessed: activityData.module_accessed || null,
          metadata: activityData.metadata || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('RBACService: Supabase error logging user activity:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Update user last activity
      await this.updateUserActivity(activityData.user_id);

      return { data, error: null };
    } catch (error) {
      console.error('RBACService: Error logging user activity:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  /**
   * Update user activity timestamp
   */
  static async updateUserActivity(userId: string): Promise<ServiceResult<any>> {
    try {
      console.log('RBACService: Updating user activity for:', userId);
      
      // Use the PostgreSQL function update_user_activity
      const { error } = await supabase
        .rpc('update_user_activity', { user_id_param: userId });

      if (error) {
        console.error('RBACService: Supabase error updating user activity:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      return { data: true, error: null };
    } catch (error) {
      console.error('RBACService: Error updating user activity:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  /**
   * Get user activity logs
   */
  static async getUserActivity(userId: string, limit: number = 50): Promise<ServiceResult<UserActivityLog[]>> {
    try {
      console.log('RBACService: Fetching user activity for:', userId);
      
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('RBACService: Supabase error fetching user activity:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('RBACService: User activity fetched successfully');
      return { data: data || [], error: null };
    } catch (error) {
      console.error('RBACService: Error fetching user activity:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  // =====================================================
  // SECURITY CONFIGURATION
  // =====================================================

  /**
   * Get security configuration
   */
  static async getSecurityConfig(): Promise<ServiceResult<SecurityConfig[]>> {
    try {
      console.log('RBACService: Fetching security configuration');
      
      const { data, error } = await supabase
        .from('security_config')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('RBACService: Supabase error fetching security config:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('RBACService: Security config fetched successfully');
      return { data: data || [], error: null };
    } catch (error) {
      console.error('RBACService: Error fetching security config:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  /**
   * Get specific security setting
   */
  static async getSecuritySetting(key: string): Promise<ServiceResult<any>> {
    try {
      console.log('RBACService: Fetching security setting:', key);
      
      const { data, error } = await supabase
        .from('security_config')
        .select('setting_value')
        .eq('setting_key', key)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('RBACService: Supabase error fetching security setting:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('RBACService: Security setting fetched successfully');
      return { data: data?.setting_value || null, error: null };
    } catch (error) {
      console.error('RBACService: Error fetching security setting:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  /**
   * Check if user is admin (admin or super_admin)
   */
  static async isAdmin(userId: string): Promise<ServiceResult<boolean>> {
    const rolesResult = await this.getUserRoles(userId);
    if (rolesResult.error) {
      return { data: false, error: rolesResult.error };
    }

    const isAdmin = rolesResult.data?.some(assignment => 
      assignment.role?.name === 'admin' || assignment.role?.name === 'super_admin'
    ) || false;

    return { data: isAdmin, error: null };
  }

  /**
   * Check if user is super admin
   */
  static async isSuperAdmin(userId: string): Promise<ServiceResult<boolean>> {
    const rolesResult = await this.getUserRoles(userId);
    if (rolesResult.error) {
      return { data: false, error: rolesResult.error };
    }

    const isSuperAdmin = rolesResult.data?.some(assignment => 
      assignment.role?.name === 'super_admin'
    ) || false;

    return { data: isSuperAdmin, error: null };
  }

  /**
   * Get user's highest role level (1 = super_admin, 8 = read_only)
   */
  static async getUserHighestRoleLevel(userId: string): Promise<ServiceResult<number>> {
    const rolesResult = await this.getUserRoles(userId);
    if (rolesResult.error) {
      return { data: 999, error: rolesResult.error };
    }

    const highestLevel = Math.min(...(rolesResult.data?.map(assignment => assignment.role?.level || 999) || [999]));
    return { data: highestLevel, error: null };
  }
}

// =====================================================
// EXPORT DEFAULT INSTANCE
// =====================================================

export default RBACService;