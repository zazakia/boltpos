/**
 * Order Service
 * Handles all order-related API operations
 */

import { supabase } from '../../lib/supabase';
import {
  Order,
  OrderWithItems,
  OrderWithDetails,
  CreateOrderDto,
  CreateOrderWithItemsDto,
  OrderFilters,
  OrderStatus,
} from '../../types';
import { handleApiError, logError } from '../../utils';
import { MESSAGES } from '../../constants';
import { decreaseProductStock } from './productService';

/**
 * Get all orders with optional filters
 */
export const getOrders = async (filters?: OrderFilters): Promise<OrderWithDetails[]> => {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles(*),
        order_items(*, products(*))
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as OrderWithDetails[];
  } catch (error) {
    logError(error, { context: 'getOrders', filters });
    throw new Error(handleApiError(error, MESSAGES.ERROR.ORDER_LOAD_FAILED));
  }
};

/**
 * Get a single order by ID
 */
export const getOrderById = async (id: string): Promise<OrderWithDetails | null> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles(*),
        order_items(*, products(*))
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as OrderWithDetails;
  } catch (error) {
    logError(error, { context: 'getOrderById', id });
    throw new Error(handleApiError(error, MESSAGES.ERROR.ORDER_LOAD_FAILED));
  }
};

/**
 * Get orders for a specific user
 */
export const getUserOrders = async (userId: string): Promise<OrderWithDetails[]> => {
  return getOrders({ userId });
};

/**
 * Create a new order with items
 */
export const createOrder = async (orderData: CreateOrderWithItemsDto): Promise<Order> => {
  try {
    // Start a transaction-like operation
    // 1. Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData.order)
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Create order items
    const orderItems = orderData.items.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Rollback: delete the order if items fail
      await supabase.from('orders').delete().eq('id', order.id);
      throw itemsError;
    }

    // 3. Update product stock quantities
    for (const item of orderData.items) {
      await decreaseProductStock(item.product_id, item.quantity);
    }

    return order;
  } catch (error) {
    logError(error, { context: 'createOrder', orderData });
    throw new Error(handleApiError(error, MESSAGES.ERROR.ORDER_CREATE_FAILED));
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<Order> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logError(error, { context: 'updateOrderStatus', id, status });
    throw new Error(handleApiError(error, MESSAGES.ERROR.ORDER_UPDATE_FAILED));
  }
};

/**
 * Cancel an order
 */
export const cancelOrder = async (id: string): Promise<Order> => {
  return updateOrderStatus(id, 'cancelled');
};

/**
 * Complete an order
 */
export const completeOrder = async (id: string): Promise<Order> => {
  return updateOrderStatus(id, 'completed');
};

/**
 * Get order statistics
 */
export const getOrderStats = async (userId?: string): Promise<{
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
}> => {
  try {
    let query = supabase.from('orders').select('status, total_amount');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const orders = data || [];
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      totalRevenue: orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.total_amount, 0),
    };

    return stats;
  } catch (error) {
    logError(error, { context: 'getOrderStats', userId });
    throw new Error(handleApiError(error, MESSAGES.ERROR.ORDER_LOAD_FAILED));
  }
};

/**
 * Get recent orders (last 10)
 */
export const getRecentOrders = async (limit: number = 10): Promise<OrderWithDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles(*),
        order_items(*, products(*))
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as OrderWithDetails[];
  } catch (error) {
    logError(error, { context: 'getRecentOrders', limit });
    throw new Error(handleApiError(error, MESSAGES.ERROR.ORDER_LOAD_FAILED));
  }
};
