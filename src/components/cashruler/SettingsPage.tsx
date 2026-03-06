
'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Bell, Trash2, Save } from 'lucide-react';
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
    // No need to reset local state here as AppContext will trigger a re-render with default state
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-8 bg-background pb-8">
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground"><User className="mr-2 h-5 w-5 text-primary" />Personnalisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username">Nom d'utilisateur (Optionnel)</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Entrez votre nom ou pseudo"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground"><Bell className="mr-2 h-5 w-5 text-primary" />Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-md border">
              <Label htmlFor="budget-notifications" className="flex-grow">
                Activer les notifications de budget
                <p className="text-xs text-muted-foreground">Recevoir des alertes pour les seuils de dépenses (50%, 75%, 100%).</p>
              </Label>
              <Switch
                id="budget-notifications"
                checked={enableBudgetNotifications}
                onCheckedChange={setEnableBudgetNotifications}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-md border">
              <Label htmlFor="motivational-messages" className="flex-grow">
                Activer les messages de motivation
                <p className="text-xs text-muted-foreground">Recevoir des encouragements pour vos progrès.</p>
              </Label>
              <Switch
                id="motivational-messages"
                checked={enableMotivationalMessages}
                onCheckedChange={setEnableMotivationalMessages}
              />
            </div>
          </CardContent>
        </Card>

        <div>
          <Button onClick={handleSaveSettings} className="shadow-sm w-full">
            <Save className="mr-2 h-4 w-4" />Enregistrer
          </Button>
        </div>


        <Card className="shadow-md border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive"><Trash2 className="mr-2 h-5 w-5" />Gestion des Données</CardTitle>
            <CardDescription className="text-destructive/80">Attention, ces actions sont irréversibles.</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full shadow-sm text-sm">
                  Réinitialiser toutes les données
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action ne peut pas être annulée. Cela effacera définitivement toutes vos données CASHRULER (caisses, transactions, budgets, objectifs, etc.).
                    <br /><br />
                    Pour confirmer, veuillez taper "<strong>EFFACER</strong>" dans le champ ci-dessous.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  type="text"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder='Tapez "EFFACER" pour confirmer'
                  className="mt-2"
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
    </ScrollArea>
  );
};

export default SettingsPage;

