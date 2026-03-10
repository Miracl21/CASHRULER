'use client';

/**
 * useCelebrations — Triggers in-app celebration popups
 * for streaks, milestones, budget wins, encouragements, etc.
 * These show inside the app as premium animated modals.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { useAppContext } from '@/contexts/AppContext';
import { calculateStreak } from '@/lib/cashruler/coach-engine';
import { CURRENCY_SYMBOL, EXPENSE_CATEGORIES, PREDEFINED_COMPTE_COURANT_ID } from '@/lib/cashruler/constants';
import type { CelebrationData } from '@/components/cashruler/CelebrationPopup';

// ─── Dedup keys ──────────────────────────────────────────
const STREAK_SHOWN_KEY = 'cashruler_cel_streak';
const MILESTONE_SHOWN_KEY = 'cashruler_cel_milestones';
const BUDGET_WIN_KEY = 'cashruler_cel_budget_win';
const FIRST_EXPENSE_KEY = 'cashruler_cel_first_expense';
const FIRST_INCOME_KEY = 'cashruler_cel_first_income';

function getToday(): string {
    return format(new Date(), 'yyyy-MM-dd');
}

export function useCelebrations() {
    const {
        expenses,
        incomes,
        expenseLimits,
        purchaseGoals,
        getPurchaseGoalContributionsTotal,
        userSettings,
    } = useAppContext();

    const [queue, setQueue] = useState<CelebrationData[]>([]);
    const [current, setCurrent] = useState<CelebrationData | null>(null);
    const checkedRef = useRef(false);

    // Queue a celebration (deduplication by title)
    const queueCelebration = useCallback((cel: CelebrationData) => {
        setQueue(prev => {
            if (prev.some(c => c.title === cel.title)) return prev;
            return [...prev, cel];
        });
    }, []);

    // Show next from queue
    useEffect(() => {
        if (current || queue.length === 0) return;
        const [next, ...rest] = queue;
        setCurrent(next);
        setQueue(rest);
    }, [current, queue]);

    const dismissCurrent = useCallback(() => {
        setCurrent(null);
    }, []);

    // ── Check all celebrations ──
    useEffect(() => {
        if (!userSettings.enableCoachNotifications) return;
        if (checkedRef.current) return;
        checkedRef.current = true;

        const today = getToday();

        // --- 1. First expense ever ---
        if (expenses.length === 1 && !localStorage.getItem(FIRST_EXPENSE_KEY)) {
            queueCelebration({
                type: 'first_action',
                title: 'Première dépense enregistrée !',
                message: 'Vous venez de faire votre premier pas vers la discipline financière.',
                detail: 'Continuez à enregistrer chaque dépense pour garder le contrôle de vos finances.',
                actionLabel: 'C\'est parti ! 🚀',
            });
            localStorage.setItem(FIRST_EXPENSE_KEY, 'true');
        }

        // --- 2. First income ever ---
        if (incomes.length === 1 && !localStorage.getItem(FIRST_INCOME_KEY)) {
            queueCelebration({
                type: 'first_action',
                title: 'Premier revenu enregistré !',
                message: 'Excellent ! Vous suivez maintenant vos entrées d\'argent.',
                detail: 'Avec une vue complète de vos revenus et dépenses, vous êtes sur la bonne voie.',
            });
            localStorage.setItem(FIRST_INCOME_KEY, 'true');
        }

        // --- 3. Streak milestones (3, 7, 14, 30 days) ---
        const streak = calculateStreak(expenses, expenseLimits);
        const streakMilestones = [3, 7, 14, 30, 60, 100] as const;
        const shownStreaks: number[] = JSON.parse(localStorage.getItem(STREAK_SHOWN_KEY) || '[]');

        for (const m of streakMilestones) {
            if (streak.days >= m && !shownStreaks.includes(m)) {
                const messages: Record<number, { title: string; message: string; detail: string }> = {
                    3: {
                        title: '3 jours de discipline !',
                        message: 'Vous tenez bon ! 3 jours consécutifs à respecter vos limites.',
                        detail: 'Les habitudes se forment en 21 jours. Vous êtes en route !',
                    },
                    7: {
                        title: 'Une semaine complète !',
                        message: '7 jours ! Vous avez prouvé que la discipline est possible.',
                        detail: 'Vous êtes dans le top 10% des utilisateurs les plus disciplinés.',
                    },
                    14: {
                        title: '2 semaines de maîtrise !',
                        message: '14 jours ! Votre discipline financière devient une habitude.',
                        detail: 'Votre cerveau commence à intégrer ces bons réflexes. Continuez !',
                    },
                    30: {
                        title: 'Un mois de champion !',
                        message: '30 jours ! Vous avez une discipline de fer.',
                        detail: 'Ce n\'est plus un effort, c\'est devenu votre mode de vie. Félicitations !',
                    },
                    60: {
                        title: '2 mois incroyables !',
                        message: '60 jours de discipline financière sans faille !',
                        detail: 'Vous êtes une source d\'inspiration. Peu de gens atteignent ce niveau.',
                    },
                    100: {
                        title: 'LÉGENDE — 100 jours !',
                        message: '100 jours consécutifs ! Vous êtes une véritable légende.',
                        detail: 'Votre maîtrise financière est exceptionnelle. Vous construisez votre liberté.',
                    },
                };

                const msg = messages[m] || messages[3];
                queueCelebration({
                    type: 'streak',
                    ...msg,
                });
                shownStreaks.push(m);
                localStorage.setItem(STREAK_SHOWN_KEY, JSON.stringify(shownStreaks));
                break; // Only show highest new milestone
            }
        }

        // --- 4. Purchase goal milestones (25%, 50%, 75%, 100%) ---
        const shownMilestones: string[] = JSON.parse(localStorage.getItem(MILESTONE_SHOWN_KEY) || '[]');

        for (const goal of purchaseGoals) {
            const total = getPurchaseGoalContributionsTotal(goal.id);
            if (goal.targetAmount === 0) continue;
            const pct = Math.min(100, (total / goal.targetAmount) * 100);

            const thresholds = [25, 50, 75, 100] as const;
            for (const t of thresholds) {
                const key = `${goal.id}-${t}`;
                if (pct >= t && !shownMilestones.includes(key)) {
                    if (t === 100) {
                        queueCelebration({
                            type: 'milestone',
                            title: 'Objectif atteint !',
                            message: `Vous avez atteint 100% de "${goal.title}" !`,
                            detail: `${total.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL} économisés. Votre discipline a payé !`,
                            actionLabel: 'Célébrer ! 🎉',
                        });
                    } else {
                        queueCelebration({
                            type: 'milestone',
                            title: `${t}% de "${goal.title}" !`,
                            message: `Vous avez déjà ${total.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL} sur ${goal.targetAmount.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL}.`,
                            detail: `Plus que ${(goal.targetAmount - total).toLocaleString('fr-FR')} ${CURRENCY_SYMBOL}. Continuez !`,
                        });
                    }
                    shownMilestones.push(key);
                    localStorage.setItem(MILESTONE_SHOWN_KEY, JSON.stringify(shownMilestones));
                    break;
                }
            }
        }

        // --- 5. Daily budget win (all limits respected yesterday) ---
        if (expenseLimits.length > 0 && !localStorage.getItem(BUDGET_WIN_KEY + today)) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

            const yesterdayExpenses = expenses.filter(e => format(parseISO(e.date), 'yyyy-MM-dd') === yesterdayStr);
            if (yesterdayExpenses.length > 0) {
                const allRespected = expenseLimits.every(limit => {
                    const spent = yesterdayExpenses
                        .filter(e => e.category === limit.category && e.sourceCompteId === PREDEFINED_COMPTE_COURANT_ID)
                        .reduce((s, e) => s + e.amount, 0);
                    return spent <= limit.dailyAmount;
                });

                if (allRespected) {
                    queueCelebration({
                        type: 'budget_win',
                        title: 'Limites respectées hier !',
                        message: 'Toutes vos limites de dépenses ont été respectées hier.',
                        detail: 'Chaque jour de discipline vous rapproche de vos objectifs financiers.',
                    });
                    localStorage.setItem(BUDGET_WIN_KEY + today, 'true');
                }
            }
        }

        // --- 6. Random encouragement (20% chance per day) ---
        const encKey = `cashruler_cel_enc_${today}`;
        if (!localStorage.getItem(encKey) && Math.random() < 0.2) {
            const encouragements = [
                {
                    title: 'Vous êtes sur la bonne voie !',
                    message: 'La discipline financière est un marathon, pas un sprint.',
                    detail: 'Chaque petite action compte. Continuez à suivre vos dépenses.',
                },
                {
                    title: 'Rappel : vous êtes capable !',
                    message: 'Gérer ses finances demande du courage. Vous l\'avez.',
                    detail: 'Les grands changements commencent par de petites habitudes quotidiennes.',
                },
                {
                    title: 'Bravo pour votre engagement !',
                    message: 'Utiliser CASHRULER montre que vous prenez vos finances au sérieux.',
                    detail: 'Vous êtes déjà en avance sur la majorité des gens.',
                },
            ];
            const enc = encouragements[Math.floor(Math.random() * encouragements.length)];
            queueCelebration({
                type: 'encouragement',
                ...enc,
            });
            localStorage.setItem(encKey, 'true');
        }
    }, [expenses, incomes, expenseLimits, purchaseGoals, getPurchaseGoalContributionsTotal, userSettings.enableCoachNotifications, queueCelebration]);

    return { current, dismissCurrent };
}
