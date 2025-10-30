/**
 * useUsers Hook
 * Custom hook for managing user data and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import * as userService from '../services/api/userService';
import { MESSAGES } from '../constants';

export const useUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : MESSAGES.ERROR.USER_LOAD_FAILED);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const updateUser = async (id: string, userData: Partial<UserProfile>) => {
    try {
      const updated = await userService.updateUserProfile(id, userData);
      setUsers(prev => prev.map(u => (u.id === id ? updated : u)));
      return { success: true, data: updated };
    } catch (err) {
      const message = err instanceof Error ? err.message : MESSAGES.ERROR.USER_UPDATE_FAILED;
      return { success: false, error: message };
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await userService.deleteUserProfile(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : MESSAGES.ERROR.USER_DELETE_FAILED;
      return { success: false, error: message };
    }
  };

  const updatePassword = async (userId: string, newPassword: string) => {
    try {
      await userService.updateUserPassword(userId, newPassword);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : MESSAGES.ERROR.PASSWORD_UPDATE_FAILED;
      return { success: false, error: message };
    }
  };

  const refresh = () => {
    loadUsers();
  };

  return {
    users,
    loading,
    error,
    updateUser,
    deleteUser,
    updatePassword,
    refresh,
  };
};

/**
 * Hook for a single user
 */
export const useUser = (id: string) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await userService.getUserById(id);
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : MESSAGES.ERROR.USER_LOAD_FAILED);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [id]);

  return { user, loading, error };
};
