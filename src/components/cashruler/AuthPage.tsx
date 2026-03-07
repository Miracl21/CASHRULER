'use client';

import type { FC } from 'react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AuthPage: FC = () => {
    const { signIn, signUp } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (isSignUp) {
            if (password !== confirmPassword) {
                toast({
                    title: 'Erreur',
                    description: 'Les mots de passe ne correspondent pas.',
                    variant: 'destructive',
                });
                setIsLoading(false);
                return;
            }
            if (password.length < 6) {
                toast({
                    title: 'Erreur',
                    description: 'Le mot de passe doit contenir au moins 6 caractères.',
                    variant: 'destructive',
                });
                setIsLoading(false);
                return;
            }

            const { error } = await signUp(email, password);
            if (error) {
                toast({
                    title: 'Erreur d\'inscription',
                    description: error.message,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Inscription réussie !',
                    description: 'Vérifiez votre email pour confirmer votre compte, puis connectez-vous.',
                });
                setIsSignUp(false);
                setPassword('');
                setConfirmPassword('');
            }
        } else {
            const { error } = await signIn(email, password);
            if (error) {
                toast({
                    title: 'Erreur de connexion',
                    description: error.message === 'Invalid login credentials'
                        ? 'Email ou mot de passe incorrect.'
                        : error.message,
                    variant: 'destructive',
                });
            }
        }
        setIsLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4" style={{ background: 'linear-gradient(135deg, hsl(158 64% 92%), hsl(173 58% 90%), hsl(200 60% 92%)', backgroundSize: '300% 300%', animation: 'gradient-shift 8s ease infinite' }}>
            <Card className="w-full max-w-md glass-card border-0 animate-scale-in">
                <CardHeader className="text-center space-y-2 pb-2">
                    <div className="mx-auto w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center shadow-lg mb-2">
                        <span className="text-2xl font-bold text-white">CR</span>
                    </div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                        CASHRULER
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        {isSignUp ? 'Créez votre compte pour commencer' : 'Connectez-vous pour gérer vos finances'}
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="votre@email.com"
                                    className="pl-10"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">Mot de passe</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-10"
                                    required
                                    minLength={6}
                                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                                />
                            </div>
                        </div>

                        {isSignUp && (
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmer le mot de passe</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="pl-10"
                                        required
                                        minLength={6}
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="flex flex-col gap-3 pt-2">
                        <Button
                            type="submit"
                            className="w-full gradient-primary hover:opacity-90 text-white shadow-md press-scale transition-all"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : isSignUp ? (
                                <UserPlus className="mr-2 h-4 w-4" />
                            ) : (
                                <LogIn className="mr-2 h-4 w-4" />
                            )}
                            {isSignUp ? 'Créer un compte' : 'Se connecter'}
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setPassword('');
                                setConfirmPassword('');
                            }}
                            className="w-full text-sm text-muted-foreground hover:text-foreground"
                        >
                            {isSignUp
                                ? 'Déjà un compte ? Se connecter'
                                : 'Pas de compte ? S\'inscrire'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default AuthPage;
