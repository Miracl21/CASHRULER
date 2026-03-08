'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppClient from '@/components/cashruler/AppClient';
import AuthPage from '@/components/cashruler/AuthPage';
import OnboardingScreen from '@/components/cashruler/OnboardingScreen';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if onboarding has been completed
    const done = localStorage.getItem('cashruler_onboarding_done');
    setShowOnboarding(!done);
  }, []);

  // Wait for onboarding check
  if (showOnboarding === null || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-2xl font-bold text-white">CR</span>
          </div>
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // Show onboarding on first launch
  if (showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
  }

  if (!user) {
    return <AuthPage />;
  }

  return <AppClient />;
}
