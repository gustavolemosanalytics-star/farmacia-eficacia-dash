'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { alertasCriticos } from '@/lib/mockData';

export function AlertBanner() {
    const [isVisible, setIsVisible] = useState(true);
    const [currentAlertIndex, setCurrentAlertIndex] = useState(0);

    const alertasCriticosFiltered = alertasCriticos.filter((a) => a.tipo === 'critical');

    useEffect(() => {
        if (alertasCriticosFiltered.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentAlertIndex((prev) =>
                prev === alertasCriticosFiltered.length - 1 ? 0 : prev + 1
            );
        }, 5000);

        return () => clearInterval(interval);
    }, [alertasCriticosFiltered.length]);

    if (!isVisible || alertasCriticosFiltered.length === 0) return null;

    const alerta = alertasCriticosFiltered[currentAlertIndex];

    return (
        <div className="relative flex items-center justify-between gap-4 bg-red-500/10 dark:bg-red-500/10 border-b border-red-500/20 px-4 py-2">
            <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 animate-pulse" />
                <span className="text-xs font-medium text-red-700 dark:text-red-300">
                    ALERTA CRÍTICO: {alerta.titulo}
                </span>
                <span className="hidden sm:inline text-xs text-red-600/70 dark:text-red-400/70">
                    {alerta.impacto}
                </span>
            </div>
            <div className="flex items-center gap-3">
                {alertasCriticosFiltered.length > 1 && (
                    <div className="flex gap-1">
                        {alertasCriticosFiltered.map((_, index) => (
                            <span
                                key={index}
                                className={`h-1.5 w-1.5 rounded-full transition-colors ${index === currentAlertIndex ? 'bg-red-500' : 'bg-red-500/30'
                                    }`}
                            />
                        ))}
                    </div>
                )}
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-red-600/70 dark:text-red-400/70 hover:text-red-600 dark:hover:text-red-400"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
