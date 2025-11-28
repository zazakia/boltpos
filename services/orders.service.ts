import { getErrorMessage } from '@/utils/errorHandler';
import { ServiceResult } from './types';
import { getApiUrl } from '@/utils/apiConfig';

const API_URL = getApiUrl();

export const fetchAllOrders = async (): Promise<ServiceResult<any[]>> => {
  try {
    console.log('orders.service: Fetching all orders');
    const response = await fetch(`${API_URL}/orders`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch orders');
    }

    const { data } = await response.json();
    console.log('orders.service: All orders fetched successfully');
    return { data, error: null };
  } catch (error) {
    console.error('orders.service: Error fetching all orders:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const fetchUserOrders = async (userId: string): Promise<ServiceResult<any[]>> => {
  try {
    console.log('orders.service: Fetching orders for user:', userId);
    const response = await fetch(`${API_URL}/orders/user/${userId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user orders');
    }

    const { data } = await response.json();
    console.log('orders.service: User orders fetched successfully');
    return { data, error: null };
  } catch (error) {
    console.error('orders.service: Error fetching user orders:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const createOrder = async (orderData: any): Promise<ServiceResult<any>> => {
  try {
    console.log('orders.service: Creating order');
    const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
    }

    const { data } = await response.json();
    console.log('orders.service: Order created successfully');
    return { data, error: null };
  } catch (error) {
    console.error('orders.service: Error creating order:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

// Deprecated in favor of server-side transaction in createOrderWithItems
export const createOrderItems = async (orderItems: any[]): Promise<ServiceResult<any>> => {
    console.warn('orders.service: createOrderItems is deprecated. Use createOrderWithItems for transactional integrity.');
    return { data: null, error: 'Deprecated' };
};

export const createOrderWithItems = async (orderData: any, items: any[]): Promise<ServiceResult<any>> => {
  try {
    console.log('orders.service: Creating order with items - transactional');
    
    const payload = {
        ...orderData,
        items: items
    };

    const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order with items');
    }

    const { data } = await response.json();
    console.log('orders.service: Order with items created successfully');
    return { data, error: null };
  } catch (error) {
    console.error('orders.service: Error creating order with items:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

// Deprecated as this is now handled server-side
export const decrementProductStock = async (orderItems: any[]): Promise<ServiceResult<any>> => {
    console.warn('orders.service: decrementProductStock is deprecated. Stock updates are handled server-side.');
    return { data: null, error: 'Deprecated' };
};

export const updateOrderStatus = async (orderId: string, status: string): Promise<ServiceResult<any>> => {
  try {
    console.log('orders.service: Updating order status:', orderId, status);
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order status');
    }

    const { data } = await response.json();
    console.log('orders.service: Order status updated successfully');
    return { data, error: null };
  } catch (error) {
    console.error('orders.service: Error updating order status:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};