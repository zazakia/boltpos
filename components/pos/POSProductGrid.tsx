// POS Product Grid Component for InventoryPro
// Displays products in a grid layout for easy selection and quick add to cart

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { Product, POSSaleItem, AlternateUOM } from '@/types/inventory';
import { currencyUtils } from '@/utils/inventoryUtils';

const { width } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = (width - 48) / 2; // Account for padding and spacing

interface POSProductGridProps {
  products: Product[];
  onAddToCart: (product: Product, quantity: number, uom: string) => void;
}

interface LocalProduct extends Product {
  stockAvailable?: number;
}

export const POSProductGrid: React.FC<POSProductGridProps> = ({
  products,
  onAddToCart,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUOM, setSelectedUOM] = useState<Record<string, string>>({});
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get available UOMs for a product
  const getAvailableUOMs = (product: Product): Array<{ name: string; label: string; price: number; conversionFactor?: number }> => {
    const uoms = [];
    
    // Add base UOM
    uoms.push({
      name: product.baseUOM.name,
      label: product.baseUOM.name,
      price: product.basePrice,
    });
    
    // Add alternate UOMs
    product.alternateUOMs.forEach(uom => {
      uoms.push({
        name: uom.name,
        label: `${uom.quantity} ${uom.name}`,
        price: uom.price,
        conversionFactor: uom.conversionFactor,
      });
    });
    
    return uoms;
  };

  // Get current UOM for a product
  const getCurrentUOM = (productId: string): string => {
    return selectedUOM[productId] || products.find(p => p.id === productId)?.baseUOM.name || 'piece';
  };

  // Get current price for a product and UOM
  const getCurrentPrice = (product: Product, uom: string): number => {
    if (uom === product.baseUOM.name) {
      return product.basePrice;
    }
    
    const alternateUOM = product.alternateUOMs.find(u => u.name === uom);
    return alternateUOM ? alternateUOM.price : product.basePrice;
  };

  // Get current quantity for a product
  const getCurrentQuantity = (productId: string): number => {
    const qtyStr = quantities[productId] || '1';
    return parseInt(qtyStr) || 1;
  };

  // Handle UOM selection
  const handleUOMSelect = (productId: string, uom: string) => {
    setSelectedUOM(prev => ({
      ...prev,
      [productId]: uom,
    }));
  };

  // Handle quantity change
  const handleQuantityChange = (productId: string, qty: string) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: qty,
    }));
  };

  // Handle add to cart
  const handleAddToCart = (product: Product) => {
    const quantity = getCurrentQuantity(product.id);
    const uom = getCurrentUOM(product.id);
    
    if (quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    onAddToCart(product, quantity, uom);
    
    // Reset quantity after adding
    setQuantities(prev => ({
      ...prev,
      [product.id]: '1',
    }));
    
    Alert.alert('Success', `${product.name} added to cart`);
  };

  // Render product card
  const renderProductCard = (product: Product) => {
    const availableUOMs = getAvailableUOMs(product);
    const currentUOM = getCurrentUOM(product.id);
    const currentQuantity = getCurrentQuantity(product.id);
    const currentPrice = getCurrentPrice(product, currentUOM);
    
    return (
      <View key={product.id} style={styles.productCard}>
        {/* Product Image Placeholder */}
        <View style={styles.productImageContainer}>
          <Text style={styles.productImageText}>{product.name.charAt(0)}</Text>
        </View>
        
        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
          <Text style={styles.productDescription} numberOfLines={1}>{product.description}</Text>
          
          {/* Price Display */}
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Price:</Text>
            <Text style={styles.productPrice}>{currencyUtils.formatSimplePHP(currentPrice)}</Text>
            <Text style={styles.uomLabel}>per {currentUOM}</Text>
          </View>
          
          {/* UOM Selection */}
          <View style={styles.uomContainer}>
            <Text style={styles.uomTitle}>Unit:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.uomScroll}>
              {availableUOMs.map(uom => (
                <TouchableOpacity
                  key={uom.name}
                  style={[
                    styles.uomChip,
                    currentUOM === uom.name && styles.uomChipSelected,
                  ]}
                  onPress={() => handleUOMSelect(product.id, uom.name)}
                >
                  <Text style={[
                    styles.uomChipText,
                    currentUOM === uom.name && styles.uomChipTextSelected,
                  ]}>
                    {uom.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* Quantity Input */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Qty:</Text>
            <TextInput
              style={styles.quantityInput}
              value={quantities[product.id] || '1'}
              onChangeText={(text) => handleQuantityChange(product.id, text)}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
          
          {/* Total Price Preview */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalPrice}>
              {currencyUtils.formatSimplePHP(currentQuantity * currentPrice)}
            </Text>
          </View>
          
          {/* Add to Cart Button */}
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={() => handleAddToCart(product)}
          >
            <Text style={styles.addToCartButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Text style={styles.resultCount}>{filteredProducts.length} products</Text>
      </View>
      
      {/* Product Grid */}
      <ScrollView style={styles.gridContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {filteredProducts.map(renderProductCard)}
        </View>
        
        {filteredProducts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No products found</Text>
            <Text style={styles.emptyStateSubtext}>Try adjusting your search</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  resultCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  gridContainer: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  productCard: {
    width: PRODUCT_CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    height: 80,
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImageText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B7280',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginRight: 4,
  },
  uomLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  uomContainer: {
    marginBottom: 8,
  },
  uomTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  uomScroll: {
    maxHeight: 32,
  },
  uomChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  uomChipSelected: {
    backgroundColor: '#3B82F6',
  },
  uomChipText: {
    fontSize: 10,
    color: '#374151',
  },
  uomChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
    minWidth: 30,
  },
  quantityInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    width: 60,
    textAlign: 'center',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  totalLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  totalPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  addToCartButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});