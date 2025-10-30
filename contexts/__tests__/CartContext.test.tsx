import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { CartProvider, useCart } from '../CartContext';

describe('CartContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CartProvider>{children}</CartProvider>
  );

  const mockProduct1 = {
    id: 'product-1',
    name: 'Test Product 1',
    price: 100,
  };

  const mockProduct2 = {
    id: 'product-2',
    name: 'Test Product 2',
    price: 200,
  };

  const mockProduct3 = {
    id: 'product-3',
    name: 'Test Product 3',
    price: 50.50,
  };

  describe('useCart hook', () => {
    it('should throw error when used outside CartProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useCart());
      }).toThrow('useCart must be used within a CartProvider');

      consoleSpy.mockRestore();
    });

    it('should provide cart context when used within CartProvider', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.cart).toEqual([]);
      expect(result.current.getCartTotal()).toBe(0);
      expect(result.current.getCartCount()).toBe(0);
    });
  });

  describe('addToCart', () => {
    it('should add a new product to empty cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct1);
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0]).toEqual({
        product: mockProduct1,
        quantity: 1,
      });
    });

    it('should increment quantity if product already exists in cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct1);
        result.current.addToCart(mockProduct1);
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].quantity).toBe(2);
    });

    it('should add multiple different products to cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct1);
        result.current.addToCart(mockProduct2);
        result.current.addToCart(mockProduct3);
      });

      expect(result.current.cart).toHaveLength(3);
      expect(result.current.cart[0].product).toEqual(mockProduct1);
      expect(result.current.cart[1].product).toEqual(mockProduct2);
      expect(result.current.cart[2].product).toEqual(mockProduct3);
    });

    it('should handle adding same product multiple times', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct1);
        result.current.addToCart(mockProduct2);
        result.current.addToCart(mockProduct1);
        result.current.addToCart(mockProduct1);
      });

      expect(result.current.cart).toHaveLength(2);

      const product1Item = result.current.cart.find(item => item.product.id === 'product-1');
      const product2Item = result.current.cart.find(item => item.product.id === 'product-2');

      expect(product1Item?.quantity).toBe(3);
      expect(product2Item?.quantity).toBe(1);
    });
  });

  describe('removeFromCart', () => {
    it('should remove a product from cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct1);
        result.current.addToCart(mockProduct2);
      });

      expect(result.current.cart).toHaveLength(2);

      act(() => {
        result.current.removeFromCart('product-1');
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].product.id).toBe('product-2');
    });

    it('should handle removing non-existent product', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct1);
      });

      expect(result.current.cart).toHaveLength(1);

      act(() => {
        result.current.removeFromCart('non-existent-id');
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].product.id).toBe('product-1');
    });

    it('should handle removing from empty cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      expect(result.current.cart).toHaveLength(0);

      act(() => {
        result.current.removeFromCart('product-1');
      });

      expect(result.current.cart).toHaveLength(0);
    });
  });

  describe('updateQuantity', () => {
    it('should update quantity of existing product', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct1);
      });

      expect(result.current.cart[0].quantity).toBe(1);

      act(() => {
        result.current.updateQuantity('product-1', 5);
      });

      expect(result.current.cart[0].quantity).toBe(5);
    });

    it('should remove product when quantity is set to 0', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct1);
        result.current.addToCart(mockProduct2);
      });

      expect(result.current.cart).toHaveLength(2);

      act(() => {
        result.current.updateQuantity('product-1', 0);
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].product.id).toBe('product-2');
    });

    it('should remove product when quantity is negative', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct1);
      });

      expect(result.current.cart).toHaveLength(1);

      act(() => {
        result.current.updateQuantity('product-1', -5);
      });

      expect(result.current.cart).toHaveLength(0);
    });

    it('should handle updating quantity of non-existent product', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct1);
      });

      const cartLength = result.current.cart.length;

      act(() => {
        result.current.updateQuantity('non-existent-id', 10);
      });

      expect(result.current.cart.length).toBe(cartLength);
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct1);
        result.current.addToCart(mockProduct2);
        result.current.addToCart(mockProduct3);
      });

      expect(result.current.cart).toHaveLength(3);

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.cart).toHaveLength(0);
      expect(result.current.getCartTotal()).toBe(0);
      expect(result.current.getCartCount()).toBe(0);
    });

    it('should handle clearing empty cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      expect(result.current.cart).toHaveLength(0);

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.cart).toHaveLength(0);
    });
  });

  describe('getCartTotal', () => {
    it('should calculate correct total for single product', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct1);
      });

      expect(result.current.getCartTotal()).toBe(100);
    });

    it('should calculate correct total for multiple quantities of same product', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct1);
        result.current.addToCart(mockProduct1);
        result.current.addToCart(mockProduct1);
      });

      expect(result.current.getCartTotal()).toBe(300);
    });

    it('should calculate correct total for multiple different products', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct1); // 100
        result.current.addToCart(mockProduct2); // 200
        result.current.addToCart(mockProduct3); // 50.50
      });

      expect(result.current.getCartTotal()).toBe(350.50);
    });

    it('should calculate correct total with different quantities', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct1);
        result.current.updateQuantity('product-1', 3); // 3 * 100 = 300
        result.current.addToCart(mockProduct2);
        result.current.updateQuantity('product-2', 2); // 2 * 200 = 400
      });

      expect(result.current.getCartTotal()).toBe(700);
    });

    it('should return 0 for empty cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      expect(result.current.getCartTotal()).toBe(0);
    });

    it('should handle decimal prices correctly', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct3);
        result.current.updateQuantity('product-3', 3);
      });

      expect(result.current.getCartTotal()).toBeCloseTo(151.50, 2);
    });
  });

  describe('getCartCount', () => {
    it('should return 0 for empty cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      expect(result.current.getCartCount()).toBe(0);
    });

    it('should count single item correctly', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct1);
      });

      expect(result.current.getCartCount()).toBe(1);
    });

    it('should count multiple quantities of same product', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct1);
        result.current.addToCart(mockProduct1);
        result.current.addToCart(mockProduct1);
      });

      expect(result.current.getCartCount()).toBe(3);
    });

    it('should count all items across different products', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct1); // 1
        result.current.addToCart(mockProduct1); // 2
        result.current.addToCart(mockProduct2); // 3
        result.current.addToCart(mockProduct3); // 4
        result.current.addToCart(mockProduct3); // 5
        result.current.addToCart(mockProduct3); // 6
      });

      expect(result.current.getCartCount()).toBe(6);
    });

    it('should update count when quantity is changed', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct1);
        result.current.updateQuantity('product-1', 10);
      });

      expect(result.current.getCartCount()).toBe(10);
    });

    it('should update count when items are removed', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct1);
        result.current.addToCart(mockProduct2);
        result.current.updateQuantity('product-1', 3);
        result.current.updateQuantity('product-2', 2);
      });

      expect(result.current.getCartCount()).toBe(5);

      act(() => {
        result.current.removeFromCart('product-1');
      });

      expect(result.current.getCartCount()).toBe(2);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete shopping flow', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      // Start with empty cart
      expect(result.current.cart).toHaveLength(0);
      expect(result.current.getCartTotal()).toBe(0);

      // Add items
      act(() => {
        result.current.addToCart(mockProduct1);
        result.current.addToCart(mockProduct2);
        result.current.addToCart(mockProduct1);
      });

      expect(result.current.cart).toHaveLength(2);
      expect(result.current.getCartCount()).toBe(3);
      expect(result.current.getCartTotal()).toBe(400); // (2 * 100) + (1 * 200)

      // Update quantity
      act(() => {
        result.current.updateQuantity('product-1', 5);
      });

      expect(result.current.getCartCount()).toBe(6);
      expect(result.current.getCartTotal()).toBe(700); // (5 * 100) + (1 * 200)

      // Remove item
      act(() => {
        result.current.removeFromCart('product-2');
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.getCartTotal()).toBe(500);

      // Clear cart
      act(() => {
        result.current.clearCart();
      });

      expect(result.current.cart).toHaveLength(0);
      expect(result.current.getCartTotal()).toBe(0);
      expect(result.current.getCartCount()).toBe(0);
    });
  });
});
