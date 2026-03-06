
'use client';

import type { FC } from 'react';
import { useState } from 'react';
import BottomNavigationBar from './BottomNavigationBar';
import PWAInstallPrompt from './PWAInstallPrompt';
import DashboardPage from './DashboardPage';
import TransactionsPage from './TransactionsPage';
import ComptesPage from './ComptesPage';
import StatisticsPage from './StatisticsPage';
import BudgetPage from './BudgetPage';
import SettingsPage from './SettingsPage';
import type { AppActiveTab } from '@/lib/cashruler/types';

const AppClient: FC = () => {
  const [activeTab, setActiveTab] = useState<AppActiveTab>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'budget':
        return <BudgetPage />;
      case 'comptes':
        return <ComptesPage />;
      case 'statistics':
        return <StatisticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-background">
      <main className="flex-1 overflow-y-auto min-h-0">
        {renderContent()}
      </main>
      <PWAInstallPrompt />
      <BottomNavigationBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default AppClient;
