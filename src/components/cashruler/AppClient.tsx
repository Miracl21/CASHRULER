
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
import CelebrationPopup from './CelebrationPopup';
import type { AppActiveTab } from '@/lib/cashruler/types';
import { useCoachNotifications } from '@/hooks/useCoachNotifications';
import { useCelebrations } from '@/hooks/useCelebrations';

const AppClient: FC = () => {
  const [activeTab, setActiveTab] = useState<AppActiveTab>('dashboard');

  // Coach notifications — always active regardless of which tab is showing
  useCoachNotifications();

  // In-app celebration popups
  const { current: celebration, dismissCurrent: dismissCelebration } = useCelebrations();

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
    <div className="flex flex-col h-dvh gradient-bg" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <div key={activeTab} className="animate-fade-in h-full">
          {renderContent()}
        </div>
      </main>
      <PWAInstallPrompt />
      <BottomNavigationBar activeTab={activeTab} onTabChange={setActiveTab} />
      <CelebrationPopup data={celebration} onClose={dismissCelebration} />
    </div>
  );
};

export default AppClient;
