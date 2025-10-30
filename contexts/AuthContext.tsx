import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';
import * as authService from '@/services/api/authService';
import * as userService from '@/services/api/userService';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    authService.getSession().then((session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const data = await userService.getUserById(userId);
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    await authService.signUp({ email, password, full_name: fullName });
  };

  const signIn = async (email: string, password: string) => {
    await authService.signIn({ email, password });
  };

  const signOut = async () => {
    try {
      await authService.signOut();

      // Clear local state immediately after sign out
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const createAdminUser = async () => {
    const adminEmail = 'admin@boltpos.com';
    const adminPassword = 'Admin123!';
    const adminName = 'Admin User';

    try {
      // First, try to sign in (in case admin already exists)
      try {
        await signIn(adminEmail, adminPassword);
        return;
      } catch (signInError: any) {
        // If sign in fails, check if it's because the user doesn't exist
        if (signInError.message && signInError.message.includes('Invalid login credentials')) {
          // User doesn't exist, continue with creation
        } else {
          // Some other error, re-throw it
          throw signInError;
        }
      }

      // Create admin user using service
      await authService.createAdminUser(adminEmail, adminPassword, adminName);

      // Sign in with the new admin account
      await signIn(adminEmail, adminPassword);
    } catch (error) {
      console.error('Error creating admin user:', error);
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