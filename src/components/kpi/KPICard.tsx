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
    className?: string;
}

export function KPICard({ data, onClick, compact = false, invertedVariation = false, className }: KPICardProps) {
    const isPositive = data.tendencia === 'up' ? !invertedVariation : (data.tendencia === 'down' ? invertedVariation : true);
    const isNegative = data.tendencia === 'up' ? invertedVariation : (data.tendencia === 'down' ? !invertedVariation : false);

    const trendColor = isPositive ? 'text-emerald-500' : (isNegative ? 'text-rose-500' : 'text-amber-500');
    const trendBg = isPositive ? 'bg-emerald-500/10' : (isNegative ? 'bg-rose-500/10' : 'bg-amber-500/10');
    const glowColor = isPositive ? 'rgba(16, 185, 129, 0.15)' : (isNegative ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)');

    const sparklineColor = isPositive ? '#10b981' : (isNegative ? '#f43f5e' : '#f59e0b');

    return (
        <Card
            className={cn(
                "group relative overflow-hidden transition-all duration-300",
                "border border-zinc-200/50 dark:border-zinc-800/50",
                "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl",
                "hover:shadow-2xl hover:shadow-zinc-200/50 dark:hover:shadow-black/50 hover:-translate-y-1",
                onClick && "cursor-pointer",
                className
            )}
            onClick={onClick}
            style={{
                boxShadow: `0 10px 30px -15px ${glowColor}`
            } as any}
        >
            {/* Background Glow */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 blur-3xl transition-all group-hover:opacity-20"
                style={{ backgroundColor: sparklineColor }} />

            <CardContent className={compact ? "p-4" : "p-6"}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500 mb-1">
                            {data.titulo}
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className={cn(
                                "font-black tracking-tight text-zinc-900 dark:text-white leading-none",
                                compact ? "text-2xl" : "text-3xl"
                            )}>
                                {data.valorFormatado}
                            </span>
                            {data.unidade === 'R$' && !data.valorFormatado.includes('R$') && (
                                <span className="text-xs font-bold text-zinc-400">BRL</span>
                            )}
                        </div>
                    </div>
                    <div className={cn("rounded-full px-2 py-1 text-[10px] font-bold flex items-center gap-1 shadow-sm", trendBg, trendColor)}>
                        {data.variacao > 0 ? '+' : ''}{data.variacao.toFixed(1)}%
                    </div>
                </div>

                {/* Sparkline Space */}
                <div className="relative h-12 w-full mt-2 overflow-hidden rounded-md transition-all group-hover:scale-105">
                    <Sparkline data={data.sparklineData} color={sparklineColor} height={48} />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 dark:from-zinc-900/20 to-transparent pointer-events-none" />
                </div>

                {/* Meta Indicator */}
                {data.meta && (
                    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                        <div className="flex items-center justify-between text-[10px] mb-1.5">
                            <span className="flex items-center gap-1.5 font-medium text-zinc-500">
                                <Target className="h-3 w-3" />
                                Meta: {data.unidade === 'R$' ? `R$ ${(data.meta / 1000).toFixed(0)}k` : data.meta.toLocaleString()}
                            </span>
                            <span className={cn(
                                "font-bold",
                                (data.valor / data.meta) >= 1 ? "text-emerald-500" : "text-zinc-400"
                            )}>
                                {((data.valor / data.meta) * 100).toFixed(0)}%
                            </span>
                        </div>
                        <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all duration-1000 ease-out rounded-full",
                                    (data.valor / data.meta) >= 1 ? "bg-emerald-500" : "bg-primary"
                                )}
                                style={{ width: `${Math.min((data.valor / data.meta) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Bottom Detail */}
                {!data.meta && (
                    <div className="mt-4 flex items-center justify-between">
                        <div className="h-1 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                        <span className="text-[9px] font-medium text-zinc-400 uppercase tracking-tighter">Live Period Analysis</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
