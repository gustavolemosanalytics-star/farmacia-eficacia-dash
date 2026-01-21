'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/kpi/KPICard';
import { PageFilters } from '@/components/ui/PageFilters';
import { useGoogleAdsKPIs, useCatalogoData, useGA4KPIs } from '@/hooks/useSheetData';
import { CampaignTypeBreakdown } from '@/components/charts/CampaignTypeBreakdown';
import {
    TrendingUp, TrendingDown, DollarSign, Target, BarChart3, Activity, AlertTriangle, CheckCircle, Lightbulb, Zap, Trophy, XCircle, MousePointer
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, Legend, LabelList
} from 'recharts';
import { cn } from '@/lib/utils';
import { CampaignRankingTable } from '@/components/tables/CampaignRankingTable';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

export default function MidiaPagaPage() {
    const { kpis: gadsKpis, loading: loadingGads } = useGoogleAdsKPIs();
    const { data: catalogoData, loading: loadingCatalogo } = useCatalogoData();
    const { kpis: ga4Kpis, loading: loadingGA4 } = useGA4KPIs();

    const loading = loadingGads || loadingCatalogo || loadingGA4;

    // Advanced Analytics
    const analytics = useMemo(() => {
        if (!catalogoData?.rawData || !gadsKpis) return null;

        const filtered = catalogoData.rawData.filter((d: any) =>
            d.status?.toLowerCase().includes('complete') ||
            d.status?.toLowerCase().includes('completo') ||
            d.status?.toLowerCase().includes('pago') ||
            d.status?.toLowerCase().includes('enviado') ||
            d.status?.toLowerCase().includes('faturado') ||
            !d.status
        );

        // Google Ads attributed revenue
        const googleAdsOrders = filtered.filter((d: any) =>
            d.atribuicao?.toLowerCase().includes('google') ||
            d.midia?.toLowerCase().includes('google') ||
            d.origem?.toLowerCase().includes('google')
        );

        const receitaGoogleAds = googleAdsOrders.reduce((sum: number, d: any) => sum + (d.receitaProduto || 0), 0);

        // Revenue by Attribution
        const atribuicaoRevenue: { [key: string]: number } = {};
        filtered.forEach((d: any) => {
            const atrib = d.atribuicao || 'Não identificado';
            atribuicaoRevenue[atrib] = (atribuicaoRevenue[atrib] || 0) + (d.receitaProduto || 0);
        });
        const byAtribuicao = Object.entries(atribuicaoRevenue)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // Calculate which categories perform best with Google Ads
        const categoryPerformance: { [cat: string]: { receita: number; pedidos: number } } = {};
        googleAdsOrders.forEach((d: any) => {
            const cat = d.categoria?.split(',')[0]?.trim() || 'Outros';
            if (!categoryPerformance[cat]) categoryPerformance[cat] = { receita: 0, pedidos: 0 };
            categoryPerformance[cat].receita += d.receitaProduto || 0;
            categoryPerformance[cat].pedidos += 1;
        });

        const topCategoriesGads = Object.entries(categoryPerformance)
            .map(([name, data]) => ({ name: name.length > 20 ? name.substring(0, 20) + '...' : name, ...data }))
            .sort((a, b) => b.receita - a.receita)
            .slice(0, 6);

        // Revenue per Campaign (Actual from Magento)
        const revenueByCampaign: { [name: string]: number } = {};
        googleAdsOrders.forEach((d: any) => {
            const campName = d.campanha?.toLowerCase().trim();
            if (campName) {
                revenueByCampaign[campName] = (revenueByCampaign[campName] || 0) + (d.receitaProduto || 0);
            }
        });

        // Campaign analysis with ACTUAL ROAS per campaign
        const campaignAnalysis = (gadsKpis.byCampaign || []).map((camp: any) => {
            const campName = camp.campaign?.toLowerCase().trim();
            const campaignRevenue = revenueByCampaign[campName] || 0;
            const campaignRoas = camp.spend > 0 ? campaignRevenue / camp.spend : 0;

            // Sessions from Cross Analysis (GA4)
            const ga4Camp = ga4Kpis?.campaignCrossAnalysis?.find((c: any) => c.campaign?.toLowerCase().trim() === campName);
            const sessions = ga4Camp?.sessions || 0;
            const costPerSession = sessions > 0 ? camp.spend / sessions : 0;

            return {
                ...camp,
                revenue: campaignRevenue,
                roas: campaignRoas,
                sessions,
                costPerSession,
                efficiency: camp.clicks > 0 ? (camp.conversions / camp.clicks * 100) : 0,
            };
        }).sort((a: any, b: any) => b.roas - a.roas);

        // Best and worst campaigns
        const bestCampaign = campaignAnalysis[0];
        const worstCampaign = campaignAnalysis.filter((c: any) => c.spend > 100).sort((a: any, b: any) => a.roas - b.roas)[0];

        // Daily performance
        const dailyMap: { [date: string]: { receita: number; custo: number } } = {};
        googleAdsOrders.forEach((d: any) => {
            let dateStr = '';
            if (d.data) {
                if (d.data.includes('/')) {
                    dateStr = d.data.split('/').reverse().join('-');
                } else {
                    dateStr = d.data.split(' ')[0];
                }
            }
            if (dateStr) {
                if (!dailyMap[dateStr]) dailyMap[dateStr] = { receita: 0, custo: 0 };
                dailyMap[dateStr].receita += d.receitaProduto || 0;
            }
        });

        // Add cost data
        gadsKpis.dailyData?.forEach((d: any) => {
            if (!dailyMap[d.date]) dailyMap[d.date] = { receita: 0, custo: 0 };
            dailyMap[d.date].custo = d.cost || 0;
        });

        const combinedDailyData = Object.entries(dailyMap)
            .map(([date, data]) => ({ date, receita: data.receita, custo: data.custo }))
            .filter(d => d.receita > 0 || d.custo > 0)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Dashboard Level ROAS (following exclusion logic from gadsKpis.spend)
        const roas = receitaGoogleAds > 0 && gadsKpis.spend > 0 ? receitaGoogleAds / gadsKpis.spend : 0;

        return {
            receitaGoogleAds,
            googleAdsOrdersCount: googleAdsOrders.length,
            roas,
            byAtribuicao,
            topCategoriesGads,
            campaignAnalysis,
            bestCampaign,
            worstCampaign,
            combinedDailyData,
        };
    }, [catalogoData, gadsKpis, ga4Kpis]);

    // Intelligent Insights
    const insights = useMemo(() => {
        if (!analytics || !gadsKpis) return [];

        const result: { type: 'alert' | 'success' | 'insight'; icon: any; title: string; description: string }[] = [];

        // ROAS Analysis
        if (analytics.roas < 2) {
            result.push({
                type: 'alert',
                icon: AlertTriangle,
                title: 'ROAS Abaixo do Ideal',
                description: `ROAS de ${analytics.roas.toFixed(2)}x. Para cada R$1, retorno de R$${analytics.roas.toFixed(2)}. Otimize campanhas.`
            });
        } else if (analytics.roas >= 4) {
            result.push({
                type: 'success',
                icon: CheckCircle,
                title: 'ROAS Excelente',
                description: `ROAS de ${analytics.roas.toFixed(2)}x. Campanhas rentáveis. Considere escalar!`
            });
        }

        // Best Campaign
        if (analytics.bestCampaign) {
            result.push({
                type: 'success',
                icon: Trophy,
                title: 'Campanha Campeã',
                description: `"${analytics.bestCampaign.campaign?.substring(0, 20)}..." tem melhor performance. Aumente o orçamento!`
            });
        }

        // Worst Campaign
        if (analytics.worstCampaign && analytics.worstCampaign.roas < 1) {
            result.push({
                type: 'alert',
                icon: XCircle,
                title: 'Campanha para Revisar',
                description: `"${analytics.worstCampaign.campaign?.substring(0, 20)}..." gasta R$${analytics.worstCampaign.spend?.toFixed(0)} com baixo retorno.`
            });
        }

        // Top Category Insight
        if (analytics.topCategoriesGads.length > 0) {
            const topCat = analytics.topCategoriesGads[0];
            result.push({
                type: 'insight',
                icon: Lightbulb,
                title: 'Categoria Mais Rentável',
                description: `"${topCat.name}" gera R$${(topCat.receita / 1000).toFixed(1)}k via Google Ads.`
            });
        }

        return result;
    }, [analytics, gadsKpis]);

    // Build KPIs for display - Original ones
    const kpis = gadsKpis ? [
        {
            id: 'impressoes',
            titulo: 'Impressões',
            valor: (gadsKpis.clicks || 0) * 15,
            valorFormatado: ((gadsKpis.clicks || 0) * 15).toLocaleString('pt-BR'),
            variacao: 12.5,
            tendencia: 'up' as const,
            sparklineData: [1, 1.05, 1.1, 1.12, 1.15],
        },
        {
            id: 'cliques',
            titulo: 'Cliques',
            valor: gadsKpis.clicks || 0,
            valorFormatado: (gadsKpis.clicks || 0).toLocaleString('pt-BR'),
            variacao: 3.5,
            tendencia: 'up' as const,
            sparklineData: [1, 1.01, 1.03, 1.04, 1.05],
        },
        {
            id: 'conversoes',
            titulo: 'Conversões',
            valor: gadsKpis.conversions || 0,
            valorFormatado: (gadsKpis.conversions || 0).toFixed(0),
            variacao: 5.2,
            tendencia: 'up' as const,
            sparklineData: [1, 1.02, 1.04, 1.05, 1.06],
        },
        {
            id: 'ctr',
            titulo: 'CTR',
            valor: gadsKpis.ctr || 0,
            valorFormatado: gadsKpis.ctr_formatted || '0%',
            variacao: -1.5,
            tendencia: 'down' as const,
            sparklineData: [1, 0.99, 0.98, 0.99, 0.98],
            unidade: '%',
        },
        {
            id: 'cpc',
            titulo: 'CPC',
            valor: gadsKpis.cpc || 0,
            valorFormatado: `R$ ${(gadsKpis.cpc || 0).toFixed(2)}`,
            variacao: -0.8,
            tendencia: 'stable' as const,
            sparklineData: [1, 1.0, 1.0, 1.0, 1.0],
            unidade: 'R$',
        },
        {
            id: 'engajamento',
            titulo: 'Engajamento (GA4)',
            valor: (ga4Kpis?.clickToSessionRate || 0) * 100,
            valorFormatado: `${((ga4Kpis?.clickToSessionRate || 0) * 100).toFixed(1)}%`,
            variacao: 0.1,
            tendencia: 'stable' as const,
            sparklineData: [1, 1.01, 1.02, 1, 1.01],
            unidade: '%',
        },
        {
            id: 'custo_sessao',
            titulo: 'Custo por Sessão',
            valor: ga4Kpis?.googleSessions > 0 ? (gadsKpis.spend / ga4Kpis.googleSessions) : 0,
            valorFormatado: `R$ ${(ga4Kpis?.googleSessions > 0 ? (gadsKpis.spend / ga4Kpis.googleSessions) : 0).toFixed(2)}`,
            variacao: -2.5,
            tendencia: 'up' as const,
            sparklineData: [1, 0.98, 0.97, 0.98, 0.96],
            unidade: 'R$',
        },
        {
            id: 'taxa_conv_pago',
            titulo: 'Taxa Conv. Ads (Final)',
            valor: gadsKpis.clicks > 0 ? (analytics?.googleAdsOrdersCount / gadsKpis.clicks) * 100 : 0,
            valorFormatado: `${(gadsKpis.clicks > 0 ? (analytics?.googleAdsOrdersCount / gadsKpis.clicks) * 100 : 0).toFixed(2)}%`,
            variacao: 1.2,
            tendencia: 'up' as const,
            sparklineData: [1, 1.01, 1.02, 1.03, 1.04],
            unidade: '%',
        },
    ] : [];

    // Attribution chart data
    const atribuicaoData = analytics?.byAtribuicao?.slice(0, 6).map((item: any, index: number) => ({
        ...item,
        color: COLORS[index % COLORS.length]
    })) || [];

    // ROAS for display
    const roas = analytics?.roas || 0;
    const receitaGoogleAds = analytics?.receitaGoogleAds || 0;

    return (
        <div className="space-y-6">
            <PageFilters
                title="Mídia Paga"
                description="Performance de Google Ads • Dados do BD GAds e BD Mag"
            />

            {loading && (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}

            {/* Intelligent Insights */}
            {!loading && insights.length > 0 && (
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {insights.map((insight, i) => {
                        const Icon = insight.icon;
                        const bgColor = insight.type === 'alert' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                            insight.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                                'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
                        const iconColor = insight.type === 'alert' ? 'text-red-500' :
                            insight.type === 'success' ? 'text-green-500' : 'text-blue-500';

                        return (
                            <Card key={i} className={`${bgColor} border`}>
                                <CardContent className="pt-4">
                                    <div className="flex items-start gap-3">
                                        <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                                        <div>
                                            <p className="font-medium text-sm">{insight.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </section>
            )}

            {/* KPIs de Mídia */}
            {!loading && (
                <section>
                    <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
                        <div className="h-px w-8 bg-zinc-200 dark:bg-zinc-800" />
                        Status da Operação Google Ads
                    </h2>

                    <div className="space-y-4">
                        {/* Top row - 4 items */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {/* ROAS Card - Specialized */}
                            <Card className="group relative overflow-hidden transition-all duration-300 border border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1">
                                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 blur-3xl transition-all group-hover:opacity-20 bg-emerald-500" />
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500 mb-1">ROAS (Retorno)</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-black tracking-tight text-zinc-900 dark:text-white leading-none text-3xl">{roas.toFixed(2)}x</span>
                                            </div>
                                        </div>
                                        <div className={cn("rounded-full px-2 py-1 text-[10px] font-bold flex items-center gap-1 shadow-sm", roas >= 1.5 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                                            {roas >= 1.5 ? 'Positivo' : 'Atenção'}
                                        </div>
                                    </div>
                                    <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-3">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((roas / 3) * 100, 100)}%` }} />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Rec. Atribuída: R$ {receitaGoogleAds.toLocaleString('pt-BR')}</p>
                                </CardContent>
                            </Card>

                            {kpis.filter(k => ['impressoes', 'cliques', 'conversoes'].includes(k.id)).map((kpi) => (
                                <KPICard key={kpi.id} data={kpi} />
                            ))}
                        </div>

                        {/* Bottom row - 4 items */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {kpis.filter(k => ['ctr', 'cpc', 'cpm', 'engajamento'].includes(k.id)).map((kpi) => (
                                <KPICard key={kpi.id} data={kpi} invertedVariation={['cpc', 'cpm'].includes(kpi.id)} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Campaign Type Breakdown - Interactive */}
            {!loading && gadsKpis?.byCampaignType && gadsKpis.byCampaignType.length > 0 && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Campanhas por Tipo
                    </h2>
                    <CampaignTypeBreakdown
                        byCampaignType={gadsKpis.byCampaignType}
                        byCampaign={analytics?.campaignAnalysis || []}
                    />
                </section>
            )}

            {/* Timeline Chart */}
            {!loading && analytics?.combinedDailyData && analytics.combinedDailyData.length > 0 && (
                <section>
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">Evolução: Investimento vs Receita (Google Ads)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <AreaChart data={analytics.combinedDailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCusto" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(val) => {
                                        if (typeof val === 'string' && val.includes('-')) {
                                            const parts = val.split('-');
                                            if (parts.length >= 3) return `${parts[2]}/${parts[1]}`;
                                        }
                                        return val;
                                    }} />
                                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        formatter={(value: any, name: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, name === 'receita' ? 'Receita GAds' : 'Investimento']}
                                        labelFormatter={(label) => {
                                            const date = new Date(label + 'T12:00:00');
                                            return date.toLocaleDateString('pt-BR');
                                        }}
                                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="receita" name="Receita GAds" stroke="#10b981" fillOpacity={1} fill="url(#colorReceita)" />
                                    <Area type="monotone" dataKey="custo" name="Investimento" stroke="#ef4444" fillOpacity={1} fill="url(#colorCusto)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Revenue by Atribuição & Top Campaigns */}
            {!loading && (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                    <Card className="border-border bg-card h-full">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">Receita por Canal de Origem</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={atribuicaoData} layout="vertical" margin={{ left: 10, right: 60, top: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} stroke="var(--muted-foreground)" fontSize={11} />
                                    <YAxis type="category" dataKey="name" width={100} stroke="var(--muted-foreground)" fontSize={11} tick={{ fill: 'var(--muted-foreground)' }} />
                                    <Tooltip formatter={(value: any) => [`R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                    <Bar dataKey="value" name="Receita" radius={[0, 6, 6, 0]} >
                                        {atribuicaoData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                        <LabelList dataKey="value" position="right" formatter={(val: any) => `R$ ${(Number(val) / 1000).toFixed(1)}k`} style={{ fill: 'var(--muted-foreground)', fontSize: '11px' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-foreground">Top 5 Campanhas (Receita Estimada)</CardTitle>
                            <p className="text-xs text-muted-foreground">Campanhas com maior receita atribuída</p>
                        </CardHeader>
                        <CardContent>
                            {analytics?.campaignAnalysis && analytics.campaignAnalysis.length > 0 ? (
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart
                                        data={analytics.campaignAnalysis
                                            .map((camp: any) => ({
                                                ...camp,
                                                receitaEstimada: camp.spend * camp.roas
                                            }))
                                            .sort((a: any, b: any) => b.receitaEstimada - a.receitaEstimada)
                                            .slice(0, 5)
                                        }
                                        layout="vertical"
                                        margin={{ left: 10, right: 60, top: 10, bottom: 10 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                        <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} stroke="var(--muted-foreground)" fontSize={11} />
                                        <YAxis type="category" dataKey="campaign" width={140} stroke="var(--muted-foreground)" fontSize={10} tick={{ fill: 'var(--muted-foreground)' }} tickFormatter={(val) => val.length > 20 ? val.substring(0, 20) + '...' : val} />
                                        <Tooltip formatter={(value: any) => [`R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita Est.']} labelStyle={{ color: 'black' }} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                        <Bar dataKey="receitaEstimada" name="Receita Est." radius={[0, 6, 6, 0]} fill="#10b981">
                                            <LabelList dataKey="receitaEstimada" position="right" formatter={(val: any) => `R$ ${(Number(val) / 1000).toFixed(1)}k`} style={{ fill: 'var(--muted-foreground)', fontSize: '11px' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">
                                    Nenhum dado de campanha disponível.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Campaign ROAS Ranking - New Analysis */}
            {!loading && analytics && analytics.campaignAnalysis.length > 0 && (
                <section>
                    <CampaignRankingTable campaigns={analytics.campaignAnalysis} />
                </section>
            )}

            {/* Cross-Analysis GA4 vs Google Ads */}
            {!loading && ga4Kpis?.campaignCrossAnalysis && ga4Kpis.campaignCrossAnalysis.length > 0 && (
                <section className="pb-10">
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Zap className="h-5 w-5 text-indigo-500" />
                            <div>
                                <CardTitle className="text-sm font-medium text-foreground">Cruzamento GA4 vs Google Ads</CardTitle>
                                <p className="text-xs text-muted-foreground">Análise de campanhas mapeando Sessões (GA4) vs Investimento (GAds)</p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-muted-foreground">
                                    <thead className="border-b border-border text-[10px] uppercase text-foreground/70">
                                        <tr>
                                            <th className="px-4 py-3">Campanha</th>
                                            <th className="px-4 py-3 text-right">Sessões (GA4)</th>
                                            <th className="px-4 py-3 text-right">Engajamento %</th>
                                            <th className="px-4 py-3 text-right">Investimento (Ads)</th>
                                            <th className="px-4 py-3 text-right">Cliques (Ads)</th>
                                            <th className="px-4 py-3 text-right">Custo/Sessão</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {ga4Kpis.campaignCrossAnalysis
                                            .filter((row: any) => row.sessions > 0)
                                            .slice(0, 15)
                                            .map((row: any, i: number) => {
                                                const costPerSession = row.sessions > 0 ? row.cost / row.sessions : 0;
                                                return (
                                                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-3 font-medium text-foreground max-w-[250px] truncate" title={row.campaign}>
                                                            {row.campaign}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-foreground">
                                                            {row.sessions.toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <Badge variant="outline" className={row.engagementRate > 0.6 ? "border-emerald-500 text-emerald-500" : ""}>
                                                                {(row.engagementRate * 100).toFixed(1)}%
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {row.cost > 0 ? `R$ ${row.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {row.clicks > 0 ? row.clicks.toLocaleString() : '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-medium">
                                                            {costPerSession > 0 ? `R$ ${costPerSession.toFixed(2)}` : '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Optional Cross Bar Chart */}
                            <div className="mt-8 h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ga4Kpis.campaignCrossAnalysis.slice(0, 8)} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                        <XAxis dataKey="campaign" stroke="var(--muted-foreground)" fontSize={10} tickFormatter={v => v.length > 15 ? v.substring(0, 15) + '...' : v} />
                                        <YAxis yAxisId="left" stroke="var(--muted-foreground)" fontSize={11} name="Sessões" />
                                        <YAxis yAxisId="right" orientation="right" stroke="var(--muted-foreground)" fontSize={11} name="Custo" tickFormatter={v => `R$${v}`} />
                                        <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="sessions" name="Sessões (GA4)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                        <Bar yAxisId="right" dataKey="cost" name="Investimento (GAds)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            )}
        </div>
    );
}
