'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { HeatmapData } from '@/types/dashboard';

interface ContributionHeatmapProps {
    data: HeatmapData[];
    title?: string;
}

export function ContributionHeatmap({ data, title = 'Contribuição por Driver' }: ContributionHeatmapProps) {
    const getColor = (value: number) => {
        if (value <= -50) return 'bg-red-600';
        if (value <= -30) return 'bg-red-500';
        if (value <= -10) return 'bg-red-400/80';
        if (value < 0) return 'bg-red-400/50';
        if (value === 0) return 'bg-zinc-600';
        if (value < 10) return 'bg-emerald-400/50';
        if (value < 30) return 'bg-emerald-400/80';
        return 'bg-emerald-500';
    };

    const getTextColor = (value: number) => {
        if (value <= -30 || value >= 30) return 'text-white';
        return 'text-zinc-300';
    };

    return (
        <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.map((categoria) => (
                        <div key={categoria.categoria}>
                            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                                {categoria.categoria}
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                                {categoria.items.map((item) => (
                                    <div
                                        key={item.nome}
                                        className={cn(
                                            'flex flex-col items-center justify-center rounded-lg p-3 transition-all hover:scale-105',
                                            getColor(item.valor)
                                        )}
                                    >
                                        <span className={cn('text-xs font-medium', getTextColor(item.valor))}>
                                            {item.nome}
                                        </span>
                                        <span className={cn('text-lg font-bold', getTextColor(item.valor))}>
                                            {item.valor > 0 ? '+' : ''}{item.valor.toFixed(1)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legenda */}
                <div className="mt-4 flex items-center justify-center gap-1">
                    <span className="text-[10px] text-zinc-500">-70%</span>
                    <div className="flex gap-0.5">
                        <div className="h-2 w-4 rounded-sm bg-red-600" />
                        <div className="h-2 w-4 rounded-sm bg-red-500" />
                        <div className="h-2 w-4 rounded-sm bg-red-400/80" />
                        <div className="h-2 w-4 rounded-sm bg-red-400/50" />
                        <div className="h-2 w-4 rounded-sm bg-zinc-600" />
                        <div className="h-2 w-4 rounded-sm bg-emerald-400/50" />
                        <div className="h-2 w-4 rounded-sm bg-emerald-400/80" />
                        <div className="h-2 w-4 rounded-sm bg-emerald-500" />
                    </div>
                    <span className="text-[10px] text-zinc-500">+30%</span>
                </div>
            </CardContent>
        </Card>
    );
}
