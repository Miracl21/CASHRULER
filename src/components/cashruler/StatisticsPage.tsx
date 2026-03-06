
'use client';

import type { FC } from 'react';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart as BarChartIconLucide, PieChart as PieChartIcon, Activity } from 'lucide-react'; // Renamed to avoid conflict
import { useAppContext } from '@/contexts/AppContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, XAxis, YAxis, Bar, CartesianGrid, LineChart, Line } from 'recharts';
import { EXPENSE_CATEGORIES, CURRENCY_SYMBOL } from '@/lib/cashruler/constants';
import { format, parseISO, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

const StatisticsPage: FC = () => {
  const { expenses, incomes } = useAppContext();

  const expenseByCategoryData = useMemo(() => {
    return EXPENSE_CATEGORIES.map(category => {
      const total = expenses
        .filter(e => e.category === category.name)
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        category: category.label,
        name: category.name,
        total: total,
      };
    }).filter(d => d.total > 0);
  }, [expenses]);

  const chartColors: string[] = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(330 65% 50%)',
    'hsl(190 80% 42%)',
    'hsl(45 93% 47%)',
    'hsl(0 0% 55%)',
  ];

  const expenseChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    expenseByCategoryData.forEach((item, index) => {
      config[item.name] = {
        label: item.category,
        color: chartColors[index % chartColors.length],
      };
    });
    return config satisfies ChartConfig;
  }, [expenseByCategoryData, chartColors]);


  const totalIncome = useMemo(() => incomes.reduce((sum, i) => sum + i.amount, 0), [incomes]);
  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  const incomeExpenseData = useMemo(() => [
    { type: 'Revenus', total: totalIncome, fill: 'hsl(var(--chart-1))' },
    { type: 'Dépenses', total: totalExpenses, fill: 'hsl(var(--chart-2))' },
  ], [totalIncome, totalExpenses]);

  const incomeExpenseChartConfig = useMemo(() => ({
    total: {
      label: CURRENCY_SYMBOL,
    },
    Revenus: {
      label: 'Revenus',
      color: 'hsl(var(--chart-1))',
    },
    Dépenses: {
      label: 'Dépenses',
      color: 'hsl(var(--chart-2))',
    },
  } satisfies ChartConfig), []);

  const trendsData = useMemo(() => {
    const dailyData: { [key: string]: { dateValue: Date, income: number, expenses: number } } = {};

    [...incomes, ...expenses].forEach(transaction => {
      const dateObj = parseISO(transaction.date);
      const dateKey = format(dateObj, 'yyyy-MM-dd');

      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          dateValue: startOfDay(dateObj),
          income: 0,
          expenses: 0,
        };
      }

      if ('category' in transaction) { // Expense
        dailyData[dateKey].expenses += transaction.amount;
      } else { // Income
        dailyData[dateKey].income += transaction.amount;
      }
    });

    return Object.entries(dailyData)
      .map(([_, value]) => ({
        date: format(value.dateValue, 'dd MMM', { locale: fr }), // Format for X-axis display
        Revenus: value.income,
        Dépenses: value.expenses,
        dateForSort: value.dateValue // Keep original date for sorting
      }))
      .sort((a, b) => a.dateForSort.getTime() - b.dateForSort.getTime())
      .map(({ date, Revenus, Dépenses }) => ({ date, Revenus, Dépenses })); // Remove dateForSort after sorting

  }, [expenses, incomes]);

  const trendsChartConfig = {
    Revenus: {
      label: "Revenus",
      color: "hsl(var(--chart-1))",
    },
    Dépenses: {
      label: "Dépenses",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;


  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6 bg-background pb-8 overflow-x-hidden">
        <h1 className="text-xl font-bold text-foreground">Statistiques</h1>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground"><PieChartIcon className="mr-2 h-5 w-5 text-primary" />Répartition des Dépenses</CardTitle>
            <CardDescription>Visualisez où va votre argent. ({CURRENCY_SYMBOL})</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseByCategoryData.length > 0 ? (
              <ChartContainer config={expenseChartConfig} className="mx-auto aspect-square max-h-[280px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel nameKey="category" />}
                    />
                    <Pie
                      data={expenseByCategoryData}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={50}
                      labelLine={false}
                    >
                      {expenseByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={expenseChartConfig[entry.name]?.color || chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="category" />} className="-translate-y-2 flex-wrap gap-1 text-xs [&>*]:basis-1/3 [&>*]:justify-center" />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-10">Pas assez de données de dépenses pour afficher le graphique.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground"><BarChartIconLucide className="mr-2 h-5 w-5 text-primary" />Revenus vs Dépenses</CardTitle>
            <CardDescription>Comparez vos entrées et sorties d'argent. ({CURRENCY_SYMBOL})</CardDescription>
          </CardHeader>
          <CardContent>
            {(totalIncome > 0 || totalExpenses > 0) ? (
              <ChartContainer config={incomeExpenseChartConfig} className="w-full h-[250px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomeExpenseData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="type"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => incomeExpenseChartConfig[value as keyof typeof incomeExpenseChartConfig]?.label || value}
                    />
                    <YAxis tickFormatter={(value) => `${value.toLocaleString('fr-FR')}`} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" nameKey="type" />}
                    />
                    <ChartLegend content={<ChartLegendContent nameKey="type" />} />
                    <Bar
                      dataKey="total"
                      radius={4}
                    >
                      {incomeExpenseData.map((entry) => (
                        <Cell key={entry.type} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-10">Pas assez de données pour afficher le graphique revenus vs dépenses.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground"><Activity className="mr-2 h-5 w-5 text-primary" />Tendances Financières</CardTitle>
            <CardDescription>Évolution de vos revenus et dépenses dans le temps. ({CURRENCY_SYMBOL})</CardDescription>
          </CardHeader>
          <CardContent>
            {trendsData.length > 0 ? (
              <ChartContainer config={trendsChartConfig} className="w-full h-[250px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendsData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                    <YAxis tickFormatter={(value) => `${value.toLocaleString('fr-FR')}`} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="Revenus" stroke={trendsChartConfig.Revenus.color} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Dépenses" stroke={trendsChartConfig.Dépenses.color} strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-10">Pas assez de données pour afficher le graphique des tendances.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};

export default StatisticsPage;
