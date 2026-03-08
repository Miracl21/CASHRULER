
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AppState, AppContextType, Expense, Income, PurchaseGoal, Contribution, ExpenseLimit, MonthlyBudget, Compte, CompteType, Transfer, LockType, BudgetExpenseAllocation, UserSettings, RecurringTransaction } from '@/lib/cashruler/types';
import { COMPTE_TYPE_DETAILS, PREDEFINED_COMPTE_COURANT_ID, CURRENCY_SYMBOL, EXPENSE_CATEGORIES } from '@/lib/cashruler/constants';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from './AuthContext';
import * as db from '@/lib/supabase/supabase-service';
import * as local from '@/lib/cashruler/local-storage-service';


const initialDefaultComptes: Compte[] = Object.entries(COMPTE_TYPE_DETAILS)
  .filter(([_, details]) => details.isPredefined && details.id)
  .map(([key, details]) => ({
    id: details.id!,
    name: details.label,
    type: key as CompteType,
    iconName: details.icon.displayName || 'PiggyBank',
    color: details.defaultColor,
    contributions: [],
    isPredefined: true,
    lockStatus: details.defaultLockStatus || 'none',
  }));

const defaultUserSettings: UserSettings = {
  username: undefined,
  enableBudgetNotifications: true,
  enableMotivationalMessages: true,
  enableCoachNotifications: true,
  morningNotificationTime: '07:30',
  eveningNotificationTime: '20:00',
  enableNudgeNotification: true,
  enableWeeklyReport: true,
  enableRealTimeAlerts: true,
  enableStreakTracking: true,
};

const defaultState: AppState = {
  comptes: [],
  incomes: [],
  expenses: [],
  purchaseGoals: [],
  expenseLimits: [],
  monthlyBudgets: [],
  transfers: [],
  recurringTransactions: [],
  userSettings: defaultUserSettings,
  isLoading: true,
};

function genId(): string {
  return crypto.randomUUID();
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [appState, setAppState] = useState<AppState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Helper: persist state to localStorage after every change ──
  const persistToLocal = useCallback((state: AppState) => {
    local.saveAllLocalData({
      comptes: state.comptes,
      incomes: state.incomes,
      expenses: state.expenses,
      transfers: state.transfers,
      purchaseGoals: state.purchaseGoals,
      expenseLimits: state.expenseLimits,
      monthlyBudgets: state.monthlyBudgets,
      recurringTransactions: state.recurringTransactions,
      userSettings: state.userSettings,
    });
  }, []);

  // ─── Helper: try Supabase in background, silently fail if offline ──
  const trySupabase = useCallback(async (fn: () => Promise<void>) => {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      await fn();
    } catch (e) {
      console.warn('[Sync] Supabase sync failed (offline?):', e);
    }
  }, []);

  // ─── Ensure predefined comptes exist in a comptes list ──
  const ensurePredefinedComptes = useCallback((comptes: Compte[]) => {
    const existingIds = comptes.map(c => c.id);
    const missingDefaults = initialDefaultComptes.filter(dc => !existingIds.includes(dc.id));
    const allComptes = [...comptes];
    for (const dc of missingDefaults) {
      allComptes.push({ ...dc, contributions: [] });
    }
    return allComptes;
  }, []);

  // ─── Load from Supabase and merge with local ──────────────
  const syncFromSupabase = useCallback(async (userId: string) => {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      const [comptes, incomes, expenses, transfers, purchaseGoals, expenseLimits, monthlyBudgets, userSettings] =
        await Promise.all([
          db.fetchComptes(userId),
          db.fetchIncomes(userId),
          db.fetchExpenses(userId),
          db.fetchTransfers(userId),
          db.fetchPurchaseGoals(userId),
          db.fetchExpenseLimits(userId),
          db.fetchMonthlyBudgets(userId),
          db.fetchUserSettings(userId),
        ]);

      // Ensure predefined comptes exist in Supabase
      const allComptes = ensurePredefinedComptes(comptes);
      const missingInDb = initialDefaultComptes.filter(dc => !comptes.some(c => c.id === dc.id));
      for (const dc of missingInDb) {
        try { await db.insertCompte(userId, dc); } catch { /* ok */ }
      }

      const newState: AppState = {
        comptes: allComptes,
        incomes,
        expenses,
        transfers,
        purchaseGoals,
        expenseLimits,
        monthlyBudgets,
        recurringTransactions: [],
        userSettings,
        isLoading: false,
      };

      setAppState(newState);
      persistToLocal(newState);
      local.setLastSyncTimestamp(Date.now());
    } catch (error) {
      console.warn('[Sync] Background Supabase sync failed:', error);
      // Don't show error toast — the local data is already loaded
    }
  }, [ensurePredefinedComptes, persistToLocal]);

  // ─── Main data loading: local first, then Supabase ──────────
  useEffect(() => {
    if (user) {
      // Step 1: Load from localStorage immediately (instant, offline-ready)
      if (local.hasLocalData()) {
        const localData = local.loadAllLocalData();
        const localComptes = ensurePredefinedComptes(localData.comptes);
        setAppState({
          comptes: localComptes,
          incomes: localData.incomes,
          expenses: localData.expenses,
          transfers: localData.transfers,
          purchaseGoals: localData.purchaseGoals,
          expenseLimits: localData.expenseLimits,
          monthlyBudgets: localData.monthlyBudgets,
          recurringTransactions: localData.recurringTransactions,
          userSettings: localData.userSettings || defaultUserSettings,
          isLoading: false,
        });
        setIsLoading(false);

        // Step 2: Sync Supabase in background (non-blocking)
        syncFromSupabase(user.id);
      } else {
        // First time: try Supabase, fallback to empty + predefined
        setIsLoading(true);
        syncFromSupabase(user.id).finally(() => {
          setIsLoading(false);
          // If still no data after sync, initialize with defaults
          setAppState(prev => {
            if (prev.comptes.length === 0) {
              const initialState = {
                ...defaultState,
                comptes: ensurePredefinedComptes([]),
                userSettings: defaultUserSettings,
                isLoading: false,
              };
              persistToLocal(initialState);
              return initialState;
            }
            return { ...prev, isLoading: false };
          });
        });
      }
    } else {
      // Not logged in → load from local if available, otherwise defaults
      if (local.hasLocalData()) {
        const localData = local.loadAllLocalData();
        const localComptes = ensurePredefinedComptes(localData.comptes);
        setAppState({
          comptes: localComptes,
          incomes: localData.incomes,
          expenses: localData.expenses,
          transfers: localData.transfers,
          purchaseGoals: localData.purchaseGoals,
          expenseLimits: localData.expenseLimits,
          monthlyBudgets: localData.monthlyBudgets,
          recurringTransactions: localData.recurringTransactions,
          userSettings: localData.userSettings || defaultUserSettings,
          isLoading: false,
        });
      } else {
        const initialState = {
          ...defaultState,
          comptes: ensurePredefinedComptes([]),
          isLoading: false,
        };
        setAppState(initialState);
        persistToLocal(initialState);
      }
      setIsLoading(false);
    }
  }, [user, syncFromSupabase, ensurePredefinedComptes, persistToLocal]);

  // ─── Auto-persist to localStorage on every state change ──
  useEffect(() => {
    if (!appState.isLoading && appState.comptes.length > 0) {
      persistToLocal(appState);
    }
  }, [appState, persistToLocal]);

  // ─── User Settings ──────────────────────────────────────
  const updateUserSettings = async (newSettings: Partial<UserSettings>) => {
    const merged = { ...appState.userSettings, ...newSettings };
    setAppState(prev => ({ ...prev, userSettings: merged }));
    if (user) {
      trySupabase(() => db.upsertUserSettings(user.id, merged));
    }
  };

  const resetApplicationData = async () => {
    if (user) {
      trySupabase(() => db.deleteAllUserData(user.id));
    }
    // Re-insert predefined comptes
    if (user) {
      for (const dc of initialDefaultComptes) {
        trySupabase(() => db.insertCompte(user!.id, dc));
      }
    }
    const resetState: AppState = {
      ...defaultState,
      comptes: [...initialDefaultComptes].map(c => ({
        ...c,
        lockStatus: COMPTE_TYPE_DETAILS[c.type]?.defaultLockStatus || 'none',
      })),
      userSettings: { ...defaultUserSettings },
      isLoading: false,
    };
    setAppState(resetState);
    persistToLocal(resetState);
    toast({ title: 'Application Réinitialisée', description: 'Toutes vos données ont été effacées.' });
  };

  // ─── Comptes ────────────────────────────────────────────
  const addCompte = async (compte: Omit<Compte, 'id' | 'contributions' | 'isPredefined'>) => {
    const newCompte: Compte = { ...compte, id: genId(), contributions: [], isPredefined: false, lockStatus: compte.lockStatus || 'none' };
    setAppState(prev => ({ ...prev, comptes: [...prev.comptes, newCompte] }));
    if (user) {
      trySupabase(() => db.insertCompte(user.id, newCompte));
    }
  };

  const updateCompte = async (updatedCompte: Compte) => {
    setAppState(prev => ({
      ...prev,
      comptes: prev.comptes.map(c => c.id === updatedCompte.id ? { ...updatedCompte, contributions: updatedCompte.contributions || [], lockStatus: updatedCompte.lockStatus || 'none' } : c),
    }));
    if (user) {
      trySupabase(() => db.updateCompteDb(updatedCompte));
    }
  };

  const deleteCompte = async (id: string) => {
    const compteToDelete = appState.comptes.find(c => c.id === id);
    if (compteToDelete?.isPredefined) {
      toast({ title: 'Action non autorisée', description: 'Les comptes prédéfinis ne peuvent pas être supprimés.', variant: 'destructive' });
      return;
    }
    setAppState(prev => ({
      ...prev,
      comptes: prev.comptes.filter(c => c.id !== id),
      purchaseGoals: prev.purchaseGoals.filter(pg => pg.fundingCompteId !== id),
      expenses: prev.expenses.map(e => e.sourceCompteId === id ? { ...e, sourceCompteId: PREDEFINED_COMPTE_COURANT_ID } : e),
      incomes: prev.incomes.map(i => i.targetCompteId === id ? { ...i, targetCompteId: PREDEFINED_COMPTE_COURANT_ID } : i),
      monthlyBudgets: prev.monthlyBudgets.map(mb => ({
        ...mb,
        savingsAllocations: mb.savingsAllocations.filter(sa => sa.targetCompteId !== id),
      })).map(mb => ({
        ...mb,
        targetSavingsAmount: mb.savingsAllocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0),
      })),
      transfers: prev.transfers.filter(t => t.fromCompteId !== id && t.toCompteId !== id),
    }));
    if (user) {
      trySupabase(() => db.deleteCompteDb(id));
    }
  };

  const addContributionToCompte = async (compteId: string, contribution: Omit<Contribution, 'id'>) => {
    const targetCompte = appState.comptes.find(c => c.id === compteId);
    if (!targetCompte) {
      toast({ title: 'Erreur', description: 'Compte non trouvé.', variant: 'destructive' });
      return;
    }
    if (targetCompte.lockStatus === 'full') {
      toast({ title: 'Action non autorisée', description: `Le compte "${targetCompte.name}" est entièrement verrouillé.`, variant: 'destructive' });
      return;
    }
    const newContrib: Contribution = { ...contribution, id: genId() };
    setAppState(prev => ({
      ...prev,
      comptes: prev.comptes.map(c =>
        c.id === compteId
          ? { ...c, contributions: [...(c.contributions || []), newContrib] }
          : c
      ),
    }));
    if (user) {
      trySupabase(() => db.insertContributionToCompte(user.id, compteId, newContrib));
    }

    const compteEpargneTypes: CompteType[] = ['URGENCE', 'INVESTISSEMENT', 'PROJETS', 'CUSTOM_EPARGNE', 'CUSTOM_PROJET'];
    if (appState.userSettings.enableMotivationalMessages && compteEpargneTypes.includes(targetCompte.type)) {
      toast({
        title: 'Excellent Progrès !',
        description: `Contribution ajoutée au compte "${targetCompte.name}". Chaque pas compte !`,
      });
    }
  };

  // ─── Incomes ────────────────────────────────────────────
  const addIncome = async (income: Omit<Income, 'id'>) => {
    const targetCompte = appState.comptes.find(c => c.id === income.targetCompteId);
    if (targetCompte?.lockStatus === 'full') {
      toast({ title: 'Action non autorisée', description: `Le compte "${targetCompte.name}" est verrouillé.`, variant: 'destructive' });
      return;
    }
    const newIncome: Income = { ...income, id: genId() };
    setAppState(prev => ({ ...prev, incomes: [...prev.incomes, newIncome] }));
    if (user) {
      trySupabase(() => db.insertIncome(user.id, newIncome));
    }
  };

  const updateIncome = async (updatedIncome: Income) => {
    const targetCompte = appState.comptes.find(c => c.id === updatedIncome.targetCompteId);
    if (targetCompte?.lockStatus === 'full') {
      toast({ title: 'Action non autorisée', description: `Le compte "${targetCompte.name}" est verrouillé.`, variant: 'destructive' });
      return;
    }
    setAppState(prev => ({ ...prev, incomes: prev.incomes.map(inc => inc.id === updatedIncome.id ? updatedIncome : inc) }));
    if (user) {
      trySupabase(() => db.updateIncomeDb(updatedIncome));
    }
  };

  const deleteIncome = async (id: string) => {
    setAppState(prev => ({ ...prev, incomes: prev.incomes.filter(inc => inc.id !== id) }));
    if (user) {
      trySupabase(() => db.deleteIncomeDb(id));
    }
  };

  // ─── Expenses ───────────────────────────────────────────
  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    const sourceCompte = appState.comptes.find(c => c.id === expense.sourceCompteId);
    if (sourceCompte && (sourceCompte.lockStatus === 'full' || sourceCompte.lockStatus === 'outgoing_only')) {
      toast({ title: 'Action non autorisée', description: `Les dépenses depuis "${sourceCompte.name}" sont bloquées.`, variant: 'destructive' });
      return;
    }

    const newExpense: Expense = { ...expense, id: genId() };

    setAppState(prev => {
      const newExpenses = [...prev.expenses, newExpense];
      let newMonthlyBudgets = prev.monthlyBudgets;

      if (prev.userSettings.enableBudgetNotifications && expense.sourceCompteId === PREDEFINED_COMPTE_COURANT_ID && expense.category) {
        const currentMonthYear = format(new Date(), 'yyyy-MM');
        const activeBudgetIndex = prev.monthlyBudgets.findIndex(b => b.monthYear === currentMonthYear);

        if (activeBudgetIndex !== -1) {
          const activeBudget = { ...prev.monthlyBudgets[activeBudgetIndex] };
          const allocationIndex = activeBudget.expenseAllocations.findIndex(a => a.category === expense.category);

          if (allocationIndex !== -1) {
            const allocation = { ...activeBudget.expenseAllocations[allocationIndex] };
            const totalSpent = newExpenses
              .filter(exp => exp.sourceCompteId === PREDEFINED_COMPTE_COURANT_ID && exp.category === expense.category && format(parseISO(exp.date), 'yyyy-MM') === currentMonthYear)
              .reduce((sum, exp) => sum + exp.amount, 0);
            const pct = allocation.allocatedAmount > 0 ? (totalSpent / allocation.allocatedAmount) * 100 : 0;
            let thresh = allocation.notifiedThreshold || 0;

            if (pct > 100 && thresh < 101) {
              toast({ title: 'Budget Dépassé !', description: `Budget dépassé pour '${EXPENSE_CATEGORIES.find(c => c.name === expense.category)?.label || expense.category}'.`, variant: 'destructive' });
              thresh = 101;
            } else {
              for (const t of [{ l: 100, v: 100 }, { l: 75, v: 75 }, { l: 50, v: 50 }]) {
                if (pct >= t.l && thresh < t.l) {
                  toast({ title: 'Suivi Budget', description: `${t.l}% du budget '${EXPENSE_CATEGORIES.find(c => c.name === expense.category)?.label}' atteint.` });
                  thresh = t.v;
                  break;
                }
              }
            }

            if (thresh !== (allocation.notifiedThreshold || 0)) {
              allocation.notifiedThreshold = thresh;
              activeBudget.expenseAllocations = [...activeBudget.expenseAllocations];
              activeBudget.expenseAllocations[allocationIndex] = allocation;
              newMonthlyBudgets = [...prev.monthlyBudgets];
              newMonthlyBudgets[activeBudgetIndex] = activeBudget;
            }
          }
        }
      }
      return { ...prev, expenses: newExpenses, monthlyBudgets: newMonthlyBudgets };
    });

    if (user) {
      trySupabase(() => db.insertExpense(user.id, newExpense));
    }
  };

  const updateExpense = async (updatedExpense: Expense) => {
    const sourceCompte = appState.comptes.find(c => c.id === updatedExpense.sourceCompteId);
    if (sourceCompte && (sourceCompte.lockStatus === 'full' || sourceCompte.lockStatus === 'outgoing_only')) {
      const originalExpense = appState.expenses.find(e => e.id === updatedExpense.id);
      if (originalExpense?.sourceCompteId !== updatedExpense.sourceCompteId) {
        toast({ title: 'Action non autorisée', description: `Le compte source est verrouillé.`, variant: 'destructive' });
        return;
      }
    }

    setAppState(prev => {
      const newExpenses = prev.expenses.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp);
      return { ...prev, expenses: newExpenses };
    });

    if (user) {
      trySupabase(() => db.updateExpenseDb(updatedExpense));
    }
  };

  const deleteExpense = async (id: string) => {
    setAppState(prev => ({ ...prev, expenses: prev.expenses.filter(exp => exp.id !== id) }));
    if (user) {
      trySupabase(() => db.deleteExpenseDb(id));
    }
  };

  // ─── Purchase Goals ─────────────────────────────────────
  const addPurchaseGoal = async (goal: Omit<PurchaseGoal, 'id' | 'contributions'>) => {
    const newGoal: PurchaseGoal = { ...goal, id: genId(), contributions: [], isCompletedNotified: false };
    setAppState(prev => ({ ...prev, purchaseGoals: [...prev.purchaseGoals, newGoal] }));
    if (user) {
      trySupabase(() => db.insertPurchaseGoal(user.id, newGoal));
    }
  };

  const updatePurchaseGoal = async (updatedGoal: PurchaseGoal) => {
    setAppState(prev => ({
      ...prev,
      purchaseGoals: prev.purchaseGoals.map(g => g.id === updatedGoal.id ? { ...updatedGoal, contributions: updatedGoal.contributions || [] } : g),
    }));
    if (user) {
      trySupabase(() => db.updatePurchaseGoalDb(updatedGoal));
    }
  };

  const deletePurchaseGoal = async (id: string) => {
    setAppState(prev => ({ ...prev, purchaseGoals: prev.purchaseGoals.filter(g => g.id !== id) }));
    if (user) {
      trySupabase(() => db.deletePurchaseGoalDb(id));
    }
  };

  const addContributionToPurchaseGoal = async (goalId: string, contributionData: Omit<Contribution, 'id' | 'sourceCompteId'>, sourceCompteId: string) => {
    const compteSource = appState.comptes.find(c => c.id === sourceCompteId);
    if (compteSource && (compteSource.lockStatus === 'full' || compteSource.lockStatus === 'outgoing_only')) {
      toast({ title: 'Action non autorisée', description: `Le compte source est verrouillé.`, variant: 'destructive' });
      return;
    }

    const contribution: Contribution = { ...contributionData, id: genId(), sourceCompteId };
    let goalReachedAndNotNotified = false;
    let goalTitleForToast = '';

    setAppState(prev => {
      const updatedPurchaseGoals = prev.purchaseGoals.map(g => {
        if (g.id === goalId) {
          const newContributions = [...(g.contributions || []), contribution];
          const totalContributed = newContributions.reduce((sum, c) => sum + c.amount, 0);
          goalTitleForToast = g.title;
          if (totalContributed >= g.targetAmount && !g.isCompletedNotified) {
            goalReachedAndNotNotified = true;
            return { ...g, contributions: newContributions, isCompletedNotified: true };
          }
          return { ...g, contributions: newContributions };
        }
        return g;
      });
      return { ...prev, purchaseGoals: updatedPurchaseGoals };
    });

    if (user) {
      trySupabase(async () => {
        await db.insertContributionToGoal(user.id, goalId, contribution);
        if (goalReachedAndNotNotified) {
          const goal = appState.purchaseGoals.find(g => g.id === goalId);
          if (goal) await db.updatePurchaseGoalDb({ ...goal, isCompletedNotified: true });
        }
      });
    }

    if (appState.userSettings.enableMotivationalMessages) {
      toast({ title: 'Contribution Réussie !', description: `${contributionData.amount.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL} ajoutée à "${goalTitleForToast}".` });
    }
    if (goalReachedAndNotNotified && appState.userSettings.enableMotivationalMessages) {
      toast({ title: '🎉 Objectif Atteint ! 🎉', description: `Félicitations ! Objectif "${goalTitleForToast}" atteint.`, duration: 5000 });
    }
  };

  const getPurchaseGoalContributionsTotal = (goalId: string): number => {
    const goal = appState.purchaseGoals.find(g => g.id === goalId);
    return (goal?.contributions || []).reduce((sum, c) => sum + c.amount, 0);
  };

  // ─── Expense Limits ─────────────────────────────────────
  const addExpenseLimit = async (limit: Omit<ExpenseLimit, 'id'>) => {
    if (appState.expenseLimits.some(l => l.category === limit.category)) {
      const existingLimit = appState.expenseLimits.find(l => l.category === limit.category);
      if (existingLimit) {
        updateExpenseLimit({ ...limit, id: existingLimit.id });
        return;
      }
    }
    const newLimit: ExpenseLimit = { ...limit, id: genId() };
    setAppState(prev => ({ ...prev, expenseLimits: [...prev.expenseLimits, newLimit] }));
    if (user) {
      trySupabase(() => db.insertExpenseLimit(user.id, newLimit));
    }
  };

  const updateExpenseLimit = async (updatedLimit: ExpenseLimit) => {
    setAppState(prev => ({ ...prev, expenseLimits: prev.expenseLimits.map(l => l.id === updatedLimit.id ? updatedLimit : l) }));
    if (user) {
      trySupabase(() => db.updateExpenseLimitDb(updatedLimit));
    }
  };

  const deleteExpenseLimit = async (id: string) => {
    setAppState(prev => ({ ...prev, expenseLimits: prev.expenseLimits.filter(l => l.id !== id) }));
    if (user) {
      trySupabase(() => db.deleteExpenseLimitDb(id));
    }
  };

  // ─── Monthly Budgets ────────────────────────────────────
  const addMonthlyBudget = async (budget: MonthlyBudget) => {
    const budgetMonthFormatted = format(parseISO(budget.monthYear + '-01'), 'MMMM yyyy', { locale: fr });
    const budgetWithCalculatedSavings: MonthlyBudget = {
      ...budget,
      id: budget.monthYear,
      targetSavingsAmount: (budget.savingsAllocations || []).reduce((sum, alloc) => sum + alloc.allocatedAmount, 0),
      expenseAllocations: (budget.expenseAllocations || []).map(ea => ({ ...ea, notifiedThreshold: ea.notifiedThreshold || 0 })),
    };

    setAppState(prev => {
      const exists = prev.monthlyBudgets.some(b => b.id === budgetWithCalculatedSavings.id);
      if (prev.userSettings.enableMotivationalMessages) {
        toast({
          title: exists ? 'Budget Mis à Jour' : 'Budget Créé !',
          description: exists
            ? `Le budget pour ${budgetMonthFormatted} a été mis à jour.`
            : `Excellent ! Votre budget pour ${budgetMonthFormatted} est prêt.`,
        });
      }
      if (exists) {
        return { ...prev, monthlyBudgets: prev.monthlyBudgets.map(b => b.id === budgetWithCalculatedSavings.id ? budgetWithCalculatedSavings : b) };
      }
      return { ...prev, monthlyBudgets: [...prev.monthlyBudgets, budgetWithCalculatedSavings] };
    });

    if (user) {
      trySupabase(() => db.upsertMonthlyBudget(user.id, budgetWithCalculatedSavings));
    }
  };

  const updateMonthlyBudget = async (updatedBudget: MonthlyBudget) => {
    const budgetWithCalculatedSavings: MonthlyBudget = {
      ...updatedBudget,
      id: updatedBudget.monthYear,
      targetSavingsAmount: (updatedBudget.savingsAllocations || []).reduce((sum, alloc) => sum + alloc.allocatedAmount, 0),
      expenseAllocations: (updatedBudget.expenseAllocations || []).map(ea => ({ ...ea, notifiedThreshold: ea.notifiedThreshold || 0 })),
    };
    const budgetMonthFormatted = format(parseISO(updatedBudget.monthYear + '-01'), 'MMMM yyyy', { locale: fr });
    setAppState(prev => ({
      ...prev,
      monthlyBudgets: prev.monthlyBudgets.map(b => b.id === budgetWithCalculatedSavings.id ? budgetWithCalculatedSavings : b),
    }));
    if (appState.userSettings.enableMotivationalMessages) {
      toast({ title: 'Budget Mis à Jour', description: `Le budget pour ${budgetMonthFormatted} a été mis à jour.` });
    }
    if (user) {
      trySupabase(() => db.upsertMonthlyBudget(user.id, budgetWithCalculatedSavings));
    }
  };

  const getMonthlyBudget = (monthYear: string): MonthlyBudget | undefined => {
    return appState.monthlyBudgets.find(b => b.id === monthYear);
  };

  // ─── Transfers ──────────────────────────────────────────
  const addTransfer = async (transfer: Omit<Transfer, 'id'>) => {
    const sourceCompte = appState.comptes.find(c => c.id === transfer.fromCompteId);
    const destCompte = appState.comptes.find(c => c.id === transfer.toCompteId);

    if (sourceCompte && (sourceCompte.lockStatus === 'full' || sourceCompte.lockStatus === 'outgoing_only')) {
      toast({ title: 'Action non autorisée', description: `Le compte source "${sourceCompte.name}" est verrouillé.`, variant: 'destructive' });
      return;
    }
    if (destCompte && destCompte.lockStatus === 'full') {
      toast({ title: 'Action non autorisée', description: `Le compte "${destCompte.name}" est verrouillé.`, variant: 'destructive' });
      return;
    }

    const newTransfer: Transfer = { ...transfer, id: genId() };
    setAppState(prev => ({ ...prev, transfers: [...prev.transfers, newTransfer] }));
    if (user) {
      trySupabase(() => db.insertTransfer(user.id, newTransfer));
    }
  };

  // ─── Recurring Transactions ─────────────────────────────────
  const addRecurringTransaction = (rt: Omit<RecurringTransaction, 'id'>) => {
    const newRT: RecurringTransaction = { ...rt, id: genId() };
    setAppState(prev => ({ ...prev, recurringTransactions: [...prev.recurringTransactions, newRT] }));
  };

  const deleteRecurringTransaction = (id: string) => {
    setAppState(prev => ({ ...prev, recurringTransactions: prev.recurringTransactions.filter(rt => rt.id !== id) }));
  };

  const applyRecurringTransaction = (rt: RecurringTransaction) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    if (rt.type === 'expense' && rt.title && rt.sourceCompteId) {
      addExpense({
        title: rt.title,
        amount: rt.amount,
        category: rt.category || 'Autres dépenses',
        sourceCompteId: rt.sourceCompteId,
        date: today,
        note: rt.note || `Récurrent: ${rt.title}`,
      });
    } else if (rt.type === 'income' && rt.name && rt.targetCompteId) {
      addIncome({
        name: rt.name,
        amount: rt.amount,
        type: rt.incomeType || 'Salaire',
        targetCompteId: rt.targetCompteId,
        date: today,
        note: rt.note || `Récurrent: ${rt.name}`,
      });
    }

    // Advance nextOccurrence
    const currentNext = parseISO(rt.nextOccurrence);
    let newNext: Date;
    switch (rt.frequency) {
      case 'daily': newNext = addDays(currentNext, 1); break;
      case 'weekly': newNext = addWeeks(currentNext, 1); break;
      case 'monthly': newNext = addMonths(currentNext, 1); break;
      case 'yearly': newNext = addYears(currentNext, 1); break;
      default: newNext = addMonths(currentNext, 1);
    }
    setAppState(prev => ({
      ...prev,
      recurringTransactions: prev.recurringTransactions.map(r =>
        r.id === rt.id ? { ...r, nextOccurrence: format(newNext, 'yyyy-MM-dd') } : r
      ),
    }));

    toast({ title: 'Transaction appliquée', description: `${rt.type === 'expense' ? rt.title : rt.name} - ${rt.amount.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL}` });
  };

  // ─── Balance Calculations ──────────────────────────────
  const getCompteBalance = (compteId: string): number => {
    const compte = appState.comptes.find(c => c.id === compteId);
    if (!compte) return 0;

    const directContributions = (compte.contributions || []).reduce((sum, contrib) => sum + contrib.amount, 0);
    const incomeToThisCompte = appState.incomes.filter(inc => inc.targetCompteId === compteId).reduce((sum, inc) => sum + inc.amount, 0);
    const expensesFromThisCompte = appState.expenses.filter(exp => exp.sourceCompteId === compteId).reduce((sum, exp) => sum + exp.amount, 0);
    const transfersIn = appState.transfers.filter(t => t.toCompteId === compteId).reduce((sum, t) => sum + t.amount, 0);
    const transfersOut = appState.transfers.filter(t => t.fromCompteId === compteId).reduce((sum, t) => sum + t.amount, 0);

    const contributionsToGoalsFromThisCompte = appState.purchaseGoals
      .filter(pg => pg.fundingCompteId === compteId)
      .flatMap(pg => pg.contributions)
      .filter(contrib => contrib.sourceCompteId === compteId)
      .reduce((sum, contrib) => sum + contrib.amount, 0);

    const balance = directContributions + incomeToThisCompte + transfersIn - expensesFromThisCompte - transfersOut - contributionsToGoalsFromThisCompte;
    return Math.round((balance + Number.EPSILON) * 100) / 100;
  };


  return (
    <AppContext.Provider value={{
      ...appState,
      isLoading,
      userSettings: appState.userSettings,
      updateUserSettings,
      resetApplicationData,
      addCompte,
      updateCompte,
      deleteCompte,
      addContributionToCompte,
      getCompteBalance,
      addIncome,
      updateIncome,
      deleteIncome,
      addExpense,
      updateExpense,
      deleteExpense,
      addPurchaseGoal,
      updatePurchaseGoal,
      deletePurchaseGoal,
      addContributionToPurchaseGoal,
      getPurchaseGoalContributionsTotal,
      addExpenseLimit,
      updateExpenseLimit,
      deleteExpenseLimit,
      addMonthlyBudget,
      updateMonthlyBudget,
      getMonthlyBudget,
      addTransfer,
      recurringTransactions: appState.recurringTransactions,
      addRecurringTransaction,
      deleteRecurringTransaction,
      applyRecurringTransaction,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
