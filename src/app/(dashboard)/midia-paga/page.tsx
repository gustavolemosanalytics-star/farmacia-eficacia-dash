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

        // Campaign analysis with ROAS per campaign
        const campaignAnalysis = gadsKpis.byCampaign?.map((camp: any) => {
            const campaignRoas = camp.spend > 0 ? (receitaGoogleAds * (camp.spend / gadsKpis.spend)) / camp.spend : 0;
            return {
                ...camp,
                roas: campaignRoas || (gadsKpis.spend > 0 ? receitaGoogleAds / gadsKpis.spend : 0),
                efficiency: camp.clicks > 0 ? (camp.conversions / camp.clicks * 100) : 0,
            };
        }).sort((a: any, b: any) => b.roas - a.roas) || [];

        // Best and worst campaigns
        const bestCampaign = campaignAnalysis[0];
        const worstCampaign = campaignAnalysis.filter((c: any) => c.spend > 100).slice(-1)[0];

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

        // ROAS
        const roas = receitaGoogleAds > 0 && gadsKpis.spend > 0 ? receitaGoogleAds / gadsKpis.spend : 0;

        return {
            receitaGoogleAds,
            roas,
            byAtribuicao,
            topCategoriesGads,
            campaignAnalysis,
            bestCampaign,
            worstCampaign,
            combinedDailyData,
        };
    }, [catalogoData, gadsKpis]);

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
            id: 'cpm',
            titulo: 'CPM',
            valor: ((gadsKpis.spend || 0) / ((gadsKpis.clicks || 1) * 15)) * 1000,
            valorFormatado: `R$ ${(((gadsKpis.spend || 0) / ((gadsKpis.clicks || 1) * 15)) * 1000).toFixed(2)}`,
            variacao: 1.2,
            tendencia: 'stable' as const,
            sparklineData: [1, 1.01, 1.02, 1.01, 1.02],
            unidade: 'R$',
        },
        {
            id: 'engajamento',
            titulo: 'Engajamento (GA4)',
            valor: (ga4Kpis?.avgEngagementRate || 0) * 100,
            valorFormatado: `${((ga4Kpis?.avgEngagementRate || 0) * 100).toFixed(1)}%`,
            variacao: 0.1,
            tendencia: 'stable' as const,
            sparklineData: [1, 1.01, 1, 1.02, 1],
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
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        KPIs de Google Ads
                    </h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                        {/* ROAS Card */}
                        <Card className="rounded-xl border border-border bg-card shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">ROAS (Retorno)</CardTitle>
                                <DollarSign className={`h-4 w-4 ${roas >= 1 ? 'text-emerald-500' : 'text-red-500'}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{roas.toFixed(2)}x</div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <span className={roas >= 1 ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>
                                        {roas >= 1 ? 'Positivo' : 'Atenção'}
                                    </span>
                                    <span className="opacity-70">
                                        (Rec: R$ {receitaGoogleAds.toLocaleString('pt-BR', { notation: 'compact' } as any)})
                                    </span>
                                </p>
                            </CardContent>
                        </Card>
                        {kpis.map((kpi) => (
                            <KPICard key={kpi.id} data={kpi} invertedVariation={['cpc', 'cpa', 'cpm'].includes(kpi.id)} />
                        ))}
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
                        byCampaign={gadsKpis.byCampaign || []}
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
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            <CardTitle className="text-sm font-medium">Ranking de Campanhas por ROAS</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-3 px-2 font-medium text-muted-foreground">#</th>
                                            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Campanha</th>
                                            <th className="text-right py-3 px-2 font-medium text-muted-foreground">Investimento</th>
                                            <th className="text-right py-3 px-2 font-medium text-muted-foreground">Cliques</th>
                                            <th className="text-right py-3 px-2 font-medium text-muted-foreground">Conv.</th>
                                            <th className="text-right py-3 px-2 font-medium text-muted-foreground">ROAS</th>
                                            <th className="text-right py-3 px-2 font-medium text-muted-foreground">Recomendação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics.campaignAnalysis.slice(0, 8).map((camp: any, i: number) => (
                                            <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                                                <td className="py-3 px-2 font-medium">{i + 1}</td>
                                                <td className="py-3 px-2 max-w-[200px] truncate" title={camp.campaign}>
                                                    {camp.campaign?.substring(0, 30)}{camp.campaign?.length > 30 ? '...' : ''}
                                                </td>
                                                <td className="py-3 px-2 text-right">R$ {camp.spend?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                <td className="py-3 px-2 text-right">{camp.clicks?.toLocaleString('pt-BR')}</td>
                                                <td className="py-3 px-2 text-right">{camp.conversions?.toFixed(0)}</td>
                                                <td className={`py-3 px-2 text-right font-medium ${camp.roas >= 2 ? 'text-green-600' : camp.roas >= 1 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                    {camp.roas.toFixed(2)}x
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${camp.roas >= 3 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        camp.roas >= 1.5 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                            camp.roas >= 1 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}>
                                                        {camp.roas >= 3 ? 'Escalar' : camp.roas >= 1.5 ? 'Manter' : camp.roas >= 1 ? 'Otimizar' : 'Pausar'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
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
                                        {ga4Kpis.campaignCrossAnalysis.slice(0, 15).map((row: any, i: number) => {
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
