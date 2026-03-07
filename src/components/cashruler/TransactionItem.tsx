'use client';

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import type { Expense, Income } from '@/lib/cashruler/types';
import CategoryIconMapper from './CategoryIconMapper';
import { CURRENCY_SYMBOL } from '@/lib/cashruler/constants';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Edit2, Trash2 } from 'lucide-react';

interface TransactionItemProps {
  transaction: Expense | Income;
  onEdit: () => void;
  onDelete: () => void;
}

const TransactionItem: FC<TransactionItemProps> = ({ transaction, onEdit, onDelete }) => {
  const isExpense = 'category' in transaction;
  const title = isExpense ? transaction.title : (transaction as Income).name;
  const categoryOrType = isExpense ? transaction.category : (transaction as Income).type;
  const amountColor = isExpense ? 'text-destructive' : 'text-primary';
  const amountPrefix = isExpense ? '-' : '+';
  const iconBg = isExpense ? 'bg-destructive/10' : 'bg-primary/10';
  const iconColor = isExpense ? 'text-destructive' : 'text-primary';

  return (
    <div className="p-3 rounded-xl bg-card/80 mb-1.5 transition-all duration-200 hover:bg-card press-scale">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <CategoryIconMapper
              categoryName={categoryOrType || 'Autres dépenses'}
              type={isExpense ? 'expense' : 'income'}
              className={`h-5 w-5 ${iconColor}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-foreground truncate">{title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {categoryOrType} · {format(parseISO(transaction.date), 'd MMM', { locale: fr })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <p className={`font-bold text-sm ${amountColor} tabular-nums`}>
            {amountPrefix}{transaction.amount.toLocaleString('fr-FR')} <span className="text-xs">{CURRENCY_SYMBOL}</span>
          </p>
          <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7 text-muted-foreground hover:text-primary">
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {transaction.note && (
        <p className="text-[11px] text-muted-foreground mt-1.5 ml-[52px] italic">Note: {transaction.note}</p>
      )}
    </div>
  );
};

export default TransactionItem;
