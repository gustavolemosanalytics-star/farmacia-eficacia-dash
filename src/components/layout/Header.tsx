'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { MobileSidebar } from './Sidebar';
import {
    RefreshCw,
    Sparkles,
    Bell,
    Sun,
    Moon,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

interface HeaderProps {
    titulo?: string;
}

export function Header({ titulo: defaultTitulo }: HeaderProps) {
    const pathname = usePathname();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const getTitle = () => {
        switch (pathname) {
            case '/': return 'Visão Geral Executiva';
            case '/catalogo': return 'Catálogo de Produtos';
            case '/crm': return 'CRM & Retenção';
            case '/aquisicao': return 'Aquisição & Tráfego';
            case '/midia-paga': return 'Mídia Paga (Ads)';
            case '/seo': return 'SEO & Demanda';
            case '/funil': return 'Funil de Conversão';
            case '/email': return 'E-mail & Automação';
            case '/social': return 'Social & Marca';
            case '/preco': return 'Monitoramento de Preços';
            case '/operacao': return 'Operação & CX';
            case '/data-quality': return 'Qualidade de Dados';
            case '/diagnostico': return 'Diagnóstico com IA';
            default: return defaultTitulo || 'Plataforma BI';
        }
    };

    const titulo = getTitle();

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1500);
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 px-4 lg:px-6 backdrop-blur">
            {/* Mobile Menu + Título */}
            <div className="flex items-center gap-3">
                <MobileSidebar />
                <h1 className="text-base lg:text-lg font-semibold text-zinc-900 dark:text-white">{titulo}</h1>
            </div>

            {/* Ações Direita */}
            <div className="flex items-center gap-2 sm:gap-4">
                <Button variant="ghost" size="icon" className="w-9 h-9 relative" aria-label="Notificações">
                    <Bell className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-zinc-950" />
                    <span className="sr-only">Notificações: 3</span>
                </Button>

                <Button variant="outline" size="sm" className="hidden sm:flex gap-2 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Pergunte à IA</span>
                </Button>

                <Button variant="ghost" size="icon" className="w-9 h-9" onClick={handleRefresh}>
                    <RefreshCw className={`h-4 w-4 text-zinc-600 dark:text-zinc-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>

                <Button variant="ghost" size="icon" onClick={toggleTheme} className="w-9 h-9">
                    {theme === 'dark' ? (
                        <Moon className="h-4 w-4 text-zinc-600 dark:text-zinc-400 transition-all" />
                    ) : (
                        <Sun className="h-4 w-4 text-zinc-600 dark:text-zinc-400 transition-all" />
                    )}
                </Button>

                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                    <div className="text-xs text-right hidden lg:block">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">Atualizado</p>
                        <p className="text-zinc-500 dark:text-zinc-400">{format(new Date(), 'HH:mm', { locale: ptBR })}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
