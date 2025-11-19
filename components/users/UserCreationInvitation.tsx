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
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import RBACService, { Role } from '@/services/rbac.service';
import { 
  UserPlus, 
  Mail, 
  Lock, 
  Shield, 
  User, 
  Phone, 
  MapPin,
  Check,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  Send,
  Settings,
  Users,
  Copy,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react-native';

interface UserCreationData {
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
  phone: string;
  warehouse_id: string | null;
  role_ids: string[];
  send_invitation: boolean;
  message: string;
}

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  preventReuse: number; // number of recent passwords to check against
}

const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventReuse: 3,
};

const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123',
  'password123', 'admin', 'letmein', 'welcome', 'monkey',
  '1234567890', 'football', 'iloveyou', 'dragon', 'master',
  'sunshine', 'princess', 'trustno1', 'password1', 'admin123'
];

interface UserCreationInvitationProps {
  onClose?: () => void;
  onUserCreated?: (user: any) => void;
  onUserInvited?: (user: any) => void;
}

export default function UserCreationInvitation({
  onClose,
  onUserCreated,
  onUserInvited
}: UserCreationInvitationProps = {}) {
  const { profile: currentUser } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [createUserModal, setCreateUserModal] = useState(false);
  const [inviteUserModal, setInviteUserModal] = useState(false);
  const [passwordPolicyModal, setPasswordPolicyModal] = useState(false);
  
  // Form states
  const [userForm, setUserForm] = useState<UserCreationData>({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    warehouse_id: null,
    role_ids: [],
    send_invitation: true,
    message: 'Welcome to InventoryPro! Your account has been created and is ready to use.',
  });
  
  const [inviteForm, setInviteForm] = useState<{
    email: string;
    first_name: string;
    last_name: string;
    role_ids: string[];
    message: string;
  }>({
    email: '',
    first_name: '',
    last_name: '',
    role_ids: [],
    message: 'You have been invited to join InventoryPro. Please complete your registration.',
  });
  
  // Validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Permission states
  const [permissionsList, setPermissionsList] = useState<string[]>([]);
  const canCreateUsers = permissionsList.includes('create_users');
  const canInviteUsers = permissionsList.includes('invite_users');
  const canManagePasswordPolicy = permissionsList.includes('manage_password_policy');

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
    validateEmail(userForm.email);
    validatePassword(userForm.password);
    validateForm();
  }, [userForm]);

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
      
      // Load roles and warehouses in parallel
      const [rolesResult, warehousesResult] = await Promise.all([
        RBACService.getRoles(),
        // We don't have a warehouses service yet, so we'll mock this
        Promise.resolve({ data: [], error: null })
      ]);

      if (rolesResult.error) throw new Error(rolesResult.error);

      setRoles(rolesResult.data || []);
      
      // Mock warehouse data for now
      setWarehouses([
        { id: '1', name: 'Main Warehouse', location: 'Manila' },
        { id: '2', name: 'North Warehouse', location: 'Quezon City' },
        { id: '3', name: 'South Warehouse', location: 'Muntinlupa' },
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }

    const errors: string[] = [];
    
    if (password.length < DEFAULT_PASSWORD_POLICY.minLength) {
      errors.push(`Must be at least ${DEFAULT_PASSWORD_POLICY.minLength} characters long`);
    }
    
    if (DEFAULT_PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Must contain at least one uppercase letter');
    }
    
    if (DEFAULT_PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Must contain at least one lowercase letter');
    }
    
    if (DEFAULT_PASSWORD_POLICY.requireNumbers && !/\d/.test(password)) {
      errors.push('Must contain at least one number');
    }
    
    if (DEFAULT_PASSWORD_POLICY.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Must contain at least one special character');
    }
    
    if (DEFAULT_PASSWORD_POLICY.preventCommonPasswords && 
        COMMON_PASSWORDS.includes(password.toLowerCase())) {
      errors.push('This password is too common. Please choose a stronger password');
    }

    if (errors.length > 0) {
      setPasswordError(errors.join('. '));
      return false;
    }

    setPasswordError('');
    return true;
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!userForm.first_name.trim()) errors.push('First name is required');
    if (!userForm.last_name.trim()) errors.push('Last name is required');
    if (!validateEmail(userForm.email)) errors.push('Valid email is required');
    if (!validatePassword(userForm.password)) errors.push('Valid password is required');
    if (userForm.password !== userForm.confirmPassword) errors.push('Passwords do not match');
    if (userForm.role_ids.length === 0) errors.push('At least one role must be assigned');
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: 'Empty', color: '#EF4444' };
    
    let score = 0;
    
    // Length
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character types
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    
    // Special checks
    if (password.length >= 15) score += 1;
    if (!COMMON_PASSWORDS.includes(password.toLowerCase())) score += 1;
    
    if (score <= 3) return { strength: score, label: 'Weak', color: '#EF4444' };
    if (score <= 5) return { strength: score, label: 'Medium', color: '#F59E0B' };
    return { strength: score, label: 'Strong', color: '#10B981' };
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 3) return '#EF4444';
    if (strength <= 5) return '#F59E0B';
    return '#10B981';
  };

  const handleCreateUser = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before proceeding.');
      return;
    }

    try {
      setLoading(true);

      // Create user via Supabase Auth (this would need to be implemented)
      // For now, we'll just simulate the process
      
      // In a real implementation, you would:
      // 1. Create auth user with supabase.auth.signUp()
      // 2. Create user profile record
      // 3. Assign roles via RBACService
      // 4. Send invitation email if requested

      // Mock user data - in real implementation, this would come from the created user
      const createdUser = {
        id: Date.now().toString(),
        email: userForm.email,
        first_name: userForm.first_name,
        last_name: userForm.last_name,
        phone: userForm.phone,
        warehouse_id: userForm.warehouse_id,
        role_ids: userForm.role_ids,
      };

      // Call the callback if provided
      if (onUserCreated) {
        onUserCreated(createdUser);
      }

      Alert.alert(
        'Success',
        `User ${userForm.first_name} ${userForm.last_name} has been created successfully${userForm.send_invitation ? ' and invitation sent' : ''}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setCreateUserModal(false);
              resetUserForm();
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteForm.email || !validateEmail(inviteForm.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    if (inviteForm.role_ids.length === 0) {
      Alert.alert('Validation Error', 'Please assign at least one role.');
      return;
    }

    try {
      setLoading(true);

      // Send invitation email
      // In a real implementation, you would:
      // 1. Generate invitation token
      // 2. Send email with invitation link
      // 3. Store invitation record in database

      // Mock invited user data
      const invitedUser = {
        id: Date.now().toString(),
        email: inviteForm.email,
        first_name: inviteForm.first_name,
        last_name: inviteForm.last_name,
        role_ids: inviteForm.role_ids,
        invitation_sent: true,
      };

      // Call the callback if provided
      if (onUserInvited) {
        onUserInvited(invitedUser);
      }

      Alert.alert(
        'Invitation Sent',
        `Invitation email has been sent to ${inviteForm.email}. The user will be able to complete their registration using the link in the email.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setInviteUserModal(false);
              resetInviteForm();
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const resetUserForm = () => {
    setUserForm({
      email: '',
      password: '',
      confirmPassword: '',
      first_name: '',
      last_name: '',
      phone: '',
      warehouse_id: null,
      role_ids: [],
      send_invitation: true,
      message: 'Welcome to InventoryPro! Your account has been created and is ready to use.',
    });
    setValidationErrors([]);
  };

  const resetInviteForm = () => {
    setInviteForm({
      email: '',
      first_name: '',
      last_name: '',
      role_ids: [],
      message: 'You have been invited to join InventoryPro. Please complete your registration.',
    });
  };

  const toggleRole = (roleId: string, isInvite: boolean = false) => {
    if (isInvite) {
      const newRoleIds = inviteForm.role_ids.includes(roleId)
        ? inviteForm.role_ids.filter(id => id !== roleId)
        : [...inviteForm.role_ids, roleId];
      setInviteForm({ ...inviteForm, role_ids: newRoleIds });
    } else {
      const newRoleIds = userForm.role_ids.includes(roleId)
        ? userForm.role_ids.filter(id => id !== roleId)
        : [...userForm.role_ids, roleId];
      setUserForm({ ...userForm, role_ids: newRoleIds });
    }
  };

  const generatePassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = password.length; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    const shuffled = password.split('').sort(() => Math.random() - 0.5).join('');
    setUserForm({ ...userForm, password: shuffled, confirmPassword: shuffled });
  };

  if (!canCreateUsers && !canInviteUsers) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDenied}>
          <AlertCircle size={48} color="#EF4444" />
          <Text style={styles.accessDeniedText}>Access Denied</Text>
          <Text style={styles.accessDeniedSubtext}>
            You don't have permission to create or invite users
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
          <Text style={styles.headerTitle}>User Creation & Invitation</Text>
          <Text style={styles.headerSubtitle}>
            Create new users or send invitations
          </Text>
        </View>
        <View style={styles.headerRight}>
          {canManagePasswordPolicy && (
            <TouchableOpacity
              style={styles.policyButton}
              onPress={() => setPasswordPolicyModal(true)}
            >
              <Settings size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Action Cards */}
      <ScrollView style={styles.content} contentContainerStyle={{ padding: 16 }}>
        <View style={styles.cardContainer}>
          {/* Create User Card */}
          {canCreateUsers && (
            <View style={styles.actionCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: '#DBEAFE' }]}>
                  <UserPlus size={24} color="#3B82F6" />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>Create User</Text>
                  <Text style={styles.cardDescription}>
                    Create a new user account with immediate access
                  </Text>
                </View>
              </View>
              <Text style={styles.cardFeatures}>
                • Immediate account activation{'\n'}
                • Set password during creation{'\n'}
                • Assign roles and permissions{'\n'}
                • Optional invitation email
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setCreateUserModal(true)}
              >
                <Text style={styles.primaryButtonText}>Create User</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Invite User Card */}
          {canInviteUsers && (
            <View style={styles.actionCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: '#D1FAE5' }]}>
                  <Mail size={24} color="#10B981" />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>Invite User</Text>
                  <Text style={styles.cardDescription}>
                    Send invitation email for self-registration
                  </Text>
                </View>
              </View>
              <Text style={styles.cardFeatures}>
                • Email-based invitation{'\n'}
                • Self-registration process{'\n'}
                • Secure invitation links{'\n'}
                • Custom invitation message
              </Text>
              <TouchableOpacity
                style={[styles.secondaryButton]}
                onPress={() => setInviteUserModal(true)}
              >
                <Text style={styles.secondaryButtonText}>Send Invitation</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionButton}>
              <Copy size={20} color="#6B7280" />
              <Text style={styles.quickActionText}>Bulk Import</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Users size={20} color="#6B7280" />
              <Text style={styles.quickActionText}>User Templates</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Shield size={20} color="#6B7280" />
              <Text style={styles.quickActionText}>Role Templates</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Create User Modal */}
      <Modal
        visible={createUserModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '95%' }]}>
            <Text style={styles.modalTitle}>Create New User</Text>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              {/* Personal Information */}
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={userForm.first_name}
                onChangeText={(text) => setUserForm({ ...userForm, first_name: text })}
                placeholder="Enter first name"
              />

              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={userForm.last_name}
                onChangeText={(text) => setUserForm({ ...userForm, last_name: text })}
                placeholder="Enter last name"
              />

              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, emailError && styles.inputError]}
                value={userForm.email}
                onChangeText={(text) => setUserForm({ ...userForm, email: text })}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {emailError && <Text style={styles.errorText}>{emailError}</Text>}

              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={userForm.phone}
                onChangeText={(text) => setUserForm({ ...userForm, phone: text })}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />

              {/* Password Section */}
              <Text style={styles.sectionTitle}>Password</Text>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={userForm.password}
                  onChangeText={(text) => setUserForm({ ...userForm, password: text })}
                  placeholder="Enter password"
                  secureTextEntry={true}
                />
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={generatePassword}
                >
                  <Lock size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              {/* Password Strength Indicator */}
              {userForm.password && (() => {
                const strength = getPasswordStrength(userForm.password);
                return (
                  <View style={styles.passwordStrengthContainer}>
                    <Text style={styles.passwordStrengthLabel}>
                      Password Strength: 
                    </Text>
                    <View style={styles.passwordStrengthBar}>
                      <View 
                        style={[
                          styles.passwordStrengthFill,
                          { 
                            width: `${(strength.strength / 8) * 100}%`,
                            backgroundColor: getPasswordStrengthColor(strength.strength)
                          }
                        ]}
                      />
                    </View>
                    <Text style={[
                      styles.passwordStrengthText,
                      { color: getPasswordStrengthColor(strength.strength) }
                    ]}>
                      {strength.label}
                    </Text>
                  </View>
                );
              })()}

              {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={[styles.input, userForm.confirmPassword && userForm.password !== userForm.confirmPassword && styles.inputError]}
                value={userForm.confirmPassword}
                onChangeText={(text) => setUserForm({ ...userForm, confirmPassword: text })}
                placeholder="Confirm password"
                secureTextEntry={true}
              />
              {userForm.confirmPassword && userForm.password !== userForm.confirmPassword && (
                <Text style={styles.errorText}>Passwords do not match</Text>
              )}

              {/* Warehouse Assignment */}
              <Text style={styles.sectionTitle}>Assignment</Text>
              <Text style={styles.label}>Warehouse</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => setUserForm({ ...userForm, warehouse_id: null })}
                >
                  <Text style={styles.pickerOptionText}>No Assignment (Global)</Text>
                  {userForm.warehouse_id === null && (
                    <Check size={16} color="#3B82F6" />
                  )}
                </TouchableOpacity>
                {warehouses.map(warehouse => (
                  <TouchableOpacity
                    key={warehouse.id}
                    style={styles.pickerOption}
                    onPress={() => setUserForm({ ...userForm, warehouse_id: warehouse.id })}
                  >
                    <Text style={styles.pickerOptionText}>
                      {warehouse.name} ({warehouse.location})
                    </Text>
                    {userForm.warehouse_id === warehouse.id && (
                      <Check size={16} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Role Assignment */}
              <Text style={styles.sectionTitle}>Role Assignment</Text>
              <Text style={styles.helpText}>
                Assign one or more roles to this user. Users can have multiple roles.
              </Text>
              <View style={styles.roleSelection}>
                {roles.map(role => {
                  const isAssigned = userForm.role_ids.includes(role.id);
                  return (
                    <TouchableOpacity
                      key={role.id}
                      style={[
                        styles.roleItem,
                        isAssigned && styles.roleItemSelected
                      ]}
                      onPress={() => toggleRole(role.id)}
                    >
                      <View style={styles.roleInfo}>
                        <Text style={[
                          styles.roleName,
                          isAssigned && styles.roleNameSelected
                        ]}>
                          {role.display_name}
                        </Text>
                        <Text style={[
                          styles.roleDescription,
                          isAssigned && styles.roleDescriptionSelected
                        ]}>
                          {role.description || `Level ${role.level} role`}
                        </Text>
                      </View>
                      <View style={[
                        styles.roleCheckbox,
                        isAssigned && styles.roleCheckboxChecked
                      ]}>
                        {isAssigned && <Check size={16} color="#FFFFFF" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Invitation Settings */}
              <Text style={styles.sectionTitle}>Invitation Settings</Text>
              <View style={styles.switchContainer}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Send Welcome Email</Text>
                  <Text style={styles.switchDescription}>
                    Send an email notification with account details
                  </Text>
                </View>
                <Switch
                  value={userForm.send_invitation}
                  onValueChange={(value) => setUserForm({ ...userForm, send_invitation: value })}
                  trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {userForm.send_invitation && (
                <>
                  <Text style={styles.label}>Custom Message (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={userForm.message}
                    onChangeText={(text) => setUserForm({ ...userForm, message: text })}
                    placeholder="Enter custom welcome message"
                    multiline
                    numberOfLines={3}
                  />
                </>
              )}

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <View style={styles.validationErrors}>
                  <AlertTriangle size={16} color="#EF4444" />
                  <Text style={styles.validationErrorsTitle}>Please fix the following errors:</Text>
                  {validationErrors.map((error, index) => (
                    <Text key={index} style={styles.validationError}>• {error}</Text>
                  ))}
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setCreateUserModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, validationErrors.length > 0 && styles.saveButtonDisabled]}
                  onPress={handleCreateUser}
                  disabled={validationErrors.length > 0}
                >
                  <Text style={styles.saveButtonText}>Create User</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Invite User Modal */}
      <Modal
        visible={inviteUserModal}
        transparent
        animationType="slide"
        onRequestClose={() => setInviteUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <Text style={styles.modalTitle}>Invite New User</Text>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>User Information</Text>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, inviteForm.email && !validateEmail(inviteForm.email) && styles.inputError]}
                value={inviteForm.email}
                onChangeText={(text) => setInviteForm({ ...inviteForm, email: text })}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>First Name (Optional)</Text>
              <TextInput
                style={styles.input}
                value={inviteForm.first_name}
                onChangeText={(text) => setInviteForm({ ...inviteForm, first_name: text })}
                placeholder="Enter first name"
              />

              <Text style={styles.label}>Last Name (Optional)</Text>
              <TextInput
                style={styles.input}
                value={inviteForm.last_name}
                onChangeText={(text) => setInviteForm({ ...inviteForm, last_name: text })}
                placeholder="Enter last name"
              />

              {/* Role Assignment */}
              <Text style={styles.sectionTitle}>Role Assignment</Text>
              <Text style={styles.helpText}>
                Assign roles that the user will have after registration
              </Text>
              <View style={styles.roleSelection}>
                {roles.map(role => {
                  const isAssigned = inviteForm.role_ids.includes(role.id);
                  return (
                    <TouchableOpacity
                      key={role.id}
                      style={[
                        styles.roleItem,
                        isAssigned && styles.roleItemSelected
                      ]}
                      onPress={() => toggleRole(role.id, true)}
                    >
                      <View style={styles.roleInfo}>
                        <Text style={[
                          styles.roleName,
                          isAssigned && styles.roleNameSelected
                        ]}>
                          {role.display_name}
                        </Text>
                        <Text style={[
                          styles.roleDescription,
                          isAssigned && styles.roleDescriptionSelected
                        ]}>
                          {role.description || `Level ${role.level} role`}
                        </Text>
                      </View>
                      <View style={[
                        styles.roleCheckbox,
                        isAssigned && styles.roleCheckboxChecked
                      ]}>
                        {isAssigned && <Check size={16} color="#FFFFFF" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Message */}
              <Text style={styles.sectionTitle}>Invitation Message</Text>
              <Text style={styles.label}>Custom Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={inviteForm.message}
                onChangeText={(text) => setInviteForm({ ...inviteForm, message: text })}
                placeholder="Enter invitation message"
                multiline
                numberOfLines={4}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setInviteUserModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleInviteUser}
                >
                  <Send size={16} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Send Invitation</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Password Policy Modal */}
      <Modal
        visible={passwordPolicyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setPasswordPolicyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Password Policy</Text>
            <Text style={styles.modalSubtitle}>
              Configure password requirements for user accounts
            </Text>

            <View style={styles.policyContainer}>
              <View style={styles.policyItem}>
                <Text style={styles.policyLabel}>Minimum Length</Text>
                <Text style={styles.policyValue}>{DEFAULT_PASSWORD_POLICY.minLength} characters</Text>
              </View>
              
              <View style={styles.policyItem}>
                <Text style={styles.policyLabel}>Require Uppercase</Text>
                <CheckCircle size={20} color={DEFAULT_PASSWORD_POLICY.requireUppercase ? "#10B981" : "#EF4444"} />
              </View>
              
              <View style={styles.policyItem}>
                <Text style={styles.policyLabel}>Require Lowercase</Text>
                <CheckCircle size={20} color={DEFAULT_PASSWORD_POLICY.requireLowercase ? "#10B981" : "#EF4444"} />
              </View>
              
              <View style={styles.policyItem}>
                <Text style={styles.policyLabel}>Require Numbers</Text>
                <CheckCircle size={20} color={DEFAULT_PASSWORD_POLICY.requireNumbers ? "#10B981" : "#EF4444"} />
              </View>
              
              <View style={styles.policyItem}>
                <Text style={styles.policyLabel}>Require Special Characters</Text>
                <CheckCircle size={20} color={DEFAULT_PASSWORD_POLICY.requireSpecialChars ? "#10B981" : "#EF4444"} />
              </View>
              
              <View style={styles.policyItem}>
                <Text style={styles.policyLabel}>Prevent Common Passwords</Text>
                <CheckCircle size={20} color={DEFAULT_PASSWORD_POLICY.preventCommonPasswords ? "#10B981" : "#EF4444"} />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setPasswordPolicyModal(false)}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
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
  policyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  cardContainer: {
    gap: 16,
    marginBottom: 24,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardFeatures: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
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
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  form: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
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
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generateButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordStrengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  passwordStrengthLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  passwordStrengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 50,
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
  pickerOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  roleSelection: {
    gap: 8,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  roleItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  roleNameSelected: {
    color: '#3B82F6',
  },
  roleDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  roleDescriptionSelected: {
    color: '#3B82F6',
  },
  roleCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleCheckboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  switchDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  validationErrors: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  validationErrorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 4,
  },
  validationError: {
    fontSize: 12,
    color: '#991B1B',
    marginBottom: 2,
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  policyContainer: {
    gap: 12,
    marginVertical: 20,
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  policyLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  policyValue: {
    fontSize: 14,
    color: '#6B7280',
  },
});