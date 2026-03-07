/**
 * Haptic Feedback Utility — Capacitor-first with web fallback
 */

import { Haptics, ImpactStyle } from '@capacitor/haptics';

async function tryHaptic(fn: () => Promise<void>, fallbackMs: number): Promise<void> {
    try {
        await fn();
    } catch {
        // Fallback to navigator.vibrate if available
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(fallbackMs);
        }
    }
}

export async function hapticLight(): Promise<void> {
    await tryHaptic(() => Haptics.impact({ style: ImpactStyle.Light }), 10);
}

export async function hapticMedium(): Promise<void> {
    await tryHaptic(() => Haptics.impact({ style: ImpactStyle.Medium }), 20);
}

export async function hapticHeavy(): Promise<void> {
    await tryHaptic(() => Haptics.impact({ style: ImpactStyle.Heavy }), 40);
}

export async function hapticNotification(): Promise<void> {
    await tryHaptic(() => Haptics.notification({ type: 'SUCCESS' as never }), 30);
}
