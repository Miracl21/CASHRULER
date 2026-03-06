'use client';

import type { FC } from 'react';
import { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import TransactionItem from './TransactionItem';
import type { Expense, Income, Transaction } from '@/lib/cashruler/types';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import ExpenseForm from './ExpenseForm';
import IncomeForm from './IncomeForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

type TransactionType = 'expense' | 'income';

const TransactionsPage: FC = () => {
  const { expenses, incomes, deleteExpense, deleteIncome } = useAppContext();
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isIncomeFormOpen, setIsIncomeFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  const [editingIncome, setEditingIncome] = useState<Income | undefined>(undefined);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: TransactionType} | null>(null);


  const sortedExpenses = useMemo(() => [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [expenses]);
  const sortedIncomes = useMemo(() => [...incomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [incomes]);

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseFormOpen(true);
  };

  const handleEditIncome = (income: Income) => {
    setEditingIncome(income);
    setIsIncomeFormOpen(true);
  };

  const handleDeleteRequest = (id: string, type: TransactionType) => {
    setItemToDelete({ id, type });
    setDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'expense') {
        deleteExpense(itemToDelete.id);
      } else {
        deleteIncome(itemToDelete.id);
      }
    }
    setDialogOpen(false);
    setItemToDelete(null);
  };


  return (
    <div className="p-4 flex flex-col h-full bg-background">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
        <div className="space-x-2">
          <Button onClick={() => { setEditingExpense(undefined); setIsExpenseFormOpen(true); }} className="shadow-sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Dépense
          </Button>
          <Button onClick={() => { setEditingIncome(undefined); setIsIncomeFormOpen(true); }} variant="secondary" className="shadow-sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Revenu
          </Button>
        </div>
      </div>

      <Tabs defaultValue="expenses" className="flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">Dépenses ({sortedExpenses.length})</TabsTrigger>
          <TabsTrigger value="incomes">Revenus ({sortedIncomes.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="expenses" className="flex-grow mt-2 overflow-hidden">
          <ScrollArea className="h-full pr-3">
            {sortedExpenses.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">Aucune dépense enregistrée.</p>
            ) : (
              sortedExpenses.map(exp => (
                <TransactionItem 
                  key={exp.id} 
                  transaction={exp} 
                  onEdit={() => handleEditExpense(exp)}
                  onDelete={() => handleDeleteRequest(exp.id, 'expense')}
                />
              ))
            )}
          </ScrollArea>
        </TabsContent>
        <TabsContent value="incomes" className="flex-grow mt-2 overflow-hidden">
          <ScrollArea className="h-full pr-3">
            {sortedIncomes.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">Aucun revenu enregistré.</p>
            ) : (
              sortedIncomes.map(inc => (
                <TransactionItem 
                  key={inc.id} 
                  transaction={inc} 
                  onEdit={() => handleEditIncome(inc)}
                  onDelete={() => handleDeleteRequest(inc.id, 'income')}
                />
              ))
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <ExpenseForm 
        isOpen={isExpenseFormOpen} 
        onOpenChange={(isOpen) => {
          setIsExpenseFormOpen(isOpen);
          if (!isOpen) setEditingExpense(undefined);
        }} 
        expenseToEdit={editingExpense} 
      />
      <IncomeForm 
        isOpen={isIncomeFormOpen} 
        onOpenChange={(isOpen) => {
          setIsIncomeFormOpen(isOpen);
          if (!isOpen) setEditingIncome(undefined);
        }} 
        incomeToEdit={editingIncome} 
      />

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement la transaction.
            </AlertDialogDescription>
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
