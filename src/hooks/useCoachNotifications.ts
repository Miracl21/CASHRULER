'use client';

/**
 * useCoachNotifications — Complete notification system via Capacitor
 *
 * Key points:
 * 1. Creates an Android notification channel WITH sound + vibration
 * 2. Schedules daily morning/evening notifications
 * 3. Fires instant alerts for budget, milestones, etc.
 * 4. Lives in AppClient (always mounted)
 */

import { useEffect, useRef, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';
import type { Expense, ExpenseLimit, PurchaseGoal } from '@/lib/cashruler/types';
import {
    generateMorningNotification,
    generateEveningNotification,
    generateNudgeNotification,
    checkBudgetAlerts,
    checkRecurringReminders,
    generateSavingsReminder,
    checkMilestones,
    type CoachNotification,
} from '@/lib/cashruler/coach-engine';

// ─── Constants ───────────────────────────────────────────
const CHANNEL_ID = 'cashruler_coach';
const MILESTONES_KEY = 'cashruler_milestones';
const LAST_NUDGE_KEY = 'cashruler_last_nudge';
const LAST_SCHEDULE_KEY = 'cashruler_last_schedule';
const BUDGET_ALERTS_KEY = 'cashruler_budget_alerts_';
const SAVINGS_KEY = 'cashruler_savings_reminder';
const NOTIF_CONFIRMED_KEY = 'cashruler_notif_confirmed';

function getToday(): string {
    return format(new Date(), 'yyyy-MM-dd');
}

function wasSentToday(key: string): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(key) === getToday();
}

function markSent(key: string) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(key, getToday());
    }
}

// ─── Create notification channel (Android 8+) ──────────
// This is THE critical piece: without a channel with sound+vibration,
// Android will show silent notifications or not show them at all.
async function ensureNotificationChannel() {
    try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');

        await LocalNotifications.createChannel({
            id: CHANNEL_ID,
            name: 'Coach Financier',
            description: 'Notifications du coach financier CASHRULER',
            importance: 5, // MAX — heads-up + sound + vibration
            visibility: 1, // PUBLIC
            sound: 'default',
            vibration: true,
            lights: true,
            lightColor: '#10b981',
        });

        return true;
    } catch {
        return false;
    }
}

// ─── Send a notification immediately ────────────────────
async function fireNotification(notif: CoachNotification) {
    if (typeof window === 'undefined') return;

    try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') return;

        await LocalNotifications.schedule({
            notifications: [{
                id: notif.id,
                title: notif.title,
                body: notif.body,
                channelId: CHANNEL_ID,
                smallIcon: 'ic_stat_icon',
                largeIcon: 'ic_launcher',
                sound: 'default',
            }],
        });
    } catch {
        // Web fallback
        toast({ title: notif.title, description: notif.body });
    }
}

// ─── Schedule a notification for a future time ──────────
async function scheduleNotification(notif: CoachNotification, at: Date) {
    try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') return;

        await LocalNotifications.schedule({
            notifications: [{
                id: notif.id,
                title: notif.title,
                body: notif.body,
                channelId: CHANNEL_ID,
                smallIcon: 'ic_stat_icon',
                largeIcon: 'ic_launcher',
                sound: 'default',
                schedule: {
                    at,
                    allowWhileIdle: true,
                },
            }],
        });
    } catch {
        // Silently fail on web
    }
}

// ─── Cancel specific notification IDs ───────────────────
async function cancelNotifications(ids: number[]) {
    try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.cancel({
            notifications: ids.map(id => ({ id })),
        });
    } catch { /* ok */ }
}

// ─── Schedule daily morning + evening ───────────────────
async function scheduleDailyPair(
    morningTime: string,
    eveningTime: string,
    username: string | undefined,
    expenseLimits: ExpenseLimit[],
    purchaseGoals: PurchaseGoal[],
    getTotal: (id: string) => number,
    todayExpenses: Expense[],
) {
    // Cancel previous daily notifications
    await cancelNotifications([1001, 1002]);

    const now = new Date();

    // ── Morning ──
    const [mH, mM] = morningTime.split(':').map(Number);
    const morningAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), mH, mM, 0);
    if (morningAt <= now) morningAt.setDate(morningAt.getDate() + 1);

    const morningNotif = generateMorningNotification(username, expenseLimits, purchaseGoals, getTotal);
    await scheduleNotification(morningNotif, morningAt);

    // ── Evening ──
    const [eH, eM] = eveningTime.split(':').map(Number);
    const eveningAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eH, eM, 0);
    if (eveningAt <= now) eveningAt.setDate(eveningAt.getDate() + 1);

    const eveningNotif = generateEveningNotification(username, todayExpenses);
    await scheduleNotification(eveningNotif, eveningAt);

    localStorage.setItem(LAST_SCHEDULE_KEY, getToday());
}

// ═══════════════════════════════════════════════════════════
// ═══ MAIN HOOK ════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
export function useCoachNotifications() {
    const {
        userSettings,
        expenses,
        incomes,
        expenseLimits,
        purchaseGoals,
        recurringTransactions,
        getPurchaseGoalContributionsTotal,
    } = useAppContext();

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const initDoneRef = useRef(false);

    // ── 1. Initialize: request permission, create channel, confirm ──
    useEffect(() => {
        if (!userSettings.enableCoachNotifications) return;

        async function init() {
            if (initDoneRef.current) return;

            try {
                const { LocalNotifications } = await import('@capacitor/local-notifications');

                // Request permission
                let perm = await LocalNotifications.checkPermissions();
                if (perm.display !== 'granted') {
                    perm = await LocalNotifications.requestPermissions();
                }
                if (perm.display !== 'granted') return;

                // Create channel with sound + vibration
                await ensureNotificationChannel();

                // Send confirmation notification (once)
                if (!localStorage.getItem(NOTIF_CONFIRMED_KEY)) {
                    await LocalNotifications.schedule({
                        notifications: [{
                            id: 9999,
                            title: 'CASHRULER — Coach activé !',
                            body: 'Vous recevrez des rappels matin et soir. Son et vibration activés.',
                            channelId: CHANNEL_ID,
                            smallIcon: 'ic_stat_icon',
                            largeIcon: 'ic_launcher',
                            sound: 'default',
                        }],
                    });
                    localStorage.setItem(NOTIF_CONFIRMED_KEY, 'true');
                }

                initDoneRef.current = true;
            } catch {
                // Not Capacitor
            }
        }

        init();
    }, [userSettings.enableCoachNotifications]);

    // ── 2. Schedule daily notifications ──
    const scheduleDaily = useCallback(async () => {
        if (!userSettings.enableCoachNotifications) return;
        if (typeof window === 'undefined') return;

        const today = getToday();
        if (localStorage.getItem(LAST_SCHEDULE_KEY) === today) return;

        const todayExpenses = expenses.filter(e => format(parseISO(e.date), 'yyyy-MM-dd') === today);

        await scheduleDailyPair(
            userSettings.morningNotificationTime || '07:30',
            userSettings.eveningNotificationTime || '20:00',
            userSettings.username,
            expenseLimits,
            purchaseGoals,
            getPurchaseGoalContributionsTotal,
            todayExpenses,
        );
    }, [userSettings, expenses, expenseLimits, purchaseGoals, getPurchaseGoalContributionsTotal]);

    // ── 3. Check instant notifications ──
    const checkInstant = useCallback(() => {
        if (!userSettings.enableCoachNotifications) return;
        if (typeof window === 'undefined') return;

        const now = new Date();
        const today = getToday();

        // Nudge at 18:00
        if (userSettings.enableNudgeNotification && !wasSentToday(LAST_NUDGE_KEY) && now.getHours() >= 18) {
            const hasActivity = expenses.some(e => format(parseISO(e.date), 'yyyy-MM-dd') === today)
                || incomes.some(i => format(parseISO(i.date), 'yyyy-MM-dd') === today);
            if (!hasActivity) {
                fireNotification(generateNudgeNotification(false));
                markSent(LAST_NUDGE_KEY);
            }
        }

        // Budget alerts
        if (userSettings.enableRealTimeAlerts) {
            const currentMonth = format(now, 'yyyy-MM');
            const monthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
            const alerts = checkBudgetAlerts(monthExpenses, expenseLimits);

            const sentKey = BUDGET_ALERTS_KEY + today;
            const sent: string[] = JSON.parse(localStorage.getItem(sentKey) || '[]');
            for (const a of alerts) {
                const sig = `${a.body.slice(0, 30)}`;
                if (!sent.includes(sig)) {
                    fireNotification(a);
                    sent.push(sig);
                    localStorage.setItem(sentKey, JSON.stringify(sent));
                }
            }
        }

        // Recurring reminders
        const recurring = checkRecurringReminders(recurringTransactions);
        for (const r of recurring) {
            fireNotification(r);
        }

        // Savings reminders
        const savings = generateSavingsReminder(purchaseGoals, getPurchaseGoalContributionsTotal);
        if (savings && !wasSentToday(SAVINGS_KEY)) {
            fireNotification(savings);
            markSent(SAVINGS_KEY);
        }

        // Milestones
        const acked: string[] = JSON.parse(localStorage.getItem(MILESTONES_KEY) || '[]');
        const milestone = checkMilestones(purchaseGoals, getPurchaseGoalContributionsTotal, acked);
        if (milestone) {
            fireNotification(milestone);
            const match = milestone.body.match(/(\d+)% atteint/);
            if (match) {
                const goalId = purchaseGoals.find(g => milestone.body.includes(g.title))?.id;
                if (goalId) {
                    acked.push(`${goalId}-${match[1]}`);
                    localStorage.setItem(MILESTONES_KEY, JSON.stringify(acked));
                }
            }
        }
    }, [userSettings, expenses, incomes, expenseLimits, purchaseGoals, recurringTransactions, getPurchaseGoalContributionsTotal]);

    // ── 4. Main scheduler effect ──
    useEffect(() => {
        if (!userSettings.enableCoachNotifications) {
            // Coach disabled: cancel scheduled notifications
            cancelNotifications([1001, 1002, 1003]);
            return;
        }

        // Schedule daily pair
        scheduleDaily();

        // Check instant notifications after 3s then every 60s
        const timeout = setTimeout(checkInstant, 3000);
        timerRef.current = setInterval(checkInstant, 60_000);

        return () => {
            clearTimeout(timeout);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [userSettings.enableCoachNotifications, scheduleDaily, checkInstant]);
}
