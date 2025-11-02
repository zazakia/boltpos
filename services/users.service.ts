import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/utils/errorHandler';

export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

export const fetchAllUsers = async (): Promise<ServiceResult<any[]>> => {
  try {
    console.log('users.service: Fetching all users');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('users.service: Supabase error fetching all users:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('users.service: All users fetched successfully');
    return { data, error: null };
  } catch (error) {
    console.error('users.service: Error fetching all users:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const fetchUserById = async (userId: string): Promise<ServiceResult<any>> => {
  try {
    console.log('users.service: Fetching user by ID:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('users.service: Supabase error fetching user by ID:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('users.service: User fetched successfully');
    return { data, error: null };
  } catch (error) {
    console.error('users.service: Error fetching user by ID:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const updateUserProfile = async (userId: string, profileData: any): Promise<ServiceResult<any>> => {
  try {
    console.log('users.service: Updating user profile:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('users.service: Supabase error updating user profile:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('users.service: User profile updated successfully');
    return { data, error: null };
  } catch (error) {
    console.error('users.service: Error updating user profile:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const updateOwnProfile = async (userId: string, fullName: string): Promise<ServiceResult<any>> => {
  try {
    console.log('users.service: Updating own profile:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('users.service: Supabase error updating own profile:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('users.service: Own profile updated successfully');
    return { data, error: null };
  } catch (error) {
    console.error('users.service: Error updating own profile:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const toggleUserActiveStatus = async (userId: string): Promise<ServiceResult<any>> => {
  try {
    console.log('users.service: Toggling user active status:', userId);
    
    // First, get current status
    const { data: currentUser, error: fetchError } = await supabase
      .from('profiles')
      .select('active')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('users.service: Supabase error fetching current user status:', fetchError);
      return { data: null, error: getErrorMessage(fetchError) };
    }

    if (!currentUser) {
      return { data: null, error: 'User not found' };
    }

    // Toggle the status
    const newStatus = !currentUser.active;
    const { data, error } = await supabase
      .from('profiles')
      .update({ active: newStatus })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('users.service: Supabase error toggling user active status:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('users.service: User active status toggled successfully to:', newStatus);
    return { data, error: null };
  } catch (error) {
    console.error('users.service: Error toggling user active status:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};