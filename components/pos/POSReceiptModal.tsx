// POS Receipt Modal Component for InventoryPro
// Handles receipt generation, preview, and printing functionality

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { POSSale, POSSaleItem, Product } from '@/types/inventory';
import { currencyUtils } from '@/utils/inventoryUtils';

interface POSReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  sale: POSSale;
  products: Product[];
  onPrint: () => void;
  onEmail: () => void;
}

export const POSReceiptModal: React.FC<POSReceiptModalProps> = ({
  visible,
  onClose,
  sale,
  products,
  onPrint,
  onEmail,
}) => {
  // Get product name by ID
  const getProductName = (productId: string): string => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  // Generate receipt number
  const generateReceiptNumber = (): string => {
    return `POS-${Date.now().toString().slice(-6)}`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle print
  const handlePrint = () => {
    Alert.alert(
      'Print Receipt',
      'This would send the receipt to the printer.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Print', onPress: onPrint },
      ]
    );
  };

  // Handle email
  const handleEmail = () => {
    Alert.alert(
      'Email Receipt',
      'This would send the receipt via email.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email', onPress: onEmail },
      ]
    );
  };

  // Render receipt content
  const renderReceipt = () => (
    <View style={styles.receiptContainer}>
      {/* Receipt Header */}
      <View style={styles.receiptHeader}>
        <Text style={styles.receiptTitle}>INVENTORYPRO POS</Text>
        <Text style={styles.receiptSubtitle}>Inventory Management & POS</Text>
        <Text style={styles.receiptAddress}>
          123 Main Street, Manila{'\n'}
          Philippines 1000{'\n'}
          Tel: (02) 8123-4567
        </Text>
      </View>

      {/* Receipt Details */}
      <View style={styles.receiptDetails}>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Receipt #:</Text>
          <Text style={styles.receiptValue}>{sale.receiptNumber}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Date:</Text>
          <Text style={styles.receiptValue}>{formatDate(sale.createdAt)}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Payment:</Text>
          <Text style={styles.receiptValue}>{sale.paymentMethod.toUpperCase()}</Text>
        </View>
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Items */}
      <View style={styles.itemsSection}>
        <Text style={styles.itemsTitle}>ITEMS</Text>
        {sale.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{getProductName(item.productId)}</Text>
              <Text style={styles.itemDetails}>
                {item.quantity} {item.uom} × {currencyUtils.formatSimplePHP(item.unitPrice)}
              </Text>
            </View>
            <Text style={styles.itemTotal}>
              {currencyUtils.formatSimplePHP(item.subtotal)}
            </Text>
          </View>
        ))}
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>{currencyUtils.formatSimplePHP(sale.subtotal)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax (12% VAT):</Text>
          <Text style={styles.totalValue}>{currencyUtils.formatSimplePHP(sale.tax)}</Text>
        </View>
        <View style={[styles.totalRow, styles.finalTotalRow]}>
          <Text style={styles.finalTotalLabel}>TOTAL:</Text>
          <Text style={styles.finalTotalValue}>{currencyUtils.formatSimplePHP(sale.totalAmount)}</Text>
        </View>
        {sale.amountReceived > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Paid:</Text>
            <Text style={styles.totalValue}>{currencyUtils.formatSimplePHP(sale.amountReceived)}</Text>
          </View>
        )}
        {sale.change > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Change:</Text>
            <Text style={styles.totalValue}>{currencyUtils.formatSimplePHP(sale.change)}</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.receiptFooter}>
        <Text style={styles.footerText}>Thank you for your business!</Text>
        <Text style={styles.footerTextSmall}>Please keep this receipt for your records</Text>
        <Text style={styles.footerTextSmall}>Visit us again soon</Text>
      </View>
    </View>
  );

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
          <Text style={styles.headerTitle}>Receipt</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Receipt Preview */}
        <ScrollView style={styles.previewContainer}>
          <View style={styles.receiptPreview}>
            {renderReceipt()}
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.emailButton} onPress={handleEmail}>
            <Text style={styles.emailButtonText}>📧 Email</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
            <Text style={styles.printButtonText}>🖨️ Print</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.newSaleButton} onPress={onClose}>
            <Text style={styles.newSaleButtonText}>New Sale</Text>
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
  previewContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  receiptPreview: {
    padding: 16,
  },
  receiptContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    maxWidth: 350,
    alignSelf: 'center',
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 12,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  receiptSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  receiptAddress: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 14,
  },
  receiptDetails: {
    marginBottom: 16,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  receiptLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  itemsSection: {
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 8,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 10,
    color: '#6B7280',
  },
  itemTotal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  totalsSection: {
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
  },
  finalTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: 0,
  },
  finalTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  finalTotalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  receiptFooter: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  footerTextSmall: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  emailButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
  },
  emailButtonText: {
    fontSize: 14,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  printButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
  },
  printButtonText: {
    fontSize: 14,
    color: '#047857',
    fontWeight: '600',
  },
  newSaleButton: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#111827',
    alignItems: 'center',
  },
  newSaleButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});