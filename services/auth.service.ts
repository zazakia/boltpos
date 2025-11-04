import { supabase, supabaseService } from '@/lib/supabase';
import { getErrorMessage } from '@/utils/errorHandler';
import { ServiceResult } from './types';

export const loadUserProfile = async (userId: string): Promise<ServiceResult<any>> => {
  try {
    console.log('auth.service: Loading profile for user:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('auth.service: Supabase error loading profile:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('auth.service: Profile loaded successfully:', data ? 'profile found' : 'no profile');
    return { data, error: null };
  } catch (error) {
    console.error('auth.service: Error loading profile:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const signUpUser = async (email: string, password: string, fullName: string): Promise<ServiceResult<any>> => {
  try {
    console.log('auth.service: Signing up user:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('auth.service: Supabase error signing up:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName,
        role: 'staff',
      });

      if (profileError) {
        console.error('auth.service: Error creating profile:', profileError);
        return { data: null, error: getErrorMessage(profileError) };
      }
    }

    console.log('auth.service: User signed up successfully');
    return { data, error: null };
  } catch (error) {
    console.error('auth.service: Error signing up user:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const signInUser = async (email: string, password: string): Promise<ServiceResult<any>> => {
  try {
    console.log('auth.service: Signing in user:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('auth.service: Supabase error signing in:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('auth.service: User signed in successfully');
    return { data, error: null };
  } catch (error) {
    console.error('auth.service: Error signing in user:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const signOutUser = async (): Promise<ServiceResult<boolean>> => {
  try {
    console.log('auth.service: Signing out user');
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('auth.service: Supabase error signing out:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('auth.service: User signed out successfully');
    return { data: true, error: null };
  } catch (error) {
    console.error('auth.service: Error signing out user:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const createAdminUser = async (): Promise<ServiceResult<any>> => {
  const adminEmail = 'admin@boltpos.com';
  const adminPassword = 'Admin123!';
  const adminName = 'Admin User';

  try {
    console.log('auth.service: Creating admin user');
    
    // Try to create the admin user using service role (bypasses email confirmation)
    const { data, error: signUpError } = await supabaseService.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Bypass email confirmation
    });

    if (signUpError && !signUpError.message.includes('already registered')) {
      console.error('auth.service: Error creating admin user:', signUpError);
      return { data: null, error: getErrorMessage(signUpError) };
    }

    console.log('auth.service: Admin user created successfully or already exists');
    return { data, error: null };
  } catch (error) {
    console.error('auth.service: Error creating admin user:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const createAdminProfileForExistingUser = async (): Promise<ServiceResult<any>> => {
  const adminEmail = 'admin@boltpos.com';
  const adminName = 'Admin User';

  try {
    console.log('auth.service: Creating admin profile for existing user');
    
    // List all users to find the admin by email
    const { data: authData, error: listUsersError } = await supabaseService.auth.admin.listUsers();

    if (listUsersError) {
      console.error('auth.service: Could not list users:', listUsersError);
      return { data: null, error: getErrorMessage(listUsersError) };
    }

    const existingUser = authData.users.find(u => u.email === adminEmail);
    if (!existingUser) {
      return { data: null, error: 'Admin user not found' };
    }

    console.log('auth.service: Found existing user, creating profile:', existingUser.id);

    // Check if profile exists
    const { data: existingProfile } = await supabaseService
      .from('profiles')
      .select('id')
      .eq('id', existingUser.id)
      .maybeSingle();

    if (!existingProfile) {
      // Create admin profile directly using service role
      const { error: profileError } = await supabaseService.from('profiles').insert({
        id: existingUser.id,
        email: existingUser.email,
        full_name: adminName,
        role: 'admin',
      });

      if (profileError) {
        console.error('auth.service: Error creating admin profile:', profileError);
        return { data: null, error: getErrorMessage(profileError) };
      }

      console.log('auth.service: Admin profile created successfully for existing user');
    } else {
      console.log('auth.service: Admin profile already exists');
    }

    return { data: existingUser, error: null };
  } catch (error) {
    console.error('auth.service: Error creating admin profile for existing user:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const resetUserPassword = async (email: string, redirectUrl?: string): Promise<ServiceResult<boolean>> => {
  try {
    console.log('auth.service: Resetting password for user:', email);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('auth.service: Supabase error resetting password:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('auth.service: Password reset email sent successfully');
    return { data: true, error: null };
  } catch (error) {
    console.error('auth.service: Error resetting password:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};