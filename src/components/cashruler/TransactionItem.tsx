'use client';

import type { FC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  const amountColor = isExpense ? 'text-destructive' : 'text-green-600';
  const amountPrefix = isExpense ? '-' : '+';

  return (
    <Card className="mb-3 shadow-sm hover:shadow-md transition-shadow bg-card">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-accent/20 rounded-full">
            <CategoryIconMapper
              categoryName={categoryOrType || 'Autres dépenses'}
              type={isExpense ? 'expense' : 'income'}
              className="h-6 w-6 text-accent-foreground"
            />
          </div>
          <div>
            <p className="font-semibold text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">
              {categoryOrType} - {format(parseISO(transaction.date), 'd MMM yyyy', { locale: fr })}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <p className={`font-bold text-lg ${amountColor}`}>
            {amountPrefix}{transaction.amount.toLocaleString('fr-FR')} {CURRENCY_SYMBOL}
          </p>
          <Button variant="ghost" size="icon" onClick={onEdit} className="text-muted-foreground hover:text-primary">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
      {transaction.note && (
        <div className="px-4 pb-3 pt-1 border-t border-border">
          <p className="text-xs text-muted-foreground italic">Note: {transaction.note}</p>
        </div>
      )}
    </Card>
  );
};

export default TransactionItem;
