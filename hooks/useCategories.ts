/**
 * useCategories Hook
 * Custom hook for managing category data and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { Category, CreateCategoryDto } from '../types';
import * as categoryService from '../services/api/categoryService';
import { MESSAGES } from '../constants';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : MESSAGES.ERROR.CATEGORY_LOAD_FAILED);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const createCategory = async (categoryData: CreateCategoryDto) => {
    try {
      const newCategory = await categoryService.createCategory(categoryData);
      setCategories(prev => [...prev, newCategory]);
      return { success: true, data: newCategory };
    } catch (err) {
      const message = err instanceof Error ? err.message : MESSAGES.ERROR.CATEGORY_CREATE_FAILED;
      return { success: false, error: message };
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<CreateCategoryDto>) => {
    try {
      const updated = await categoryService.updateCategory(id, categoryData);
      setCategories(prev => prev.map(c => (c.id === id ? updated : c)));
      return { success: true, data: updated };
    } catch (err) {
      const message = err instanceof Error ? err.message : MESSAGES.ERROR.CATEGORY_UPDATE_FAILED;
      return { success: false, error: message };
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await categoryService.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : MESSAGES.ERROR.CATEGORY_DELETE_FAILED;
      return { success: false, error: message };
    }
  };

  const refresh = () => {
    loadCategories();
  };

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refresh,
  };
};

/**
 * Hook for a single category
 */
export const useCategory = (id: string) => {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await categoryService.getCategoryById(id);
        setCategory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : MESSAGES.ERROR.CATEGORY_LOAD_FAILED);
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
  }, [id]);

  return { category, loading, error };
};
