
export type ExpenseCategory =
  | 'Alimentation'
  | 'Transport'
  | 'Logement'
  | 'Santé'
  | 'Loisirs'
  | 'Shopping'
  | 'Éducation'
  | 'Services'
  | 'Eau et électricité'
  | 'Autres dépenses';

export type IncomeType =
  | 'Salaire'
  | 'Freelance'
  | 'Don/Cadeau'
  | 'Vente'
  | 'Intérêts/Dividendes'
  | 'Remboursement'
  | 'Autres revenus';

// --- Compte System Types ---
export type PredefinedCompteType = 'COURANT' | 'DON' | 'URGENCE' | 'INVESTISSEMENT' | 'OEUVRES_ROYAUME';
export type CustomCompteType = 'CUSTOM_EPARGNE' | 'CUSTOM_PROJET' | 'CUSTOM_AUTRE';
export type CompteType = PredefinedCompteType | CustomCompteType;

export type LockType = 'none' | 'outgoing_only' | 'full';

export interface Compte {
  id: string;
  name: string;
  type: CompteType;
  iconName: string;
  color?: string;
  targetAmount?: number;
  contributions: Contribution[];
  lockStatus: LockType;
  isPredefined: boolean;
}

export interface Income {
  id: string;
  name: string;
  type: IncomeType;
  amount: number;
  date: string; // ISO string
  note?: string;
  targetCompteId: string; // ID of the Compte where the income is initially deposited
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string; // ISO string
  note?: string;
  sourceCompteId: string; // ID of the Compte from which the expense is made
  category?: ExpenseCategory; // Optional: only relevant if sourceCompteId is 'Compte Courant'
}

export interface Contribution {
  id: string;
  amount: number;
  date: string; // ISO string
  note?: string;
  sourceCompteId?: string; // Optional: if contribution to a goal comes from a specific compte
}

export interface PurchaseGoal {
  id: string;
  title: string;
  targetAmount: number;
  deadline: string; // ISO string
  note?: string;
  fundingCompteId: string; // The primary compte this goal is associated with
  contributions: Contribution[];
  isCompletedNotified?: boolean;
}

export interface ExpenseLimit {
  id: string;
  category: ExpenseCategory;
  dailyAmount: number;
}

// --- Budget Mensuel Types (Primarily for 'Compte Courant') ---
export interface BudgetExpenseAllocation {
  id: string;
  category: ExpenseCategory;
  allocatedAmount: number;
  notifiedThreshold?: number; // 50, 75, 100, 101 (over)
}

export interface BudgetSavingAllocation { // Allocation from Compte Courant to other Comptes
  id: string;
  targetCompteId: string; // ID of a Compte (e.g., Compte Urgence, Compte Investissement)
  allocatedAmount: number;
}

export interface MonthlyBudget {
  id: string; // e.g., "2024-08" (année-mois)
  monthYear: string; // Format YYYY-MM
  referenceIncome: number; // Total income allocated to Compte Courant for this month's budget
  expenseAllocations: BudgetExpenseAllocation[];
  savingsAllocations: BudgetSavingAllocation[]; // Planned transfers from Compte Courant to other Comptes
  targetSavingsAmount: number; // Sum of savingsAllocations.allocatedAmount
}
// --- Fin Types ---

export interface Transfer {
  id: string;
  fromCompteId: string;
  toCompteId: string;
  amount: number;
  date: string; // ISO string
  note?: string;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  type: 'expense' | 'income';
  // Expense fields
  title?: string;
  category?: ExpenseCategory;
  sourceCompteId?: string;
  // Income fields
  name?: string;
  incomeType?: IncomeType;
  targetCompteId?: string;
  // Common fields
  amount: number;
  frequency: RecurringFrequency;
  nextOccurrence: string; // ISO date string
  note?: string;
  isActive: boolean;
}

export type Transaction = Expense | Income | Contribution | Transfer;

export type AppActiveTab = 'dashboard' | 'transactions' | 'budget' | 'comptes' | 'statistics' | 'settings';

// --- User Settings ---
export interface UserSettings {
  username?: string;
  enableBudgetNotifications: boolean;
  enableMotivationalMessages: boolean;
}

export interface AppState {
  comptes: Compte[];
  incomes: Income[];
  expenses: Expense[];
  purchaseGoals: PurchaseGoal[];
  expenseLimits: ExpenseLimit[];
  monthlyBudgets: MonthlyBudget[];
  transfers: Transfer[];
  recurringTransactions: RecurringTransaction[];
  userSettings: UserSettings;
  isLoading: boolean;
}

export interface AppContextType extends Omit<AppState, 'isLoading' | 'userSettings' | 'comptes'> {
  comptes: Compte[];
  isLoading: boolean;
  userSettings: UserSettings;
  updateUserSettings: (newSettings: Partial<UserSettings>) => void;
  resetApplicationData: () => void;

  addCompte: (compte: Omit<Compte, 'id' | 'contributions' | 'isPredefined'>) => void;
  updateCompte: (compte: Compte) => void;
  deleteCompte: (id: string) => void;
  addContributionToCompte: (compteId: string, contribution: Omit<Contribution, 'id'>) => void;
  getCompteBalance: (compteId: string) => number;

  addIncome: (income: Omit<Income, 'id'>) => void;
  updateIncome: (income: Income) => void;
  deleteIncome: (id: string) => void;

  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;

  addPurchaseGoal: (goal: Omit<PurchaseGoal, 'id' | 'contributions'>) => void;
  updatePurchaseGoal: (goal: PurchaseGoal) => void;
  deletePurchaseGoal: (id: string) => void;
  addContributionToPurchaseGoal: (goalId: string, contribution: Omit<Contribution, 'id' | 'sourceCompteId'>, sourceCompteId: string) => void;
  getPurchaseGoalContributionsTotal: (goalId: string) => number;

  addExpenseLimit: (limit: Omit<ExpenseLimit, 'id'>) => void;
  updateExpenseLimit: (limit: ExpenseLimit) => void;
  deleteExpenseLimit: (id: string) => void;

  addMonthlyBudget: (budget: MonthlyBudget) => void;
  updateMonthlyBudget: (budget: MonthlyBudget) => void;
  getMonthlyBudget: (monthYear: string) => MonthlyBudget | undefined;

  addTransfer: (transfer: Omit<Transfer, 'id'>) => void;

  recurringTransactions: RecurringTransaction[];
  addRecurringTransaction: (rt: Omit<RecurringTransaction, 'id'>) => void;
  deleteRecurringTransaction: (id: string) => void;
  applyRecurringTransaction: (rt: RecurringTransaction) => void;
}
