
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AppState, AppContextType, Expense, Income, PurchaseGoal, Contribution, ExpenseLimit, MonthlyBudget, Compte, CompteType, Transfer, LockType, BudgetExpenseAllocation, UserSettings } from '@/lib/cashruler/types';
import { COMPTE_TYPE_DETAILS, PREDEFINED_COMPTE_COURANT_ID, CURRENCY_SYMBOL, EXPENSE_CATEGORIES } from '@/lib/cashruler/constants';
import { toast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';


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
};

const defaultState: AppState = {
  comptes: [],
  incomes: [],
  expenses: [],
  purchaseGoals: [],
  expenseLimits: [],
  monthlyBudgets: [],
  transfers: [],
  userSettings: defaultUserSettings,
  isLoading: true,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [appState, setAppState] = useState<AppState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);

  const loadState = () => {
    const savedStateString = localStorage.getItem('cashrulerState');
    let initialState = { ...defaultState, comptes: [...initialDefaultComptes], userSettings: {...defaultUserSettings} };

    if (savedStateString) {
      try {
        const parsedState = JSON.parse(savedStateString);
        
        // Migration for 'caisses' to 'comptes'
        let loadedComptes = parsedState.comptes || parsedState.caisses || parsedState.savingsAccounts || [];
        const finalComptes = [...initialDefaultComptes];

        loadedComptes.forEach((loadedCompte: any) => {
            const isPredefined = initialDefaultComptes.some(pc => pc.id === loadedCompte.id);
            const existingIndex = finalComptes.findIndex(pc => pc.id === loadedCompte.id);

            let migratedLockStatus: LockType = 'none';
            if (typeof loadedCompte.isLocked === 'boolean') {
                migratedLockStatus = loadedCompte.isLocked ? 'full' : 'none';
            } else if (loadedCompte.lockStatus && ['none', 'outgoing_only', 'full'].includes(loadedCompte.lockStatus)) {
                migratedLockStatus = loadedCompte.lockStatus;
            } else if (isPredefined) {
                const predefinedDetails = Object.values(COMPTE_TYPE_DETAILS).find(d => d.id === loadedCompte.id);
                migratedLockStatus = predefinedDetails?.defaultLockStatus || 'none';
            } else {
                migratedLockStatus = 'none';
            }
            
            let compteTypeCandidate = loadedCompte.type;
            if (!Object.keys(COMPTE_TYPE_DETAILS).includes(compteTypeCandidate)) {
                if (compteTypeCandidate === 'emergency_fund') compteTypeCandidate = 'URGENCE';
                else if (compteTypeCandidate === 'future_purchases') compteTypeCandidate = 'CUSTOM_PROJET';
                else if (compteTypeCandidate === 'general_savings' || typeof compteTypeCandidate === 'undefined' || compteTypeCandidate === 'general') compteTypeCandidate = 'CUSTOM_EPARGNE';
                else compteTypeCandidate = 'CUSTOM_AUTRE';
            }

            const convertedCompte: Compte = {
                id: loadedCompte.id,
                name: loadedCompte.name,
                type: compteTypeCandidate as CompteType,
                iconName: loadedCompte.iconName || COMPTE_TYPE_DETAILS[compteTypeCandidate as CompteType]?.icon?.displayName || 'PiggyBank',
                color: loadedCompte.color || COMPTE_TYPE_DETAILS[compteTypeCandidate as CompteType]?.defaultColor,
                contributions: loadedCompte.contributions || [],
                targetAmount: loadedCompte.targetAmount,
                lockStatus: migratedLockStatus,
                isPredefined: isPredefined,
            };

            if (existingIndex !== -1) {
                finalComptes[existingIndex] = {
                     ...finalComptes[existingIndex], 
                     name: convertedCompte.name,
                     iconName: convertedCompte.iconName,
                     color: convertedCompte.color,
                     contributions: convertedCompte.contributions,
                     targetAmount: convertedCompte.targetAmount,
                     lockStatus: convertedCompte.lockStatus,
                };
            } else if (!isPredefined) {
                finalComptes.push(convertedCompte);
            }
        });
        
        let migratedPurchaseGoals = parsedState.purchaseGoals || parsedState.savingProjects || [];
        const defaultCompteCourantId = PREDEFINED_COMPTE_COURANT_ID;
        
        migratedPurchaseGoals = migratedPurchaseGoals.map((pg: any) => ({
            ...pg,
            fundingCompteId: finalComptes.some(c => c.id === pg.fundingCompteId || c.id === pg.fundingCaisseId || c.id === pg.savingsAccountId)
                               ? (pg.fundingCompteId || pg.fundingCaisseId || pg.savingsAccountId)
                               : (finalComptes.find(c => c.type === 'CUSTOM_PROJET')?.id || defaultCompteCourantId),
            contributions: pg.contributions || [],
            isCompletedNotified: pg.isCompletedNotified || false,
        }));

        initialState = {
          ...defaultState,
          comptes: finalComptes.map(c => ({...c, contributions: c.contributions || [], lockStatus: c.lockStatus || 'none'})),
          incomes: (parsedState.incomes || []).map((inc: Income) => ({...inc, targetCompteId: finalComptes.some(fc => fc.id === inc.targetCompteId) ? inc.targetCompteId : PREDEFINED_COMPTE_COURANT_ID })),
          expenses: (parsedState.expenses || []).map((exp: Expense) => ({...exp, sourceCompteId: finalComptes.some(fc => fc.id === exp.sourceCompteId) ? exp.sourceCompteId : PREDEFINED_COMPTE_COURANT_ID })),
          purchaseGoals: migratedPurchaseGoals.map((pg: PurchaseGoal) => ({...pg, contributions: pg.contributions || []})),
          expenseLimits: parsedState.expenseLimits || [],
          monthlyBudgets: (parsedState.monthlyBudgets || []).map((budget: MonthlyBudget) => ({
            ...budget,
            id: budget.id || budget.monthYear,
            monthYear: budget.monthYear || budget.id,
            expenseAllocations: (budget.expenseAllocations || []).map(ea => ({...ea, notifiedThreshold: ea.notifiedThreshold || 0 })),
            savingsAllocations: (budget.savingsAllocations || []).map(sa => ({
                ...sa, 
                targetCompteId: finalComptes.some(fc => fc.id === sa.targetCompteId) ? sa.targetCompteId : PREDEFINED_COMPTE_COURANT_ID 
            })),
            referenceIncome: budget.referenceIncome || 0,
            targetSavingsAmount: (budget.savingsAllocations || []).reduce((sum, alloc) => sum + alloc.allocatedAmount, 0),
          })),
          transfers: (parsedState.transfers || []).filter((t: Transfer) => finalComptes.some(fc => fc.id === t.fromCompteId) && finalComptes.some(fc => fc.id === t.toCompteId) ),
          userSettings: { ...defaultUserSettings, ...(parsedState.userSettings || {}) },
        };

      } catch (error) {
        console.error("Failed to parse or migrate state from localStorage", error);
         initialState = { ...defaultState, comptes: [...initialDefaultComptes], userSettings: {...defaultUserSettings} };
      }
    } else {
        initialState.comptes = initialDefaultComptes.map(c => ({
            ...c,
            lockStatus: COMPTE_TYPE_DETAILS[c.type]?.defaultLockStatus || 'none'
        }));
    }

    setAppState(initialState);
    setIsLoading(false);
  };

  useEffect(() => {
    loadState();
  }, []);


  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('cashrulerState', JSON.stringify(appState));
    }
  }, [appState, isLoading]);

  // --- User Settings ---
  const updateUserSettings = (newSettings: Partial<UserSettings>) => {
    setAppState(prev => ({
      ...prev,
      userSettings: { ...prev.userSettings, ...newSettings },
    }));
  };

  const resetApplicationData = () => {
    localStorage.removeItem('cashrulerState');
    const reinitializedState = {
      ...defaultState,
      comptes: [...initialDefaultComptes].map(c => ({
        ...c,
        lockStatus: COMPTE_TYPE_DETAILS[c.type]?.defaultLockStatus || 'none'
      })),
      userSettings: {...defaultUserSettings},
      isLoading: false, 
    };
    setAppState(reinitializedState);
    toast({ title: "Application Réinitialisée", description: "Toutes vos données ont été effacées." });
  };

  // --- Comptes ---
  const addCompte = (compte: Omit<Compte, 'id' | 'contributions' | 'isPredefined'>) => {
    setAppState(prev => ({
      ...prev,
      comptes: [...prev.comptes, { ...compte, id: Date.now().toString() + Math.random().toString(36).substring(2,9), contributions: [], isPredefined: false, lockStatus: compte.lockStatus || 'none' }],
    }));
  };
  const updateCompte = (updatedCompte: Compte) => {
    setAppState(prev => ({
      ...prev,
      comptes: prev.comptes.map(c =>
        c.id === updatedCompte.id ? { ...updatedCompte, contributions: updatedCompte.contributions || [], lockStatus: updatedCompte.lockStatus || 'none' } : c
      ),
    }));
  };
  const deleteCompte = (id: string) => {
    const compteToDelete = appState.comptes.find(c => c.id === id);
    if (compteToDelete?.isPredefined) {
      toast({ title: "Action non autorisée", description: "Les comptes prédéfinis ne peuvent pas être supprimés.", variant: "destructive"});
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
        targetSavingsAmount: mb.savingsAllocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0)
      })),
      transfers: prev.transfers.filter(t => t.fromCompteId !== id && t.toCompteId !== id),
    }));
  };
  const addContributionToCompte = (compteId: string, contribution: Omit<Contribution, 'id'>) => {
    const targetCompte = appState.comptes.find(c => c.id === compteId);
    if (!targetCompte) {
        toast({ title: "Erreur", description: "Compte non trouvé.", variant: "destructive"});
        return;
    }
    if (targetCompte.lockStatus === 'full') {
        toast({ title: "Action non autorisée", description: `Le compte "${targetCompte.name}" est entièrement verrouillé et ne peut pas recevoir de contributions.`, variant: "destructive"});
        return;
    }
    setAppState(prev => ({
      ...prev,
      comptes: prev.comptes.map(c =>
        c.id === compteId
        ? { ...c, contributions: [...(c.contributions || []), { ...contribution, id: Date.now().toString() + Math.random().toString(36).substring(2,9) }] }
        : c
      ),
    }));

    const compteEpargneTypes: CompteType[] = ['URGENCE', 'INVESTISSEMENT', 'OEUVRES_ROYAUME', 'CUSTOM_EPARGNE', 'CUSTOM_PROJET'];
    if (appState.userSettings.enableMotivationalMessages && appState.userSettings.enableMotivationalMessages && compteEpargneTypes.includes(targetCompte.type)) {
        toast({
            title: "Excellent Progrès !",
            description: `Contribution ajoutée au compte "${targetCompte.name}". Chaque pas compte !`,
            variant: "default",
        });
    }
  };

  // --- Incomes ---
  const addIncome = (income: Omit<Income, 'id'>) => {
    const targetCompte = appState.comptes.find(c => c.id === income.targetCompteId);
    if (targetCompte?.lockStatus === 'full') {
        toast({ title: "Action non autorisée", description: `Le compte "${targetCompte.name}" est entièrement verrouillé et ne peut pas recevoir de revenus.`, variant: "destructive"});
        return;
    }
    setAppState(prev => ({
      ...prev,
      incomes: [...prev.incomes, { ...income, id: Date.now().toString() + Math.random().toString(36).substring(2,9) }],
    }));
  };
  const updateIncome = (updatedIncome: Income) => {
    const targetCompte = appState.comptes.find(c => c.id === updatedIncome.targetCompteId);
    if (targetCompte?.lockStatus === 'full') {
        toast({ title: "Action non autorisée", description: `Le compte de destination "${targetCompte.name}" est entièrement verrouillé.`, variant: "destructive"});
        return;
    }
    setAppState(prev => ({
      ...prev,
      incomes: prev.incomes.map(inc => inc.id === updatedIncome.id ? updatedIncome : inc),
    }));
  };
  const deleteIncome = (id: string) => {
    setAppState(prev => ({
      ...prev,
      incomes: prev.incomes.filter(inc => inc.id !== id),
    }));
  };

  // --- Expenses ---
  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const sourceCompte = appState.comptes.find(c => c.id === expense.sourceCompteId);
    if (sourceCompte && (sourceCompte.lockStatus === 'full' || sourceCompte.lockStatus === 'outgoing_only')) {
        toast({ title: "Action non autorisée", description: `Les dépenses depuis le compte "${sourceCompte.name}" sont bloquées (statut: ${sourceCompte.lockStatus}).`, variant: "destructive"});
        return;
    }
    setAppState(prev => {
      const newExpenses = [...prev.expenses, { ...expense, id: Date.now().toString() + Math.random().toString(36).substring(2,9) }];
      let newMonthlyBudgets = prev.monthlyBudgets;

      if (prev.userSettings.enableBudgetNotifications && expense.sourceCompteId === PREDEFINED_COMPTE_COURANT_ID && expense.category) {
        const currentMonthYear = format(new Date(), 'yyyy-MM');
        const activeBudgetIndex = prev.monthlyBudgets.findIndex(b => b.monthYear === currentMonthYear);

        if (activeBudgetIndex !== -1) {
          const activeBudget = { ...prev.monthlyBudgets[activeBudgetIndex] };
          const allocationIndex = activeBudget.expenseAllocations.findIndex(a => a.category === expense.category);

          if (allocationIndex !== -1) {
            const allocation = { ...activeBudget.expenseAllocations[allocationIndex] };
            const expensesForCategoryThisMonth = newExpenses
              .filter(exp => exp.sourceCompteId === PREDEFINED_COMPTE_COURANT_ID && exp.category === expense.category && format(parseISO(exp.date), 'yyyy-MM') === currentMonthYear)
              .reduce((sum, exp) => sum + exp.amount, 0);

            const percentageSpent = allocation.allocatedAmount > 0 ? (expensesForCategoryThisMonth / allocation.allocatedAmount) * 100 : 0;
            
            let newNotifiedThreshold = allocation.notifiedThreshold || 0;

            const thresholds = [
                { limit: 100, message: `Budget Épuisé : Vous avez atteint 100% de votre budget pour '${EXPENSE_CATEGORIES.find(c=>c.name === expense.category)?.label || expense.category}'.`, notifiedValue: 100 },
                { limit: 75, message: `Alerte : Plus que 25% restants pour votre budget '${EXPENSE_CATEGORIES.find(c=>c.name === expense.category)?.label || expense.category}' !`, notifiedValue: 75 },
                { limit: 50, message: `Attention : Vous avez utilisé 50% de votre budget pour '${EXPENSE_CATEGORIES.find(c=>c.name === expense.category)?.label || expense.category}' ce mois-ci.`, notifiedValue: 50 },
            ];
            
            if (percentageSpent > 100 && newNotifiedThreshold < 101) {
                 toast({ title: "Budget Dépassé !", description: `Vous avez dépassé votre budget pour '${EXPENSE_CATEGORIES.find(c=>c.name === expense.category)?.label || expense.category}'.`, variant: "destructive" });
                 newNotifiedThreshold = 101; 
            } else {
                for (const threshold of thresholds) {
                    if (percentageSpent >= threshold.limit && newNotifiedThreshold < threshold.limit) {
                        toast({ title: "Suivi Budget", description: threshold.message });
                        newNotifiedThreshold = threshold.notifiedValue;
                        break; 
                    }
                }
            }
            
            if (newNotifiedThreshold !== (allocation.notifiedThreshold || 0)) {
                allocation.notifiedThreshold = newNotifiedThreshold;
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
  };

  const updateExpense = (updatedExpense: Expense) => {
     const sourceCompte = appState.comptes.find(c => c.id === updatedExpense.sourceCompteId);
    if (sourceCompte && (sourceCompte.lockStatus === 'full' || sourceCompte.lockStatus === 'outgoing_only')) {
        const originalExpense = appState.expenses.find(e => e.id === updatedExpense.id);
        if (originalExpense?.sourceCompteId !== updatedExpense.sourceCompteId) {
            toast({ title: "Action non autorisée", description: `Le nouveau compte source "${sourceCompte.name}" est verrouillé pour les sorties.`, variant: "destructive"});
            return;
        }
    }
    setAppState(prev => {
        const oldExpense = prev.expenses.find(e => e.id === updatedExpense.id);
        const newExpenses = prev.expenses.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp);
        let newMonthlyBudgets = prev.monthlyBudgets;

        const needsBudgetRecheck = 
            prev.userSettings.enableBudgetNotifications &&
            updatedExpense.sourceCompteId === PREDEFINED_COMPTE_COURANT_ID && updatedExpense.category &&
            (oldExpense?.category !== updatedExpense.category || 
             oldExpense?.amount !== updatedExpense.amount || 
             format(parseISO(oldExpense?.date || updatedExpense.date), 'yyyy-MM') !== format(parseISO(updatedExpense.date), 'yyyy-MM') ||
             oldExpense?.sourceCompteId !== updatedExpense.sourceCompteId);

        if (needsBudgetRecheck) {
            const currentMonthYear = format(parseISO(updatedExpense.date), 'yyyy-MM');
            const activeBudgetIndex = prev.monthlyBudgets.findIndex(b => b.monthYear === currentMonthYear);

            if (activeBudgetIndex !== -1 && updatedExpense.category) {
              const activeBudget = { ...prev.monthlyBudgets[activeBudgetIndex] };
              const allocationIndex = activeBudget.expenseAllocations.findIndex(a => a.category === updatedExpense.category);

              if (allocationIndex !== -1) {
                const allocation = { ...activeBudget.expenseAllocations[allocationIndex] };
                 const expensesForCategoryThisMonth = newExpenses
                  .filter(exp => exp.sourceCompteId === PREDEFINED_COMPTE_COURANT_ID && exp.category === updatedExpense.category && format(parseISO(exp.date), 'yyyy-MM') === currentMonthYear)
                  .reduce((sum, exp) => sum + exp.amount, 0);

                const percentageSpent = allocation.allocatedAmount > 0 ? (expensesForCategoryThisMonth / allocation.allocatedAmount) * 100 : 0;
                let newNotifiedThreshold = allocation.notifiedThreshold || 0; 
                
                const thresholds = [
                    { limit: 100, message: `Budget Épuisé : Vous avez atteint 100% de votre budget pour '${EXPENSE_CATEGORIES.find(c=>c.name === updatedExpense.category)?.label || updatedExpense.category}'.`, notifiedValue: 100 },
                    { limit: 75, message: `Alerte : Plus que 25% restants pour votre budget '${EXPENSE_CATEGORIES.find(c=>c.name === updatedExpense.category)?.label || updatedExpense.category}' !`, notifiedValue: 75 },
                    { limit: 50, message: `Attention : Vous avez utilisé 50% de votre budget pour '${EXPENSE_CATEGORIES.find(c=>c.name === updatedExpense.category)?.label || updatedExpense.category}' ce mois-ci.`, notifiedValue: 50 },
                ];

                if (percentageSpent > 100 && newNotifiedThreshold < 101) {
                    toast({ title: "Budget Dépassé !", description: `Vous avez dépassé votre budget pour '${EXPENSE_CATEGORIES.find(c=>c.name === updatedExpense.category)?.label || updatedExpense.category}'.`, variant: "destructive" });
                    newNotifiedThreshold = 101;
                } else if (percentageSpent <= 100) { 
                    if (newNotifiedThreshold > 75 && percentageSpent < 75) newNotifiedThreshold = 50;
                    else if (newNotifiedThreshold > 50 && percentageSpent < 50) newNotifiedThreshold = 0;
                    if (newNotifiedThreshold === 101 && percentageSpent <= 100) { 
                        if (percentageSpent >= 100) newNotifiedThreshold = 100;
                        else if (percentageSpent >= 75) newNotifiedThreshold = 75;
                        else if (percentageSpent >= 50) newNotifiedThreshold = 50;
                        else newNotifiedThreshold = 0;
                    }
                    for (const threshold of thresholds) {
                        if (percentageSpent >= threshold.limit && newNotifiedThreshold < threshold.limit) {
                            toast({ title: "Suivi Budget", description: threshold.message });
                            newNotifiedThreshold = threshold.notifiedValue;
                            break; 
                        }
                    }
                }
                if (newNotifiedThreshold !== (allocation.notifiedThreshold || 0)) {
                    allocation.notifiedThreshold = newNotifiedThreshold;
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
  };

  const deleteExpense = (id: string) => {
    setAppState(prev => ({
      ...prev,
      expenses: prev.expenses.filter(exp => exp.id !== id),
    }));
  };

  // --- Purchase Goals ---
  const addPurchaseGoal = (goal: Omit<PurchaseGoal, 'id' | 'contributions'>) => {
    setAppState(prev => ({
      ...prev,
      purchaseGoals: [...prev.purchaseGoals, { ...goal, id: Date.now().toString() + Math.random().toString(36).substring(2,9), contributions: [], isCompletedNotified: false }],
    }));
  };
  const updatePurchaseGoal = (updatedGoal: PurchaseGoal) => {
    setAppState(prev => ({
      ...prev,
      purchaseGoals: prev.purchaseGoals.map(g =>
        g.id === updatedGoal.id ? { ...updatedGoal, contributions: updatedGoal.contributions || [], isCompletedNotified: updatedGoal.isCompletedNotified || false } : g
      ),
    }));
  };
  const deletePurchaseGoal = (id: string) => {
    setAppState(prev => ({
      ...prev,
      purchaseGoals: prev.purchaseGoals.filter(g => g.id !== id),
    }));
  };
  
  const addContributionToPurchaseGoal = (goalId: string, contributionData: Omit<Contribution, 'id' | 'sourceCompteId'>, sourceCompteId: string) => {
    const compteSource = appState.comptes.find(c => c.id === sourceCompteId);
    if (compteSource && (compteSource.lockStatus === 'full' || compteSource.lockStatus === 'outgoing_only')) {
        toast({ title: "Action non autorisée", description: `Le compte source "${compteSource.name}" est verrouillé pour les sorties et ne peut pas contribuer à l'objectif.`, variant: "destructive"});
        return;
    }

    const contribution: Contribution = {
        ...contributionData,
        id: Date.now().toString() + Math.random().toString(36).substring(2,9),
        sourceCompteId: sourceCompteId,
    };

    let goalReachedAndNotNotified = false;
    let goalTitleForToast = "";

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

    if (appState.userSettings.enableMotivationalMessages) {
      toast({
          title: "Contribution Réussie !",
          description: `Contribution de ${contributionData.amount.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL} ajoutée à l'objectif "${goalTitleForToast}".`,
      });
    }

    if (goalReachedAndNotNotified && appState.userSettings.enableMotivationalMessages) {
        toast({
            title: "🎉 Objectif Atteint ! 🎉",
            description: `Félicitations ! Vous avez atteint votre objectif d'achat "${goalTitleForToast}".`,
            duration: 5000,
        });
    }
  };

  const getPurchaseGoalContributionsTotal = (goalId: string): number => {
    const goal = appState.purchaseGoals.find(g => g.id === goalId);
    return (goal?.contributions || []).reduce((sum, c) => sum + c.amount, 0);
  };

  // --- Expense Limits ---
  const addExpenseLimit = (limit: Omit<ExpenseLimit, 'id'>) => {
    if (appState.expenseLimits.some(l => l.category === limit.category)) {
        const existingLimit = appState.expenseLimits.find(l => l.category === limit.category);
        if (existingLimit) {
            updateExpenseLimit({ ...limit, id: existingLimit.id });
            return;
        }
    }
    setAppState(prev => ({
      ...prev,
      expenseLimits: [...prev.expenseLimits, { ...limit, id: Date.now().toString() + Math.random().toString(36).substring(2,9) }],
    }));
  };
  const updateExpenseLimit = (updatedLimit: ExpenseLimit) => {
    setAppState(prev => ({
      ...prev,
      expenseLimits: prev.expenseLimits.map(l => l.id === updatedLimit.id ? updatedLimit : l),
    }));
  };
  const deleteExpenseLimit = (id: string) => {
     setAppState(prev => ({
      ...prev,
      expenseLimits: prev.expenseLimits.filter(l => l.id !== id),
    }));
  };

  // --- Monthly Budgets ---
  const addMonthlyBudget = (budget: MonthlyBudget) => {
    const budgetMonthFormatted = format(parseISO(budget.monthYear + "-01"), "MMMM yyyy", { locale: fr });
    setAppState(prev => {
      const budgetWithCalculatedSavings = {
        ...budget,
        id: budget.monthYear, 
        targetSavingsAmount: (budget.savingsAllocations || []).reduce((sum, alloc) => sum + alloc.allocatedAmount, 0),
        expenseAllocations: (budget.expenseAllocations || []).map(ea => ({...ea, notifiedThreshold: ea.notifiedThreshold || 0})),
      };
      const existingBudget = prev.monthlyBudgets.some(b => b.id === budgetWithCalculatedSavings.id);
      
      if (prev.userSettings.enableMotivationalMessages) {
        if (existingBudget) {
           toast({ title: "Budget Mis à Jour", description: `Le budget pour ${budgetMonthFormatted} a été mis à jour.`});
        } else {
           toast({ title: "Budget Créé !", description: `Excellent ! Votre budget pour ${budgetMonthFormatted} est prêt. Un grand pas vers vos objectifs !`});
        }
      }

      if (existingBudget) {
        return {
          ...prev,
          monthlyBudgets: prev.monthlyBudgets.map(b => b.id === budgetWithCalculatedSavings.id ? budgetWithCalculatedSavings : b),
        };
      }
      return {
        ...prev,
        monthlyBudgets: [...prev.monthlyBudgets, budgetWithCalculatedSavings],
      };
    });
  };

  const updateMonthlyBudget = (updatedBudget: MonthlyBudget) => {
     const budgetWithCalculatedSavings = {
        ...updatedBudget,
        id: updatedBudget.monthYear,
        targetSavingsAmount: (updatedBudget.savingsAllocations || []).reduce((sum, alloc) => sum + alloc.allocatedAmount, 0),
        expenseAllocations: (updatedBudget.expenseAllocations || []).map(ea => ({...ea, notifiedThreshold: ea.notifiedThreshold || 0})),
      };
    const budgetMonthFormatted = format(parseISO(updatedBudget.monthYear + "-01"), "MMMM yyyy", { locale: fr });
    setAppState(prev => ({
      ...prev,
      monthlyBudgets: prev.monthlyBudgets.map(b => b.id === budgetWithCalculatedSavings.id ? budgetWithCalculatedSavings : b),
    }));
    if (appState.userSettings.enableMotivationalMessages) {
      toast({ title: "Budget Mis à Jour", description: `Le budget pour ${budgetMonthFormatted} a été mis à jour avec succès.`});
    }
  };

  const getMonthlyBudget = (monthYear: string): MonthlyBudget | undefined => {
    return appState.monthlyBudgets.find(b => b.id === monthYear);
  };

  // --- Transfers ---
  const addTransfer = (transfer: Omit<Transfer, 'id'>) => {
    const sourceCompte = appState.comptes.find(c => c.id === transfer.fromCompteId);
    const destCompte = appState.comptes.find(c => c.id === transfer.toCompteId);

    if (sourceCompte && (sourceCompte.lockStatus === 'full' || sourceCompte.lockStatus === 'outgoing_only')) {
        toast({ title: "Action non autorisée", description: `Le compte source "${sourceCompte.name}" est verrouillé pour les sorties.`, variant: "destructive"});
        return;
    }
    if (destCompte && destCompte.lockStatus === 'full') {
        toast({ title: "Action non autorisée", description: `Le compte de destination "${destCompte.name}" est entièrement verrouillé et ne peut pas recevoir de fonds.`, variant: "destructive"});
        return;
    }

    setAppState(prev => ({
        ...prev,
        transfers: [...prev.transfers, {...transfer, id: Date.now().toString() + Math.random().toString(36).substring(2,9) }]
    }));
  };

  // --- Balance Calculations ---
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
