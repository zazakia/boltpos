import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, BarChart3 } from 'lucide-react-native';

interface FinancialReportsScreenProps {
  onBack: () => void;
}

export function FinancialReportsScreen({ onBack }: FinancialReportsScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.title}>Financial Reports</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.placeholder}>
          <BarChart3 size={64} color="#9CA3AF" />
          <Text style={styles.placeholderTitle}>Financial Reports Module</Text>
          <Text style={styles.placeholderText}>
            This feature is under development. It will include:
          </Text>
          <Text style={styles.featureList}>
            • Profit & Loss statements{'\n'}
            • Balance sheets{'\n'}
            • Cash flow reports{'\n'}
            • Custom report builder{'\n'}
            • Export to PDF/Excel
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 64,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  featureList: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 24,
  },
});
