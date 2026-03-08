
import { type LucideIcon } from 'lucide-react';
import {
  ShoppingBasket, Car, Home, HeartPulse, Gamepad2, ShoppingBag as ShoppingBagIcon, BookOpen, Briefcase, MoreHorizontal,
  Landmark, Laptop, Gift as GiftIcon, Tag, TrendingUp, Undo2, PiggyBank, LineChart, LayoutDashboard, ListChecks, Target,
  CalendarClock, HandCoins, ShieldCheck, TrendingUp as TrendingUpIcon, Church, Palette, PlusCircle, Settings2, BriefcaseBusiness, Scale, PackageSearch, Lock, Unlock, Ban, Cog
} from 'lucide-react';
import type { ExpenseCategory, IncomeType, AppActiveTab, CompteType, LockType } from './types';

export const EXPENSE_CATEGORIES: { name: ExpenseCategory; icon: LucideIcon, label: string }[] = [
  { name: 'Alimentation', icon: ShoppingBasket, label: 'Alimentation' },
  { name: 'Transport', icon: Car, label: 'Transport' },
  { name: 'Logement', icon: Home, label: 'Logement' },
  { name: 'Santé', icon: HeartPulse, label: 'Santé' },
  { name: 'Loisirs', icon: Gamepad2, label: 'Loisirs' },
  { name: 'Shopping', icon: ShoppingBagIcon, label: 'Shopping' },
  { name: 'Éducation', icon: BookOpen, label: 'Éducation' },
  { name: 'Services', icon: Briefcase, label: 'Services' },
  { name: 'Eau et électricité', icon: Home, label: 'Eau & Électricité' },
  { name: 'Autres dépenses', icon: MoreHorizontal, label: 'Autres dépenses' },
];

export const INCOME_TYPES: { name: IncomeType; icon: LucideIcon, label: string }[] = [
  { name: 'Salaire', icon: Landmark, label: 'Salaire' },
  { name: 'Freelance', icon: Laptop, label: 'Freelance' },
  { name: 'Don/Cadeau', icon: GiftIcon, label: 'Don/Cadeau' },
  { name: 'Vente', icon: Tag, label: 'Vente' },
  { name: 'Intérêts/Dividendes', icon: TrendingUp, label: 'Intérêts/Dividendes' },
  { name: 'Remboursement', icon: Undo2, label: 'Remboursement' },
  { name: 'Autres revenus', icon: MoreHorizontal, label: 'Autres revenus' },
];

// --- Compte Constants ---
export const PREDEFINED_COMPTE_COURANT_ID = 'compte_courant';
export const PREDEFINED_COMPTE_LOISIRS_ID = 'compte_loisirs';
export const PREDEFINED_COMPTE_URGENCE_ID = 'compte_urgence';
export const PREDEFINED_COMPTE_INVESTISSEMENT_ID = 'compte_investissement';
export const PREDEFINED_COMPTE_PROJETS_ID = 'compte_projets';

export const COMPTE_TYPE_DETAILS: Record<CompteType, { label: string; icon: LucideIcon; defaultColor?: string, isPredefined?: boolean, id?: string, canHavePurchaseGoals?: boolean, defaultLockStatus?: LockType }> = {
  COURANT: { label: 'Compte Courant', icon: Scale, defaultColor: '#3B82F6', isPredefined: true, id: PREDEFINED_COMPTE_COURANT_ID, canHavePurchaseGoals: true, defaultLockStatus: 'none' },
  LOISIRS: { label: 'Loisirs & Plaisirs', icon: Gamepad2, defaultColor: '#10B981', isPredefined: true, id: PREDEFINED_COMPTE_LOISIRS_ID, canHavePurchaseGoals: true, defaultLockStatus: 'none' },
  URGENCE: { label: 'Compte d\'Urgence', icon: ShieldCheck, defaultColor: '#EF4444', isPredefined: true, id: PREDEFINED_COMPTE_URGENCE_ID, canHavePurchaseGoals: true, defaultLockStatus: 'outgoing_only' },
  INVESTISSEMENT: { label: 'Compte d\'Investissement', icon: TrendingUpIcon, defaultColor: '#F59E0B', isPredefined: true, id: PREDEFINED_COMPTE_INVESTISSEMENT_ID, canHavePurchaseGoals: true, defaultLockStatus: 'none' },
  PROJETS: { label: 'Projets Personnels', icon: Target, defaultColor: '#8B5CF6', isPredefined: true, id: PREDEFINED_COMPTE_PROJETS_ID, canHavePurchaseGoals: true, defaultLockStatus: 'none' },
  CUSTOM_EPARGNE: { label: 'Épargne Personnalisée', icon: PiggyBank, defaultColor: '#6366F1', canHavePurchaseGoals: true, defaultLockStatus: 'none' },
  CUSTOM_PROJET: { label: 'Projet Personnalisé', icon: BriefcaseBusiness, defaultColor: '#EC4899', canHavePurchaseGoals: true, defaultLockStatus: 'none' },
  CUSTOM_AUTRE: { label: 'Autre Compte Personnalisé', icon: Palette, defaultColor: '#84CC16', canHavePurchaseGoals: true, defaultLockStatus: 'none' },
};
// --- End Compte Constants ---

export const LOCK_STATUS_OPTIONS: { value: LockType; label: string; icon?: LucideIcon }[] = [
  { value: 'none', label: 'Aucun verrouillage', icon: Unlock },
  { value: 'outgoing_only', label: 'Sorties d\'argent bloquées', icon: Ban },
  { value: 'full', label: 'Verrouillage complet (entrées/sorties bloquées)', icon: Lock },
];


export const NAVIGATION_TABS: { id: AppActiveTab; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ListChecks },
  { id: 'budget', label: 'Budget', icon: CalendarClock },
  { id: 'comptes', label: 'Comptes', icon: PiggyBank },
  { id: 'statistics', label: 'Statistiques', icon: LineChart },
  { id: 'settings', label: 'Paramètres', icon: Cog },
];

export const CURRENCY_SYMBOL = 'XOF'; // Franc CFA

export const AVAILABLE_COMPTE_ICONS: { name: string, icon: LucideIcon }[] = [
  { name: "PiggyBank", icon: PiggyBank },
  { name: "Landmark", icon: Landmark },
  { name: "Briefcase", icon: Briefcase },
  { name: "GiftIcon", icon: GiftIcon },
  { name: "Home", icon: Home },
  { name: "Car", icon: Car },
  { name: "GraduationCap", icon: BookOpen },
  { name: "HeartPulse", icon: HeartPulse },
  { name: "ShieldCheck", icon: ShieldCheck },
  { name: "TrendingUpIcon", icon: TrendingUpIcon },
  { name: "Church", icon: Church },
  { name: "Palette", icon: Palette },
  { name: "PackageSearch", icon: PackageSearch },
  { name: "Settings2", icon: Settings2 },
  { name: "Scale", icon: Scale },
  { name: "HandCoins", icon: HandCoins },
  { name: "Cog", icon: Cog },
];

export const DEFAULT_CUSTOM_COMPTE_ICON = "PiggyBank";
export const DEFAULT_CUSTOM_COMPTE_COLOR = "#A855F7"; // A generic purple
