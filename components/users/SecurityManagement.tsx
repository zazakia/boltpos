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
  Switch,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import RBACService from '@/services/rbac.service';
import { 
  Shield, 
  Clock, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Save,
  Timer,
  ShieldCheck,
  UserX,
  Activity,
  Search,
  Filter,
  MoreVertical,
  Trash2
} from 'lucide-react-native';

interface SecuritySession {
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

interface SecurityEvent {
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

interface SecurityConfig {
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

const SECURITY_EVENT_TYPES = [
  'login_success',
  'login_failed',
  'account_locked',
  'account_unlocked',
  'password_changed',
  'session_started',
  'session_expired',
  'permission_denied',
  'security_violation',
  'data_access'
];

export default function SecurityManagement() {
  const { profile: currentUser } = useAuth();
  
  // States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'sessions' | 'events' | 'config'>('sessions');
  
  // Sessions data
  const [sessions, setSessions] = useState<SecuritySession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SecuritySession[]>([]);
  
  // Security events data
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<SecurityEvent[]>([]);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  
  // Security configuration
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
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
  });
  
  // UI states
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  
  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  
  // Check permissions
  const [permissions, setPermissions] = useState<string[]>([]);
  const canManageSecurity = permissions.includes('manage_security');
  const canViewSessions = permissions.includes('view_sessions');
  const canViewAuditLogs = permissions.includes('view_audit_logs');
  const canManageUsers = permissions.includes('manage_users') || permissions.includes('admin_users');
  
  // Load permissions and data
  useEffect(() => {
    if (currentUser?.id) {
      loadPermissions();
      loadSecurityData();
    }
  }, [currentUser]);
  
  // Apply filters
  useEffect(() => {
    applySessionFilters();
    applyEventFilters();
  }, [sessions, events, sessionSearchQuery, eventSearchQuery, eventTypeFilter]);
  
  const loadPermissions = async () => {
    if (!currentUser?.id) return;
    
    const result = await RBACService.getUserPermissions(currentUser.id);
    if (result.data) {
      setPermissions(result.data.map(p => p.permission_name));
    }
  };
  
  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Load active sessions
      const sessionsResult = await RBACService.getUserSessions();
      if (sessionsResult.data) {
        setSessions(sessionsResult.data);
      }
      
      // Load recent security events
      const eventsResult = await RBACService.getAuditLogs(1, 100); // Last 100 events
      if (eventsResult.data) {
        const securityEvents = RBACService.convertAuditLogsToSecurityEvents(eventsResult.data);
        setEvents(securityEvents);
      }
      
      // Load security configuration
      const configResult = await RBACService.getSecurityConfig();
      if (configResult.data) {
        setSecurityConfig(configResult.data);
      }
      
    } catch (error) {
      console.error('Error loading security data:', error);
      Alert.alert('Error', 'Failed to load security data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const applySessionFilters = () => {
    let filtered = [...sessions];
    
    if (sessionSearchQuery) {
      filtered = filtered.filter(session =>
        session.user?.full_name?.toLowerCase().includes(sessionSearchQuery.toLowerCase()) ||
        session.user?.email?.toLowerCase().includes(sessionSearchQuery.toLowerCase()) ||
        session.ip_address?.includes(sessionSearchQuery)
      );
    }
    
    filtered.sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime());
    
    setFilteredSessions(filtered);
  };
  
  const applyEventFilters = () => {
    let filtered = [...events];
    
    if (eventSearchQuery) {
      filtered = filtered.filter(event =>
        event.user?.full_name?.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
        event.user?.email?.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
        event.ip_address?.includes(eventSearchQuery)
      );
    }
    
    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter(event => event.event_type === eventTypeFilter);
    }
    
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    setFilteredEvents(filtered);
  };
  
  const terminateSession = async (sessionId: string) => {
    try {
      const result = await RBACService.terminateUserSession(sessionId);
      if (result.error) throw new Error(result.error);
      
      Alert.alert('Success', 'Session terminated successfully');
      loadSecurityData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to terminate session');
    }
  };
  
  const terminateSelectedSessions = async () => {
    if (selectedSessions.length === 0) return;
    
    Alert.alert(
      'Terminate Sessions',
      `Are you sure you want to terminate ${selectedSessions.length} selected sessions?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Terminate',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(
                selectedSessions.map(sessionId => RBACService.terminateUserSession(sessionId))
              );
              
              Alert.alert('Success', 'Sessions terminated successfully');
              setSelectedSessions([]);
              loadSecurityData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to terminate sessions');
            }
          },
        },
      ]
    );
  };
  
  const lockUserAccount = async (userId: string) => {
    try {
      const result = await RBACService.lockUserAccount(userId, securityConfig.lockout_duration_minutes);
      if (result.error) throw new Error(result.error);
      
      Alert.alert('Success', 'User account locked successfully');
      loadSecurityData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to lock user account');
    }
  };
  
  const unlockUserAccount = async (userId: string) => {
    try {
      const result = await RBACService.unlockUserAccount(userId);
      if (result.error) throw new Error(result.error);
      
      Alert.alert('Success', 'User account unlocked successfully');
      loadSecurityData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to unlock user account');
    }
  };
  
  const saveSecurityConfig = async () => {
    try {
      setConfigSaving(true);
      
      const result = await RBACService.updateSecurityConfig(securityConfig);
      if (result.error) throw new Error(result.error);
      
      Alert.alert('Success', 'Security configuration saved successfully');
      setShowConfigModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save security configuration');
    } finally {
      setConfigSaving(false);
    }
  };
  
  const calculatePasswordStrength = (password: string): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: 'Empty', color: '#EF4444' };
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Character variety
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) return { score, label: 'Weak', color: '#EF4444' };
    if (score <= 4) return { score, label: 'Fair', color: '#F59E0B' };
    if (score <= 5) return { score, label: 'Good', color: '#3B82F6' };
    return { score, label: 'Strong', color: '#10B981' };
  };
  
  const formatSessionDuration = (loginTime: string, lastActivity: string): string => {
    const login = new Date(loginTime);
    const last = new Date(lastActivity);
    const duration = last.getTime() - login.getTime();
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };
  
  const getSessionStatusColor = (session: SecuritySession): string => {
    if (!session.active) return '#EF4444';
    
    const expiresAt = new Date(session.expires_at);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    
    if (timeUntilExpiry < 0) return '#EF4444'; // Expired
    if (timeUntilExpiry < 30 * 60 * 1000) return '#F59E0B'; // Expires soon (< 30 mins)
    return '#10B981'; // Active
  };
  
  const getSessionStatusText = (session: SecuritySession): string => {
    if (!session.active) return 'Terminated';
    
    const expiresAt = new Date(session.expires_at);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    
    if (timeUntilExpiry < 0) return 'Expired';
    if (timeUntilExpiry < 30 * 60 * 1000) return 'Expires Soon';
    return 'Active';
  };
  
  if (!canManageSecurity && !canViewSessions && !canViewAuditLogs) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Security Management</Text>
        </View>
        <View style={styles.accessDenied}>
          <Shield size={48} color="#EF4444" />
          <Text style={styles.accessDeniedText}>Access Denied</Text>
          <Text style={styles.accessDeniedSubtext}>
            You don't have permission to access security management
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
        <Text style={styles.headerTitle}>Security Management</Text>
        <View style={styles.headerRight}>
          {(canManageSecurity || canManageUsers) && (
            <TouchableOpacity
              style={styles.configButton}
              onPress={() => setShowConfigModal(true)}
            >
              <Settings size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              setRefreshing(true);
              loadSecurityData();
            }}
          >
            <RefreshCw size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {canViewSessions && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sessions' && styles.activeTab]}
            onPress={() => setActiveTab('sessions')}
          >
            <Clock size={16} color={activeTab === 'sessions' ? '#3B82F6' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'sessions' && styles.activeTabText]}>
              Active Sessions ({sessions.length})
            </Text>
          </TouchableOpacity>
        )}
        
        {canViewAuditLogs && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'events' && styles.activeTab]}
            onPress={() => setActiveTab('events')}
          >
            <Activity size={16} color={activeTab === 'events' ? '#3B82F6' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>
              Security Events ({events.length})
            </Text>
          </TouchableOpacity>
        )}
        
        {canManageSecurity && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'config' && styles.activeTab]}
            onPress={() => setActiveTab('config')}
          >
            <ShieldCheck size={16} color={activeTab === 'config' ? '#3B82F6' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'config' && styles.activeTabText]}>
              Configuration
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadSecurityData} />
        }
      >
        {/* Sessions Tab */}
        {activeTab === 'sessions' && canViewSessions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active User Sessions</Text>
            
            {/* Search and Actions */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInput}>
                <Search size={20} color="#6B7280" />
                <TextInput
                  style={styles.searchText}
                  placeholder="Search sessions..."
                  value={sessionSearchQuery}
                  onChangeText={setSessionSearchQuery}
                />
              </View>
              {selectedSessions.length > 0 && (
                <TouchableOpacity
                  style={styles.terminateButton}
                  onPress={terminateSelectedSessions}
                >
                  <Text style={styles.terminateButtonText}>
                    Terminate ({selectedSessions.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Sessions List */}
            {filteredSessions.length === 0 ? (
              <View style={styles.emptyState}>
                <Clock size={48} color="#6B7280" />
                <Text style={styles.emptyStateText}>
                  {sessionSearchQuery ? 'No sessions match your search' : 'No active sessions'}
                </Text>
              </View>
            ) : (
              filteredSessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={[
                    styles.sessionCard,
                    selectedSessions.includes(session.id) && styles.selectedSessionCard,
                  ]}
                  onPress={() => {
                    if (selectedSessions.includes(session.id)) {
                      setSelectedSessions(prev => prev.filter(id => id !== session.id));
                    } else {
                      setSelectedSessions(prev => [...prev, session.id]);
                    }
                  }}
                >
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionUser}>
                        {session.user?.full_name || 'Unknown User'}
                      </Text>
                      <Text style={styles.sessionEmail}>{session.user?.email}</Text>
                    </View>
                    <View style={styles.sessionStatus}>
                      <View style={[
                        styles.statusDot,
                        { backgroundColor: getSessionStatusColor(session) }
                      ]} />
                      <Text style={styles.statusText}>
                        {getSessionStatusText(session)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.sessionDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>IP Address:</Text>
                      <Text style={styles.detailValue}>{session.ip_address}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Login Time:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(session.login_time).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Duration:</Text>
                      <Text style={styles.detailValue}>
                        {formatSessionDuration(session.login_time, session.last_activity)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Expires:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(session.expires_at).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.sessionActions}>
                    {(canManageSecurity || canManageUsers) && session.active && (
                      <TouchableOpacity
                        style={styles.terminateSingleButton}
                        onPress={() => terminateSession(session.id)}
                      >
                        <XCircle size={16} color="#EF4444" />
                        <Text style={styles.terminateSingleText}>Terminate</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
        
        {/* Events Tab */}
        {activeTab === 'events' && canViewAuditLogs && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security Events & Audit Log</Text>
            
            {/* Search and Filters */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInput}>
                <Search size={20} color="#6B7280" />
                <TextInput
                  style={styles.searchText}
                  placeholder="Search events..."
                  value={eventSearchQuery}
                  onChangeText={setEventSearchQuery}
                />
              </View>
              <View style={styles.filterContainer}>
                <Filter size={20} color="#6B7280" />
                <TextInput
                  style={styles.filterInput}
                  placeholder="Event type..."
                  value={eventTypeFilter}
                  onChangeText={setEventTypeFilter}
                />
              </View>
            </View>
            
            {/* Event Types Quick Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFilter}>
              <TouchableOpacity
                style={[styles.quickFilterItem, eventTypeFilter === 'all' && styles.activeQuickFilterItem]}
                onPress={() => setEventTypeFilter('all')}
              >
                <Text style={[styles.quickFilterText, eventTypeFilter === 'all' && styles.activeQuickFilterText]}>
                  All Events
                </Text>
              </TouchableOpacity>
              {SECURITY_EVENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.quickFilterItem, eventTypeFilter === type && styles.activeQuickFilterItem]}
                  onPress={() => setEventTypeFilter(type)}
                >
                  <Text style={[styles.quickFilterText, eventTypeFilter === type && styles.activeQuickFilterText]}>
                    {type.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Events List */}
            {filteredEvents.length === 0 ? (
              <View style={styles.emptyState}>
                <Activity size={48} color="#6B7280" />
                <Text style={styles.emptyStateText}>
                  {eventSearchQuery || eventTypeFilter !== 'all' 
                    ? 'No events match your criteria' 
                    : 'No security events found'
                  }
                </Text>
              </View>
            ) : (
              filteredEvents.map((event) => (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventUser}>
                        {event.user?.full_name || 'System'}
                      </Text>
                      <Text style={styles.eventType}>
                        {event.event_type.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.eventTime}>
                      {new Date(event.created_at).toLocaleString()}
                    </Text>
                  </View>
                  
                  <Text style={styles.eventDescription}>{event.description}</Text>
                  
                  {event.ip_address && (
                    <Text style={styles.eventDetail}>IP: {event.ip_address}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}
        
        {/* Configuration Tab */}
        {activeTab === 'config' && canManageSecurity && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security Configuration</Text>
            
            <View style={styles.configForm}>
              {/* Session Configuration */}
              <View style={styles.configGroup}>
                <Text style={styles.configGroupTitle}>Session Management</Text>
                
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Session Timeout (hours)</Text>
                  <TextInput
                    style={styles.configInput}
                    value={securityConfig.session_timeout_hours.toString()}
                    onChangeText={(text) => setSecurityConfig({
                      ...securityConfig,
                      session_timeout_hours: parseInt(text) || 8
                    })}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Enable Session Monitoring</Text>
                  <Switch
                    value={securityConfig.enable_session_monitoring}
                    onValueChange={(value) => setSecurityConfig({
                      ...securityConfig,
                      enable_session_monitoring: value
                    })}
                  />
                </View>
              </View>
              
              {/* Account Security */}
              <View style={styles.configGroup}>
                <Text style={styles.configGroupTitle}>Account Security</Text>
                
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Max Failed Attempts</Text>
                  <TextInput
                    style={styles.configInput}
                    value={securityConfig.max_failed_attempts.toString()}
                    onChangeText={(text) => setSecurityConfig({
                      ...securityConfig,
                      max_failed_attempts: parseInt(text) || 5
                    })}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Lockout Duration (minutes)</Text>
                  <TextInput
                    style={styles.configInput}
                    value={securityConfig.lockout_duration_minutes.toString()}
                    onChangeText={(text) => setSecurityConfig({
                      ...securityConfig,
                      lockout_duration_minutes: parseInt(text) || 30
                    })}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              {/* Password Policy */}
              <View style={styles.configGroup}>
                <Text style={styles.configGroupTitle}>Password Policy</Text>
                
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Minimum Length</Text>
                  <TextInput
                    style={styles.configInput}
                    value={securityConfig.password_min_length.toString()}
                    onChangeText={(text) => setSecurityConfig({
                      ...securityConfig,
                      password_min_length: parseInt(text) || 8
                    })}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Require Uppercase</Text>
                  <Switch
                    value={securityConfig.require_uppercase}
                    onValueChange={(value) => setSecurityConfig({
                      ...securityConfig,
                      require_uppercase: value
                    })}
                  />
                </View>
                
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Require Lowercase</Text>
                  <Switch
                    value={securityConfig.require_lowercase}
                    onValueChange={(value) => setSecurityConfig({
                      ...securityConfig,
                      require_lowercase: value
                    })}
                  />
                </View>
                
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Require Numbers</Text>
                  <Switch
                    value={securityConfig.require_numbers}
                    onValueChange={(value) => setSecurityConfig({
                      ...securityConfig,
                      require_numbers: value
                    })}
                  />
                </View>
                
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Require Symbols</Text>
                  <Switch
                    value={securityConfig.require_symbols}
                    onValueChange={(value) => setSecurityConfig({
                      ...securityConfig,
                      require_symbols: value
                    })}
                  />
                </View>
                
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Password Expiry (days)</Text>
                  <TextInput
                    style={styles.configInput}
                    value={securityConfig.password_expiry_days.toString()}
                    onChangeText={(text) => setSecurityConfig({
                      ...securityConfig,
                      password_expiry_days: parseInt(text) || 90
                    })}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              {/* Audit & Monitoring */}
              <View style={styles.configGroup}>
                <Text style={styles.configGroupTitle}>Audit & Monitoring</Text>
                
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Enable Audit Logging</Text>
                  <Switch
                    value={securityConfig.enable_audit_logging}
                    onValueChange={(value) => setSecurityConfig({
                      ...securityConfig,
                      enable_audit_logging: value
                    })}
                  />
                </View>
              </View>
              
              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveConfigButton}
                onPress={saveSecurityConfig}
                disabled={configSaving}
              >
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveConfigButtonText}>
                  {configSaving ? 'Saving...' : 'Save Configuration'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Configuration Modal */}
      <Modal
        visible={showConfigModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Password Strength Test</Text>
            
            <View style={styles.passwordTestContainer}>
              <Text style={styles.testLabel}>Enter password to test strength:</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password..."
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.togglePassword}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
              
              {password && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    <View style={[
                      styles.strengthFill,
                      { 
                        width: `${(calculatePasswordStrength(password).score / 6) * 100}%`,
                        backgroundColor: calculatePasswordStrength(password).color
                      }
                    ]} />
                  </View>
                  <Text style={[styles.strengthText, { color: calculatePasswordStrength(password).color }]}>
                    {calculatePasswordStrength(password).label}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowConfigModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Close</Text>
              </TouchableOpacity>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  configButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
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
  filterContainer: {
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
  filterInput: {
    fontSize: 14,
    color: '#111827',
  },
  terminateButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  terminateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedSessionCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sessionEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  sessionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  sessionDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  sessionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  terminateSingleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  terminateSingleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventInfo: {
    flex: 1,
  },
  eventUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  eventType: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    marginTop: 2,
  },
  eventTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  eventDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  eventDetail: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  configForm: {
    gap: 24,
  },
  configGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  configGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  configInput: {
    width: 80,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 14,
    color: '#111827',
  },
  saveConfigButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  saveConfigButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  passwordTestContainer: {
    gap: 16,
  },
  testLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  togglePassword: {
    padding: 4,
  },
  strengthContainer: {
    gap: 8,
  },
  strengthBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 4,
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalCancelButton: {
    flex: 1,
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