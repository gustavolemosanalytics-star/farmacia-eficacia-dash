'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    useFilterStore,
    comparacaoLabels,
    granularidadeLabels,
    type Granularidade,
    type TipoComparacao,
} from '@/stores/filterStore';
import { useTheme } from '@/components/theme-provider';
import { MobileSidebar } from './Sidebar';
import {
    RefreshCw,
    Sparkles,
    Calendar,
    ChevronDown,
    Bell,
    Sun,
    Moon,
} from 'lucide-react';

interface HeaderProps {
    titulo?: string;
}

export function Header({ titulo = 'Home Executiva' }: HeaderProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { granularidade, setGranularidade, comparacao, setComparacao, periodoInicio, periodoFim } = useFilterStore();
    const { theme, toggleTheme } = useTheme();

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1500);
    };

    const formatarPeriodo = () => {
        return `${format(periodoInicio, "dd MMM", { locale: ptBR })} - ${format(periodoFim, "dd MMM yyyy", { locale: ptBR })}`;
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 px-4 lg:px-6 backdrop-blur">
            {/* Mobile Menu + Título */}
            <div className="flex items-center gap-3">
                <MobileSidebar />
                <div>
                    <h1 className="text-base lg:text-lg font-semibold text-zinc-900 dark:text-white">{titulo}</h1>
                    <button className="hidden sm:flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        <Calendar className="h-3 w-3" />
                        {formatarPeriodo()}
                        <ChevronDown className="h-3 w-3" />
                    </button>
                </div>
            </div>

            {/* Filtros Globais */}
            <div className="flex items-center gap-2 lg:gap-3">
                {/* Granularidade - Hidden on mobile */}
                <Select value={granularidade} onValueChange={(v) => setGranularidade(v as Granularidade)}>
                    <SelectTrigger className="hidden sm:flex h-8 w-24 lg:w-28 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                        {(Object.entries(granularidadeLabels) as [Granularidade, string][]).map(([key, label]) => (
                            <SelectItem key={key} value={key} className="text-xs text-zinc-700 dark:text-zinc-300">
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Comparação */}
                <Select value={comparacao} onValueChange={(v) => setComparacao(v as TipoComparacao)}>
                    <SelectTrigger className="h-8 w-28 lg:w-36 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                        {(Object.entries(comparacaoLabels) as [TipoComparacao, string][]).map(([key, label]) => (
                            <SelectItem key={key} value={key} className="text-xs text-zinc-700 dark:text-zinc-300">
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Theme Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    onClick={toggleTheme}
                >
                    {theme === 'dark' ? (
                        <Sun className="h-4 w-4" />
                    ) : (
                        <Moon className="h-4 w-4" />
                    )}
                </Button>

                {/* Notificações */}
                <Button variant="ghost" size="icon" className="relative h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                    <Bell className="h-4 w-4" />
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        3
                    </span>
                </Button>

                {/* Ask AI - Hidden on small mobile */}
                <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex h-8 gap-2 border-purple-500/50 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 hover:text-purple-700 dark:hover:text-purple-300"
                >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="hidden md:inline text-xs">Pergunte à IA</span>
                </Button>

                {/* Refresh */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    onClick={handleRefresh}
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>

                {/* Last Update - Hidden on mobile */}
                <Badge variant="outline" className="hidden lg:flex h-6 border-zinc-300 dark:border-zinc-700 text-[10px] text-zinc-500">
                    Atualizado: {format(new Date(), 'HH:mm')}
                </Badge>
            </div>
        </header>
    );
}
