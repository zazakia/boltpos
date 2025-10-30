/**
 * Product Service
 * Handles all product-related API operations
 */

import { supabase } from '../../lib/supabase';
import {
  Product,
  ProductWithCategory,
  CreateProductDto,
  UpdateProductDto,
  ProductFilters,
} from '../../types';
import { handleApiError, logError } from '../../utils';
import { MESSAGES } from '../../constants';

/**
 * Get all products with optional filters
 */
export const getProducts = async (filters?: ProductFilters): Promise<Product[]> => {
  try {
    let query = supabase
      .from('products')
      .select('*, categories(*)')
      .order('name');

    // Apply filters
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters?.searchTerm) {
      query = query.ilike('name', `%${filters.searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    logError(error, { context: 'getProducts', filters });
    throw new Error(handleApiError(error, MESSAGES.ERROR.PRODUCT_LOAD_FAILED));
  }
};

/**
 * Get a single product by ID
 */
export const getProductById = async (id: string): Promise<ProductWithCategory | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as ProductWithCategory;
  } catch (error) {
    logError(error, { context: 'getProductById', id });
    throw new Error(handleApiError(error, MESSAGES.ERROR.PRODUCT_LOAD_FAILED));
  }
};

/**
 * Create a new product
 */
export const createProduct = async (productData: CreateProductDto): Promise<Product> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logError(error, { context: 'createProduct', productData });
    throw new Error(handleApiError(error, MESSAGES.ERROR.PRODUCT_CREATE_FAILED));
  }
};

/**
 * Update an existing product
 */
export const updateProduct = async (id: string, productData: Partial<CreateProductDto>): Promise<Product> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logError(error, { context: 'updateProduct', id, productData });
    throw new Error(handleApiError(error, MESSAGES.ERROR.PRODUCT_UPDATE_FAILED));
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    logError(error, { context: 'deleteProduct', id });
    throw new Error(handleApiError(error, MESSAGES.ERROR.PRODUCT_DELETE_FAILED));
  }
};

/**
 * Update product stock quantity
 */
export const updateProductStock = async (id: string, quantity: number): Promise<Product> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ stock_quantity: quantity })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logError(error, { context: 'updateProductStock', id, quantity });
    throw new Error(handleApiError(error, MESSAGES.ERROR.PRODUCT_UPDATE_FAILED));
  }
};

/**
 * Decrease product stock (for orders)
 */
export const decreaseProductStock = async (id: string, quantity: number): Promise<void> => {
  try {
    // Get current stock
    const product = await getProductById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    const newStock = product.stock_quantity - quantity;
    if (newStock < 0) {
      throw new Error(MESSAGES.ERROR.OUT_OF_STOCK);
    }

    await updateProductStock(id, newStock);
  } catch (error) {
    logError(error, { context: 'decreaseProductStock', id, quantity });
    throw error;
  }
};

/**
 * Get products by category
 */
export const getProductsByCategory = async (categoryId: string): Promise<Product[]> => {
  return getProducts({ categoryId });
};

/**
 * Search products by name
 */
export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
  return getProducts({ searchTerm });
};

/**
 * Get active products only
 */
export const getActiveProducts = async (): Promise<Product[]> => {
  return getProducts({ isActive: true });
};
