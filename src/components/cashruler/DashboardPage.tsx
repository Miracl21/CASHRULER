
'use client';

import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, DollarSign, Edit2, Trash2, ShieldAlert, ShieldCheck, Send, PiggyBank, TrendingUp, TrendingDown, Sparkles, Flame } from 'lucide-react';
import ExpenseForm from './ExpenseForm';
import IncomeForm from './IncomeForm';
import TransferForm from './TransferForm';
import ExpenseLimitForm from './ExpenseLimitForm';
import { useAppContext } from '@/contexts/AppContext';
import { CURRENCY_SYMBOL, EXPENSE_CATEGORIES, PREDEFINED_COMPTE_COURANT_ID, COMPTE_TYPE_DETAILS } from '@/lib/cashruler/constants';
import type { ExpenseLimit, Compte } from '@/lib/cashruler/types';
import CategoryIconMapper from './CategoryIconMapper';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { calculateStreak } from '@/lib/cashruler/coach-engine';


const DashboardPage: FC = () => {
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isIncomeFormOpen, setIsIncomeFormOpen] = useState(false);
  const [isTransferFormOpen, setIsTransferFormOpen] = useState(false);
  const [isExpenseLimitFormOpen, setIsExpenseLimitFormOpen] = useState(false);

  const [editingExpenseLimit, setEditingExpenseLimit] = useState<ExpenseLimit | undefined>(undefined);

  const { expenses, isLoading: isAppContextLoading, expenseLimits, deleteExpenseLimit, comptes, getCompteBalance, userSettings } = useAppContext();
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [limitToDelete, setLimitToDelete] = useState<string | null>(null);


  useEffect(() => {
    setCurrentDate(new Date());
  }, []);


  const expensesTodayFromCompteCourant = useMemo(() => {
    if (!currentDate || isAppContextLoading) return [];
    const todayStr = format(currentDate, 'yyyy-MM-dd');
    return expenses.filter(exp => exp.sourceCompteId === PREDEFINED_COMPTE_COURANT_ID && format(parseISO(exp.date), 'yyyy-MM-dd') === todayStr);
  }, [expenses, currentDate, isAppContextLoading]);

  const totalExpensesTodayFromCompteCourant = useMemo(() => {
    return expensesTodayFromCompteCourant.reduce((sum, exp) => sum + exp.amount, 0);
  }, [expensesTodayFromCompteCourant]);

  const compteCourantBalance = useMemo(() => {
    if (isAppContextLoading) return 0;
    return getCompteBalance(PREDEFINED_COMPTE_COURANT_ID);
  }, [getCompteBalance, isAppContextLoading, comptes]);

  // ── Motivational Messages ──
  const motivationalMessage = useMemo(() => {
    if (!currentDate || isAppContextLoading || !userSettings.enableMotivationalMessages) return null;

    const messages: string[] = [];

    if (totalExpensesTodayFromCompteCourant === 0) {
      messages.push("🌟 Aucune dépense aujourd'hui — excellente discipline !");
    }
    if (compteCourantBalance > 0 && totalExpensesTodayFromCompteCourant < compteCourantBalance * 0.01) {
      messages.push("💰 Vous gérez bien votre argent. Continuez !");
    }

    const allLimitsRespected = expenseLimits.length > 0 && expenseLimits.every(limit => {
      const spent = expensesTodayFromCompteCourant
        .filter(exp => exp.category === limit.category)
        .reduce((sum, exp) => sum + exp.amount, 0);
      return spent <= limit.dailyAmount;
    });
    if (allLimitsRespected && expenseLimits.length > 0) {
      messages.push("✅ Toutes vos limites sont respectées. Bravo !");
    }

    const generalMessages = [
      "🚀 Chaque franc épargné est un pas vers vos objectifs.",
      "🎯 La constance bat l'intensité — gardez le cap !",
      "💪 Votre avenir financier se construit aujourd'hui.",
      "🌱 Petites économies + temps = grande richesse.",
    ];

    if (messages.length === 0) {
      const dayIndex = currentDate.getDate() % generalMessages.length;
      return generalMessages[dayIndex];
    }

    return messages[0];
  }, [currentDate, isAppContextLoading, userSettings.enableMotivationalMessages, totalExpensesTodayFromCompteCourant, compteCourantBalance, expenseLimits, expensesTodayFromCompteCourant]);

  const streakInfo = useMemo(() => {
    if (!userSettings.enableStreakTracking || isAppContextLoading) return null;
    return calculateStreak(expenses, expenseLimits);
  }, [expenses, expenseLimits, userSettings.enableStreakTracking, isAppContextLoading]);


  if (isAppContextLoading || !currentDate) {
    return (
      <div className="h-full overflow-y-auto overflow-x-hidden">
        <div className="p-4 space-y-5 pb-6">
          {/* Skeleton Hero */}
          <div className="gradient-primary rounded-2xl p-6 shadow-lg">
            <Skeleton className="h-4 w-40 bg-white/20 mb-3" />
            <Skeleton className="h-8 w-56 bg-white/20 mb-2" />
            <Skeleton className="h-3 w-48 bg-white/20" />
          </div>
          {/* Skeleton Actions */}
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }


  const handleAddExpenseLimit = () => {
    setEditingExpenseLimit(undefined);
    setIsExpenseLimitFormOpen(true);
  };

  const handleEditExpenseLimit = (limit: ExpenseLimit) => {
    setEditingExpenseLimit(limit);
    setIsExpenseLimitFormOpen(true);
  };

  const handleDeleteExpenseLimitRequest = (id: string) => {
    setLimitToDelete(id);
    setDialogOpen(true);
  };

  const confirmDeleteLimit = () => {
    if (limitToDelete) {
      deleteExpenseLimit(limitToDelete);
    }
    setDialogOpen(false);
    setLimitToDelete(null);
  };

  const keyComptes = comptes.filter(c => c.isPredefined || c.type === 'CUSTOM_EPARGNE').slice(0, 4);


  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="p-4 space-y-5 pb-6">

        {/* ── Hero Card ── */}
        <div className="gradient-primary rounded-2xl p-5 shadow-lg text-white animate-slide-up">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-white/80">
              {userSettings.username ? `Bonjour, ${userSettings.username}` : 'Bienvenue sur CASHRULER'}
            </p>
            <span className="text-[11px] text-white/60 font-medium">
              {format(currentDate, 'd MMM yyyy', { locale: fr })}
            </span>
          </div>
          {streakInfo && streakInfo.days >= 2 && (
            <div className="flex items-center gap-1.5 mt-1 bg-white/10 rounded-lg px-2.5 py-1 w-fit">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-[11px] text-white/90 font-semibold">{streakInfo.message}</span>
            </div>
          )}
          <p className="text-3xl font-bold tracking-tight mt-1">
            {compteCourantBalance.toLocaleString('fr-FR')} <span className="text-lg font-semibold text-white/80">{CURRENCY_SYMBOL}</span>
          </p>
          <p className="text-xs text-white/70 mt-1.5 font-medium">Solde Compte Courant</p>

          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-red-300" />
              <span className="text-xs text-white/80">Dépenses aujourd'hui</span>
            </div>
            <span className="text-sm font-bold text-white">
              {totalExpensesTodayFromCompteCourant.toLocaleString('fr-FR')} {CURRENCY_SYMBOL}
            </span>
          </div>

          {/* Motivational Message */}
          {motivationalMessage && (
            <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300 flex-shrink-0" />
              <p className="text-[11px] text-white/75 font-medium">{motivationalMessage}</p>
            </div>
          )}
        </div>

        {/* ── Quick Actions ── */}
        <section className="animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setIsExpenseFormOpen(true)}
              className="flex flex-col items-center justify-center py-4 px-2 rounded-xl bg-red-50 border border-red-100 press-scale transition-all duration-200 hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-full gradient-expense flex items-center justify-center mb-2 shadow-sm">
                <PlusCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-[11px] font-semibold text-red-700">Dépense</span>
            </button>

            <button
              onClick={() => setIsIncomeFormOpen(true)}
              className="flex flex-col items-center justify-center py-4 px-2 rounded-xl bg-emerald-50 border border-emerald-100 press-scale transition-all duration-200 hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-full gradient-income flex items-center justify-center mb-2 shadow-sm">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span className="text-[11px] font-semibold text-emerald-700">Revenu</span>
            </button>

            <button
              onClick={() => setIsTransferFormOpen(true)}
              className="flex flex-col items-center justify-center py-4 px-2 rounded-xl bg-blue-50 border border-blue-100 press-scale transition-all duration-200 hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-full gradient-transfer flex items-center justify-center mb-2 shadow-sm">
                <Send className="h-5 w-5 text-white" />
              </div>
              <span className="text-[11px] font-semibold text-blue-700">Transfert</span>
            </button>
          </div>
        </section>

        <ExpenseForm isOpen={isExpenseFormOpen} onOpenChange={setIsExpenseFormOpen} />
        <IncomeForm isOpen={isIncomeFormOpen} onOpenChange={setIsIncomeFormOpen} />
        <TransferForm isOpen={isTransferFormOpen} onOpenChange={setIsTransferFormOpen} />
        <ExpenseLimitForm
          isOpen={isExpenseLimitFormOpen}
          onOpenChange={(isOpen) => {
            setIsExpenseLimitFormOpen(isOpen);
            if (!isOpen) setEditingExpenseLimit(undefined);
          }}
          limitToEdit={editingExpenseLimit}
        />

        {/* ── Key Accounts ── */}
        <Card className="glass-card border-0 animate-slide-up" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">Aperçu des Comptes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {keyComptes.map(compte => {
              const CompteIcon = COMPTE_TYPE_DETAILS[compte.type]?.icon || PiggyBank;
              const balance = getCompteBalance(compte.id);
              return (
                <div key={compte.id} className="flex justify-between items-center p-3 rounded-xl bg-muted/50 transition-all duration-200 hover:bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${compte.color || '#6B7280'}15` }}>
                      <CompteIcon className="h-4.5 w-4.5" style={{ color: compte.color || 'hsl(var(--foreground))' }} />
                    </div>
                    <span className="text-sm font-medium text-foreground">{compte.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-foreground">
                      {balance.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-xs text-muted-foreground">{CURRENCY_SYMBOL}</span>
                  </div>
                </div>
              );
            })}
            {keyComptes.length === 0 && <p className="text-muted-foreground text-center py-4 text-sm">Aucun compte clé à afficher.</p>}
          </CardContent>
        </Card>


        {/* ── Expense Limits ── */}
        <Card className="glass-card border-0 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-semibold text-foreground">Défis Budgétaires</CardTitle>
              <Button size="sm" variant="ghost" onClick={handleAddExpenseLimit} className="text-xs text-primary hover:text-primary h-8 px-2 press-scale">
                <PlusCircle className="mr-1 h-3.5 w-3.5" /> Ajouter
              </Button>
            </div>
            <CardDescription className="text-xs">Limites quotidiennes — Compte Courant</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseLimits.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-sm">Aucune limite de dépense définie.</p>
            ) : (
              <div className="space-y-3">
                {expenseLimits.map(limit => {
                  const spentTodayForCategory = expensesTodayFromCompteCourant
                    .filter(exp => exp.category === limit.category)
                    .reduce((sum, exp) => sum + exp.amount, 0);
                  const progress = limit.dailyAmount > 0 ? (spentTodayForCategory / limit.dailyAmount) * 100 : 0;
                  const remaining = limit.dailyAmount - spentTodayForCategory;
                  const categoryInfo = EXPENSE_CATEGORIES.find(c => c.name === limit.category);
                  const isOverLimit = spentTodayForCategory > limit.dailyAmount;

                  return (
                    <div key={limit.id} className="p-3 rounded-xl bg-muted/30 transition-all duration-200 hover:bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {categoryInfo && <CategoryIconMapper categoryName={limit.category} type="expense" className="h-4 w-4 text-primary" />}
                          <span className="font-medium text-sm text-foreground">{categoryInfo?.label || limit.category}</span>
                        </div>
                        <div className="flex gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEditExpenseLimit(limit)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteExpenseLimitRequest(limit.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="relative">
                        <Progress
                          value={Math.min(100, progress)}
                          className={`h-2.5 rounded-full ${isOverLimit ? '[&>*]:bg-destructive bg-destructive/20' : '[&>*]:bg-primary bg-primary/15'}`}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[11px] mt-1.5">
                        <span className={isOverLimit ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                          {spentTodayForCategory.toLocaleString('fr-FR')} / {limit.dailyAmount.toLocaleString('fr-FR')} {CURRENCY_SYMBOL}
                        </span>
                        {isOverLimit ? (
                          <span className="text-destructive font-semibold flex items-center"><ShieldAlert className="h-3 w-3 mr-0.5" /> Dépassé</span>
                        ) : (
                          <span className="text-primary font-medium flex items-center"><ShieldCheck className="h-3 w-3 mr-0.5" /> {remaining.toLocaleString('fr-FR')} restant</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogContent className="glass-card border-0 animate-scale-in">
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action ne peut pas être annulée. Cela supprimera définitivement cette limite de dépense.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setLimitToDelete(null)}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteLimit} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div >
  );
};

export default DashboardPage;
