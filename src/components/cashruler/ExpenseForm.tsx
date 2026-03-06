
'use client';

import type { FC } from 'react';
import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { EXPENSE_CATEGORIES, CURRENCY_SYMBOL, PREDEFINED_COMPTE_COURANT_ID } from '@/lib/cashruler/constants';
import type { Expense, ExpenseCategory, Compte } from '@/lib/cashruler/types';
import { useAppContext } from '@/contexts/AppContext';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';


const expenseSchema = z.object({
  title: z.string().min(1, "Le titre est requis."),
  amount: z.coerce.number().positive("Le montant doit être positif."),
  date: z.date({ required_error: "La date est requise." }),
  note: z.string().optional(),
  sourceCompteId: z.string().min(1, "Veuillez sélectionner un compte source."),
  category: z.custom<ExpenseCategory>().optional(),
}).superRefine((data, ctx) => {
  if (data.sourceCompteId === PREDEFINED_COMPTE_COURANT_ID && !data.category) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La catégorie est requise pour les dépenses du Compte Courant.",
      path: ['category'],
    });
  }
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  expenseToEdit?: Expense;
}

const ExpenseForm: FC<ExpenseFormProps> = ({ isOpen, onOpenChange, expenseToEdit }) => {
  const { addExpense, updateExpense, comptes, getCompteBalance } = useAppContext();

  const { control, handleSubmit, register, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expenseToEdit
      ? { ...expenseToEdit, date: parseISO(expenseToEdit.date), sourceCompteId: expenseToEdit.sourceCompteId }
      : { date: new Date(), category: undefined, title: '', amount: undefined, note: '', sourceCompteId: PREDEFINED_COMPTE_COURANT_ID },
  });

  const expenseTitle = watch('title');
  const selectedSourceCompteId = watch('sourceCompteId');
  const expenseAmount = watch('amount');

  const availableComptesForSource = useMemo(() => {
    return comptes
      .filter(c => c.lockStatus !== 'full' && c.lockStatus !== 'outgoing_only')
      .map(c => ({
        label: `${c.name} (Solde: ${getCompteBalance(c.id).toLocaleString('fr-FR')} ${CURRENCY_SYMBOL})`,
        value: c.id,
        balance: getCompteBalance(c.id)
      }));
  }, [comptes, getCompteBalance]);

  useEffect(() => {
    if (expenseToEdit) {
      reset({ ...expenseToEdit, date: parseISO(expenseToEdit.date), sourceCompteId: expenseToEdit.sourceCompteId, category: expenseToEdit.category || undefined });
    } else {
      reset({ date: new Date(), category: undefined, title: '', amount: undefined, note: '', sourceCompteId: PREDEFINED_COMPTE_COURANT_ID });
    }
  }, [expenseToEdit, reset, isOpen]);


  const onSubmit = (data: ExpenseFormData) => {
    const sourceCompte = comptes.find(c => c.id === data.sourceCompteId);
    if (sourceCompte && (sourceCompte.lockStatus === 'full' || sourceCompte.lockStatus === 'outgoing_only')) {
      alert(`Les dépenses depuis le compte "${sourceCompte.name}" sont bloquées (statut: ${sourceCompte.lockStatus}).`);
      return;
    }

    const expenseData = {
      ...data,
      date: format(data.date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
      category: data.sourceCompteId === PREDEFINED_COMPTE_COURANT_ID ? data.category : undefined,
    };

    const selectedCompteDetails = availableComptesForSource.find(c => c.value === data.sourceCompteId);
    if (selectedCompteDetails && (expenseAmount || 0) > selectedCompteDetails.balance && (!expenseToEdit || expenseToEdit.sourceCompteId !== data.sourceCompteId)) {
      alert(`Le montant de la dépense (${(expenseAmount || 0).toLocaleString('fr-FR')} ${CURRENCY_SYMBOL}) dépasse le solde disponible du compte sélectionné "${selectedCompteDetails.label.split(' (Solde:')[0]}" (${selectedCompteDetails.balance.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL}).`);
      return;
    }

    if (expenseToEdit) {
      updateExpense({ ...expenseData, id: expenseToEdit.id });
    } else {
      addExpense(expenseData);
    }
    onOpenChange(false);
    reset({ date: new Date(), category: undefined, title: '', amount: undefined, note: '', sourceCompteId: PREDEFINED_COMPTE_COURANT_ID });
  };

  const showCategoryField = selectedSourceCompteId === PREDEFINED_COMPTE_COURANT_ID;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle>{expenseToEdit ? 'Modifier la Dépense' : 'Ajouter une Dépense'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Titre</Label>
            <Input id="title" {...register('title')} placeholder="Ex: Courses hebdomadaires" />
            {errors.title && <p className="text-destructive text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="sourceCompteId">Compte Source</Label>
            <Controller
              name="sourceCompteId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={(value) => {
                  field.onChange(value);
                  if (value !== PREDEFINED_COMPTE_COURANT_ID) {
                    setValue('category', undefined);
                  }
                }} value={field.value || PREDEFINED_COMPTE_COURANT_ID}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un compte source" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableComptesForSource.map(compte => (
                      <SelectItem
                        key={compte.value}
                        value={compte.value}
                        disabled={(expenseAmount || 0) > compte.balance && (!expenseToEdit || expenseToEdit.sourceCompteId !== compte.value) && expenseAmount !== undefined}>
                        {compte.label}
                      </SelectItem>
                    ))}
                    {availableComptesForSource.length === 0 && <SelectItem value="" disabled>Aucun compte disponible pour dépense</SelectItem>}
                  </SelectContent>
                </Select>
              )}
            />
            {selectedSourceCompteId && (expenseAmount || 0) > (availableComptesForSource.find(f => f.value === selectedSourceCompteId)?.balance || 0) && (!expenseToEdit || expenseToEdit.sourceCompteId !== selectedSourceCompteId) && expenseAmount !== undefined &&
              <p className="text-destructive text-sm mt-1">Le montant dépasse le solde du compte sélectionné.</p>
            }
            {errors.sourceCompteId && <p className="text-destructive text-sm mt-1">{errors.sourceCompteId.message}</p>}
          </div>

          {showCategoryField && (
            <div>
              <Label htmlFor="category">Catégorie (pour Compte Courant)</Label>
              <div className="flex items-center">
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map(cat => (
                          <SelectItem key={cat.name} value={cat.name}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              {errors.category && <p className="text-destructive text-sm mt-1">{errors.category.message}</p>}
            </div>
          )}


          <div>
            <Label htmlFor="amount">Montant ({CURRENCY_SYMBOL})</Label>
            <Input id="amount" type="number" step="0.01" {...register('amount')} placeholder="0.00" />
            {errors.amount && <p className="text-destructive text-sm mt-1">{errors.amount.message}</p>}
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, 'PPP') : <span>Choisir une date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.date && <p className="text-destructive text-sm mt-1">{errors.date.message}</p>}
          </div>

          <div>
            <Label htmlFor="note">Note (Optionnel)</Label>
            <Textarea id="note" {...register('note')} placeholder="Ajouter une note..." />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting || !!(selectedSourceCompteId && (expenseAmount || 0) > (availableComptesForSource.find(f => f.value === selectedSourceCompteId)?.balance || 0) && (!expenseToEdit || expenseToEdit.sourceCompteId !== selectedSourceCompteId) && expenseAmount !== undefined)}
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : (expenseToEdit ? 'Enregistrer' : 'Ajouter')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseForm;
