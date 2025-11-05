import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/utils/currency';
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  Smartphone,
  Plus,
  Minus,
  Trash2,
} from 'lucide-react-native';

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
  } = useCart();
  const [processingPayment, setProcessingPayment] = useState(false);

  const getSubtotal = () => {
    return cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
  };

  const getTax = () => {
    return getSubtotal() * 0.1;
  };

  const getTotal = () => {
    return getSubtotal() + getTax();
  };

  const updateInventory = async (orderItems: any[]) => {
    try {
      // Group items by product to handle multiple cart items of same product
      const productQuantities: { [key: string]: number } = {};

      orderItems.forEach((item) => {
        if (productQuantities[item.product_id]) {
          productQuantities[item.product_id] += item.quantity;
        } else {
          productQuantities[item.product_id] = item.quantity;
        }
      });

      // Update stock for each product
      const updatePromises = Object.entries(productQuantities).map(
        ([productId, quantity]) => {
          return supabase.rpc('decrement_stock', {
            p_product_id: productId,
            p_quantity: quantity,
          });
        },
      );

      const results = await Promise.all(updatePromises);

      // Check for any errors in stock updates
      const errors = results.filter((result) => result.error);
      if (errors.length > 0) {
        console.warn('Some inventory updates failed:', errors);
        // Don't fail the order, but log the issue
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      // Don't fail the order, but log the issue
    }
  };

  const handleCheckout = async (paymentMethod: 'cash' | 'card' | 'mobile') => {
    if (!user || cart.length === 0) return;

    setProcessingPayment(true);

    try {
      // Check stock availability first
      const stockChecks = await Promise.all(
        cart.map(async (item) => {
          const { data: product } = await supabase
            .from('products')
            .select('stock, name')
            .eq('id', item.product.id)
            .single();

          return {
            product: product,
            requested: item.quantity,
            productName: item.product.name,
          };
        }),
      );

      // Check if any items have insufficient stock
      const insufficientStock = stockChecks.filter(
        (check) => !check.product || check.product.stock < check.requested,
      );

      if (insufficientStock.length > 0) {
        const itemNames = insufficientStock
          .map((item) => item.productName)
          .join(', ');
        Alert.alert(
          'Insufficient Stock',
          `The following items don't have enough stock: ${itemNames}`,
          [{ text: 'OK' }],
        );
        setProcessingPayment(false);
        return;
      }

      // Start transaction
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total: getTotal(),
          tax: getTax(),
          status: 'completed',
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.product.price * item.quantity,
        uom: item.product.base_uom || 'piece',
        conversion_to_base: 1.0,
        base_quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update inventory after successful order creation
      await updateInventory(orderItems);

      // Clear cart
      clearCart();

      Alert.alert('Success', 'Order placed successfully! Inventory updated.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (error: any) {
      console.error('Error processing order:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to process order. Please try again.',
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart</Text>
        <View style={styles.cartSummaryHeader}>
          <Text style={styles.cartSummaryText}>{getCartCount()} items</Text>
          <Text style={styles.cartSummaryText}>
            Total: {formatPrice(getCartTotal())}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {cart.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Your cart is empty</Text>
            <TouchableOpacity
              style={styles.continueShoppingButton}
              onPress={() => router.replace('/(tabs)')}
            >
              <Text style={styles.continueShoppingText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.cartItems}>
              {cart.map((item) => (
                <View key={item.product.id} style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.product.name}</Text>
                    <Text style={styles.cartItemPrice}>
                      {formatPrice(item.product.price)}
                    </Text>
                  </View>
                  <View style={styles.cartItemActions}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() =>
                        updateQuantity(item.product.id, item.quantity - 1)
                      }
                    >
                      <Minus size={16} color="#6B7280" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() =>
                        updateQuantity(item.product.id, item.quantity + 1)
                      }
                    >
                      <Plus size={16} color="#6B7280" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.cartSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>
                  {formatPrice(getSubtotal())}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax (10%)</Text>
                <Text style={styles.summaryValue}>{formatPrice(getTax())}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatPrice(getTotal())}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {cart.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => {
              // Show payment options modal or navigate to payment screen
              Alert.alert(
                'Select Payment Method',
                'Choose a payment method to complete your order',
                [
                  {
                    text: 'Cash',
                    onPress: () => handleCheckout('cash'),
                  },
                  {
                    text: 'Card',
                    onPress: () => handleCheckout('card'),
                  },
                  {
                    text: 'Mobile Payment',
                    onPress: () => handleCheckout('mobile'),
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                ],
              );
            }}
          >
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      )}

      {processingPayment && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Processing payment...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  cartSummaryHeader: {
    alignItems: 'flex-end',
  },
  cartSummaryText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 24,
  },
  continueShoppingButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueShoppingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cartItems: {
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#6B7280',
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  cartSummary: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  checkoutButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
});
