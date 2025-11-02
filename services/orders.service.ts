import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/utils/errorHandler';

export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

export const fetchAllOrders = async (): Promise<ServiceResult<any[]>> => {
  try {
    console.log('orders.service: Fetching all orders');
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          price,
          subtotal,
          products (
            id,
            name
          )
        ),
        profiles (
          id,
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('orders.service: Supabase error fetching all orders:', error);
      return { data: null, error: getErrorMessage(error) };
    }

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
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          price,
          subtotal,
          products (
            id,
            name
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('orders.service: Supabase error fetching user orders:', error);
      return { data: null, error: getErrorMessage(error) };
    }

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
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (error) {
      console.error('orders.service: Supabase error creating order:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('orders.service: Order created successfully');
    return { data, error: null };
  } catch (error) {
    console.error('orders.service: Error creating order:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const createOrderItems = async (orderItems: any[]): Promise<ServiceResult<any>> => {
  try {
    console.log('orders.service: Creating order items');
    const { data, error } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (error) {
      console.error('orders.service: Supabase error creating order items:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('orders.service: Order items created successfully');
    return { data, error: null };
  } catch (error) {
    console.error('orders.service: Error creating order items:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const createOrderWithItems = async (orderData: any, items: any[]): Promise<ServiceResult<any>> => {
  try {
    console.log('orders.service: Creating order with items - transaction-like orchestration');
    
    // Step 1: Create the order
    const orderResult = await createOrder(orderData);
    if (orderResult.error) {
      console.error('orders.service: Failed to create order:', orderResult.error);
      return { data: null, error: orderResult.error };
    }

    if (!orderResult.data) {
      return { data: null, error: 'Failed to create order: No data returned' };
    }

    // Step 2: Prepare order items with computed subtotals
    const orderItemsWithSubtotals = items.map(item => ({
      order_id: orderResult.data.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
    }));

    // Step 3: Create order items
    const itemsResult = await createOrderItems(orderItemsWithSubtotals);
    if (itemsResult.error) {
      console.error('orders.service: Failed to create order items:', itemsResult.error);
      // Note: In a real transaction, we would rollback the order creation here
      // For now, we'll return an error but the order might still exist
      return { data: null, error: `Failed to create order items: ${itemsResult.error}` };
    }

    // Step 4: Decrement product stock
    const stockResult = await decrementProductStock(orderItemsWithSubtotals);
    if (stockResult.error) {
      console.error('orders.service: Failed to decrement product stock:', stockResult.error);
      // Note: In a real transaction, we would rollback the order and items creation here
      return { data: null, error: `Failed to decrement product stock: ${stockResult.error}` };
    }

    console.log('orders.service: Order with items created successfully');
    return { data: orderResult.data, error: null };
  } catch (error) {
    console.error('orders.service: Error creating order with items:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const decrementProductStock = async (orderItems: any[]): Promise<ServiceResult<any>> => {
  try {
    console.log('orders.service: Decrementing product stock for multiple products');
    
    // Update stock for all products in a single transaction
    const { data, error } = await supabase.rpc('decrement_multiple_product_stock', {
      order_items: JSON.stringify(orderItems)
    });
    
    if (error) {
      console.error('orders.service: Supabase error decrementing stock:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('orders.service: Product stock decremented successfully');
    return { data, error: null };
  } catch (error) {
    console.error('orders.service: Error decrementing product stock:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};

export const updateOrderStatus = async (orderId: string, status: string): Promise<ServiceResult<any>> => {
  try {
    console.log('orders.service: Updating order status:', orderId, status);
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('orders.service: Supabase error updating order status:', error);
      return { data: null, error: getErrorMessage(error) };
    }

    console.log('orders.service: Order status updated successfully');
    return { data, error: null };
  } catch (error) {
    console.error('orders.service: Error updating order status:', error);
    return { data: null, error: getErrorMessage(error) };
  }
};