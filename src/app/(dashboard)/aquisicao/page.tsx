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

            {/* Charts Row 1: Daily Revenue + Attribution */}
            {!loading && (
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Daily Revenue Trend */}
                    <Card className="border-border bg-card h-full">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">Receita Diária (Magento)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={dailyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorReceitaAq" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(val) => {
                                        if (typeof val === 'string' && val.includes('/')) {
                                            const parts = val.split('/');
                                            if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
                                        }
                                        return val;
                                    }} />
                                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        formatter={(value) => [`R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]}
                                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="receita" name="Receita" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorReceitaAq)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Revenue by Attribution (Magento) */}
                    <Card className="border-border bg-card h-full">
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
