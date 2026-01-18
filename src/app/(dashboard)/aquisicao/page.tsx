'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/ui/MockDataBadge';
import { GlobalDatePicker } from '@/components/ui/GlobalDatePicker';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { useCatalogoData, useGA4KPIs } from '@/hooks/useSheetData';
import {
    BarChart3, Activity, DollarSign, ShoppingCart, Users, TrendingUp
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, Legend, Cell
} from 'recharts';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

export default function AquisicaoPage() {
    // BD Mag data for Receita, Transações, Ticket Médio
    const { data: catalogoData, loading: loadingCatalogo } = useCatalogoData();
    // BD GA4 data for site metrics (sessions by channel)
    const { kpis: ga4Kpis, loading: loadingGA4 } = useGA4KPIs();

    const loading = loadingCatalogo || loadingGA4;

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
        const uniqueClients = new Set(filtered.map((d: any) => d.cpfCliente).filter(Boolean));

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
            const cat = d.categoria?.split(',')[0]?.trim() || 'Sem Categoria';
            categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (d.receitaProduto || 0);
        });
        const byCategory = Object.entries(categoryRevenue)
            .map(([name, value]) => ({ name: name.length > 25 ? name.substring(0, 25) + '...' : name, value }))
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
            .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime());

        return {
            totalReceita,
            totalPedidos,
            ticketMedio,
            totalClientes: uniqueClients.size,
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
        byAtribuicao: catalogoData?.byAtribuicao || [],
        byCategory: catalogoData?.byCategory || [],
        dailyRevenue: catalogoData?.dailyRevenue || [],
    };

    // Prepare channel data from GA4
    const channelData = ga4Kpis?.byChannel ? Object.entries(ga4Kpis.byChannel)
        .map(([name, value], index) => ({
            name: name === 'googleCPC' ? 'Google Ads' :
                name === 'blueCPC' ? 'Meta Ads' :
                    name === 'organic' ? 'Orgânico' :
                        name === 'direct' ? 'Direto' :
                            name === 'email' ? 'E-mail' :
                                name === 'social' ? 'Social' : name,
            value: Number(value) || 0,
            color: COLORS[index % COLORS.length]
        }))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value) : [];

    // Prepare attribution data from filtered Magento data
    const atribuicaoData = displayData.byAtribuicao?.slice(0, 6).map((item: any, index: number) => ({
        ...item,
        color: COLORS[index % COLORS.length]
    })) || [];

    // Daily revenue
    const dailyRevenue = displayData.dailyRevenue?.slice(-14) || [];

    // KPIs from both sources
    const kpis = [
        {
            id: 'receita',
            titulo: 'Receita (Magento)',
            valor: displayData.totalReceita,
            valorFormatado: `R$ ${displayData.totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            variacao: 8.5,
            tendencia: 'up' as const,
            sparklineData: [1, 1.1, 1.2, 1.15, 1.3],
        },
        {
            id: 'pedidos',
            titulo: 'Pedidos (Magento)',
            valor: displayData.totalPedidos,
            valorFormatado: displayData.totalPedidos.toLocaleString('pt-BR'),
            variacao: 5.2,
            tendencia: 'up' as const,
            sparklineData: [1, 1.05, 1.1, 1.08, 1.15],
        },
        {
            id: 'ticket',
            titulo: 'Ticket Médio',
            valor: displayData.ticketMedio,
            valorFormatado: `R$ ${displayData.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            variacao: 3.1,
            tendencia: 'stable' as const,
            sparklineData: [1, 1.01, 1.02, 1.015, 1.03],
        },
        {
            id: 'clientes',
            titulo: 'Clientes Únicos',
            valor: displayData.totalClientes,
            valorFormatado: displayData.totalClientes.toLocaleString('pt-BR'),
            variacao: 4.2,
            tendencia: 'up' as const,
            sparklineData: [1, 1.02, 1.05, 1.04, 1.08],
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header with Date Picker */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <PageHeader
                    title="Aquisição & Tráfego"
                    description="Performance de canais e atribuição • Dados do BD Mag (pedidos) e BD GA4 (sessões)"
                    hasRealData={!!catalogoData && !!ga4Kpis}
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

            {/* KPIs Principais (from Magento) */}
            {!loading && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        KPIs de Vendas (BD Mag)
                    </h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {kpis.map((kpi) => (
                            <KPICard key={kpi.id} data={kpi} />
                        ))}
                    </div>
                </section>
            )}

            {/* Interactive Timeline Chart */}
            {!loading && (
                <section className="col-span-1 md:col-span-2 lg:col-span-4">
                    <InteractiveTimelineChart displayData={displayData} ga4Kpis={ga4Kpis} />
                </section>
            )}

            {/* Revenue by Atribuição & Category */}
            {!loading && (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-border bg-card h-full">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">Receita por Categoria</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={displayData.byCategory} layout="vertical" margin={{ left: 10, right: 40, top: 10, bottom: 10 }}>
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
                                        width={120}
                                        stroke="var(--muted-foreground)"
                                        fontSize={11}
                                        tick={{ fill: 'var(--muted-foreground)' }}
                                    />
                                    <Tooltip
                                        formatter={(value) => [`R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="value" name="Receita" radius={[0, 6, 6, 0]}>
                                        {displayData.byCategory.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card h-full">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">Receita por Canal (Atribuição)</CardTitle>
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
                                    <Bar dataKey="value" name="Receita" radius={[0, 6, 6, 0]} >
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

            {/* GA4 Section: Sessions/Revenue by Channel */}
            {!loading && ga4Kpis && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Dados de Sessões (BD GA4)
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* GA4 KPIs */}
                        <Card className="border-border bg-card">
                            <CardHeader className="flex flex-row items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                <CardTitle className="text-sm font-medium text-card-foreground">Métricas GA4</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-lg">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Receita GA4</p>
                                        <p className="text-xl font-bold text-card-foreground">{ga4Kpis.totalRevenue_formatted}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-lg">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Transações GA4</p>
                                        <p className="text-xl font-bold text-card-foreground">{ga4Kpis.totalTransactions?.toLocaleString('pt-BR')}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-lg">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Ticket Médio GA4</p>
                                        <p className="text-xl font-bold text-card-foreground">{ga4Kpis.ticketMedio_formatted}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Revenue by Channel (GA4) */}
                        <Card className="border-border bg-card">
                            <CardHeader className="flex flex-row items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                <CardTitle className="text-sm font-medium text-card-foreground">Receita por Canal (GA4)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={channelData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                        <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} stroke="var(--muted-foreground)" fontSize={10} />
                                        <YAxis type="category" dataKey="name" width={70} stroke="var(--muted-foreground)" fontSize={10} />
                                        <Tooltip
                                            formatter={(value) => [`R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                                            contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                        />
                                        <Bar dataKey="value" name="Receita" radius={[0, 4, 4, 0]}>
                                            {channelData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            )}
        </div>
    );
}

// Sub-component for Interactive Chart to handle its own state
function InteractiveTimelineChart({ displayData, ga4Kpis }: { displayData: any, ga4Kpis: any }) {
    const [visibleMetrics, setVisibleMetrics] = useState({
        receita: true,
        pedidos: false,
        sessoes: true
    });

    // Merge data - this logic needs to be robust to missing dates in either source
    const mergedData = useMemo(() => {
        const magentoData = displayData.dailyRevenue || [];
        // GA4 dailyTrend might need better typing or check
        const ga4Data = ga4Kpis?.dailyTrend || [];

        const dataMap: { [key: string]: any } = {};

        magentoData.forEach((d: any) => {
            const dateKey = d.date;
            if (!dataMap[dateKey]) dataMap[dateKey] = { date: dateKey };
            dataMap[dateKey].receita = d.receita;
            dataMap[dateKey].pedidos = d.pedidos;
        });

        ga4Data.forEach((d: any) => {
            // Let's normalize to DD/MM/YYYY if possible
            let dateKey = d.date;
            if (d.date.includes('-')) {
                const parts = d.date.split('-');
                if (parts[0].length === 4) dateKey = `${parts[2]}/${parts[1]}/${parts[0]}`;
            }

            if (!dataMap[dateKey]) dataMap[dateKey] = { date: dateKey };
            dataMap[dateKey].sessoes = d.sessions;
        });

        return Object.values(dataMap).sort((a: any, b: any) => {
            const dateA = a.date.split('/').reverse().join('-');
            const dateB = b.date.split('/').reverse().join('-');
            return new Date(dateA).getTime() - new Date(dateB).getTime();
        });
    }, [displayData, ga4Kpis]);

    return (
        <Card className="border-border bg-card">
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-row items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm font-medium text-card-foreground">Evolução de Performance (Interativo)</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={visibleMetrics.receita}
                            onChange={(e) => setVisibleMetrics(prev => ({ ...prev, receita: e.target.checked }))}
                            className="accent-emerald-500 rounded w-4 h-4"
                        />
                        <span className="text-emerald-600 dark:text-emerald-400">Receita</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={visibleMetrics.pedidos}
                            onChange={(e) => setVisibleMetrics(prev => ({ ...prev, pedidos: e.target.checked }))}
                            className="accent-blue-500 rounded w-4 h-4"
                        />
                        <span className="text-blue-600 dark:text-blue-400">Pedidos</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={visibleMetrics.sessoes}
                            onChange={(e) => setVisibleMetrics(prev => ({ ...prev, sessoes: e.target.checked }))}
                            className="accent-amber-500 rounded w-4 h-4"
                        />
                        <span className="text-amber-600 dark:text-amber-400">Sessões</span>
                    </label>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mergedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorSessoes" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="var(--muted-foreground)"
                                fontSize={11}
                                tickFormatter={(val) => val ? val.substring(0, 5) : ''}
                            />

                            <YAxis
                                yAxisId="left"
                                orientation="left"
                                stroke="#10b981"
                                fontSize={11}
                                tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                                hide={!visibleMetrics.receita}
                            />

                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="var(--muted-foreground)"
                                fontSize={11}
                                hide={!visibleMetrics.pedidos && !visibleMetrics.sessoes}
                            />

                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                labelStyle={{ color: 'var(--foreground)' }}
                            />
                            <Legend />

                            {visibleMetrics.receita && (
                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="receita"
                                    name="Receita"
                                    stroke="#10b981"
                                    fillOpacity={1}
                                    fill="url(#colorReceita)"
                                    strokeWidth={2}
                                />
                            )}

                            {visibleMetrics.pedidos && (
                                <Area
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="pedidos"
                                    name="Pedidos"
                                    stroke="#3b82f6"
                                    fill="transparent"
                                    strokeWidth={2}
                                />
                            )}

                            {visibleMetrics.sessoes && (
                                <Area
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="sessoes"
                                    name="Sessões"
                                    stroke="#f59e0b"
                                    fillOpacity={1}
                                    fill="url(#colorSessoes)"
                                    strokeWidth={2}
                                />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
