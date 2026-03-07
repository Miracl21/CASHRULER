'use client';

import type { FC } from 'react';
import { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import TransactionItem from './TransactionItem';
import type { Expense, Income, Transfer } from '@/lib/cashruler/types';
import { PlusCircle, ArrowRightLeft } from 'lucide-react';
import ExpenseForm from './ExpenseForm';
import IncomeForm from './IncomeForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CURRENCY_SYMBOL } from '@/lib/cashruler/constants';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

type TransactionType = 'expense' | 'income';

const TransactionsPage: FC = () => {
  const { expenses, incomes, transfers, comptes, deleteExpense, deleteIncome } = useAppContext();
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isIncomeFormOpen, setIsIncomeFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  const [editingIncome, setEditingIncome] = useState<Income | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: TransactionType } | null>(null);

  const sortedExpenses = useMemo(() => [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [expenses]);
  const sortedIncomes = useMemo(() => [...incomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [incomes]);
  const sortedTransfers = useMemo(() => [...transfers].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [transfers]);

  const getCompteName = (id: string): string => {
    const compte = comptes.find(c => c.id === id);
    return compte?.name || 'Inconnu';
  };

  const handleEditExpense = (expense: Expense) => { setEditingExpense(expense); setIsExpenseFormOpen(true); };
  const handleEditIncome = (income: Income) => { setEditingIncome(income); setIsIncomeFormOpen(true); };

  const handleDeleteRequest = (id: string, type: TransactionType) => {
    setItemToDelete({ id, type });
    setDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'expense') deleteExpense(itemToDelete.id);
      else deleteIncome(itemToDelete.id);
    }
    setDialogOpen(false);
    setItemToDelete(null);
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="space-y-3 mb-4 animate-slide-up">
        <h1 className="text-xl font-bold text-foreground">Transactions</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setEditingExpense(undefined); setIsExpenseFormOpen(true); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white gradient-expense shadow-md press-scale transition-all"
          >
            <PlusCircle className="h-4 w-4" /> Dépense
          </button>
          <button
            onClick={() => { setEditingIncome(undefined); setIsIncomeFormOpen(true); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white gradient-income shadow-md press-scale transition-all"
          >
            <PlusCircle className="h-4 w-4" /> Revenu
          </button>
        </div>
      </div>

      <Tabs defaultValue="expenses" className="flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-3 glass-card p-1 h-11">
          <TabsTrigger value="expenses" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all">
            Dépenses ({sortedExpenses.length})
          </TabsTrigger>
          <TabsTrigger value="incomes" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all">
            Revenus ({sortedIncomes.length})
          </TabsTrigger>
          <TabsTrigger value="transfers" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all">
            Transferts ({sortedTransfers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="flex-grow mt-3 overflow-y-auto">
          {sortedExpenses.length === 0 ? (
            <p className="text-muted-foreground text-center py-10 text-sm">Aucune dépense enregistrée.</p>
          ) : (
            <div className="space-y-1">
              {sortedExpenses.map((exp, i) => (
                <div key={exp.id} className="animate-slide-up" style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s`, animationFillMode: 'both' }}>
                  <TransactionItem transaction={exp} onEdit={() => handleEditExpense(exp)} onDelete={() => handleDeleteRequest(exp.id, 'expense')} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="incomes" className="flex-grow mt-3 overflow-y-auto">
          {sortedIncomes.length === 0 ? (
            <p className="text-muted-foreground text-center py-10 text-sm">Aucun revenu enregistré.</p>
          ) : (
            <div className="space-y-1">
              {sortedIncomes.map((inc, i) => (
                <div key={inc.id} className="animate-slide-up" style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s`, animationFillMode: 'both' }}>
                  <TransactionItem transaction={inc} onEdit={() => handleEditIncome(inc)} onDelete={() => handleDeleteRequest(inc.id, 'income')} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="transfers" className="flex-grow mt-3 overflow-y-auto">
          {sortedTransfers.length === 0 ? (
            <p className="text-muted-foreground text-center py-10 text-sm">Aucun transfert enregistré.</p>
          ) : (
            <div className="space-y-1">
              {sortedTransfers.map((transfer, i) => (
                <div
                  key={transfer.id}
                  className="p-3 rounded-xl bg-card/80 mb-1.5 transition-all duration-200 hover:bg-card animate-slide-up"
                  style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s`, animationFillMode: 'both' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {getCompteName(transfer.fromCompteId)} → {getCompteName(transfer.toCompteId)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          Transfert · {format(parseISO(transfer.date), 'd MMM', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      <p className="font-bold text-sm text-blue-600 tabular-nums">
                        {transfer.amount.toLocaleString('fr-FR')} <span className="text-xs">{CURRENCY_SYMBOL}</span>
                      </p>
                    </div>
                  </div>
                  {transfer.note && (
                    <p className="text-[11px] text-muted-foreground mt-1.5 ml-[52px] italic">Note: {transfer.note}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ExpenseForm isOpen={isExpenseFormOpen} onOpenChange={(isOpen) => { setIsExpenseFormOpen(isOpen); if (!isOpen) setEditingExpense(undefined); }} expenseToEdit={editingExpense} />
      <IncomeForm isOpen={isIncomeFormOpen} onOpenChange={(isOpen) => { setIsIncomeFormOpen(isOpen); if (!isOpen) setEditingIncome(undefined); }} incomeToEdit={editingIncome} />

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="glass-card border-0 animate-scale-in">
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription>Cette action supprimera définitivement la transaction.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TransactionsPage;
