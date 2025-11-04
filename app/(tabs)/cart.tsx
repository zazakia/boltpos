import { useState, useEffect, useCallback } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import {
  fetchProductsForCart,
  validateCartStock,
  checkProductStock
} from '@/services/cart.service';
import {
  createOrderWithItems,
  decrementProductStock
} from '@/services/orders.service';
import { formatPrice } from '@/utils/currency';
import { ArrowLeft, CreditCard, Banknote, Smartphone, Plus, Minus, Trash2, AlertTriangle } from 'lucide-react-native';

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount, checkCartStockAvailability } = useCart();
  const [processingPayment, setProcessingPayment] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  useEffect(() => {
    loadProducts();
  }, []);

  // Refresh products when cart contents change
  useEffect(() => {
    loadProducts();
  }, [cart]);

  // Refresh products when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  const loadProducts = async () => {
    if (cart.length === 0) return;
    
    setLoadingProducts(true);
    try {
      const productIds = cart.map(item => item.product.id);
      const result = await fetchProductsForCart(productIds);
      
      if (result.data) {
        setProducts(result.data);
      }
      
      if (result.error) {
        console.error('Error loading products:', result.error);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const getTax = () => {
    return getSubtotal() * 0.1;
  };

  const getTotal = () => {
    return getSubtotal() + getTax();
  };

  const validateCartStockLocal = async (): Promise<{ isValid: boolean; errors: any[] }> => {
    if (cart.length === 0) return { isValid: true, errors: [] };
    
    try {
      // Map cart to normalized shape for the service
      const normalizedCartItems = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      }));
      
      const validationResult = await validateCartStock(normalizedCartItems);
      
      if (validationResult.error) {
        console.error('Error validating stock:', validationResult.error);
        return { isValid: false, errors: [] };
      }
      
      return validationResult.data || { isValid: false, errors: [] };
    } catch (error) {
      console.error('Error validating stock:', error);
      return { isValid: false, errors: [] };
    }
  };

  const updateProductStock = async (orderItems: any[]) => {
    try {
      const result = await decrementProductStock(orderItems);
      
      if (result.error) {
        console.error('Error updating stock for multiple products', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating product stock:', error);
      throw error;
    }
  };

  const handleCheckout = async (paymentMethod: 'cash' | 'card' | 'mobile') => {
    if (!user || cart.length === 0) return;

    setProcessingPayment(true);

    try {
      // Validate stock availability before checkout
      const stockValidation = await validateCartStockLocal();
      
      if (!stockValidation.isValid) {
        const errorMessage = stockValidation.errors
          .map(error => `${error.productName}: Requested ${error.requestedQty}, Available ${error.availableStock}`)
          .join('\n');
        
        Alert.alert(
          'Insufficient Stock',
          `Some items in your cart have insufficient stock:\n\n${errorMessage}\n\nPlease update your cart to continue.`,
          [
            { text: 'OK', style: 'default' }
          ]
        );
        setProcessingPayment(false);
        return;
      }

      const orderData = {
        user_id: user.id,
        total: getTotal(),
        tax: getTax(),
        status: 'completed',
        payment_method: paymentMethod,
      };

      const orderItems = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const result = await createOrderWithItems(orderData, orderItems);
      
      if (result.error) {
        console.error('Error processing order:', result.error);
        Alert.alert('Error', result.error);
        setProcessingPayment(false);
        return;
      }

      // Clear cart only on successful result
      clearCart();
      
      Alert.alert('Success', 'Order placed successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error) {
      console.error('Error processing order:', error);
      Alert.alert('Error', 'Failed to process order. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleQuantityUpdate = async (productId: string, newQuantity: number) => {
    // For increments, fetch the latest stock to ensure accuracy
    if (newQuantity > 0) {
      try {
        const result = await checkProductStock(productId);
        
        if (result.error) {
          console.error('Error fetching latest stock:', result.error);
          Alert.alert('Error', 'Failed to check stock availability. Please try again.');
          return;
        }
        
        if (result.data && newQuantity > result.data.stock) {
          Alert.alert(
            'Insufficient Stock',
            `Only ${result.data.stock} items available.`
          );
          return;
        }
      } catch (error) {
        console.error('Error checking stock:', error);
        Alert.alert('Error', 'Failed to check stock availability. Please try again.');
        return;
      }
    }
    
    const success = updateQuantity(productId, newQuantity);
    if (!success) {
      Alert.alert('Error', 'Failed to update quantity. Please try again.');
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
          <Text style={styles.cartSummaryText}>
            {getCartCount()} items
          </Text>
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
            {/* Stock validation warning banner */}
            {products.length > 0 && (
              <View style={styles.stockValidationBanner}>
                {(() => {
                  const validation = checkCartStockAvailability(products);
                  if (!validation.isValid) {
                    return (
                      <View style={styles.stockWarningContent}>
                        <AlertTriangle size={16} color="#F59E0B" />
                        <Text style={styles.stockWarningText}>
                          {validation.insufficientItems.length} item(s) have insufficient stock
                        </Text>
                      </View>
                    );
                  }
                  return null;
                })()}
              </View>
            )}
            
            <View style={styles.cartItems}>
              {cart.map((item) => {
                const product = products.find(p => p.id === item.product.id);
                const currentStock = product ? product.stock : item.product.stock;
                const hasInsufficientStock = item.quantity > currentStock;
                const isMaxQuantity = item.quantity >= currentStock;
                
                return (
                  <View key={item.product.id} style={[
                    styles.cartItem,
                    hasInsufficientStock && styles.cartItemWarning
                  ]}>
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName}>{item.product.name}</Text>
                      <Text style={styles.cartItemPrice}>
                        {formatPrice(item.product.price)}
                      </Text>
                      <Text style={[
                        styles.stockInfoText,
                        hasInsufficientStock && styles.stockWarningText
                      ]}>
                        {currentStock} available
                        {hasInsufficientStock && ` (requested: ${item.quantity})`}
                      </Text>
                    </View>
                    <View style={styles.cartItemActions}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => handleQuantityUpdate(item.product.id, item.quantity - 1)}>
                        <Minus size={16} color="#6B7280" />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={[
                          styles.quantityButton,
                          isMaxQuantity && styles.quantityButtonDisabled
                        ]}
                        onPress={() => handleQuantityUpdate(item.product.id, item.quantity + 1)}
                        disabled={isMaxQuantity}>
                        <Plus size={16} color={isMaxQuantity ? "#9CA3AF" : "#6B7280"} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeFromCart(item.product.id)}>
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.cartSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatPrice(getSubtotal())}</Text>
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
                    onPress: () => handleCheckout('cash')
                  },
                  {
                    text: 'Card',
                    onPress: () => handleCheckout('card')
                  },
                  {
                    text: 'Mobile Payment',
                    onPress: () => handleCheckout('mobile')
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel'
                  }
                ]
              );
            }}>
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
  stockValidationBanner: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  stockWarningContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockWarningText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '600',
  },
  stockInfoText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  cartItemWarning: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  quantityButtonDisabled: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
});