'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Compass, TrendingUp, TrendingDown, Target, Eye, MousePointer, DollarSign, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BussolaProps {
    // Current values
    currentRevenue: number;
    currentImpressions: number;
    currentClicks: number;
    currentOrders: number;
    // Monthly targets
    targetRevenue?: number;
    targetImpressions?: number;
    targetClicks?: number;
    targetOrders?: number;
    // Period info
    daysInMonth?: number;
    currentDay?: number;
}

// Default monthly targets (can be overridden by props)
const DEFAULT_TARGETS = {
    revenue: 600000,       // R$ 600k/mês
    impressions: 2000000,  // 2M impressões/mês
    clicks: 80000,         // 80k cliques/mês
    orders: 1500,          // 1500 pedidos/mês
};

export function Bussola({
    currentRevenue,
    currentImpressions,
    currentClicks,
    currentOrders,
    targetRevenue = DEFAULT_TARGETS.revenue,
    targetImpressions = DEFAULT_TARGETS.impressions,
    targetClicks = DEFAULT_TARGETS.clicks,
    targetOrders = DEFAULT_TARGETS.orders,
    daysInMonth,
    currentDay,
}: BussolaProps) {
    // Calculate days if not provided
    const now = new Date();
    const totalDays = daysInMonth || new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = currentDay || now.getDate();

    // Progress through month (0-1)
    const monthProgress = dayOfMonth / totalDays;

    // Calculate expected values (where we should be)
    const expectedRevenue = targetRevenue * monthProgress;
    const expectedImpressions = targetImpressions * monthProgress;
    const expectedClicks = targetClicks * monthProgress;
    const expectedOrders = targetOrders * monthProgress;

    // Calculate gaps (positive = ahead, negative = behind)
    const revenueGap = currentRevenue - expectedRevenue;
    const impressionsGap = currentImpressions - expectedImpressions;
    const clicksGap = currentClicks - expectedClicks;
    const ordersGap = currentOrders - expectedOrders;

    // Calculate percentages vs expected
    const revenueVsExpected = expectedRevenue > 0 ? (currentRevenue / expectedRevenue) * 100 : 0;
    const impressionsVsExpected = expectedImpressions > 0 ? (currentImpressions / expectedImpressions) * 100 : 0;
    const clicksVsExpected = expectedClicks > 0 ? (currentClicks / expectedClicks) * 100 : 0;
    const ordersVsExpected = expectedOrders > 0 ? (currentOrders / expectedOrders) * 100 : 0;

    // Projection to end of month (if we continue at current pace)
    const projectedRevenue = monthProgress > 0 ? currentRevenue / monthProgress : 0;
    const projectedImpressions = monthProgress > 0 ? currentImpressions / monthProgress : 0;
    const projectedClicks = monthProgress > 0 ? currentClicks / monthProgress : 0;
    const projectedOrders = monthProgress > 0 ? currentOrders / monthProgress : 0;

    // Overall health score (average of all metrics vs expected)
    const healthScore = (revenueVsExpected + impressionsVsExpected + clicksVsExpected + ordersVsExpected) / 4;

    const getStatusColor = (percentage: number) => {
        if (percentage >= 100) return 'text-emerald-600 dark:text-emerald-400';
        if (percentage >= 90) return 'text-blue-600 dark:text-blue-400';
        if (percentage >= 75) return 'text-amber-600 dark:text-amber-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getStatusBg = (percentage: number) => {
        if (percentage >= 100) return 'bg-emerald-500';
        if (percentage >= 90) return 'bg-blue-500';
        if (percentage >= 75) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const getStatusLabel = (percentage: number) => {
        if (percentage >= 100) return 'No Ritmo';
        if (percentage >= 90) return 'Próximo';
        if (percentage >= 75) return 'Atenção';
        return 'Crítico';
    };

    const formatNumber = (num: number, type: 'currency' | 'number' = 'number') => {
        if (type === 'currency') {
            if (num >= 1000000) return `R$ ${(num / 1000000).toFixed(1)}M`;
            if (num >= 1000) return `R$ ${(num / 1000).toFixed(0)}k`;
            return `R$ ${num.toFixed(0)}`;
        }
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
        return num.toFixed(0);
    };

    const metrics = [
        {
            id: 'revenue',
            label: 'Vendas (Receita)',
            icon: DollarSign,
            current: currentRevenue,
            expected: expectedRevenue,
            target: targetRevenue,
            projected: projectedRevenue,
            gap: revenueGap,
            percentage: revenueVsExpected,
            format: 'currency' as const,
            priority: true,
        },
        {
            id: 'orders',
            label: 'Pedidos',
            icon: Target,
            current: currentOrders,
            expected: expectedOrders,
            target: targetOrders,
            projected: projectedOrders,
            gap: ordersGap,
            percentage: ordersVsExpected,
            format: 'number' as const,
            priority: true,
        },
        {
            id: 'impressions',
            label: 'Impressões',
            icon: Eye,
            current: currentImpressions,
            expected: expectedImpressions,
            target: targetImpressions,
            projected: projectedImpressions,
            gap: impressionsGap,
            percentage: impressionsVsExpected,
            format: 'number' as const,
            priority: false,
        },
        {
            id: 'clicks',
            label: 'Cliques',
            icon: MousePointer,
            current: currentClicks,
            expected: expectedClicks,
            target: targetClicks,
            projected: projectedClicks,
            gap: clicksGap,
            percentage: clicksVsExpected,
            format: 'number' as const,
            priority: false,
        },
    ];

    return (
        <Card className="border-indigo-200/50 dark:border-indigo-800/30 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 dark:from-indigo-900/10 dark:via-zinc-900 dark:to-purple-900/10">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
                            <Compass className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold">Bússola de Metas</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Dia {dayOfMonth} de {totalDays} • {(monthProgress * 100).toFixed(0)}% do mês
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-sm font-semibold px-3 py-1",
                                healthScore >= 100 ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" :
                                    healthScore >= 90 ? "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20" :
                                        healthScore >= 75 ? "border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-900/20" :
                                            "border-red-500 text-red-600 bg-red-50 dark:bg-red-900/20"
                            )}
                        >
                            {healthScore >= 100 ? <CheckCircle className="h-4 w-4 mr-1" /> :
                                healthScore >= 75 ? <TrendingUp className="h-4 w-4 mr-1" /> :
                                    <AlertTriangle className="h-4 w-4 mr-1" />}
                            {healthScore.toFixed(0)}% da Meta
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {metrics.map((metric) => {
                        const Icon = metric.icon;
                        const isAhead = metric.percentage >= 100;
                        const statusColor = getStatusColor(metric.percentage);
                        const statusBg = getStatusBg(metric.percentage);
                        const statusLabel = getStatusLabel(metric.percentage);

                        return (
                            <div
                                key={metric.id}
                                className={cn(
                                    "relative p-4 rounded-xl transition-all duration-300",
                                    "bg-white/80 dark:bg-zinc-900/50 border",
                                    metric.priority
                                        ? "border-indigo-200/50 dark:border-indigo-800/30 shadow-sm"
                                        : "border-zinc-200/50 dark:border-zinc-800/50"
                                )}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Icon className={cn("h-4 w-4", statusColor)} />
                                        <span className="text-xs font-medium text-muted-foreground">{metric.label}</span>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[10px] px-1.5 py-0",
                                            metric.percentage >= 100 ? "border-emerald-500/50 text-emerald-600" :
                                                metric.percentage >= 90 ? "border-blue-500/50 text-blue-600" :
                                                    metric.percentage >= 75 ? "border-amber-500/50 text-amber-600" :
                                                        "border-red-500/50 text-red-600"
                                        )}
                                    >
                                        {statusLabel}
                                    </Badge>
                                </div>

                                {/* Current Value */}
                                <div className="mb-3">
                                    <span className={cn("text-2xl font-bold", statusColor)}>
                                        {formatNumber(metric.current, metric.format)}
                                    </span>
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="text-xs text-muted-foreground">Meta hoje:</span>
                                        <span className="text-xs font-medium">{formatNumber(metric.expected, metric.format)}</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-3">
                                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                                        <span>Progresso vs Meta</span>
                                        <span className={statusColor}>{metric.percentage.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all", statusBg)}
                                            style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Gap & Projection */}
                                <div className="flex items-center justify-between text-xs">
                                    <div>
                                        <span className="text-muted-foreground">Gap: </span>
                                        <span className={cn(
                                            "font-semibold",
                                            metric.gap >= 0 ? "text-emerald-600" : "text-red-600"
                                        )}>
                                            {metric.gap >= 0 ? '+' : ''}{formatNumber(metric.gap, metric.format)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <ArrowRight className="h-3 w-3" />
                                        <span>Proj: {formatNumber(metric.projected, metric.format)}</span>
                                    </div>
                                </div>

                                {/* Target Footer */}
                                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-muted-foreground">Meta Mensal</span>
                                        <span className="font-semibold">{formatNumber(metric.target, metric.format)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Summary Alert */}
                {healthScore < 90 && (
                    <div className={cn(
                        "mt-4 p-3 rounded-lg border flex items-start gap-3",
                        healthScore >= 75
                            ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30"
                            : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30"
                    )}>
                        <AlertTriangle className={cn(
                            "h-5 w-5 flex-shrink-0 mt-0.5",
                            healthScore >= 75 ? "text-amber-500" : "text-red-500"
                        )} />
                        <div>
                            <p className={cn(
                                "text-sm font-medium",
                                healthScore >= 75 ? "text-amber-700 dark:text-amber-400" : "text-red-700 dark:text-red-400"
                            )}>
                                {healthScore >= 75
                                    ? "Atenção: Algumas métricas estão abaixo do esperado"
                                    : "Alerta: Métricas significativamente abaixo da meta"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {revenueVsExpected < 90 && `Vendas ${(100 - revenueVsExpected).toFixed(0)}% abaixo. `}
                                {ordersVsExpected < 90 && `Pedidos ${(100 - ordersVsExpected).toFixed(0)}% abaixo. `}
                                {clicksVsExpected < 90 && `Cliques ${(100 - clicksVsExpected).toFixed(0)}% abaixo. `}
                                Revise campanhas e estratégias para recuperar o ritmo.
                            </p>
                        </div>
                    </div>
                )}

                {healthScore >= 100 && (
                    <div className="mt-4 p-3 rounded-lg border bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30 flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-emerald-500" />
                        <div>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                Excelente! Todas as métricas estão no ritmo ou acima da meta
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Continue monitorando para manter o bom desempenho até o final do mês.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
