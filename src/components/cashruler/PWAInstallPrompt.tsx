
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // Check if already installed or dismissed recently
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed, 10);
            // Don't show again for 7 days after dismissal
            if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) return;
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if already in standalone mode (already installed)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowBanner(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowBanner(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-16 left-0 right-0 z-50 flex justify-center px-3 animate-in slide-in-from-bottom-4 duration-300">
            <div className="w-full max-w-lg bg-card border border-primary/30 rounded-xl shadow-2xl p-3 flex items-center gap-3">
                <div className="bg-primary/10 rounded-lg p-2 flex-shrink-0">
                    <Download className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Installer CASHRULER</p>
                    <p className="text-xs text-muted-foreground truncate">Accès rapide depuis votre écran d'accueil</p>
                </div>
                <Button size="sm" onClick={handleInstall} className="flex-shrink-0 text-xs px-3">
                    Installer
                </Button>
                <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground p-1 flex-shrink-0">
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
