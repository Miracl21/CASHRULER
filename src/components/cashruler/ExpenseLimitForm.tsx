'use client';

import type { FC } from 'react';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { EXPENSE_CATEGORIES, CURRENCY_SYMBOL } from '@/lib/cashruler/constants';
import type { ExpenseLimit, ExpenseCategory } from '@/lib/cashruler/types';
import { useAppContext } from '@/contexts/AppContext';
import { Loader2 } from 'lucide-react';

const expenseLimitSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES.map(c => c.name) as [ExpenseCategory, ...ExpenseCategory[]], {
    errorMap: () => ({ message: "Veuillez sélectionner une catégorie." })
  }),
  dailyAmount: z.coerce.number().positive("Le montant journalier doit être positif."),
});

type ExpenseLimitFormData = z.infer<typeof expenseLimitSchema>;

interface ExpenseLimitFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  limitToEdit?: ExpenseLimit;
}

const ExpenseLimitForm: FC<ExpenseLimitFormProps> = ({ isOpen, onOpenChange, limitToEdit }) => {
  const { addExpenseLimit, updateExpenseLimit, expenseLimits } = useAppContext();

  const { control, handleSubmit, register, reset, formState: { errors, isSubmitting }, setValue } = useForm<ExpenseLimitFormData>({
    resolver: zodResolver(expenseLimitSchema),
    defaultValues: limitToEdit 
      ? { category: limitToEdit.category, dailyAmount: limitToEdit.dailyAmount }
      : { category: undefined, dailyAmount: undefined },
  });
  
  useEffect(() => {
    if (isOpen) {
      if (limitToEdit) {
        reset({ category: limitToEdit.category, dailyAmount: limitToEdit.dailyAmount });
      } else {
        reset({ category: undefined, dailyAmount: undefined });
      }
    }
  }, [limitToEdit, isOpen, reset]);

  const onSubmit = (data: ExpenseLimitFormData) => {
    // Check if a limit for this category already exists if we are NOT editing
    if (!limitToEdit && expenseLimits.some(l => l.category === data.category)) {
        // If it exists, we can choose to update it or show an error.
        // For now, let's find the existing one and update it (upsert behavior).
        const existing = expenseLimits.find(l => l.category === data.category);
        if (existing) {
            updateExpenseLimit({ ...data, id: existing.id });
        } else {
             // This case should ideally not be reached if the above check is robust,
             // but as a fallback, add it.
            addExpenseLimit(data);
        }
    } else if (limitToEdit) {
      updateExpenseLimit({ ...data, id: limitToEdit.id });
    } else {
      addExpenseLimit(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle>{limitToEdit ? 'Modifier la Limite Journalière' : 'Ajouter une Limite Journalière'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="category">Catégorie</Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                  disabled={!!limitToEdit} // Disable category change when editing
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem 
                        key={cat.name} 
                        value={cat.name}
                        // Disable option if a limit already exists for this category and we are not editing it
                        disabled={!limitToEdit && expenseLimits.some(l => l.category === cat.name)}
                      >
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
             {errors.category && <p className="text-destructive text-sm mt-1">{errors.category.message}</p>}
          </div>

          <div>
            <Label htmlFor="dailyAmount">Montant Journalier Cible ({CURRENCY_SYMBOL})</Label>
            <Input id="dailyAmount" type="number" step="0.01" {...register('dailyAmount')} placeholder="0.00" />
            {errors.dailyAmount && <p className="text-destructive text-sm mt-1">{errors.dailyAmount.message}</p>}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => reset()}>Annuler</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : (limitToEdit ? 'Enregistrer' : 'Ajouter Limite')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseLimitForm;
