'use client';

import React, { useState, useEffect } from 'react';
import {
    Scale, Shield, Target, TrendingUp, Gamepad2,
    Bell, Flame, ArrowRight, ChevronLeft, Wallet,
    PlusCircle, BarChart3, Sparkles, Check
} from 'lucide-react';

// ─── Onboarding Data ─────────────────────────────────────
const slides = [
    {
        id: 'welcome',
        title: 'Bienvenue sur',
        highlight: 'CASHRULER',
        subtitle: 'Votre coach financier intelligent qui vous aide à maîtriser chaque franc.',
        icon: null, // Special logo treatment
        gradient: 'from-emerald-500 via-green-500 to-teal-600',
        features: [],
    },
    {
        id: 'comptes',
        title: 'Vos Comptes',
        highlight: 'Intelligents',
        subtitle: '5 comptes prédéfinis pour organiser vos finances automatiquement.',
        icon: Wallet,
        gradient: 'from-blue-500 via-indigo-500 to-purple-600',
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
        subtitle: 'Ajoutez vos revenus et dépenses en quelques secondes. Catégorisez automatiquement.',
        icon: PlusCircle,
        gradient: 'from-orange-500 via-amber-500 to-yellow-500',
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
        subtitle: 'Des notifications intelligentes qui vous gardent sur la bonne voie. Même hors ligne.',
        icon: Bell,
        gradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
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
        gradient: 'from-emerald-500 via-green-500 to-teal-600',
        features: [],
    },
];

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

    const handleComplete = () => {
        localStorage.setItem('cashruler_onboarding_done', 'true');
        onComplete();
    };

    const slide = slides[currentSlide];
    const isLast = currentSlide === slides.length - 1;
    const isFirst = currentSlide === 0;

    return (
        <div
            className="onboarding-container"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                background: '#0a0a0f',
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
            }}
        >
            {/* Animated gradient background */}
            <div
                key={slide.id}
                style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: mounted ? 0.3 : 0,
                    transition: 'opacity 0.8s ease',
                }}
            >
                <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`}
                    style={{ filter: 'blur(80px)', transform: 'scale(1.5)' }} />
            </div>

            {/* Floating orbs */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div className="onboarding-orb onboarding-orb-1" />
                <div className="onboarding-orb onboarding-orb-2" />
                <div className="onboarding-orb onboarding-orb-3" />
            </div>

            {/* Skip button */}
            {!isLast && (
                <button
                    onClick={handleComplete}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '20px',
                        zIndex: 10,
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '14px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        transition: 'all 0.3s',
                    }}
                    onPointerEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
                    onPointerLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                >
                    Passer
                </button>
            )}

            {/* Content */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '24px',
                position: 'relative',
                zIndex: 2,
            }}>
                <div
                    key={slide.id + '-content'}
                    className={`onboarding-slide ${direction === 'next' ? 'onboarding-slide-enter-right' : 'onboarding-slide-enter-left'}`}
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
                            width: '100px',
                            height: '100px',
                            borderRadius: '28px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '32px',
                            boxShadow: '0 20px 60px rgba(16, 185, 129, 0.4)',
                            animation: 'onboarding-logo-pulse 2s ease-in-out infinite',
                        }}>
                            <span style={{ fontSize: '36px', fontWeight: 800, color: 'white', letterSpacing: '-1px' }}>CR</span>
                        </div>
                    ) : slide.id === 'ready' ? (
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '32px',
                            boxShadow: '0 20px 60px rgba(16, 185, 129, 0.4)',
                            animation: 'onboarding-logo-pulse 2s ease-in-out infinite',
                        }}>
                            <Check size={48} color="white" strokeWidth={3} />
                        </div>
                    ) : slide.icon ? (
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '24px',
                            background: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '32px',
                        }}>
                            <slide.icon size={36} color="white" />
                        </div>
                    ) : null}

                    {/* Title */}
                    <h1 style={{
                        fontSize: '28px',
                        fontWeight: 300,
                        color: 'rgba(255,255,255,0.7)',
                        textAlign: 'center',
                        margin: 0,
                        lineHeight: 1.2,
                    }}>
                        {slide.title}
                    </h1>
                    <h2 style={{
                        fontSize: '36px',
                        fontWeight: 800,
                        background: `linear-gradient(135deg, #fff, rgba(255,255,255,0.8))`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textAlign: 'center',
                        margin: '4px 0 16px',
                        lineHeight: 1.2,
                    }}>
                        {slide.highlight}
                    </h2>

                    {/* Subtitle */}
                    <p style={{
                        fontSize: '15px',
                        color: 'rgba(255,255,255,0.55)',
                        textAlign: 'center',
                        lineHeight: 1.6,
                        margin: '0 0 32px',
                        maxWidth: '320px',
                    }}>
                        {slide.subtitle}
                    </p>

                    {/* Feature cards */}
                    {slide.features.length > 0 && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            width: '100%',
                        }}>
                            {slide.features.map((feat, i) => (
                                <div
                                    key={feat.label}
                                    className="onboarding-feature-card"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        padding: '14px 16px',
                                        borderRadius: '16px',
                                        background: 'rgba(255,255,255,0.06)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        animationDelay: `${i * 100}ms`,
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        background: 'rgba(255,255,255,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <feat.icon size={20} color="rgba(255,255,255,0.8)" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                                            {feat.label}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                            {feat.desc}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom controls */}
            <div style={{
                padding: '24px',
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
            }}>
                {/* Dots */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goToSlide(i, i > currentSlide ? 'next' : 'prev')}
                            style={{
                                width: i === currentSlide ? '24px' : '8px',
                                height: '8px',
                                borderRadius: '4px',
                                background: i === currentSlide ? '#10b981' : 'rgba(255,255,255,0.2)',
                                border: 'none',
                                cursor: 'pointer',
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
                                width: '52px',
                                height: '52px',
                                borderRadius: '16px',
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'rgba(255,255,255,0.7)',
                                transition: 'all 0.3s',
                                flexShrink: 0,
                            }}
                        >
                            <ChevronLeft size={22} />
                        </button>
                    )}
                    <button
                        onClick={next}
                        style={{
                            flex: 1,
                            height: '52px',
                            borderRadius: '16px',
                            background: isLast
                                ? 'linear-gradient(135deg, #10b981, #059669)'
                                : 'rgba(255,255,255,0.12)',
                            border: isLast ? 'none' : '1px solid rgba(255,255,255,0.15)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 600,
                            transition: 'all 0.3s',
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

            {/* CSS Animations */}
            <style>{`
        @keyframes onboarding-logo-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 20px 60px rgba(16, 185, 129, 0.4); }
          50% { transform: scale(1.05); box-shadow: 0 25px 70px rgba(16, 185, 129, 0.5); }
        }

        .onboarding-slide {
          animation: onboarding-fade-in 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .onboarding-slide-enter-right {
          animation: onboarding-slide-from-right 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .onboarding-slide-enter-left {
          animation: onboarding-slide-from-left 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes onboarding-slide-from-right {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes onboarding-slide-from-left {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes onboarding-fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .onboarding-feature-card {
          animation: onboarding-card-in 0.5s cubic-bezier(0.4, 0, 0.2, 1) backwards;
        }

        @keyframes onboarding-card-in {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .onboarding-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
        }

        .onboarding-orb-1 {
          width: 300px;
          height: 300px;
          background: rgba(16, 185, 129, 0.15);
          top: -100px;
          right: -100px;
          animation: onboarding-float 8s ease-in-out infinite;
        }

        .onboarding-orb-2 {
          width: 250px;
          height: 250px;
          background: rgba(99, 102, 241, 0.12);
          bottom: 20%;
          left: -80px;
          animation: onboarding-float 10s ease-in-out infinite reverse;
        }

        .onboarding-orb-3 {
          width: 200px;
          height: 200px;
          background: rgba(236, 72, 153, 0.1);
          bottom: -50px;
          right: -50px;
          animation: onboarding-float 12s ease-in-out infinite 2s;
        }

        @keyframes onboarding-float {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(20px, -30px); }
          66% { transform: translate(-15px, 15px); }
        }
      `}</style>
        </div>
    );
}
