import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/utils/errorHandler';
import { ServiceResult } from './types';
import * as FileSystem from 'expo-file-system';

export const fetchCategories = async (): Promise<ServiceResult<any[]>> => {
  try {
    console.log('products.service: Fetching categories');
    const { data, error } = await supabase.from('categories').select('*').order('name');

    if (error) {
      console.error('products.service: Supabase error fetching categories:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('products.service: Categories fetched successfully');
    return { data, error: null };
  } catch (error) {
    console.error('products.service: Error fetching categories:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const fetchProducts = async (): Promise<ServiceResult<any[]>> => {
  try {
    console.log('products.service: Fetching products');
    const { data, error } = await supabase
      .from('products')
      .select('id,name,price,stock,active,category_id,image_url,categories!category_id(*)')
      .order('name');

    if (error) {
      console.error('products.service: Supabase error fetching products:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    // Normalize categories to be a single object or null consistently
    const normalizedData = data?.map(product => ({
      ...product,
      categories: product.categories && Array.isArray(product.categories)
        ? product.categories[0]
        : product.categories
    })) || [];

    console.log('products.service: Products fetched successfully');
    return { data: normalizedData, error: null };
  } catch (error) {
    console.error('products.service: Error fetching products:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const fetchActiveProducts = async (): Promise<ServiceResult<any[]>> => {
  try {
    console.log('products.service: Fetching active products');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) {
      console.error('products.service: Supabase error fetching active products:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('products.service: Active products fetched successfully');
    return { data, error: null };
  } catch (error) {
    console.error('products.service: Error fetching active products:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const fetchProductsByIds = async (productIds: string[]): Promise<ServiceResult<any[]>> => {
  try {
    console.log('products.service: Fetching products by IDs');
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, stock')
      .in('id', productIds);

    if (error) {
      console.error('products.service: Supabase error fetching products by IDs:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('products.service: Products by IDs fetched successfully');
    return { data, error: null };
  } catch (error) {
    console.error('products.service: Error fetching products by IDs:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const createProduct = async (productData: any): Promise<ServiceResult<any>> => {
  try {
    console.log('products.service: Creating product');
    const { data, error } = await supabase.from('products').insert(productData).select().single();

    if (error) {
      console.error('products.service: Supabase error creating product:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('products.service: Product created successfully');
    return { data, error: null };
  } catch (error) {
    console.error('products.service: Error creating product:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const updateProduct = async (productId: string, productData: any): Promise<ServiceResult<any>> => {
  try {
    console.log('products.service: Updating product:', productId);
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('products.service: Supabase error updating product:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('products.service: Product updated successfully');
    return { data, error: null };
  } catch (error) {
    console.error('products.service: Error updating product:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const deleteProduct = async (productId: string): Promise<ServiceResult<any>> => {
  try {
    console.log('products.service: Deleting product:', productId);
    const { data, error } = await supabase
      .from('products')
      .update({ active: false })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('products.service: Supabase error deleting product:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('products.service: Product deleted successfully');
    return { data, error: null };
  } catch (error) {
    console.error('products.service: Error deleting product:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const bulkActivateProducts = async (productIds: string[]): Promise<ServiceResult<any>> => {
  try {
    console.log('products.service: Bulk activating products');
    const { data, error } = await supabase
      .from('products')
      .update({ active: true })
      .in('id', productIds);

    if (error) {
      console.error('products.service: Supabase error bulk activating products:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('products.service: Products bulk activated successfully');
    return { data, error: null };
  } catch (error) {
    console.error('products.service: Error bulk activating products:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const bulkDeactivateProducts = async (productIds: string[]): Promise<ServiceResult<any>> => {
  try {
    console.log('products.service: Bulk deactivating products');
    const { data, error } = await supabase
      .from('products')
      .update({ active: false })
      .in('id', productIds);

    if (error) {
      console.error('products.service: Supabase error bulk deactivating products:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('products.service: Products bulk deactivated successfully');
    return { data, error: null };
  } catch (error) {
    console.error('products.service: Error bulk deactivating products:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const uploadProductImage = async (imageUri: string, productId: string): Promise<ServiceResult<string>> => {
  try {
    console.log('products.service: Uploading product image for:', productId);
    
    // Create a unique file name
    const fileExt = imageUri.split('.').pop() || 'jpg';
    const fileName = `${productId}-${Date.now()}.${fileExt}`;
    
    // Convert URI to blob using fetch (more compatible across platforms)
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }
    const blob = await response.blob();
    
    // Determine MIME type from file extension
    const mimeType = fileExt === 'png' ? 'image/png' :
                   fileExt === 'jpg' || fileExt === 'jpeg' ? 'image/jpeg' :
                   'image/webp';
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, blob, {
        contentType: mimeType,
        upsert: true,
      });
    
    if (error) {
      console.error('products.service: Supabase storage error:', error);
      return { data: null, error: getErrorMessage(error) };
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);
    
    console.log('products.service: Product image uploaded successfully');
    return { data: publicUrl, error: null };
  } catch (error) {
    console.error('products.service: Error uploading product image:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const createCategory = async (categoryData: any): Promise<ServiceResult<any>> => {
  try {
    console.log('products.service: Creating category');
    const { data, error } = await supabase.from('categories').insert(categoryData).select().single();

    if (error) {
      console.error('products.service: Supabase error creating category:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('products.service: Category created successfully');
    return { data, error: null };
  } catch (error) {
    console.error('products.service: Error creating category:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const updateCategory = async (categoryId: string, categoryData: any): Promise<ServiceResult<any>> => {
  try {
    console.log('products.service: Updating category:', categoryId);
    const { data, error } = await supabase
      .from('categories')
      .update(categoryData)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      console.error('products.service: Supabase error updating category:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('products.service: Category updated successfully');
    return { data, error: null };
  } catch (error) {
    console.error('products.service: Error updating category:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const deleteCategory = async (categoryId: string): Promise<ServiceResult<any>> => {
  try {
    console.log('products.service: Deleting category:', categoryId);
    const { data, error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('products.service: Supabase error deleting category:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('products.service: Category deleted successfully');
    return { data, error: null };
  } catch (error) {
    console.error('products.service: Error deleting category:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};