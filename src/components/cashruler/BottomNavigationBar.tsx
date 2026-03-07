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
    <nav className="glass flex-shrink-0 border-t-0" style={{ borderTop: 'none' }}>
      <div className="flex justify-around items-center h-16 pb-[env(safe-area-inset-bottom)] px-2">
        {NAVIGATION_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-300 flex-1 min-w-0 press-scale relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Active pill indicator */}
              {isActive && (
                <span className="absolute top-0.5 w-8 h-1 rounded-full bg-primary animate-scale-in" />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 mb-0.5 transition-all duration-300",
                  isActive ? "text-primary scale-110" : ""
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold truncate w-full text-center transition-all duration-300",
                  isActive ? "text-primary" : ""
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigationBar;
