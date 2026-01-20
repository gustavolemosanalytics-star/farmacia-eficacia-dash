'use client';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { MobileSidebar } from './Sidebar';
import { Sun, Moon } from 'lucide-react';

interface HeaderProps {
    titulo?: string;
}

export function Header({ titulo: defaultTitulo }: HeaderProps) {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 px-4 lg:px-6 backdrop-blur">
            {/* Mobile Menu */}
            <div className="flex items-center gap-3">
                <MobileSidebar />
            </div>

            {/* Theme Toggle Only */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="w-8 h-8">
                {theme === 'dark' ? (
                    <Moon className="h-4 w-4 text-zinc-600 dark:text-zinc-400 transition-all" />
                ) : (
                    <Sun className="h-4 w-4 text-zinc-600 dark:text-zinc-400 transition-all" />
                )}
            </Button>
        </header>
    );
}

