-- ============================================================
-- MIGRATION: Ajouter user_id à toutes les tables CASHRULER
-- Exécuter dans Supabase > SQL Editor
-- ============================================================

-- 1. Ajouter la colonne user_id à chaque table
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.comptes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.contributions_to_comptes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.incomes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.transfers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.purchase_goals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.contributions_to_goals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.expense_limits ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.monthly_budgets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.budget_expense_allocations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.budget_saving_allocations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Ajouter une contrainte UNIQUE sur user_id pour user_settings (un seul enregistrement par utilisateur)
ALTER TABLE public.user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_unique;
ALTER TABLE public.user_settings ADD CONSTRAINT user_settings_user_id_unique UNIQUE (user_id);

-- 3. Mettre à jour les politiques RLS pour utiliser user_id
-- D'abord supprimer les anciennes politiques s'il y en a
DO $$
DECLARE
    t TEXT;
    tables TEXT[] := ARRAY[
        'user_settings', 'comptes', 'contributions_to_comptes',
        'incomes', 'expenses', 'transfers',
        'purchase_goals', 'contributions_to_goals',
        'expense_limits', 'monthly_budgets',
        'budget_expense_allocations', 'budget_saving_allocations'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        -- Drop all existing policies on the table
        FOR t IN
            SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public'
        LOOP
            -- Skip, we'll create fresh ones below
        END LOOP;
    END LOOP;
END $$;

-- Créer les politiques RLS pour chaque table
-- Pattern: l'utilisateur ne peut voir/modifier que SES propres données

-- user_settings
DROP POLICY IF EXISTS "users_crud_own_settings" ON public.user_settings;
CREATE POLICY "users_crud_own_settings" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- comptes
DROP POLICY IF EXISTS "users_crud_own_comptes" ON public.comptes;
CREATE POLICY "users_crud_own_comptes" ON public.comptes
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- contributions_to_comptes
DROP POLICY IF EXISTS "users_crud_own_contrib_comptes" ON public.contributions_to_comptes;
CREATE POLICY "users_crud_own_contrib_comptes" ON public.contributions_to_comptes
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- incomes
DROP POLICY IF EXISTS "users_crud_own_incomes" ON public.incomes;
CREATE POLICY "users_crud_own_incomes" ON public.incomes
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- expenses
DROP POLICY IF EXISTS "users_crud_own_expenses" ON public.expenses;
CREATE POLICY "users_crud_own_expenses" ON public.expenses
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- transfers
DROP POLICY IF EXISTS "users_crud_own_transfers" ON public.transfers;
CREATE POLICY "users_crud_own_transfers" ON public.transfers
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- purchase_goals
DROP POLICY IF EXISTS "users_crud_own_goals" ON public.purchase_goals;
CREATE POLICY "users_crud_own_goals" ON public.purchase_goals
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- contributions_to_goals
DROP POLICY IF EXISTS "users_crud_own_contrib_goals" ON public.contributions_to_goals;
CREATE POLICY "users_crud_own_contrib_goals" ON public.contributions_to_goals
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- expense_limits
DROP POLICY IF EXISTS "users_crud_own_limits" ON public.expense_limits;
CREATE POLICY "users_crud_own_limits" ON public.expense_limits
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- monthly_budgets
DROP POLICY IF EXISTS "users_crud_own_budgets" ON public.monthly_budgets;
CREATE POLICY "users_crud_own_budgets" ON public.monthly_budgets
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- budget_expense_allocations
DROP POLICY IF EXISTS "users_crud_own_budget_exp_alloc" ON public.budget_expense_allocations;
CREATE POLICY "users_crud_own_budget_exp_alloc" ON public.budget_expense_allocations
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- budget_saving_allocations
DROP POLICY IF EXISTS "users_crud_own_budget_sav_alloc" ON public.budget_saving_allocations;
CREATE POLICY "users_crud_own_budget_sav_alloc" ON public.budget_saving_allocations
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Supprimer la contrainte UNIQUE category sur expense_limits (chaque user peut avoir la même catégorie)
ALTER TABLE public.expense_limits DROP CONSTRAINT IF EXISTS expense_limits_category_key;
ALTER TABLE public.expense_limits ADD CONSTRAINT expense_limits_user_category_unique UNIQUE (user_id, category);

-- 5. Supprimer la contrainte UNIQUE month_year sur monthly_budgets (chaque user a son propre budget)
ALTER TABLE public.monthly_budgets DROP CONSTRAINT IF EXISTS monthly_budgets_month_year_key;
ALTER TABLE public.monthly_budgets ADD CONSTRAINT monthly_budgets_user_month_unique UNIQUE (user_id, month_year);

-- ============================================================
-- TERMINÉ ! Vos tables sont maintenant multi-utilisateurs.
-- ============================================================
