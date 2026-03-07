
'use client';

import type { FC } from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import PurchaseGoalCard from './PurchaseGoalCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit2, Trash2, DollarSign, Loader2, PackageSearch, PiggyBank, Lock, Unlock, Ban } from 'lucide-react';
import PurchaseGoalForm from './PurchaseGoalForm';
import AddContributionModal from './AddContributionModal';
import IncomeForm from './IncomeForm';
import TransferForm from './TransferForm';

import type { Compte, PurchaseGoal, CompteType, LockType } from '@/lib/cashruler/types';
import { CURRENCY_SYMBOL, COMPTE_TYPE_DETAILS, AVAILABLE_COMPTE_ICONS, DEFAULT_CUSTOM_COMPTE_ICON, DEFAULT_CUSTOM_COMPTE_COLOR, PREDEFINED_COMPTE_COURANT_ID, LOCK_STATUS_OPTIONS } from '@/lib/cashruler/constants';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const compteSchema = z.object({
  name: z.string().min(1, "Le nom du compte est requis.").max(50, "Le nom ne doit pas dépasser 50 caractères."),
  type: z.custom<CompteType>((val) => typeof val === 'string' && Object.keys(COMPTE_TYPE_DETAILS).filter(key => !COMPTE_TYPE_DETAILS[key as CompteType].isPredefined).includes(val as CompteType), {
    message: "Veuillez sélectionner un type de compte personnalisé valide."
  }).optional(),
  targetAmount: z.coerce.number().min(0, "L'objectif doit être positif ou nul.").optional().nullable(),
  iconName: z.string().min(1, "Un nom d'icône est requis.").default(DEFAULT_CUSTOM_COMPTE_ICON),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Format de couleur invalide (ex: #RRGGBB)").default(DEFAULT_CUSTOM_COMPTE_COLOR),
  lockStatus: z.enum(['none', 'outgoing_only', 'full'] as [LockType, ...LockType[]]).default('none'),
});
type CompteFormData = z.infer<typeof compteSchema>;


const ComptesPage: FC = () => {
  const {
    comptes,
    purchaseGoals,
    addCompte,
    updateCompte,
    deleteCompte,
    getCompteBalance,
    deletePurchaseGoal,
    addContributionToCompte,
  } = useAppContext();

  const [isCompteFormOpen, setIsCompteFormOpen] = useState(false);
  const [editingCompte, setEditingCompte] = useState<Compte | undefined>(undefined);

  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PurchaseGoal | undefined>(undefined);

  const [isCompteContributionModalOpen, setIsCompteContributionModalOpen] = useState(false);
  const [selectedCompteForDirectContribution, setSelectedCompteForDirectContribution] = useState<Compte | null>(null);

  const [isContributionToGoalModalOpen, setIsContributionToGoalModalOpen] = useState(false);
  const [selectedGoalForContribution, setSelectedGoalForContribution] = useState<PurchaseGoal | null>(null);

  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'compte' | 'goal', name: string } | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const [isIncomeFormOpen, setIsIncomeFormOpen] = useState(false);
  const [isTransferFormOpen, setIsTransferFormOpen] = useState(false);
  const [defaultTransferToCompteId, setDefaultTransferToCompteId] = useState<string | null>(null);

  const { control: controlDirectContribution, handleSubmit: handleSubmitDirectContribution, reset: resetDirectContribution, formState: { errors: errorsDirectContribution, isSubmitting: isSubmittingDirectContribution } } = useForm<{ amount: number; note?: string }>({
    resolver: zodResolver(z.object({
      amount: z.coerce.number().positive("Le montant doit être positif."),
      note: z.string().optional(),
    })),
  });


  const { control: controlCompte, handleSubmit: handleSubmitCompte, reset: resetCompte, formState: { errors: errorsCompte, isSubmitting: isSubmittingCompte }, setValue: setCompteValue, watch: watchCompte } = useForm<CompteFormData>({
    resolver: zodResolver(compteSchema),
  });


  useEffect(() => {
    if (isCompteFormOpen) {
      if (editingCompte) {
        resetCompte({
          name: editingCompte.name,
          type: editingCompte.isPredefined ? undefined : editingCompte.type,
          targetAmount: editingCompte.targetAmount || null,
          iconName: editingCompte.iconName || DEFAULT_CUSTOM_COMPTE_ICON,
          color: editingCompte.color || DEFAULT_CUSTOM_COMPTE_COLOR,
          lockStatus: editingCompte.lockStatus || 'none',
        });
      } else {
        const defaultCustomType = 'CUSTOM_EPARGNE' as CompteType;
        resetCompte({
          name: '',
          type: defaultCustomType,
          targetAmount: null,
          iconName: COMPTE_TYPE_DETAILS[defaultCustomType]?.icon?.displayName || DEFAULT_CUSTOM_COMPTE_ICON,
          color: COMPTE_TYPE_DETAILS[defaultCustomType]?.defaultColor || DEFAULT_CUSTOM_COMPTE_COLOR,
          lockStatus: 'none',
        });
      }
    }
  }, [isCompteFormOpen, editingCompte, resetCompte, setCompteValue]);


  const handleOpenCompteForm = (compte?: Compte) => {
    setEditingCompte(compte);
    setIsCompteFormOpen(true);
  };

  const onCompteSubmit = (data: CompteFormData) => {
    if (editingCompte) {
      const payload: Compte = {
        ...editingCompte,
        name: editingCompte.isPredefined ? editingCompte.name : data.name,
        type: editingCompte.isPredefined ? editingCompte.type : data.type!,
        targetAmount: data.targetAmount || undefined,
        iconName: data.iconName,
        color: data.color,
        lockStatus: data.lockStatus,
        contributions: editingCompte.contributions || [],
      };
      updateCompte(payload);
    } else {
      if (!data.type) {
        alert("Le type de compte est requis pour un nouveau compte personnalisé.");
        return;
      }
      addCompte({
        name: data.name,
        type: data.type,
        targetAmount: data.targetAmount || undefined,
        iconName: data.iconName,
        color: data.color,
        lockStatus: data.lockStatus,
      });
    }
    setIsCompteFormOpen(false);
  };

  const handleOpenGoalForm = (goal?: PurchaseGoal, defaultFundingCompteId?: string) => {
    setEditingGoal(goal);
    setIsGoalFormOpen(true);
  };

  const handleOpenCompteContribution = (compte: Compte) => {
    if (compte.id === PREDEFINED_COMPTE_COURANT_ID) {
      setIsIncomeFormOpen(true);
    } else {
      if (compte.lockStatus === 'full') {
        toast({ title: "Action non autorisée", description: `Le compte "${compte.name}" est entièrement verrouillé et ne peut pas recevoir de fonds.`, variant: "destructive" });
        return;
      }
      setDefaultTransferToCompteId(compte.id);
      setIsTransferFormOpen(true);
    }
  };

  const onDirectContributionSubmit = (data: { amount: number; note?: string }) => {
    if (selectedCompteForDirectContribution) {
      addContributionToCompte(selectedCompteForDirectContribution.id, {
        amount: data.amount,
        date: new Date().toISOString(),
        note: data.note,
      });
    }
    setIsCompteContributionModalOpen(false);
    setSelectedCompteForDirectContribution(null);
  };


  const handleOpenContributionToGoalModal = (goal: PurchaseGoal) => {
    setSelectedGoalForContribution(goal);
    setIsContributionToGoalModalOpen(true);
  };


  const requestDeleteItem = (id: string, type: 'compte' | 'goal', name: string) => {
    setItemToDelete({ id, type, name });
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteItem = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'compte') {
      deleteCompte(itemToDelete.id);
    } else if (itemToDelete.type === 'goal') {
      deletePurchaseGoal(itemToDelete.id);
    }
    setIsDeleteAlertOpen(false);
    setItemToDelete(null);
  };

  const getCompteDisplayIcon = (compte: Compte): React.ElementType => {
    const iconDetail = AVAILABLE_COMPTE_ICONS.find(icon => icon.name === compte.iconName);
    if (iconDetail) return iconDetail.icon;
    const typeDetailIcon = COMPTE_TYPE_DETAILS[compte.type]?.icon;
    if (typeDetailIcon) return typeDetailIcon;
    return PiggyBank;
  };

  const selectedCompteIconName = watchCompte('iconName');
  const SelectedIconPreview = useMemo(() => {
    const iconDetail = AVAILABLE_COMPTE_ICONS.find(icon => icon.name === selectedCompteIconName);
    return iconDetail ? iconDetail.icon : PiggyBank;
  }, [selectedCompteIconName]);

  const getLockIconAndTooltip = (lockStatus: LockType): { icon: React.ElementType; tooltip: string, colorClass: string } => {
    switch (lockStatus) {
      case 'outgoing_only':
        return { icon: Ban, tooltip: 'Sorties d\'argent bloquées', colorClass: 'text-orange-500' };
      case 'full':
        return { icon: Lock, tooltip: 'Verrouillage complet (entrées/sorties bloquées)', colorClass: 'text-red-500' };
      case 'none':
      default:
        return { icon: Unlock, tooltip: 'Non verrouillé', colorClass: 'text-green-500' };
    }
  };


  return (
    <div className="p-4 flex flex-col h-full overflow-y-auto overflow-x-hidden">
      <div className="flex justify-between items-center mb-5 animate-slide-up">
        <h1 className="text-xl font-bold text-foreground">Gestion des Comptes</h1>
        <button
          onClick={() => handleOpenCompteForm()}
          className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-white gradient-primary shadow-md press-scale transition-all"
        >
          <PlusCircle className="h-3.5 w-3.5" /> Nouveau
        </button>
      </div>

      <div className="flex-grow">
        {comptes.length === 0 ? (
          <Card className="text-center py-10">
            <CardContent>
              <PiggyBank className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun compte créé pour le moment.</p>
              <p className="text-sm text-muted-foreground">Commencez par ajouter votre premier compte !</p>
            </CardContent>
          </Card>
        ) : (
          comptes.map((compte, i) => {
            const balance = getCompteBalance(compte.id);
            const CompteIcon = getCompteDisplayIcon(compte);
            const typeDetails = COMPTE_TYPE_DETAILS[compte.type];
            const goalsInThisCompte = purchaseGoals.filter(pg => pg.fundingCompteId === compte.id);
            const canHaveGoals = COMPTE_TYPE_DETAILS[compte.type]?.canHavePurchaseGoals || false;
            const { icon: LockStatusIcon, tooltip: lockTooltip, colorClass: lockColorClass } = getLockIconAndTooltip(compte.lockStatus);


            return (
              <Card key={compte.id} className="glass-card border-0 mb-4 animate-slide-up" style={{ animationDelay: `${Math.min(i * 0.05, 0.3)}s`, animationFillMode: 'both' }}>
                <CardHeader className="pb-3 pt-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${compte.color || '#6B7280'}15` }}>
                        <CompteIcon className="h-5 w-5" style={{ color: compte.color || 'hsl(var(--foreground))' }} />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold flex items-center gap-1.5 text-foreground">
                          {compte.name}
                          <LockStatusIcon className={cn("h-3.5 w-3.5", lockColorClass)} title={lockTooltip} />
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {typeDetails?.label || compte.type}
                          {compte.isPredefined && <span className="ml-1 text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Prédéfini</span>}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenCompteForm(compte)} className="h-7 w-7 text-muted-foreground hover:text-primary">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      {!compte.isPredefined && (
                        <Button variant="ghost" size="icon" onClick={() => requestDeleteItem(compte.id, 'compte', compte.name)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-foreground">
                      {balance.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-sm text-muted-foreground">{CURRENCY_SYMBOL}</span>
                    {compte.targetAmount && compte.targetAmount > 0 && (
                      <span className="text-xs text-muted-foreground ml-auto">/ {compte.targetAmount.toLocaleString('fr-FR')}</span>
                    )}
                  </div>

                  {compte.targetAmount && compte.targetAmount > 0 && (
                    <Progress value={Math.min(100, (balance / compte.targetAmount) * 100)} className="h-1.5 [&>*]:bg-primary" />
                  )}

                  <button
                    onClick={() => handleOpenCompteContribution(compte)}
                    disabled={compte.id !== PREDEFINED_COMPTE_COURANT_ID && compte.lockStatus === 'full'}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold press-scale transition-all border flex items-center justify-center gap-2 disabled:opacity-40"
                    style={{ color: compte.color || 'hsl(var(--primary))', borderColor: `${compte.color || 'hsl(var(--primary))'}40` }}
                  >
                    <DollarSign className="h-4 w-4" /> Alimenter Compte
                  </button>

                  {canHaveGoals && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-semibold text-foreground flex items-center">
                          <PackageSearch className="mr-1.5 h-4 w-4 text-muted-foreground" />Objectifs
                        </h4>
                        {(compte.lockStatus !== 'full' && compte.lockStatus !== 'outgoing_only') && (
                          <Button size="sm" variant="ghost" onClick={() => handleOpenGoalForm(undefined, compte.id)} className="text-xs text-primary h-7 px-2 press-scale">
                            <PlusCircle className="mr-1 h-3 w-3" /> Ajouter
                          </Button>
                        )}
                      </div>
                      {goalsInThisCompte.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">Aucun objectif pour ce compte.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {goalsInThisCompte.map(goal => (
                            <PurchaseGoalCard
                              key={goal.id}
                              goal={goal}
                              onAddContribution={() => handleOpenContributionToGoalModal(goal)}
                              onEditGoal={() => handleOpenGoalForm(goal)}
                              onDeleteGoal={() => requestDeleteItem(goal.id, 'goal', goal.title)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Compte Form Modal */}
      <Dialog open={isCompteFormOpen} onOpenChange={(open) => { setIsCompteFormOpen(open); if (!open) setEditingCompte(undefined); }}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>{editingCompte ? `Modifier "${editingCompte.name}"` : 'Nouveau Compte'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitCompte(onCompteSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="compteName">Nom du Compte</Label>
              <Input id="compteName" {...controlCompte.register('name')} placeholder="Ex: Épargne Vacances" disabled={!!editingCompte?.isPredefined} />
              {errorsCompte.name && <p className="text-destructive text-sm mt-1">{errorsCompte.name.message}</p>}
            </div>

            {!editingCompte?.isPredefined && (
              <div>
                <Label htmlFor="compteType">Type de Compte Personnalisé</Label>
                <Controller
                  name="type"
                  control={controlCompte}
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value as CompteType);
                        const typeDetails = COMPTE_TYPE_DETAILS[value as CompteType];
                        if (typeDetails) {
                          setCompteValue('iconName', typeDetails.icon?.displayName || DEFAULT_CUSTOM_COMPTE_ICON);
                          setCompteValue('color', typeDetails.defaultColor || DEFAULT_CUSTOM_COMPTE_COLOR);
                        }
                      }}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(COMPTE_TYPE_DETAILS)
                          .filter(([key, details]) => !details.isPredefined)
                          .map(([key, details]) => (
                            <SelectItem key={key} value={key}>{details.label}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errorsCompte.type && <p className="text-destructive text-sm mt-1">{errorsCompte.type.message}</p>}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 items-end">
              <div className="col-span-2">
                <Label htmlFor="compteIconName">Icône</Label>
                <Controller
                  name="iconName"
                  control={controlCompte}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une icône" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_COMPTE_ICONS.map(icon => (
                          <SelectItem key={icon.name} value={icon.name}>
                            <div className="flex items-center">
                              <icon.icon className="mr-2 h-4 w-4" />
                              {icon.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errorsCompte.iconName && <p className="text-destructive text-sm mt-1">{errorsCompte.iconName.message}</p>}
              </div>
              <SelectedIconPreview className="h-8 w-8" style={{ color: watchCompte('color') || DEFAULT_CUSTOM_COMPTE_COLOR }} />
            </div>


            <div>
              <Label htmlFor="compteColor">Couleur</Label>
              <Controller
                name="color"
                control={controlCompte}
                render={({ field }) => (
                  <Input id="compteColor" type="color" value={field.value || DEFAULT_CUSTOM_COMPTE_COLOR} onChange={field.onChange} className="h-10 p-1" />
                )}
              />
              {errorsCompte.color && <p className="text-destructive text-sm mt-1">{errorsCompte.color.message}</p>}
            </div>
            <div>
              <Label htmlFor="compteTargetAmount">Objectif du Compte (Optionnel, {CURRENCY_SYMBOL})</Label>
              <Input id="compteTargetAmount" type="number" step="0.01" {...controlCompte.register('targetAmount')} placeholder="0.00" />
              {errorsCompte.targetAmount && <p className="text-destructive text-sm mt-1">{errorsCompte.targetAmount.message}</p>}
            </div>

            <div>
              <Label htmlFor="lockStatus">Statut de Verrouillage</Label>
              <Controller
                name="lockStatus"
                control={controlCompte}
                defaultValue={editingCompte?.lockStatus || 'none'}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Définir le verrouillage" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCK_STATUS_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center">
                            {option.icon && <option.icon className="mr-2 h-4 w-4" />}
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errorsCompte.lockStatus && <p className="text-destructive text-sm mt-1">{errorsCompte.lockStatus.message}</p>}
            </div>


            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="outline">Annuler</Button></DialogClose>
              <Button type="submit" disabled={isSubmittingCompte}>
                {isSubmittingCompte ? <Loader2 className="animate-spin" /> : (editingCompte ? 'Enregistrer' : 'Créer Compte')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <PurchaseGoalForm
        isOpen={isGoalFormOpen}
        onOpenChange={(isOpen) => {
          setIsGoalFormOpen(isOpen);
          if (!isOpen) setEditingGoal(undefined);
        }}
        goalToEdit={editingGoal}
      />

      {selectedGoalForContribution && (
        <AddContributionModal
          isOpen={isContributionToGoalModalOpen}
          onOpenChange={(isOpen) => {
            setIsContributionToGoalModalOpen(isOpen);
            if (!isOpen) setSelectedGoalForContribution(null);
          }}
          goalId={selectedGoalForContribution.id}
          goalTitle={selectedGoalForContribution.title}
        />
      )}

      <IncomeForm
        isOpen={isIncomeFormOpen}
        onOpenChange={setIsIncomeFormOpen}
      />

      <TransferForm
        isOpen={isTransferFormOpen}
        onOpenChange={(open) => {
          setIsTransferFormOpen(open);
          if (!open) setDefaultTransferToCompteId(null);
        }}
        defaultFromCompteId={PREDEFINED_COMPTE_COURANT_ID}
        defaultToCompteId={defaultTransferToCompteId || undefined}
      />


      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer "{itemToDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée.
              {itemToDelete?.type === 'compte' && " La suppression de ce compte personnalisé entraînera aussi la suppression des objectifs d'achat qui y sont liés et la réaffectation des transactions associées au compte courant."}
              {itemToDelete?.type === 'goal' && " Cela supprimera définitivement cet objectif d'achat et ses contributions."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default ComptesPage;
