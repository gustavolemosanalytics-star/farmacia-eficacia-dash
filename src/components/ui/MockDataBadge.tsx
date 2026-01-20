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

// Minimal Page Header
export function PageHeader({
    title,
    description,
    children
}: {
    title: string;
    description?: string;
    hasMockData?: boolean; // Props kept for backward compatibility but unused visually
    hasRealData?: boolean;
    children?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-foreground tracking-tight">{title}</h1>
                    {description && (
                        <p className="text-sm text-muted-foreground mt-1 font-light">{description}</p>
                    )}
                </div>
                {children && (
                    <div className="flex-shrink-0">
                        {children}
                    </div>
                )}
            </div>
            {/* Minimal separator */}
            <div className="h-[1px] w-full bg-border/40" />
        </div>
    );
}
