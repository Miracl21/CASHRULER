
'use client';

import type { FC } from 'react';
import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCY_SYMBOL } from '@/lib/cashruler/constants';
import type { PurchaseGoal, Compte } from '@/lib/cashruler/types';
import { useAppContext } from '@/contexts/AppContext';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format, parseISO, isAfter, startOfToday } from 'date-fns';
import { fr } from 'date-fns/locale';

const purchaseGoalSchema = z.object({
  title: z.string().min(1, "Le titre est requis."),
  targetAmount: z.coerce.number().positive("Le montant cible doit être positif."),
  deadline: z.date({ required_error: "La date d'échéance est requise." })
              .refine(date => isAfter(date, startOfToday()) || format(date, 'yyyy-MM-dd') === format(startOfToday(), 'yyyy-MM-dd'),
                      { message: "L'échéance doit être aujourd'hui ou une date future." }),
  note: z.string().optional(),
  fundingCompteId: z.string().min(1, "Veuillez sélectionner un compte de financement."),
});

type PurchaseGoalFormData = z.infer<typeof purchaseGoalSchema>;

interface PurchaseGoalFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  goalToEdit?: PurchaseGoal;
}

const PurchaseGoalForm: FC<PurchaseGoalFormProps> = ({ isOpen, onOpenChange, goalToEdit }) => {
  const { addPurchaseGoal, updatePurchaseGoal, comptes } = useAppContext();

  const projectFundingComptes = useMemo(() => {
    // Allow funding from any Compte, user can decide.
    // Later, we might restrict to specific types like 'CUSTOM_PROJET' or 'COURANT' if needed.
    return comptes.filter(c => c.lockStatus !== 'full' && c.lockStatus !== 'outgoing_only');
  }, [comptes]);


  const { control, handleSubmit, register, reset, formState: { errors, isSubmitting } } = useForm<PurchaseGoalFormData>({
    resolver: zodResolver(purchaseGoalSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (goalToEdit) {
          reset({
            title: goalToEdit.title,
            targetAmount: goalToEdit.targetAmount,
            deadline: parseISO(goalToEdit.deadline),
            note: goalToEdit.note || '',
            fundingCompteId: goalToEdit.fundingCompteId,
          });
      } else {
          reset({
            deadline: new Date(),
            title: '',
            targetAmount: undefined,
            note: '',
            fundingCompteId: projectFundingComptes[0]?.id || '',
          });
      }
    }
  }, [goalToEdit, isOpen, reset, projectFundingComptes]);

  const onSubmit = (data: PurchaseGoalFormData) => {
    const goalData = {
      ...data,
      deadline: format(data.deadline, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    };
    if (goalToEdit) {
      updatePurchaseGoal({
        ...goalData,
        id: goalToEdit.id,
        contributions: goalToEdit.contributions || []
      });
    } else {
      addPurchaseGoal(goalData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle>{goalToEdit ? "Modifier l'Objectif d'Achat" : "Nouvel Objectif d'Achat"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Titre de l'Objectif</Label>
            <Input id="title" {...register('title')} placeholder="Ex: Nouvel Ordinateur" />
            {errors.title && <p className="text-destructive text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="fundingCompteId">Compte de Financement Principal</Label>
            <Controller
                name="fundingCompteId"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={!!goalToEdit}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un compte" />
                    </SelectTrigger>
                    <SelectContent>
                        {projectFundingComptes.length === 0 && <SelectItem value="" disabled>Aucun compte de financement disponible</SelectItem>}
                        {projectFundingComptes.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                )}
            />
            {errors.fundingCompteId && <p className="text-destructive text-sm mt-1">{errors.fundingCompteId.message}</p>}
             {projectFundingComptes.length === 0 && !goalToEdit && <p className="text-muted-foreground text-xs mt-1">Veuillez d'abord créer un compte approprié.</p>}
          </div>


          <div>
            <Label htmlFor="targetAmount">Montant Cible ({CURRENCY_SYMBOL})</Label>
            <Input id="targetAmount" type="number" step="0.01" {...register('targetAmount')} placeholder="0.00" />
            {errors.targetAmount && <p className="text-destructive text-sm mt-1">{errors.targetAmount.message}</p>}
          </div>

          <div>
            <Label htmlFor="deadline">Date d'Échéance</Label>
            <Controller
              name="deadline"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, 'PPP', { locale: fr }) : <span>Choisir une date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      disabled={(date) => isAfter(startOfToday(), date) && format(date, 'yyyy-MM-dd') !== format(startOfToday(), 'yyyy-MM-dd')}
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.deadline && <p className="text-destructive text-sm mt-1">{errors.deadline.message}</p>}
          </div>

          <div>
            <Label htmlFor="note">Note (Optionnel)</Label>
            <Textarea id="note" {...register('note')} placeholder="Ajouter une note..." />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Annuler</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || (projectFundingComptes.length === 0 && !goalToEdit) }>
             {isSubmitting ? <Loader2 className="animate-spin" /> : (goalToEdit ? 'Enregistrer' : 'Créer Objectif')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseGoalForm;
