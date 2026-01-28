import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, MousePointer, Users, Percent, ShoppingCart } from 'lucide-react';
import { useMemo } from 'react';

interface GrowthProjectionProps {
    currentRevenue: number;
    currentRoas: number;
    currentSessions: number;
    currentClicks: number;
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
    currentOrders = 0,
    currentTicketMedio = 0,
    targetRevenue = 400000,
    targetRoas = 3.0
}: GrowthProjectionProps) {

    const projections = useMemo(() => {
        // Calculate current metrics
        const revenue = currentRevenue || 0;
        const roas = currentRoas || 0;
        const sessions = currentSessions || 0;
        const clicks = currentClicks || 0;
        const orders = currentOrders || 0;
        const ticketMedio = currentTicketMedio || (orders > 0 ? revenue / orders : 0);

        // Current conversion rate
        const currentConvRate = sessions > 0 ? (orders / sessions) * 100 : 0;

        // Derived metrics
        const rps = sessions > 0 ? revenue / sessions : 0; // Revenue per Session
        const rpc = clicks > 0 ? revenue / clicks : 0; // Revenue per Click

        // Target calculations
        // Assuming RPC stays constant, how many clicks needed?
        const targetClicks = rpc > 0 ? targetRevenue / rpc : 0;

        // Assuming RPS stays constant, how many sessions needed?
        const targetSessions = rps > 0 ? targetRevenue / rps : 0;

        // Target conversion rate to hit goal (assuming same ticket and sessions)
        // TargetRevenue = TargetOrders * TicketMedio
        // TargetOrders = TargetRevenue / TicketMedio
        // TargetConvRate = TargetOrders / CurrentSessions
        const targetOrders = ticketMedio > 0 ? targetRevenue / ticketMedio : 0;
        const targetConvRate = sessions > 0 ? (targetOrders / sessions) * 100 : 0;

        // Ideal ticket medio to hit goal (assuming same conversion rate and sessions)
        // TargetRevenue = CurrentConvRate * Sessions * IdealTicket
        // IdealTicket = TargetRevenue / (CurrentConvRate/100 * Sessions)
        const idealTicketMedio = (currentConvRate / 100) * sessions > 0
            ? targetRevenue / ((currentConvRate / 100) * sessions)
            : ticketMedio;

        // Gaps
        const gapRevenue = targetRevenue - revenue;
        const gapSessions = targetSessions - sessions;
        const gapClicks = targetClicks - clicks;
        const gapConvRate = targetConvRate - currentConvRate;
        const gapTicketMedio = idealTicketMedio - ticketMedio;

        return {
            targetClicks,
            targetSessions,
            targetConvRate,
            idealTicketMedio,
            currentConvRate,
            ticketMedio,
            gapRevenue,
            gapSessions,
            gapClicks,
            gapConvRate,
            gapTicketMedio,
            percentRevenue: revenue > 0 ? ((targetRevenue - revenue) / revenue) * 100 : 0,
            percentSessions: sessions > 0 ? ((targetSessions - sessions) / sessions) * 100 : 0,
            percentClicks: clicks > 0 ? ((targetClicks - clicks) / clicks) * 100 : 0,
        };
    }, [currentRevenue, currentRoas, currentSessions, currentClicks, currentOrders, currentTicketMedio, targetRevenue, targetRoas]);

    return (
        <Card className="border-border bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                        <CardTitle className="text-base font-bold text-foreground">Planejamento de Crescimento</CardTitle>
                        <p className="text-xs text-muted-foreground">Metas para atingir R$ {(targetRevenue / 1000).toFixed(0)}k com ROAS {targetRoas.toFixed(1)}x</p>
                    </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-white dark:bg-zinc-800 border border-indigo-100 dark:border-indigo-900 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    Meta Mensal
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Sessões Necessárias */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>Sessões Necessárias</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-foreground">
                                {projections.targetSessions > 1000
                                    ? `${(projections.targetSessions / 1000).toFixed(1)}k`
                                    : projections.targetSessions.toFixed(0)}
                            </span>
                            <span className={`text-xs font-medium ${projections.gapSessions > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {projections.gapSessions > 0 ? '+' : ''}
                                {projections.gapSessions > 1000
                                    ? `${(projections.gapSessions / 1000).toFixed(1)}k`
                                    : Math.abs(projections.gapSessions).toFixed(0)}
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min((currentSessions / projections.targetSessions) * 100, 100)}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            Atualmente: {currentSessions > 1000 ? `${(currentSessions / 1000).toFixed(1)}k` : currentSessions}
                        </p>
                    </div>

                    {/* Cliques Necessários */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MousePointer className="h-4 w-4" />
                            <span>Cliques (Pago) Estimados</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-foreground">
                                {projections.targetClicks > 1000
                                    ? `${(projections.targetClicks / 1000).toFixed(1)}k`
                                    : projections.targetClicks.toFixed(0)}
                            </span>
                            <span className={`text-xs font-medium ${projections.gapClicks > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {projections.gapClicks > 0 ? '+' : ''}
                                {projections.gapClicks > 1000
                                    ? `${(projections.gapClicks / 1000).toFixed(1)}k`
                                    : Math.abs(projections.gapClicks).toFixed(0)}
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min((currentClicks / projections.targetClicks) * 100, 100)}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            Atualmente: {currentClicks > 1000 ? `${(currentClicks / 1000).toFixed(1)}k` : currentClicks}
                        </p>
                    </div>

                    {/* Taxa de Conversão Ideal */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Percent className="h-4 w-4" />
                            <span>Tx Conversão Ideal</span>
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
                                style={{ width: `${Math.min((projections.currentConvRate / projections.targetConvRate) * 100, 100)}%` }}
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
                                style={{ width: `${Math.min((projections.ticketMedio / projections.idealTicketMedio) * 100, 100)}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            Atualmente: R$ {projections.ticketMedio.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
