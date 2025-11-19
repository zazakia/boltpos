import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';
import { Home, ShoppingCart, Package, Receipt, User, Users, Database, Calculator, Bell, FileText } from 'lucide-react-native';

export default function TabLayout() {
  const { session, loading } = useAuth();
  const { hasPermission, loading: permissionsLoading, permissions } = usePermissions();
  const router = useRouter();
  const [tabConfig, setTabConfig] = useState<any[]>([]);

  useEffect(() => {
    // Add route protection to prevent direct access to tabs without authentication
    if (!loading && !session) {
      router.replace('/(auth)/login');
    }
  }, [session, loading, router]);

  // Build tab configuration based on permissions
  useEffect(() => {
    if (!permissionsLoading && hasPermission) {
      const tabs = [];

      // Dashboard - always visible
      tabs.push({
        name: 'dashboard',
        options: {
          title: 'Dashboard',
          tabBarIcon: ({ size, color }: any) => (
            <Home size={size} color={color} />
          ),
        }
      });

      // POS - requires POS access permission
      if (hasPermission(PERMISSIONS.ACCESS_POS)) {
        tabs.push({
          name: 'index',
          options: {
            title: 'POS',
            tabBarIcon: ({ size, color }: any) => (
              <ShoppingCart size={size} color={color} />
            ),
          }
        });
      }

      // Products - requires view products permission
      if (hasPermission(PERMISSIONS.VIEW_PRODUCTS)) {
        tabs.push({
          name: 'products',
          options: {
            title: 'Products',
            tabBarIcon: ({ size, color }: any) => (
              <Package size={size} color={color} />
            ),
          }
        });
      }

      // Orders - requires view sales orders permission
      if (hasPermission(PERMISSIONS.VIEW_SALES_ORDERS)) {
        tabs.push({
          name: 'orders',
          options: {
            title: 'Orders',
            tabBarIcon: ({ size, color }: any) => (
              <Receipt size={size} color={color} />
            ),
          }
        });
      }

      // Alerts - requires view dashboard alerts permission
      if (hasPermission(PERMISSIONS.VIEW_DASHBOARD_ALERTS)) {
        tabs.push({
          name: 'alerts',
          options: {
            title: 'Alerts',
            tabBarIcon: ({ size, color }: any) => (
              <Bell size={size} color={color} />
            ),
          }
        });
      }

      // Reports - requires view reports permission
      if (hasPermission(PERMISSIONS.VIEW_REPORTS)) {
        tabs.push({
          name: 'reports',
          options: {
            title: 'Reports',
            tabBarIcon: ({ size, color }: any) => (
              <FileText size={size} color={color} />
            ),
          }
        });
      }

      // Accounting - requires view accounting permission
      if (hasPermission(PERMISSIONS.VIEW_ACCOUNTING)) {
        tabs.push({
          name: 'accounting',
          options: {
            title: 'Accounting',
            tabBarIcon: ({ size, color }: any) => (
              <Calculator size={size} color={color} />
            ),
          }
        });
      }

      // Users - requires view users permission
      if (hasPermission(PERMISSIONS.VIEW_USERS)) {
        tabs.push({
          name: 'users',
          options: {
            title: 'Users',
            tabBarIcon: ({ size, color }: any) => (
              <Users size={size} color={color} />
            ),
          }
        });
      }

      // Profile - always visible
      tabs.push({
        name: 'profile',
        options: {
          title: 'Profile',
          tabBarIcon: ({ size, color }: any) => (
            <User size={size} color={color} />
          ),
        }
      });

      // Migration - requires system maintenance permission
      if (hasPermission(PERMISSIONS.SYSTEM_MAINTENANCE)) {
        tabs.push({
          name: 'migration',
          options: {
            title: 'Migration',
            tabBarIcon: ({ size, color }: any) => (
              <Database size={size} color={color} />
            ),
          }
        });
      }

      setTabConfig(tabs);
    }
  }, [permissions, permissionsLoading]);

  // Show loading indicator while checking authentication
  if (loading || permissionsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Don't render tabs if not authenticated
  if (!session) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingTop: 8,
          paddingBottom: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      {tabConfig.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={tab.options}
        />
      ))}
      <Tabs.Screen
        name="cart"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});