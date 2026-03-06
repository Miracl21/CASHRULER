'use client';

import type { FC } from 'react';
import { NAVIGATION_TABS } from '@/lib/cashruler/constants';
import type { AppActiveTab } from '@/lib/cashruler/types';
import { cn } from '@/lib/utils';

interface BottomNavigationBarProps {
  activeTab: AppActiveTab;
  onTabChange: (tab: AppActiveTab) => void;
}

const BottomNavigationBar: FC<BottomNavigationBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="bg-card border-t border-border shadow-md">
      <div className="flex justify-around items-center h-16">
        {NAVIGATION_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 w-1/4",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={cn("h-6 w-6 mb-1", isActive ? "text-primary" : "")} />
              <span className={cn("text-xs font-medium", isActive ? "text-primary" : "")}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigationBar;
