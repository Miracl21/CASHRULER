
'use client';

import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CURRENCY_SYMBOL, PREDEFINED_COMPTE_COURANT_ID } from '@/lib/cashruler/constants';
import type { Compte, Transfer } from '@/lib/cashruler/types';
import { useAppContext } from '@/contexts/AppContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const transferSchema = z.object({
  fromCompteId: z.string().min(1, "Veuillez sélectionner un compte source."),
  toCompteId: z.string().min(1, "Veuillez sélectionner un compte de destination."),
  amount: z.coerce.number().positive("Le montant doit être positif."),
  note: z.string().optional(),
}).refine(data => data.fromCompteId !== data.toCompteId, {
  message: "Le compte source et le compte de destination ne peuvent pas être identiques.",
  path: ['toCompteId'],
});

type TransferFormData = z.infer<typeof transferSchema>;

interface TransferFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  defaultFromCompteId?: string;
  defaultToCompteId?: string;
}

const TransferForm: FC<TransferFormProps> = ({ isOpen, onOpenChange, defaultFromCompteId, defaultToCompteId }) => {
  const { addTransfer, comptes, getCompteBalance } = useAppContext();
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, register, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromCompteId: defaultFromCompteId || PREDEFINED_COMPTE_COURANT_ID,
      toCompteId: defaultToCompteId || '',
      amount: undefined,
      note: '',
    },
  });

  const fromCompteId = watch('fromCompteId');
  const toCompteId = watch('toCompteId');
  const transferAmount = watch('amount');

  const fromCompteBalance = useMemo(() => {
    return fromCompteId ? getCompteBalance(fromCompteId) : 0;
  }, [fromCompteId, getCompteBalance]);

  const availableSourceComptes = useMemo(() => {
    return comptes.filter(c => c.id !== toCompteId && c.lockStatus !== 'full' && c.lockStatus !== 'outgoing_only');
  }, [comptes, toCompteId]);

  const availableDestinationComptes = useMemo(() => {
    return comptes.filter(c => c.id !== fromCompteId && c.lockStatus !== 'full');
  }, [comptes, fromCompteId]);

  useEffect(() => {
    if (isOpen) {
      const initialFromId = defaultFromCompteId || PREDEFINED_COMPTE_COURANT_ID;
      let initialToId = defaultToCompteId || '';
      if (initialToId === initialFromId) {
        initialToId = ''; // Ensure destination is cleared if it's same as source initially
      }

      reset({
        fromCompteId: initialFromId,
        toCompteId: initialToId,
        amount: undefined,
        note: '',
      });
      setFormError(null);
    }
  }, [isOpen, reset, defaultFromCompteId, defaultToCompteId]);

  const onSubmit = (data: TransferFormData) => {
    setFormError(null);
    const sourceCompte = comptes.find(c => c.id === data.fromCompteId);
    const destCompte = comptes.find(c => c.id === data.toCompteId);

    if (sourceCompte && (sourceCompte.lockStatus === 'full' || sourceCompte.lockStatus === 'outgoing_only')) {
      setFormError(`Le compte source "${sourceCompte.name}" est verrouillé pour les sorties.`);
      return;
    }
    if (destCompte && destCompte.lockStatus === 'full') {
      setFormError(`Le compte de destination "${destCompte.name}" est entièrement verrouillé et ne peut pas recevoir de fonds.`);
      return;
    }

    if ((data.amount || 0) > fromCompteBalance) {
      setFormError(`Le montant du transfert (${(data.amount || 0).toLocaleString('fr-FR')} ${CURRENCY_SYMBOL}) dépasse le solde du compte "${sourceCompte?.name || 'source'}" (${fromCompteBalance.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL}).`);
      return;
    }

    addTransfer({
      ...data,
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) reset(); }}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Effectuer un Transfert entre Comptes</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="fromCompteId">Du Compte</Label>
            <Controller
              name="fromCompteId"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value === watch('toCompteId')) setValue('toCompteId', '');
                  }}
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le compte source" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSourceComptes.map(c => (
                      <SelectItem key={c.id} value={c.id} disabled={c.lockStatus === 'full' || c.lockStatus === 'outgoing_only'}>
                        {c.name} (Solde: {getCompteBalance(c.id).toLocaleString('fr-FR')} ${CURRENCY_SYMBOL})
                      </SelectItem>
                    ))}
                    {availableSourceComptes.length === 0 && <SelectItem value="" disabled>Aucun compte source disponible</SelectItem>}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.fromCompteId && <p className="text-destructive text-sm mt-1">{errors.fromCompteId.message}</p>}
          </div>

          <div>
            <Label htmlFor="toCompteId">Vers le Compte</Label>
            <Controller
              name="toCompteId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le compte de destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDestinationComptes.map(c => (
                      <SelectItem key={c.id} value={c.id} disabled={c.lockStatus === 'full'}>
                        {c.name}
                      </SelectItem>
                    ))}
                    {availableDestinationComptes.length === 0 && <SelectItem value="" disabled>Aucun compte de destination disponible</SelectItem>}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.toCompteId && <p className="text-destructive text-sm mt-1">{errors.toCompteId.message}</p>}
          </div>

          <div>
            <Label htmlFor="amount">Montant ({CURRENCY_SYMBOL})</Label>
            <Input id="amount" type="number" step="0.01" {...register('amount')} placeholder="0.00" />
            {errors.amount && <p className="text-destructive text-sm mt-1">{errors.amount.message}</p>}
            {transferAmount && fromCompteId && getCompteBalance(fromCompteId) < transferAmount && transferAmount > 0 &&
              <p className="text-destructive text-sm mt-1">Le montant dépasse le solde du compte source.</p>
            }
          </div>

          <div>
            <Label htmlFor="note">Note (Optionnel)</Label>
            <Textarea id="note" {...register('note')} placeholder="Ex: Virement pour épargne mensuelle" />
          </div>

          {formError && (
            <div className="flex items-center p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>{formError}</p>
            </div>
          )}

          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Annuler</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || !!(transferAmount && fromCompteId && getCompteBalance(fromCompteId) < transferAmount && transferAmount > 0)}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Effectuer le Transfert'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransferForm;
