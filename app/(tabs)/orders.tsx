import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/utils/currency';

type Order = {
  id: string;
  user_id: string;
  total: number;
  tax: number;
  status: 'completed' | 'refunded' | 'cancelled';
  payment_method: 'cash' | 'card' | 'mobile';
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
};

type OrderWithItems = Order & {
  order_items: Array<{
    id: string;
    quantity: number;
    price: number;
    subtotal: number;
    products: {
      name: string;
    };
  }>;
};

export default function OrdersScreen() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingTarget, setUpdatingTarget] = useState<'completed' | 'refunded' | 'cancelled' | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    loadOrders();
    if (isAdmin) {
      // loadUsers();
    }
  }, [user, isAdmin]);

  const loadOrders = async () => {
    // For non-admin users, guard against undefined user.id
    if (!isAdmin && !user?.id) {
      return; // Exit without entering try/catch/finally
    }
    
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            subtotal,
            products (
              name
            )
          ),
          profiles (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      // For non-admin users, only show their own orders
      if (!isAdmin) {
        query = query.eq('user_id', user!.id); // We know user exists because of the guard above
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert(
        'Error Loading Orders',
        'Failed to load orders. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => loadOrders(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'refunded':
        return '#F59E0B';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return '💵';
      case 'card':
        return '💳';
      case 'mobile':
        return '📱';
      default:
        return '💰';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper function to perform the actual status update
  const performStatusUpdate = async (orderId: string, newStatus: 'completed' | 'refunded' | 'cancelled') => {
    setUpdatingTarget(newStatus);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      // Refresh orders and close modal immediately
      await loadOrders();
      setModalVisible(false);
      
      // Show non-blocking success message
      Alert.alert('Success', 'Order status updated successfully');
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert(
        'Update Failed',
        `Failed to update order status. Please try again.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [
          {
            text: 'Retry',
            onPress: () => performStatusUpdate(orderId, newStatus),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } finally {
      setUpdatingTarget(null);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'completed' | 'refunded' | 'cancelled') => {
    // Get current order to display in confirmation
    const currentOrder = orders.find(order => order.id === orderId);
    const currentStatus = currentOrder?.status || 'unknown';
    
    // Customize confirmation message based on status
    let confirmMessage = `Change order status from '${currentStatus}' to '${newStatus}'?`;
    if (newStatus === 'refunded') {
      confirmMessage += '\n\nThis will mark the order as refunded. This action should be done after processing the refund.';
    } else if (newStatus === 'cancelled') {
      confirmMessage += '\n\nThis will cancel the order. This action cannot be easily undone.';
    }

    Alert.alert(
      'Confirm Status Change',
      confirmMessage,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => performStatusUpdate(orderId, newStatus),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order History</Text>
      </View>

      <ScrollView style={styles.content}>
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No orders yet</Text>
            <Text style={styles.emptyStateSubtext}>
              {isAdmin ? 'No orders found' : 'Your completed orders will appear here'}
            </Text>
          </View>
        ) : (
          orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => {
                setSelectedOrder(order);
                setModalVisible(true);
              }}>
              <View style={styles.orderHeader}>
                <View style={styles.orderHeaderLeft}>
                  <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                  {isAdmin && order.profiles && (
                    <Text style={styles.userName}>{order.profiles.full_name}</Text>
                  )}
                  <View style={styles.orderMetadata}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(order.status) + '20' },
                      ]}>
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(order.status) },
                        ]}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Text>
                    </View>
                    <View style={styles.paymentBadge}>
                      <Text style={styles.paymentText}>
                        {getPaymentMethodIcon(order.payment_method)}{' '}
                        {order.payment_method.charAt(0).toUpperCase() +
                          order.payment_method.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.orderTotal}>{formatPrice(order.total)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Order Detail Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedOrder && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Order Details</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderId}>Order #{selectedOrder.id.substring(0, 8)}</Text>
                    <Text style={styles.orderDateDetail}>{formatDate(selectedOrder.created_at)}</Text>
                    {isAdmin && selectedOrder.profiles && (
                      <Text style={styles.userInfo}>
                        User: {selectedOrder.profiles.full_name} ({selectedOrder.profiles.email})
                      </Text>
                    )}
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Status:</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(selectedOrder.status) + '20' },
                        ]}>
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(selectedOrder.status) },
                          ]}>
                          {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Payment:</Text>
                      <Text style={styles.paymentValue}>
                        {getPaymentMethodIcon(selectedOrder.payment_method)}{' '}
                        {selectedOrder.payment_method.charAt(0).toUpperCase() +
                          selectedOrder.payment_method.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.itemsSection}>
                    <Text style={styles.sectionTitle}>Items</Text>
                    {selectedOrder.order_items.map((item) => (
                      <View key={item.id} style={styles.orderItem}>
                        <Text style={styles.orderItemName}>
                          {item.quantity}x {item.products.name}
                        </Text>
                        <Text style={styles.orderItemPrice}>{formatPrice(item.subtotal)}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.summarySection}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Subtotal</Text>
                      <Text style={styles.summaryValue}>
                        {formatPrice(selectedOrder.total - selectedOrder.tax)}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Tax</Text>
                      <Text style={styles.summaryValue}>{formatPrice(selectedOrder.tax)}</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Total</Text>
                      <Text style={styles.totalValue}>{formatPrice(selectedOrder.total)}</Text>
                    </View>
                  </View>

                  {/* Admin Actions */}
                  {isAdmin && (
                    <View style={styles.actionsSection}>
                      <Text style={styles.sectionTitle}>Admin Actions</Text>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            selectedOrder.status === 'completed' && styles.actionButtonActive,
                            selectedOrder.status === 'completed' && styles.actionButtonDisabled,
                            updatingTarget && styles.actionButtonDisabled,
                          ]}
                          onPress={() => updateOrderStatus(selectedOrder.id, 'completed')}
                          disabled={selectedOrder.status === 'completed' || updatingTarget !== null}>
                          <Text
                            style={[
                              styles.actionButtonText,
                              selectedOrder.status === 'completed' && styles.actionButtonTextActive,
                              selectedOrder.status === 'completed' && styles.actionButtonTextDisabled,
                              updatingTarget && styles.actionButtonTextDisabled,
                            ]}>
                            {updatingTarget === 'completed' ? 'Updating...' : 'Mark Completed'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            selectedOrder.status === 'refunded' && styles.actionButtonActive,
                            selectedOrder.status === 'refunded' && styles.actionButtonDisabled,
                            updatingTarget && styles.actionButtonDisabled,
                          ]}
                          onPress={() => updateOrderStatus(selectedOrder.id, 'refunded')}
                          disabled={selectedOrder.status === 'refunded' || updatingTarget !== null}>
                          <Text
                            style={[
                              styles.actionButtonText,
                              selectedOrder.status === 'refunded' && styles.actionButtonTextActive,
                              selectedOrder.status === 'refunded' && styles.actionButtonTextDisabled,
                              updatingTarget && styles.actionButtonTextDisabled,
                            ]}>
                            {updatingTarget === 'refunded' ? 'Updating...' : 'Mark Refunded'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            selectedOrder.status === 'cancelled' && styles.actionButtonActive,
                            selectedOrder.status === 'cancelled' && styles.actionButtonDisabled,
                            updatingTarget && styles.actionButtonDisabled,
                          ]}
                          onPress={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                          disabled={selectedOrder.status === 'cancelled' || updatingTarget !== null}>
                          <Text
                            style={[
                              styles.actionButtonText,
                              selectedOrder.status === 'cancelled' && styles.actionButtonTextActive,
                              selectedOrder.status === 'cancelled' && styles.actionButtonTextDisabled,
                              updatingTarget && styles.actionButtonTextDisabled,
                            ]}>
                            {updatingTarget === 'cancelled' ? 'Updating...' : 'Mark Cancelled'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  userName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  orderMetadata: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  orderTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
  },
  modalBody: {
    padding: 16,
  },
  orderInfo: {
    marginBottom: 24,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  orderDateDetail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  userInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  paymentValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  orderItemName: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  actionsSection: {
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#3B82F6',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  actionButtonTextActive: {
    color: '#FFFFFF',
  },
  actionButtonDisabled: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  actionButtonTextDisabled: {
    color: '#9CA3AF',
  },
});