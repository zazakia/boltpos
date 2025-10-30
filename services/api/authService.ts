/**
 * Authentication Service
 * Handles all authentication-related operations
 */

import { supabase } from '../../lib/supabase';
import { SignInDto, SignUpDto, UserProfile } from '../../types';
import { handleApiError, logError } from '../../utils';
import { MESSAGES } from '../../constants';
import { createUserProfile } from './userService';

/**
 * Sign in with email and password
 */
export const signIn = async ({ email, password }: SignInDto) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    logError(error, { context: 'signIn', email });
    throw new Error(handleApiError(error, MESSAGES.ERROR.LOGIN_FAILED));
  }
};

/**
 * Sign up with email and password
 */
export const signUp = async ({ email, password, full_name }: SignUpDto) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Create user profile
    if (data.user) {
      await createUserProfile(data.user.id, {
        email,
        full_name: full_name || null,
        role: 'staff', // Default role
      });
    }

    return data;
  } catch (error) {
    logError(error, { context: 'signUp', email });
    throw new Error(handleApiError(error, MESSAGES.ERROR.SIGNUP_FAILED));
  }
};

/**
 * Sign out current user
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    logError(error, { context: 'signOut' });
    throw new Error(handleApiError(error, MESSAGES.ERROR.LOGOUT_FAILED));
  }
};

/**
 * Get current session
 */
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    logError(error, { context: 'getSession' });
    return null;
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  } catch (error) {
    logError(error, { context: 'getCurrentUser' });
    return null;
  }
};

/**
 * Create admin user (for initial setup)
 */
export const createAdminUser = async (email: string, password: string, fullName?: string) => {
  try {
    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    // Create profile with admin role
    const profile = await createUserProfile(authData.user.id, {
      email,
      full_name: fullName || null,
      role: 'admin',
    });

    return { user: authData.user, profile };
  } catch (error) {
    logError(error, { context: 'createAdminUser', email });
    throw new Error(handleApiError(error, MESSAGES.ERROR.USER_CREATE_FAILED));
  }
};

/**
 * Reset password
 */
export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  } catch (error) {
    logError(error, { context: 'resetPassword', email });
    throw new Error(handleApiError(error, MESSAGES.ERROR.GENERIC));
  }
};

/**
 * Update password for current user
 */
export const updatePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  } catch (error) {
    logError(error, { context: 'updatePassword' });
    throw new Error(handleApiError(error, MESSAGES.ERROR.PASSWORD_UPDATE_FAILED));
  }
};
