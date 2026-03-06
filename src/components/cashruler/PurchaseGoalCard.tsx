
'use client';

import type { FC, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { PurchaseGoal } from '@/lib/cashruler/types';
import { CURRENCY_SYMBOL, COMPTE_TYPE_DETAILS } from '@/lib/cashruler/constants';
import { format, parseISO, formatDistanceToNowStrict, isBefore, startOfToday, differenceInWeeks, differenceInCalendarMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Target, PlusCircle, Edit2, Calculator, Info, Trash2, PiggyBank } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAppContext } from '@/contexts/AppContext';

interface SavingPlan {
  rationale: string;
  weeklyAmount: number | null;
  monthlyAmount: number | null;
}

interface PurchaseGoalCardProps {
  goal: PurchaseGoal;
  onAddContribution: () => void;
  onEditGoal: () => void;
  onDeleteGoal: () => void;
}

const PurchaseGoalCard: FC<PurchaseGoalCardProps> = ({ goal, onAddContribution, onEditGoal, onDeleteGoal }) => {
  const { getPurchaseGoalContributionsTotal, comptes } = useAppContext();
  const [savingPlan, setSavingPlan] = useState<SavingPlan | null>(null);

  const totalContributedToGoal = getPurchaseGoalContributionsTotal(goal.id);
  const currentBalanceForGoal = totalContributedToGoal;

  const progressPercentage = goal.targetAmount > 0 ? (currentBalanceForGoal / goal.targetAmount) * 100 : 0;
  const remainingAmount = goal.targetAmount - currentBalanceForGoal;

  let timeRemainingText: ReactNode = '';
  const deadlineDate = parseISO(goal.deadline);
  const today = startOfToday();

  const isDeadlinePast = isBefore(deadlineDate, today);
  const isGoalReached = currentBalanceForGoal >= goal.targetAmount;

  if (isGoalReached) {
    timeRemainingText = 'Objectif atteint!';
  } else if (isDeadlinePast) {
    timeRemainingText = 'Échéance dépassée';
  } else {
    const distance = formatDistanceToNowStrict(deadlineDate, { locale: fr, addSuffix: false });
    timeRemainingText = <>Restant: <span className="font-semibold">{distance}</span></>;
  }

  const fundingCompte = comptes.find(c => c.id === goal.fundingCompteId);
  const fundingCompteName = fundingCompte?.name || 'Compte inconnu';
  const FundingCompteIcon = fundingCompte ? COMPTE_TYPE_DETAILS[fundingCompte.type]?.icon || PiggyBank : PiggyBank;

  const calculatePlan = () => {
    if (isGoalReached || isDeadlinePast) return;

    const weeksRemaining = differenceInWeeks(deadlineDate, today);
    const monthsRemaining = differenceInCalendarMonths(deadlineDate, today);
    const amount = Math.max(0, remainingAmount);

    let weeklyAmount: number | null = null;
    let monthlyAmount: number | null = null;
    let rationale = '';

    if (amount <= 0) {
      rationale = '🎉 Vous avez déjà atteint votre objectif !';
    } else if (weeksRemaining < 1) {
      rationale = `Il reste ${amount.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL} à épargner mais l'échéance est très proche. Essayez de contribuer le maximum possible.`;
    } else {
      weeklyAmount = Math.ceil(amount / weeksRemaining);
      monthlyAmount = monthsRemaining >= 1 ? Math.ceil(amount / monthsRemaining) : null;

      rationale = `Pour atteindre votre objectif de ${goal.targetAmount.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL} d'ici le ${format(deadlineDate, 'd MMMM yyyy', { locale: fr })}, `;

      if (monthlyAmount && monthsRemaining >= 1) {
        rationale += `vous devrez épargner environ ${weeklyAmount.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL}/semaine ou ${monthlyAmount.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL}/mois.`;
      } else {
        rationale += `vous devrez épargner environ ${weeklyAmount.toLocaleString('fr-FR')} ${CURRENCY_SYMBOL}/semaine.`;
      }
    }

    setSavingPlan({ rationale, weeklyAmount, monthlyAmount });
  };

  return (
    <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow bg-card/70 border border-primary/30">
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-md text-foreground flex items-center">
            <Target className="mr-2 h-5 w-5 text-primary" />
            {goal.title}
          </CardTitle>
          <div className="flex items-center space-x-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${isGoalReached ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : isDeadlinePast ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  : 'bg-accent/20 text-accent-foreground'
              }`}>
              {timeRemainingText}
            </span>
            <Button variant="ghost" size="icon" onClick={onEditGoal} className="text-muted-foreground hover:text-primary h-6 w-6">
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDeleteGoal} className="text-muted-foreground hover:text-destructive h-6 w-6">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs flex items-center">
          Objectif: {goal.targetAmount.toLocaleString('fr-FR')} {CURRENCY_SYMBOL} | Échéance: {format(deadlineDate, 'd MMM yyyy', { locale: fr })}
          {fundingCompte && (
            <span className="ml-2 flex items-center text-muted-foreground">
              <FundingCompteIcon className="h-3 w-3 mr-1" />
              via {fundingCompteName}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 pb-3">
        <div className="mb-1">
          <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
            <span>Actuellement: {currentBalanceForGoal.toLocaleString('fr-FR')} {CURRENCY_SYMBOL}</span>
            <span>Restant: {Math.max(0, remainingAmount).toLocaleString('fr-FR')} {CURRENCY_SYMBOL}</span>
          </div>
          <Progress value={Math.min(100, progressPercentage)} className={`h-2.5 ${isGoalReached ? '[&>*]:bg-green-500' : ''}`} />
          <p className={`text-xs text-right mt-0.5 ${isGoalReached ? 'text-green-600' : 'text-primary'}`}>{Math.min(100, progressPercentage).toFixed(0)}%</p>
        </div>
        {goal.note && <p className="text-xs text-muted-foreground italic mt-1">Note: {goal.note}</p>}

        {!isGoalReached && !isDeadlinePast && (
          <div className="mt-3">
            <Button onClick={calculatePlan} variant="outline" size="sm" className="w-full text-xs border-primary/40 text-primary hover:bg-primary/10 hover:text-primary">
              <Calculator className="mr-1.5 h-3.5 w-3.5" /> Calculer Plan d'Épargne
            </Button>
          </div>
        )}

        {savingPlan && (
          <Alert variant="default" className="mt-3 bg-primary/5 border-primary/30 p-3">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle className="font-semibold text-primary text-sm">Plan d'Épargne</AlertTitle>
            <AlertDescription className="text-xs text-foreground space-y-0.5">
              <p>{savingPlan.rationale}</p>
              {savingPlan.weeklyAmount !== null && savingPlan.weeklyAmount > 0 && (
                <p><strong>Hebdo:</strong> {savingPlan.weeklyAmount.toLocaleString('fr-FR')} {CURRENCY_SYMBOL}</p>
              )}
              {savingPlan.monthlyAmount !== null && savingPlan.monthlyAmount > 0 && (
                <p><strong>Mensuel:</strong> {savingPlan.monthlyAmount.toLocaleString('fr-FR')} {CURRENCY_SYMBOL}</p>
              )}
            </AlertDescription>
          </Alert>
        )}

      </CardContent>
      {!isGoalReached && (
        <CardFooter className="flex-col items-stretch space-y-2 pt-0 pb-3 px-3">
          <Button onClick={onAddContribution} size="sm" className="w-full shadow-sm text-sm py-2">
            <PlusCircle className="mr-2 h-4 w-4" /> Contribuer Objectif
          </Button>
        </CardFooter>
      )}
      {isGoalReached && (
        <CardFooter className="pt-0 pb-3 px-3">
          <p className="text-green-600 font-semibold w-full text-center py-1 text-sm">🎉 Objectif Atteint! 🎉</p>
        </CardFooter>
      )}
    </Card>
  );
};

export default PurchaseGoalCard;
