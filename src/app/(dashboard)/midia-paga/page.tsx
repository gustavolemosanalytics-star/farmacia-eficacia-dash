'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/ui/MockDataBadge';
import { GlobalDatePicker } from '@/components/ui/GlobalDatePicker';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { useGoogleAdsKPIs, useCatalogoData } from '@/hooks/useSheetData';
import { TrendingUp, Trophy, DollarSign, Target, BarChart3, Activity, MousePointer } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

export default function MidiaPagaPage() {
    // Real data from APIs
    const { kpis: gadsKpis, loading: loadingGads } = useGoogleAdsKPIs();
    const { data: catalogoData, loading: loadingCatalogo } = useCatalogoData();

    const loading = loadingGads || loadingCatalogo;

    // Filter states
    const [filterOrigem, setFilterOrigem] = useState<string | null>(null);
    const [filterMidia, setFilterMidia] = useState<string | null>(null);
    const [filterCategoria, setFilterCategoria] = useState<string | null>(null);
    const [filterAtribuicao, setFilterAtribuicao] = useState<string | null>(null);

    // Filter options from data
    const filterOptions = catalogoData?.filterOptions || {
        origens: [],
        midias: [],
        categorias: [],
        atribuicoes: [],
    };

    // Filtered data based on selected filters
    const filteredData = useMemo(() => {
        if (!catalogoData?.rawData) return null;

        let filtered = catalogoData.rawData.filter((d: any) =>
            d.status?.toLowerCase().includes('complete') ||
            d.status?.toLowerCase().includes('completo') ||
            d.status?.toLowerCase().includes('pago') ||
            d.status?.toLowerCase().includes('enviado') ||
            d.status?.toLowerCase().includes('faturado') ||
            !d.status
        );

        if (filterOrigem) filtered = filtered.filter((d: any) => d.origem === filterOrigem);
        if (filterMidia) filtered = filtered.filter((d: any) => d.midia === filterMidia);
        if (filterCategoria) filtered = filtered.filter((d: any) => d.categoria?.includes(filterCategoria));
        if (filterAtribuicao) filtered = filtered.filter((d: any) => d.atribuicao === filterAtribuicao);

        // Revenue from Google Ads attribution
        const receitaGoogleAds = filtered
            .filter((d: any) => d.atribuicao === 'Google_Ads')
            .reduce((sum: number, d: any) => sum + (d.receitaProduto || 0), 0);

        // Revenue by Atribuição for chart
        const atribuicaoRevenue: { [key: string]: number } = {};
        filtered.forEach((d: any) => {
            const atrib = d.atribuicao || 'Não identificado';
            atribuicaoRevenue[atrib] = (atribuicaoRevenue[atrib] || 0) + (d.receitaProduto || 0);
        });
        const byAtribuicao = Object.entries(atribuicaoRevenue)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return {
            receitaGoogleAds,
            byAtribuicao,
        };
    }, [catalogoData, filterOrigem, filterMidia, filterCategoria, filterAtribuicao]);

    // Calculate ROAS using Google Ads attributed revenue from filtered data
    const receitaGoogleAds = filteredData?.receitaGoogleAds ||
        catalogoData?.byAtribuicao?.find((a: any) => a.name === 'Google_Ads')?.value || 0;
    const roas = receitaGoogleAds > 0 && gadsKpis?.spend > 0 ? receitaGoogleAds / gadsKpis.spend : 0;

    // Attributed revenue by channel from filtered data
    const atribuicaoData = (filteredData?.byAtribuicao || catalogoData?.byAtribuicao)?.slice(0, 6).map((item: any, index: number) => ({
        ...item,
        color: COLORS[index % COLORS.length]
    })) || [];

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

            {/* Filters */}
            {!loading && catalogoData && (
                <section className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FilterDropdown
                            label="Origem"
                            options={filterOptions.origens}
                            value={filterOrigem}
                            onChange={setFilterOrigem}
                        />
                        <FilterDropdown
                            label="Mídia"
                            options={filterOptions.midias}
                            value={filterMidia}
                            onChange={setFilterMidia}
                        />
                        <FilterDropdown
                            label="Categoria"
                            options={filterOptions.categorias?.slice(0, 50) || []}
                            value={filterCategoria}
                            onChange={setFilterCategoria}
                        />
                        <FilterDropdown
                            label="Atribuição"
                            options={filterOptions.atribuicoes}
                            value={filterAtribuicao}
                            onChange={setFilterAtribuicao}
                        />
                    </div>
                </section>
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
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <MousePointer className="h-5 w-5 text-blue-500" />
                                        <span className="font-medium">CTR (Taxa de Clique)</span>
                                    </div>
                                    <span className="text-lg font-bold">{gadsKpis?.ctr_formatted}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <DollarSign className="h-5 w-5 text-yellow-500" />
                                        <span className="font-medium">CPC (Custo por Clique)</span>
                                    </div>
                                    <span className="text-lg font-bold">R$ {gadsKpis?.cpc.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Target className="h-5 w-5 text-red-500" />
                                        <span className="font-medium">CPA (Custo por Aquisição)</span>
                                    </div>
                                    <span className="text-lg font-bold">R$ {gadsKpis?.costPerConversion.toFixed(2)}</span>
                                </div>
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
