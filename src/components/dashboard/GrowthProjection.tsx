import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, MousePointer, Users, TrendingUp, DollarSign } from 'lucide-react';
import { useMemo } from 'react';

interface GrowthProjectionProps {
    currentRevenue: number;
    currentRoas: number;
    currentSessions: number;
    currentClicks: number;
    targetRevenue: number; // 400.000
    targetRoas: number; // 3.0
}

export function GrowthProjection({
    currentRevenue,
    currentRoas,
    currentSessions,
    currentClicks,
    targetRevenue = 400000,
    targetRoas = 3.0
}: GrowthProjectionProps) {

    const projections = useMemo(() => {
        // Calculate current metrics
        const revenue = currentRevenue || 0;
        const roas = currentRoas || 0;
        const sessions = currentSessions || 0;
        const clicks = currentClicks || 0;

        // Derived metrics
        const rps = sessions > 0 ? revenue / sessions : 0; // Revenue per Session
        const rpc = clicks > 0 ? revenue / clicks : 0; // Revenue per Click
        const spend = roas > 0 ? revenue / roas : 0;

        // Target calculations
        // To hit Target Revenue with Target ROAS:
        const targetSpend = targetRevenue / targetRoas;

        // Assuming RPC stays constant, how many clicks needed?
        const targetClicks = rpc > 0 ? targetRevenue / rpc : 0;

        // Assuming RPS stays constant, how many sessions needed?
        const targetSessions = rps > 0 ? targetRevenue / rps : 0;

        // Gaps
        const gapRevenue = targetRevenue - revenue;
        const gapSessions = targetSessions - sessions;
        const gapClicks = targetClicks - clicks;
        const gapSpend = targetSpend - spend;

        return {
            targetSpend,
            targetClicks,
            targetSessions,
            gapRevenue,
            gapSessions,
            gapClicks,
            gapSpend,
            percentRevenue: revenue > 0 ? ((targetRevenue - revenue) / revenue) * 100 : 0,
            percentSessions: sessions > 0 ? ((targetSessions - sessions) / sessions) * 100 : 0,
            percentClicks: clicks > 0 ? ((targetClicks - clicks) / clicks) * 100 : 0,
        };
    }, [currentRevenue, currentRoas, currentSessions, currentClicks, targetRevenue, targetRoas]);

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                    {/* Investimento Necessário */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            <span>Investimento (Ads) Ideal</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-foreground">
                                {projections.targetSpend > 1000
                                    ? `${(projections.targetSpend / 1000).toFixed(1)}k`
                                    : projections.targetSpend.toFixed(0)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                (ROAS {targetRoas}x)
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000" // Usually green for money/spend efficiency 
                                style={{ width: `${Math.min((((currentRevenue / currentRoas) || 0) / projections.targetSpend) * 100, 100)}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            Gap de Investimento: R$ {projections.gapSpend > 0 ? projections.gapSpend.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : 0}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
