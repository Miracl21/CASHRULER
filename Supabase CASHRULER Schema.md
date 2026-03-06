-- ### Supabase CASHRULER Schema ###

-- Utilisation de TEXT pour les IDs car l'application actuelle génère des IDs sous forme de chaînes.
-- Vous pourriez envisager d'utiliser UUID pour les nouvelles entités si vous préférez.

-- Désactiver Row Level Security (RLS) pour les tables (pour un accès facile pendant le développement)
-- Il est FORTEMENT RECOMMANDÉ d'activer RLS et de définir des politiques de sécurité
-- pour la production.

-- Fonction pour mettre à jour automatiquement le champ updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Table: user_settings (Pourrait être liée à l'authentification Supabase plus tard)
-- Pour l'instant, on suppose un seul enregistrement ou une gestion simplifiée.
CREATE TABLE public.user_settings (
  id SERIAL PRIMARY KEY,
  username TEXT,
  enable_budget_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  enable_motivational_messages BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
-- Vous insérerez une seule ligne ici pour les paramètres globaux de l'app
-- INSERT INTO public.user_settings (username) VALUES (NULL);


-- Table: comptes
CREATE TABLE public.comptes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- Ex: 'COURANT', 'DON', 'CUSTOM_EPARGNE'
  icon_name TEXT NOT NULL,
  color TEXT,
  target_amount NUMERIC(15, 2),
  lock_status TEXT NOT NULL DEFAULT 'none', -- 'none', 'outgoing_only', 'full'
  is_predefined BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE public.comptes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_comptes_updated_at
BEFORE UPDATE ON public.comptes
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- Table: contributions_to_comptes (Contributions directes à un compte, pas aux objectifs)
-- Cette table est basée sur Compte.contributions qui existait dans les types,
-- mais n'était pas directement utilisée par une fonction d'ajout dédiée autre que Transferts/Revenus.
-- Si les revenus et transferts couvrent ce besoin, cette table pourrait être optionnelle.
-- Pour l'instant, je la garde pour être fidèle aux types.
CREATE TABLE public.contributions_to_comptes (
  id TEXT PRIMARY KEY,
  compte_id TEXT NOT NULL REFERENCES public.comptes(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  note TEXT,
  -- source_compte_id TEXT REFERENCES public.comptes(id) ON DELETE SET NULL, -- Si une contribution vient d'un autre compte (similaire à un transfert)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE public.contributions_to_comptes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_contributions_to_comptes_updated_at
BEFORE UPDATE ON public.contributions_to_comptes
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- Table: incomes
CREATE TABLE public.incomes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- Ex: 'Salaire', 'Freelance'
  amount NUMERIC(15, 2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  note TEXT,
  target_compte_id TEXT NOT NULL REFERENCES public.comptes(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_incomes_updated_at
BEFORE UPDATE ON public.incomes
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- Table: expenses
CREATE TABLE public.expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  note TEXT,
  source_compte_id TEXT NOT NULL REFERENCES public.comptes(id) ON DELETE RESTRICT,
  category TEXT, -- Ex: 'Alimentation', 'Transport'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- Table: purchase_goals
CREATE TABLE public.purchase_goals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  target_amount NUMERIC(15, 2) NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  note TEXT,
  funding_compte_id TEXT NOT NULL REFERENCES public.comptes(id) ON DELETE CASCADE,
  is_completed_notified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE public.purchase_goals ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_purchase_goals_updated_at
BEFORE UPDATE ON public.purchase_goals
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- Table: contributions_to_goals
CREATE TABLE public.contributions_to_goals (
  id TEXT PRIMARY KEY,
  purchase_goal_id TEXT NOT NULL REFERENCES public.purchase_goals(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  note TEXT,
  source_compte_id TEXT NOT NULL REFERENCES public.comptes(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE public.contributions_to_goals ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_contributions_to_goals_updated_at
BEFORE UPDATE ON public.contributions_to_goals
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- Table: expense_limits (Limites de dépenses quotidiennes par catégorie pour le compte courant)
CREATE TABLE public.expense_limits (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL UNIQUE, -- Une seule limite par catégorie
  daily_amount NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE public.expense_limits ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_expense_limits_updated_at
BEFORE UPDATE ON public.expense_limits
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- Table: monthly_budgets
CREATE TABLE public.monthly_budgets (
  id TEXT PRIMARY KEY, -- Format: 'YYYY-MM'
  month_year TEXT NOT NULL UNIQUE, -- Format: 'YYYY-MM', should be same as id
  reference_income NUMERIC(15, 2) NOT NULL,
  target_savings_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE public.monthly_budgets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_monthly_budgets_updated_at
BEFORE UPDATE ON public.monthly_budgets
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- Table: budget_expense_allocations
CREATE TABLE public.budget_expense_allocations (
  id TEXT PRIMARY KEY,
  monthly_budget_id TEXT NOT NULL REFERENCES public.monthly_budgets(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- Ex: 'Alimentation'
  allocated_amount NUMERIC(15, 2) NOT NULL,
  notified_threshold INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (monthly_budget_id, category)
);
ALTER TABLE public.budget_expense_allocations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_budget_expense_allocations_updated_at
BEFORE UPDATE ON public.budget_expense_allocations
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- Table: budget_saving_allocations
CREATE TABLE public.budget_saving_allocations (
  id TEXT PRIMARY KEY,
  monthly_budget_id TEXT NOT NULL REFERENCES public.monthly_budgets(id) ON DELETE CASCADE,
  target_compte_id TEXT NOT NULL REFERENCES public.comptes(id) ON DELETE CASCADE,
  allocated_amount NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (monthly_budget_id, target_compte_id)
);
ALTER TABLE public.budget_saving_allocations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_budget_saving_allocations_updated_at
BEFORE UPDATE ON public.budget_saving_allocations
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- Table: transfers
CREATE TABLE public.transfers (
  id TEXT PRIMARY KEY,
  from_compte_id TEXT NOT NULL REFERENCES public.comptes(id) ON DELETE RESTRICT,
  to_compte_id TEXT NOT NULL REFERENCES public.comptes(id) ON DELETE RESTRICT,
  amount NUMERIC(15, 2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT check_different_comptes CHECK (from_compte_id <> to_compte_id)
);
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_transfers_updated_at
BEFORE UPDATE ON public.transfers
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- Insérer les comptes prédéfinis initiaux si nécessaire (ou gérer via l'application)
-- Exemple (ajustez les IDs, noms, types, etc., selon vos constantes PREDEFINED_...)
-- INSERT INTO public.comptes (id, name, type, icon_name, color, is_predefined, lock_status) VALUES
--   ('compte_courant', 'Compte Courant', 'COURANT', 'Scale', '#3B82F6', TRUE, 'none'),
--   ('compte_don', 'Compte de Dons', 'DON', 'HandCoins', '#10B981', TRUE, 'none'),
--   ('compte_urgence', 'Compte d''Urgence', 'URGENCE', 'ShieldCheck', '#EF4444', TRUE, 'outgoing_only'),
--   ('compte_investissement', 'Compte d''Investissement', 'INVESTISSEMENT', 'TrendingUpIcon', '#F59E0B', TRUE, 'none'),
--   ('compte_oeuvres_royaume', 'Avancement Œuvres Royaume', 'OEUVRES_ROYAUME', 'Church', '#8B5CF6', TRUE, 'none')
-- ON CONFLICT (id) DO NOTHING; -- Pour éviter les erreurs si le script est exécuté plusieurs fois

-- N'oubliez pas d'ajouter des politiques RLS pour la sécurité en production !
-- Exemple pour autoriser la lecture à tous les utilisateurs authentifiés (si vous utilisez l'auth Supabase)
-- CREATE POLICY "Allow authenticated read access" ON public.comptes FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Allow individual insert access" ON public.comptes FOR INSERT WITH CHECK (auth.uid() = user_id_column); -- si vous avez une colonne user_id