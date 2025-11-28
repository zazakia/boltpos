import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/utils/errorHandler';
import { ServiceResult } from './types';
import { getApiUrl } from '@/utils/apiConfig';

const API_URL = getApiUrl();

export const fetchCategories = async (): Promise<ServiceResult<any[]>> => {
  try {
    console.log('products.service: Fetching categories');
    const response = await fetch(`${API_URL}/categories`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch categories');
    }

    const { data } = await response.json();
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
    const response = await fetch(`${API_URL}/products`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch products');
    }

    const { data } = await response.json();
    console.log('products.service: Products fetched successfully');
    return { data, error: null };
  } catch (error) {
    console.error('products.service: Error fetching products:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const fetchActiveProducts = async (): Promise<ServiceResult<any[]>> => {
  try {
    console.log('products.service: Fetching active products');
    const response = await fetch(`${API_URL}/products?active=true`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch active products');
    }

    const { data } = await response.json();
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
    const response = await fetch(`${API_URL}/products/batch-fetch`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: productIds }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch products by IDs');
    }

    const { data } = await response.json();
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
    const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
    }

    const { data } = await response.json();
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
    const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
    }

    const { data } = await response.json();
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
    const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
    }

    const { data } = await response.json();
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
    const response = await fetch(`${API_URL}/products/batch-update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: productIds, action: 'activate' }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to bulk activate products');
    }

    const { data } = await response.json();
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
    const response = await fetch(`${API_URL}/products/batch-update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: productIds, action: 'deactivate' }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to bulk deactivate products');
    }

    const { data } = await response.json();
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
    const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create category');
    }

    const { data } = await response.json();
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
    const response = await fetch(`${API_URL}/categories/${categoryId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update category');
    }

    const { data } = await response.json();
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
    const response = await fetch(`${API_URL}/categories/${categoryId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete category');
    }

    const { data } = await response.json();
    console.log('products.service: Category deleted successfully');
    return { data, error: null };
  } catch (error) {
    console.error('products.service: Error deleting category:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};