
'use client';

import type { FC } from 'react';
import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { INCOME_TYPES, CURRENCY_SYMBOL, PREDEFINED_COMPTE_COURANT_ID } from '@/lib/cashruler/constants';
import type { Income, IncomeType, Compte } from '@/lib/cashruler/types';
import { useAppContext } from '@/contexts/AppContext';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const incomeSchema = z.object({
  name: z.string().min(1, "Le nom est requis."),
  type: z.enum(INCOME_TYPES.map(t => t.name) as [IncomeType, ...IncomeType[]], {
    errorMap: () => ({ message: "Veuillez sélectionner un type." })
  }),
  amount: z.coerce.number().positive("Le montant doit être positif."),
  date: z.date({ required_error: "La date est requise." }),
  note: z.string().optional(),
  targetCompteId: z.string().min(1, "Veuillez sélectionner un compte de destination."),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

interface IncomeFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  incomeToEdit?: Income;
}

const IncomeForm: FC<IncomeFormProps> = ({ isOpen, onOpenChange, incomeToEdit }) => {
  const { addIncome, updateIncome, comptes } = useAppContext();

  const availableComptesForIncome = useMemo(() => {
    return comptes.filter(c => c.lockStatus !== 'full');
  }, [comptes]);

  const { control, handleSubmit, register, reset, formState: { errors, isSubmitting } } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: incomeToEdit
      ? { ...incomeToEdit, date: parseISO(incomeToEdit.date), targetCompteId: incomeToEdit.targetCompteId || PREDEFINED_COMPTE_COURANT_ID }
      : { date: new Date(), type: undefined, name: '', amount: undefined, note: '', targetCompteId: PREDEFINED_COMPTE_COURANT_ID },
  });

  useEffect(() => {
    if (isOpen) {
      if (incomeToEdit) {
        reset({ ...incomeToEdit, date: parseISO(incomeToEdit.date), targetCompteId: incomeToEdit.targetCompteId || PREDEFINED_COMPTE_COURANT_ID });
      } else {
        reset({ date: new Date(), type: undefined, name: '', amount: undefined, note: '', targetCompteId: PREDEFINED_COMPTE_COURANT_ID });
      }
    }
  }, [incomeToEdit, reset, isOpen]);

  const onSubmit = (data: IncomeFormData) => {
    const targetCompte = comptes.find(c => c.id === data.targetCompteId);
    if (targetCompte && targetCompte.lockStatus === 'full') {
        alert(`Le compte "${targetCompte.name}" est entièrement verrouillé et ne peut pas recevoir de revenus.`);
        return;
    }

    const incomeData = {
      ...data,
      date: format(data.date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    };
    if (incomeToEdit) {
      updateIncome({ ...incomeData, id: incomeToEdit.id });
    } else {
      addIncome(incomeData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle>{incomeToEdit ? 'Modifier le Revenu' : 'Ajouter un Revenu'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom</Label>
            <Input id="name" {...register('name')} placeholder="Ex: Salaire Mensuel" />
            {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_TYPES.map(cat => (
                      <SelectItem key={cat.name} value={cat.name}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
             {errors.type && <p className="text-destructive text-sm mt-1">{errors.type.message}</p>}
          </div>

           <div>
            <Label htmlFor="targetCompteId">Verser au Compte</Label>
            <Controller
              name="targetCompteId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || PREDEFINED_COMPTE_COURANT_ID}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un compte" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableComptesForIncome.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                    {availableComptesForIncome.length === 0 && <SelectItem value="" disabled>Aucun compte disponible pour recevoir des revenus</SelectItem>}
                  </SelectContent>
                </Select>
              )}
            />
             {errors.targetCompteId && <p className="text-destructive text-sm mt-1">{errors.targetCompteId.message}</p>}
          </div>

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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : (incomeToEdit ? 'Enregistrer' : 'Ajouter')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IncomeForm;
