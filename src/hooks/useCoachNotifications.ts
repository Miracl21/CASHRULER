'use client';

/**
 * useCoachNotifications — Schedules and sends coach notifications
 * Uses Notification API (PWA) with future Capacitor LocalNotifications support.
 */

import { useEffect, useRef, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { useAppContext } from '@/contexts/AppContext';
import {
    generateMorningNotification,
    generateEveningNotification,
    generateNudgeNotification,
    checkBudgetAlerts,
    checkRecurringReminders,
    generateSavingsReminder,
    checkMilestones,
    getNextScheduleTime,
    type CoachNotification,
} from '@/lib/cashruler/coach-engine';

// Local storage keys
const ACKNOWLEDGED_MILESTONES_KEY = 'cashruler_milestones';
const LAST_MORNING_KEY = 'cashruler_last_morning';
const LAST_EVENING_KEY = 'cashruler_last_evening';
const LAST_NUDGE_KEY = 'cashruler_last_nudge';

function sendWebNotification(notif: CoachNotification) {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    try {
        new Notification(notif.title, {
            body: notif.body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-72.png',
            tag: `cashruler-${notif.type}-${notif.id}`,
        });
    } catch (e) {
        console.error('Notification error:', e);
    }
}

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

    const checkAndSend = useCallback(() => {
        if (!userSettings.enableCoachNotifications) return;
        if (typeof window === 'undefined') return;
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const today = getToday();

        // Parse configured times
        const [morningH, morningM] = (userSettings.morningNotificationTime || '07:30').split(':').map(Number);
        const [eveningH, eveningM] = (userSettings.eveningNotificationTime || '20:00').split(':').map(Number);

        // ── Morning notification ──
        if (!wasAlreadySentToday(LAST_MORNING_KEY) && currentHour === morningH && currentMinute >= morningM) {
            const notif = generateMorningNotification(
                userSettings.username,
                expenseLimits,
                purchaseGoals,
                getPurchaseGoalContributionsTotal,
            );
            sendWebNotification(notif);
            markSentToday(LAST_MORNING_KEY);
        }

        // ── Evening notification ──
        if (!wasAlreadySentToday(LAST_EVENING_KEY) && currentHour === eveningH && currentMinute >= eveningM) {
            const todayExpenses = expenses.filter(e => format(parseISO(e.date), 'yyyy-MM-dd') === today);
            const notif = generateEveningNotification(userSettings.username, todayExpenses);
            sendWebNotification(notif);
            markSentToday(LAST_EVENING_KEY);
        }

        // ── Nudge at 18:00 if no activity ──
        if (userSettings.enableNudgeNotification && !wasAlreadySentToday(LAST_NUDGE_KEY) && currentHour >= 18) {
            const hasExpenses = expenses.some(e => format(parseISO(e.date), 'yyyy-MM-dd') === today);
            const hasIncomes = incomes.some(i => format(parseISO(i.date), 'yyyy-MM-dd') === today);
            if (!hasExpenses && !hasIncomes) {
                const notif = generateNudgeNotification(false);
                sendWebNotification(notif);
                markSentToday(LAST_NUDGE_KEY);
            }
        }

        // ── Real-time budget alerts (check every cycle) ──
        if (userSettings.enableRealTimeAlerts) {
            const currentMonth = format(now, 'yyyy-MM');
            const monthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
            const alerts = checkBudgetAlerts(monthExpenses, expenseLimits);
            alerts.forEach(a => sendWebNotification(a));
        }

        // ── Recurring transaction reminders ──
        const recurringReminders = checkRecurringReminders(recurringTransactions);
        recurringReminders.forEach(r => sendWebNotification(r));

        // ── Savings reminders ──
        const savingsReminder = generateSavingsReminder(purchaseGoals, getPurchaseGoalContributionsTotal);
        if (savingsReminder) sendWebNotification(savingsReminder);

        // ── Milestone checks ──
        const acknowledged: string[] = JSON.parse(localStorage.getItem(ACKNOWLEDGED_MILESTONES_KEY) || '[]');
        const milestone = checkMilestones(purchaseGoals, getPurchaseGoalContributionsTotal, acknowledged);
        if (milestone) {
            sendWebNotification(milestone);
            // Ack the milestone to avoid repeat
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

    useEffect(() => {
        // Check immediately on mount
        const timeout = setTimeout(checkAndSend, 3000);

        // Then check every 60 seconds
        timerRef.current = setInterval(checkAndSend, 60_000);

        return () => {
            clearTimeout(timeout);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [checkAndSend]);
}
