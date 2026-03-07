
'use client';

import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, Edit3, Banknote, PiggyBank, CalendarDays, Info, Target, Scale } from 'lucide-react';
import MonthlyBudgetForm from './MonthlyBudgetForm';
import { useAppContext } from '@/contexts/AppContext';
import { CURRENCY_SYMBOL, EXPENSE_CATEGORIES, PREDEFINED_COMPTE_COURANT_ID, COMPTE_TYPE_DETAILS } from '@/lib/cashruler/constants';
import type { MonthlyBudget, Compte } from '@/lib/cashruler/types';
import CategoryIconMapper from './CategoryIconMapper';
import { format, parseISO, differenceInDays, endOfMonth, startOfMonth, isWithinInterval, subMonths, addMonths, eachMonthOfInterval, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const BudgetPage: FC = () => {
  const [isMonthlyBudgetFormOpen, setIsMonthlyBudgetFormOpen] = useState(false);
  const [editingMonthlyBudget, setEditingMonthlyBudget] = useState<MonthlyBudget | undefined>(undefined);
  const { expenses, getMonthlyBudget, isLoading: isAppContextLoading, monthlyBudgets, comptes } = useAppContext();

  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
    const today = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(startOfMonth(today), 6),
      end: addMonths(startOfMonth(today), 6)
    }).map(date => format(date, 'yyyy-MM')).reverse();
    setAvailableMonths(months);
    if (!getMonthlyBudget(selectedMonthYear) && format(today, 'yyyy-MM') !== selectedMonthYear) {
      if (getMonthlyBudget(format(today, 'yyyy-MM'))) {
        setSelectedMonthYear(format(today, 'yyyy-MM'));
      }
    }
  }, [getMonthlyBudget, selectedMonthYear]); // Added selectedMonthYear as dependency

  const activeMonthlyBudget = useMemo(() => getMonthlyBudget(selectedMonthYear), [getMonthlyBudget, selectedMonthYear]);
  const compteCourant = useMemo(() => comptes.find(c => c.id === PREDEFINED_COMPTE_COURANT_ID), [comptes]);

  const expensesThisSelectedMonthFromCompteCourant = useMemo(() => {
    if (!selectedMonthYear || !compteCourant) return [];
    const [year, month] = selectedMonthYear.split('-').map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1, 1));
    const monthEnd = endOfMonth(new Date(year, month - 1, 1));
    return expenses.filter(exp => {
      const expDate = parseISO(exp.date);
      return exp.sourceCompteId === compteCourant.id && isWithinInterval(expDate, { start: monthStart, end: monthEnd });
    });
  }, [expenses, selectedMonthYear, compteCourant]);

  const handleOpenMonthlyBudgetForm = (budget?: MonthlyBudget) => {
    setEditingMonthlyBudget(budget);
    setIsMonthlyBudgetFormOpen(true);
  };

  let daysToConsiderForSuggestion = 0;
  if (currentDate && selectedMonthYear) {
    const [year, monthVal] = selectedMonthYear.split('-').map(Number);
    const startOfSelectedMonth = startOfMonth(new Date(year, monthVal - 1, 1));
    const endOfSelectedMonth = endOfMonth(new Date(year, monthVal - 1, 1));

    if (format(currentDate, 'yyyy-MM') === selectedMonthYear) {
      daysToConsiderForSuggestion = differenceInDays(endOfSelectedMonth, currentDate) + 1;
    } else if (isBefore(startOfSelectedMonth, startOfMonth(currentDate))) {
      daysToConsiderForSuggestion = 0;
    } else {
      daysToConsiderForSuggestion = differenceInDays(endOfSelectedMonth, startOfSelectedMonth) + 1;
    }
    daysToConsiderForSuggestion = Math.max(0, daysToConsiderForSuggestion);
  }


  if (isAppContextLoading || !currentDate) {
    return (
      <div className="p-4 flex flex-col h-full bg-background">
        <Skeleton className="h-8 w-1/2 mb-2" />
        <Skeleton className="h-10 w-1/3 mb-6" />
        <Skeleton className="h-40 w-full mb-4" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="p-4 flex flex-col space-y-5 pb-6">
        <div className="space-y-3 animate-slide-up">
          <h1 className="text-xl font-bold text-foreground flex items-center"><Scale className="mr-2 h-5 w-5 text-primary flex-shrink-0" />Budget Mensuel</h1>
          <div className="flex items-center gap-2">
            <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
              <SelectTrigger className="flex-1 min-w-0 bg-muted/50 border-0">
                <SelectValue placeholder="Sélectionner un mois" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month}>
                    {format(parseISO(month + '-01'), 'MMMM yyyy', { locale: fr })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={() => handleOpenMonthlyBudgetForm(activeMonthlyBudget)}
              className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-white gradient-primary shadow-md press-scale transition-all whitespace-nowrap"
            >
              <PlusCircle className="h-3.5 w-3.5" /> {activeMonthlyBudget ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </div>

        {activeMonthlyBudget ? (
          <Card className="glass-card border-0 animate-slide-up" style={{ animationDelay: '0.05s', animationFillMode: 'both' }}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-semibold text-foreground flex items-center">
                  <Banknote className="mr-2 h-4 w-4 text-primary" /> {format(parseISO(activeMonthlyBudget.monthYear + '-01'), 'MMMM yyyy', { locale: fr })}
                </CardTitle>
                <Button size="sm" variant="ghost" onClick={() => handleOpenMonthlyBudgetForm(activeMonthlyBudget)} className="text-xs text-primary h-7 px-2 press-scale">
                  <Edit3 className="mr-1 h-3 w-3" /> Modifier
                </Button>
              </div>
              <CardDescription className="text-xs">Revenu alloué: {activeMonthlyBudget.referenceIncome.toLocaleString('fr-FR')} {CURRENCY_SYMBOL}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Allocations de Dépenses (Compte Courant):</h3>
                {activeMonthlyBudget.expenseAllocations.length > 0 ? (
                  activeMonthlyBudget.expenseAllocations.map(alloc => {
                    const spentThisMonthForCategory = expensesThisSelectedMonthFromCompteCourant
                      .filter(exp => exp.category === alloc.category)
                      .reduce((sum, exp) => sum + exp.amount, 0);
                    const progress = alloc.allocatedAmount > 0 ? Math.min(100, (spentThisMonthForCategory / alloc.allocatedAmount) * 100) : 0;
                    const categoryInfo = EXPENSE_CATEGORIES.find(c => c.name === alloc.category);
                    const isOverBudgetCategory = spentThisMonthForCategory > alloc.allocatedAmount;
                    const remainingBudgetForCategory = alloc.allocatedAmount - spentThisMonthForCategory;

                    let dailySuggestionText = "";
                    let suggestionColor = "text-muted-foreground";

                    if (daysToConsiderForSuggestion > 0) {
                      if (remainingBudgetForCategory > 0) {
                        const dailySuggestionAmount = remainingBudgetForCategory / daysToConsiderForSuggestion;
                        dailySuggestionText = `~${dailySuggestionAmount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} ${CURRENCY_SYMBOL}/jour suggéré`;
                        suggestionColor = "text-green-600";
                      } else {
                        dailySuggestionText = `Budget catégorie atteint ou dépassé`;
                        if (isOverBudgetCategory) suggestionColor = "text-destructive";
                      }
                    } else {
                      if (remainingBudgetForCategory > 0) {
                        dailySuggestionText = `Budget non dépassé. Mois terminé.`;
                      } else if (remainingBudgetForCategory < 0) {
                        dailySuggestionText = `Budget dépassé. Mois terminé.`;
                        suggestionColor = "text-destructive";
                      } else {
                        dailySuggestionText = `Budget respecté. Mois terminé.`;
                      }
                    }

                    return (
                      <div key={alloc.id} className="p-3 rounded-xl bg-muted/30 mb-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {categoryInfo && <CategoryIconMapper categoryName={alloc.category} type="expense" className="h-4 w-4 text-primary" />}
                            <span className="font-medium text-sm text-foreground">{categoryInfo?.label || alloc.category}</span>
                          </div>
                          <span className={`text-xs font-medium ${isOverBudgetCategory ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {spentThisMonthForCategory.toLocaleString('fr-FR')} / {alloc.allocatedAmount.toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <Progress value={progress} className={`h-2 mb-1.5 ${isOverBudgetCategory ? '[&>*]:bg-destructive bg-destructive/20' : '[&>*]:bg-primary bg-primary/15'}`} />
                        <p className={`text-[11px] italic ${suggestionColor} flex items-center`}>
                          <Info className="h-3 w-3 mr-1" /> {dailySuggestionText}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground">Aucune allocation de dépense définie pour ce budget.</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center"><PiggyBank className="mr-2 h-4 w-4 text-green-600" />Objectif d'Allocations aux Autres Comptes:</h3>
                <p className="text-lg font-bold text-green-600 mb-3">{(activeMonthlyBudget.targetSavingsAmount || 0).toLocaleString('fr-FR')} {CURRENCY_SYMBOL}</p>

                {activeMonthlyBudget.savingsAllocations && activeMonthlyBudget.savingsAllocations.length > 0 && (
                  <>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Détail des allocations (depuis C. Courant vers):</h4>
                    <ul className="space-y-1.5 text-sm">
                      {activeMonthlyBudget.savingsAllocations.map(sAlloc => {
                        const targetCompte = comptes.find(acc => acc.id === sAlloc.targetCompteId);
                        const CompteIcon = targetCompte ? COMPTE_TYPE_DETAILS[targetCompte.type]?.icon || Target : Target;
                        return (
                          <li key={sAlloc.id} className="flex justify-between items-center p-2.5 rounded-xl bg-primary/5">
                            <div className="flex items-center">
                              <CompteIcon className="h-4 w-4 mr-2 text-green-700" />
                              <span className="text-green-800">{targetCompte?.name || 'Compte inconnu'}</span>
                            </div>
                            <span className="font-medium text-green-700">{sAlloc.allocatedAmount.toLocaleString('fr-FR')} {CURRENCY_SYMBOL}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
                {(!activeMonthlyBudget.savingsAllocations || activeMonthlyBudget.savingsAllocations.length === 0) && activeMonthlyBudget.targetSavingsAmount > 0 && (
                  <p className="text-xs text-muted-foreground italic">Aucune allocation spécifique vers d'autres comptes n'a été faite pour cet objectif.</p>
                )}
                {(activeMonthlyBudget.targetSavingsAmount || 0) === 0 && (
                  <p className="text-xs text-muted-foreground italic">Aucun objectif d'allocation vers d'autres comptes défini pour ce mois.</p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card border-0 border-dashed animate-slide-up" style={{ animationDelay: '0.05s', animationFillMode: 'both' }}>
            <CardContent className="p-6 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm mb-3">Aucun budget défini pour {format(parseISO(selectedMonthYear + '-01'), 'MMMM yyyy', { locale: fr })}.</p>
              <button onClick={() => handleOpenMonthlyBudgetForm()} className="py-2.5 px-4 rounded-xl text-sm font-semibold text-white gradient-primary shadow-md press-scale transition-all inline-flex items-center gap-1.5">
                <PlusCircle className="h-4 w-4" /> Créer un Budget
              </button>
            </CardContent>
          </Card>
        )}

        <MonthlyBudgetForm
          isOpen={isMonthlyBudgetFormOpen}
          onOpenChange={(isOpen) => {
            setIsMonthlyBudgetFormOpen(isOpen);
            if (!isOpen) setEditingMonthlyBudget(undefined);
          }}
          budgetToEdit={editingMonthlyBudget}
          selectedMonthYear={selectedMonthYear}
        />
      </div>
    </div>
  );
};

export default BudgetPage;
