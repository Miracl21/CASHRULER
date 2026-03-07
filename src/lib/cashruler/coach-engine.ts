/**
 * Coach Financier — Engine de génération de messages et planification
 * Gère les 9 types de notifications pour la discipline financière.
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

// ─── Phrases ────────────────────────────────────────────
const MORNING_GREETINGS = ['Bonjour', 'Belle journée', 'Bonne matinée', 'Salut'];
const MORNING_ENCOURAGEMENTS = [
    'Restez discipliné et vous atteindrez vos objectifs ! 💪',
    'Chaque franc économisé vous rapproche de vos rêves ! ✨',
    'La discipline financière, c\'est la liberté de demain ! 🌟',
    'Aujourd\'hui est une nouvelle opportunité d\'économiser ! 🎯',
    'Gardez le cap, vous êtes sur la bonne voie ! 🚀',
];
const EVENING_MESSAGES = [
    'Prenez 2 min pour vérifier vos entrées.',
    'Un petit bilan avant de dormir ?',
    'Avez-vous tout enregistré aujourd\'hui ?',
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
    let body = `${pick(MORNING_GREETINGS)} ${name} ! 🌞\n`;

    if (expenseLimits.length > 0) {
        const summary = expenseLimits.slice(0, 2).map(l => {
            const label = EXPENSE_CATEGORIES.find(c => c.name === l.category)?.label || l.category;
            return `${label}: ${l.dailyAmount.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL}/jour`;
        }).join(', ');
        body += `📋 Limites: ${summary}. `;
    }

    const activeGoals = purchaseGoals.filter(g => getPurchaseGoalContributionsTotal(g.id) < g.targetAmount);
    if (activeGoals.length > 0) {
        const g = activeGoals[0];
        const remaining = g.targetAmount - getPurchaseGoalContributionsTotal(g.id);
        body += `🎯 ${g.title}: encore ${remaining.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL}. `;
    }

    body += `\n${pick(MORNING_ENCOURAGEMENTS)}`;

    return { id: 1001, title: '🌅 CASHRULER — Bonjour !', body: body.trim(), type: 'morning' };
}

// ─── 2. Evening Notification ────────────────────────────
export function generateEveningNotification(
    username: string | undefined,
    todayExpenses: Expense[],
): CoachNotification {
    const name = username || 'Champion';
    const total = todayExpenses.reduce((s, e) => s + e.amount, 0);
    const count = todayExpenses.length;

    const body = count === 0
        ? `Bonsoir ${name} ! Aucune dépense enregistrée aujourd'hui. 🎉 Journée sans dépense ou petit oubli ? ${pick(EVENING_MESSAGES)}`
        : `Bonsoir ${name} ! Vous avez enregistré ${count} dépense${count > 1 ? 's' : ''} pour ${total.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL} aujourd'hui. ${pick(EVENING_MESSAGES)} 📊`;

    return { id: 1002, title: '🌙 CASHRULER — Bilan du soir', body, type: 'evening' };
}

// ─── 3. Nudge Notification ──────────────────────────────
export function generateNudgeNotification(hasActivityToday: boolean): CoachNotification {
    const body = hasActivityToday
        ? 'Bonne continuation ! Vous êtes bien discipliné aujourd\'hui. 💪'
        : 'Pas de transaction enregistrée aujourd\'hui. Journée sans dépense ? 🎉 Ou un petit oubli ? Tapez pour mettre à jour.';

    return { id: 1003, title: '🔔 CASHRULER — Rappel', body, type: 'nudge' };
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

        if (i === 0) { streak++; continue; } // grace for today

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
    if (streak >= 30) message = `🔥 ${streak} jours de discipline ! Incroyable !`;
    else if (streak >= 14) message = `🔥 ${streak} jours ! Impressionnant !`;
    else if (streak >= 7) message = `🔥 ${streak} jours ! Belle semaine !`;
    else if (streak >= 3) message = `🔥 ${streak} jours de suite !`;
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

    const limitsRespected = expenseLimits.filter(limit => {
        const spent = weekExpenses
            .filter(e => e.category === limit.category)
            .reduce((s, e) => s + e.amount, 0);
        return spent <= limit.dailyAmount * 7;
    }).length;

    const totalLimits = expenseLimits.length;
    const score = totalLimits > 0 ? Math.round((limitsRespected / totalLimits) * 5) : (weekExpenses.length > 0 ? 4 : 3);
    const stars = '⭐'.repeat(score) + '☆'.repeat(5 - score);

    let body = `📊 Semaine: ${totalSpent.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL} dépensés.\n`;
    if (totalLimits > 0) body += `✅ ${limitsRespected}/${totalLimits} limites respectées.\n`;
    body += `Note: ${stars}`;

    return { id: 1005, title: '📊 CASHRULER — Rapport hebdomadaire', body, type: 'weekly_report' };
}

// ─── 6. Budget Alerts (80% / 100%) ──────────────────────
export function checkBudgetAlerts(
    allExpensesThisMonth: Expense[],
    expenseLimits: ExpenseLimit[],
): CoachNotification[] {
    const alerts: CoachNotification[] = [];
    let idCounter = 2000;

    // Compare monthly spending to dailyAmount * 30
    expenseLimits.forEach(limit => {
        const spent = allExpensesThisMonth
            .filter(e => e.category === limit.category && e.sourceCompteId === PREDEFINED_COMPTE_COURANT_ID)
            .reduce((s, e) => s + e.amount, 0);

        const monthlyLimit = limit.dailyAmount * 30;
        const pct = (spent / monthlyLimit) * 100;
        const catLabel = EXPENSE_CATEGORIES.find(c => c.name === limit.category)?.label || limit.category;

        if (pct >= 100) {
            alerts.push({
                id: idCounter++,
                title: '🚨 Limite dépassée !',
                body: `${catLabel}: ${spent.toLocaleString('fr-FR')}/${monthlyLimit.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL} (${Math.round(pct)}%). Attention !`,
                type: 'budget_alert',
            });
        } else if (pct >= 80) {
            alerts.push({
                id: idCounter++,
                title: '⚠️ Limite bientôt atteinte',
                body: `${catLabel}: ${spent.toLocaleString('fr-FR')}/${monthlyLimit.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL} (${Math.round(pct)}%). Soyez prudent !`,
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
                title: '🎯 Rappel épargne',
                body: `${goal.title}: il reste ${remaining.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL} à ${daysLeft} jour${daysLeft > 1 ? 's' : ''} de l'échéance. Un effort maintenant ? 💪`,
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
                const emoji = t === 100 ? '🏆🎉' : t >= 75 ? '🏆' : t >= 50 ? '🎉' : '👏';
                return {
                    id: 1008,
                    title: `${emoji} Jalon atteint !`,
                    body: `${goal.title}: ${t}% atteint ! ${t === 100 ? 'Objectif accompli ! Félicitations !' : 'Continuez comme ça !'}`,
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
                title: '📅 Transaction récurrente',
                body: `Rappel : ${rtName} (${rt.amount.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL}) est prévu${rt.type === 'expense' ? 'e' : ''} aujourd'hui. Tapez pour l'enregistrer.`,
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
