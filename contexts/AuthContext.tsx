import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseService } from '@/lib/supabase';
import {
  loadUserProfile,
  signUpUser,
  signInUser,
  signOutUser,
  createAdminUser as createAdminUserService,
  createAdminProfileForExistingUser as createAdminProfileService
} from '@/services/auth.service';

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'staff';
  active: boolean;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  createAdminUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Initializing authentication');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session check:', session ? 'session found' : 'no session');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('AuthContext: Loading profile for user:', session.user.id);
        loadProfile(session.user.id);
      } else {
        console.log('AuthContext: No session found, setting loading to false');
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('AuthContext: Auth state changed:', _event, session ? 'session exists' : 'no session');
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          console.log('AuthContext: Loading profile for user after state change:', session.user.id);
          await loadProfile(session.user.id);
        } else {
          console.log('AuthContext: No session after state change, clearing profile');
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      console.log('AuthContext: Loading profile using auth.service for user:', userId);
      const result = await loadUserProfile(userId);
      
      if (result.error) {
        console.error('AuthContext: Auth service error loading profile:', result.error);
        // Continue without throwing, as per instructions
      } else {
        console.log('AuthContext: Profile loaded successfully:', result.data ? 'profile found' : 'no profile');
        setProfile(result.data);
      }
    } catch (error) {
      console.error('AuthContext: Error loading profile:', error);
    } finally {
      console.log('AuthContext: Setting loading to false after profile load attempt');
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const result = await signUpUser(email, password, fullName);
    
    if (result.error) {
      throw new Error(result.error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const result = await signInUser(email, password);
    
    if (result.error) {
      throw new Error(result.error);
    }
  };

  const signOut = async () => {
    try {
      // Set loading to true to prevent race conditions during sign-out
      setLoading(true);
      
      const result = await signOutUser();
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Clear local state immediately after sign out
      setSession(null);
      setUser(null);
      setProfile(null);
      
      // Note: setLoading(false) will be handled by onAuthStateChange listener
      // This ensures the loading state is properly managed throughout the sign-out flow
    } catch (error) {
      console.error('Sign out error:', error);
      // Reset loading state on error
      setLoading(false);
      throw error;
    }
  };

  const createAdminUser = async () => {
    const adminEmail = 'admin@boltpos.com';
    const adminPassword = 'Admin123!';

    try {
      // First, try to sign in (in case admin already exists and is confirmed)
      try {
        await signIn(adminEmail, adminPassword);
        return;
      } catch (signInError: any) {
        // Handle different sign-in errors
        if (signInError.message && signInError.message.includes('Invalid login credentials')) {
          // User doesn't exist, continue with creation
          console.log('Admin user does not exist, will create new one');
        } else if (signInError.message && signInError.message.includes('Email not confirmed')) {
          // User exists but email not confirmed, will create profile using service role
          console.log('Admin user exists but email not confirmed, will create profile');
          await createAdminProfileForExistingUser();
          return;
        } else {
          // Some other error, re-throw it
          throw signInError;
        }
      }

      // Try to create the admin user using service role (bypasses email confirmation)
      console.log('Creating admin user with service role...');
      const result = await createAdminUserService();
      
      if (result.error) {
        if (!result.error.includes('already registered')) {
          throw new Error(result.error);
        }
        console.log('Admin user already exists in auth system');
      } else {
        console.log('Admin user created successfully with service role');
      }

      // Try to sign in the created user
      await signIn(adminEmail, adminPassword);
    } catch (error) {
      console.error('Error creating admin user:', error);
      throw error;
    }
  };

  const createAdminProfileForExistingUser = async () => {
    try {
      console.log('Creating admin profile for existing user using auth.service');
      const result = await createAdminProfileService();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      console.log('Admin profile created successfully for existing user');
    } catch (error) {
      console.error('Error creating admin profile for existing user:', error);
      throw error;
    }
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    createAdminUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}