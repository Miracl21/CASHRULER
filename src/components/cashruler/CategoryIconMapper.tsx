import type { FC } from 'react';
import type { LucideProps } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_TYPES } from '@/lib/cashruler/constants';
import type { ExpenseCategory, IncomeType } from '@/lib/cashruler/types';
import { CircleHelp } from 'lucide-react';

interface CategoryIconMapperProps extends Omit<LucideProps, 'name'> {
  categoryName: ExpenseCategory | IncomeType | string;
  type: 'expense' | 'income';
}

const CategoryIconMapper: FC<CategoryIconMapperProps> = ({ categoryName, type, ...props }) => {
  const list = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_TYPES;
  const foundItem = list.find(item => item.name === categoryName);
  
  if (foundItem) {
    const IconComponent = foundItem.icon;
    return <IconComponent {...props} />;
  }
  
  return <CircleHelp {...props} />; // Default icon
};

export default CategoryIconMapper;
