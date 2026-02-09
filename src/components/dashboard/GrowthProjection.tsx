import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, MousePointer, ArrowRight, Percent, ShoppingCart, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

interface GrowthProjectionProps {
    currentRevenue: number;
    currentRoas: number;
    currentSessions: number;
    currentClicks: number;
    currentCTR?: number;
    currentOrders?: number;
    currentTicketMedio?: number;
    targetRevenue: number; // 400.000
    targetRoas: number; // 3.0
}

export function GrowthProjection({
    currentRevenue,
    currentRoas,
    currentSessions,
    currentClicks,
    currentCTR = 0,
    currentOrders = 0,
    currentTicketMedio = 0,
    targetRevenue = 400000,
    targetRoas = 3.0
}: GrowthProjectionProps) {

    const projections = useMemo(() => {
        // Calculate current metrics
        const revenue = currentRevenue || 0;
        const sessions = currentSessions || 0;
        const clicks = currentClicks || 0;
        const orders = currentOrders || 0;
        const ticketMedio = currentTicketMedio || (orders > 0 ? revenue / orders : 0);
        const ctr = currentCTR || 0;

        // Current conversion rate (Sessions -> Orders)
        const currentConvRate = sessions > 0 ? (orders / sessions) * 100 : 0;

        // Scenario 1: Keep conversion rate, adjust clicks needed
        // Revenue = Orders * TicketMedio
        // Orders = Sessions * ConvRate
        // Sessions ≈ Clicks (simplified, since click-to-session is usually ~80%)
        // So: Revenue = Clicks * ConvRate * TicketMedio
        // Target Clicks = TargetRevenue / (ConvRate * TicketMedio)
        const clickToSession = sessions > 0 && clicks > 0 ? sessions / clicks : 0.8;
        const targetOrders = ticketMedio > 0 ? targetRevenue / ticketMedio : 0;
        const targetSessions = currentConvRate > 0 ? (targetOrders / (currentConvRate / 100)) : 0;
        const targetClicks = clickToSession > 0 ? targetSessions / clickToSession : 0;

        // Scenario 2: Keep same clicks, adjust conversion rate needed
        const currentSessionsFromClicks = clicks * clickToSession;
        const targetConvRateForClicks = currentSessionsFromClicks > 0 && ticketMedio > 0
            ? (targetRevenue / ticketMedio) / currentSessionsFromClicks * 100
            : 0;

        // Scenario 3: Keep conversion rate and clicks, adjust ticket medio needed
        const ordersWithCurrentData = sessions * (currentConvRate / 100);
        const idealTicketMedio = ordersWithCurrentData > 0 ? targetRevenue / ordersWithCurrentData : ticketMedio;

        // Ideal CTR (keeping impressions constant, but needing more clicks)
        // More clicks = better CTR (if we can't increase impressions)
        // This is just a proportional calculation
        const idealCTR = ctr > 0 && clicks > 0 && targetClicks > 0
            ? ctr * (targetClicks / clicks)
            : ctr;

        // Gap calculations
        const gapClicks = targetClicks - clicks;
        const gapConvRate = targetConvRateForClicks - currentConvRate;
        const gapTicketMedio = idealTicketMedio - ticketMedio;
        const gapCTR = idealCTR - ctr;

        // Feasibility scores (which path is easiest?)
        // Lower percentage increase = more feasible
        const clicksFeasibility = clicks > 0 ? (gapClicks / clicks) * 100 : 999;
        const convRateFeasibility = currentConvRate > 0 ? (gapConvRate / currentConvRate) * 100 : 999;
        const ticketFeasibility = ticketMedio > 0 ? (gapTicketMedio / ticketMedio) * 100 : 999;

        return {
            // Current metrics
            currentConvRate,
            ticketMedio,
            ctr,
            clicks,
            sessions,
            orders,

            // Targets
            targetClicks: Math.round(targetClicks),
            targetConvRate: targetConvRateForClicks,
            idealTicketMedio,
            idealCTR,

            // Gaps
            gapClicks: Math.round(gapClicks),
            gapConvRate,
            gapTicketMedio,
            gapCTR,

            // Feasibility
            clicksFeasibility,
            convRateFeasibility,
            ticketFeasibility,

            // Progress percentages
            percentClicks: targetClicks > 0 ? Math.min((clicks / targetClicks) * 100, 100) : 0,
            percentConvRate: targetConvRateForClicks > 0 ? Math.min((currentConvRate / targetConvRateForClicks) * 100, 100) : 0,
            percentTicket: idealTicketMedio > 0 ? Math.min((ticketMedio / idealTicketMedio) * 100, 100) : 0,
            percentCTR: idealCTR > 0 ? Math.min((ctr / idealCTR) * 100, 100) : 0,
        };
    }, [currentRevenue, currentRoas, currentSessions, currentClicks, currentCTR, currentOrders, currentTicketMedio, targetRevenue, targetRoas]);

    // Find the most feasible path
    const getBestPath = () => {
        const paths = [
            { name: 'Aumentar Cliques', feasibility: projections.clicksFeasibility },
            { name: 'Melhorar Conversão', feasibility: projections.convRateFeasibility },
            { name: 'Aumentar Ticket', feasibility: projections.ticketFeasibility },
        ];
        return paths.sort((a, b) => a.feasibility - b.feasibility)[0];
    };

    const bestPath = getBestPath();

    return (
        <Card className="border-border bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                        <CardTitle className="text-base font-bold text-foreground">Planejamento de Crescimento</CardTitle>
                        <p className="text-xs text-muted-foreground">Cenários para atingir R$ {(targetRevenue / 1000).toFixed(0)}k de receita</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        <TrendingUp className="h-3 w-3 inline mr-1" />
                        Melhor Caminho: {bestPath.name}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* CTR Ideal */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Percent className="h-4 w-4" />
                            <span>CTR Ideal</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-foreground">
                                {projections.idealCTR.toFixed(2)}%
                            </span>
                            <span className={`text-xs font-medium ${projections.gapCTR > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {projections.gapCTR > 0 ? '+' : ''}{projections.gapCTR.toFixed(2)}pp
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-pink-500 rounded-full transition-all duration-1000"
                                style={{ width: `${projections.percentCTR}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            Atualmente: {projections.ctr.toFixed(2)}%
                        </p>
                    </div>

                    {/* Cliques Ideais */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MousePointer className="h-4 w-4" />
                            <span>Cliques Ideais (Pago)</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-foreground">
                                {projections.targetClicks > 1000
                                    ? `${(projections.targetClicks / 1000).toFixed(1)}k`
                                    : projections.targetClicks.toLocaleString('pt-BR')}
                            </span>
                            <span className={`text-xs font-medium ${projections.gapClicks > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {projections.gapClicks > 0 ? '+' : ''}
                                {projections.gapClicks > 1000
                                    ? `${(projections.gapClicks / 1000).toFixed(1)}k`
                                    : projections.gapClicks.toLocaleString('pt-BR')}
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                style={{ width: `${projections.percentClicks}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            Atualmente: {projections.clicks > 1000 ? `${(projections.clicks / 1000).toFixed(1)}k` : projections.clicks.toLocaleString('pt-BR')}
                        </p>
                    </div>

                    {/* Taxa de Conversão Ideal */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ArrowRight className="h-4 w-4" />
                            <span>Tx Sessão → Compra</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-foreground">
                                {projections.targetConvRate.toFixed(2)}%
                            </span>
                            <span className={`text-xs font-medium ${projections.gapConvRate > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {projections.gapConvRate > 0 ? '+' : ''}{projections.gapConvRate.toFixed(2)}pp
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                style={{ width: `${projections.percentConvRate}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            Atualmente: {projections.currentConvRate.toFixed(2)}%
                        </p>
                    </div>

                    {/* Ticket Médio Ideal */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ShoppingCart className="h-4 w-4" />
                            <span>Ticket Médio Ideal</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-foreground">
                                R$ {projections.idealTicketMedio.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                            </span>
                            <span className={`text-xs font-medium ${projections.gapTicketMedio > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {projections.gapTicketMedio > 0 ? '+' : ''}R$ {Math.abs(projections.gapTicketMedio).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-violet-500 rounded-full transition-all duration-1000"
                                style={{ width: `${projections.percentTicket}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            Atualmente: R$ {projections.ticketMedio.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </p>
                    </div>
                </div>

                <div className="mt-6 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800">
                    <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                        * Cenários calculados mantendo as outras variáveis constantes. O <strong>melhor caminho</strong> indica qual métrica precisa de menor ajuste percentual para atingir a meta.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
