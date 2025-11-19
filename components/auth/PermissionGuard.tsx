import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import RBACService from '@/services/rbac.service';

interface PermissionGuardProps {
  permission?: string | string[];
  permissions?: string[];
  requireAll?: boolean;
  requiresAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onAccessDenied?: () => void;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  permissions,
  requireAll = false,
  requiresAll = false,
  children,
  fallback = null,
  onAccessDenied
}) => {
  // Support both singular and plural permission props
  const requiredPermissions: string[] = permission
    ? (Array.isArray(permission) ? permission : [permission])
    : (permissions || []);

  // Support both requireAll and requiresAll for flexibility
  const shouldRequireAll = requireAll || requiresAll;
  const { profile: currentUser } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    loadPermissions();
  }, [currentUser]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const result = await RBACService.getUserPermissions(currentUser!.id);
      
      if (result.data) {
        const permissions = result.data.map(p => p.permission_name);
        setUserPermissions(permissions);
        
        if (requiredPermissions.length === 0) {
          // No specific permissions required, grant access
          setHasAccess(true);
        } else {
          // Check permissions based on shouldRequireAll flag
          const hasAll = requiredPermissions.every(perm => permissions.includes(perm));
          const hasAny = requiredPermissions.some(perm => permissions.includes(perm));

          setHasAccess(shouldRequireAll ? hasAll : hasAny);

          if (!shouldRequireAll ? !hasAny : !hasAll) {
            onAccessDenied?.();
          }
        }
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <View style={styles.loadingContainer} />;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    width: 0,
    height: 0,
  },
});