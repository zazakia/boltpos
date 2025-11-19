// Advanced POS Screen for InventoryPro
// Modern checkout interface with product grid, cart management, and payment processing

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  TextInput,
} from 'react-native';
import { Product, POSSale, POSSaleItem, SalesOrder } from '@/types/inventory';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { dataManagerService } from '@/services/dataManager.service';
import { InventoryFIFOService } from '@/services/inventoryFIFO.service';
import { currencyUtils } from '@/utils/inventoryUtils';
import { Shield, Lock } from 'lucide-react-native';
import { POSProductGrid } from './POSProductGrid';
import { POSShoppingCart } from './POSShoppingCart';
import { POSPaymentModal } from './POSPaymentModal';
import { POSReceiptModal } from './POSReceiptModal';
import { POSSummaryCard } from './POSSummaryCard';

const { width } = Dimensions.get('window');

export const POSScreen: React.FC = () => {
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [cartItems, setCartItems] = useState<POSSaleItem[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [completedSale, setCompletedSale] = useState<POSSale | null>(null);
  const [todaysStats, setTodaysStats] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    averageTransactionValue: 0,
  });

  // Permission checks
  const canViewPOS = hasPermission(PERMISSIONS.VIEW_POS_REPORTS);
  const canProcessSales = hasPermission(PERMISSIONS.PROCESS_SALES);
  const canViewInventory = hasPermission(PERMISSIONS.VIEW_INVENTORY);
  const canEditInventory = hasPermission(PERMISSIONS.MANAGE_INVENTORY);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Only load data if user has permission to view POS
      if (!canViewPOS) {
        setLoading(false);
        return;
      }
      
      // Load products, sales orders, and today's stats in parallel
      const [productsResult, salesOrdersResult, dashboardResult, posSalesResult] = await Promise.all([
        dataManagerService.getProducts(),
        dataManagerService.getSalesOrders(),
        dataManagerService.getDashboardKPIs(),
        (dataManagerService as any).getTodaysPOSSales(),
      ]);

      if (productsResult.error || !productsResult.data) {
        throw new Error(productsResult.error || 'Failed to load products');
      }
      if (salesOrdersResult.error || !salesOrdersResult.data) {
        throw new Error(salesOrdersResult.error || 'Failed to load sales orders');
      }
      if (posSalesResult.error || !posSalesResult.data) {
        console.warn('Failed to load POS sales data:', posSalesResult.error);
      }

      setProducts(productsResult.data);
      setSalesOrders(salesOrdersResult.data);
      
      // Calculate today's stats from POS sales
      if (posSalesResult.data) {
        setTodaysStats(posSalesResult.data);
      } else {
        setTodaysStats({
          totalTransactions: 0,
          totalRevenue: dashboardResult.data?.todaysPOSSales || 0,
          averageTransactionValue: 0,
        });
      }

      // Filter products for POS display (active products with stock)
      setSelectedProducts(productsResult.data.filter((p: Product) => p.status === 'active'));
      
    } catch (error) {
      console.error('POS: Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load POS data');
    } finally {
      setLoading(false);
    }
  };

  // Product search and filtering
  const filteredProducts = selectedProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(products.map(p => p.category))];

  // Cart management
  const addToCart = (product: Product, quantity: number = 1, uom: string = 'piece') => {
    // Check permission before allowing cart operations
    if (!canProcessSales) {
      Alert.alert('Access Denied', 'You do not have permission to process POS sales');
      return;
    }

    const existingItemIndex = cartItems.findIndex(
      item => item.productId === product.id && item.uom === uom
    );

    let newCartItems = [...cartItems];
    
    if (existingItemIndex >= 0) {
      // Update existing item
      newCartItems[existingItemIndex] = {
        ...newCartItems[existingItemIndex],
        quantity: newCartItems[existingItemIndex].quantity + quantity,
        subtotal: (newCartItems[existingItemIndex].quantity + quantity) * newCartItems[existingItemIndex].unitPrice,
      };
    } else {
      // Add new item
      const unitPrice = getProductPrice(product, uom);
      newCartItems.push({
        productId: product.id,
        quantity,
        uom,
        unitPrice,
        subtotal: quantity * unitPrice,
      });
    }

    setCartItems(newCartItems);
  };

  const removeFromCart = (productId: string, uom: string) => {
    // Check permission before allowing cart modifications
    if (!canProcessSales) {
      Alert.alert('Access Denied', 'You do not have permission to modify cart');
      return;
    }
    
    setCartItems(cartItems.filter(item => !(item.productId === productId && item.uom === uom)));
  };

  const updateCartItem = (productId: string, uom: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, uom);
      return;
    }

    setCartItems(cartItems.map(item => {
      if (item.productId === productId && item.uom === uom) {
        return {
          ...item,
          quantity: newQuantity,
          subtotal: newQuantity * item.unitPrice,
        };
      }
      return item;
    }));
  };

  const getProductPrice = (product: Product, uom: string): number => {
    if (uom === product.baseUOM.name) {
      return product.basePrice;
    }
    
    const alternateUOM = product.alternateUOMs.find(u => u.name === uom);
    return alternateUOM ? alternateUOM.price : product.basePrice;
  };

  // Payment processing
  const handlePayment = (paymentData: {
    paymentMethod: 'cash' | 'card' | 'check' | 'transfer';
    amountReceived: number;
    change: number;
    receiptData: Partial<POSSale>;
  }) => {
    const newSale: POSSale = {
      id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      receiptNumber: `RCP-${Date.now()}`,
      items: cartItems,
      subtotal: paymentData.receiptData.subtotal || 0,
      tax: paymentData.receiptData.tax || 0,
      totalAmount: paymentData.receiptData.totalAmount || 0,
      paymentMethod: paymentData.paymentMethod,
      amountReceived: paymentData.amountReceived,
      change: paymentData.change,
      createdAt: new Date().toISOString(),
    };

    // Process the sale
    processSale(newSale);
  };

  const processSale = async (sale: POSSale) => {
    try {
      // Check permissions before processing sale
      if (!canProcessSales) {
        Alert.alert('Access Denied', 'You do not have permission to process POS sales');
        return;
      }

      if (!canEditInventory) {
        Alert.alert('Access Denied', 'You do not have permission to update inventory');
        return;
      }
      
      // Update inventory using FIFO logic
      await updateInventoryForSale(sale);
      
      // Save POS sale to database
      await savePOSSale(sale);
      
      // Update today's stats
      setTodaysStats(prev => ({
        totalTransactions: prev.totalTransactions + 1,
        totalRevenue: prev.totalRevenue + sale.totalAmount,
        averageTransactionValue: (prev.totalRevenue + sale.totalAmount) / (prev.totalTransactions + 1),
      }));

      // Show receipt
      setCompletedSale(sale);
      setShowReceiptModal(true);
      
      // Clear cart
      setCartItems([]);
      setShowPaymentModal(false);
      
    } catch (error) {
      console.error('POS: Error processing sale:', error);
      Alert.alert('Error', 'Failed to process sale. Please try again.');
    }
  };

  const updateInventoryForSale = async (sale: POSSale) => {
    try {
      // Use the InventoryFIFOService for proper FIFO inventory deduction
      const fifoResult = await InventoryFIFOService.deductInventoryForSale(sale);
      
      if (!fifoResult.success) {
        throw new Error(fifoResult.error || 'Inventory deduction failed');
      }

      console.log('POS: FIFO inventory deduction completed successfully:', fifoResult.deductions);
      
      // Optional: Show user feedback about which batches were deducted
      fifoResult.deductions.forEach(deduction => {
        const product = products.find(p => p.id === deduction.productId);
        if (product) {
          console.log(`POS: Deducted ${deduction.quantityDeducted} units from batch ${deduction.batchId} (${product.name})`);
        }
      });

    } catch (error) {
      console.error('POS: Error during FIFO inventory deduction:', error);
      throw error; // Re-throw to be handled by the calling function
    }
  };

  const savePOSSale = async (sale: POSSale) => {
    try {
      // Save POS sale to database using dataManagerService
      const result = await (dataManagerService as any).createPOSSale(sale);
      
      if (result.error) {
        throw new Error(result.error);
      }

      console.log('POS: Sale saved successfully:', sale.receiptNumber);
      
      // Update sales order status if this sale was converted from an order
      if (sale.convertedFromOrderId) {
        const updateResult = await (dataManagerService as any).updateSalesOrder(sale.convertedFromOrderId, {
          status: 'converted',
          salesOrderStatus: 'converted'
        });
        
        if (updateResult.error) {
          console.warn('POS: Failed to update sales order status:', updateResult.error);
        } else {
          console.log('POS: Sales order marked as converted');
        }
      }
      
      return result.data;
    } catch (error) {
      console.error('POS: Error saving sale:', error);
      throw error;
    }
  };

  // Load pending sales orders for conversion
  const pendingSalesOrders = salesOrders.filter(so => so.status === 'pending');

  const convertSalesOrderToPOS = (order: SalesOrder) => {
    const cartItemsFromOrder: POSSaleItem[] = order.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      uom: 'piece', // Default UOM, should be configurable
      unitPrice: item.price,
      subtotal: item.subtotal,
    }));
    
    setCartItems(cartItemsFromOrder);
    
    // Update order status
    // This would be implemented in the data manager service
    console.log(`POS: Converting sales order ${order.orderNumber} to POS`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading POS System...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* POS Summary Card */}
      <POSSummaryCard
        totalTransactions={todaysStats.totalTransactions}
        totalRevenue={todaysStats.totalRevenue}
        averageTransactionValue={todaysStats.averageTransactionValue}
        onViewReport={() => console.log('Viewing POS report...')}
      />

      {/* Search and category filters */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
          <TouchableOpacity
            style={[
              styles.categoryChip,
              !selectedCategory && styles.categoryChipSelected,
            ]}
            onPress={() => setSelectedCategory('')}
          >
            <Text style={[
              styles.categoryChipText,
              !selectedCategory && styles.categoryChipTextSelected,
            ]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextSelected,
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main content */}
      <View style={styles.mainContent}>
        {/* Product grid */}
        <POSProductGrid
          products={filteredProducts}
          onAddToCart={addToCart}
        />

        {/* Shopping cart */}
        <POSShoppingCart
          cartItems={cartItems.map(item => ({
            ...item,
            product: products.find(p => p.id === item.productId) as Product,
            totalPrice: item.subtotal,
          }))}
          onUpdateQuantity={(productId, quantity, uom) => updateCartItem(productId, uom, quantity)}
          onRemoveItem={(productId) => {
            const item = cartItems.find(item => item.productId === productId);
            if (item) removeFromCart(productId, item.uom);
          }}
          onClearCart={() => setCartItems([])}
          onCheckout={() => setShowPaymentModal(true)}
        />
      </View>

      {/* Pending Sales Orders */}
      {pendingSalesOrders.length > 0 && (
        <View style={styles.pendingOrdersContainer}>
          <Text style={styles.pendingOrdersTitle}>Pending Sales Orders</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {pendingSalesOrders.map(order => (
              <TouchableOpacity
                key={order.id}
                style={styles.pendingOrderCard}
                onPress={() => convertSalesOrderToPOS(order)}
              >
                <Text style={styles.pendingOrderNumber}>{order.orderNumber}</Text>
                <Text style={styles.pendingOrderCustomer}>{order.customerName}</Text>
                <Text style={styles.pendingOrderAmount}>
                  {currencyUtils.formatSimplePHP(order.totalAmount)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Modals */}
      <POSPaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        cartItems={cartItems}
        totalAmount={cartItems.reduce((sum, item) => sum + item.subtotal, 0) * 1.12} // Including 12% tax
        onPaymentComplete={(payment) => {
          handlePayment(payment);
          setShowReceiptModal(true);
        }}
      />

      <POSReceiptModal
        visible={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setCompletedSale(null);
        }}
        sale={completedSale!}
        products={products}
        onPrint={() => console.log('Printing receipt...')}
        onEmail={() => console.log('Emailing receipt...')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  filtersContainer: {
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
    marginBottom: 12,
  },
  categoryFilter: {
    marginTop: 4,
  },
  categoryChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#374151',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  productGrid: {
    flex: 2,
  },
  cartContainer: {
    flex: 1,
    maxWidth: 400,
  },
  pendingOrdersContainer: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#FED7AA',
  },
  pendingOrdersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  pendingOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  pendingOrderNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  pendingOrderCustomer: {
    fontSize: 10,
    color: '#92400E',
    marginTop: 2,
  },
  pendingOrderAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginTop: 4,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cartItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    padding: 10,
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkoutButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  accessDeniedText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedSubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  noDataMessage: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    margin: 16,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});