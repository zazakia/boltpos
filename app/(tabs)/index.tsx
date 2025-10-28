import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/utils/currency';
import { Plus, Minus, ShoppingCart, CreditCard, Banknote, Smartphone } from 'lucide-react-native';

type Category = {
  id: string;
  name: string;
  color: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  category_id: string | null;
  stock: number;
};

export default function POSScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart, getCartCount, getCartTotal } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesData, productsData] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('products').select('*').eq('active', true).order('name'),
      ]);

      if (categoriesData.data) setCategories(categoriesData.data);
      if (productsData.data) setProducts(productsData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  const getSubtotal = () => {
    // This will be calculated in the cart context
    return 0;
  };

  const getTax = () => {
    // This will be calculated in the cart context
    return 0;
  };

  const getTotal = () => {
    // This will be calculated in the cart context
    return 0;
  };

  const handleCheckout = async (paymentMethod: 'cash' | 'card' | 'mobile') => {
    // Checkout will be handled in the cart screen
    router.push('/(tabs)/cart');
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
        <Text style={styles.headerTitle}>Point of Sale</Text>
        <TouchableOpacity 
          style={styles.cartButton}
          onPress={() => router.push('/(tabs)/cart')}
        >
          <ShoppingCart size={24} color="#111827" />
          {getCartCount() > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{getCartCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Cart Summary Bar */}
      {getCartCount() > 0 && (
        <View style={styles.cartSummaryBar}>
          <Text style={styles.cartSummaryText}>
            {getCartCount()} items in cart
          </Text>
          <Text style={styles.cartSummaryText}>
            Total: {formatPrice(getCartTotal())}
          </Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.productsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            <TouchableOpacity
              style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(null)}>
              <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive,
                  { borderColor: category.color },
                ]}
                onPress={() => setSelectedCategory(category.id)}>
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.categoryTextActive,
                  ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView style={styles.productsGrid}>
            <View style={styles.productsRow}>
              {filteredProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => handleAddToCart(product)}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
                  <Text style={styles.productStock}>Stock: {product.stock}</Text>
                  <TouchableOpacity 
                    style={styles.addToCartButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                  >
                    <Plus size={16} color="#FFFFFF" />
                    <Text style={styles.addToCartText}>Add</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.viewCartButton}
          onPress={() => router.push('/(tabs)/cart')}>
          <ShoppingCart size={20} color="#FFFFFF" />
          <Text style={styles.viewCartText}>View Cart</Text>
          {getCartCount() > 0 && (
            <View style={styles.cartCountBadge}>
              <Text style={styles.cartCountText}>{getCartCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={checkoutModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCheckoutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            <Text style={styles.modalAmount}>{formatPrice(getTotal())}</Text>

            <TouchableOpacity
              style={styles.paymentOption}
              onPress={() => handleCheckout('cash')}
              disabled={processingPayment}>
              <Banknote size={24} color="#10B981" />
              <Text style={styles.paymentOptionText}>Cash</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.paymentOption}
              onPress={() => handleCheckout('card')}
              disabled={processingPayment}>
              <CreditCard size={24} color="#3B82F6" />
              <Text style={styles.paymentOptionText}>Card</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.paymentOption}
              onPress={() => handleCheckout('mobile')}
              disabled={processingPayment}>
              <Smartphone size={24} color="#8B5CF6" />
              <Text style={styles.paymentOptionText}>Mobile Payment</Text>
            </TouchableOpacity>

            {processingPayment && (
              <ActivityIndicator size="large" color="#3B82F6" style={styles.modalLoader} />
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setCheckoutModal(false)}
              disabled={processingPayment}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  cartButton: {
    position: 'relative',
    padding: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cartSummaryBar: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cartSummaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  content: {
    flex: 1,
  },
  productsSection: {
    flex: 1,
    padding: 16,
  },
  categoriesScroll: {
    marginBottom: 16,
    maxHeight: 48,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  productsGrid: {
    flex: 1,
  },
  productsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  viewCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  viewCartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cartCountBadge: {
    backgroundColor: '#1D4ED8',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 24,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  paymentOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  modalLoader: {
    marginVertical: 16,
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
});