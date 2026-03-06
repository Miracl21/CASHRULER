
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
import { ScrollArea } from '@/components/ui/scroll-area';
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
    <ScrollArea className="h-full">
      <div className="p-4 flex flex-col bg-background space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-0">
          <h1 className="text-2xl font-bold text-foreground mb-2 sm:mb-0 flex items-center"><Scale className="mr-3 h-7 w-7 text-primary"/>Budget du Compte Courant</h1>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
              <SelectTrigger className="w-full sm:w-[180px]">
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
            <Button onClick={() => handleOpenMonthlyBudgetForm(activeMonthlyBudget)} className="shadow-sm whitespace-nowrap">
              <PlusCircle className="mr-2 h-4 w-4" /> {activeMonthlyBudget ? 'Modifier Budget' : 'Créer Budget'}
            </Button>
          </div>
        </div>

        {activeMonthlyBudget ? (
          <Card className="shadow-md border-purple-300">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl text-purple-700 flex items-center">
                  <Banknote className="mr-2 h-5 w-5" /> Budget de {format(parseISO(activeMonthlyBudget.monthYear + '-01'), 'MMMM yyyy', { locale: fr })}
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => handleOpenMonthlyBudgetForm(activeMonthlyBudget)} className="text-xs text-purple-600 border-purple-400 hover:bg-purple-400/20">
                  <Edit3 className="mr-1 h-3 w-3" /> Modifier
                </Button>
              </div>
              <CardDescription>Revenu alloué au Compte Courant: {activeMonthlyBudget.referenceIncome.toLocaleString('fr-FR')} {CURRENCY_SYMBOL}</CardDescription>
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
                            if(isOverBudgetCategory) suggestionColor = "text-destructive";
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
                      <div key={alloc.id} className="p-3 rounded-md border bg-card/80 mb-2.5 shadow-sm">
                         <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center">
                              {categoryInfo && <CategoryIconMapper categoryName={alloc.category} type="expense" className="h-5 w-5 mr-2.5 text-primary" />}
                              <span className="font-semibold text-md text-foreground">{categoryInfo?.label || alloc.category}</span>
                            </div>
                             <span className={`text-sm font-medium ${isOverBudgetCategory ? 'text-destructive' : 'text-foreground'}`}>
                              {spentThisMonthForCategory.toLocaleString('fr-FR')} / {alloc.allocatedAmount.toLocaleString('fr-FR')} {CURRENCY_SYMBOL}
                            </span>
                         </div>
                         <Progress value={progress} className={`h-2 mb-1.5 ${isOverBudgetCategory ? '[&>*]:bg-destructive' : '[&>*]:bg-primary'}`} />
                         <p className={`text-xs italic ${suggestionColor} flex items-center`}>
                           <Info className="h-3.5 w-3.5 mr-1.5"/> {dailySuggestionText}
                         </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground">Aucune allocation de dépense définie pour ce budget.</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center"><PiggyBank className="mr-2 h-4 w-4 text-green-600"/>Objectif d'Allocations aux Autres Comptes:</h3>
                <p className="text-lg font-bold text-green-600 mb-3">{(activeMonthlyBudget.targetSavingsAmount || 0).toLocaleString('fr-FR')} {CURRENCY_SYMBOL}</p>

                {activeMonthlyBudget.savingsAllocations && activeMonthlyBudget.savingsAllocations.length > 0 && (
                  <>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Détail des allocations (depuis C. Courant vers):</h4>
                    <ul className="space-y-1.5 text-sm">
                      {activeMonthlyBudget.savingsAllocations.map(sAlloc => {
                        const targetCompte = comptes.find(acc => acc.id === sAlloc.targetCompteId);
                        const CompteIcon = targetCompte ? COMPTE_TYPE_DETAILS[targetCompte.type]?.icon || Target : Target;
                        return (
                          <li key={sAlloc.id} className="flex justify-between items-center p-2 rounded-md bg-green-500/10 border border-green-500/20">
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
          <Card className="shadow-md border-dashed border-muted-foreground">
            <CardContent className="p-6 text-center">
              <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-2">Aucun budget défini pour {format(parseISO(selectedMonthYear + '-01'), 'MMMM yyyy', { locale: fr })} pour le Compte Courant.</p>
              <Button onClick={() => handleOpenMonthlyBudgetForm()} className="shadow-sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Créer un Budget
              </Button>
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
    </ScrollArea>
  );
};

export default BudgetPage;
