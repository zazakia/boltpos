// Main Accounting Screen for InventoryPro
// Central hub for all accounting and financial management functions

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AccountingDashboard } from '@/components/accounting/AccountingDashboard';
import { AccountsPayableScreen } from '@/components/accounting/AccountsPayableScreen';
import { AccountsReceivableScreen } from '@/components/accounting/AccountsReceivableScreen';
import { ExpenseManagementScreen } from '@/components/accounting/ExpenseManagementScreen';
import { FinancialReportsScreen } from '@/components/accounting/FinancialReportsScreen';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { usePermissions } from '@/hooks/usePermissions';

type AccountingView = 'dashboard' | 'ap' | 'ar' | 'expenses' | 'reports';

export default function AccountingScreen() {
  const [currentView, setCurrentView] = useState<AccountingView>('dashboard');
  const { hasPermission, hasAnyPermission } = usePermissions();

  // Permission checks for accounting functions
  const canViewAccounting = hasPermission('VIEW_ACCOUNTING');
  const canViewPayables = hasPermission('VIEW_ACCOUNTS_PAYABLE');
  const canViewReceivables = hasPermission('VIEW_ACCOUNTS_RECEIVABLE');
  const canManageExpenses = hasPermission('MANAGE_EXPENSES');
  const canViewFinancialReports = hasPermission('VIEW_FINANCIAL_REPORTS');

  // Navigation handlers for different accounting views
  const handleNavigation = (view: AccountingView) => {
    // Check permissions before allowing navigation
    switch (view) {
      case 'ap':
        if (!canViewPayables) return;
        break;
      case 'ar':
        if (!canViewReceivables) return;
        break;
      case 'expenses':
        if (!canManageExpenses) return;
        break;
      case 'reports':
        if (!canViewFinancialReports) return;
        break;
    }
    setCurrentView(view);
  };

  // Render the appropriate accounting component based on current view
  const renderCurrentView = () => {
    // If no accounting view permission, return dashboard with access restrictions
    if (!canViewAccounting) {
      return (
        <AccountingDashboard
          onNavigateToAP={() => {}}
          onNavigateToAR={() => {}}
          onNavigateToExpenses={() => {}}
          onNavigateToReports={() => {}}
        />
      );
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <PermissionGuard
            permission="VIEW_ACCOUNTING"
            fallback="You don't have permission to access the accounting dashboard.">
            <AccountingDashboard
              onNavigateToAP={() => handleNavigation('ap')}
              onNavigateToAR={() => handleNavigation('ar')}
              onNavigateToExpenses={() => handleNavigation('expenses')}
              onNavigateToReports={() => handleNavigation('reports')}
            />
          </PermissionGuard>
        );
      case 'ap':
        return (
          <PermissionGuard
            permission="VIEW_ACCOUNTS_PAYABLE"
            fallback="You don't have permission to view accounts payable.">
            <AccountsPayableScreen
              onBack={() => handleNavigation('dashboard')}
            />
          </PermissionGuard>
        );
      case 'ar':
        return (
          <PermissionGuard
            permission="VIEW_ACCOUNTS_RECEIVABLE"
            fallback="You don't have permission to view accounts receivable.">
            <AccountsReceivableScreen
              onBack={() => handleNavigation('dashboard')}
            />
          </PermissionGuard>
        );
      case 'expenses':
        return (
          <PermissionGuard
            permission="MANAGE_EXPENSES"
            fallback="You don't have permission to manage expenses.">
            <ExpenseManagementScreen
              onBack={() => handleNavigation('dashboard')}
            />
          </PermissionGuard>
        );
      case 'reports':
        return (
          <PermissionGuard
            permission="VIEW_FINANCIAL_REPORTS"
            fallback="You don't have permission to view financial reports.">
            <FinancialReportsScreen
              onBack={() => handleNavigation('dashboard')}
            />
          </PermissionGuard>
        );
      default:
        return (
          <PermissionGuard
            permission="VIEW_ACCOUNTING"
            fallback="You don't have permission to access the accounting dashboard.">
            <AccountingDashboard
              onNavigateToAP={() => handleNavigation('ap')}
              onNavigateToAR={() => handleNavigation('ar')}
              onNavigateToExpenses={() => handleNavigation('expenses')}
              onNavigateToReports={() => handleNavigation('reports')}
            />
          </PermissionGuard>
        );
    }
  };

  return (
    <PermissionGuard
      permission={[
        'VIEW_ACCOUNTING',
        'VIEW_ACCOUNTS_PAYABLE',
        'VIEW_ACCOUNTS_RECEIVABLE',
        'MANAGE_EXPENSES',
        'VIEW_FINANCIAL_REPORTS'
      ]}
      fallback="You don't have permission to access accounting functions."
      requiresAll={false}>
      <View style={{flex: 1}}>
        {renderCurrentView()}
      </View>
    </PermissionGuard>
  );
}