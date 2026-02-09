'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowUpRight, ArrowDownRight, Trophy, ShoppingBag, Target, Share2, Lightbulb,
    TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Zap, Brain, Activity
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface IntelligentAnalysisProps {
    data: any[]; // Raw data from Magento
    gadsKpis?: any; // Google Ads KPIs
    ga4Kpis?: any; // GA4 KPIs
    comparisonGads?: any; // Previous period Google Ads KPIs
    comparisonGA4?: any; // Previous period GA4 KPIs
}

interface CausalInsight {
    type: 'alert' | 'success' | 'insight' | 'warning';
    icon: any;
    title: string;
    description: string;
    metrics?: { label: string; value: string; variation?: number }[];
    priority: number;
}

export function IntelligentAnalysis({ data, gadsKpis, ga4Kpis, comparisonGads, comparisonGA4 }: IntelligentAnalysisProps) {
    const [selectedInsight, setSelectedInsight] = useState<CausalInsight | null>(null);

    const analysis = useMemo(() => {
        if (!data || data.length === 0) return null;

        // 1. Best Products (by Revenue and Quantity)
        const productStats: Record<string, { revenue: number; quantity: number }> = {};

        // 2. Best Campaigns (by Quantity of Products sold)
        const campaignStats: Record<string, { quantity: number; revenue: number }> = {};

        // 3. Best Channels (by Conversions/Orders)
        const channelStats: Record<string, { orders: Set<string>; revenue: number }> = {};

        data.forEach((d: any) => {
            const productName = d.nomeProduto || 'Desconhecido';
            const campaign = d.campanha || 'Outros / Orgânico';
            const channel = d.atribuicao || 'Não identificado';
            const revenue = d.receitaProduto || 0;
            const quantity = 1;

            // Product Stats
            if (!productStats[productName]) productStats[productName] = { revenue: 0, quantity: 0 };
            productStats[productName].revenue += revenue;
            productStats[productName].quantity += quantity;

            // Campaign Stats
            if (campaign && campaign.trim() !== '') {
                if (!campaignStats[campaign]) campaignStats[campaign] = { quantity: 0, revenue: 0 };
                campaignStats[campaign].quantity += quantity;
                campaignStats[campaign].revenue += revenue;
            }

            // Channel Stats
            if (channel) {
                if (!channelStats[channel]) channelStats[channel] = { orders: new Set(), revenue: 0 };
                if (d.pedido) channelStats[channel].orders.add(d.pedido);
                channelStats[channel].revenue += revenue;
            }
        });

        // Determine Best Product
        const topProduct = Object.entries(productStats)
            .map(([name, stat]) => ({ name, ...stat }))
            .sort((a, b) => b.revenue - a.revenue)[0];

        // Determine Best Campaign by Quantity (Products)
        const topCampaign = Object.entries(campaignStats)
            .map(([name, stat]) => ({ name, ...stat }))
            .sort((a, b) => b.quantity - a.quantity)[0];

        // Determine Best Channel by Conversions (Orders)
        const topChannel = Object.entries(channelStats)
            .map(([name, stat]) => ({ name, orders: stat.orders.size, revenue: stat.revenue }))
            .sort((a, b) => b.orders - a.orders)[0];

        return {
            topProduct,
            topCampaign,
            topChannel
        };
    }, [data]);

    // Causal Analysis - Deep insights
    const causalInsights = useMemo(() => {
        const insights: CausalInsight[] = [];

        if (!gadsKpis) return insights;

        // Calculate Google Ads attributed revenue from data
        const completedOrders = (data || []).filter((d: any) =>
            d.status?.toLowerCase().includes('complete') ||
            d.status?.toLowerCase().includes('completo') ||
            d.status?.toLowerCase().includes('pago') ||
            d.status?.toLowerCase().includes('enviado') ||
            d.status?.toLowerCase().includes('faturado') ||
            !d.status
        );

        const googleAdsOrders = completedOrders.filter((d: any) =>
            d.atribuicao?.toLowerCase().includes('google') ||
            d.midia?.toLowerCase().includes('google') ||
            d.origem?.toLowerCase().includes('google')
        );

        const roas = gadsKpis.roas || 0;
        const receitaGoogleAds = gadsKpis.conversionValue || 0;

        // Get comparison metrics if available
        const hasComparison = comparisonGads && comparisonGA4;

        // Calculate variations
        const clicksVar = hasComparison && comparisonGads.clicks > 0
            ? ((gadsKpis.clicks - comparisonGads.clicks) / comparisonGads.clicks) * 100
            : null;

        const sessionsVar = hasComparison && ga4Kpis && comparisonGA4?.googleSessions > 0
            ? ((ga4Kpis.googleSessions - comparisonGA4.googleSessions) / comparisonGA4.googleSessions) * 100
            : null;

        const ctrVar = hasComparison && comparisonGads.ctr > 0
            ? ((gadsKpis.ctr - comparisonGads.ctr) / comparisonGads.ctr) * 100
            : null;

        const cpcVar = hasComparison && comparisonGads.cpc > 0
            ? ((gadsKpis.cpc - comparisonGads.cpc) / comparisonGads.cpc) * 100
            : null;

        const spendVar = hasComparison && comparisonGads.spend > 0
            ? ((gadsKpis.spend - comparisonGads.spend) / comparisonGads.spend) * 100
            : null;

        // ==========================================
        // ROAS Analysis with Google Ads Revenue
        // ==========================================
        if (roas > 0) {
            if (roas >= 4) {
                insights.push({
                    type: 'success',
                    icon: Trophy,
                    title: 'ROAS Excelente',
                    description: `ROAS de ${roas.toFixed(2)}x! Para cada R$1 investido, você está gerando R$${roas.toFixed(2)} em receita do Google Ads. Considere escalar as campanhas mais rentáveis.`,
                    metrics: [
                        { label: 'Receita Google Ads', value: `R$ ${(receitaGoogleAds / 1000).toFixed(1)}k` },
                        { label: 'Investimento', value: `R$ ${(gadsKpis.spend / 1000).toFixed(1)}k` },
                        { label: 'ROAS', value: `${roas.toFixed(2)}x` }
                    ],
                    priority: 1
                });
            } else if (roas >= 2) {
                insights.push({
                    type: 'insight',
                    icon: CheckCircle,
                    title: 'ROAS Saudável',
                    description: `ROAS de ${roas.toFixed(2)}x está dentro do esperado. A receita atribuída ao Google Ads está cobrindo bem o investimento.`,
                    metrics: [
                        { label: 'Receita Google Ads', value: `R$ ${(receitaGoogleAds / 1000).toFixed(1)}k` },
                        { label: 'Investimento', value: `R$ ${(gadsKpis.spend / 1000).toFixed(1)}k` }
                    ],
                    priority: 2
                });
            } else if (roas >= 1) {
                insights.push({
                    type: 'warning',
                    icon: AlertTriangle,
                    title: 'ROAS Baixo - Atenção',
                    description: `ROAS de ${roas.toFixed(2)}x. O investimento está se pagando, mas com margem apertada. Revise campanhas com baixa performance.`,
                    metrics: [
                        { label: 'Receita Google Ads', value: `R$ ${(receitaGoogleAds / 1000).toFixed(1)}k` },
                        { label: 'Investimento', value: `R$ ${(gadsKpis.spend / 1000).toFixed(1)}k` }
                    ],
                    priority: 1
                });
            } else {
                insights.push({
                    type: 'alert',
                    icon: AlertTriangle,
                    title: 'ROAS Crítico',
                    description: `ROAS de ${roas.toFixed(2)}x está abaixo de 1. A receita do Google Ads não está cobrindo o investimento. Ação urgente necessária.`,
                    metrics: [
                        { label: 'Receita Google Ads', value: `R$ ${(receitaGoogleAds / 1000).toFixed(1)}k` },
                        { label: 'Investimento', value: `R$ ${(gadsKpis.spend / 1000).toFixed(1)}k` },
                        { label: 'Prejuízo', value: `R$ ${((gadsKpis.spend - receitaGoogleAds) / 1000).toFixed(1)}k` }
                    ],
                    priority: 0
                });
            }
        }

        // ==========================================
        // Causal Analysis - Why metrics changed
        // ==========================================
        if (hasComparison) {
            // Build causal chain for revenue changes
            const causes: string[] = [];
            const metrics: { label: string; value: string; variation?: number }[] = [];

            // Check clicks impact
            if (clicksVar !== null && Math.abs(clicksVar) > 5) {
                if (clicksVar < 0) {
                    causes.push(`cliques caíram ${Math.abs(clicksVar).toFixed(0)}%`);
                } else {
                    causes.push(`cliques aumentaram ${clicksVar.toFixed(0)}%`);
                }
                metrics.push({
                    label: 'Cliques',
                    value: gadsKpis.clicks.toLocaleString('pt-BR'),
                    variation: clicksVar
                });
            }

            // Check sessions impact
            if (sessionsVar !== null && Math.abs(sessionsVar) > 5) {
                if (sessionsVar < 0) {
                    causes.push(`sessões caíram ${Math.abs(sessionsVar).toFixed(0)}%`);
                } else {
                    causes.push(`sessões aumentaram ${sessionsVar.toFixed(0)}%`);
                }
                metrics.push({
                    label: 'Sessões',
                    value: (ga4Kpis?.googleSessions || 0).toLocaleString('pt-BR'),
                    variation: sessionsVar
                });
            }

            // Check CTR impact
            if (ctrVar !== null && Math.abs(ctrVar) > 5) {
                if (ctrVar < 0) {
                    causes.push(`CTR caiu ${Math.abs(ctrVar).toFixed(0)}%`);
                } else {
                    causes.push(`CTR aumentou ${ctrVar.toFixed(0)}%`);
                }
                metrics.push({
                    label: 'CTR',
                    value: `${gadsKpis.ctr.toFixed(2)}%`,
                    variation: ctrVar
                });
            }

            // Check CPC impact
            if (cpcVar !== null && Math.abs(cpcVar) > 5) {
                if (cpcVar > 0) {
                    causes.push(`CPC aumentou ${cpcVar.toFixed(0)}%`);
                } else {
                    causes.push(`CPC diminuiu ${Math.abs(cpcVar).toFixed(0)}%`);
                }
                metrics.push({
                    label: 'CPC',
                    value: `R$ ${gadsKpis.cpc.toFixed(2)}`,
                    variation: cpcVar
                });
            }

            // Generate causal insight
            if (causes.length > 0) {
                const isNegative = causes.some(c => c.includes('caíram') || c.includes('caiu'));
                const isPositive = causes.some(c => c.includes('aumentaram') || c.includes('aumentou') || c.includes('diminuiu'));

                if (isNegative && !causes.some(c => c.includes('aumentaram'))) {
                    insights.push({
                        type: 'alert',
                        icon: TrendingDown,
                        title: 'Análise de Queda de Performance',
                        description: `Detectamos que: ${causes.join(', ')}. Isso pode estar impactando negativamente seus resultados.`,
                        metrics,
                        priority: 1
                    });
                } else if (isPositive && !causes.some(c => c.includes('caíram'))) {
                    insights.push({
                        type: 'success',
                        icon: TrendingUp,
                        title: 'Métricas em Crescimento',
                        description: `Ótimas notícias! ${causes.join(', ')}. Continue monitorando para manter o momentum.`,
                        metrics,
                        priority: 2
                    });
                } else if (causes.length >= 2) {
                    insights.push({
                        type: 'insight',
                        icon: Activity,
                        title: 'Variações Mistas nas Métricas',
                        description: `Observamos variações: ${causes.join(', ')}. Analise quais fatores estão compensando outros.`,
                        metrics,
                        priority: 3
                    });
                }
            }
        }

        // ==========================================
        // Efficiency Analysis
        // ==========================================
        if (ga4Kpis?.googleSessions > 0 && gadsKpis.clicks > 0) {
            const clickToSessionRate = ga4Kpis.googleSessions / gadsKpis.clicks;

            if (clickToSessionRate < 0.5) {
                insights.push({
                    type: 'warning',
                    icon: Zap,
                    title: 'Baixa Taxa de Clique → Sessão',
                    description: `Apenas ${(clickToSessionRate * 100).toFixed(0)}% dos cliques estão virando sessões. Pode indicar problemas no site, landing page lenta, ou tráfego inválido.`,
                    metrics: [
                        { label: 'Cliques', value: gadsKpis.clicks.toLocaleString('pt-BR') },
                        { label: 'Sessões', value: ga4Kpis.googleSessions.toLocaleString('pt-BR') },
                        { label: 'Taxa', value: `${(clickToSessionRate * 100).toFixed(0)}%` }
                    ],
                    priority: 2
                });
            } else if (clickToSessionRate >= 0.8) {
                insights.push({
                    type: 'success',
                    icon: Zap,
                    title: 'Excelente Taxa de Engajamento',
                    description: `${(clickToSessionRate * 100).toFixed(0)}% dos cliques viram sessões. Landing pages estão funcionando bem.`,
                    priority: 4
                });
            }
        }

        // ==========================================
        // Cost Per Session Analysis
        // ==========================================
        if (ga4Kpis?.googleSessions > 0 && gadsKpis.spend > 0) {
            const costPerSession = gadsKpis.spend / ga4Kpis.googleSessions;

            if (costPerSession > 10) {
                insights.push({
                    type: 'warning',
                    icon: AlertTriangle,
                    title: 'Custo por Sessão Elevado',
                    description: `R$ ${costPerSession.toFixed(2)} por sessão está acima do ideal. Otimize palavras-chave e segmentação.`,
                    metrics: [
                        { label: 'Custo/Sessão', value: `R$ ${costPerSession.toFixed(2)}` },
                        { label: 'Total Sessões', value: ga4Kpis.googleSessions.toLocaleString('pt-BR') }
                    ],
                    priority: 3
                });
            }
        }

        // Sort by priority
        return insights.sort((a, b) => a.priority - b.priority);
    }, [data, gadsKpis, ga4Kpis, comparisonGads, comparisonGA4]);

    if (!analysis) return null;

    return (
        <div className="space-y-6">
            {/* Causal Insights Section */}
            {causalInsights.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-500" />
                        <h2 className="text-lg font-semibold text-foreground">Análise Inteligente de Performance</h2>
                        <Badge variant="outline" className="text-purple-500 border-purple-500/50">
                            IA
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {causalInsights.slice(0, 4).map((insight, i) => {
                            const Icon = insight.icon;
                            const bgColor = insight.type === 'alert' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                                insight.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                                    insight.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' :
                                        'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
                            const iconColor = insight.type === 'alert' ? 'text-red-500' :
                                insight.type === 'success' ? 'text-green-500' :
                                    insight.type === 'warning' ? 'text-amber-500' : 'text-blue-500';

                            return (
                                <Card
                                    key={i}
                                    className={`${bgColor} border cursor-pointer hover:scale-[1.02] transition-transform`}
                                    onClick={() => setSelectedInsight(insight)}
                                >
                                    <CardContent className="pt-4">
                                        <div className="flex items-start gap-3">
                                            <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{insight.title}</p>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{insight.description}</p>

                                                {insight.metrics && insight.metrics.length > 0 && (
                                                    <div className="flex flex-wrap gap-3 mt-3">
                                                        {insight.metrics.map((metric, idx) => (
                                                            <div key={idx} className="text-xs">
                                                                <span className="text-muted-foreground">{metric.label}: </span>
                                                                <span className="font-semibold">{metric.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            <Dialog open={!!selectedInsight} onOpenChange={(open) => !open && setSelectedInsight(null)}>
                {selectedInsight && (
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                {(() => {
                                    const Icon = selectedInsight.icon;
                                    const iconColor = selectedInsight.type === 'alert' ? 'text-red-500' :
                                        selectedInsight.type === 'success' ? 'text-green-500' :
                                            selectedInsight.type === 'warning' ? 'text-amber-500' : 'text-blue-500';
                                    return <Icon className={`h-6 w-6 ${iconColor}`} />;
                                })()}
                                <DialogTitle>{selectedInsight.title}</DialogTitle>
                            </div>
                            <DialogDescription className="text-base leading-relaxed pt-2">
                                {selectedInsight.description}
                            </DialogDescription>
                        </DialogHeader>

                        {selectedInsight.metrics && selectedInsight.metrics.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                {selectedInsight.metrics.map((metric, idx) => (
                                    <div key={idx} className="p-3 rounded-lg bg-muted/50 border border-border">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{metric.label}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-lg font-bold">{metric.value}</p>
                                            {metric.variation !== undefined && (
                                                <span className={cn(
                                                    "text-xs font-bold",
                                                    metric.variation > 0 ? "text-green-500" : "text-red-500"
                                                )}>
                                                    {metric.variation > 0 ? '↑' : '↓'}{Math.abs(metric.variation).toFixed(0)}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-6 p-4 rounded-lg border border-dashed border-primary/20 bg-primary/5">
                            <h5 className="text-sm font-bold flex items-center gap-2 mb-2">
                                <Zap className="h-4 w-4 text-primary" />
                                Ações Sugeridas
                            </h5>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Com base nos indicadores de {selectedInsight.title.toLowerCase()}, sugerimos monitorar a performance semanalmente e ajustar a segmentação de público se os desvios persistirem por mais de 72 horas.
                            </p>
                        </div>
                    </DialogContent>
                )}
            </Dialog>

            {/* Top Performers Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    <h2 className="text-lg font-semibold text-foreground">Destaques de Performance</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Melhor Produto */}
                    <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-zinc-900 border-indigo-200 dark:border-indigo-800">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                                    <ShoppingBag className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                                    Produto Campeão
                                </span>
                            </div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Maior Receita Gerada</h3>
                            <p className="text-lg font-bold leading-tight mb-3 line-clamp-2 min-h-[3rem]" title={analysis.topProduct?.name}>
                                {analysis.topProduct?.name || 'N/A'}
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                    R$ {(analysis.topProduct?.revenue || 0).toLocaleString('pt-BR', { notation: 'compact' })}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    (~{analysis.topProduct?.quantity || 0} un.)
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Melhor Campanha - Quantidade */}
                    <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-zinc-900 border-emerald-200 dark:border-emerald-800">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                                    <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                                    Campanha de Volume
                                </span>
                            </div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Mais Produtos Vendidos</h3>
                            <p className="text-lg font-bold leading-tight mb-3 line-clamp-2 min-h-[3rem]" title={analysis.topCampaign?.name}>
                                {analysis.topCampaign?.name || 'N/A'}
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {analysis.topCampaign?.quantity || 0} items
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    (R$ {(analysis.topCampaign?.revenue || 0).toLocaleString('pt-BR', { notation: 'compact' })})
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Melhor Canal - Conversões */}
                    <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-zinc-900 border-amber-200 dark:border-amber-800">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                                    <Share2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                                    Canal de Conversão
                                </span>
                            </div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Maior Volume de Pedidos</h3>
                            <p className="text-lg font-bold leading-tight mb-3 line-clamp-2 min-h-[3rem]" title={analysis.topChannel?.name}>
                                {analysis.topChannel?.name || 'N/A'}
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                    {analysis.topChannel?.orders || 0} pedidos
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    máx. conversão
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
