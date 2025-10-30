/**
 * User Service
 * Handles all user-related API operations
 */

import { supabase } from '../../lib/supabase';
import { UserProfile, CreateUserDto, UpdateUserDto } from '../../types';
import { handleApiError, logError } from '../../utils';
import { MESSAGES } from '../../constants';

/**
 * Get all users (admin only)
 */
export const getUsers = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logError(error, { context: 'getUsers' });
    throw new Error(handleApiError(error, MESSAGES.ERROR.USER_LOAD_FAILED));
  }
};

/**
 * Get a single user by ID
 */
export const getUserById = async (id: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logError(error, { context: 'getUserById', id });
    throw new Error(handleApiError(error, MESSAGES.ERROR.USER_LOAD_FAILED));
  }
};

/**
 * Get current user profile
 */
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return getUserById(user.id);
  } catch (error) {
    logError(error, { context: 'getCurrentUserProfile' });
    throw new Error(handleApiError(error, MESSAGES.ERROR.PROFILE_LOAD_FAILED));
  }
};

/**
 * Create a new user profile
 */
export const createUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        ...profileData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logError(error, { context: 'createUserProfile', userId, profileData });
    throw new Error(handleApiError(error, MESSAGES.ERROR.USER_CREATE_FAILED));
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (id: string, profileData: Partial<UserProfile>): Promise<UserProfile> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logError(error, { context: 'updateUserProfile', id, profileData });
    throw new Error(handleApiError(error, MESSAGES.ERROR.USER_UPDATE_FAILED));
  }
};

/**
 * Delete a user profile
 */
export const deleteUserProfile = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    logError(error, { context: 'deleteUserProfile', id });
    throw new Error(handleApiError(error, MESSAGES.ERROR.USER_DELETE_FAILED));
  }
};

/**
 * Update user password (admin only)
 */
export const updateUserPassword = async (userId: string, newPassword: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) throw error;
  } catch (error) {
    logError(error, { context: 'updateUserPassword', userId });
    throw new Error(handleApiError(error, MESSAGES.ERROR.PASSWORD_UPDATE_FAILED));
  }
};

/**
 * Get users by role
 */
export const getUsersByRole = async (role: 'admin' | 'staff'): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', role)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logError(error, { context: 'getUsersByRole', role });
    throw new Error(handleApiError(error, MESSAGES.ERROR.USER_LOAD_FAILED));
  }
};

/**
 * Check if user is admin
 */
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const user = await getUserById(userId);
    return user?.role === 'admin';
  } catch (error) {
    logError(error, { context: 'isUserAdmin', userId });
    return false;
  }
};
