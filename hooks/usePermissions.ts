import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RBACService from '@/services/rbac.service';

interface PermissionCheck {
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  isRoleAtLeast: (roleName: string) => boolean;
  loading: boolean;
  permissions: string[];
}

export const usePermissions = (): PermissionCheck => {
  const { profile: currentUser } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleLevel, setRoleLevel] = useState<number>(0);

  const loadPermissions = useCallback(async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await RBACService.getUserPermissions(currentUser.id);

      if (result.data) {
        const userPermissions = result.data.map(p => p.permission_name);
        setPermissions(userPermissions);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission) || permissions.includes('admin_' + permission.split('_')[0]);
  };

  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.some(permission => 
      permissions.includes(permission) || permissions.includes('admin_' + permission.split('_')[0])
    );
  };

  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.every(permission => 
      permissions.includes(permission) || permissions.includes('admin_' + permission.split('_')[0])
    );
  };

  const isAdmin = (): boolean => {
    return permissions.includes('admin_all') || 
           hasAnyPermission(['admin_users', 'admin_roles', 'admin_system']);
  };

  const isSuperAdmin = (): boolean => {
    return permissions.includes('admin_all') || 
           permissions.includes('super_admin');
  };

  const isRoleAtLeast = (roleName: string): boolean => {
    const roleLevels: Record<string, number> = {
      'super_admin': 8,
      'admin': 7,
      'manager': 6,
      'sales_manager': 5,
      'warehouse_manager': 4,
      'pos_operator': 3,
      'staff': 2,
      'read_only': 1
    };

    const userRoleLevel = roleLevels[currentUser?.role || ''] || 0;
    const requiredRoleLevel = roleLevels[roleName] || 0;
    
    return userRoleLevel >= requiredRoleLevel;
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isSuperAdmin,
    isRoleAtLeast,
    loading,
    permissions
  };
};

// Permission constants for easy reference
export const PERMISSIONS = {
  // Dashboard permissions
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_DASHBOARD_KPIS: 'view_dashboard_kpis',
  VIEW_DASHBOARD_ALERTS: 'view_dashboard_alerts',
  
  // Product permissions
  VIEW_PRODUCTS: 'view_products',
  CREATE_PRODUCTS: 'create_products',
  EDIT_PRODUCTS: 'edit_products',
  DELETE_PRODUCTS: 'delete_products',
  MANAGE_PRODUCT_IMAGES: 'manage_product_images',
  MANAGE_PRODUCT_CATEGORIES: 'manage_product_categories',
  
  // Inventory permissions
  VIEW_INVENTORY: 'view_inventory',
  MANAGE_INVENTORY: 'manage_inventory',
  ADD_STOCK: 'add_stock',
  REMOVE_STOCK: 'remove_stock',
  TRANSFER_STOCK: 'transfer_stock',
  VIEW_BATCH_INFO: 'view_batch_info',
  MANAGE_EXPIRATION: 'manage_expiration',
  
  // POS permissions
  ACCESS_POS: 'access_pos',
  PROCESS_SALES: 'process_sales',
  PROCESS_REFUNDS: 'process_refunds',
  MANAGE_RECEIPTS: 'manage_receipts',
  VIEW_POS_REPORTS: 'view_pos_reports',
  CONVERT_SALES_ORDERS: 'convert_sales_orders',
  
  // Sales order permissions
  VIEW_SALES_ORDERS: 'view_sales_orders',
  CREATE_SALES_ORDERS: 'create_sales_orders',
  EDIT_SALES_ORDERS: 'edit_sales_orders',
  DELETE_SALES_ORDERS: 'delete_sales_orders',
  FULFILL_ORDERS: 'fulfill_orders',
  
  // Purchase order permissions
  VIEW_PURCHASE_ORDERS: 'view_purchase_orders',
  CREATE_PURCHASE_ORDERS: 'create_purchase_orders',
  EDIT_PURCHASE_ORDERS: 'edit_purchase_orders',
  DELETE_PURCHASE_ORDERS: 'delete_purchase_orders',
  RECEIVE_PURCHASE_ORDERS: 'receive_purchase_orders',
  
  // Supplier permissions
  VIEW_SUPPLIERS: 'view_suppliers',
  CREATE_SUPPLIERS: 'create_suppliers',
  EDIT_SUPPLIERS: 'edit_suppliers',
  DELETE_SUPPLIERS: 'delete_suppliers',
  
  // Warehouse permissions
  VIEW_WAREHOUSES: 'view_warehouses',
  CREATE_WAREHOUSES: 'create_warehouses',
  EDIT_WAREHOUSES: 'edit_warehouses',
  DELETE_WAREHOUSES: 'delete_warehouses',
  
  // User management permissions
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  ASSIGN_ROLES: 'assign_roles',
  MANAGE_USER_SESSIONS: 'manage_user_sessions',
  
  // Role management permissions
  VIEW_ROLES: 'view_roles',
  CREATE_ROLES: 'create_roles',
  EDIT_ROLES: 'edit_roles',
  DELETE_ROLES: 'delete_roles',
  ASSIGN_PERMISSIONS: 'assign_permissions',
  
  // Reports permissions
  VIEW_REPORTS: 'view_reports',
  GENERATE_REPORTS: 'generate_reports',
  EXPORT_REPORTS: 'export_reports',
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_COMPLIANCE_REPORTS: 'view_compliance_reports',
  
  // Audit and security permissions
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  EXPORT_AUDIT_LOGS: 'export_audit_logs',
  VIEW_SECURITY_EVENTS: 'view_security_events',
  MANAGE_SECURITY_CONFIG: 'manage_security_config',
  
  // System permissions
  MANAGE_SYSTEM_CONFIG: 'manage_system_config',
  MANAGE_BACKUPS: 'manage_backups',
  SYSTEM_MAINTENANCE: 'system_maintenance',
  
  // Accounting permissions
  VIEW_ACCOUNTING: 'view_accounting',
  MANAGE_EXPENSES: 'manage_expenses',
  MANAGE_ACCOUNTS_PAYABLE: 'manage_accounts_payable',
  MANAGE_ACCOUNTS_RECEIVABLE: 'manage_accounts_receivable',
  VIEW_FINANCIAL_REPORTS: 'view_financial_reports'
} as const;

export type PermissionName = typeof PERMISSIONS[keyof typeof PERMISSIONS];