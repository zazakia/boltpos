// POS Summary Card Component for InventoryPro
// Displays today's POS sales statistics and KPIs

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { currencyUtils } from '@/utils/inventoryUtils';

interface POSSummaryCardProps {
  totalTransactions: number;
  totalRevenue: number;
  averageTransactionValue: number;
  onViewReport: () => void;
}

export const POSSummaryCard: React.FC<POSSummaryCardProps> = ({
  totalTransactions,
  totalRevenue,
  averageTransactionValue,
  onViewReport,
}) => {
  // Format date for display
  const getTodayDate = (): string => {
    const today = new Date();
    return today.toLocaleDateString('en-PH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get greeting based on time
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Calculate performance indicators
  const getPerformanceIndicator = (): { text: string; color: string; icon: string } => {
    if (totalTransactions === 0) {
      return { text: 'No sales yet', color: '#6B7280', icon: '⏰' };
    }
    
    const performance = averageTransactionValue >= 100 ? 'excellent' : 
                       averageTransactionValue >= 50 ? 'good' : 'needs improvement';
    
    switch (performance) {
      case 'excellent':
        return { text: 'Excellent', color: '#059669', icon: '🚀' };
      case 'good':
        return { text: 'Good', color: '#3B82F6', icon: '📈' };
      default:
        return { text: 'Improve', color: '#F59E0B', icon: '📊' };
    }
  };

  const performance = getPerformanceIndicator();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.date}>{getTodayDate()}</Text>
        </View>
        <TouchableOpacity style={styles.viewReportButton} onPress={onViewReport}>
          <Text style={styles.viewReportText}>View Report</Text>
        </TouchableOpacity>
      </View>

      {/* Main Stats */}
      <View style={styles.mainStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalTransactions}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
        
        <View style={[styles.statItem, styles.statDivider]}>
          <Text style={styles.statValue}>
            {currencyUtils.formatSimplePHP(totalRevenue)}
          </Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {currencyUtils.formatSimplePHP(averageTransactionValue)}
          </Text>
          <Text style={styles.statLabel}>Avg. Sale</Text>
        </View>
      </View>

      {/* Performance Indicator */}
      <View style={styles.performanceContainer}>
        <View style={styles.performanceLeft}>
          <Text style={styles.performanceIcon}>{performance.icon}</Text>
          <View>
            <Text style={styles.performanceTitle}>Today's Performance</Text>
            <Text style={[styles.performanceValue, { color: performance.color }]}>
              {performance.text}
            </Text>
          </View>
        </View>
        
        {totalRevenue > 0 && (
          <View style={styles.performanceRight}>
            <Text style={styles.growthLabel}>Growth</Text>
            <Text style={styles.growthValue}>+12.5%</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionIcon}>📊</Text>
          <Text style={styles.quickActionText}>Analytics</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionIcon}>📄</Text>
          <Text style={styles.quickActionText}>Receipts</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionIcon}>🔄</Text>
          <Text style={styles.quickActionText}>Sync</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  date: {
    fontSize: 14,
    color: '#6B7280',
  },
  viewReportButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EBF5FF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  viewReportText: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '500',
  },
  mainStats: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  performanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  performanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  performanceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  performanceTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  performanceRight: {
    alignItems: 'flex-end',
  },
  growthLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  growthValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  quickAction: {
    alignItems: 'center',
    padding: 8,
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
});