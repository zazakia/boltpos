// POS Shopping Cart Component for InventoryPro
// Manages shopping cart items, quantities, UOM selection, and total calculations

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Product, POSSaleItem, UnitOfMeasure } from '@/types/inventory';
import { currencyUtils } from '@/utils/inventoryUtils';

interface CartItem extends POSSaleItem {
  product: Product;
  totalPrice: number;
}

interface POSShoppingCartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number, uom: string) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export const POSShoppingCart: React.FC<POSShoppingCartProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}) => {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [editUOM, setEditUOM] = useState<string>('');

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.12; // 12% Philippine VAT
  const total = subtotal + tax;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Get available UOMs for a product
  const getAvailableUOMs = (product: Product): Array<{ name: string; label: string; price: number; conversionFactor?: number }> => {
    const uoms = [];
    
    // Add base UOM
    uoms.push({
      name: product.baseUOM.name,
      label: product.baseUOM.name,
      price: product.basePrice,
      conversionFactor: 1,
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

  // Start editing an item
  const startEditItem = (item: CartItem) => {
    setEditingItem(item.product.id);
    setEditQuantity(item.quantity.toString());
    setEditUOM(item.uom);
  };

  // Save item edits
  const saveItemEdit = () => {
    if (!editingItem) return;

    const newQuantity = parseInt(editQuantity) || 0;
    if (newQuantity <= 0) {
      Alert.alert('Error', 'Quantity must be greater than 0');
      return;
    }

    onUpdateQuantity(editingItem, newQuantity, editUOM);
    setEditingItem(null);
    setEditQuantity('');
    setEditUOM('');
  };

  // Cancel item edit
  const cancelEditItem = () => {
    setEditingItem(null);
    setEditQuantity('');
    setEditUOM('');
  };

  // Handle remove item
  const handleRemoveItem = (productId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from the cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => onRemoveItem(productId),
        },
      ]
    );
  };

  // Handle clear cart
  const handleClearCart = () => {
    if (cartItems.length === 0) return;

    Alert.alert(
      'Clear Cart',
      'Are you sure you want to clear all items from the cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: onClearCart,
        },
      ]
    );
  };

  // Render cart item
  const renderCartItem = (item: CartItem) => {
    const isEditing = editingItem === item.product.id;
    const availableUOMs = getAvailableUOMs(item.product);

    if (isEditing) {
      return (
        <View key={item.product.id} style={styles.cartItemEditing}>
          <View style={styles.editHeader}>
            <Text style={styles.editTitle}>{item.product.name}</Text>
            <TouchableOpacity
              style={styles.closeEditButton}
              onPress={cancelEditItem}
            >
              <Text style={styles.closeEditButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.editControls}>
            {/* Quantity Input */}
            <View style={styles.editField}>
              <Text style={styles.editFieldLabel}>Quantity:</Text>
              <TextInput
                style={styles.editQuantityInput}
                value={editQuantity}
                onChangeText={setEditQuantity}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
            
            {/* UOM Selection */}
            <View style={styles.editField}>
              <Text style={styles.editFieldLabel}>Unit:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.editUOMScroll}>
                {availableUOMs.map(uom => (
                  <TouchableOpacity
                    key={uom.name}
                    style={[
                      styles.editUOMChip,
                      editUOM === uom.name && styles.editUOMChipSelected,
                    ]}
                    onPress={() => setEditUOM(uom.name)}
                  >
                    <Text style={[
                      styles.editUOMChipText,
                      editUOM === uom.name && styles.editUOMChipTextSelected,
                    ]}>
                      {uom.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelEditButton} onPress={cancelEditItem}>
              <Text style={styles.cancelEditButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveEditButton} onPress={saveItemEdit}>
              <Text style={styles.saveEditButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View key={item.product.id} style={styles.cartItem}>
        <View style={styles.cartItemHeader}>
          <View style={styles.cartItemInfo}>
            <Text style={styles.cartItemName}>{item.product.name}</Text>
            <Text style={styles.cartItemDetails}>
              {item.quantity} {item.uom} × {currencyUtils.formatSimplePHP(item.unitPrice)}
            </Text>
          </View>
          <View style={styles.cartItemActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => startEditItem(item)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveItem(item.product.id)}
            >
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.cartItemFooter}>
          <Text style={styles.cartItemTotal}>
            {currencyUtils.formatSimplePHP(item.totalPrice)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Cart Header */}
      <View style={styles.cartHeader}>
        <View style={styles.cartTitleSection}>
          <Text style={styles.cartTitle}>Shopping Cart</Text>
          <Text style={styles.cartCount}>
            {itemCount} item{itemCount !== 1 ? 's' : ''} • {cartItems.length} product{cartItems.length !== 1 ? 's' : ''}
          </Text>
        </View>
        
        {cartItems.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClearCart}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cart Items */}
      <ScrollView style={styles.cartItems} showsVerticalScrollIndicator={false}>
        {cartItems.length === 0 ? (
          <View style={styles.emptyCart}>
            <Text style={styles.emptyCartIcon}>🛒</Text>
            <Text style={styles.emptyCartText}>Cart is empty</Text>
            <Text style={styles.emptyCartSubtext}>Add products to start checkout</Text>
          </View>
        ) : (
          cartItems.map(renderCartItem)
        )}
      </ScrollView>

      {/* Cart Summary */}
      {cartItems.length > 0 && (
        <View style={styles.cartSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>{currencyUtils.formatSimplePHP(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax (12% VAT):</Text>
            <Text style={styles.summaryValue}>{currencyUtils.formatSimplePHP(tax)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{currencyUtils.formatSimplePHP(total)}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.checkoutButton} 
            onPress={onCheckout}
          >
            <Text style={styles.checkoutButtonText}>
              Proceed to Payment • {currencyUtils.formatSimplePHP(total)}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cartTitleSection: {
    flex: 1,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cartCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clearButtonText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  cartItems: {
    flex: 1,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCartIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyCartText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  emptyCartSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  cartItem: {
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cartItemDetails: {
    fontSize: 12,
    color: '#6B7280',
  },
  cartItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#DBEAFE',
  },
  editButtonText: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '500',
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#FEE2E2',
  },
  removeButtonText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  cartItemFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cartItemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    textAlign: 'right',
  },
  cartItemEditing: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  closeEditButton: {
    padding: 4,
  },
  closeEditButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  editControls: {
    marginBottom: 16,
  },
  editField: {
    marginBottom: 12,
  },
  editFieldLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  editQuantityInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    width: 80,
  },
  editUOMScroll: {
    maxHeight: 40,
  },
  editUOMChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 6,
  },
  editUOMChipSelected: {
    backgroundColor: '#3B82F6',
  },
  editUOMChipText: {
    fontSize: 12,
    color: '#374151',
  },
  editUOMChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelEditButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelEditButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  saveEditButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#059669',
    alignItems: 'center',
  },
  saveEditButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cartSummary: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  checkoutButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});