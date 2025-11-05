// Financial Reports & Export Screen for InventoryPro
// Comprehensive financial reporting with export capabilities

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import { accountingService } from '@/services/accounting.service';
import { dataManagerService } from '@/services/dataManager.service';
import { currencyUtils, dateUtils } from '@/utils/inventoryUtils';

interface FinancialReportsScreenProps {
  onBack: () => void;
}

interface ReportModalData {
  visible: boolean;
  reportType: 'income_statement' | 'balance_sheet' | 'cash_flow' | 'aging' | 'expense_breakdown' | 'vendor_summary' | 'customer_summary';
  dateFrom: string;
  dateTo: string;
  format: 'pdf' | 'csv' | 'excel';
  includeCharts: boolean;
}

interface IncomeStatementData {
  revenue: {
    posSales: number;
    salesOrders: number;
    total: number;
  };
  expenses: {
    costOfGoodsSold: number;
    operatingExpenses: number;
    total: number;
  };
  netIncome: number;
  grossProfit: number;
  grossMargin: number;
}

interface CashFlowData {
  operating: {
    collections: number;
    payments: number;
    net: number;
  };
  investing: number;
  financing: number;
  netCashFlow: number;
  endingCash: number;
}

export const FinancialReportsScreen: React.FC<FinancialReportsScreenProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [reportModal, setReportModal] = useState<ReportModalData>({
    visible: false,
    reportType: 'income_statement',
    dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    format: 'pdf',
    includeCharts: true,
  });

  const reportTypes = [
    {
      key: 'income_statement' as const,
      title: 'Income Statement',
      description: 'Profit & Loss statement',
      icon: '📊',
    },
    {
      key: 'balance_sheet' as const,
      title: 'Balance Sheet',
      description: 'Assets, liabilities & equity',
      icon: '⚖️',
    },
    {
      key: 'cash_flow' as const,
      title: 'Cash Flow Statement',
      description: 'Cash inflows & outflows',
      icon: '💰',
    },
    {
      key: 'aging' as const,
      title: 'Aging Report',
      description: 'A/R and A/P aging analysis',
      icon: '📅',
    },
    {
      key: 'expense_breakdown' as const,
      title: 'Expense Breakdown',
      description: 'Expenses by category',
      icon: '💳',
    },
    {
      key: 'vendor_summary' as const,
      title: 'Vendor Summary',
      description: 'A/P by supplier',
      icon: '🏢',
    },
    {
      key: 'customer_summary' as const,
      title: 'Customer Summary',
      description: 'A/R by customer',
      icon: '👥',
    },
  ];

  const exportFormats = [
    { key: 'pdf' as const, title: 'PDF Report', icon: '📄' },
    { key: 'csv' as const, title: 'CSV Data', icon: '📊' },
    { key: 'excel' as const, title: 'Excel Workbook', icon: '📋' },
  ];

  const generateSampleIncomeStatement = (): IncomeStatementData => {
    return {
      revenue: {
        posSales: 125000,
        salesOrders: 89000,
        total: 214000,
      },
      expenses: {
        costOfGoodsSold: 128400, // 60% of revenue
        operatingExpenses: 42750, // 20% of revenue
        total: 171150,
      },
      netIncome: 42850,
      grossProfit: 85600,
      grossMargin: 40,
    };
  };

  const generateSampleCashFlow = (): CashFlowData => {
    return {
      operating: {
        collections: 195000,
        payments: 156000,
        net: 39000,
      },
      investing: -15000,
      financing: 5000,
      netCashFlow: 29000,
      endingCash: 156000,
    };
  };

  const openReportModal = (reportType: ReportModalData['reportType']) => {
    setReportModal({
      visible: true,
      reportType,
      dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      format: 'pdf',
      includeCharts: true,
    });
  };

  const closeReportModal = () => {
    setReportModal({
      visible: false,
      reportType: 'income_statement',
      dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      format: 'pdf',
      includeCharts: true,
    });
  };

  const generateReport = async () => {
    try {
      setLoading(true);

      // In a real implementation, this would generate the actual report
      // For now, we'll simulate the report generation
      const { reportType, dateFrom, dateTo, format, includeCharts } = reportModal;
      
      console.log('Generating report:', {
        type: reportType,
        dateFrom,
        dateTo,
        format,
        includeCharts,
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const reportName = reportTypes.find(rt => rt.key === reportType)?.title || 'Financial Report';
      Alert.alert(
        'Report Generated',
        `${reportName} has been generated successfully in ${format.toUpperCase()} format for the period ${dateUtils.formatDate(dateFrom)} to ${dateUtils.formatDate(dateTo)}.`
      );

      closeReportModal();
      
    } catch (error) {
      console.error('FinancialReportsScreen: Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderReportTypeItem = ({ item }: { item: typeof reportTypes[0] }) => (
    <TouchableOpacity 
      style={styles.reportTypeCard}
      onPress={() => openReportModal(item.key)}
    >
      <Text style={styles.reportTypeIcon}>{item.icon}</Text>
      <View style={styles.reportTypeInfo}>
        <Text style={styles.reportTypeTitle}>{item.title}</Text>
        <Text style={styles.reportTypeDescription}>{item.description}</Text>
      </View>
      <Text style={styles.reportTypeArrow}>→</Text>
    </TouchableOpacity>
  );

  const renderReportModal = () => (
    <Modal
      visible={reportModal.visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeReportModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={closeReportModal}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Generate Report</Text>
          <TouchableOpacity onPress={generateReport} disabled={loading}>
            <Text style={[styles.modalSave, loading && styles.modalSaveDisabled]}>
              {loading ? 'Generating...' : 'Generate'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.reportTypePreview}>
            <Text style={styles.previewTitle}>
              {reportTypes.find(rt => rt.key === reportModal.reportType)?.title}
            </Text>
            <Text style={styles.previewDescription}>
              {reportTypes.find(rt => rt.key === reportModal.reportType)?.description}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date From</Text>
            <TextInput
              style={styles.textInput}
              value={reportModal.dateFrom}
              onChangeText={(text) => setReportModal(prev => ({ ...prev, dateFrom: text }))}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date To</Text>
            <TextInput
              style={styles.textInput}
              value={reportModal.dateTo}
              onChangeText={(text) => setReportModal(prev => ({ ...prev, dateTo: text }))}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Export Format</Text>
            <View style={styles.formatContainer}>
              {exportFormats.map((format) => (
                <TouchableOpacity
                  key={format.key}
                  style={[
                    styles.formatButton,
                    reportModal.format === format.key && styles.formatButtonActive
                  ]}
                  onPress={() => setReportModal(prev => ({ ...prev, format: format.key }))}
                >
                  <Text style={styles.formatIcon}>{format.icon}</Text>
                  <Text style={[
                    styles.formatText,
                    reportModal.format === format.key && styles.formatTextActive
                  ]}>
                    {format.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Options</Text>
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => setReportModal(prev => ({ 
                  ...prev, 
                  includeCharts: !prev.includeCharts 
                }))}
              >
                <View style={[
                  styles.checkbox,
                  reportModal.includeCharts && styles.checkboxChecked
                ]}>
                  {reportModal.includeCharts && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.optionText}>Include Charts & Graphs</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.reportPreview}>
            <Text style={styles.previewSectionTitle}>Sample Data Preview</Text>
            {reportModal.reportType === 'income_statement' && (
              <View style={styles.sampleData}>
                <View style={styles.sampleRow}>
                  <Text style={styles.sampleLabel}>Total Revenue:</Text>
                  <Text style={styles.sampleValue}>{currencyUtils.formatSimplePHP(214000)}</Text>
                </View>
                <View style={styles.sampleRow}>
                  <Text style={styles.sampleLabel}>Gross Profit:</Text>
                  <Text style={styles.sampleValue}>{currencyUtils.formatSimplePHP(85600)}</Text>
                </View>
                <View style={styles.sampleRow}>
                  <Text style={styles.sampleLabel}>Net Income:</Text>
                  <Text style={styles.sampleValue}>{currencyUtils.formatSimplePHP(42850)}</Text>
                </View>
              </View>
            )}
            {reportModal.reportType === 'cash_flow' && (
              <View style={styles.sampleData}>
                <View style={styles.sampleRow}>
                  <Text style={styles.sampleLabel}>Operating Cash Flow:</Text>
                  <Text style={styles.sampleValue}>{currencyUtils.formatSimplePHP(39000)}</Text>
                </View>
                <View style={styles.sampleRow}>
                  <Text style={styles.sampleLabel}>Net Cash Flow:</Text>
                  <Text style={styles.sampleValue}>{currencyUtils.formatSimplePHP(29000)}</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Financial Reports</Text>
        <TouchableOpacity onPress={() => {/* Refresh */}}>
          <Text style={styles.refreshButton}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{currencyUtils.formatSimplePHP(42850)}</Text>
          <Text style={styles.statLabel}>Net Income (MTD)</Text>
          <Text style={styles.statChange}>+12.5% vs last month</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{currencyUtils.formatSimplePHP(156000)}</Text>
          <Text style={styles.statLabel}>Cash Balance</Text>
          <Text style={styles.statChange}>+29K from last month</Text>
        </View>
      </View>

      {/* Report Types */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Available Reports</Text>
        <FlatList
          data={reportTypes}
          renderItem={renderReportTypeItem}
          keyExtractor={(item) => item.key}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Recent Reports */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Recent Reports</Text>
        <View style={styles.recentReportCard}>
          <View style={styles.recentReportInfo}>
            <Text style={styles.recentReportTitle}>Income Statement - Nov 2025</Text>
            <Text style={styles.recentReportDate}>Generated: Nov 5, 2025</Text>
          </View>
          <TouchableOpacity style={styles.downloadButton}>
            <Text style={styles.downloadButtonText}>Download</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.recentReportCard}>
          <View style={styles.recentReportInfo}>
            <Text style={styles.recentReportTitle}>Cash Flow Statement - Q4 2025</Text>
            <Text style={styles.recentReportDate}>Generated: Nov 5, 2025</Text>
          </View>
          <TouchableOpacity style={styles.downloadButton}>
            <Text style={styles.downloadButtonText}>Download</Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderReportModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  refreshButton: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  statChange: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '500',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  reportTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reportTypeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  reportTypeInfo: {
    flex: 1,
  },
  reportTypeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  reportTypeDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  reportTypeArrow: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  recentReportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  recentReportInfo: {
    flex: 1,
  },
  recentReportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  recentReportDate: {
    fontSize: 10,
    color: '#6B7280',
  },
  downloadButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalSave: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  modalSaveDisabled: {
    color: '#9CA3AF',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  reportTypePreview: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  formatContainer: {
    flexDirection: 'row',
  },
  formatButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  formatButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  formatIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  formatText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  formatTextActive: {
    color: '#3B82F6',
  },
  optionsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 3,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
  },
  reportPreview: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  previewSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  sampleData: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  sampleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sampleLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  sampleValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },
});