-- =====================================================
-- COMPREHENSIVE RBAC SYSTEM - DATABASE SCHEMA
-- =====================================================
-- Migration Date: November 5, 2025
-- Version: Phase 11.1 - Database Schema & Role Hierarchy System
-- Description: Enhanced RBAC system with granular permissions and role hierarchy

-- =====================================================
-- 1. ENHANCE PROFILES TABLE
-- =====================================================

-- Add new columns to profiles table for enhanced RBAC
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS warehouse_id uuid REFERENCES warehouses(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_locked_until timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invitation_accepted boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invited_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS session_timeout_hours integer DEFAULT 8;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_warehouse_id ON profiles(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_profiles_failed_attempts ON profiles(failed_login_attempts);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON profiles(last_login_at);
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity ON profiles(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_profiles_invited_by ON profiles(invited_by);
CREATE INDEX IF NOT EXISTS idx_profiles_session_timeout ON profiles(session_timeout_hours);

-- =====================================================
-- 2. ROLES TABLE - ROLE HIERARCHY SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  level integer NOT NULL, -- Hierarchy level (1=highest, 8=lowest)
  parent_role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
  is_system_role boolean DEFAULT false, -- true for built-in roles
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default role hierarchy
INSERT INTO roles (name, display_name, description, level, parent_role_id, is_system_role) VALUES
  ('super_admin', 'Super Administrator', 'Complete system control and configuration access', 1, null, true),
  ('admin', 'Administrator', 'Full business operations control', 2, (SELECT id FROM roles WHERE name = 'super_admin'), true),
  ('manager', 'Manager', 'Department-specific management control', 3, (SELECT id FROM roles WHERE name = 'admin'), true),
  ('sales_manager', 'Sales Manager', 'Sales operations management', 4, (SELECT id FROM roles WHERE name = 'manager'), true),
  ('warehouse_manager', 'Warehouse Manager', 'Inventory and warehouse operations', 4, (SELECT id FROM roles WHERE name = 'manager'), true),
  ('pos_operator', 'POS Operator', 'Point-of-sale operations', 5, (SELECT id FROM roles WHERE name = 'sales_manager'), true),
  ('staff', 'Staff Member', 'General operations and viewing access', 6, (SELECT id FROM roles WHERE name = 'pos_operator'), true),
  ('read_only', 'Read-Only User', 'View-only access to dashboards and reports', 7, (SELECT id FROM roles WHERE name = 'staff'), true)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  level = EXCLUDED.level,
  parent_role_id = EXCLUDED.parent_role_id,
  updated_at = now();

-- Create indexes for roles
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);
CREATE INDEX IF NOT EXISTS idx_roles_parent ON roles(parent_role_id);
CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(is_active);

-- =====================================================
-- 3. PERMISSIONS TABLE - GRANULAR PERMISSIONS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  category text NOT NULL, -- dashboard, products, inventory, pos, reports, users, accounting, system
  resource text NOT NULL, -- Specific resource or action
  action text NOT NULL,   -- view, create, edit, delete, admin, export
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert comprehensive permissions matrix
INSERT INTO permissions (name, display_name, description, category, resource, action) VALUES

-- Dashboard Permissions
  ('view_dashboard', 'View Dashboard', 'Access to main dashboard and KPIs', 'dashboard', 'dashboard', 'view'),
  ('view_kpis', 'View KPIs', 'Access to key performance indicators', 'dashboard', 'kpis', 'view'),
  ('view_alerts', 'View Alerts', 'Access to system alerts and notifications', 'dashboard', 'alerts', 'view'),

-- Products Permissions
  ('view_products', 'View Products', 'View product listings and details', 'products', 'products', 'view'),
  ('create_products', 'Create Products', 'Add new products to system', 'products', 'products', 'create'),
  ('edit_products', 'Edit Products', 'Modify existing product details', 'products', 'products', 'edit'),
  ('delete_products', 'Delete Products', 'Remove products from system', 'products', 'products', 'delete'),
  ('admin_products', 'Product Administration', 'Full product management including bulk operations', 'products', 'products', 'admin'),

-- Inventory Permissions
  ('view_inventory', 'View Inventory', 'View stock levels and inventory details', 'inventory', 'inventory', 'view'),
  ('add_inventory', 'Add Inventory', 'Add stock and make inventory adjustments', 'inventory', 'inventory', 'create'),
  ('edit_inventory', 'Edit Inventory', 'Modify stock quantities and details', 'inventory', 'inventory', 'edit'),
  ('transfer_inventory', 'Transfer Inventory', 'Move inventory between warehouses', 'inventory', 'inventory', 'transfer'),
  ('manage_batches', 'Manage Batches', 'Handle batch tracking and expiration', 'inventory', 'batches', 'admin'),
  ('admin_inventory', 'Inventory Administration', 'Full inventory management and reporting', 'inventory', 'inventory', 'admin'),

-- Suppliers & Purchase Orders
  ('view_suppliers', 'View Suppliers', 'View supplier information', 'suppliers', 'suppliers', 'view'),
  ('create_suppliers', 'Create Suppliers', 'Add new supplier records', 'suppliers', 'suppliers', 'create'),
  ('edit_suppliers', 'Edit Suppliers', 'Modify supplier details', 'suppliers', 'suppliers', 'edit'),
  ('admin_suppliers', 'Supplier Administration', 'Full supplier management', 'suppliers', 'suppliers', 'admin'),
  
  ('view_purchase_orders', 'View Purchase Orders', 'View purchase order listings', 'purchases', 'purchase_orders', 'view'),
  ('create_purchase_orders', 'Create Purchase Orders', 'Create new purchase orders', 'purchases', 'purchase_orders', 'create'),
  ('edit_purchase_orders', 'Edit Purchase Orders', 'Modify existing purchase orders', 'purchases', 'purchase_orders', 'edit'),
  ('approve_purchase_orders', 'Approve Purchase Orders', 'Approve purchase orders', 'purchases', 'purchase_orders', 'approve'),
  ('admin_purchase_orders', 'Purchase Order Administration', 'Full PO management', 'purchases', 'purchase_orders', 'admin'),

-- POS & Sales
  ('use_pos', 'Use POS System', 'Process sales transactions', 'pos', 'pos', 'use'),
  ('void_transactions', 'Void Transactions', 'Cancel or void sales transactions', 'pos', 'transactions', 'void'),
  ('override_prices', 'Override Prices', 'Change product prices during transactions', 'pos', 'pricing', 'override'),
  ('access_sales_reports', 'Access Sales Reports', 'View POS and sales reports', 'pos', 'reports', 'view'),
  ('admin_pos', 'POS Administration', 'Full POS system management', 'pos', 'pos', 'admin'),

-- Sales Orders
  ('view_sales_orders', 'View Sales Orders', 'View customer sales orders', 'sales', 'sales_orders', 'view'),
  ('create_sales_orders', 'Create Sales Orders', 'Create new customer orders', 'sales', 'sales_orders', 'create'),
  ('edit_sales_orders', 'Edit Sales Orders', 'Modify existing sales orders', 'sales', 'sales_orders', 'edit'),
  ('fulfill_orders', 'Fulfill Orders', 'Complete order fulfillment', 'sales', 'sales_orders', 'fulfill'),
  ('cancel_orders', 'Cancel Orders', 'Cancel customer orders', 'sales', 'sales_orders', 'cancel'),
  ('admin_sales', 'Sales Administration', 'Full sales order management', 'sales', 'sales_orders', 'admin'),

-- Reports & Analytics
  ('view_reports', 'View Reports', 'View system reports and analytics', 'reports', 'reports', 'view'),
  ('export_reports', 'Export Reports', 'Export reports to CSV/Excel/PDF', 'reports', 'reports', 'export'),
  ('create_custom_reports', 'Create Custom Reports', 'Build custom reports and dashboards', 'reports', 'reports', 'create'),
  ('admin_reports', 'Reports Administration', 'Full reports management and configuration', 'reports', 'reports', 'admin'),

-- Accounting & Financial
  ('view_accounting', 'View Accounting', 'View financial data and accounting reports', 'accounting', 'accounting', 'view'),
  ('manage_expenses', 'Manage Expenses', 'Add and edit expense records', 'accounting', 'expenses', 'manage'),
  ('manage_accounts_payable', 'Manage A/P', 'Manage accounts payable and bills', 'accounting', 'accounts_payable', 'manage'),
  ('manage_accounts_receivable', 'Manage A/R', 'Manage accounts receivable and invoices', 'accounting', 'accounts_receivable', 'manage'),
  ('financial_reports', 'Financial Reports', 'Access detailed financial reports', 'accounting', 'financial_reports', 'view'),
  ('admin_accounting', 'Accounting Administration', 'Full accounting system access', 'accounting', 'accounting', 'admin'),

-- User Management
  ('view_users', 'View Users', 'View user listings and profiles', 'users', 'users', 'view'),
  ('create_users', 'Create Users', 'Invite new users to system', 'users', 'users', 'create'),
  ('edit_users', 'Edit Users', 'Modify user profiles and details', 'users', 'users', 'edit'),
  ('delete_users', 'Delete Users', 'Remove users from system', 'users', 'users', 'delete'),
  ('manage_roles', 'Manage Roles', 'Assign and modify user roles', 'users', 'roles', 'manage'),
  ('user_security', 'User Security', 'Manage user security settings', 'users', 'security', 'admin'),
  ('admin_users', 'User Administration', 'Full user management access', 'users', 'users', 'admin'),

-- Warehouse Management
  ('view_warehouses', 'View Warehouses', 'View warehouse information', 'warehouses', 'warehouses', 'view'),
  ('create_warehouses', 'Create Warehouses', 'Create new warehouse locations', 'warehouses', 'warehouses', 'create'),
  ('edit_warehouses', 'Edit Warehouses', 'Modify warehouse details', 'warehouses', 'warehouses', 'edit'),
  ('admin_warehouses', 'Warehouse Administration', 'Full warehouse management', 'warehouses', 'warehouses', 'admin'),

-- System Administration
  ('system_config', 'System Configuration', 'Modify system settings and configuration', 'system', 'config', 'admin'),
  ('audit_logs', 'View Audit Logs', 'Access system audit logs and security events', 'system', 'audit_logs', 'view'),
  ('backup_restore', 'Backup & Restore', 'System backup and restore operations', 'system', 'backup', 'admin'),
  ('system_maintenance', 'System Maintenance', 'System maintenance and monitoring', 'system', 'maintenance', 'admin'),
  ('admin_system', 'System Administration', 'Complete system administration access', 'system', 'system', 'admin')

ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  updated_at = now();

-- Create indexes for permissions
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_active ON permissions(is_active);

-- =====================================================
-- 4. ROLE-PERMISSION ASSIGNMENT TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at timestamptz DEFAULT now(),
  granted_by uuid REFERENCES profiles(id),
  is_active boolean DEFAULT true,
  UNIQUE(role_id, permission_id)
);

-- Insert default role-permission assignments
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r 
CROSS JOIN permissions p 
WHERE 
  -- Super Admin gets ALL permissions
  (r.name = 'super_admin') OR
  
  -- Admin gets all except system_config, backup_restore
  (r.name = 'admin' AND p.name NOT IN ('system_config', 'backup_restore', 'system_maintenance')) OR
  
  -- Manager gets permissions for their departments
  (r.name = 'manager' AND p.name IN (
    'view_dashboard', 'view_kpis', 'view_alerts', 'view_products', 'view_inventory',
    'view_suppliers', 'create_suppliers', 'edit_suppliers', 'admin_suppliers',
    'view_purchase_orders', 'create_purchase_orders', 'edit_purchase_orders', 'approve_purchase_orders', 'admin_purchase_orders',
    'view_sales_orders', 'create_sales_orders', 'edit_sales_orders', 'fulfill_orders', 'cancel_orders', 'admin_sales',
    'view_warehouses', 'edit_warehouses', 'admin_warehouses',
    'view_reports', 'export_reports', 'create_custom_reports', 'admin_reports',
    'view_accounting', 'manage_expenses', 'manage_accounts_payable', 'manage_accounts_receivable', 'financial_reports', 'admin_accounting',
    'view_users', 'edit_users'
  )) OR
  
  -- Sales Manager gets sales and POS permissions
  (r.name = 'sales_manager' AND p.name IN (
    'view_dashboard', 'view_kpis', 'view_alerts',
    'view_products', 'view_inventory',
    'use_pos', 'void_transactions', 'override_prices', 'access_sales_reports', 'admin_pos',
    'view_sales_orders', 'create_sales_orders', 'edit_sales_orders', 'fulfill_orders', 'cancel_orders', 'admin_sales',
    'view_reports', 'export_reports', 'view_accounting', 'view_warehouses'
  )) OR
  
  -- Warehouse Manager gets inventory permissions
  (r.name = 'warehouse_manager' AND p.name IN (
    'view_dashboard', 'view_kpis', 'view_alerts',
    'view_products', 'view_inventory', 'add_inventory', 'edit_inventory', 'transfer_inventory', 'manage_batches', 'admin_inventory',
    'view_suppliers', 'view_purchase_orders', 'admin_purchase_orders',
    'view_warehouses', 'edit_warehouses', 'admin_warehouses',
    'view_reports', 'view_accounting'
  )) OR
  
  -- POS Operator gets POS permissions
  (r.name = 'pos_operator' AND p.name IN (
    'view_dashboard', 'view_alerts',
    'view_products', 'view_inventory',
    'use_pos', 'void_transactions',
    'view_sales_orders', 'create_sales_orders',
    'view_warehouses'
  )) OR
  
  -- Staff gets basic viewing permissions
  (r.name = 'staff' AND p.name IN (
    'view_dashboard', 'view_alerts',
    'view_products', 'view_inventory',
    'view_sales_orders',
    'view_warehouses'
  )) OR
  
  -- Read-Only gets only dashboard and reports
  (r.name = 'read_only' AND p.name IN (
    'view_dashboard', 'view_reports'
  ));

-- Create indexes for role_permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_active ON role_permissions(is_active);

-- =====================================================
-- 5. USER-ROLE ASSIGNMENT TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES profiles(id),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  UNIQUE(user_id, role_id)
);

-- Create indexes for user_role_assignments
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_role_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_expires ON user_role_assignments(expires_at);

-- =====================================================
-- 6. AUDIT LOGGING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  session_id text,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);

-- =====================================================
-- 7. USER ACTIVITY TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- login, logout, action, session_start, session_end
  description text,
  ip_address inet,
  user_agent text,
  session_id text,
  module_accessed text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for user_activity_logs
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_session ON user_activity_logs(session_id);

-- =====================================================
-- 8. USER SESSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  ip_address inet,
  user_agent text,
  started_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true
);

-- Create indexes for user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- =====================================================
-- 9. SECURITY CONFIGURATION TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS security_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

-- Insert default security configuration
INSERT INTO security_config (setting_key, setting_value, description) VALUES
  ('max_failed_login_attempts', '5', 'Maximum failed login attempts before account lockout'),
  ('account_lockout_duration_minutes', '30', 'Account lockout duration in minutes'),
  ('session_timeout_hours', '8', 'Default session timeout in hours'),
  ('password_min_length', '8', 'Minimum password length'),
  ('password_require_uppercase', 'true', 'Require uppercase letters in password'),
  ('password_require_lowercase', 'true', 'Require lowercase letters in password'),
  ('password_require_numbers', 'true', 'Require numbers in password'),
  ('password_require_special', 'true', 'Require special characters in password'),
  ('invitation_expiry_days', '7', 'Invitation expiry in days'),
  ('require_email_verification', 'true', 'Require email verification for new users'),
  ('audit_retention_days', '90', 'Audit log retention period in days'),
  ('activity_log_retention_days', '30', 'Activity log retention period in days')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = now();

-- Create indexes for security_config
CREATE INDEX IF NOT EXISTS idx_security_config_key ON security_config(setting_key);
CREATE INDEX IF NOT EXISTS idx_security_config_active ON security_config(is_active);

-- =====================================================
-- 10. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Roles (Admin only)
CREATE POLICY "Admins can manage roles"
  ON roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND active = true
    )
  );

-- RLS Policies for Permissions (Admin only)
CREATE POLICY "Admins can manage permissions"
  ON permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND active = true
    )
  );

-- RLS Policies for Role Permissions (Admin only)
CREATE POLICY "Admins can manage role permissions"
  ON role_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND active = true
    )
  );

-- RLS Policies for User Role Assignments (Admin only)
CREATE POLICY "Admins can manage user role assignments"
  ON user_role_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND active = true
    )
  );

-- RLS Policies for User Sessions (Users can view own sessions)
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for Audit Logs (Admin and Super Admin only)
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND active = true
    )
  );

-- RLS Policies for User Activity Logs
CREATE POLICY "Users can view own activity logs"
  ON user_activity_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity logs"
  ON user_activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND active = true
    )
  );

-- RLS Policies for Security Config (Super Admin only)
CREATE POLICY "Super admins can manage security config"
  ON security_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
      AND active = true
    )
  );

-- =====================================================
-- 11. HELPER FUNCTIONS
-- =====================================================

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(user_id uuid, permission_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  has_perm boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN user_role_assignments ura ON p.id = ura.user_id
    JOIN roles r ON ura.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions perm ON rp.permission_id = perm.id
    WHERE p.id = user_id 
    AND p.active = true
    AND ura.is_active = true
    AND r.is_active = true
    AND rp.is_active = true
    AND perm.is_active = true
    AND perm.name = permission_name
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_id uuid)
RETURNS TABLE(permission_name text, category text, resource text, action text)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    perm.name::text,
    perm.category::text,
    perm.resource::text,
    perm.action::text
  FROM profiles p
  JOIN user_role_assignments ura ON p.id = ura.user_id
  JOIN roles r ON ura.role_id = r.id
  JOIN role_permissions rp ON r.id = rp.role_id
  JOIN permissions perm ON rp.permission_id = perm.id
  WHERE p.id = user_id 
  AND p.active = true
  AND ura.is_active = true
  AND r.is_active = true
  AND rp.is_active = true
  AND perm.is_active = true;
END;
$$;

-- Function to update profile activity
CREATE OR REPLACE FUNCTION update_user_activity(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET last_activity_at = now(),
      last_login_at = CASE 
        WHEN last_activity_at IS NULL THEN now()
        ELSE last_login_at 
      END
  WHERE id = user_id;
END;
$$;

-- =====================================================
-- 12. TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at columns
CREATE TRIGGER update_roles_updated_at 
  BEFORE UPDATE ON roles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at 
  BEFORE UPDATE ON permissions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_config_updated_at 
  BEFORE UPDATE ON security_config 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 13. MIGRATION COMPLETION
-- =====================================================

-- Update existing users to assign default roles
UPDATE profiles 
SET role = 'staff'::text 
WHERE role IS NULL OR role NOT IN ('admin', 'staff');

-- Grant super_admin role to existing admins
INSERT INTO user_role_assignments (user_id, role_id, assigned_at, is_active)
SELECT p.id, r.id, now(), true
FROM profiles p, roles r
WHERE p.role = 'admin' 
AND r.name = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM user_role_assignments ura 
  WHERE ura.user_id = p.id AND ura.role_id = r.id
);

-- Final logging
INSERT INTO audit_logs (user_id, action, resource_type, description, success)
VALUES (
  null,
  'MIGRATION',
  'database',
  'RBAC System Migration: Comprehensive role hierarchy and permissions system implemented',
  true
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'RBAC System Database Schema Migration Completed Successfully!';
  RAISE NOTICE 'Tables Created: roles, permissions, role_permissions, user_role_assignments, audit_logs, user_activity_logs, user_sessions, security_config';
  RAISE NOTICE 'Enhanced: profiles table with security and tracking fields';
  RAISE NOTICE 'Default Roles: super_admin, admin, manager, sales_manager, warehouse_manager, pos_operator, staff, read_only';
  RAISE NOTICE 'Total Permissions: %', (SELECT COUNT(*) FROM permissions WHERE is_active = true);
  RAISE NOTICE 'Helper Functions: has_permission(), get_user_permissions(), update_user_activity()';
  RAISE NOTICE 'Security Policies: RLS enabled with admin/super_admin restrictions';
  RAISE NOTICE 'Ready for Phase 11.2: Permission Matrix & Access Control Framework';
END;
$$;