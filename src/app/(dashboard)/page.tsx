'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/ui/MockDataBadge';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { TrendingUp, DollarSign, ShoppingCart, Target, Activity, BarChart3, PieChart, Package, Users, Filter, AlertTriangle, CheckCircle } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RechartsPie, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { useCatalogoData, useGoogleAdsKPIs } from '@/hooks/useSheetData';
import { GlobalDatePicker } from '@/components/ui/GlobalDatePicker';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

import { BrazilMap } from '@/components/charts/BrazilMap';

export default function HomeExecutiva() {
    const { data: catalogoData, loading: loadingCatalogo } = useCatalogoData();
    const { kpis: gadsKpis, loading: loadingGads } = useGoogleAdsKPIs();

    // Filter states
    const [filterOrigem, setFilterOrigem] = useState<string | null>(null);
    const [filterMidia, setFilterMidia] = useState<string | null>(null);
    const [filterCategoria, setFilterCategoria] = useState<string | null>(null);
    const [filterAtribuicao, setFilterAtribuicao] = useState<string | null>(null);

    const loading = loadingCatalogo || loadingGads;

    // Filter options from API
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
        if (filterCategoria) filtered = filtered.filter((d: any) => d.categoria === filterCategoria);
        if (filterAtribuicao) filtered = filtered.filter((d: any) => d.atribuicao === filterAtribuicao);

        // Calculate KPIs from filtered data
        const totalReceita = filtered.reduce((sum: number, d: any) => sum + (d.receitaProduto || 0), 0);
        const uniqueOrders = new Set(filtered.map((d: any) => d.pedido).filter(Boolean));
        const totalPedidos = uniqueOrders.size || filtered.length;
        const ticketMedio = totalPedidos > 0 ? totalReceita / totalPedidos : 0;
        const uniqueClients = new Set(filtered.map((d: any) => d.cpfCliente).filter(Boolean));

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

        // Revenue by Category
        const categoryRevenue: { [key: string]: number } = {};
        filtered.forEach((d: any) => {
            const cat = d.categoria || 'Sem Categoria';
            categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (d.receitaProduto || 0);
        });
        const byCategory = Object.entries(categoryRevenue)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);

        // Daily Revenue
        const dailyRevenueMap: { [key: string]: { receita: number; pedidos: number } } = {};
        filtered.forEach((d: any) => {
            const dateRaw = d.data || d.dataTransacao;
            if (dateRaw) {
                const key = dateRaw.split(' ')[0];
                if (!dailyRevenueMap[key]) dailyRevenueMap[key] = { receita: 0, pedidos: 0 };
                dailyRevenueMap[key].receita += d.receitaProduto || 0;
                dailyRevenueMap[key].pedidos += 1;
            }
        });
        const dailyRevenue = Object.entries(dailyRevenueMap)
            .map(([date, val]) => ({ date, receita: val.receita, pedidos: val.pedidos }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return {
            totalReceita,
            totalPedidos,
            ticketMedio,
            totalClientes: uniqueClients.size,
            receitaGoogleAds,
            byAtribuicao,
            byCategory,
            dailyRevenue,
        };
    }, [catalogoData, filterOrigem, filterMidia, filterCategoria, filterAtribuicao]);

    // Use filtered data or default from API
    const displayData = filteredData || {
        totalReceita: catalogoData?.totalReceita || 0,
        totalPedidos: catalogoData?.totalPedidos || 0,
        ticketMedio: catalogoData?.ticketMedio || 0,
        totalClientes: catalogoData?.totalClientes || 0,
        receitaGoogleAds: catalogoData?.byAtribuicao?.find((a: any) => a.name === 'Google_Ads')?.value || 0,
        byAtribuicao: catalogoData?.byAtribuicao || [],
        byCategory: catalogoData?.byCategory || [],
        dailyRevenue: catalogoData?.dailyRevenue || [],
    };

    // Main KPIs
    const kpis = [
        {
            id: 'receita_magento',
            titulo: 'Receita Magento',
            valor: displayData.totalReceita,
            valorFormatado: `R$ ${displayData.totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            variacao: 8.5,
            tendencia: 'up' as const,
            sparklineData: [displayData.totalReceita * 0.8, displayData.totalReceita * 0.85, displayData.totalReceita * 0.9, displayData.totalReceita * 0.95, displayData.totalReceita],
        },
        {
            id: 'pedidos',
            titulo: 'Pedidos',
            valor: displayData.totalPedidos,
            valorFormatado: displayData.totalPedidos.toLocaleString('pt-BR'),
            variacao: 5.2,
            tendencia: 'up' as const,
            sparklineData: [displayData.totalPedidos * 0.8, displayData.totalPedidos * 0.85, displayData.totalPedidos * 0.9, displayData.totalPedidos * 0.95, displayData.totalPedidos],
        },
        {
            id: 'ticket_medio',
            titulo: 'Ticket Médio',
            valor: displayData.ticketMedio,
            valorFormatado: `R$ ${displayData.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            variacao: 3.1,
            tendencia: 'up' as const,
            sparklineData: [displayData.ticketMedio * 0.95, displayData.ticketMedio * 0.97, displayData.ticketMedio * 0.98, displayData.ticketMedio * 0.99, displayData.ticketMedio],
        },
        {
            id: 'clientes_unicos',
            titulo: 'Clientes Únicos',
            valor: displayData.totalClientes,
            valorFormatado: displayData.totalClientes.toLocaleString('pt-BR'),
            variacao: 4.2,
            tendencia: 'up' as const,
            sparklineData: [displayData.totalClientes * 0.85, displayData.totalClientes * 0.88, displayData.totalClientes * 0.92, displayData.totalClientes * 0.96, displayData.totalClientes],
        },
        {
            id: 'investimento_ads',
            titulo: 'Investimento Ads',
            valor: gadsKpis?.spend || 0,
            valorFormatado: gadsKpis?.spend_formatted || 'R$ 0,00',
            variacao: 2.5,
            tendencia: 'stable' as const,
            sparklineData: gadsKpis ? [gadsKpis.spend * 0.9, gadsKpis.spend * 0.92, gadsKpis.spend * 0.95, gadsKpis.spend * 0.98, gadsKpis.spend] : [0, 0, 0, 0, 0],
        },
    ];

    // Calculate ROAS using only Ecommerce spend (campaigns without "Lead")
    const receitaGoogleAds = displayData.receitaGoogleAds || 0;
    const ecommerceSpend = gadsKpis?.segmented?.ecommerce?.spend || 0;
    const roas = receitaGoogleAds > 0 && ecommerceSpend > 0
        ? receitaGoogleAds / ecommerceSpend
        : 0;

    if (roas > 0) {
        kpis.push({
            id: 'roas',
            titulo: 'ROAS (Ecommerce)',
            valor: roas,
            valorFormatado: `${roas.toFixed(2)}x`,
            variacao: 4.2,
            tendencia: roas >= 3 ? 'up' as const : 'stable' as const,
            sparklineData: [roas * 0.85, roas * 0.9, roas * 0.95, roas * 0.98, roas],
        });
    }

    // Chart data
    const atribuicaoData = displayData.byAtribuicao.slice(0, 6).map((c: any, i: number) => ({
        ...c,
        color: COLORS[i % COLORS.length]
    }));

    const categoryData = displayData.byCategory.slice(0, 6).map((c: any, i: number) => ({
        ...c,
        color: COLORS[i % COLORS.length]
    }));

    const trendData = displayData.dailyRevenue;

    return (
        <div className="space-y-6">
            {/* Header with Date Picker */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <PageHeader
                    title="Visão Geral Executiva"
                    description="Visão consolidada de performance • Dados do Magento (BD Mag) e Google Ads"
                    hasRealData={!!catalogoData}
                />
                <GlobalDatePicker />
            </div>

            {/* Filters */}
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
                        options={filterOptions.categorias}
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

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Carregando dados...</p>
                    </div>
                </div>
            )}

            {/* KPIs Principais - 2 rows of 3 */}
            {!loading && kpis.length > 0 && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        KPIs Principais
                    </h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {kpis.slice(0, 3).map((kpi) => (
                            <KPICard key={kpi.id} data={kpi} />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-4">
                        {kpis.slice(3, 6).map((kpi) => (
                            <KPICard key={kpi.id} data={kpi} />
                        ))}
                    </div>
                </section>
            )}

            {/* Investimento Ads Segmentado - Leads vs Ecommerce */}
            {!loading && gadsKpis?.segmented && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Investimento em Ads por Tipo
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Leads */}
                        <Card className="border-border bg-card">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Target className="h-5 w-5 text-blue-500" />
                                        <span className="font-medium">Investimento Leads</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        Meta: R$ {gadsKpis.segmented.leads.meta.toLocaleString('pt-BR')}
                                    </span>
                                </div>
                                <div className="text-2xl font-bold mb-2">
                                    {gadsKpis.segmented.leads.spend_formatted}
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-zinc-700 rounded-full h-2.5">
                                    <div
                                        className={`h-2.5 rounded-full transition-all ${gadsKpis.segmented.leads.percentMeta > 100
                                            ? 'bg-red-500'
                                            : gadsKpis.segmented.leads.percentMeta > 80
                                                ? 'bg-yellow-500'
                                                : 'bg-blue-500'
                                            }`}
                                        style={{ width: `${Math.min(gadsKpis.segmented.leads.percentMeta, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                                    <span>{gadsKpis.segmented.leads.percentMeta.toFixed(1)}% da meta</span>
                                    <span>{gadsKpis.segmented.leads.conversions.toFixed(0)} Leads</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Ecommerce */}
                        <Card className="border-border bg-card">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <ShoppingCart className="h-5 w-5 text-purple-500" />
                                        <span className="font-medium">Investimento Ecommerce</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        Meta: R$ {gadsKpis.segmented.ecommerce.meta.toLocaleString('pt-BR')}
                                    </span>
                                </div>
                                <div className="text-2xl font-bold mb-2">
                                    {gadsKpis.segmented.ecommerce.spend_formatted}
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-zinc-700 rounded-full h-2.5">
                                    <div
                                        className={`h-2.5 rounded-full transition-all ${gadsKpis.segmented.ecommerce.percentMeta > 100
                                            ? 'bg-red-500'
                                            : gadsKpis.segmented.ecommerce.percentMeta > 80
                                                ? 'bg-yellow-500'
                                                : 'bg-purple-500'
                                            }`}
                                        style={{ width: `${Math.min(gadsKpis.segmented.ecommerce.percentMeta, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                                    <span>{gadsKpis.segmented.ecommerce.percentMeta.toFixed(1)}% da meta</span>
                                    <span>{gadsKpis.segmented.ecommerce.conversions.toFixed(0)} Compras</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            )}

            {/* Saúde do Funil */}
            {!loading && gadsKpis && catalogoData && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Saúde do Funil
                    </h2>
                    <Card className="border-border bg-card">
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                {/* Funil sem impressões - começa em Cliques */}
                                {(() => {
                                    const clicks = gadsKpis?.clicks || 0;
                                    const leadsConversions = gadsKpis?.segmented?.leads?.conversions || 0;
                                    const ecommerceConversions = gadsKpis?.segmented?.ecommerce?.conversions || 0;
                                    const pedidos = displayData.totalPedidos || 0;
                                    const receita = displayData.totalReceita || 0;

                                    // Calcular taxas de conversão
                                    const clickToLeads = clicks > 0 ? (leadsConversions / clicks) * 100 : 0;
                                    const clickToCompras = clicks > 0 ? (ecommerceConversions / clicks) * 100 : 0;
                                    const comprasToPedido = ecommerceConversions > 0 ? (pedidos / ecommerceConversions) * 100 : 0;

                                    // Funnel steps sem impressões
                                    const funnelSteps = [
                                        {
                                            name: 'Cliques',
                                            value: clicks,
                                            formatted: clicks.toLocaleString('pt-BR'),
                                            rate: null,
                                            health: 'neutral' as const
                                        },
                                        {
                                            name: 'Leads (GAds)',
                                            value: Math.round(leadsConversions),
                                            formatted: Math.round(leadsConversions).toLocaleString('pt-BR'),
                                            rate: clickToLeads,
                                            health: clickToLeads >= 5 ? 'good' as const : clickToLeads >= 2 ? 'warning' as const : 'bad' as const
                                        },
                                        {
                                            name: 'Compras (GAds)',
                                            value: Math.round(ecommerceConversions),
                                            formatted: Math.round(ecommerceConversions).toLocaleString('pt-BR'),
                                            rate: clickToCompras,
                                            health: clickToCompras >= 3 ? 'good' as const : clickToCompras >= 1.5 ? 'warning' as const : 'bad' as const
                                        },
                                        {
                                            name: 'Pedidos (Magento)',
                                            value: pedidos,
                                            formatted: pedidos.toLocaleString('pt-BR'),
                                            rate: comprasToPedido,
                                            health: comprasToPedido >= 50 ? 'good' as const : comprasToPedido >= 30 ? 'warning' as const : 'bad' as const
                                        },
                                    ];

                                    return funnelSteps.map((step, index) => (
                                        <div key={step.name} className="flex items-center gap-4">
                                            <div className="w-40 flex items-center gap-2">
                                                {step.health === 'good' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                                {step.health === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                                                {step.health === 'bad' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                                {step.health === 'neutral' && <Filter className="h-4 w-4 text-slate-400" />}
                                                <span className="text-sm font-medium">{step.name}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="w-full bg-slate-200 dark:bg-zinc-700 rounded-full h-4 relative overflow-hidden">
                                                    <div
                                                        className={`h-4 rounded-full transition-all ${step.health === 'good' ? 'bg-green-500' :
                                                            step.health === 'warning' ? 'bg-yellow-500' :
                                                                step.health === 'bad' ? 'bg-red-500' :
                                                                    'bg-slate-400'
                                                            }`}
                                                        style={{
                                                            width: `${Math.max((step.value / (funnelSteps[0].value || 1)) * 100, 2)}%`
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="w-24 text-right">
                                                <span className="font-bold">{step.formatted}</span>
                                            </div>
                                            <div className="w-20 text-right">
                                                {step.rate !== null && (
                                                    <span className={`text-sm ${step.health === 'good' ? 'text-green-600' :
                                                        step.health === 'warning' ? 'text-yellow-600' :
                                                            'text-red-600'
                                                        }`}>
                                                        {step.rate.toFixed(1)}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3 text-green-500" /> Saudável
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3 text-yellow-500" /> Atenção
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3 text-red-500" /> Crítico
                                    </span>
                                </div>
                                <div className="text-muted-foreground">
                                    Receita Total: <span className="font-bold text-foreground">R$ {displayData.totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Charts Row 1: Trend + Atribuição Distribution */}
            {!loading && catalogoData && (
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Trend */}
                    <Card className="border-border bg-card h-full">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">Receita Diária (Magento)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#34A853" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#34A853" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(val) => {
                                        if (typeof val === 'string' && val.includes('-')) {
                                            const parts = val.split('-');
                                            if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
                                        }
                                        return val;
                                    }} />
                                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        formatter={(value) => [`R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]}
                                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="receita" name="Receita" stroke="#34A853" fillOpacity={1} fill="url(#colorReceita)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Receita por Atribuição - Horizontal Bar Chart */}
                    <Card className="border-border bg-card h-full">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">Receita por Canal de Origem (Atribuição)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={atribuicaoData} layout="vertical" margin={{ left: 10, right: 40, top: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                    <XAxis
                                        type="number"
                                        tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                                        stroke="var(--muted-foreground)"
                                        fontSize={11}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={100}
                                        stroke="var(--muted-foreground)"
                                        fontSize={11}
                                        tick={{ fill: 'var(--muted-foreground)' }}
                                    />
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
                </section>
            )}

            {/* Revenue by Category with ROAS */}
            {!loading && categoryData.length > 0 && gadsKpis && (
                <section>
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">Receita por Categoria + ROAS</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(() => {
                                // Calcular receita total para proporção
                                const totalReceita = categoryData.reduce((sum: number, c: any) => sum + c.value, 0);
                                const totalInvestimento = gadsKpis?.spend || 0;

                                // Enriquecer categoryData com investimento proporcional e ROAS
                                const enrichedCategories = categoryData.map((cat: any) => {
                                    const shareReceita = totalReceita > 0 ? cat.value / totalReceita : 0;
                                    const investimentoProporcional = totalInvestimento * shareReceita;
                                    const roas = investimentoProporcional > 0 ? cat.value / investimentoProporcional : 0;
                                    return {
                                        ...cat,
                                        investimento: investimentoProporcional,
                                        roas,
                                        shareReceita: shareReceita * 100,
                                    };
                                });

                                return (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Categoria</th>
                                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Receita</th>
                                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">% Share</th>
                                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Invest. (Est.)</th>
                                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">ROAS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {enrichedCategories.map((cat: any, index: number) => (
                                                    <tr key={cat.name} className="border-b border-border/50 hover:bg-muted/50">
                                                        <td className="py-3 px-2">
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className="w-3 h-3 rounded-full"
                                                                    style={{ backgroundColor: cat.color }}
                                                                ></div>
                                                                <span className="font-medium">{cat.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="text-right py-3 px-2 font-mono">
                                                            R$ {cat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="text-right py-3 px-2 text-muted-foreground">
                                                            {cat.shareReceita.toFixed(1)}%
                                                        </td>
                                                        <td className="text-right py-3 px-2 font-mono text-muted-foreground">
                                                            R$ {cat.investimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="text-right py-3 px-2">
                                                            <span className={`font-bold ${cat.roas >= 3 ? 'text-green-600' :
                                                                cat.roas >= 2 ? 'text-yellow-600' :
                                                                    'text-red-600'
                                                                }`}>
                                                                {cat.roas.toFixed(2)}x
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-muted/30 font-bold">
                                                    <td className="py-3 px-2">Total</td>
                                                    <td className="text-right py-3 px-2 font-mono">
                                                        R$ {totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="text-right py-3 px-2">100%</td>
                                                    <td className="text-right py-3 px-2 font-mono">
                                                        R$ {totalInvestimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="text-right py-3 px-2">
                                                        <span className={`${(totalReceita / totalInvestimento) >= 3 ? 'text-green-600' :
                                                            (totalReceita / totalInvestimento) >= 2 ? 'text-yellow-600' :
                                                                'text-red-600'
                                                            }`}>
                                                            {totalInvestimento > 0 ? (totalReceita / totalInvestimento).toFixed(2) : '0.00'}x
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                        <p className="text-xs text-muted-foreground mt-3">
                                            * Investimento estimado proporcionalmente à participação de receita de cada categoria. ROAS = Receita ÷ Investimento.
                                        </p>
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Geographic Map */}
            {!loading && catalogoData && catalogoData.rawData && (
                <section>
                    <BrazilMap rawData={catalogoData.rawData} />
                </section>
            )}
        </div>
    );
}
