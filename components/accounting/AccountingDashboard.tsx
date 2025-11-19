import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { DollarSign, TrendingUp, FileText, AlertCircle } from 'lucide-react-native';

interface AccountingDashboardProps {
  onNavigateToAP: () => void;
  onNavigateToAR: () => void;
  onNavigateToExpenses: () => void;
  onNavigateToReports: () => void;
}

export function AccountingDashboard({
  onNavigateToAP,
  onNavigateToAR,
  onNavigateToExpenses,
  onNavigateToReports,
}: AccountingDashboardProps) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Accounting Dashboard</Text>
        <Text style={styles.subtitle}>Financial overview and management</Text>
      </View>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.card} onPress={onNavigateToAP}>
          <DollarSign size={32} color="#EF4444" />
          <Text style={styles.cardTitle}>Accounts Payable</Text>
          <Text style={styles.cardValue}>Coming Soon</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={onNavigateToAR}>
          <TrendingUp size={32} color="#10B981" />
          <Text style={styles.cardTitle}>Accounts Receivable</Text>
          <Text style={styles.cardValue}>Coming Soon</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={onNavigateToExpenses}>
          <FileText size={32} color="#F59E0B" />
          <Text style={styles.cardTitle}>Expense Management</Text>
          <Text style={styles.cardValue}>Coming Soon</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={onNavigateToReports}>
          <AlertCircle size={32} color="#3B82F6" />
          <Text style={styles.cardTitle}>Financial Reports</Text>
          <Text style={styles.cardValue}>Coming Soon</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.notice}>
        <AlertCircle size={20} color="#6B7280" />
        <Text style={styles.noticeText}>
          This is a placeholder component. Full accounting features will be implemented soon.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
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
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
    textAlign: 'center',
  },
  cardValue: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
  },
});
