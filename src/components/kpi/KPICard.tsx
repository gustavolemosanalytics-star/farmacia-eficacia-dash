'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkline } from './Sparkline';
import { VariationBadge } from './VariationBadge';
import type { KPIData } from '@/types/dashboard';
import { ChevronRight, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
    data: KPIData;
    onClick?: () => void;
    compact?: boolean;
    invertedVariation?: boolean;
}

export function KPICard({ data, onClick, compact = false, invertedVariation = false }: KPICardProps) {
    const sparklineColor = data.tendencia === 'up'
        ? (invertedVariation ? 'red' : 'green')
        : data.tendencia === 'down'
            ? (invertedVariation ? 'green' : 'red')
            : 'yellow';

    const metaPercentual = data.meta ? (data.valor / data.meta) * 100 : null;

    return (
        <Card
            className={cn(
                "group relative overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 transition-all hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 shadow-sm",
                onClick && "cursor-pointer"
            )}
            onClick={onClick}
        >
            <CardContent className={compact ? "p-3" : "p-4"}>
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{data.titulo}</span>
                    <VariationBadge value={data.variacao} inverted={invertedVariation} />
                </div>

                {/* Valor Principal */}
                <div className="mb-3">
                    <span className={cn(
                        "font-bold text-zinc-900 dark:text-white",
                        compact ? "text-xl" : "text-2xl"
                    )}>
                        {data.valorFormatado}
                    </span>
                </div>

                {/* Sparkline */}
                <div className="mb-3">
                    <Sparkline data={data.sparklineData} color={sparklineColor} height={compact ? 24 : 32} />
                </div>

                {/* Meta */}
                {data.meta && (
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                            <Target className="h-3 w-3" />
                            Meta: {data.unidade === 'R$' ? `R$ ${(data.meta / 1000).toFixed(0)}k` :
                                data.unidade === '%' ? `${data.meta}%` :
                                    data.meta.toLocaleString('pt-BR')}
                        </span>
                        <span className={cn(
                            "font-medium",
                            metaPercentual && metaPercentual >= 100 ? "text-emerald-600 dark:text-emerald-400" :
                                metaPercentual && metaPercentual >= 80 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"
                        )}>
                            {metaPercentual?.toFixed(0)}%
                        </span>
                    </div>
                )}

                {/* Ver Drivers Button */}
                {onClick && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3 h-7 w-full justify-between bg-zinc-100 dark:bg-zinc-800/50 text-[10px] text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        Ver Drivers
                        <ChevronRight className="h-3 w-3" />
                    </Button>
                )}
            </CardContent>

            {/* Indicador de tendência crítica */}
            {data.variacao < -30 && !invertedVariation && (
                <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-red-500 to-transparent" />
            )}
        </Card>
    );
}
