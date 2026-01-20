'use client';

import { ReactNode } from 'react';
import { GlobalDatePicker } from './GlobalDatePicker';

interface PageFiltersProps {
    title: string;
    description?: string;
    children?: ReactNode; // For additional filters
}

export function PageFilters({ title, description, children }: PageFiltersProps) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-4 mb-6">
            {/* Top Row: Title + Date Picker */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">{title}</h1>
                    {description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                    )}
                </div>
                <GlobalDatePicker />
            </div>

            {/* Bottom Row: Additional Filters (horizontal) */}
            {children && (
                <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-slate-200/60 dark:border-zinc-700/60">
                    {children}
                </div>
            )}
        </div>
    );
}
