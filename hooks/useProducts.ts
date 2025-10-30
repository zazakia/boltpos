/**
 * useProducts Hook
 * Custom hook for managing product data and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { Product, CreateProductDto, ProductFilters } from '../types';
import * as productService from '../services/api/productService';
import { MESSAGES } from '../constants';

export const useProducts = (filters?: ProductFilters) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getProducts(filters);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : MESSAGES.ERROR.PRODUCT_LOAD_FAILED);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const createProduct = async (productData: CreateProductDto) => {
    try {
      const newProduct = await productService.createProduct(productData);
      setProducts(prev => [...prev, newProduct]);
      return { success: true, data: newProduct };
    } catch (err) {
      const message = err instanceof Error ? err.message : MESSAGES.ERROR.PRODUCT_CREATE_FAILED;
      return { success: false, error: message };
    }
  };

  const updateProduct = async (id: string, productData: Partial<CreateProductDto>) => {
    try {
      const updated = await productService.updateProduct(id, productData);
      setProducts(prev => prev.map(p => (p.id === id ? updated : p)));
      return { success: true, data: updated };
    } catch (err) {
      const message = err instanceof Error ? err.message : MESSAGES.ERROR.PRODUCT_UPDATE_FAILED;
      return { success: false, error: message };
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await productService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : MESSAGES.ERROR.PRODUCT_DELETE_FAILED;
      return { success: false, error: message };
    }
  };

  const refresh = () => {
    loadProducts();
  };

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    refresh,
  };
};

/**
 * Hook for a single product
 */
export const useProduct = (id: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await productService.getProductById(id);
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : MESSAGES.ERROR.PRODUCT_LOAD_FAILED);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  return { product, loading, error };
};
