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
import RBACService from '@/services/rbac.service';
import { 
  FileText, 
  Download, 
  Filter, 
  Search, 
  Calendar,
  User,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  RefreshCw,
  FileDown,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Lock,
  Unlock,
  Settings,
  Database,
  ShoppingCart,
  Package,
  Truck,
  DollarSign
} from 'lucide-react-native';

interface AuditLog {
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

interface ActivityStats {
  total_activities: number;
  unique_users: number;
  top_actions: Array<{ action: string; count: number }>;
  top_resources: Array<{ resource_type: string; count: number }>;
  daily_activities: Array<{ date: string; count: number }>;
  user_heatmap: Array<{ user_id: string; user_name: string; activity_count: number }>;
}

interface ComplianceReport {
  period: string;
  total_actions: number;
  security_events: number;
  policy_violations: number;
  access_denials: number;
  data_modifications: number;
  export_date: string;
}

const AUDIT_ACTION_CATEGORIES = [
  { category: 'Authentication', actions: ['login', 'logout', 'password_change', 'session_start', 'session_end'] },
  { category: 'User Management', actions: ['user_create', 'user_update', 'user_delete', 'user_activate', 'user_deactivate'] },
  { category: 'Role & Permissions', actions: ['role_create', 'role_update', 'role_delete', 'permission_assign', 'permission_revoke'] },
  { category: 'Product Management', actions: ['product_create', 'product_update', 'product_delete', 'product_view'] },
  { category: 'Inventory', actions: ['inventory_add', 'inventory_remove', 'inventory_transfer', 'batch_create', 'batch_expire'] },
  { category: 'Sales', actions: ['sale_create', 'sale_update', 'sale_complete', 'pos_transaction'] },
  { category: 'Procurement', actions: ['po_create', 'po_update', 'po_receive', 'supplier_update'] },
  { category: 'System', actions: ['system_config', 'backup', 'restore', 'data_export', 'report_generate'] }
];

const RESOURCE_ICONS = {
  user: User,
  role: Shield,
  product: Package,
  inventory: Database,
  sale: DollarSign,
  purchase_order: ShoppingCart,
  supplier: Users,
  system: Settings,
  pos: Target
};

export default function AuditLogging() {
  const { profile: currentUser } = useAuth();
  
  // States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'analytics' | 'compliance'>('logs');
  
  // Audit logs data
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  
  // Analytics data
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  // Compliance data
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [complianceLoading, setComplianceLoading] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7d'); // 1d, 7d, 30d, 90d, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // UI states
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showLogDetailModal, setShowLogDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // Permission checks
  const [permissions, setPermissions] = useState<string[]>([]);
  const canViewAuditLogs = permissions.includes('view_audit_logs') || permissions.includes('admin_audit_logs');
  const canExportAuditLogs = permissions.includes('export_audit_logs') || permissions.includes('admin_audit_logs');
  const canViewAnalytics = permissions.includes('view_analytics') || permissions.includes('admin_analytics');
  const canGenerateComplianceReports = permissions.includes('generate_compliance_reports') || permissions.includes('admin_compliance');
  
  // Load permissions
  useEffect(() => {
    if (currentUser?.id) {
      loadPermissions();
    }
  }, [currentUser]);
  
  // Load data when tab changes
  useEffect(() => {
    if (canViewAuditLogs && activeTab === 'logs') {
      loadAuditLogs();
    } else if (canViewAnalytics && activeTab === 'analytics') {
      loadActivityStats();
    } else if (canGenerateComplianceReports && activeTab === 'compliance') {
      loadComplianceReports();
    }
  }, [activeTab, canViewAuditLogs, canViewAnalytics, canGenerateComplianceReports]);
  
  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [auditLogs, searchQuery, actionFilter, resourceFilter, userFilter, dateRange]);
  
  const loadPermissions = async () => {
    if (!currentUser?.id) return;
    
    const result = await RBACService.getUserPermissions(currentUser.id);
    if (result.data) {
      setPermissions(result.data.map(p => p.permission_name));
    }
  };
  
  const loadAuditLogs = async () => {
    try {
      setLogsLoading(true);
      
      const result = await RBACService.getAuditLogs(1, 1000); // Load more logs for analytics
      if (result.data) {
        setAuditLogs(result.data);
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
      Alert.alert('Error', 'Failed to load audit logs');
    } finally {
      setLogsLoading(false);
      setRefreshing(false);
    }
  };
  
  const loadActivityStats = async () => {
    try {
      setAnalyticsLoading(true);
      
      // This would typically come from a dedicated analytics endpoint
      // For now, we'll calculate from audit logs
      if (auditLogs.length === 0) {
        await loadAuditLogs();
      }
      
      const stats = calculateActivityStats(auditLogs);
      setActivityStats(stats);
    } catch (error) {
      console.error('Error loading activity stats:', error);
      Alert.alert('Error', 'Failed to load activity statistics');
    } finally {
      setAnalyticsLoading(false);
    }
  };
  
  const loadComplianceReports = async () => {
    try {
      setComplianceLoading(true);
      
      // Generate compliance reports based on audit logs
      const reports = generateComplianceReports(auditLogs);
      setComplianceReports(reports);
    } catch (error) {
      console.error('Error loading compliance reports:', error);
      Alert.alert('Error', 'Failed to load compliance reports');
    } finally {
      setComplianceLoading(false);
    }
  };
  
  const calculateActivityStats = (logs: AuditLog[]): ActivityStats => {
    const last30Days = logs.filter(log => {
      const logDate = new Date(log.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return logDate >= thirtyDaysAgo;
    });
    
    const topActions = Object.entries(
      last30Days.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const topResources = Object.entries(
      last30Days.reduce((acc, log) => {
        acc[log.resource_type] = (acc[log.resource_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([resource_type, count]) => ({ resource_type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const dailyActivities = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateStr = date.toISOString().split('T')[0];
      const count = last30Days.filter(log => 
        log.created_at.startsWith(dateStr)
      ).length;
      return { date: dateStr, count };
    });
    
    const userActivity = Object.entries(
      last30Days.reduce((acc, log) => {
        const userName = log.user?.full_name || 'Unknown User';
        acc[userName] = (acc[userName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([userName, count]) => ({ user_name: userName, activity_count: count }))
      .sort((a, b) => b.activity_count - a.activity_count)
      .slice(0, 20);
    
    return {
      total_activities: last30Days.length,
      unique_users: new Set(last30Days.map(log => log.user_id)).size,
      top_actions: topActions,
      top_resources: topResources,
      daily_activities: dailyActivities,
      user_heatmap: userActivity.map(user => ({
        user_id: user.user_name,
        user_name: user.user_name,
        activity_count: user.activity_count
      }))
    };
  };
  
  const generateComplianceReports = (logs: AuditLog[]): ComplianceReport[] => {
    const reports: ComplianceReport[] = [];
    
    // Generate monthly reports for the last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
      
      const monthLogs = logs.filter(log => log.created_at.startsWith(monthStr));
      
      const securityEvents = monthLogs.filter(log => 
        ['login_failed', 'permission_denied', 'security_violation', 'account_locked'].includes(log.action)
      ).length;
      
      const policyViolations = monthLogs.filter(log => 
        log.action.includes('violation') || log.action.includes('unauthorized')
      ).length;
      
      const accessDenials = monthLogs.filter(log => 
        log.action === 'permission_denied'
      ).length;
      
      const dataModifications = monthLogs.filter(log => 
        ['create', 'update', 'delete'].some(action => log.action.includes(action))
      ).length;
      
      reports.push({
        period: monthStr,
        total_actions: monthLogs.length,
        security_events: securityEvents,
        policy_violations: policyViolations,
        access_denials: accessDenials,
        data_modifications: dataModifications,
        export_date: new Date().toISOString()
      });
    }
    
    return reports.reverse();
  };
  
  const applyFilters = () => {
    let filtered = [...auditLogs];
    
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        log.user?.full_name?.toLowerCase().includes(searchLower) ||
        log.action?.toLowerCase().includes(searchLower) ||
        log.resource_type?.toLowerCase().includes(searchLower) ||
        (log.new_values && JSON.stringify(log.new_values).toLowerCase().includes(searchLower)) ||
        (log.old_values && JSON.stringify(log.old_values).toLowerCase().includes(searchLower))
      );
    }
    
    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }
    
    // Resource filter
    if (resourceFilter !== 'all') {
      filtered = filtered.filter(log => log.resource_type === resourceFilter);
    }
    
    // User filter
    if (userFilter !== 'all') {
      filtered = filtered.filter(log => log.user_id === userFilter);
    }
    
    // Date range filter
    if (dateRange !== 'custom') {
      const days = parseInt(dateRange.replace('d', ''));
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      filtered = filtered.filter(log => new Date(log.created_at) >= cutoffDate);
    } else if (customStartDate && customEndDate) {
      const startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(log => {
        const logDate = new Date(log.created_at);
        return logDate >= startDate && logDate <= endDate;
      });
    }
    
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    setFilteredLogs(filtered);
  };
  
  const exportAuditLogs = async (format: 'csv' | 'json') => {
    try {
      if (filteredLogs.length === 0) {
        Alert.alert('No Data', 'No logs to export with current filters');
        return;
      }
      
      let content = '';
      let filename = '';
      let mimeType = '';
      
      if (format === 'csv') {
        // CSV export
        const headers = ['Timestamp', 'User', 'Action', 'Resource Type', 'Details', 'IP Address'];
        const rows = filteredLogs.map(log => [
          new Date(log.created_at).toLocaleString(),
          log.user?.full_name || 'System',
          log.action,
          log.resource_type,
          JSON.stringify(log.new_values || log.old_values || {}),
          log.ip_address || ''
        ]);
        
        content = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      } else {
        // JSON export
        content = JSON.stringify(filteredLogs, null, 2);
        filename = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      }
      
      // In a real app, you'd use a file system or email service
      Alert.alert('Export Complete', `Audit logs exported as ${filename}`);
      
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Failed to export audit logs');
    }
  };
  
  const getActionColor = (action: string): string => {
    if (action.includes('create') || action.includes('login')) return '#10B981';
    if (action.includes('update') || action.includes('modify')) return '#3B82F6';
    if (action.includes('delete') || action.includes('logout')) return '#EF4444';
    if (action.includes('view') || action.includes('read')) return '#6B7280';
    if (action.includes('fail') || action.includes('denied')) return '#F59E0B';
    return '#8B5CF6';
  };
  
  const getActionIcon = (action: string) => {
    if (action.includes('create')) return CheckCircle;
    if (action.includes('update')) return Settings;
    if (action.includes('delete')) return AlertTriangle;
    if (action.includes('login')) return Unlock;
    if (action.includes('logout')) return Lock;
    if (action.includes('view')) return Eye;
    return Activity;
  };
  
  if (!canViewAuditLogs) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Audit Logging</Text>
        </View>
        <View style={styles.accessDenied}>
          <FileText size={48} color="#EF4444" />
          <Text style={styles.accessDeniedText}>Access Denied</Text>
          <Text style={styles.accessDeniedSubtext}>
            You don't have permission to view audit logs
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
        <Text style={styles.headerTitle}>Audit Logging</Text>
        <View style={styles.headerRight}>
          {canExportAuditLogs && (
            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => setShowExportModal(true)}
            >
              <Download size={20} color="#3B82F6" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              setRefreshing(true);
              loadAuditLogs();
            }}
          >
            <RefreshCw size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {canViewAuditLogs && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'logs' && styles.activeTab]}
            onPress={() => setActiveTab('logs')}
          >
            <FileText size={16} color={activeTab === 'logs' ? '#3B82F6' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'logs' && styles.activeTabText]}>
              Audit Logs ({filteredLogs.length})
            </Text>
          </TouchableOpacity>
        )}
        
        {canViewAnalytics && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
            onPress={() => setActiveTab('analytics')}
          >
            <BarChart3 size={16} color={activeTab === 'analytics' ? '#3B82F6' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
              Analytics
            </Text>
          </TouchableOpacity>
        )}
        
        {canGenerateComplianceReports && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'compliance' && styles.activeTab]}
            onPress={() => setActiveTab('compliance')}
          >
            <Shield size={16} color={activeTab === 'compliance' ? '#3B82F6' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'compliance' && styles.activeTabText]}>
              Compliance
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadAuditLogs} />
        }
      >
        {/* Audit Logs Tab */}
        {activeTab === 'logs' && (
          <View style={styles.section}>
            {/* Search and Filters */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInput}>
                <Search size={20} color="#6B7280" />
                <TextInput
                  style={styles.searchText}
                  placeholder="Search audit logs..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilterModal(true)}
              >
                <Filter size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {/* Quick Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFilter}>
              <TouchableOpacity
                style={[styles.quickFilterItem, actionFilter === 'all' && styles.activeQuickFilterItem]}
                onPress={() => setActionFilter('all')}
              >
                <Text style={[styles.quickFilterText, actionFilter === 'all' && styles.activeQuickFilterText]}>
                  All Actions
                </Text>
              </TouchableOpacity>
              {['login', 'logout', 'create', 'update', 'delete', 'view'].map(action => (
                <TouchableOpacity
                  key={action}
                  style={[styles.quickFilterItem, actionFilter === action && styles.activeQuickFilterItem]}
                  onPress={() => setActionFilter(action)}
                >
                  <Text style={[styles.quickFilterText, actionFilter === action && styles.activeQuickFilterText]}>
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Logs List */}
            {logsLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            ) : filteredLogs.length === 0 ? (
              <View style={styles.emptyState}>
                <FileText size={48} color="#6B7280" />
                <Text style={styles.emptyStateText}>
                  {searchQuery || actionFilter !== 'all' || resourceFilter !== 'all'
                    ? 'No logs match your criteria'
                    : 'No audit logs found'
                  }
                </Text>
              </View>
            ) : (
              filteredLogs.map((log) => {
                const ActionIcon = getActionIcon(log.action);
                return (
                  <TouchableOpacity
                    key={log.id}
                    style={styles.logCard}
                    onPress={() => {
                      setSelectedLog(log);
                      setShowLogDetailModal(true);
                    }}
                  >
                    <View style={styles.logHeader}>
                      <View style={styles.logInfo}>
                        <View style={[styles.actionIcon, { backgroundColor: getActionColor(log.action) + '20' }]}>
                          <ActionIcon size={16} color={getActionColor(log.action)} />
                        </View>
                        <View style={styles.logDetailsContainer}>
                          <Text style={styles.logAction}>{log.action.replace('_', ' ').toUpperCase()}</Text>
                          <Text style={styles.logResource}>{log.resource_type}</Text>
                        </View>
                      </View>
                      <View style={styles.logMeta}>
                        <Text style={styles.logUser}>{log.user?.full_name || 'System'}</Text>
                        <Text style={styles.logTime}>
                          {new Date(log.created_at).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    
                    {(log.new_values || log.old_values) && (
                      <Text style={styles.logDetailsPreview} numberOfLines={2}>
                        {typeof (log.new_values || log.old_values) === 'string' 
                          ? (log.new_values || log.old_values) 
                          : JSON.stringify(log.new_values || log.old_values)
                        }
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
        
        {/* Analytics Tab */}
        {activeTab === 'analytics' && canViewAnalytics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Analytics</Text>
            
            {analyticsLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            ) : activityStats ? (
              <View style={styles.analyticsContainer}>
                {/* Summary Cards */}
                <View style={styles.summaryCards}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryValue}>{activityStats.total_activities}</Text>
                    <Text style={styles.summaryLabel}>Total Activities (30d)</Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryValue}>{activityStats.unique_users}</Text>
                    <Text style={styles.summaryLabel}>Active Users</Text>
                  </View>
                </View>
                
                {/* Top Actions */}
                <View style={styles.analyticsGroup}>
                  <Text style={styles.groupTitle}>Top Actions</Text>
                  {activityStats.top_actions.slice(0, 5).map((item, index) => (
                    <View key={item.action} style={styles.analyticsItem}>
                      <Text style={styles.analyticsLabel}>{item.action.replace('_', ' ')}</Text>
                      <Text style={styles.analyticsValue}>{item.count}</Text>
                    </View>
                  ))}
                </View>
                
                {/* Top Resources */}
                <View style={styles.analyticsGroup}>
                  <Text style={styles.groupTitle}>Top Resources</Text>
                  {activityStats.top_resources.slice(0, 5).map((item, index) => (
                    <View key={item.resource_type} style={styles.analyticsItem}>
                      <Text style={styles.analyticsLabel}>{item.resource_type.replace('_', ' ')}</Text>
                      <Text style={styles.analyticsValue}>{item.count}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <BarChart3 size={48} color="#6B7280" />
                <Text style={styles.emptyStateText}>No analytics data available</Text>
              </View>
            )}
          </View>
        )}
        
        {/* Compliance Tab */}
        {activeTab === 'compliance' && canGenerateComplianceReports && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compliance Reports</Text>
            
            {complianceLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            ) : (
              <View style={styles.complianceContainer}>
                {complianceReports.map((report) => (
                  <View key={report.period} style={styles.complianceCard}>
                    <View style={styles.complianceHeader}>
                      <Text style={styles.compliancePeriod}>
                        {new Date(report.period + '-01').toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </Text>
                      <Text style={styles.complianceDate}>
                        Generated: {new Date(report.export_date).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    <View style={styles.complianceMetrics}>
                      <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Total Actions:</Text>
                        <Text style={styles.metricValue}>{report.total_actions}</Text>
                      </View>
                      <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Security Events:</Text>
                        <Text style={[styles.metricValue, { color: report.security_events > 0 ? '#F59E0B' : '#10B981' }]}>
                          {report.security_events}
                        </Text>
                      </View>
                      <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Policy Violations:</Text>
                        <Text style={[styles.metricValue, { color: report.policy_violations > 0 ? '#EF4444' : '#10B981' }]}>
                          {report.policy_violations}
                        </Text>
                      </View>
                      <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Data Modifications:</Text>
                        <Text style={styles.metricValue}>{report.data_modifications}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
      
      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Export Audit Logs</Text>
            
            <View style={styles.exportOptions}>
              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => {
                  exportAuditLogs('csv');
                  setShowExportModal(false);
                }}
              >
                <FileDown size={24} color="#3B82F6" />
                <Text style={styles.exportOptionText}>Export as CSV</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => {
                  exportAuditLogs('json');
                  setShowExportModal(false);
                }}
              >
                <FileText size={24} color="#10B981" />
                <Text style={styles.exportOptionText}>Export as JSON</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowExportModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Log Detail Modal */}
      <Modal
        visible={showLogDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLogDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Audit Log Details</Text>
            
            {selectedLog && (
              <View style={styles.logDetailContent}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Timestamp:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>User:</Text>
                  <Text style={styles.detailValue}>
                    {selectedLog.user?.full_name || 'System'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Action:</Text>
                  <Text style={styles.detailValue}>
                    {selectedLog.action.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Resource Type:</Text>
                  <Text style={styles.detailValue}>{selectedLog.resource_type}</Text>
                </View>
                
                {selectedLog.resource_id && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Resource ID:</Text>
                    <Text style={styles.detailValue}>{selectedLog.resource_id}</Text>
                  </View>
                )}
                
                {selectedLog.ip_address && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>IP Address:</Text>
                    <Text style={styles.detailValue}>{selectedLog.ip_address}</Text>
                  </View>
                )}
                
                {(selectedLog.new_values || selectedLog.old_values) && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Details:</Text>
                    <Text style={styles.detailValue}>
                      {typeof (selectedLog.new_values || selectedLog.old_values) === 'string' 
                        ? (selectedLog.new_values || selectedLog.old_values) 
                        : JSON.stringify(selectedLog.new_values || selectedLog.old_values, null, 2)
                      }
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowLogDetailModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Close</Text>
            </TouchableOpacity>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickFilter: {
    marginBottom: 16,
  },
  quickFilterItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  activeQuickFilterItem: {
    backgroundColor: '#DBEAFE',
  },
  quickFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeQuickFilterText: {
    color: '#3B82F6',
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
  loadingState: {
    alignItems: 'center',
    marginTop: 64,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logDetailsContainer: {
    flex: 1,
  },
  logAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  logResource: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  logMeta: {
    alignItems: 'flex-end',
  },
  logUser: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  logTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  logDetailsPreview: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  analyticsContainer: {
    gap: 24,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  analyticsGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  analyticsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  analyticsLabel: {
    fontSize: 14,
    color: '#374151',
  },
  analyticsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  complianceContainer: {
    gap: 16,
  },
  complianceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  complianceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  compliancePeriod: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  complianceDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  complianceMetrics: {
    gap: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#374151',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
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
    textAlign: 'center',
  },
  exportOptions: {
    gap: 16,
    marginBottom: 24,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  exportOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  logDetailContent: {
    gap: 12,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    flex: 2,
    textAlign: 'right',
  },
  modalCancelButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});