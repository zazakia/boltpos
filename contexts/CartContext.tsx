import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { formatPrice } from '@/utils/currency';

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: Product) => boolean;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => boolean;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  checkCartStockAvailability: (products: Product[]) => {
    isValid: boolean;
    insufficientItems: Array<{productId: string; requestedQty: number; availableStock: number}>;
  };
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: Product) => {
    // Check if product has sufficient stock
    if (product.stock <= 0) {
      return false;
    }

    let didUpdate = false;

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        // Check if adding one more would exceed available stock
        if (existingItem.quantity + 1 > product.stock) {
          didUpdate = false;
          return prevCart; // Don't update if stock is insufficient
        }
        didUpdate = true;
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        didUpdate = true;
        return [...prevCart, { product, quantity: 1 }];
      }
    });
    
    return didUpdate;
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return true;
    }
    
    let isValid = true;
    
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.product.id === productId) {
          // Check if the requested quantity exceeds available stock
          if (quantity > item.product.stock) {
            isValid = false;
            return item; // Don't update if stock is insufficient
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
    
    return isValid;
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }, [cart]);

  const getCartCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  const checkCartStockAvailability = useCallback((products: Product[]) => {
    const insufficientItems: Array<{productId: string; requestedQty: number; availableStock: number}> = [];
    
    cart.forEach(cartItem => {
      const product = products.find(p => p.id === cartItem.product.id);
      if (product) {
        if (cartItem.quantity > product.stock) {
          insufficientItems.push({
            productId: cartItem.product.id,
            requestedQty: cartItem.quantity,
            availableStock: product.stock
          });
        }
      }
    });
    
    return {
      isValid: insufficientItems.length === 0,
      insufficientItems
    };
  }, [cart]);

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    checkCartStockAvailability
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}