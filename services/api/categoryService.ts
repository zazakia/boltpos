/**
 * Category Service
 * Handles all category-related API operations
 */

import { supabase } from '../../lib/supabase';
import { Category, CreateCategoryDto } from '../../types';
import { handleApiError, logError } from '../../utils';
import { MESSAGES } from '../../constants';

/**
 * Get all categories
 */
export const getCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    logError(error, { context: 'getCategories' });
    throw new Error(handleApiError(error, MESSAGES.ERROR.CATEGORY_LOAD_FAILED));
  }
};

/**
 * Get a single category by ID
 */
export const getCategoryById = async (id: string): Promise<Category | null> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logError(error, { context: 'getCategoryById', id });
    throw new Error(handleApiError(error, MESSAGES.ERROR.CATEGORY_LOAD_FAILED));
  }
};

/**
 * Create a new category
 */
export const createCategory = async (categoryData: CreateCategoryDto): Promise<Category> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logError(error, { context: 'createCategory', categoryData });
    throw new Error(handleApiError(error, MESSAGES.ERROR.CATEGORY_CREATE_FAILED));
  }
};

/**
 * Update an existing category
 */
export const updateCategory = async (id: string, categoryData: Partial<CreateCategoryDto>): Promise<Category> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logError(error, { context: 'updateCategory', id, categoryData });
    throw new Error(handleApiError(error, MESSAGES.ERROR.CATEGORY_UPDATE_FAILED));
  }
};

/**
 * Delete a category
 */
export const deleteCategory = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    logError(error, { context: 'deleteCategory', id });
    throw new Error(handleApiError(error, MESSAGES.ERROR.CATEGORY_DELETE_FAILED));
  }
};

/**
 * Check if category has products
 */
export const categoryHasProducts = async (id: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  } catch (error) {
    logError(error, { context: 'categoryHasProducts', id });
    return false;
  }
};
