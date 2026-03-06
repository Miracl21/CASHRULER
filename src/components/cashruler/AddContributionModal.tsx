
'use client';

import type { FC } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCY_SYMBOL } from '@/lib/cashruler/constants';
import { useAppContext } from '@/contexts/AppContext';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Compte } from '@/lib/cashruler/types';

const contributionSchema = z.object({
  amount: z.coerce.number().positive("Le montant doit être positif."),
  note: z.string().optional(),
  sourceCompteId: z.string().min(1, "Veuillez sélectionner un compte source pour la contribution."),
});

type ContributionFormData = z.infer<typeof contributionSchema>;

interface AddContributionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  goalId: string;
  goalTitle: string;
}

const AddContributionModal: FC<AddContributionModalProps> = ({ isOpen, onOpenChange, goalId, goalTitle }) => {
  const { addContributionToPurchaseGoal, purchaseGoals, getCompteBalance, comptes } = useAppContext();

  const goal = purchaseGoals.find(g => g.id === goalId);

  const { handleSubmit, register, reset, watch, control, formState: { errors, isSubmitting } } = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
    defaultValues: { amount: undefined, note: '', sourceCompteId: goal?.fundingCompteId || '' },
  });

  const contributionAmount = watch('amount');
  const selectedSourceCompteId = watch('sourceCompteId');
  const sourceCompteBalance = selectedSourceCompteId ? getCompteBalance(selectedSourceCompteId) : 0;

  const availableComptesForContribution = comptes.filter(c => c.lockStatus !== 'full' && c.lockStatus !== 'outgoing_only');


  const onSubmit = (data: ContributionFormData) => {
    const selectedCompte = comptes.find(c => c.id === data.sourceCompteId);
    if (selectedCompte && (selectedCompte.lockStatus === 'full' || selectedCompte.lockStatus === 'outgoing_only')) {
      alert(`Le compte source "${selectedCompte.name}" est verrouillé pour les sorties et ne peut pas contribuer à l'objectif.`);
      return;
    }

    if (data.amount > sourceCompteBalance) {
      alert(`Le montant de la contribution (${data.amount.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL}) dépasse le solde du compte "${selectedCompte?.name || 'source'}" (${sourceCompteBalance.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL}). Veuillez d'abord alimenter le compte.`);
      return;
    }

    addContributionToPurchaseGoal(goalId, {
      amount: data.amount,
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
      note: data.note,
    }, data.sourceCompteId);
    onOpenChange(false);
    reset({ amount: undefined, note: '', sourceCompteId: goal?.fundingCompteId || '' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) reset({ amount: undefined, note: '', sourceCompteId: goal?.fundingCompteId || '' }); }}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle>Ajouter Contribution à "{goalTitle}"</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="contributionAmount">Montant ({CURRENCY_SYMBOL})</Label>
            <Input id="contributionAmount" type="number" step="0.01" {...register('amount')} placeholder="0.00" autoFocus />
            {errors.amount && <p className="text-destructive text-sm mt-1">{errors.amount.message}</p>}
          </div>

          <div>
            <Label htmlFor="sourceCompteId">Depuis le Compte</Label>
            <Controller
              name="sourceCompteId"
              control={control}
              defaultValue={goal?.fundingCompteId || ''}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un compte source" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableComptesForContribution.map(c => (
                      <SelectItem key={c.id} value={c.id} disabled={(contributionAmount || 0) > getCompteBalance(c.id) && contributionAmount !== undefined}>
                        {c.name} (Solde: {getCompteBalance(c.id).toLocaleString('fr-FR')} {CURRENCY_SYMBOL})
                      </SelectItem>
                    ))}
                    {availableComptesForContribution.length === 0 && <SelectItem value="" disabled>Aucun compte disponible pour contribuer</SelectItem>}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.sourceCompteId && <p className="text-destructive text-sm mt-1">{errors.sourceCompteId.message}</p>}
            {selectedSourceCompteId && contributionAmount && contributionAmount > sourceCompteBalance && contributionAmount !== undefined &&
              <p className="text-destructive text-sm mt-1">Le montant dépasse le solde du compte sélectionné.</p>
            }
          </div>

          <div>
            <Label htmlFor="contributionNote">Note (Optionnel)</Label>
            <Textarea id="contributionNote" {...register('note')} placeholder="Ex: Épargne de la semaine" />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Annuler</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || !!(selectedSourceCompteId && (contributionAmount || 0) > sourceCompteBalance && contributionAmount !== undefined)}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Ajouter Contribution'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddContributionModal;
