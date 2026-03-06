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
    <nav className="bg-card border-t border-border shadow-md flex-shrink-0">
      <div className="flex justify-around items-center h-14 pb-[env(safe-area-inset-bottom)]">
        {NAVIGATION_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center p-1.5 rounded-lg transition-colors duration-200 flex-1 min-w-0",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={cn("h-5 w-5 mb-0.5", isActive ? "text-primary" : "")} />
              <span className={cn("text-[10px] font-medium truncate w-full text-center", isActive ? "text-primary" : "")}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigationBar;
