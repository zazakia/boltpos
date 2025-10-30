/**
 * useOrders Hook
 * Custom hook for managing order data and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { OrderWithDetails, CreateOrderWithItemsDto, OrderFilters, OrderStatus } from '../types';
import * as orderService from '../services/api/orderService';
import { MESSAGES } from '../constants';

export const useOrders = (filters?: OrderFilters) => {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderService.getOrders(filters);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : MESSAGES.ERROR.ORDER_LOAD_FAILED);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const createOrder = async (orderData: CreateOrderWithItemsDto) => {
    try {
      const newOrder = await orderService.createOrder(orderData);
      // Reload orders to get the complete data with items
      await loadOrders();
      return { success: true, data: newOrder };
    } catch (err) {
      const message = err instanceof Error ? err.message : MESSAGES.ERROR.ORDER_CREATE_FAILED;
      return { success: false, error: message };
    }
  };

  const updateStatus = async (id: string, status: OrderStatus) => {
    try {
      const updated = await orderService.updateOrderStatus(id, status);
      setOrders(prev =>
        prev.map(o => (o.id === id ? { ...o, status: updated.status } : o))
      );
      return { success: true, data: updated };
    } catch (err) {
      const message = err instanceof Error ? err.message : MESSAGES.ERROR.ORDER_UPDATE_FAILED;
      return { success: false, error: message };
    }
  };

  const cancelOrder = async (id: string) => {
    return updateStatus(id, 'cancelled');
  };

  const completeOrder = async (id: string) => {
    return updateStatus(id, 'completed');
  };

  const refresh = () => {
    loadOrders();
  };

  return {
    orders,
    loading,
    error,
    createOrder,
    updateStatus,
    cancelOrder,
    completeOrder,
    refresh,
  };
};

/**
 * Hook for a single order
 */
export const useOrder = (id: string) => {
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await orderService.getOrderById(id);
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : MESSAGES.ERROR.ORDER_LOAD_FAILED);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  return { order, loading, error };
};

/**
 * Hook for order statistics
 */
export const useOrderStats = (userId?: string) => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await orderService.getOrderStats(userId);
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : MESSAGES.ERROR.ORDER_LOAD_FAILED);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userId]);

  return { stats, loading, error };
};
