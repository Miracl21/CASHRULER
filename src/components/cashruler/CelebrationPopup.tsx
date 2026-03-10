'use client';

/**
 * CelebrationPopup — Beautiful animated in-app popup for encouragements,
 * milestones, streaks, and budget wins. Designed to inspire action.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────
export type CelebrationType = 'streak' | 'milestone' | 'encouragement' | 'budget_win' | 'first_action' | 'weekly_star';

export interface CelebrationData {
    type: CelebrationType;
    title: string;
    message: string;
    detail?: string;
    actionLabel?: string;
    onAction?: () => void;
}

// ─── Theme config per type ───────────────────────────────
const THEMES: Record<CelebrationType, {
    gradient: string;
    accent: string;
    icon: string;
    particles: string[];
}> = {
    streak: {
        gradient: 'linear-gradient(135deg, #f97316 0%, #ef4444 50%, #dc2626 100%)',
        accent: '#f97316',
        icon: '🔥',
        particles: ['🔥', '⚡', '💪', '🌟'],
    },
    milestone: {
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
        accent: '#10b981',
        icon: '🏆',
        particles: ['🏆', '🎉', '⭐', '✨'],
    },
    encouragement: {
        gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        accent: '#8b5cf6',
        icon: '💪',
        particles: ['💪', '🌟', '✨', '🚀'],
    },
    budget_win: {
        gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
        accent: '#14b8a6',
        icon: '✅',
        particles: ['✅', '💰', '📊', '🎯'],
    },
    first_action: {
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)',
        accent: '#f59e0b',
        icon: '🎉',
        particles: ['🎉', '🎊', '🥳', '⭐'],
    },
    weekly_star: {
        gradient: 'linear-gradient(135deg, #eab308 0%, #f59e0b 50%, #f97316 100%)',
        accent: '#eab308',
        icon: '⭐',
        particles: ['⭐', '🌟', '✨', '💫'],
    },
};

// ─── Particle component ─────────────────────────────────
function Particles({ emojis }: { emojis: string[] }) {
    const particles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        emoji: emojis[i % emojis.length],
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
        size: 14 + Math.random() * 12,
    }));

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
            {particles.map(p => (
                <span
                    key={p.id}
                    style={{
                        position: 'absolute',
                        left: `${p.left}%`,
                        bottom: '-20px',
                        fontSize: `${p.size}px`,
                        animation: `cel-rise ${p.duration}s ease-out ${p.delay}s forwards`,
                        opacity: 0,
                    }}
                >
                    {p.emoji}
                </span>
            ))}
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────
export default function CelebrationPopup({
    data,
    onClose,
}: {
    data: CelebrationData | null;
    onClose: () => void;
}) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        if (data) {
            setIsLeaving(false);
            // Small delay for mount animation
            requestAnimationFrame(() => setIsVisible(true));
        } else {
            setIsVisible(false);
        }
    }, [data]);

    const handleClose = useCallback(() => {
        setIsLeaving(true);
        setIsVisible(false);
        setTimeout(onClose, 400);
    }, [onClose]);

    // Auto-close after 8 seconds
    useEffect(() => {
        if (!data) return;
        const timer = setTimeout(handleClose, 8000);
        return () => clearTimeout(timer);
    }, [data, handleClose]);

    if (!data) return null;

    const theme = THEMES[data.type];

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={handleClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99998,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    opacity: isVisible && !isLeaving ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                }}
            />

            {/* Popup */}
            <div
                style={{
                    position: 'fixed',
                    left: '50%',
                    top: '50%',
                    transform: isVisible && !isLeaving
                        ? 'translate(-50%, -50%) scale(1)'
                        : 'translate(-50%, -50%) scale(0.8)',
                    opacity: isVisible && !isLeaving ? 1 : 0,
                    zIndex: 99999,
                    width: 'min(340px, calc(100vw - 40px))',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    boxShadow: `0 24px 64px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset`,
                }}
            >
                {/* Gradient header */}
                <div style={{
                    background: theme.gradient,
                    padding: '32px 24px 24px',
                    position: 'relative',
                    textAlign: 'center',
                }}>
                    <Particles emojis={theme.particles} />

                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2,
                        }}
                    >
                        <X size={14} color="white" />
                    </button>

                    {/* Big icon */}
                    <div style={{
                        fontSize: '56px',
                        lineHeight: 1,
                        marginBottom: '12px',
                        animation: 'cel-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                        position: 'relative',
                        zIndex: 1,
                    }}>
                        {theme.icon}
                    </div>

                    {/* Title */}
                    <h2 style={{
                        color: 'white',
                        fontSize: '20px',
                        fontWeight: 800,
                        margin: 0,
                        lineHeight: 1.3,
                        position: 'relative',
                        zIndex: 1,
                        textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}>
                        {data.title}
                    </h2>
                </div>

                {/* Body */}
                <div style={{
                    background: 'var(--background, #0a0f0d)',
                    padding: '20px 24px 24px',
                }}>
                    {/* Message */}
                    <p style={{
                        color: 'var(--foreground, #fff)',
                        fontSize: '15px',
                        lineHeight: 1.6,
                        textAlign: 'center',
                        margin: '0 0 8px',
                        fontWeight: 500,
                    }}>
                        {data.message}
                    </p>

                    {/* Detail */}
                    {data.detail && (
                        <p style={{
                            color: 'var(--muted-foreground, rgba(255,255,255,0.5))',
                            fontSize: '13px',
                            textAlign: 'center',
                            margin: '0 0 16px',
                            lineHeight: 1.5,
                        }}>
                            {data.detail}
                        </p>
                    )}

                    {/* Action button */}
                    {data.actionLabel && (
                        <button
                            onClick={() => {
                                data.onAction?.();
                                handleClose();
                            }}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '14px',
                                background: theme.gradient,
                                border: 'none',
                                color: 'white',
                                fontSize: '15px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                marginTop: '8px',
                                boxShadow: `0 4px 16px ${theme.accent}44`,
                            }}
                        >
                            {data.actionLabel}
                        </button>
                    )}

                    {/* Dismiss text */}
                    {!data.actionLabel && (
                        <button
                            onClick={handleClose}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                background: 'var(--muted, rgba(255,255,255,0.05))',
                                border: '1px solid var(--border, rgba(255,255,255,0.1))',
                                color: 'var(--foreground, #fff)',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                marginTop: '4px',
                            }}
                        >
                            Compris !
                        </button>
                    )}
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes cel-bounce {
                    0% { transform: scale(0) rotate(-20deg); }
                    60% { transform: scale(1.2) rotate(5deg); }
                    100% { transform: scale(1) rotate(0deg); }
                }
                @keyframes cel-rise {
                    0% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
                    100% { transform: translateY(-300px) rotate(360deg); opacity: 0; }
                }
            `}</style>
        </>
    );
}
