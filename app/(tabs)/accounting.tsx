// Main Accounting Screen for InventoryPro
// Central hub for all accounting and financial management functions

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AccountingDashboard } from '@/components/accounting/AccountingDashboard';
import { AccountsPayableScreen } from '@/components/accounting/AccountsPayableScreen';
import { AccountsReceivableScreen } from '@/components/accounting/AccountsReceivableScreen';
import { ExpenseManagementScreen } from '@/components/accounting/ExpenseManagementScreen';
import { FinancialReportsScreen } from '@/components/accounting/FinancialReportsScreen';

type AccountingView = 'dashboard' | 'ap' | 'ar' | 'expenses' | 'reports';

export default function AccountingScreen() {
  const [currentView, setCurrentView] = useState<AccountingView>('dashboard');

  // Navigation handlers for different accounting views
  const handleNavigation = (view: AccountingView) => {
    setCurrentView(view);
  };

  // Render the appropriate accounting component based on current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <AccountingDashboard
            onNavigateToAP={() => handleNavigation('ap')}
            onNavigateToAR={() => handleNavigation('ar')}
            onNavigateToExpenses={() => handleNavigation('expenses')}
            onNavigateToReports={() => handleNavigation('reports')}
          />
        );
      case 'ap':
        return (
          <AccountsPayableScreen
            onBack={() => handleNavigation('dashboard')}
          />
        );
      case 'ar':
        return (
          <AccountsReceivableScreen
            onBack={() => handleNavigation('dashboard')}
          />
        );
      case 'expenses':
        return (
          <ExpenseManagementScreen
            onBack={() => handleNavigation('dashboard')}
          />
        );
      case 'reports':
        return (
          <FinancialReportsScreen
            onBack={() => handleNavigation('dashboard')}
          />
        );
      default:
        return (
          <AccountingDashboard
            onNavigateToAP={() => handleNavigation('ap')}
            onNavigateToAR={() => handleNavigation('ar')}
            onNavigateToExpenses={() => handleNavigation('expenses')}
            onNavigateToReports={() => handleNavigation('reports')}
          />
        );
    }
  };

  return (
    <View style={{flex: 1}}>
      {renderCurrentView()}
    </View>
  );
}