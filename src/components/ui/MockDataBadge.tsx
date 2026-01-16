'use client';

import { cn } from '@/lib/utils';
import { FlaskConical, AlertCircle } from 'lucide-react';

interface MockDataBadgeProps {
    variant?: 'sidebar' | 'page';
    className?: string;
}

// Minimalist badge to indicate mock data
export function MockDataBadge({ variant = 'sidebar', className }: MockDataBadgeProps) {
    if (variant === 'sidebar') {
        return (
            <AlertCircle
                className={cn("h-3.5 w-3.5 text-amber-500", className)}
                aria-label="Dados de demonstração"
            />
        );
    }

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium",
                "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30",
                className
            )}
        >
            <FlaskConical className="h-3 w-3" />
            <span>Dados Demo</span>
        </div>
    );
}

// Page header with optional mock data indicator
export function PageHeader({
    title,
    description,
    hasMockData = false,
    hasRealData = false,
    children
}: {
    title: string;
    description?: string;
    hasMockData?: boolean;
    hasRealData?: boolean;
    children?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                    {hasMockData && <MockDataBadge variant="page" />}
                    {hasRealData && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Dados Reais</span>
                        </div>
                    )}
                </div>
                {description && (
                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                )}
            </div>
            {children && (
                <div className="flex-shrink-0">
                    {children}
                </div>
            )}
        </div>
    );
}
