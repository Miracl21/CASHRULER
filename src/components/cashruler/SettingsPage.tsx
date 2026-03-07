
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
import { User, Bell, Trash2, Save, LogOut, Moon, Sun, Download, BellRing, Brain, Clock, Flame, BarChart3, Target, CalendarClock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { exportExpensesCSV, exportIncomesCSV, exportTransfersCSV, exportAllCSV } from '@/lib/cashruler/export-csv';
import { hapticMedium } from '@/lib/cashruler/haptics';

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

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="p-4 space-y-5 pb-8">
        <h1 className="text-xl font-bold text-foreground animate-slide-up">Paramètres</h1>

        {/* ── Personalization ── */}
        <Card className="glass-card border-0 animate-slide-up" style={{ animationDelay: '0.05s', animationFillMode: 'both' }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base font-semibold text-foreground">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                <User className="h-4 w-4 text-primary" />
              </div>
              Personnalisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm text-muted-foreground">Nom d'utilisateur</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Entrez votre nom ou pseudo"
                className="bg-muted/50 border-0 focus-visible:ring-primary/30"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Apparence ── */}
        <Card className="glass-card border-0 animate-slide-up" style={{ animationDelay: '0.07s', animationFillMode: 'both' }}>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 transition-colors hover:bg-muted/50">
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
        <Card className="glass-card border-0 animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base font-semibold text-foreground">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 transition-colors hover:bg-muted/50">
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
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 transition-colors hover:bg-muted/50">
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
          </CardContent>
        </Card>

        {/* ── Save Button ── */}
        <div className="animate-slide-up" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
          <button
            onClick={handleSaveSettings}
            className="w-full py-3 rounded-xl gradient-primary text-white font-semibold text-sm shadow-lg press-scale transition-all flex items-center justify-center gap-2"
          >
            <Save className="h-4 w-4" /> Enregistrer les modifications
          </button>
        </div>

        {/* ── Danger Zone ── */}
        <Card className="glass-card border-0 border-l-4 !border-l-destructive animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base font-semibold text-destructive">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center mr-3">
                <Trash2 className="h-4 w-4 text-destructive" />
              </div>
              Zone de danger
            </CardTitle>
            <CardDescription className="text-destructive/70 text-xs">Actions irréversibles</CardDescription>
          </CardHeader>
          <CardContent>
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
                    Tapez "<strong>EFFACER</strong>" pour confirmer.
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
          </CardContent>
        </Card>

        {/* ── Export ── */}
        <Card className="glass-card border-0 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base font-semibold text-foreground">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mr-3">
                <Download className="h-4 w-4 text-blue-600" />
              </div>
              Exporter les données
            </CardTitle>
            <CardDescription className="text-xs">Télécharger au format CSV (compatible Excel)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <button onClick={() => { hapticMedium(); exportExpensesCSV(expenses, comptes); toast({ title: 'Export réussi', description: 'Dépenses exportées.' }); }}
              className="w-full p-3 rounded-xl bg-muted/30 text-sm text-foreground press-scale transition-colors hover:bg-muted/50 text-left">Dépenses ({expenses.length})</button>
            <button onClick={() => { hapticMedium(); exportIncomesCSV(incomes, comptes); toast({ title: 'Export réussi', description: 'Revenus exportés.' }); }}
              className="w-full p-3 rounded-xl bg-muted/30 text-sm text-foreground press-scale transition-colors hover:bg-muted/50 text-left">Revenus ({incomes.length})</button>
            <button onClick={() => { hapticMedium(); exportTransfersCSV(transfers, comptes); toast({ title: 'Export réussi', description: 'Transferts exportés.' }); }}
              className="w-full p-3 rounded-xl bg-muted/30 text-sm text-foreground press-scale transition-colors hover:bg-muted/50 text-left">Transferts ({transfers.length})</button>
            <button onClick={() => { hapticMedium(); exportAllCSV(expenses, incomes, transfers, comptes); toast({ title: 'Export réussi', description: 'Toutes les données exportées.' }); }}
              className="w-full p-3 rounded-xl bg-primary/10 text-sm font-semibold text-primary press-scale transition-colors hover:bg-primary/15 text-left">⚡ Export complet</button>
          </CardContent>
        </Card>

        {/* ── Push Notifications ── */}
        {pushPermission !== 'unsupported' && (
          <Card className="glass-card border-0 animate-slide-up" style={{ animationDelay: '0.22s', animationFillMode: 'both' }}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 transition-colors hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <BellRing className="h-4 w-4 text-orange-600" />
                  </div>
                  <Label className="cursor-pointer">
                    <span className="text-sm font-medium text-foreground">Notifications push</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pushPermission === 'granted' ? 'Activées' : pushPermission === 'denied' ? 'Bloquées (modifier dans les paramètres du navigateur)' : 'Recevez des alertes même hors de l\'app'}
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
                      new Notification('CASHRULER', { body: 'Les notifications sont activées ! 👍', icon: '/icons/icon-192.png' });
                    } else {
                      toast({ title: 'Notifications refusées', description: 'Vous pouvez les activer dans les paramètres du navigateur.', variant: 'destructive' });
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
        {/* ── Coach Financier ── */}
        <Card className="glass-card border-0 animate-slide-up" style={{ animationDelay: '0.25s', animationFillMode: 'both' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Brain className="h-5 w-5 text-indigo-600" /> Coach Financier</CardTitle>
            <CardDescription className="text-xs">Notifications intelligentes pour votre discipline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Master toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center"><Bell className="h-4 w-4 text-indigo-600" /></div>
                <Label className="text-sm font-medium">Activer le coach</Label>
              </div>
              <Switch checked={enableCoach} onCheckedChange={setEnableCoach} />
            </div>

            {enableCoach && (
              <div className="space-y-2.5 animate-slide-up">
                {/* Morning time */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">🌅 Notification matin</span>
                  </div>
                  <input type="time" value={morningTime} onChange={e => setMorningTime(e.target.value)}
                    className="bg-background border border-border rounded-lg px-2 py-1 text-sm w-24 text-center" />
                </div>

                {/* Evening time */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">🌙 Bilan du soir</span>
                  </div>
                  <input type="time" value={eveningTime} onChange={e => setEveningTime(e.target.value)}
                    className="bg-background border border-border rounded-lg px-2 py-1 text-sm w-24 text-center" />
                </div>

                {/* Nudge */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">🔔 Nudge (aucune activité)</span>
                  </div>
                  <Switch checked={enableNudge} onCheckedChange={setEnableNudge} />
                </div>

                {/* Real-time alerts */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-red-500" />
                    <span className="text-sm">⚠️ Alertes budget (80%/100%)</span>
                  </div>
                  <Switch checked={enableAlerts} onCheckedChange={setEnableAlerts} />
                </div>

                {/* Weekly report */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">📊 Rapport hebdomadaire</span>
                  </div>
                  <Switch checked={enableWeekly} onCheckedChange={setEnableWeekly} />
                </div>

                {/* Streak */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">🔥 Streak de discipline</span>
                  </div>
                  <Switch checked={enableStreak} onCheckedChange={setEnableStreak} />
                </div>

                {/* Savings reminder info */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/30">
                  <Target className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">🎯 Rappels épargne + 🏆 Célébrations automatiques</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Logout ── */}
        <div className="animate-slide-up" style={{ animationDelay: '0.25s', animationFillMode: 'both' }}>
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
    </div>
  );
};

export default SettingsPage;
