'use client';

import React, { useState, useEffect } from 'react';
import {
    Scale, Shield, Target, TrendingUp, Gamepad2,
    Bell, Flame, ArrowRight, ChevronLeft, Wallet,
    PlusCircle, BarChart3, Sparkles, Check
} from 'lucide-react';

// ─── Onboarding Data (green theme) ──────────────────────
const slides = [
    {
        id: 'welcome',
        title: 'Bienvenue sur',
        highlight: 'CASHRULER',
        subtitle: 'Votre coach financier intelligent qui vous aide à maîtriser chaque franc.',
        icon: null,
        bgGradient: 'linear-gradient(135deg, #064e3b 0%, #0d9488 50%, #10b981 100%)',
        features: [],
    },
    {
        id: 'comptes',
        title: 'Vos Comptes',
        highlight: 'Intelligents',
        subtitle: '5 comptes prédéfinis pour organiser vos finances automatiquement.',
        icon: Wallet,
        bgGradient: 'linear-gradient(135deg, #022c22 0%, #065f46 50%, #059669 100%)',
        features: [
            { icon: Scale, label: 'Compte Courant', desc: 'Vos dépenses quotidiennes' },
            { icon: Shield, label: 'Compte d\'Urgence', desc: 'Votre filet de sécurité' },
            { icon: TrendingUp, label: 'Investissement', desc: 'Faites fructifier votre argent' },
            { icon: Gamepad2, label: 'Loisirs & Plaisirs', desc: 'Profitez sans culpabiliser' },
            { icon: Target, label: 'Projets Personnels', desc: 'Réalisez vos rêves' },
        ],
    },
    {
        id: 'transactions',
        title: 'Suivi',
        highlight: 'Simplifié',
        subtitle: 'Ajoutez vos revenus et dépenses en quelques secondes.',
        icon: PlusCircle,
        bgGradient: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #0d9488 100%)',
        features: [
            { icon: PlusCircle, label: 'Ajout Rapide', desc: 'Un tap pour ajouter une transaction' },
            { icon: BarChart3, label: 'Catégories', desc: '10 catégories pour tout classifier' },
            { icon: Target, label: 'Objectifs d\'Achat', desc: 'Épargnez pour vos projets' },
        ],
    },
    {
        id: 'coach',
        title: 'Coach',
        highlight: 'Financier',
        subtitle: 'Des notifications intelligentes qui vous gardent sur la bonne voie.',
        icon: Bell,
        bgGradient: 'linear-gradient(135deg, #022c22 0%, #065f46 50%, #10b981 100%)',
        features: [
            { icon: Bell, label: 'Rappels Matin & Soir', desc: 'Commencez et terminez bien chaque journée' },
            { icon: Flame, label: 'Streak de Discipline', desc: 'Enchaînez les jours de maîtrise' },
            { icon: Sparkles, label: 'Célébrations', desc: 'Chaque objectif atteint est fêté' },
        ],
    },
    {
        id: 'ready',
        title: 'Vous êtes',
        highlight: 'Prêt !',
        subtitle: 'Prenez le contrôle de vos finances dès maintenant.',
        icon: null,
        bgGradient: 'linear-gradient(135deg, #064e3b 0%, #0d9488 50%, #10b981 100%)',
        features: [],
    },
];

// ─── Request notification permission ─────────────────────
async function requestNotificationPermission() {
    try {
        // Try Capacitor first
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
    } catch {
        // Fallback to Web API
        if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
            const result = await Notification.requestPermission();
            return result === 'granted';
        }
        return false;
    }
}

// ─── Component ───────────────────────────────────────────
export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [direction, setDirection] = useState<'next' | 'prev'>('next');
    const [isAnimating, setIsAnimating] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const goToSlide = (index: number, dir: 'next' | 'prev') => {
        if (isAnimating) return;
        setIsAnimating(true);
        setDirection(dir);
        setCurrentSlide(index);
        setTimeout(() => setIsAnimating(false), 500);
    };

    const next = () => {
        if (currentSlide < slides.length - 1) {
            goToSlide(currentSlide + 1, 'next');
        } else {
            handleComplete();
        }
    };

    const prev = () => {
        if (currentSlide > 0) {
            goToSlide(currentSlide - 1, 'prev');
        }
    };

    const handleComplete = async () => {
        // Request notification permission
        await requestNotificationPermission();
        localStorage.setItem('cashruler_onboarding_done', 'true');
        onComplete();
    };

    const slide = slides[currentSlide];
    const isLast = currentSlide === slides.length - 1;
    const isFirst = currentSlide === 0;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: '#0a0f0d',
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}>
            {/* Animated gradient background */}
            <div
                key={slide.id}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: slide.bgGradient,
                    opacity: mounted ? 0.35 : 0,
                    transition: 'all 0.8s ease',
                }}
            />

            {/* Floating orbs — green themed */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute', width: '280px', height: '280px', borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)', filter: 'blur(80px)',
                    top: '-80px', right: '-80px',
                    animation: 'ob-float 8s ease-in-out infinite',
                }} />
                <div style={{
                    position: 'absolute', width: '220px', height: '220px', borderRadius: '50%',
                    background: 'rgba(13, 148, 136, 0.12)', filter: 'blur(80px)',
                    bottom: '15%', left: '-60px',
                    animation: 'ob-float 10s ease-in-out infinite reverse',
                }} />
                <div style={{
                    position: 'absolute', width: '180px', height: '180px', borderRadius: '50%',
                    background: 'rgba(5, 150, 105, 0.1)', filter: 'blur(80px)',
                    bottom: '-40px', right: '-40px',
                    animation: 'ob-float 12s ease-in-out infinite 2s',
                }} />
            </div>

            {/* Skip button */}
            {!isLast && (
                <button
                    onClick={handleComplete}
                    style={{
                        position: 'absolute',
                        top: 'calc(env(safe-area-inset-top, 12px) + 8px)',
                        right: '20px',
                        zIndex: 10,
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '14px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px 12px',
                        borderRadius: '8px',
                    }}
                >
                    Passer
                </button>
            )}

            {/* Scrollable content area */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                zIndex: 2,
                overflow: 'hidden',
                paddingTop: 'env(safe-area-inset-top, 12px)',
            }}>
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: slide.features.length <= 3 ? 'center' : 'flex-start',
                    alignItems: 'center',
                    padding: '24px 24px 16px',
                }}>
                    <div
                        key={slide.id + '-content'}
                        className={direction === 'next' ? 'ob-slide-right' : 'ob-slide-left'}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '100%',
                            maxWidth: '380px',
                        }}
                    >
                        {/* Icon / Logo */}
                        {slide.id === 'welcome' ? (
                            <div style={{
                                width: '96px', height: '96px', borderRadius: '28px',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '28px',
                                boxShadow: '0 16px 48px rgba(16, 185, 129, 0.4)',
                                animation: 'ob-pulse 2s ease-in-out infinite',
                            }}>
                                <span style={{ fontSize: '34px', fontWeight: 800, color: 'white', letterSpacing: '-1px' }}>CR</span>
                            </div>
                        ) : slide.id === 'ready' ? (
                            <div style={{
                                width: '96px', height: '96px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '28px',
                                boxShadow: '0 16px 48px rgba(16, 185, 129, 0.4)',
                                animation: 'ob-pulse 2s ease-in-out infinite',
                            }}>
                                <Check size={44} color="white" strokeWidth={3} />
                            </div>
                        ) : slide.icon ? (
                            <div style={{
                                width: '72px', height: '72px', borderRadius: '22px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(16, 185, 129, 0.25)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '28px',
                            }}>
                                <slide.icon size={32} color="#10b981" />
                            </div>
                        ) : null}

                        {/* Title */}
                        <h1 style={{
                            fontSize: '24px', fontWeight: 300,
                            color: 'rgba(255,255,255,0.6)',
                            textAlign: 'center', margin: 0, lineHeight: 1.2,
                        }}>
                            {slide.title}
                        </h1>
                        <h2 style={{
                            fontSize: '32px', fontWeight: 800,
                            background: 'linear-gradient(135deg, #10b981, #6ee7b7)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textAlign: 'center',
                            margin: '4px 0 12px', lineHeight: 1.2,
                        }}>
                            {slide.highlight}
                        </h2>

                        {/* Subtitle */}
                        <p style={{
                            fontSize: '14px', color: 'rgba(255,255,255,0.5)',
                            textAlign: 'center', lineHeight: 1.6,
                            margin: '0 0 24px', maxWidth: '300px',
                        }}>
                            {slide.subtitle}
                        </p>

                        {/* Feature cards */}
                        {slide.features.length > 0 && (
                            <div style={{
                                display: 'flex', flexDirection: 'column',
                                gap: '8px', width: '100%',
                            }}>
                                {slide.features.map((feat, i) => (
                                    <div
                                        key={feat.label}
                                        className="ob-card"
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            padding: '12px 14px', borderRadius: '14px',
                                            background: 'rgba(16, 185, 129, 0.06)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(16, 185, 129, 0.12)',
                                            animationDelay: `${i * 80}ms`,
                                        }}
                                    >
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '10px',
                                            background: 'rgba(16, 185, 129, 0.15)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <feat.icon size={18} color="#10b981" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                                                {feat.label}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
                                                {feat.desc}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom controls — always visible */}
            <div style={{
                padding: '16px 24px',
                position: 'relative',
                zIndex: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                background: 'linear-gradient(to top, rgba(10,15,13,0.95), rgba(10,15,13,0))',
                paddingTop: '32px',
                flexShrink: 0,
            }}>
                {/* Dots */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goToSlide(i, i > currentSlide ? 'next' : 'prev')}
                            style={{
                                width: i === currentSlide ? '24px' : '8px',
                                height: '8px', borderRadius: '4px',
                                background: i === currentSlide ? '#10b981' : 'rgba(255,255,255,0.2)',
                                border: 'none', cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                padding: 0,
                            }}
                        />
                    ))}
                </div>

                {/* Navigation buttons */}
                <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '380px' }}>
                    {!isFirst && (
                        <button
                            onClick={prev}
                            style={{
                                width: '52px', height: '52px', borderRadius: '16px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#10b981', flexShrink: 0,
                            }}
                        >
                            <ChevronLeft size={22} />
                        </button>
                    )}
                    <button
                        onClick={next}
                        style={{
                            flex: 1, height: '52px', borderRadius: '16px',
                            background: isLast
                                ? 'linear-gradient(135deg, #10b981, #059669)'
                                : 'rgba(16, 185, 129, 0.15)',
                            border: isLast ? 'none' : '1px solid rgba(16, 185, 129, 0.25)',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '8px', color: 'white',
                            fontSize: '16px', fontWeight: 600,
                            boxShadow: isLast ? '0 8px 32px rgba(16, 185, 129, 0.3)' : 'none',
                        }}
                    >
                        {isLast ? 'Commencer' : 'Suivant'}
                        <ArrowRight size={18} />
                    </button>
                </div>

                {/* Safe area spacer */}
                <div style={{ height: 'env(safe-area-inset-bottom, 8px)' }} />
            </div>

            {/* CSS */}
            <style>{`
        @keyframes ob-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        .ob-slide-right {
          animation: ob-from-right 0.45s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .ob-slide-left {
          animation: ob-from-left 0.45s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes ob-from-right {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes ob-from-left {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .ob-card {
          animation: ob-card-in 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
        }
        @keyframes ob-card-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ob-float {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(15px, -20px); }
          66% { transform: translate(-10px, 10px); }
        }
      `}</style>
        </div>
    );
}
