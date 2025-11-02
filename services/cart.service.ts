import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/utils/errorHandler';

export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

export const fetchProductsForCart = async (productIds: string[]): Promise<ServiceResult<any[]>> => {
  try {
    console.log('cart.service: Fetching products for cart');
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, stock')
      .in('id', productIds);
      
    if (error) {
      console.error('cart.service: Supabase error fetching products for cart:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('cart.service: Products for cart fetched successfully');
    return { data, error: null };
  } catch (error) {
    console.error('cart.service: Error fetching products for cart:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const validateCartStock = async (cartItems: any[]): Promise<ServiceResult<{ isValid: boolean; errors: any[] }>> => {
  try {
    console.log('cart.service: Validating cart stock');
    
    if (cartItems.length === 0) {
      return { data: { isValid: true, errors: [] }, error: null };
    }
    
    const productIds = cartItems.map(item => item.product.id);
    const { data: currentProducts, error } = await supabase
      .from('products')
      .select('id, name, stock')
      .in('id', productIds);
      
    if (error) {
      console.error('cart.service: Supabase error validating cart stock:', error);
      return { data: null, error: getErrorMessage(error) };
    }
    
    const errors: Array<{productName: string; requestedQty: number; availableStock: number}> = [];
    
    cartItems.forEach(cartItem => {
      const product = currentProducts?.find(p => p.id === cartItem.product.id);
      if (product && cartItem.quantity > product.stock) {
        errors.push({
          productName: product.name,
          requestedQty: cartItem.quantity,
          availableStock: product.stock
        });
      }
    });
    
    const result = {
      isValid: errors.length === 0,
      errors
    };
    
    console.log('cart.service: Cart stock validation completed:', result);
    return { data: result, error: null };
  } catch (error) {
    console.error('cart.service: Error validating cart stock:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const checkProductStock = async (productId: string): Promise<ServiceResult<{ stock: number; hasStock: boolean }>> => {
  try {
    console.log('cart.service: Checking product stock:', productId);
    const { data, error } = await supabase
      .from('products')
      .select('id, stock')
      .eq('id', productId)
      .single();
      
    if (error) {
      console.error('cart.service: Supabase error checking product stock:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    const result = {
      stock: data.stock,
      hasStock: data.stock > 0
    };
    
    console.log('cart.service: Product stock check completed:', result);
    return { data: result, error: null };
  } catch (error) {
    console.error('cart.service: Error checking product stock:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};