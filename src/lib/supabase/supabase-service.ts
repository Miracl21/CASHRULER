import { supabase } from './client';
import type {
    Compte, Income, Expense, Transfer, PurchaseGoal,
    ExpenseLimit, MonthlyBudget, BudgetExpenseAllocation,
    BudgetSavingAllocation, Contribution, UserSettings,
    CompteType, LockType, ExpenseCategory, IncomeType,
} from '@/lib/cashruler/types';

// ─── Helpers ────────────────────────────────────────────────
function genId(): string {
    return crypto.randomUUID();
}

// ─── USER SETTINGS ──────────────────────────────────────────
export async function fetchUserSettings(userId: string): Promise<UserSettings> {
    const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;

    const defaults: UserSettings = {
        enableBudgetNotifications: true,
        enableMotivationalMessages: true,
        enableCoachNotifications: true,
        morningNotificationTime: '07:30',
        eveningNotificationTime: '20:00',
        enableNudgeNotification: true,
        enableWeeklyReport: true,
        enableRealTimeAlerts: true,
        enableStreakTracking: true,
    };

    if (!data) return defaults;

    return {
        ...defaults,
        username: data.username ?? undefined,
        enableBudgetNotifications: data.enable_budget_notifications ?? true,
        enableMotivationalMessages: data.enable_motivational_messages ?? true,
        enableCoachNotifications: data.enable_coach_notifications ?? true,
        morningNotificationTime: data.morning_notification_time ?? '07:30',
        eveningNotificationTime: data.evening_notification_time ?? '20:00',
        enableNudgeNotification: data.enable_nudge_notification ?? true,
        enableWeeklyReport: data.enable_weekly_report ?? true,
        enableRealTimeAlerts: data.enable_real_time_alerts ?? true,
        enableStreakTracking: data.enable_streak_tracking ?? true,
    };
}

export async function upsertUserSettings(userId: string, s: Partial<UserSettings>) {
    const { error } = await supabase.from('user_settings').upsert({
        user_id: userId,
        username: s.username ?? null,
        enable_budget_notifications: s.enableBudgetNotifications,
        enable_motivational_messages: s.enableMotivationalMessages,
        enable_coach_notifications: s.enableCoachNotifications,
        morning_notification_time: s.morningNotificationTime,
        evening_notification_time: s.eveningNotificationTime,
        enable_nudge_notification: s.enableNudgeNotification,
        enable_weekly_report: s.enableWeeklyReport,
        enable_real_time_alerts: s.enableRealTimeAlerts,
        enable_streak_tracking: s.enableStreakTracking,
    }, { onConflict: 'user_id' });
    if (error) throw error;
}

// ─── COMPTES ────────────────────────────────────────────────
export async function fetchComptes(userId: string): Promise<Compte[]> {
    const { data: comptesData, error } = await supabase
        .from('comptes')
        .select('*')
        .eq('user_id', userId);
    if (error) throw error;

    const compteIds = (comptesData || []).map((c: any) => c.id);
    let contributions: any[] = [];
    if (compteIds.length > 0) {
        const { data: contribData, error: contribError } = await supabase
            .from('contributions_to_comptes')
            .select('*')
            .in('compte_id', compteIds);
        if (contribError) throw contribError;
        contributions = contribData || [];
    }

    return (comptesData || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type as CompteType,
        iconName: c.icon_name,
        color: c.color ?? undefined,
        targetAmount: c.target_amount ? Number(c.target_amount) : undefined,
        lockStatus: (c.lock_status || 'none') as LockType,
        isPredefined: c.is_predefined,
        contributions: contributions
            .filter((ct: any) => ct.compte_id === c.id)
            .map((ct: any) => ({
                id: ct.id,
                amount: Number(ct.amount),
                date: ct.date,
                note: ct.note ?? undefined,
            })),
    }));
}

export async function insertCompte(userId: string, c: Omit<Compte, 'contributions'>) {
    const { error } = await supabase.from('comptes').insert({
        id: c.id,
        user_id: userId,
        name: c.name,
        type: c.type,
        icon_name: c.iconName,
        color: c.color ?? null,
        target_amount: c.targetAmount ?? null,
        lock_status: c.lockStatus || 'none',
        is_predefined: c.isPredefined,
    });
    if (error) throw error;
}

export async function updateCompteDb(c: Compte) {
    const { error } = await supabase.from('comptes').update({
        name: c.name,
        type: c.type,
        icon_name: c.iconName,
        color: c.color ?? null,
        target_amount: c.targetAmount ?? null,
        lock_status: c.lockStatus || 'none',
    }).eq('id', c.id);
    if (error) throw error;
}

export async function deleteCompteDb(id: string) {
    const { error } = await supabase.from('comptes').delete().eq('id', id);
    if (error) throw error;
}

export async function insertContributionToCompte(userId: string, compteId: string, contrib: Contribution) {
    const { error } = await supabase.from('contributions_to_comptes').insert({
        id: contrib.id,
        user_id: userId,
        compte_id: compteId,
        amount: contrib.amount,
        date: contrib.date,
        note: contrib.note ?? null,
    });
    if (error) throw error;
}

// ─── INCOMES ────────────────────────────────────────────────
export async function fetchIncomes(userId: string): Promise<Income[]> {
    const { data, error } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        type: i.type as IncomeType,
        amount: Number(i.amount),
        date: i.date,
        note: i.note ?? undefined,
        targetCompteId: i.target_compte_id,
    }));
}

export async function insertIncome(userId: string, inc: Income) {
    const { error } = await supabase.from('incomes').insert({
        id: inc.id,
        user_id: userId,
        name: inc.name,
        type: inc.type,
        amount: inc.amount,
        date: inc.date,
        note: inc.note ?? null,
        target_compte_id: inc.targetCompteId,
    });
    if (error) throw error;
}

export async function updateIncomeDb(inc: Income) {
    const { error } = await supabase.from('incomes').update({
        name: inc.name,
        type: inc.type,
        amount: inc.amount,
        date: inc.date,
        note: inc.note ?? null,
        target_compte_id: inc.targetCompteId,
    }).eq('id', inc.id);
    if (error) throw error;
}

export async function deleteIncomeDb(id: string) {
    const { error } = await supabase.from('incomes').delete().eq('id', id);
    if (error) throw error;
}

// ─── EXPENSES ───────────────────────────────────────────────
export async function fetchExpenses(userId: string): Promise<Expense[]> {
    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map((e: any) => ({
        id: e.id,
        title: e.title,
        amount: Number(e.amount),
        date: e.date,
        note: e.note ?? undefined,
        sourceCompteId: e.source_compte_id,
        category: e.category as ExpenseCategory | undefined,
    }));
}

export async function insertExpense(userId: string, exp: Expense) {
    const { error } = await supabase.from('expenses').insert({
        id: exp.id,
        user_id: userId,
        title: exp.title,
        amount: exp.amount,
        date: exp.date,
        note: exp.note ?? null,
        source_compte_id: exp.sourceCompteId,
        category: exp.category ?? null,
    });
    if (error) throw error;
}

export async function updateExpenseDb(exp: Expense) {
    const { error } = await supabase.from('expenses').update({
        title: exp.title,
        amount: exp.amount,
        date: exp.date,
        note: exp.note ?? null,
        source_compte_id: exp.sourceCompteId,
        category: exp.category ?? null,
    }).eq('id', exp.id);
    if (error) throw error;
}

export async function deleteExpenseDb(id: string) {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
}

// ─── TRANSFERS ──────────────────────────────────────────────
export async function fetchTransfers(userId: string): Promise<Transfer[]> {
    const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map((t: any) => ({
        id: t.id,
        fromCompteId: t.from_compte_id,
        toCompteId: t.to_compte_id,
        amount: Number(t.amount),
        date: t.date,
        note: t.note ?? undefined,
    }));
}

export async function insertTransfer(userId: string, t: Transfer) {
    const { error } = await supabase.from('transfers').insert({
        id: t.id,
        user_id: userId,
        from_compte_id: t.fromCompteId,
        to_compte_id: t.toCompteId,
        amount: t.amount,
        date: t.date,
        note: t.note ?? null,
    });
    if (error) throw error;
}

// ─── PURCHASE GOALS ─────────────────────────────────────────
export async function fetchPurchaseGoals(userId: string): Promise<PurchaseGoal[]> {
    const { data: goalsData, error } = await supabase
        .from('purchase_goals')
        .select('*')
        .eq('user_id', userId);
    if (error) throw error;

    const goalIds = (goalsData || []).map((g: any) => g.id);
    let contributions: any[] = [];
    if (goalIds.length > 0) {
        const { data: contribData, error: contribError } = await supabase
            .from('contributions_to_goals')
            .select('*')
            .in('purchase_goal_id', goalIds);
        if (contribError) throw contribError;
        contributions = contribData || [];
    }

    return (goalsData || []).map((g: any) => ({
        id: g.id,
        title: g.title,
        targetAmount: Number(g.target_amount),
        deadline: g.deadline,
        note: g.note ?? undefined,
        fundingCompteId: g.funding_compte_id,
        isCompletedNotified: g.is_completed_notified,
        contributions: contributions
            .filter((c: any) => c.purchase_goal_id === g.id)
            .map((c: any) => ({
                id: c.id,
                amount: Number(c.amount),
                date: c.date,
                note: c.note ?? undefined,
                sourceCompteId: c.source_compte_id ?? undefined,
            })),
    }));
}

export async function insertPurchaseGoal(userId: string, g: PurchaseGoal) {
    const { error } = await supabase.from('purchase_goals').insert({
        id: g.id,
        user_id: userId,
        title: g.title,
        target_amount: g.targetAmount,
        deadline: g.deadline,
        note: g.note ?? null,
        funding_compte_id: g.fundingCompteId,
        is_completed_notified: g.isCompletedNotified || false,
    });
    if (error) throw error;
}

export async function updatePurchaseGoalDb(g: PurchaseGoal) {
    const { error } = await supabase.from('purchase_goals').update({
        title: g.title,
        target_amount: g.targetAmount,
        deadline: g.deadline,
        note: g.note ?? null,
        funding_compte_id: g.fundingCompteId,
        is_completed_notified: g.isCompletedNotified || false,
    }).eq('id', g.id);
    if (error) throw error;
}

export async function deletePurchaseGoalDb(id: string) {
    const { error } = await supabase.from('purchase_goals').delete().eq('id', id);
    if (error) throw error;
}

export async function insertContributionToGoal(userId: string, goalId: string, contrib: Contribution) {
    const { error } = await supabase.from('contributions_to_goals').insert({
        id: contrib.id,
        user_id: userId,
        purchase_goal_id: goalId,
        amount: contrib.amount,
        date: contrib.date,
        note: contrib.note ?? null,
        source_compte_id: contrib.sourceCompteId ?? null,
    });
    if (error) throw error;
}

// ─── EXPENSE LIMITS ─────────────────────────────────────────
export async function fetchExpenseLimits(userId: string): Promise<ExpenseLimit[]> {
    const { data, error } = await supabase
        .from('expense_limits')
        .select('*')
        .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map((l: any) => ({
        id: l.id,
        category: l.category as ExpenseCategory,
        dailyAmount: Number(l.daily_amount),
    }));
}

export async function insertExpenseLimit(userId: string, l: ExpenseLimit) {
    const { error } = await supabase.from('expense_limits').insert({
        id: l.id,
        user_id: userId,
        category: l.category,
        daily_amount: l.dailyAmount,
    });
    if (error) throw error;
}

export async function updateExpenseLimitDb(l: ExpenseLimit) {
    const { error } = await supabase.from('expense_limits').update({
        category: l.category,
        daily_amount: l.dailyAmount,
    }).eq('id', l.id);
    if (error) throw error;
}

export async function deleteExpenseLimitDb(id: string) {
    const { error } = await supabase.from('expense_limits').delete().eq('id', id);
    if (error) throw error;
}

// ─── MONTHLY BUDGETS ────────────────────────────────────────
export async function fetchMonthlyBudgets(userId: string): Promise<MonthlyBudget[]> {
    const { data: budgetsData, error } = await supabase
        .from('monthly_budgets')
        .select('*')
        .eq('user_id', userId);
    if (error) throw error;

    const budgetIds = (budgetsData || []).map((b: any) => b.id);
    let expAllocations: any[] = [];
    let savAllocations: any[] = [];

    if (budgetIds.length > 0) {
        const { data: eaData, error: eaErr } = await supabase
            .from('budget_expense_allocations')
            .select('*')
            .in('monthly_budget_id', budgetIds);
        if (eaErr) throw eaErr;
        expAllocations = eaData || [];

        const { data: saData, error: saErr } = await supabase
            .from('budget_saving_allocations')
            .select('*')
            .in('monthly_budget_id', budgetIds);
        if (saErr) throw saErr;
        savAllocations = saData || [];
    }

    return (budgetsData || []).map((b: any) => {
        const ea = expAllocations
            .filter((a: any) => a.monthly_budget_id === b.id)
            .map((a: any) => ({
                id: a.id,
                category: a.category as ExpenseCategory,
                allocatedAmount: Number(a.allocated_amount),
                notifiedThreshold: a.notified_threshold ?? 0,
            }));
        const sa = savAllocations
            .filter((a: any) => a.monthly_budget_id === b.id)
            .map((a: any) => ({
                id: a.id,
                targetCompteId: a.target_compte_id,
                allocatedAmount: Number(a.allocated_amount),
            }));
        return {
            id: b.id,
            monthYear: b.month_year,
            referenceIncome: Number(b.reference_income),
            expenseAllocations: ea,
            savingsAllocations: sa,
            targetSavingsAmount: Number(b.target_savings_amount),
        };
    });
}

export async function upsertMonthlyBudget(userId: string, budget: MonthlyBudget) {
    // Upsert the main budget
    const { error: budgetErr } = await supabase.from('monthly_budgets').upsert({
        id: budget.id,
        user_id: userId,
        month_year: budget.monthYear,
        reference_income: budget.referenceIncome,
        target_savings_amount: budget.targetSavingsAmount,
    }, { onConflict: 'id' });
    if (budgetErr) throw budgetErr;

    // Delete old allocations, then re-insert
    await supabase.from('budget_expense_allocations').delete().eq('monthly_budget_id', budget.id);
    await supabase.from('budget_saving_allocations').delete().eq('monthly_budget_id', budget.id);

    if (budget.expenseAllocations.length > 0) {
        const { error: eaErr } = await supabase.from('budget_expense_allocations').insert(
            budget.expenseAllocations.map(ea => ({
                id: ea.id || genId(),
                monthly_budget_id: budget.id,
                user_id: userId,
                category: ea.category,
                allocated_amount: ea.allocatedAmount,
                notified_threshold: ea.notifiedThreshold ?? 0,
            }))
        );
        if (eaErr) throw eaErr;
    }

    if (budget.savingsAllocations.length > 0) {
        const { error: saErr } = await supabase.from('budget_saving_allocations').insert(
            budget.savingsAllocations.map(sa => ({
                id: sa.id || genId(),
                monthly_budget_id: budget.id,
                user_id: userId,
                target_compte_id: sa.targetCompteId,
                allocated_amount: sa.allocatedAmount,
            }))
        );
        if (saErr) throw saErr;
    }
}

// ─── BULK DELETE (reset) ────────────────────────────────────
export async function deleteAllUserData(userId: string) {
    // Order matters — delete children first
    await supabase.from('budget_saving_allocations').delete().eq('user_id', userId);
    await supabase.from('budget_expense_allocations').delete().eq('user_id', userId);
    await supabase.from('monthly_budgets').delete().eq('user_id', userId);
    await supabase.from('contributions_to_goals').delete().eq('user_id', userId);
    await supabase.from('purchase_goals').delete().eq('user_id', userId);
    await supabase.from('expense_limits').delete().eq('user_id', userId);
    await supabase.from('transfers').delete().eq('user_id', userId);
    await supabase.from('expenses').delete().eq('user_id', userId);
    await supabase.from('incomes').delete().eq('user_id', userId);
    await supabase.from('contributions_to_comptes').delete().eq('user_id', userId);
    await supabase.from('comptes').delete().eq('user_id', userId);
    await supabase.from('user_settings').delete().eq('user_id', userId);
}
