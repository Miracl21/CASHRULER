
'use client';

import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, DollarSign, Edit2, Trash2, ShieldAlert, ShieldCheck, Send, PackageSearch, PiggyBank } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';


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


  if (isAppContextLoading || !currentDate) {
    return (
      <ScrollArea className="h-full">
        <div className="p-4 space-y-6 bg-background flex-grow">
          <Card className="shadow-lg border-primary border-2">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Bienvenue sur CASHRULER!</CardTitle>
              <Skeleton className="h-4 w-48 mt-1" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-56 mb-2" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
          <section>
            <h2 className="text-xl font-semibold mb-3 text-foreground">Actions Rapides</h2>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </section>
          <Card className="shadow-md">
            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
            <CardContent><Skeleton className="h-20 w-full" /></CardContent>
          </Card>
        </div>
      </ScrollArea>
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
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6 bg-background flex-grow">
        <Card className="shadow-lg border-primary border-2">
          <CardHeader>
            <CardTitle className="text-xl text-primary">
              Bienvenue {userSettings.username ? `${userSettings.username} ` : ''}sur CASHRULER!
            </CardTitle>
            <CardDescription className="truncate">Votre assistant financier. {format(currentDate, 'PPP', { locale: fr })}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground break-words">
              Solde C. Courant: {compteCourantBalance.toLocaleString('fr-FR')} {CURRENCY_SYMBOL}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Dépenses (C. Courant) aujourd'hui: {totalExpensesTodayFromCompteCourant.toLocaleString('fr-FR')} {CURRENCY_SYMBOL}
            </div>
          </CardContent>
        </Card>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-foreground">Actions Rapides</h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
            <Button variant="default" size="lg" className="w-full py-3 text-sm shadow-md flex-col h-auto" onClick={() => setIsExpenseFormOpen(true)}>
              <PlusCircle className="mb-1 h-5 w-5" /> Dépense
            </Button>
            <Button variant="secondary" size="lg" className="w-full py-3 text-sm shadow-md flex-col h-auto" onClick={() => setIsIncomeFormOpen(true)}>
              <DollarSign className="mb-1 h-5 w-5" /> Revenu
            </Button>
            <Button variant="outline" size="lg" className="w-full py-3 text-sm shadow-md flex-col h-auto border-blue-500 text-blue-500 hover:bg-blue-500/10 hover:text-blue-600" onClick={() => setIsTransferFormOpen(true)}>
              <Send className="mb-1 h-5 w-5" /> Transfert
            </Button>
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

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Aperçu des Comptes Clés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {keyComptes.map(compte => {
              const CompteIcon = COMPTE_TYPE_DETAILS[compte.type]?.icon || PiggyBank;
              return (
                <div key={compte.id} className="flex justify-between items-center p-3 rounded-md" style={{ backgroundColor: `${compte.color || '#CCCCCC'}20` }}>
                  <div className="flex items-center">
                    <CompteIcon className="h-5 w-5 mr-2" style={{ color: compte.color || 'hsl(var(--foreground))' }} />
                    <span className="font-medium" style={{ color: compte.color || 'hsl(var(--foreground))' }}>{compte.name}</span>
                  </div>
                  <span className="font-bold" style={{ color: compte.color || 'hsl(var(--foreground))' }}>{getCompteBalance(compte.id).toLocaleString('fr-FR')} {CURRENCY_SYMBOL}</span>
                </div>
              );
            })}
            {keyComptes.length === 0 && <p className="text-muted-foreground text-center py-4">Aucun compte clé à afficher.</p>}
          </CardContent>
        </Card>


        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl text-foreground">Défis Budgétaires (Compte Courant)</CardTitle>
              <Button size="sm" variant="outline" onClick={handleAddExpenseLimit} className="text-xs">
                <PlusCircle className="mr-1 h-3 w-3" /> Gérer Limites
              </Button>
            </div>
            <CardDescription>Suivez vos limites de dépenses quotidiennes pour le Compte Courant.</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseLimits.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucune limite de dépense définie pour le Compte Courant.</p>
            ) : (
              <div className="space-y-4">
                {expenseLimits.map(limit => {
                  const spentTodayForCategory = expensesTodayFromCompteCourant
                    .filter(exp => exp.category === limit.category)
                    .reduce((sum, exp) => sum + exp.amount, 0);
                  const progress = limit.dailyAmount > 0 ? (spentTodayForCategory / limit.dailyAmount) * 100 : 0;
                  const remaining = limit.dailyAmount - spentTodayForCategory;
                  const categoryInfo = EXPENSE_CATEGORIES.find(c => c.name === limit.category);
                  const isOverLimit = spentTodayForCategory > limit.dailyAmount;

                  return (
                    <div key={limit.id} className="p-3 rounded-md border bg-card hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          {categoryInfo && <CategoryIconMapper categoryName={limit.category} type="expense" className="h-5 w-5 mr-2 text-primary" />}
                          <span className="font-medium text-foreground">{categoryInfo?.label || limit.category}</span>
                        </div>
                        <div className="space-x-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEditExpenseLimit(limit)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteExpenseLimitRequest(limit.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Progress value={Math.min(100, progress)} className={`h-2 ${isOverLimit ? 'bg-destructive/70 [&>*]:bg-destructive' : ''}`} />
                      <div className="flex justify-between items-center text-xs mt-1">
                        <span className={` ${isOverLimit ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                          Dépensé: {spentTodayForCategory.toLocaleString('fr-FR')} / {limit.dailyAmount.toLocaleString('fr-FR')} {CURRENCY_SYMBOL}
                        </span>
                        {isOverLimit ? (
                          <span className="text-destructive font-semibold flex items-center"><ShieldAlert className="h-3 w-3 mr-1" /> Dépassé</span>
                        ) : (
                          <span className="text-green-600 flex items-center"><ShieldCheck className="h-3 w-3 mr-1" /> Restant: {remaining.toLocaleString('fr-FR')} {CURRENCY_SYMBOL}</span>
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
          <AlertDialogContent>
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
    </ScrollArea>
  );
};

export default DashboardPage;
