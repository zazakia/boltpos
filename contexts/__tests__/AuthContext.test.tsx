import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { supabase } from '@/lib/supabase';

// Mock the supabase module
jest.mock('@/lib/supabase');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('AuthContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    } as any);
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should provide auth context when used within AuthProvider', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBeDefined();
        expect(result.current.session).toBeNull();
        expect(result.current.user).toBeNull();
        expect(result.current.profile).toBeNull();
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Initial state and session loading', () => {
    it('should initialize with loading true and then set to false', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should load existing session on mount', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession as any },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: {
            id: 'user-123',
            email: 'test@example.com',
            full_name: 'Test User',
            role: 'staff',
          },
          error: null,
        }),
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.session).toEqual(mockSession);
        expect(result.current.user).toEqual(mockSession.user);
        expect(result.current.profile).toEqual({
          id: 'user-123',
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'staff',
        });
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle missing profile gracefully', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession as any },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.session).toEqual(mockSession);
        expect(result.current.profile).toBeNull();
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('signUp', () => {
    it('should successfully sign up a new user', async () => {
      const mockUser = {
        id: 'new-user-123',
        email: 'newuser@example.com',
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser as any, session: null },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.signUp('newuser@example.com', 'password123', 'New User');
      });

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should throw error on sign up failure', async () => {
      const mockError = new Error('Email already registered');

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError as any,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        result.current.signUp('test@example.com', 'password123', 'Test User')
      ).rejects.toThrow('Email already registered');
    });

    it('should throw error on profile creation failure', async () => {
      const mockUser = {
        id: 'new-user-123',
        email: 'newuser@example.com',
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser as any, session: null },
        error: null,
      });

      const profileError = new Error('Profile creation failed');
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: profileError }),
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        result.current.signUp('newuser@example.com', 'password123', 'New User')
      ).rejects.toThrow('Profile creation failed');
    });
  });

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' } as any,
          session: {} as any,
        },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should throw error on sign in failure', async () => {
      const mockError = new Error('Invalid login credentials');

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError as any,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        result.current.signIn('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid login credentials');
    });
  });

  describe('signOut', () => {
    it('should successfully sign out a user', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(result.current.session).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.profile).toBeNull();
    });

    it('should throw error on sign out failure', async () => {
      const mockError = new Error('Sign out failed');

      mockSupabase.auth.signOut.mockResolvedValue({
        error: mockError as any,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('createAdminUser', () => {
    it('should sign in if admin already exists', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'admin-123', email: 'admin@boltpos.com' } as any,
          session: {} as any,
        },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.createAdminUser();
      });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'admin@boltpos.com',
        password: 'Admin123!',
      });
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('should create admin user if not exists', async () => {
      // First sign in attempt fails
      mockSupabase.auth.signInWithPassword
        .mockResolvedValueOnce({
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials' } as any,
        })
        .mockResolvedValueOnce({
          data: {
            user: { id: 'admin-123', email: 'admin@boltpos.com' } as any,
            session: {} as any,
          },
          error: null,
        });

      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'admin-123', email: 'admin@boltpos.com' } as any,
          session: null,
        },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        insert: jest.fn().mockResolvedValue({ error: null }),
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.createAdminUser();
      });

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'admin@boltpos.com',
        password: 'Admin123!',
      });
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledTimes(2);
    });

    it('should not create profile if admin profile already exists', async () => {
      mockSupabase.auth.signInWithPassword
        .mockResolvedValueOnce({
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials' } as any,
        })
        .mockResolvedValueOnce({
          data: {
            user: { id: 'admin-123', email: 'admin@boltpos.com' } as any,
            session: {} as any,
          },
          error: null,
        });

      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'admin-123', email: 'admin@boltpos.com' } as any,
          session: null,
        },
        error: null,
      });

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: { id: 'admin-123' },
        error: null,
      });
      const mockInsert = jest.fn();

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
        insert: mockInsert,
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.createAdminUser();
      });

      expect(mockInsert).not.toHaveBeenCalled();
    });
  });

  describe('Auth state change subscription', () => {
    it('should set up auth state change listener', async () => {
      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
      });
    });

    it('should clean up subscription on unmount', async () => {
      const unsubscribe = jest.fn();
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: {
          subscription: {
            unsubscribe,
          },
        },
      } as any);

      const { unmount } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
