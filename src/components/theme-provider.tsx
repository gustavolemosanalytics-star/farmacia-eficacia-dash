'use client';

import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
};

const initialState: ThemeProviderState = {
    theme: 'light',
    setTheme: () => null,
    toggleTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
    children,
    defaultTheme = 'light',
    storageKey = 'warroom-theme',
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(defaultTheme);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem(storageKey) as Theme | null;
        if (stored) {
            setTheme(stored);
        }
    }, [storageKey]);

    useEffect(() => {
        if (!mounted) return;
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem(storageKey, theme);
    }, [theme, storageKey, mounted]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    const value = {
        theme,
        setTheme,
        toggleTheme,
    };

    // Prevent hydration mismatch by rendering children only after mount, 
    // OR (preferred for SEO/LCP) render children but ensure attributes match.
    // However, for theme class on <html>, we are doing it in useEffect, so initial HTML from server has no class or default class.
    // layout.tsx has <html lang="pt-BR" suppressHydrationWarning>. 
    // We should be fine with standard rendering, just ensuring defaults align.

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext);

    if (context === undefined)
        throw new Error('useTheme must be used within a ThemeProvider');

    return context;
};
