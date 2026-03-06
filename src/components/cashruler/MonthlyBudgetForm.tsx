
'use client';

import type { FC } from 'react';
import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { EXPENSE_CATEGORIES, CURRENCY_SYMBOL, PREDEFINED_COMPTE_COURANT_ID } from '@/lib/cashruler/constants';
import type { MonthlyBudget, BudgetExpenseAllocation, ExpenseCategory, Compte, BudgetSavingAllocation } from '@/lib/cashruler/types';
import { useAppContext } from '@/contexts/AppContext';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { format, parse, startOfMonth, eachMonthOfInterval, subMonths, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';


const budgetExpenseAllocationSchema = z.object({
  id: z.string().optional(),
  category: z.enum(EXPENSE_CATEGORIES.map(c => c.name) as [ExpenseCategory, ...ExpenseCategory[]]),
  allocatedAmount: z.coerce.number().min(0, "Le montant alloué ne peut pas être négatif."),
});

const budgetSavingAllocationSchema = z.object({
  id: z.string().optional(),
  targetCompteId: z.string({ required_error: "Veuillez sélectionner un compte d'épargne." }),
  allocatedAmount: z.coerce.number().min(0, "Le montant alloué ne peut pas être négatif."),
});

const monthlyBudgetSchema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/, "Format Mois-Année invalide (YYYY-MM)."),
  referenceIncome: z.coerce.number().positive("Le revenu de référence doit être positif.").or(z.literal(0)),
  expenseAllocations: z.array(budgetExpenseAllocationSchema).min(0),
  savingsAllocations: z.array(budgetSavingAllocationSchema).min(0),
  targetSavingsAmount: z.coerce.number().min(0, "L'objectif d'épargne total doit être positif ou nul.").default(0),
});

type MonthlyBudgetFormData = z.infer<typeof monthlyBudgetSchema>;

interface MonthlyBudgetFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  budgetToEdit?: MonthlyBudget;
  selectedMonthYear?: string;
}

const MonthlyBudgetForm: FC<MonthlyBudgetFormProps> = ({ isOpen, onOpenChange, budgetToEdit, selectedMonthYear }) => {
  const { addMonthlyBudget, updateMonthlyBudget, getMonthlyBudget, monthlyBudgets, comptes } = useAppContext();

  const availableSavingsComptes = useMemo(() => comptes.filter(c => c.id !== PREDEFINED_COMPTE_COURANT_ID), [comptes]);

  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  useEffect(() => {
    const today = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(startOfMonth(today), 3),
      end: addMonths(startOfMonth(today), 3)
    }).map(date => format(date, 'yyyy-MM'));
    setAvailableMonths(months);
  }, []);

  const { control, handleSubmit, register, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<MonthlyBudgetFormData>({
    resolver: zodResolver(monthlyBudgetSchema),
    defaultValues: {
      monthYear: format(new Date(), 'yyyy-MM'),
      referenceIncome: 0,
      targetSavingsAmount: 0,
      expenseAllocations: [],
      savingsAllocations: [],
    }
  });

  const { fields: expenseFields, append: appendExpense, remove: removeExpense } = useFieldArray({
    control,
    name: "expenseAllocations",
  });

  const { fields: savingFields, append: appendSaving, remove: removeSaving } = useFieldArray({
    control,
    name: "savingsAllocations",
  });

  const currentMonthYear = watch('monthYear');
  const currentSavingsAllocations = watch('savingsAllocations');

  useEffect(() => {
    // This effect will now only be for displaying the sum, not setting it for submission
    // if (currentSavingsAllocations) {
    //   const totalCalculatedSavings = currentSavingsAllocations.reduce((sum, alloc) => sum + (alloc.allocatedAmount || 0), 0);
    //   // setValue('targetSavingsAmount', totalCalculatedSavings, { shouldValidate: false }); // No longer set it here, it's user input
    // }
  }, [currentSavingsAllocations, setValue]);


  useEffect(() => {
    if (isOpen) {
      let budgetToLoad: MonthlyBudget | undefined = undefined;

      if (budgetToEdit) {
        budgetToLoad = budgetToEdit;
      } else {
        const monthToConsider = selectedMonthYear || (currentMonthYear && availableMonths.includes(currentMonthYear) ? currentMonthYear : undefined) || format(new Date(), 'yyyy-MM');
        budgetToLoad = getMonthlyBudget(monthToConsider);
      }

      if (budgetToLoad) {
        reset({
          monthYear: budgetToLoad.monthYear,
          referenceIncome: budgetToLoad.referenceIncome,
          targetSavingsAmount: budgetToLoad.targetSavingsAmount || 0,
          expenseAllocations: (budgetToLoad.expenseAllocations || []).map(ea => ({ ...ea, id: ea.id || Math.random().toString(36).substring(2, 9) })),
          savingsAllocations: (budgetToLoad.savingsAllocations || []).map(sa => ({ ...sa, id: sa.id || Math.random().toString(36).substring(2, 9) })),
        });
      } else {
        reset({
          monthYear: selectedMonthYear || (currentMonthYear && availableMonths.includes(currentMonthYear) ? currentMonthYear : undefined) || format(new Date(), 'yyyy-MM'),
          referenceIncome: 0,
          targetSavingsAmount: 0,
          expenseAllocations: [],
          savingsAllocations: [],
        });
      }
    }
  }, [budgetToEdit, isOpen, reset, selectedMonthYear, currentMonthYear, getMonthlyBudget, availableMonths]);

  useEffect(() => {
    if (isOpen && !budgetToEdit && currentMonthYear) {
      const existingBudgetForSelectedMonth = getMonthlyBudget(currentMonthYear);
      if (existingBudgetForSelectedMonth) {
        reset({
          monthYear: existingBudgetForSelectedMonth.monthYear,
          referenceIncome: existingBudgetForSelectedMonth.referenceIncome,
          targetSavingsAmount: existingBudgetForSelectedMonth.targetSavingsAmount || 0,
          expenseAllocations: (existingBudgetForSelectedMonth.expenseAllocations || []).map(ea => ({ ...ea, id: ea.id || Math.random().toString(36).substring(2, 9) })),
          savingsAllocations: (existingBudgetForSelectedMonth.savingsAllocations || []).map(sa => ({ ...sa, id: sa.id || Math.random().toString(36).substring(2, 9) })),
        });
      } else {
        reset(prev => ({
          ...prev,
          monthYear: currentMonthYear,
          referenceIncome: prev.monthYear === currentMonthYear ? prev.referenceIncome : 0,
          targetSavingsAmount: prev.monthYear === currentMonthYear ? prev.targetSavingsAmount : 0,
          expenseAllocations: prev.monthYear === currentMonthYear ? prev.expenseAllocations : [],
          savingsAllocations: prev.monthYear === currentMonthYear ? prev.savingsAllocations : [],
        }));
      }
    }
  }, [currentMonthYear, budgetToEdit, getMonthlyBudget, reset, isOpen]);


  const onSubmit = (data: MonthlyBudgetFormData) => {
    // const calculatedTargetSavingsAmount = data.savingsAllocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0);
    const budgetPayload: MonthlyBudget = {
      id: data.monthYear,
      monthYear: data.monthYear,
      referenceIncome: data.referenceIncome,
      targetSavingsAmount: data.targetSavingsAmount, // Use user-defined target
      expenseAllocations: data.expenseAllocations.map((alloc, index) => ({
        id: alloc.id || expenseFields[index]?.id || Math.random().toString(36).substring(2, 9),
        category: alloc.category,
        allocatedAmount: alloc.allocatedAmount,
      })),
      savingsAllocations: data.savingsAllocations.map((alloc, index) => ({
        id: alloc.id || savingFields[index]?.id || Math.random().toString(36).substring(2, 9),
        targetCompteId: alloc.targetCompteId,
        allocatedAmount: alloc.allocatedAmount,
      })),
    };

    const existingBudgetForMonth = getMonthlyBudget(data.monthYear);

    if (budgetToEdit || existingBudgetForMonth) {
      updateMonthlyBudget(budgetPayload);
    } else {
      addMonthlyBudget(budgetPayload);
    }
    onOpenChange(false);
  };

  const allocatedExpenseCategories = watch('expenseAllocations', []).map(alloc => alloc.category);
  const allocatedSavingComptes = watch('savingsAllocations', []).map(alloc => alloc.targetCompteId);
  const calculatedSumOfSavingAllocations = watch('savingsAllocations', []).reduce((sum, alloc) => sum + (alloc.allocatedAmount || 0), 0);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) reset(); }}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>{budgetToEdit || getMonthlyBudget(currentMonthYear || format(new Date(), 'yyyy-MM')) ? 'Modifier le Budget (Compte Courant)' : 'Nouveau Budget (Compte Courant)'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="monthYear">Mois du Budget</Label>
              <Controller
                name="monthYear"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => { field.onChange(value); }}
                    value={field.value}
                    disabled={!!budgetToEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un mois" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMonths.map(month => (
                        <SelectItem
                          key={month}
                          value={month}
                          disabled={!budgetToEdit && monthlyBudgets.some((b) => b.monthYear === month)}
                        >
                          {format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: fr })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.monthYear && <p className="text-destructive text-sm mt-1">{errors.monthYear.message}</p>}
            </div>

            <div>
              <Label htmlFor="referenceIncome">Revenu Mensuel Alloué au Compte Courant ({CURRENCY_SYMBOL})</Label>
              <Input id="referenceIncome" type="number" step="0.01" {...register('referenceIncome')} placeholder="Ex: 500000" />
              {errors.referenceIncome && <p className="text-destructive text-sm mt-1">{errors.referenceIncome.message}</p>}
            </div>

            <div className="space-y-3">
              <Label>Allocations de Dépenses (Compte Courant)</Label>
              {expenseFields.map((item, index) => (
                <div key={item.id} className="flex items-end space-x-2 p-2 border rounded-md bg-background/50">
                  <div className="flex-grow space-y-1">
                    <Label htmlFor={`expenseAllocations.${index}.category`} className="text-xs">Catégorie</Label>
                    <Controller
                      name={`expenseAllocations.${index}.category`}
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Catégorie" />
                          </SelectTrigger>
                          <SelectContent>
                            {EXPENSE_CATEGORIES.map(cat => (
                              <SelectItem
                                key={cat.name}
                                value={cat.name}
                                disabled={allocatedExpenseCategories.includes(cat.name) && allocatedExpenseCategories.indexOf(cat.name) !== index}
                              >
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.expenseAllocations?.[index]?.category && <p className="text-destructive text-xs mt-1">{errors.expenseAllocations[index]?.category?.message}</p>}
                  </div>
                  <div className="flex-grow space-y-1">
                    <Label htmlFor={`expenseAllocations.${index}.allocatedAmount`} className="text-xs">Montant Alloué</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Montant"
                      {...register(`expenseAllocations.${index}.allocatedAmount`)}
                    />
                    {errors.expenseAllocations?.[index]?.allocatedAmount && <p className="text-destructive text-xs mt-1">{errors.expenseAllocations[index]?.allocatedAmount?.message}</p>}
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeExpense(index)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendExpense({ category: EXPENSE_CATEGORIES.find(cat => !allocatedExpenseCategories.includes(cat.name))?.name || EXPENSE_CATEGORIES[0].name, allocatedAmount: 0, id: Math.random().toString(36).substring(2, 9) })}
                className="w-full text-primary border-primary/50 hover:bg-primary/10"
                disabled={allocatedExpenseCategories.length >= EXPENSE_CATEGORIES.length}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Ajouter Allocation Dépense
              </Button>
              {errors.expenseAllocations?.root && <p className="text-destructive text-sm mt-1">{errors.expenseAllocations.root.message}</p>}
            </div>

            <div>
              <Label htmlFor="targetSavingsAmount">Objectif d'Épargne Mensuel Total ({CURRENCY_SYMBOL})</Label>
              <Input
                id="targetSavingsAmount"
                type="number"
                step="0.01"
                {...register('targetSavingsAmount')}
                placeholder="Ex: 100000"
              />
              {errors.targetSavingsAmount && <p className="text-destructive text-sm mt-1">{errors.targetSavingsAmount.message}</p>}
              {calculatedSumOfSavingAllocations > (watch('targetSavingsAmount') || 0) &&
                <p className="text-orange-600 text-xs mt-1">La somme des allocations d'épargne spécifiques ({calculatedSumOfSavingAllocations.toLocaleString('fr-FR')} {CURRENCY_SYMBOL}) dépasse l'objectif total.</p>
              }
            </div>

            <div className="space-y-3">
              <Label>Allocations d'Épargne (Depuis Compte Courant vers d'autres Comptes)</Label>
              {savingFields.map((item, index) => (
                <div key={item.id} className="flex items-end space-x-2 p-2 border rounded-md bg-background/50">
                  <div className="flex-grow space-y-1">
                    <Label htmlFor={`savingsAllocations.${index}.targetCompteId`} className="text-xs">Compte de Destination</Label>
                    <Controller
                      name={`savingsAllocations.${index}.targetCompteId`}
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Compte de destination" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSavingsComptes.map(compte => (
                              <SelectItem
                                key={compte.id}
                                value={compte.id}
                                disabled={allocatedSavingComptes.includes(compte.id) && allocatedSavingComptes.indexOf(compte.id) !== index}
                              >
                                {compte.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.savingsAllocations?.[index]?.targetCompteId && <p className="text-destructive text-xs mt-1">{errors.savingsAllocations[index]?.targetCompteId?.message}</p>}
                  </div>
                  <div className="flex-grow space-y-1">
                    <Label htmlFor={`savingsAllocations.${index}.allocatedAmount`} className="text-xs">Montant à Allouer</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Montant"
                      {...register(`savingsAllocations.${index}.allocatedAmount`)}
                    />
                    {errors.savingsAllocations?.[index]?.allocatedAmount && <p className="text-destructive text-xs mt-1">{errors.savingsAllocations[index]?.allocatedAmount?.message}</p>}
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeSaving(index)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const availableCompte = availableSavingsComptes.find(c => !allocatedSavingComptes.includes(c.id));
                  if (availableCompte) {
                    appendSaving({ targetCompteId: availableCompte.id, allocatedAmount: 0, id: Math.random().toString(36).substring(2, 9) });
                  }
                }}
                className="w-full text-green-600 border-green-600/50 hover:bg-green-600/10"
                disabled={allocatedSavingComptes.length >= availableSavingsComptes.length || availableSavingsComptes.length === 0}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Ajouter Allocation Épargne
              </Button>
              {availableSavingsComptes.length === 0 && <p className="text-xs text-muted-foreground text-center">Créez d'abord d'autres comptes pour l'épargne.</p>}
              {errors.savingsAllocations?.root && <p className="text-destructive text-sm mt-1">{errors.savingsAllocations.root.message}</p>}
              {savingFields.length > 0 &&
                <p className="text-xs text-muted-foreground text-right">Total des allocations spécifiques : {calculatedSumOfSavingAllocations.toLocaleString('fr-FR')} {CURRENCY_SYMBOL}</p>
              }
            </div>

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Annuler</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : (budgetToEdit || getMonthlyBudget(currentMonthYear || format(new Date(), 'yyyy-MM')) ? 'Enregistrer Budget' : 'Créer Budget')}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MonthlyBudgetForm;
