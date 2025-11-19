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
  permissions?: Permission[];
  children?: Role[];
  user_count?: number;
}

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  category: string;
  resource: string;
  action: string;
  is_system_permission: boolean;
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
  user?: {
    full_name: string;
    email: string;
  };
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
  id?: string;
  setting_key: string;
  setting_value: any;
  description?: string | null;
  is_active?: boolean;
  updated_at?: string;
  updated_by?: string | null;
}

export interface SecuritySession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address: string;
  user_agent: string;
  login_time: string;
  last_activity: string;
  expires_at: string;
  active: boolean;
  user?: {
    full_name: string;
    email: string;
  };
}

export interface SecurityEvent {
  id: string;
  user_id: string;
  event_type: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  metadata: any;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

export interface SecurityConfigSettings {
  session_timeout_hours: number;
  max_failed_attempts: number;
  lockout_duration_minutes: number;
  password_min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_symbols: boolean;
  password_expiry_days: number;
  require_password_change: boolean;
  enable_audit_logging: boolean;
  enable_session_monitoring: boolean;
}

export interface CreateRoleData {
  name: string;
  display_name: string;
  description?: string | null;
  parent_role_id?: string | null;
  level: number;
}

export interface UpdateRoleData {
  name?: string;
  display_name?: string;
  description?: string | null;
  parent_role_id?: string | null;
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
  static async getAuditLogs(page: number = 1, limit: number = 50, filters?: {
    user_id?: string;
    action?: string;
    resource_type?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ServiceResult<AuditLog[]>> {
    try {
      console.log('RBACService: Fetching audit logs with filters:', filters);
      
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user:profiles!user_id(full_name, email)
        `)
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

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

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
  static async getSecurityConfig(): Promise<ServiceResult<SecurityConfigSettings>> {
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

      // Convert array to settings object
      const settings: SecurityConfigSettings = {
        session_timeout_hours: 8,
        max_failed_attempts: 5,
        lockout_duration_minutes: 30,
        password_min_length: 8,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_symbols: false,
        password_expiry_days: 90,
        require_password_change: false,
        enable_audit_logging: true,
        enable_session_monitoring: true,
      };

      // Update with database values
      data?.forEach(config => {
        switch (config.setting_key) {
          case 'session_timeout_hours':
            settings.session_timeout_hours = config.setting_value;
            break;
          case 'max_failed_attempts':
            settings.max_failed_attempts = config.setting_value;
            break;
          case 'lockout_duration_minutes':
            settings.lockout_duration_minutes = config.setting_value;
            break;
          case 'password_min_length':
            settings.password_min_length = config.setting_value;
            break;
          case 'require_uppercase':
            settings.require_uppercase = config.setting_value;
            break;
          case 'require_lowercase':
            settings.require_lowercase = config.setting_value;
            break;
          case 'require_numbers':
            settings.require_numbers = config.setting_value;
            break;
          case 'require_symbols':
            settings.require_symbols = config.setting_value;
            break;
          case 'password_expiry_days':
            settings.password_expiry_days = config.setting_value;
            break;
          case 'require_password_change':
            settings.require_password_change = config.setting_value;
            break;
          case 'enable_audit_logging':
            settings.enable_audit_logging = config.setting_value;
            break;
          case 'enable_session_monitoring':
            settings.enable_session_monitoring = config.setting_value;
            break;
        }
      });

      console.log('RBACService: Security config fetched successfully');
      return { data: settings, error: null };
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
  // ALIASES FOR COMPATIBILITY
  // =====================================================

  /**
   * Alias for getAllRoles - for backward compatibility
   */
  static async getRoles(): Promise<ServiceResult<Role[]>> {
    return this.getAllRoles();
  }

  /**
   * Alias for getAllPermissions - for backward compatibility
   */
  static async getPermissions(): Promise<ServiceResult<Permission[]>> {
    return this.getAllPermissions();
  }

  // =====================================================
  // ROLE MANAGEMENT - CRUD OPERATIONS
  // =====================================================

  /**
   * Create a new role
   */
  static async createRole(roleData: CreateRoleData): Promise<ServiceResult<Role>> {
    try {
      console.log('RBACService: Creating role:', roleData.name);
      
      const { data, error } = await supabase
        .from('roles')
        .insert({
          name: roleData.name,
          display_name: roleData.display_name,
          description: roleData.description || null,
          level: roleData.level,
          parent_role_id: roleData.parent_role_id || null,
          is_system_role: false,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('RBACService: Supabase error creating role:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Log the creation
      await this.logAuditEvent({
        user_id: null,
        action: 'create_role',
        resource_type: 'role',
        resource_id: data.id,
        new_values: roleData,
        success: true
      });

      console.log('RBACService: Role created successfully');
      return { data, error: null };
    } catch (error) {
      console.error('RBACService: Error creating role:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  /**
   * Update an existing role
   */
  static async updateRole(roleId: string, updateData: UpdateRoleData): Promise<ServiceResult<Role>> {
    try {
      console.log('RBACService: Updating role:', roleId);
      
      const { data, error } = await supabase
        .from('roles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', roleId)
        .select()
        .single();

      if (error) {
        console.error('RBACService: Supabase error updating role:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Log the update
      await this.logAuditEvent({
        user_id: null,
        action: 'update_role',
        resource_type: 'role',
        resource_id: roleId,
        new_values: updateData,
        success: true
      });

      console.log('RBACService: Role updated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('RBACService: Error updating role:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  /**
   * Delete a role
   */
  static async deleteRole(roleId: string): Promise<ServiceResult<any>> {
    try {
      console.log('RBACService: Deleting role:', roleId);
      
      const { data, error } = await supabase
        .from('roles')
        .update({ is_active: false })
        .eq('id', roleId)
        .select()
        .single();

      if (error) {
        console.error('RBACService: Supabase error deleting role:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Log the deletion
      await this.logAuditEvent({
        user_id: null,
        action: 'delete_role',
        resource_type: 'role',
        resource_id: roleId,
        old_values: { id: roleId },
        success: true
      });

      console.log('RBACService: Role deleted successfully');
      return { data, error: null };
    } catch (error) {
      console.error('RBACService: Error deleting role:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  // =====================================================
  // ROLE-PERMISSION MANAGEMENT
  // =====================================================

  /**
   * Get role assignments (users assigned to a role)
   */
  static async getRoleAssignments(roleId: string): Promise<ServiceResult<UserRoleAssignment[]>> {
    try {
      console.log('RBACService: Fetching role assignments for role:', roleId);
      
      const { data, error } = await supabase
        .from('user_role_assignments')
        .select(`
          *,
          user:profiles!user_id(*)
        `)
        .eq('role_id', roleId)
        .eq('is_active', true);

      if (error) {
        console.error('RBACService: Supabase error fetching role assignments:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('RBACService: Role assignments fetched successfully');
      return { data: data || [], error: null };
    } catch (error) {
      console.error('RBACService: Error fetching role assignments:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  /**
   * Get permissions for a specific role
   */
  static async getRolePermissions(roleId: string): Promise<ServiceResult<RolePermission[]>> {
    try {
      console.log('RBACService: Fetching permissions for role:', roleId);
      
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          *,
          permission:permissions(*)
        `)
        .eq('role_id', roleId)
        .eq('is_active', true);

      if (error) {
        console.error('RBACService: Supabase error fetching role permissions:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('RBACService: Role permissions fetched successfully');
      return { data: data || [], error: null };
    } catch (error) {
      console.error('RBACService: Error fetching role permissions:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  /**
   * Assign permission to role
   */
  static async assignPermissionToRole(roleId: string, permissionName: string): Promise<ServiceResult<any>> {
    try {
      console.log('RBACService: Assigning permission to role');
      
      // First get the permission ID
      const { data: permissionData, error: permissionError } = await supabase
        .from('permissions')
        .select('id')
        .eq('name', permissionName)
        .eq('is_active', true)
        .single();

      if (permissionError) {
        console.error('RBACService: Permission not found:', permissionName);
        return { data: null, error: getErrorMessage(permissionError) };
      }

      // Check if assignment already exists
      const { data: existingAssignment } = await supabase
        .from('role_permissions')
        .select('id')
        .eq('role_id', roleId)
        .eq('permission_id', permissionData.id)
        .eq('is_active', true)
        .single();

      if (existingAssignment) {
        console.log('RBACService: Permission already assigned to role');
        return { data: existingAssignment, error: null };
      }

      // Create the assignment
      const { data, error } = await supabase
        .from('role_permissions')
        .insert({
          role_id: roleId,
          permission_id: permissionData.id,
          granted_at: new Date().toISOString(),
          granted_by: null, // Could be current user ID if needed
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('RBACService: Supabase error assigning permission:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Log the assignment
      await this.logAuditEvent({
        user_id: null,
        action: 'assign_permission',
        resource_type: 'role_permission',
        resource_id: data.id,
        new_values: { role_id: roleId, permission_name: permissionName },
        success: true
      });

      console.log('RBACService: Permission assigned to role successfully');
      return { data, error: null };
    } catch (error) {
      console.error('RBACService: Error assigning permission to role:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  /**
   * Remove permission from role
   */
  static async removePermissionFromRole(roleId: string, permissionName: string): Promise<ServiceResult<any>> {
    try {
      console.log('RBACService: Removing permission from role');
      
      // First get the permission ID
      const { data: permissionData, error: permissionError } = await supabase
        .from('permissions')
        .select('id')
        .eq('name', permissionName)
        .eq('is_active', true)
        .single();

      if (permissionError) {
        console.error('RBACService: Permission not found:', permissionName);
        return { data: null, error: getErrorMessage(permissionError) };
      }

      // Deactivate the assignment
      const { data, error } = await supabase
        .from('role_permissions')
        .update({ is_active: false })
        .eq('role_id', roleId)
        .eq('permission_id', permissionData.id)
        .eq('is_active', true)
        .select()
        .single();

      if (error) {
        console.error('RBACService: Supabase error removing permission:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Log the removal
      await this.logAuditEvent({
        user_id: null,
        action: 'remove_permission',
        resource_type: 'role_permission',
        resource_id: data.id,
        old_values: { role_id: roleId, permission_name: permissionName },
        success: true
      });

      console.log('RBACService: Permission removed from role successfully');
      return { data, error: null };
    } catch (error) {
      console.error('RBACService: Error removing permission from role:', error);
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

  // =====================================================
  // SECURITY MANAGEMENT METHODS
  // =====================================================

  /**
   * Get active user sessions
   */
  static async getUserSessions(): Promise<ServiceResult<SecuritySession[]>> {
    try {
      console.log('RBACService: Fetching active user sessions');
      
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          *,
          user:profiles!user_id(full_name, email)
        `)
        .eq('active', true)
        .order('last_activity', { ascending: false });

      if (error) {
        console.error('RBACService: Supabase error fetching user sessions:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      console.log('RBACService: User sessions fetched successfully');
      return { data: data || [], error: null };
    } catch (error) {
      console.error('RBACService: Error fetching user sessions:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  /**
   * Terminate a user session
   */
  static async terminateUserSession(sessionId: string): Promise<ServiceResult<any>> {
    try {
      console.log('RBACService: Terminating user session:', sessionId);
      
      const { data, error } = await supabase
        .from('user_sessions')
        .update({
          active: false,
          expires_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('RBACService: Supabase error terminating session:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Log the termination
      await this.logAuditEvent({
        user_id: data.user_id,
        action: 'session_terminated',
        resource_type: 'user_session',
        resource_id: sessionId,
        success: true
      });

      console.log('RBACService: User session terminated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('RBACService: Error terminating user session:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  /**
   * Lock a user account
   */
  static async lockUserAccount(userId: string, lockoutDurationMinutes: number): Promise<ServiceResult<any>> {
    try {
      console.log('RBACService: Locking user account:', userId);
      
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + lockoutDurationMinutes);

      const { data, error } = await supabase
        .from('profiles')
        .update({
          account_locked_until: lockUntil.toISOString(),
          failed_login_attempts: 0 // Reset failed attempts
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('RBACService: Supabase error locking account:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Log the account lock
      await this.logAuditEvent({
        user_id: userId,
        action: 'account_locked',
        resource_type: 'user_account',
        resource_id: userId,
        new_values: { lockout_duration_minutes: lockoutDurationMinutes },
        success: true
      });

      console.log('RBACService: User account locked successfully');
      return { data, error: null };
    } catch (error) {
      console.error('RBACService: Error locking user account:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  /**
   * Unlock a user account
   */
  static async unlockUserAccount(userId: string): Promise<ServiceResult<any>> {
    try {
      console.log('RBACService: Unlocking user account:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          account_locked_until: null,
          failed_login_attempts: 0 // Reset failed attempts
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('RBACService: Supabase error unlocking account:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Log the account unlock
      await this.logAuditEvent({
        user_id: userId,
        action: 'account_unlocked',
        resource_type: 'user_account',
        resource_id: userId,
        success: true
      });

      console.log('RBACService: User account unlocked successfully');
      return { data, error: null };
    } catch (error) {
      console.error('RBACService: Error unlocking user account:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  /**
   * Update security configuration
   */
  static async updateSecurityConfig(config: SecurityConfigSettings): Promise<ServiceResult<any>> {
    try {
      console.log('RBACService: Updating security configuration');
      
      // Convert settings object to config entries
      const configEntries = Object.entries(config).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
        description: this.getSecuritySettingDescription(key),
        is_active: true,
        updated_at: new Date().toISOString(),
        updated_by: null
      }));

      // Upsert all config entries
      const { data, error } = await supabase
        .from('security_config')
        .upsert(configEntries, {
          onConflict: 'setting_key'
        })
        .select();

      if (error) {
        console.error('RBACService: Supabase error updating security config:', error);
        return { data: null, error: getErrorMessage(error) };
      }

      // Log the configuration update
      await this.logAuditEvent({
        user_id: null,
        action: 'security_config_updated',
        resource_type: 'security_config',
        new_values: config,
        success: true
      });

      console.log('RBACService: Security configuration updated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('RBACService: Error updating security config:', error);
      return { data: null, error: getErrorMessage(error) };
    }
  }

  /**
   * Get description for security setting
   */
  private static getSecuritySettingDescription(key: string): string {
    const descriptions: { [key: string]: string } = {
      'session_timeout_hours': 'Maximum session duration in hours',
      'max_failed_attempts': 'Maximum failed login attempts before lockout',
      'lockout_duration_minutes': 'Account lockout duration in minutes',
      'password_min_length': 'Minimum password length requirement',
      'require_uppercase': 'Require uppercase letters in passwords',
      'require_lowercase': 'Require lowercase letters in passwords',
      'require_numbers': 'Require numbers in passwords',
      'require_symbols': 'Require special symbols in passwords',
      'password_expiry_days': 'Password expiry period in days',
      'require_password_change': 'Force password change on next login',
      'enable_audit_logging': 'Enable comprehensive audit logging',
      'enable_session_monitoring': 'Enable real-time session monitoring'
    };
    
    return descriptions[key] || `Security setting: ${key}`;
  }

  /**
   * Convert audit logs to security events format
   */
  static convertAuditLogsToSecurityEvents(auditLogs: AuditLog[]): SecurityEvent[] {
    return auditLogs.map(log => ({
      id: log.id,
      user_id: log.user_id || '',
      event_type: log.action,
      description: this.generateEventDescription(log),
      ip_address: log.ip_address || undefined,
      user_agent: log.user_agent || undefined,
      metadata: {
        resource_type: log.resource_type,
        resource_id: log.resource_id,
        old_values: log.old_values,
        new_values: log.new_values,
        success: log.success,
        error_message: log.error_message
      },
      created_at: log.created_at,
      user: log.user ? {
        full_name: log.user.full_name || '',
        email: log.user.email || ''
      } : undefined
    }));
  }

  /**
   * Generate human-readable event description
   */
  private static generateEventDescription(log: AuditLog): string {
    const action = log.action.replace('_', ' ').toUpperCase();
    const resource = log.resource_type.replace('_', ' ').toLowerCase();
    
    switch (log.action) {
      case 'login_success':
        return 'User successfully logged in';
      case 'login_failed':
        return 'Failed login attempt';
      case 'account_locked':
        return 'User account was locked';
      case 'account_unlocked':
        return 'User account was unlocked';
      case 'password_changed':
        return 'Password was changed';
      case 'session_started':
        return 'New session started';
      case 'session_expired':
        return 'Session expired';
      case 'permission_denied':
        return 'Access denied due to insufficient permissions';
      case 'security_violation':
        return 'Security policy violation detected';
      case 'create_role':
        return `Created new role: ${log.new_values?.display_name || 'Unknown'}`;
      case 'update_role':
        return `Updated role: ${log.new_values?.display_name || 'Unknown'}`;
      case 'delete_role':
        return `Deleted role: ${log.old_values?.display_name || 'Unknown'}`;
      case 'assign_role':
        return 'User role assignment created';
      case 'remove_role':
        return 'User role assignment removed';
      case 'assign_permission':
        return 'Permission assigned to role';
      case 'remove_permission':
        return 'Permission removed from role';
      default:
        return `${action} performed on ${resource}`;
    }
  }
}

// =====================================================
// EXPORT DEFAULT INSTANCE
// =====================================================

export default RBACService;