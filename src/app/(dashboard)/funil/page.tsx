'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/ui/MockDataBadge';
import { GlobalDatePicker } from '@/components/ui/GlobalDatePicker';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { useGoogleAdsKPIs, useCatalogoData } from '@/hooks/useSheetData';
import {
    TrendingUp, DollarSign, Target, MousePointer, ShoppingCart, Activity, BarChart3
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#94a3b8', '#4285F4', '#60a5fa', '#FBBC05', '#EA4335', '#34A853'];

export default function FunilPage() {
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

        // Calculate KPIs from filtered data
        const totalReceita = filtered.reduce((sum: number, d: any) => sum + (d.receitaProduto || 0), 0);
        const uniqueOrders = new Set(filtered.map((d: any) => d.pedido).filter(Boolean));
        const totalPedidos = uniqueOrders.size || filtered.length;
        const ticketMedio = totalPedidos > 0 ? totalReceita / totalPedidos : 0;

        // Revenue from Google Ads attribution for ROAS calculation
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
            totalReceita,
            totalPedidos,
            ticketMedio,
            receitaGoogleAds,
            byAtribuicao,
        };
    }, [catalogoData, filterOrigem, filterMidia, filterCategoria, filterAtribuicao]);

    // Use filtered data or default from API
    const displayData = filteredData || {
        totalReceita: catalogoData?.totalReceita || 0,
        totalPedidos: catalogoData?.totalPedidos || 0,
        ticketMedio: catalogoData?.ticketMedio || 0,
        receitaGoogleAds: catalogoData?.byAtribuicao?.find((a: any) => a.name === 'Google_Ads')?.value || 0,
        byAtribuicao: catalogoData?.byAtribuicao || [],
    };

    // Calculate funnel metrics from real data
    const funnelMetrics = {
        // From Google Ads
        clicks: gadsKpis?.clicks || 0,
        impressions: (gadsKpis?.clicks || 0) * 50, // Estimate based on ~2% CTR
        conversionsGads: gadsKpis?.conversions || 0,

        // From Magento (filtered)
        pedidos: displayData.totalPedidos,
        receita: displayData.totalReceita,
        ticketMedio: displayData.ticketMedio,
    };

    // Funnel visualization data
    const funnelData = [
        { name: 'Impressões (Est.)', value: funnelMetrics.impressions, fill: COLORS[0] },
        { name: 'Cliques (GAds)', value: funnelMetrics.clicks, fill: COLORS[1] },
        { name: 'Conversões (GAds)', value: Math.round(funnelMetrics.conversionsGads), fill: COLORS[2] },
        { name: 'Pedidos (Mag)', value: funnelMetrics.pedidos, fill: COLORS[4] },
    ];

    // Conversion rates
    const rates = {
        ctr: funnelMetrics.impressions > 0 ? (funnelMetrics.clicks / funnelMetrics.impressions * 100).toFixed(2) : '0',
        conversionRate: funnelMetrics.clicks > 0 ? (funnelMetrics.conversionsGads / funnelMetrics.clicks * 100).toFixed(2) : '0',
    };

    // ROAS calculation
    const receitaGoogleAds = displayData.receitaGoogleAds;
    const roas = receitaGoogleAds > 0 && gadsKpis?.spend > 0 ? receitaGoogleAds / gadsKpis.spend : 0;

    // Attribution chart data
    const atribuicaoData = displayData.byAtribuicao?.slice(0, 6).map((item: any, index: number) => ({
        ...item,
        color: COLORS[index % COLORS.length]
    })) || [];

    // KPIs
    const kpis = [
        {
            id: 'impressoes',
            titulo: 'Impressões (Est.)',
            valor: funnelMetrics.impressions,
            valorFormatado: funnelMetrics.impressions.toLocaleString('pt-BR'),
            variacao: 5.2,
            tendencia: 'up' as const,
            sparklineData: [1, 1.02, 1.04, 1.05, 1.08],
        },
        {
            id: 'cliques',
            titulo: 'Cliques (GAds)',
            valor: funnelMetrics.clicks,
            valorFormatado: funnelMetrics.clicks.toLocaleString('pt-BR'),
            variacao: 3.5,
            tendencia: 'up' as const,
            sparklineData: [1, 1.01, 1.03, 1.04, 1.05],
        },
        {
            id: 'pedidos',
            titulo: 'Pedidos (Magento)',
            valor: funnelMetrics.pedidos,
            valorFormatado: funnelMetrics.pedidos.toLocaleString('pt-BR'),
            variacao: 8.5,
            tendencia: 'up' as const,
            sparklineData: [1, 1.03, 1.05, 1.07, 1.1],
        },
        {
            id: 'receita',
            titulo: 'Receita (Magento)',
            valor: funnelMetrics.receita,
            valorFormatado: `R$ ${funnelMetrics.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            variacao: 12.5,
            tendencia: 'up' as const,
            sparklineData: [1, 1.05, 1.08, 1.1, 1.15],
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header with Date Picker */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <PageHeader
                    title="Funil de Conversão"
                    description="Análise do funil de vendas • Dados do BD GAds (cliques) e BD Mag (pedidos/receita)"
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

            {/* KPIs */}
            {!loading && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Métricas do Funil
                    </h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {kpis.map((kpi) => (
                            <KPICard key={kpi.id} data={kpi} />
                        ))}
                    </div>
                </section>
            )}

            {/* Funnel Visualization */}
            {!loading && (
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Funnel Bar Chart */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">Funil de Conversão</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 40, top: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()} stroke="var(--muted-foreground)" fontSize={11} />
                                    <YAxis type="category" dataKey="name" width={120} stroke="var(--muted-foreground)" fontSize={11} />
                                    <Tooltip
                                        formatter={(value) => [Number(value).toLocaleString('pt-BR'), 'Quantidade']}
                                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                        {funnelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Conversion Rates */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">Taxas de Conversão</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <MousePointer className="h-5 w-5 text-blue-500" />
                                            <div>
                                                <p className="font-medium">CTR (Taxa de Clique)</p>
                                                <p className="text-xs text-muted-foreground">Impressões → Cliques</p>
                                            </div>
                                        </div>
                                        <p className="text-2xl font-bold text-blue-600">{rates.ctr}%</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <ShoppingCart className="h-5 w-5 text-yellow-500" />
                                            <div>
                                                <p className="font-medium">Taxa de Conversão</p>
                                                <p className="text-xs text-muted-foreground">Cliques → Conversões GAds</p>
                                            </div>
                                        </div>
                                        <p className="text-2xl font-bold text-yellow-600">{rates.conversionRate}%</p>
                                    </div>
                                </div>

                                <div className={`p-4 rounded-xl ${roas >= 1 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <DollarSign className={`h-5 w-5 ${roas >= 1 ? 'text-green-500' : 'text-red-500'}`} />
                                            <div>
                                                <p className="font-medium">ROAS</p>
                                                <p className="text-xs text-muted-foreground">Receita Google Ads ÷ Investimento</p>
                                            </div>
                                        </div>
                                        <p className={`text-2xl font-bold ${roas >= 1 ? 'text-green-600' : 'text-red-600'}`}>{roas.toFixed(2)}x</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <TrendingUp className="h-5 w-5 text-purple-500" />
                                            <div>
                                                <p className="font-medium">Ticket Médio</p>
                                                <p className="text-xs text-muted-foreground">Receita ÷ Pedidos</p>
                                            </div>
                                        </div>
                                        <p className="text-2xl font-bold text-purple-600">R$ {displayData.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Revenue by Attribution */}
            {!loading && catalogoData && (
                <section>
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">Receita por Canal de Atribuição (Magento)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={atribuicaoData} layout="vertical" margin={{ left: 10, right: 40, top: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} stroke="var(--muted-foreground)" fontSize={11} />
                                    <YAxis type="category" dataKey="name" width={100} stroke="var(--muted-foreground)" fontSize={11} />
                                    <Tooltip
                                        formatter={(value) => [`R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="value" name="Receita" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </section>
            )}
        </div>
    );
}
