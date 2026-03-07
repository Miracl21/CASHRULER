/**
 * Haptic feedback utility for Capacitor integration.
 * Currently uses CSS animations as fallback. When migrating to Capacitor,
 * replace these with Capacitor Haptics API calls.
 *
 * Usage: import { hapticLight, hapticMedium, hapticHeavy } from '@/lib/cashruler/haptics';
 *        hapticLight(); // on button press
 *        hapticMedium(); // on toggle
 *        hapticHeavy(); // on delete
 */

type HapticStyle = 'light' | 'medium' | 'heavy';

function triggerHaptic(style: HapticStyle) {
    // Check if Capacitor Haptics is available
    if (typeof window !== 'undefined' && (window as any).Capacitor?.Plugins?.Haptics) {
        const Haptics = (window as any).Capacitor.Plugins.Haptics;
        switch (style) {
            case 'light':
                Haptics.impact({ style: 'LIGHT' });
                break;
            case 'medium':
                Haptics.impact({ style: 'MEDIUM' });
                break;
            case 'heavy':
                Haptics.impact({ style: 'HEAVY' });
                break;
        }
        return;
    }

    // Fallback: use navigator.vibrate if available (Android Chrome)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        switch (style) {
            case 'light':
                navigator.vibrate(10);
                break;
            case 'medium':
                navigator.vibrate(25);
                break;
            case 'heavy':
                navigator.vibrate([50, 30, 50]);
                break;
        }
    }
}

export const hapticLight = () => triggerHaptic('light');
export const hapticMedium = () => triggerHaptic('medium');
export const hapticHeavy = () => triggerHaptic('heavy');
