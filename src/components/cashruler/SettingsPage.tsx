
'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Bell, Trash2, Save, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const SettingsPage: FC = () => {
  const { userSettings, updateUserSettings, resetApplicationData } = useAppContext();
  const [username, setUsername] = useState(userSettings.username || '');
  const [enableBudgetNotifications, setEnableBudgetNotifications] = useState(userSettings.enableBudgetNotifications);
  const [enableMotivationalMessages, setEnableMotivationalMessages] = useState(userSettings.enableMotivationalMessages);
  const [resetConfirmText, setResetConfirmText] = useState('');

  useEffect(() => {
    setUsername(userSettings.username || '');
    setEnableBudgetNotifications(userSettings.enableBudgetNotifications);
    setEnableMotivationalMessages(userSettings.enableMotivationalMessages);
  }, [userSettings]);

  const handleSaveSettings = () => {
    updateUserSettings({
      username: username.trim() === '' ? undefined : username.trim(),
      enableBudgetNotifications,
      enableMotivationalMessages,
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
      </div>
    </div>
  );
};

export default SettingsPage;
