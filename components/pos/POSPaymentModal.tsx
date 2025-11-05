// POS Payment Modal Component for InventoryPro
// Handles payment processing for Cash, Card, Check, and Online Transfer

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { POSSale, POSSaleItem } from '@/types/inventory';
type PaymentMethod = POSSale['paymentMethod'];
import { currencyUtils } from '@/utils/inventoryUtils';

interface POSPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  cartItems: POSSaleItem[];
  totalAmount: number;
  onPaymentComplete: (payment: {
    paymentMethod: PaymentMethod;
    amountReceived: number;
    change: number;
    receiptData: Partial<POSSale>;
  }) => void;
}

export const POSPaymentModal: React.FC<POSPaymentModalProps> = ({
  visible,
  onClose,
  cartItems,
  totalAmount,
  onPaymentComplete,
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate subtotal and tax
  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.12; // 12% Philippine VAT
  const change = selectedPaymentMethod === 'cash' 
    ? (parseFloat(amountReceived) || 0) - totalAmount 
    : 0;

  // Payment method options
  const paymentMethods = [
    {
      id: 'cash' as PaymentMethod,
      name: 'Cash',
      icon: '💰',
      description: 'Pay with cash',
      requiresAmount: true,
    },
    {
      id: 'card' as PaymentMethod,
      name: 'Card',
      icon: '💳',
      description: 'Debit/Credit Card',
      requiresAmount: false,
    },
    {
      id: 'check' as PaymentMethod,
      name: 'Check',
      icon: '📄',
      description: 'Pay with check',
      requiresAmount: false,
    },
    {
      id: 'transfer' as PaymentMethod,
      name: 'Transfer',
      icon: '📱',
      description: 'Online/Bank Transfer',
      requiresAmount: false,
    },
  ];

  // Handle payment method selection
  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    if (method === 'cash') {
      setAmountReceived(totalAmount.toFixed(2));
    } else {
      setAmountReceived('');
    }
  };

  // Validate payment
  const validatePayment = (): boolean => {
    if (selectedPaymentMethod === 'cash') {
      const receivedAmount = parseFloat(amountReceived) || 0;
      if (receivedAmount < totalAmount) {
        Alert.alert(
          'Insufficient Amount',
          `Amount received (${currencyUtils.formatSimplePHP(receivedAmount)}) is less than total amount (${currencyUtils.formatSimplePHP(totalAmount)}).`
        );
        return false;
      }
    }
    return true;
  };

  // Handle payment completion
  const handlePaymentComplete = async () => {
    if (!validatePayment()) return;

    setIsProcessing(true);

    // Simulate payment processing delay
    setTimeout(() => {
      const payment = {
        paymentMethod: selectedPaymentMethod,
        amountReceived: selectedPaymentMethod === 'cash' ? parseFloat(amountReceived) || 0 : totalAmount,
        change: Math.max(0, change),
        receiptData: {
          items: cartItems,
          subtotal,
          tax,
          totalAmount,
          paymentMethod: selectedPaymentMethod,
          amountReceived: selectedPaymentMethod === 'cash' ? parseFloat(amountReceived) || 0 : totalAmount,
          change: Math.max(0, change),
        },
      };

      onPaymentComplete(payment);
      setIsProcessing(false);
      onClose();
    }, 1500);
  };

  // Reset form when modal closes
  React.useEffect(() => {
    if (!visible) {
      setSelectedPaymentMethod('cash');
      setAmountReceived('');
      setIsProcessing(false);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {/* Order Summary */}
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
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
              <Text style={styles.totalValue}>{currencyUtils.formatSimplePHP(totalAmount)}</Text>
            </View>
          </View>

          {/* Payment Methods */}
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentMethods}>
              {paymentMethods.map(method => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethod,
                    selectedPaymentMethod === method.id && styles.paymentMethodSelected,
                  ]}
                  onPress={() => handlePaymentMethodSelect(method.id)}
                >
                  <Text style={styles.paymentMethodIcon}>{method.icon}</Text>
                  <View style={styles.paymentMethodInfo}>
                    <Text style={[
                      styles.paymentMethodName,
                      selectedPaymentMethod === method.id && styles.paymentMethodNameSelected,
                    ]}>
                      {method.name}
                    </Text>
                    <Text style={[
                      styles.paymentMethodDescription,
                      selectedPaymentMethod === method.id && styles.paymentMethodDescriptionSelected,
                    ]}>
                      {method.description}
                    </Text>
                  </View>
                  {selectedPaymentMethod === method.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Cash Amount Input */}
          {selectedPaymentMethod === 'cash' && (
            <View style={styles.amountSection}>
              <Text style={styles.sectionTitle}>Cash Amount</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencyLabel}>₱</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amountReceived}
                  onChangeText={setAmountReceived}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  autoFocus={true}
                />
              </View>
              
              {amountReceived && (
                <View style={styles.changeContainer}>
                  {parseFloat(amountReceived) >= totalAmount ? (
                    <View style={styles.changeRow}>
                      <Text style={styles.changeLabel}>Change:</Text>
                      <Text style={styles.changeValue}>{currencyUtils.formatSimplePHP(change)}</Text>
                    </View>
                  ) : (
                    <View style={styles.insufficientContainer}>
                      <Text style={styles.insufficientText}>
                        Insufficient amount by {currencyUtils.formatSimplePHP(totalAmount - (parseFloat(amountReceived) || 0))}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Non-cash Payment Info */}
          {selectedPaymentMethod !== 'cash' && (
            <View style={styles.infoSection}>
              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>
                  {selectedPaymentMethod === 'card' ? '💳' : 
                   selectedPaymentMethod === 'check' ? '📄' : '📱'}
                </Text>
                <Text style={styles.infoText}>
                  {selectedPaymentMethod === 'card' && 'Please insert/swipe your card and enter PIN'}
                  {selectedPaymentMethod === 'check' && 'Please provide check details and authorization'}
                  {selectedPaymentMethod === 'transfer' && 'Please complete the online transfer and confirm'}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Payment Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.payButton,
              (isProcessing || 
               (selectedPaymentMethod === 'cash' && (parseFloat(amountReceived) || 0) < totalAmount)) &&
              styles.payButtonDisabled,
            ]}
            onPress={handlePaymentComplete}
            disabled={isProcessing || (selectedPaymentMethod === 'cash' && (parseFloat(amountReceived) || 0) < totalAmount)}
          >
            <Text style={styles.payButtonText}>
              {isProcessing ? 'Processing...' : 
               selectedPaymentMethod === 'cash' ? 'Complete Payment' : 
               `Pay ${currencyUtils.formatSimplePHP(totalAmount)}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summarySection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
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
    marginBottom: 0,
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
  paymentSection: {
    marginBottom: 24,
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodSelected: {
    backgroundColor: '#EBF5FF',
    borderColor: '#3B82F6',
  },
  paymentMethodIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  paymentMethodNameSelected: {
    color: '#1D4ED8',
  },
  paymentMethodDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  paymentMethodDescriptionSelected: {
    color: '#1D4ED8',
  },
  checkmark: {
    fontSize: 18,
    color: '#3B82F6',
    fontWeight: '600',
  },
  amountSection: {
    marginBottom: 24,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
  },
  currencyLabel: {
    fontSize: 18,
    color: '#6B7280',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  changeContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  changeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  insufficientContainer: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
  },
  insufficientText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  infoSection: {
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#0369A1',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  payButton: {
    flex: 2,
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  payButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});