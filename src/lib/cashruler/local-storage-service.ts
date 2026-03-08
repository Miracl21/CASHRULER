/**
 * local-storage-service.ts — Persistence layer using localStorage
 * This is the primary data store. Supabase is the cloud backup.
 */

import type {
    Compte, Income, Expense, Transfer, PurchaseGoal,
    ExpenseLimit, MonthlyBudget, UserSettings, RecurringTransaction,
} from './types';

// ─── Storage Keys ────────────────────────────────────────────
const KEYS = {
    comptes: 'cashruler_comptes',
    incomes: 'cashruler_incomes',
    expenses: 'cashruler_expenses',
    transfers: 'cashruler_transfers',
    purchaseGoals: 'cashruler_purchase_goals',
    expenseLimits: 'cashruler_expense_limits',
    monthlyBudgets: 'cashruler_monthly_budgets',
    recurringTransactions: 'cashruler_recurring_transactions',
    userSettings: 'cashruler_user_settings',
    lastSyncTimestamp: 'cashruler_last_sync',
    syncQueue: 'cashruler_sync_queue',
    hasLocalData: 'cashruler_has_local_data',
} as const;

// ─── Generic helpers ─────────────────────────────────────────
function loadJson<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function saveJson<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`[LocalStorage] Failed to save ${key}:`, e);
    }
}

// ─── Typed load/save ─────────────────────────────────────────
export function loadComptes(): Compte[] { return loadJson(KEYS.comptes, []); }
export function saveComptes(data: Compte[]): void { saveJson(KEYS.comptes, data); }

export function loadIncomes(): Income[] { return loadJson(KEYS.incomes, []); }
export function saveIncomes(data: Income[]): void { saveJson(KEYS.incomes, data); }

export function loadExpenses(): Expense[] { return loadJson(KEYS.expenses, []); }
export function saveExpenses(data: Expense[]): void { saveJson(KEYS.expenses, data); }

export function loadTransfers(): Transfer[] { return loadJson(KEYS.transfers, []); }
export function saveTransfers(data: Transfer[]): void { saveJson(KEYS.transfers, data); }

export function loadPurchaseGoals(): PurchaseGoal[] { return loadJson(KEYS.purchaseGoals, []); }
export function savePurchaseGoals(data: PurchaseGoal[]): void { saveJson(KEYS.purchaseGoals, data); }

export function loadExpenseLimits(): ExpenseLimit[] { return loadJson(KEYS.expenseLimits, []); }
export function saveExpenseLimits(data: ExpenseLimit[]): void { saveJson(KEYS.expenseLimits, data); }

export function loadMonthlyBudgets(): MonthlyBudget[] { return loadJson(KEYS.monthlyBudgets, []); }
export function saveMonthlyBudgets(data: MonthlyBudget[]): void { saveJson(KEYS.monthlyBudgets, data); }

export function loadRecurringTransactions(): RecurringTransaction[] { return loadJson(KEYS.recurringTransactions, []); }
export function saveRecurringTransactions(data: RecurringTransaction[]): void { saveJson(KEYS.recurringTransactions, data); }

export function loadUserSettings(): UserSettings | null { return loadJson<UserSettings | null>(KEYS.userSettings, null); }
export function saveUserSettings(data: UserSettings): void { saveJson(KEYS.userSettings, data); }

// ─── Sync metadata ──────────────────────────────────────────
export function hasLocalData(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(KEYS.hasLocalData) === 'true';
}

export function markHasLocalData(): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(KEYS.hasLocalData, 'true');
    }
}

export function getLastSyncTimestamp(): number {
    return loadJson(KEYS.lastSyncTimestamp, 0);
}

export function setLastSyncTimestamp(ts: number): void {
    saveJson(KEYS.lastSyncTimestamp, ts);
}

// ─── Sync Queue (for offline mutations) ─────────────────────
export interface SyncAction {
    id: string;
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    table: string;
    payload: Record<string, unknown>;
    timestamp: number;
}

export function loadSyncQueue(): SyncAction[] {
    return loadJson(KEYS.syncQueue, []);
}

export function saveSyncQueue(queue: SyncAction[]): void {
    saveJson(KEYS.syncQueue, queue);
}

export function addToSyncQueue(action: Omit<SyncAction, 'id' | 'timestamp'>): void {
    const queue = loadSyncQueue();
    queue.push({
        ...action,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
    });
    saveSyncQueue(queue);
}

export function removeFromSyncQueue(actionId: string): void {
    const queue = loadSyncQueue().filter(a => a.id !== actionId);
    saveSyncQueue(queue);
}

export function clearSyncQueue(): void {
    saveSyncQueue([]);
}

// ─── Save entire app state at once ──────────────────────────
export function saveAllLocalData(data: {
    comptes: Compte[];
    incomes: Income[];
    expenses: Expense[];
    transfers: Transfer[];
    purchaseGoals: PurchaseGoal[];
    expenseLimits: ExpenseLimit[];
    monthlyBudgets: MonthlyBudget[];
    recurringTransactions: RecurringTransaction[];
    userSettings: UserSettings;
}): void {
    saveComptes(data.comptes);
    saveIncomes(data.incomes);
    saveExpenses(data.expenses);
    saveTransfers(data.transfers);
    savePurchaseGoals(data.purchaseGoals);
    saveExpenseLimits(data.expenseLimits);
    saveMonthlyBudgets(data.monthlyBudgets);
    saveRecurringTransactions(data.recurringTransactions);
    saveUserSettings(data.userSettings);
    markHasLocalData();
}

// ─── Load entire app state at once ──────────────────────────
export function loadAllLocalData(): {
    comptes: Compte[];
    incomes: Income[];
    expenses: Expense[];
    transfers: Transfer[];
    purchaseGoals: PurchaseGoal[];
    expenseLimits: ExpenseLimit[];
    monthlyBudgets: MonthlyBudget[];
    recurringTransactions: RecurringTransaction[];
    userSettings: UserSettings | null;
} {
    return {
        comptes: loadComptes(),
        incomes: loadIncomes(),
        expenses: loadExpenses(),
        transfers: loadTransfers(),
        purchaseGoals: loadPurchaseGoals(),
        expenseLimits: loadExpenseLimits(),
        monthlyBudgets: loadMonthlyBudgets(),
        recurringTransactions: loadRecurringTransactions(),
        userSettings: loadUserSettings(),
    };
}
