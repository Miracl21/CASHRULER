
'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Bell, Trash2, Save, LogOut, Moon, Sun, Download, BellRing, Brain, Clock, Flame, BarChart3, Target, CalendarClock, ChevronDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { exportExpensesCSV, exportIncomesCSV, exportTransfersCSV, exportAllCSV } from '@/lib/cashruler/export-csv';
import { hapticMedium } from '@/lib/cashruler/haptics';

// ─── Collapsible Section Component ───────────────────────
function CollapsibleSection({ title, icon: Icon, iconColor, description, defaultOpen = false, children }: {
  title: string;
  icon: FC<{ className?: string }>;
  iconColor: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="glass-card border-0 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${iconColor} flex items-center justify-center`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground">{title}</span>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className="transition-all duration-300 ease-in-out overflow-hidden"
        style={{
          maxHeight: isOpen ? '1000px' : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>
    </Card>
  );
}

const SettingsPage: FC = () => {
  const { userSettings, updateUserSettings, resetApplicationData, expenses, incomes, transfers, comptes } = useAppContext();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [username, setUsername] = useState(userSettings.username || '');
  const [enableBudgetNotifications, setEnableBudgetNotifications] = useState(userSettings.enableBudgetNotifications);
  const [enableMotivationalMessages, setEnableMotivationalMessages] = useState(userSettings.enableMotivationalMessages);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [pushPermission, setPushPermission] = useState<string>('default');
  // Coach state
  const [enableCoach, setEnableCoach] = useState(userSettings.enableCoachNotifications);
  const [morningTime, setMorningTime] = useState(userSettings.morningNotificationTime || '07:30');
  const [eveningTime, setEveningTime] = useState(userSettings.eveningNotificationTime || '20:00');
  const [enableNudge, setEnableNudge] = useState(userSettings.enableNudgeNotification);
  const [enableWeekly, setEnableWeekly] = useState(userSettings.enableWeeklyReport);
  const [enableAlerts, setEnableAlerts] = useState(userSettings.enableRealTimeAlerts);
  const [enableStreak, setEnableStreak] = useState(userSettings.enableStreakTracking);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setUsername(userSettings.username || '');
    setEnableBudgetNotifications(userSettings.enableBudgetNotifications);
    setEnableMotivationalMessages(userSettings.enableMotivationalMessages);
    setEnableCoach(userSettings.enableCoachNotifications);
    setMorningTime(userSettings.morningNotificationTime || '07:30');
    setEveningTime(userSettings.eveningNotificationTime || '20:00');
    setEnableNudge(userSettings.enableNudgeNotification);
    setEnableWeekly(userSettings.enableWeeklyReport);
    setEnableAlerts(userSettings.enableRealTimeAlerts);
    setEnableStreak(userSettings.enableStreakTracking);
  }, [userSettings]);

  // Check push notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    } else {
      setPushPermission('unsupported');
    }
  }, []);

  const handleSaveSettings = () => {
    updateUserSettings({
      username: username.trim() === '' ? undefined : username.trim(),
      enableBudgetNotifications,
      enableMotivationalMessages,
      enableCoachNotifications: enableCoach,
      morningNotificationTime: morningTime,
      eveningNotificationTime: eveningTime,
      enableNudgeNotification: enableNudge,
      enableWeeklyReport: enableWeekly,
      enableRealTimeAlerts: enableAlerts,
      enableStreakTracking: enableStreak,
    });
    toast({ title: "Paramètres Enregistrés", description: "Vos préférences ont été mises à jour." });
  };

  const handleResetData = () => {
    resetApplicationData();
  };

  const handleExport = async (type: 'expenses' | 'incomes' | 'transfers' | 'all') => {
    setIsExporting(true);
    hapticMedium();
    try {
      switch (type) {
        case 'expenses': await exportExpensesCSV(expenses, comptes); break;
        case 'incomes': await exportIncomesCSV(incomes, comptes); break;
        case 'transfers': await exportTransfersCSV(transfers, comptes); break;
        case 'all': await exportAllCSV(expenses, incomes, transfers, comptes); break;
      }
      toast({ title: 'Export réussi', description: 'Fichier CSV partagé.' });
    } catch (e) {
      console.error('Export error', e);
      toast({ title: 'Erreur d\'export', description: 'Impossible d\'exporter les données.', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="p-4 space-y-3 pb-8">
        <h1 className="text-xl font-bold text-foreground animate-slide-up">Paramètres</h1>

        {/* ── Personalization ── */}
        <CollapsibleSection title="Personnalisation" icon={User} iconColor="bg-primary/10 text-primary" defaultOpen>
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm text-muted-foreground">Nom d&apos;utilisateur</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Entrez votre nom ou pseudo"
              className="bg-muted/50 border-0 focus-visible:ring-primary/30"
            />
          </div>
        </CollapsibleSection>

        {/* ── Apparence ── */}
        <Card className="glass-card border-0">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  {theme === 'dark' ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
                </div>
                <Label htmlFor="dark-mode" className="cursor-pointer">
                  <span className="text-sm font-medium text-foreground">Mode sombre</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Thème adapté aux conditions de faible luminosité</p>
                </Label>
              </div>
              <Switch
                id="dark-mode"
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Notifications ── */}
        <CollapsibleSection title="Notifications" icon={Bell} iconColor="bg-primary/10 text-primary" description="Alertes et messages">
          <div className="space-y-1">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <Label htmlFor="budget-notifications" className="flex-grow cursor-pointer">
                <span className="text-sm font-medium text-foreground">Alertes budget</span>
                <p className="text-xs text-muted-foreground mt-0.5">Seuils de dépenses (50%, 75%, 100%)</p>
              </Label>
              <Switch
                id="budget-notifications"
                checked={enableBudgetNotifications}
                onCheckedChange={setEnableBudgetNotifications}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <Label htmlFor="motivational-messages" className="flex-grow cursor-pointer">
                <span className="text-sm font-medium text-foreground">Messages de motivation</span>
                <p className="text-xs text-muted-foreground mt-0.5">Encouragements pour vos progrès</p>
              </Label>
              <Switch
                id="motivational-messages"
                checked={enableMotivationalMessages}
                onCheckedChange={setEnableMotivationalMessages}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* ── Coach Financier ── */}
        <CollapsibleSection title="Coach Financier" icon={Brain} iconColor="bg-emerald-500/10 text-emerald-600" description="Notifications intelligentes">
          <div className="space-y-2.5">
            {/* Master toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
              <Label className="text-sm font-medium">Activer le coach</Label>
              <Switch checked={enableCoach} onCheckedChange={setEnableCoach} />
            </div>

            {enableCoach && (
              <div className="space-y-2 animate-slide-up">
                {/* Morning time */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">Notification matin</span>
                  </div>
                  <input type="time" value={morningTime} onChange={e => setMorningTime(e.target.value)}
                    className="bg-background border border-border rounded-lg px-2 py-1 text-sm w-24 text-center" />
                </div>

                {/* Evening time */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Bilan du soir</span>
                  </div>
                  <input type="time" value={eveningTime} onChange={e => setEveningTime(e.target.value)}
                    className="bg-background border border-border rounded-lg px-2 py-1 text-sm w-24 text-center" />
                </div>

                {/* Nudge */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Nudge (aucune activité)</span>
                  </div>
                  <Switch checked={enableNudge} onCheckedChange={setEnableNudge} />
                </div>

                {/* Real-time alerts */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Alertes budget (80%/100%)</span>
                  </div>
                  <Switch checked={enableAlerts} onCheckedChange={setEnableAlerts} />
                </div>

                {/* Weekly report */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Rapport hebdomadaire</span>
                  </div>
                  <Switch checked={enableWeekly} onCheckedChange={setEnableWeekly} />
                </div>

                {/* Streak */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">Streak de discipline</span>
                  </div>
                  <Switch checked={enableStreak} onCheckedChange={setEnableStreak} />
                </div>

                {/* Savings reminder info */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/30">
                  <Target className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Rappels épargne + Célébrations automatiques</span>
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* ── Push Notifications ── */}
        {pushPermission !== 'unsupported' && (
          <Card className="glass-card border-0">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <BellRing className="h-4 w-4 text-orange-600" />
                  </div>
                  <Label className="cursor-pointer">
                    <span className="text-sm font-medium text-foreground">Notifications push</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pushPermission === 'granted' ? 'Activées' : pushPermission === 'denied' ? 'Bloquées (modifier dans les paramètres)' : 'Recevez des alertes même hors de l\'app'}
                    </p>
                  </Label>
                </div>
                <button
                  onClick={async () => {
                    if (pushPermission === 'granted') return;
                    const permission = await Notification.requestPermission();
                    setPushPermission(permission);
                    if (permission === 'granted') {
                      toast({ title: 'Notifications activées', description: 'Vous recevrez des alertes budget.' });
                    } else {
                      toast({ title: 'Notifications refusées', description: 'Vous pouvez les activer dans les paramètres.', variant: 'destructive' });
                    }
                  }}
                  disabled={pushPermission === 'granted' || pushPermission === 'denied'}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold press-scale transition-all ${pushPermission === 'granted' ? 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300'
                    : pushPermission === 'denied' ? 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300 opacity-50'
                      : 'bg-primary text-white'
                    }`}
                >
                  {pushPermission === 'granted' ? 'Activé' : pushPermission === 'denied' ? 'Bloqué' : 'Activer'}
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Save Button ── */}
        <button
          onClick={handleSaveSettings}
          className="w-full py-3 rounded-xl gradient-primary text-white font-semibold text-sm shadow-lg press-scale transition-all flex items-center justify-center gap-2"
        >
          <Save className="h-4 w-4" /> Enregistrer les modifications
        </button>

        {/* ── Export ── */}
        <CollapsibleSection title="Exporter les données" icon={Download} iconColor="bg-blue-500/10 text-blue-600" description="Partager au format CSV (Excel)">
          <div className="space-y-1.5">
            <button
              onClick={() => handleExport('expenses')}
              disabled={isExporting}
              className="w-full p-3 rounded-xl bg-muted/30 text-sm text-foreground press-scale transition-colors hover:bg-muted/50 text-left disabled:opacity-50"
            >
              Dépenses ({expenses.length})
            </button>
            <button
              onClick={() => handleExport('incomes')}
              disabled={isExporting}
              className="w-full p-3 rounded-xl bg-muted/30 text-sm text-foreground press-scale transition-colors hover:bg-muted/50 text-left disabled:opacity-50"
            >
              Revenus ({incomes.length})
            </button>
            <button
              onClick={() => handleExport('transfers')}
              disabled={isExporting}
              className="w-full p-3 rounded-xl bg-muted/30 text-sm text-foreground press-scale transition-colors hover:bg-muted/50 text-left disabled:opacity-50"
            >
              Transferts ({transfers.length})
            </button>
            <button
              onClick={() => handleExport('all')}
              disabled={isExporting}
              className="w-full p-3 rounded-xl bg-primary/10 text-sm font-semibold text-primary press-scale transition-colors hover:bg-primary/15 text-left disabled:opacity-50"
            >
              ⚡ Export complet
            </button>
          </div>
        </CollapsibleSection>

        {/* ── Danger Zone ── */}
        <CollapsibleSection title="Zone de danger" icon={Trash2} iconColor="bg-destructive/10 text-destructive" description="Actions irréversibles">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full shadow-sm text-sm press-scale">
                Réinitialiser toutes les données
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-card border-0 animate-scale-in">
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action effacera définitivement toutes vos données CASHRULER.
                  <br /><br />
                  Tapez &quot;<strong>EFFACER</strong>&quot; pour confirmer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder='Tapez "EFFACER" pour confirmer'
                className="mt-2 bg-muted/50 border-0"
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setResetConfirmText('')}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (resetConfirmText === "EFFACER") {
                      handleResetData();
                    } else {
                      toast({ title: "Confirmation incorrecte", description: "La réinitialisation n'a pas été effectuée.", variant: "destructive" });
                    }
                    setResetConfirmText('');
                  }}
                  disabled={resetConfirmText !== "EFFACER"}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Oui, tout effacer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CollapsibleSection>

        {/* ── Logout ── */}
        <button
          onClick={async () => {
            await signOut();
            toast({ title: 'Déconnexion', description: 'Vous avez été déconnecté.' });
          }}
          className="w-full py-3 rounded-xl border-2 border-destructive/30 text-destructive font-semibold text-sm press-scale transition-all flex items-center justify-center gap-2 hover:bg-destructive/5"
        >
          <LogOut className="h-4 w-4" /> Se déconnecter
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
