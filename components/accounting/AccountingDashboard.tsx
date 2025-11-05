// Accounting Dashboard Component for InventoryPro
// Displays financial summary, A/P, A/R, and expense overview

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { accountingService, FinancialSummary } from '@/services/accounting.service';
import { currencyUtils } from '@/utils/inventoryUtils';

const { width } = Dimensions.get('window');

interface AccountingDashboardProps {
  onNavigateToAP: () => void;
  onNavigateToAR: () => void;
  onNavigateToExpenses: () => void;
  onNavigateToReports: () => void;
}

export const AccountingDashboard: React.FC<AccountingDashboardProps> = ({
  onNavigateToAP,
  onNavigateToAR,
  onNavigateToExpenses,
  onNavigateToReports,
}) => {
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const result = await accountingService.getFinancialSummary();
      
      if (result.error) {
        throw new Error(result.error);
      }

      setFinancialSummary(result.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('AccountingDashboard: Error loading financial data:', error);
      Alert.alert('Error', 'Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    // Update overdue accounts first
    await accountingService.updateOverdueAccounts();
    // Then reload data
    await loadFinancialData();
  };

  if (loading && !financialSummary) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Financial Data...</Text>
      </View>
    );
  }

  if (!financialSummary) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load financial data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadFinancialData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { accountsPayable, accountsReceivable, expenses, cashFlow } = financialSummary;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Accounting Dashboard</Text>
        <Text style={styles.subtitle}>
          Last updated: {lastUpdated.toLocaleString()}
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshData}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionCard} onPress={onNavigateToAP}>
          <Text style={styles.actionTitle}>Accounts Payable</Text>
          <Text style={styles.actionValue}>
            {currencyUtils.formatSimplePHP(accountsPayable.totalOutstanding)}
          </Text>
          <Text style={styles.actionSubtext}>
            {accountsPayable.countByStatus.outstanding} outstanding
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={onNavigateToAR}>
          <Text style={styles.actionTitle}>Accounts Receivable</Text>
          <Text style={styles.actionValue}>
            {currencyUtils.formatSimplePHP(accountsReceivable.totalOutstanding)}
          </Text>
          <Text style={styles.actionSubtext}>
            {accountsReceivable.countByStatus.outstanding} outstanding
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={onNavigateToExpenses}>
          <Text style={styles.actionTitle}>Expenses (This Month)</Text>
          <Text style={styles.actionValue}>
            {currencyUtils.formatSimplePHP(expenses.totalThisMonth)}
          </Text>
          <Text style={styles.actionSubtext}>
            {expenses.pendingApprovals} pending approval
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={onNavigateToReports}>
          <Text style={styles.actionTitle}>Cash Flow</Text>
          <Text style={[
            styles.actionValue,
            cashFlow.netCashFlow >= 0 ? styles.positiveValue : styles.negativeValue
          ]}>
            {currencyUtils.formatSimplePHP(cashFlow.netCashFlow)}
          </Text>
          <Text style={styles.actionSubtext}>
            Net this period
          </Text>
        </TouchableOpacity>
      </View>

      {/* Detailed Sections */}
      <View style={styles.sectionsContainer}>
        {/* Accounts Payable Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Accounts Payable</Text>
            <TouchableOpacity onPress={onNavigateToAP}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {currencyUtils.formatSimplePHP(accountsPayable.totalOutstanding)}
              </Text>
              <Text style={styles.metricLabel}>Total Outstanding</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, styles.negativeValue]}>
                {currencyUtils.formatSimplePHP(accountsPayable.totalOverdue)}
              </Text>
              <Text style={styles.metricLabel}>Overdue</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {currencyUtils.formatSimplePHP(accountsPayable.dueThisWeek)}
              </Text>
              <Text style={styles.metricLabel}>Due This Week</Text>
            </View>
          </View>

          <View style={styles.statusSummary}>
            <View style={styles.statusItem}>
              <View style={[styles.statusIndicator, styles.outstandingIndicator]} />
              <Text style={styles.statusText}>
                {accountsPayable.countByStatus.outstanding} Outstanding
              </Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusIndicator, styles.overdueIndicator]} />
              <Text style={styles.statusText}>
                {accountsPayable.countByStatus.overdue} Overdue
              </Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusIndicator, styles.paidIndicator]} />
              <Text style={styles.statusText}>
                {accountsPayable.countByStatus.paid} Paid
              </Text>
            </View>
          </View>
        </View>

        {/* Accounts Receivable Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Accounts Receivable</Text>
            <TouchableOpacity onPress={onNavigateToAR}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {currencyUtils.formatSimplePHP(accountsReceivable.totalOutstanding)}
              </Text>
              <Text style={styles.metricLabel}>Total Outstanding</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, styles.negativeValue]}>
                {currencyUtils.formatSimplePHP(accountsReceivable.totalOverdue)}
              </Text>
              <Text style={styles.metricLabel}>Overdue</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {currencyUtils.formatSimplePHP(accountsReceivable.dueThisWeek)}
              </Text>
              <Text style={styles.metricLabel}>Due This Week</Text>
            </View>
          </View>

          <View style={styles.statusSummary}>
            <View style={styles.statusItem}>
              <View style={[styles.statusIndicator, styles.outstandingIndicator]} />
              <Text style={styles.statusText}>
                {accountsReceivable.countByStatus.outstanding} Outstanding
              </Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusIndicator, styles.overdueIndicator]} />
              <Text style={styles.statusText}>
                {accountsReceivable.countByStatus.overdue} Overdue
              </Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusIndicator, styles.paidIndicator]} />
              <Text style={styles.statusText}>
                {accountsReceivable.countByStatus.paid} Paid
              </Text>
            </View>
          </View>
        </View>

        {/* Expense Breakdown */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expenses This Month</Text>
            <TouchableOpacity onPress={onNavigateToExpenses}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.expenseSummary}>
            <View style={styles.expenseMetric}>
              <Text style={styles.expenseValue}>
                {currencyUtils.formatSimplePHP(expenses.totalThisMonth)}
              </Text>
              <Text style={styles.expenseLabel}>Total This Month</Text>
            </View>
            
            <View style={styles.expenseMetric}>
              <Text style={styles.expenseValue}>
                {currencyUtils.formatSimplePHP(expenses.totalThisYear)}
              </Text>
              <Text style={styles.expenseLabel}>Total This Year</Text>
            </View>
          </View>

          {/* Top Expense Categories */}
          <Text style={styles.categoryTitle}>Top Categories</Text>
          {Object.entries(expenses.byCategory)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([category, amount], index) => (
              <View key={category} style={styles.categoryItem}>
                <Text style={styles.categoryName}>{category}</Text>
                <Text style={styles.categoryAmount}>
                  {currencyUtils.formatSimplePHP(amount)}
                </Text>
              </View>
            ))}
        </View>

        {/* Cash Flow Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cash Flow Summary</Text>
          
          <View style={styles.cashFlowGrid}>
            <View style={styles.cashFlowItem}>
              <Text style={[styles.cashFlowValue, styles.positiveValue]}>
                {currencyUtils.formatSimplePHP(cashFlow.totalInflow)}
              </Text>
              <Text style={styles.cashFlowLabel}>Expected Inflow</Text>
            </View>
            
            <View style={styles.cashFlowItem}>
              <Text style={[styles.cashFlowValue, styles.negativeValue]}>
                {currencyUtils.formatSimplePHP(cashFlow.totalOutflow)}
              </Text>
              <Text style={styles.cashFlowLabel}>Expected Outflow</Text>
            </View>
          </View>
          
          <View style={styles.netCashFlow}>
            <Text style={styles.netCashFlowLabel}>Net Cash Flow</Text>
            <Text style={[
              styles.netCashFlowValue,
              cashFlow.netCashFlow >= 0 ? styles.positiveValue : styles.negativeValue
            ]}>
              {currencyUtils.formatSimplePHP(cashFlow.netCashFlow)}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  refreshButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  refreshButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    marginRight: 8,
    flex: 1,
    minWidth: (width - 48) / 2 - 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  actionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  actionSubtext: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  sectionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  statusSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  outstandingIndicator: {
    backgroundColor: '#F59E0B',
  },
  overdueIndicator: {
    backgroundColor: '#EF4444',
  },
  paidIndicator: {
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  expenseSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  expenseMetric: {
    flex: 1,
    alignItems: 'center',
  },
  expenseValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  expenseLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  categoryName: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  cashFlowGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cashFlowItem: {
    flex: 1,
    alignItems: 'center',
  },
  cashFlowValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cashFlowLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  netCashFlow: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  netCashFlowLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  netCashFlowValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  positiveValue: {
    color: '#10B981',
  },
  negativeValue: {
    color: '#EF4444',
  },
});