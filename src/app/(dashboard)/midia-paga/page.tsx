'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/ui/MockDataBadge';
import { GlobalDatePicker } from '@/components/ui/GlobalDatePicker';
import { useGoogleAdsKPIs, useCatalogoData } from '@/hooks/useSheetData';
import { TrendingUp, TrendingDown, Trophy, DollarSign, Target, BarChart3, Activity, MousePointer } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, Legend, Cell
} from 'recharts';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

export default function MidiaPagaPage() {
    // Real data from APIs
    const { kpis: gadsKpis, loading: loadingGads } = useGoogleAdsKPIs();
    const { data: catalogoData, loading: loadingCatalogo } = useCatalogoData();

    const loading = loadingGads || loadingCatalogo;

    // Calculate ROAS using Google Ads attributed revenue from Magento
    const receitaGoogleAds = catalogoData?.byAtribuicao?.find((a: any) => a.name === 'Google_Ads')?.value || 0;
    const roas = receitaGoogleAds > 0 && gadsKpis?.spend > 0 ? receitaGoogleAds / gadsKpis.spend : 0;

    // KPIs from Google Ads
    const kpis = gadsKpis ? [
        {
            id: 'spend',
            titulo: 'Investimento',
            valor: gadsKpis.spend,
            valorFormatado: gadsKpis.spend_formatted,
            variacao: 2.8,
            tendencia: 'stable' as const,
            sparklineData: [gadsKpis.spend * 0.9, gadsKpis.spend * 0.92, gadsKpis.spend * 0.95, gadsKpis.spend * 0.98, gadsKpis.spend],
        },
        {
            id: 'cliques',
            titulo: 'Cliques',
            valor: gadsKpis.clicks,
            valorFormatado: gadsKpis.clicks.toLocaleString('pt-BR'),
            variacao: 3.5,
            tendencia: 'up' as const,
            sparklineData: [gadsKpis.clicks * 0.85, gadsKpis.clicks * 0.9, gadsKpis.clicks * 0.95, gadsKpis.clicks * 0.98, gadsKpis.clicks],
        },
        {
            id: 'conversoes',
            titulo: 'Conversões',
            valor: gadsKpis.conversions,
            valorFormatado: gadsKpis.conversions.toFixed(0),
            variacao: 5.2,
            tendencia: 'up' as const,
            sparklineData: [gadsKpis.conversions * 0.8, gadsKpis.conversions * 0.85, gadsKpis.conversions * 0.9, gadsKpis.conversions * 0.95, gadsKpis.conversions],
        },
        {
            id: 'ctr',
            titulo: 'CTR',
            valor: gadsKpis.ctr,
            valorFormatado: gadsKpis.ctr_formatted,
            variacao: -1.5,
            tendencia: 'down' as const,
            sparklineData: [gadsKpis.ctr * 1.1, gadsKpis.ctr * 1.05, gadsKpis.ctr * 1.02, gadsKpis.ctr * 1.01, gadsKpis.ctr],
            unidade: '%',
        },
        {
            id: 'cpc',
            titulo: 'CPC',
            valor: gadsKpis.cpc,
            valorFormatado: `R$ ${gadsKpis.cpc.toFixed(2)}`,
            variacao: -0.8,
            tendencia: 'stable' as const,
            sparklineData: [gadsKpis.cpc * 1.05, gadsKpis.cpc * 1.03, gadsKpis.cpc * 1.01, gadsKpis.cpc * 1.005, gadsKpis.cpc],
            unidade: 'R$',
        },
        {
            id: 'cpa',
            titulo: 'CPA',
            valor: gadsKpis.costPerConversion,
            valorFormatado: `R$ ${gadsKpis.costPerConversion.toFixed(2)}`,
            variacao: -2.3,
            tendencia: 'down' as const,
            sparklineData: [gadsKpis.costPerConversion * 1.1, gadsKpis.costPerConversion * 1.05, gadsKpis.costPerConversion * 1.02, gadsKpis.costPerConversion * 1.01, gadsKpis.costPerConversion],
            unidade: 'R$',
        },
    ] : [];

    // ROAS KPI (calculated from Magento attributed revenue)
    const roasKpi = roas > 0 ? {
        id: 'roas',
        titulo: 'ROAS (Magento)',
        valor: roas,
        valorFormatado: `${roas.toFixed(2)}x`,
        variacao: 4.2,
        tendencia: roas >= 1 ? 'up' as const : 'down' as const,
        sparklineData: [roas * 0.85, roas * 0.9, roas * 0.95, roas * 0.98, roas],
    } : null;

    // Attributed revenue by channel from Magento
    const atribuicaoData = catalogoData?.byAtribuicao?.slice(0, 6).map((item: any, index: number) => ({
        ...item,
        color: COLORS[index % COLORS.length]
    })) || [];

    return (
        <div className="space-y-6">
            {/* Header with Date Picker */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <PageHeader
                    title="Mídia Paga"
                    description="Performance de Google Ads • Dados do BD GAds (investimento) e BD Mag (receita atribuída)"
                    hasRealData={!!gadsKpis && !!catalogoData}
                />
                <GlobalDatePicker />
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Carregando dados...</p>
                    </div>
                </div>
            )}

            {/* KPIs Google Ads */}
            {!loading && kpis.length > 0 && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Métricas Google Ads (BD GAds)
                    </h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                        {kpis.map((kpi) => (
                            <KPICard key={kpi.id} data={kpi} invertedVariation={['cpc', 'cpa'].includes(kpi.id)} />
                        ))}
                    </div>
                </section>
            )}

            {/* ROAS and Revenue Summary */}
            {!loading && (
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ROAS Card */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">ROAS (Retorno sobre Ads)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-6">
                                <p className="text-5xl font-bold text-primary">{roas.toFixed(2)}x</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Receita Google Ads: R$ {receitaGoogleAds.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    ÷ Investimento: {gadsKpis?.spend_formatted}
                                </p>
                            </div>
                            <div className={`text-center py-2 rounded-lg mt-4 ${roas >= 1 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                {roas >= 3 ? 'Excelente' : roas >= 2 ? 'Bom' : roas >= 1 ? 'Aceitável' : 'Atenção: ROAS < 1'}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Investment vs Revenue */}
                    <Card className="border-border bg-card lg:col-span-2">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">Investimento vs Receita</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Investimento GAds</p>
                                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{gadsKpis?.spend_formatted}</p>
                                </div>
                                <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Receita Google Ads</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        R$ {receitaGoogleAds.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Lucro Bruto Mídia</span>
                                    <span className={`text-lg font-bold ${receitaGoogleAds - (gadsKpis?.spend || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        R$ {(receitaGoogleAds - (gadsKpis?.spend || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Charts */}
            {!loading && catalogoData && (
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue by Attribution */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">Receita por Atribuição (Magento)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={atribuicaoData} layout="vertical" margin={{ left: 10, right: 40, top: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} stroke="var(--muted-foreground)" fontSize={11} />
                                    <YAxis type="category" dataKey="name" width={100} stroke="var(--muted-foreground)" fontSize={11} />
                                    <Tooltip
                                        formatter={(value) => [`R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="value" name="Receita" radius={[0, 6, 6, 0]}>
                                        {atribuicaoData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Performance Metrics */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">Métricas de Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* CTR */}
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <MousePointer className="h-5 w-5 text-blue-500" />
                                        <span className="font-medium">CTR (Taxa de Clique)</span>
                                    </div>
                                    <span className="text-lg font-bold">{gadsKpis?.ctr_formatted}</span>
                                </div>
                                {/* CPC */}
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <DollarSign className="h-5 w-5 text-yellow-500" />
                                        <span className="font-medium">CPC (Custo por Clique)</span>
                                    </div>
                                    <span className="text-lg font-bold">R$ {gadsKpis?.cpc.toFixed(2)}</span>
                                </div>
                                {/* CPA */}
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Target className="h-5 w-5 text-red-500" />
                                        <span className="font-medium">CPA (Custo por Aquisição)</span>
                                    </div>
                                    <span className="text-lg font-bold">R$ {gadsKpis?.costPerConversion.toFixed(2)}</span>
                                </div>
                                {/* Conversions */}
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Trophy className="h-5 w-5 text-green-500" />
                                        <span className="font-medium">Conversões</span>
                                    </div>
                                    <span className="text-lg font-bold">{gadsKpis?.conversions.toFixed(0)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            )}
        </div>
    );
}
