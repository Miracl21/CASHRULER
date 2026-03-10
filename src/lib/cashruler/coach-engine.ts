/**
 * Coach Financier — Engine de génération de messages
 * Messages courts et lisibles pour les notifications Android.
 */

import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, differenceInDays, startOfToday } from 'date-fns';
import type { Expense, ExpenseLimit, PurchaseGoal, RecurringTransaction } from './types';
import { CURRENCY_SYMBOL, EXPENSE_CATEGORIES, PREDEFINED_COMPTE_COURANT_ID } from './constants';

// ─── Types ──────────────────────────────────────────────
export interface CoachNotification {
    id: number;
    title: string;
    body: string;
    scheduleAt?: Date;
    type: 'morning' | 'evening' | 'nudge' | 'budget_alert' | 'savings_reminder' | 'weekly_report' | 'milestone' | 'recurring_reminder' | 'streak';
}

// ─── Phrases courtes ────────────────────────────────────
const MORNING_TIPS = [
    'Ouvrez CASHRULER avant chaque achat !',
    'Vérifiez vos limites avant de sortir.',
    'Votre objectif du jour : 0 dépense inutile.',
    'Consultez votre budget avant midi.',
    'Posez-vous la question : "En ai-je vraiment besoin ?"',
];
const EVENING_TIPS = [
    'Ouvrez l\'app et vérifiez vos entrées.',
    'Prenez 30 secondes pour tout enregistrer.',
    'Un rapide bilan vous gardera en contrôle.',
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── 1. Morning Notification ────────────────────────────
export function generateMorningNotification(
    username: string | undefined,
    expenseLimits: ExpenseLimit[],
    purchaseGoals: PurchaseGoal[],
    getPurchaseGoalContributionsTotal: (id: string) => number,
): CoachNotification {
    const name = username || 'Champion';
    const parts: string[] = [];

    parts.push(`Bonjour ${name} !`);

    if (expenseLimits.length > 0) {
        const first = expenseLimits[0];
        const label = EXPENSE_CATEGORIES.find(c => c.name === first.category)?.label || first.category;
        parts.push(`Limite ${label}: ${first.dailyAmount.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL}/jour.`);
    }

    const activeGoals = purchaseGoals.filter(g => getPurchaseGoalContributionsTotal(g.id) < g.targetAmount);
    if (activeGoals.length > 0) {
        const g = activeGoals[0];
        const remaining = g.targetAmount - getPurchaseGoalContributionsTotal(g.id);
        parts.push(`${g.title}: encore ${remaining.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL}.`);
    }

    parts.push(pick(MORNING_TIPS));

    return {
        id: 1001,
        title: 'CASHRULER — Votre plan du jour',
        body: parts.join(' '),
        type: 'morning',
    };
}

// ─── 2. Evening Notification ────────────────────────────
export function generateEveningNotification(
    username: string | undefined,
    todayExpenses: Expense[],
): CoachNotification {
    const name = username || 'Champion';
    const total = todayExpenses.reduce((s, e) => s + e.amount, 0);
    const count = todayExpenses.length;

    let body: string;
    if (count === 0) {
        body = `Bonsoir ${name} ! Aucune dépense aujourd'hui. ${pick(EVENING_TIPS)}`;
    } else {
        body = `Bonsoir ${name} ! ${count} dépense${count > 1 ? 's' : ''} pour ${total.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL}. ${pick(EVENING_TIPS)}`;
    }

    return { id: 1002, title: 'CASHRULER — Bilan du jour', body, type: 'evening' };
}

// ─── 3. Nudge Notification ──────────────────────────────
export function generateNudgeNotification(hasActivityToday: boolean): CoachNotification {
    const body = hasActivityToday
        ? 'Bien joué ! Vous êtes discipliné. Continuez demain aussi.'
        : 'Rien enregistré aujourd\'hui. Ouvrez CASHRULER pour mettre à jour.';

    return { id: 1003, title: 'CASHRULER — Rappel', body, type: 'nudge' };
}

// ─── 4. Streak Calculator ───────────────────────────────
export function calculateStreak(
    expenses: Expense[],
    expenseLimits: ExpenseLimit[],
): { days: number; message: string } {
    const today = startOfToday();
    let streak = 0;

    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today.getTime() - i * 86400000);
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        const dayExpenses = expenses.filter(e => format(parseISO(e.date), 'yyyy-MM-dd') === dateStr);

        if (i === 0) { streak++; continue; }

        if (dayExpenses.length > 0) {
            const allOk = expenseLimits.length === 0 || expenseLimits.every(limit => {
                const spent = dayExpenses
                    .filter(e => e.category === limit.category && e.sourceCompteId === PREDEFINED_COMPTE_COURANT_ID)
                    .reduce((s, e) => s + e.amount, 0);
                return spent <= limit.dailyAmount;
            });
            if (allOk) streak++; else break;
        } else {
            break;
        }
    }

    let message: string;
    if (streak >= 30) message = `${streak} jours de discipline ! Incroyable !`;
    else if (streak >= 14) message = `${streak} jours ! Impressionnant !`;
    else if (streak >= 7) message = `${streak} jours ! Belle semaine !`;
    else if (streak >= 3) message = `${streak} jours de suite !`;
    else message = `${streak} jour${streak > 1 ? 's' : ''}`;

    return { days: streak, message };
}

// ─── 5. Weekly Report ───────────────────────────────────
export function generateWeeklyReport(
    expenses: Expense[],
    expenseLimits: ExpenseLimit[],
): CoachNotification {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    const weekExpenses = expenses.filter(e => {
        const d = parseISO(e.date);
        return isWithinInterval(d, { start: weekStart, end: weekEnd });
    });

    const totalSpent = weekExpenses.reduce((s, e) => s + e.amount, 0);
    const totalLimits = expenseLimits.length;

    let body = `Semaine: ${totalSpent.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL} dépensés.`;
    if (totalLimits > 0) {
        const limitsRespected = expenseLimits.filter(limit => {
            const spent = weekExpenses
                .filter(e => e.category === limit.category)
                .reduce((s, e) => s + e.amount, 0);
            return spent <= limit.dailyAmount * 7;
        }).length;
        body += ` ${limitsRespected}/${totalLimits} limites respectées.`;
    }

    return { id: 1005, title: 'CASHRULER — Rapport hebdo', body, type: 'weekly_report' };
}

// ─── 6. Budget Alerts (80% / 100%) ──────────────────────
export function checkBudgetAlerts(
    allExpensesThisMonth: Expense[],
    expenseLimits: ExpenseLimit[],
): CoachNotification[] {
    const alerts: CoachNotification[] = [];
    let idCounter = 2000;

    expenseLimits.forEach(limit => {
        const spent = allExpensesThisMonth
            .filter(e => e.category === limit.category && e.sourceCompteId === PREDEFINED_COMPTE_COURANT_ID)
            .reduce((s, e) => s + e.amount, 0);

        const monthlyLimit = limit.dailyAmount * 30;
        if (monthlyLimit === 0) return;
        const pct = (spent / monthlyLimit) * 100;
        const catLabel = EXPENSE_CATEGORIES.find(c => c.name === limit.category)?.label || limit.category;

        if (pct >= 100) {
            alerts.push({
                id: idCounter++,
                title: 'CASHRULER — Limite dépassée !',
                body: `${catLabel}: ${Math.round(pct)}% utilisé (${spent.toLocaleString('fr-FR')}/${monthlyLimit.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL}). Attention !`,
                type: 'budget_alert',
            });
        } else if (pct >= 80) {
            alerts.push({
                id: idCounter++,
                title: 'CASHRULER — Alerte budget',
                body: `${catLabel}: ${Math.round(pct)}% utilisé (${spent.toLocaleString('fr-FR')}/${monthlyLimit.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL}). Prudence !`,
                type: 'budget_alert',
            });
        }
    });

    return alerts;
}

// ─── 7. Savings Reminder ────────────────────────────────
export function generateSavingsReminder(
    purchaseGoals: PurchaseGoal[],
    getPurchaseGoalContributionsTotal: (id: string) => number,
): CoachNotification | null {
    const today = startOfToday();

    for (const goal of purchaseGoals) {
        const total = getPurchaseGoalContributionsTotal(goal.id);
        if (total >= goal.targetAmount) continue;

        const deadline = parseISO(goal.deadline);
        if (deadline <= today) continue;

        const remaining = goal.targetAmount - total;
        const daysLeft = differenceInDays(deadline, today);

        if (daysLeft <= 7) {
            return {
                id: 1007,
                title: 'CASHRULER — Rappel épargne',
                body: `${goal.title}: encore ${remaining.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL} dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}. C'est le moment !`,
                type: 'savings_reminder',
            };
        }
    }
    return null;
}

// ─── 8. Milestone Celebrations ──────────────────────────
export function checkMilestones(
    purchaseGoals: PurchaseGoal[],
    getPurchaseGoalContributionsTotal: (id: string) => number,
    acknowledgedMilestones: string[],
): CoachNotification | null {
    const thresholds = [25, 50, 75, 100];

    for (const goal of purchaseGoals) {
        const total = getPurchaseGoalContributionsTotal(goal.id);
        const pct = Math.min(100, (total / goal.targetAmount) * 100);

        for (const t of thresholds) {
            const key = `${goal.id}-${t}`;
            if (pct >= t && !acknowledgedMilestones.includes(key)) {
                return {
                    id: 1008,
                    title: t === 100 ? 'CASHRULER — Objectif atteint !' : 'CASHRULER — Jalon atteint !',
                    body: `${goal.title}: ${t}% atteint ! ${t === 100 ? 'Félicitations !' : 'Continuez !'}`,
                    type: 'milestone',
                };
            }
        }
    }
    return null;
}

// ─── 9. Recurring Transaction Reminder ──────────────────
export function checkRecurringReminders(
    recurringTransactions: RecurringTransaction[],
): CoachNotification[] {
    const today = format(new Date(), 'yyyy-MM-dd');
    const reminders: CoachNotification[] = [];
    let idCounter = 3000;

    recurringTransactions
        .filter(rt => rt.isActive && rt.nextOccurrence <= today)
        .forEach(rt => {
            const rtName = rt.type === 'expense' ? rt.title : rt.name;
            reminders.push({
                id: idCounter++,
                title: 'CASHRULER — Transaction récurrente',
                body: `${rtName} (${rt.amount.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL}) est prévu${rt.type === 'expense' ? 'e' : ''} aujourd'hui.`,
                type: 'recurring_reminder',
            });
        });

    return reminders;
}

// ─── Schedule Helper ────────────────────────────────────
export function getNextScheduleTime(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    const scheduled = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
    if (scheduled <= now) scheduled.setDate(scheduled.getDate() + 1);
    return scheduled;
}
