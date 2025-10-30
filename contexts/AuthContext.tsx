import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

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
      console.log('AuthContext: Fetching profile from Supabase for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('AuthContext: Supabase error loading profile:', error);
        throw error;
      }
      console.log('AuthContext: Profile loaded successfully:', data ? 'profile found' : 'no profile');
      setProfile(data);
    } catch (error) {
      console.error('AuthContext: Error loading profile:', error);
    } finally {
      console.log('AuthContext: Setting loading to false after profile load attempt');
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName,
        role: 'staff',
      });

      if (profileError) throw profileError;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    try {
      // Set loading to true to prevent race conditions during sign-out
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
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

      // Try to create the admin user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
      });

      // If there's an error and it's not "User already registered", throw it
      if (signUpError && !signUpError.message.includes('User already registered')) {
        throw signUpError;
      }

      // If user already exists or was just created, try to sign in
      await signIn(adminEmail, adminPassword);

      // Check if profile exists, create if not
      if (data?.user) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!existingProfile) {
          // Create admin profile
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: adminName,
            role: 'admin',
          });

          if (profileError) throw profileError;
        }
      }
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