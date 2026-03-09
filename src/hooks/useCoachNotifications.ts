'use client';

/**
 * useCoachNotifications — Schedules native notifications via Capacitor
 * Uses LocalNotifications.schedule() for timed notifications that fire
 * even when the app is in background or closed.
 * Falls back to in-app toast notifications when Capacitor is unavailable.
 */

import { useEffect, useRef, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';
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

// ─── LocalStorage keys for deduplication ─────────────────
const ACKNOWLEDGED_MILESTONES_KEY = 'cashruler_milestones';
const LAST_MORNING_KEY = 'cashruler_last_morning';
const LAST_EVENING_KEY = 'cashruler_last_evening';
const LAST_NUDGE_KEY = 'cashruler_last_nudge';
const LAST_SCHEDULE_KEY = 'cashruler_last_schedule';
const BUDGET_ALERTS_KEY = 'cashruler_budget_alerts_sent';

function getToday(): string {
    return format(new Date(), 'yyyy-MM-dd');
}

function wasAlreadySentToday(key: string): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(key) === getToday();
}

function markSentToday(key: string) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(key, getToday());
    }
}

// ─── Send notification via Capacitor or fallback to toast ─
async function sendNotification(notif: CoachNotification) {
    if (typeof window === 'undefined') return;

    try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const permResult = await LocalNotifications.checkPermissions();

        if (permResult.display !== 'granted') {
            const reqResult = await LocalNotifications.requestPermissions();
            if (reqResult.display !== 'granted') {
                // Fall back to toast
                toast({ title: notif.title, description: notif.body });
                return;
            }
        }

        await LocalNotifications.schedule({
            notifications: [{
                id: notif.id,
                title: notif.title,
                body: notif.body,
                smallIcon: 'ic_stat_icon',
                largeIcon: 'ic_launcher',
                sound: 'default',
                schedule: notif.scheduleAt ? { at: notif.scheduleAt } : undefined,
            }],
        });
    } catch {
        // Capacitor not available (web) — use toast as fallback
        toast({ title: notif.title, description: notif.body });
    }
}

// ─── Schedule daily notifications (morning + evening) ─────
async function scheduleDailyNotifications(
    morningTime: string,
    eveningTime: string,
    username: string | undefined,
    expenseLimits: import('@/lib/cashruler/types').ExpenseLimit[],
    purchaseGoals: import('@/lib/cashruler/types').PurchaseGoal[],
    getPurchaseGoalContributionsTotal: (id: string) => number,
    todayExpenses: import('@/lib/cashruler/types').Expense[],
) {
    if (typeof window === 'undefined') return;

    try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const permResult = await LocalNotifications.checkPermissions();
        if (permResult.display !== 'granted') return;

        // Cancel existing scheduled notifications (IDs 1001-1003 are coach daily)
        try {
            await LocalNotifications.cancel({ notifications: [{ id: 1001 }, { id: 1002 }, { id: 1003 }] });
        } catch { /* ok */ }

        const now = new Date();
        const today = now.toISOString().slice(0, 10);
        const notifications: Array<{
            id: number;
            title: string;
            body: string;
            smallIcon: string;
            largeIcon: string;
            sound: string;
            schedule: { at: Date; allowWhileIdle: boolean };
        }> = [];

        // ── Morning notification ──
        const [mH, mM] = morningTime.split(':').map(Number);
        const morningDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), mH, mM, 0);
        if (morningDate <= now) morningDate.setDate(morningDate.getDate() + 1);

        const morningNotif = generateMorningNotification(
            username,
            expenseLimits,
            purchaseGoals,
            getPurchaseGoalContributionsTotal,
        );
        notifications.push({
            id: morningNotif.id,
            title: morningNotif.title,
            body: morningNotif.body,
            smallIcon: 'ic_stat_icon',
            largeIcon: 'ic_launcher',
            sound: 'default',
            schedule: { at: morningDate, allowWhileIdle: true },
        });

        // ── Evening notification ──
        const [eH, eM] = eveningTime.split(':').map(Number);
        const eveningDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eH, eM, 0);
        if (eveningDate <= now) eveningDate.setDate(eveningDate.getDate() + 1);

        const eveningNotif = generateEveningNotification(username, todayExpenses);
        notifications.push({
            id: eveningNotif.id,
            title: eveningNotif.title,
            body: eveningNotif.body,
            smallIcon: 'ic_stat_icon',
            largeIcon: 'ic_launcher',
            sound: 'default',
            schedule: { at: eveningDate, allowWhileIdle: true },
        });

        // Schedule all
        if (notifications.length > 0) {
            await LocalNotifications.schedule({ notifications });
            localStorage.setItem(LAST_SCHEDULE_KEY, today);
        }
    } catch (e) {
        console.warn('[Coach] Failed to schedule daily notifications:', e);
    }
}

// ─── Main hook ───────────────────────────────────────────
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
    const hasScheduledRef = useRef(false);

    // ── Schedule daily notifications via Capacitor ──
    const scheduleDaily = useCallback(async () => {
        if (!userSettings.enableCoachNotifications) return;
        if (hasScheduledRef.current) return;

        const today = getToday();
        const lastSchedule = typeof window !== 'undefined' ? localStorage.getItem(LAST_SCHEDULE_KEY) : null;
        if (lastSchedule === today) {
            hasScheduledRef.current = true;
            return; // Already scheduled today
        }

        const todayExpenses = expenses.filter(e => format(parseISO(e.date), 'yyyy-MM-dd') === today);

        await scheduleDailyNotifications(
            userSettings.morningNotificationTime || '07:30',
            userSettings.eveningNotificationTime || '20:00',
            userSettings.username,
            expenseLimits,
            purchaseGoals,
            getPurchaseGoalContributionsTotal,
            todayExpenses,
        );

        hasScheduledRef.current = true;
    }, [userSettings, expenses, expenseLimits, purchaseGoals, getPurchaseGoalContributionsTotal]);

    // ── Check instant notifications (budget alerts, milestones, etc.) ──
    const checkInstantNotifications = useCallback(() => {
        if (!userSettings.enableCoachNotifications) return;
        if (typeof window === 'undefined') return;

        const now = new Date();
        const today = getToday();

        // ── Nudge at 18:00 if no activity ──
        if (userSettings.enableNudgeNotification && !wasAlreadySentToday(LAST_NUDGE_KEY) && now.getHours() >= 18) {
            const hasExpenses = expenses.some(e => format(parseISO(e.date), 'yyyy-MM-dd') === today);
            const hasIncomes = incomes.some(i => format(parseISO(i.date), 'yyyy-MM-dd') === today);
            if (!hasExpenses && !hasIncomes) {
                const notif = generateNudgeNotification(false);
                sendNotification(notif);
                markSentToday(LAST_NUDGE_KEY);
            }
        }

        // ── Real-time budget alerts ──
        if (userSettings.enableRealTimeAlerts) {
            const currentMonth = format(now, 'yyyy-MM');
            const monthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
            const alerts = checkBudgetAlerts(monthExpenses, expenseLimits);

            // Dedup: only send alerts not already sent today
            const sentAlerts: string[] = JSON.parse(localStorage.getItem(BUDGET_ALERTS_KEY + today) || '[]');
            alerts.forEach(a => {
                const key = `${a.title}-${a.body.slice(0, 40)}`;
                if (!sentAlerts.includes(key)) {
                    sendNotification(a);
                    sentAlerts.push(key);
                    localStorage.setItem(BUDGET_ALERTS_KEY + today, JSON.stringify(sentAlerts));
                }
            });
        }

        // ── Recurring transaction reminders ──
        const recurringReminders = checkRecurringReminders(recurringTransactions);
        recurringReminders.forEach(r => sendNotification(r));

        // ── Savings reminders ──
        const savingsReminder = generateSavingsReminder(purchaseGoals, getPurchaseGoalContributionsTotal);
        if (savingsReminder && !wasAlreadySentToday('cashruler_savings_reminder')) {
            sendNotification(savingsReminder);
            markSentToday('cashruler_savings_reminder');
        }

        // ── Milestone checks ──
        const acknowledged: string[] = JSON.parse(localStorage.getItem(ACKNOWLEDGED_MILESTONES_KEY) || '[]');
        const milestone = checkMilestones(purchaseGoals, getPurchaseGoalContributionsTotal, acknowledged);
        if (milestone) {
            sendNotification(milestone);
            const matchGoalThreshold = milestone.body.match(/(\d+)% atteint/);
            if (matchGoalThreshold) {
                const goalId = purchaseGoals.find(g => milestone.body.includes(g.title))?.id;
                if (goalId) {
                    acknowledged.push(`${goalId}-${matchGoalThreshold[1]}`);
                    localStorage.setItem(ACKNOWLEDGED_MILESTONES_KEY, JSON.stringify(acknowledged));
                }
            }
        }
    }, [userSettings, expenses, incomes, expenseLimits, purchaseGoals, recurringTransactions, getPurchaseGoalContributionsTotal]);

    // ── Request permission on mount ──
    useEffect(() => {
        async function requestPermission() {
            try {
                const { LocalNotifications } = await import('@capacitor/local-notifications');
                const result = await LocalNotifications.checkPermissions();
                if (result.display !== 'granted') {
                    await LocalNotifications.requestPermissions();
                }
            } catch {
                // Not on Capacitor — skip
            }
        }
        if (userSettings.enableCoachNotifications) {
            requestPermission();
        }
    }, [userSettings.enableCoachNotifications]);

    // ── Main effect: schedule daily + check instant ──
    useEffect(() => {
        if (!userSettings.enableCoachNotifications) {
            // Cancel all scheduled notifications if coach is disabled
            (async () => {
                try {
                    const { LocalNotifications } = await import('@capacitor/local-notifications');
                    await LocalNotifications.cancel({ notifications: [{ id: 1001 }, { id: 1002 }, { id: 1003 }] });
                } catch { /* ok */ }
            })();
            return;
        }

        // Schedule daily notifications
        scheduleDaily();

        // Check instant notifications after a short delay
        const timeout = setTimeout(checkInstantNotifications, 3000);

        // Re-check every 60 seconds (for nudge, budget alerts, milestones)
        timerRef.current = setInterval(checkInstantNotifications, 60_000);

        return () => {
            clearTimeout(timeout);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [userSettings.enableCoachNotifications, scheduleDaily, checkInstantNotifications]);
}
