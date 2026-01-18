'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/ui/MockDataBadge';
import { GlobalDatePicker } from '@/components/ui/GlobalDatePicker';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { Package, ShoppingCart, TrendingUp, MapPin, Tag, BarChart3 } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { useCatalogoData } from '@/hooks/useSheetData';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

export default function CatalogoPage() {
    const { data: realData, loading, error } = useCatalogoData();

    // Filter states
    const [filterOrigem, setFilterOrigem] = useState<string | null>(null);
    const [filterMidia, setFilterMidia] = useState<string | null>(null);
    const [filterCategoria, setFilterCategoria] = useState<string | null>(null);
    const [filterAtribuicao, setFilterAtribuicao] = useState<string | null>(null);

    // Filter options from data
    const filterOptions = realData?.filterOptions || {
        origens: [],
        midias: [],
        categorias: [],
        atribuicoes: [],
    };

    // Filtered data based on selected filters
    const filteredData = useMemo(() => {
        if (!realData?.rawData) return null;

        let filtered = realData.rawData.filter((d: any) =>
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

        // Top SKUs
        const skuRevenue: { [key: string]: { nome: string; receita: number; qtd: number } } = {};
        filtered.forEach((d: any) => {
            const sku = d.mpn || d.nomeProduto || 'Sem SKU';
            const nome = d.nomeProduto || sku;
            if (!skuRevenue[sku]) skuRevenue[sku] = { nome, receita: 0, qtd: 0 };
            skuRevenue[sku].receita += d.receitaProduto || 0;
            skuRevenue[sku].qtd += 1;
        });
        const topSkus = Object.entries(skuRevenue)
            .map(([sku, data]) => ({ sku, ...data }))
            .sort((a, b) => b.receita - a.receita)
            .slice(0, 10);

        // By Category
        const categoryRevenue: { [key: string]: number } = {};
        filtered.forEach((d: any) => {
            const cat = d.categoria?.split(',')[0]?.trim() || 'Sem Categoria';
            categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (d.receitaProduto || 0);
        });
        const byCategory = Object.entries(categoryRevenue)
            .map(([name, value]) => ({ name: name.length > 25 ? name.substring(0, 25) + '...' : name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);

        // By State
        const stateRevenue: { [key: string]: number } = {};
        filtered.forEach((d: any) => {
            const state = d.estado || 'Não informado';
            stateRevenue[state] = (stateRevenue[state] || 0) + (d.receitaProduto || 0);
        });
        const byState = Object.entries(stateRevenue)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);

        return {
            totalReceita,
            totalPedidos,
            ticketMedio,
            totalClientes: uniqueClients.size,
            topSkus,
            byCategory,
            byState,
        };
    }, [realData, filterOrigem, filterMidia, filterCategoria, filterAtribuicao]);

    // Use filtered data or default from API
    const displayData = filteredData || {
        totalReceita: realData?.totalReceita || 0,
        totalPedidos: realData?.totalPedidos || 0,
        ticketMedio: realData?.ticketMedio || 0,
        totalClientes: realData?.totalClientes || 0,
        topSkus: realData?.topSkus || [],
        byCategory: realData?.byCategory || [],
        byState: realData?.byState || [],
    };

    // Build KPIs
    const kpis = [
        {
            id: 'receita_total',
            titulo: 'Receita Total',
            valor: displayData.totalReceita,
            valorFormatado: `R$ ${displayData.totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            variacao: 0,
            tendencia: 'up' as const,
            sparklineData: [displayData.totalReceita * 0.8, displayData.totalReceita * 0.9, displayData.totalReceita * 0.95, displayData.totalReceita],
        },
        {
            id: 'total_pedidos',
            titulo: 'Total de Pedidos',
            valor: displayData.totalPedidos,
            valorFormatado: displayData.totalPedidos.toLocaleString('pt-BR'),
            variacao: 0,
            tendencia: 'up' as const,
            sparklineData: [displayData.totalPedidos * 0.8, displayData.totalPedidos * 0.9, displayData.totalPedidos * 0.95, displayData.totalPedidos],
        },
        {
            id: 'ticket_medio',
            titulo: 'Ticket Médio',
            valor: displayData.ticketMedio,
            valorFormatado: `R$ ${displayData.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            variacao: 0,
            tendencia: 'up' as const,
            sparklineData: [displayData.ticketMedio * 0.95, displayData.ticketMedio * 0.98, displayData.ticketMedio * 0.99, displayData.ticketMedio],
        },
        {
            id: 'total_clientes',
            titulo: 'Clientes Únicos',
            valor: displayData.totalClientes,
            valorFormatado: displayData.totalClientes.toLocaleString('pt-BR'),
            variacao: 0,
            tendencia: 'up' as const,
            sparklineData: [displayData.totalClientes * 0.85, displayData.totalClientes * 0.9, displayData.totalClientes * 0.95, displayData.totalClientes],
        },
    ];

    // Chart data
    const topSkuData = displayData.topSkus?.slice(0, 8).map((sku: any, i: number) => ({
        name: sku.nome?.length > 30 ? sku.nome.substring(0, 30) + '...' : sku.nome,
        receita: sku.receita,
        color: COLORS[i % COLORS.length]
    })) || [];

    const categoryData = displayData.byCategory?.slice(0, 6).map((cat: any, i: number) => ({
        ...cat,
        color: COLORS[i % COLORS.length]
    })) || [];

    const stateData = displayData.byState?.slice(0, 8).map((st: any, i: number) => ({
        ...st,
        color: COLORS[i % COLORS.length]
    })) || [];

    return (
        <div className="space-y-6">
            {/* Header with Date Picker */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <PageHeader
                    title="Catálogo de Produtos"
                    description="Performance de produtos, categorias e regiões • Dados do BD Mag"
                    hasRealData={!!realData}
                />
                <GlobalDatePicker />
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Carregando dados do Magento...</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <Card className="border-destructive bg-destructive/10">
                    <CardContent className="pt-6">
                        <p className="text-destructive">Erro ao carregar dados: {error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            {!loading && realData && (
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
            {!loading && realData && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Indicadores de Vendas
                    </h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {kpis.map((kpi) => (
                            <KPICard key={kpi.id} data={kpi} />
                        ))}
                    </div>
                </section>
            )}

            {/* Charts Row 1: Category + Top Products */}
            {!loading && realData && (
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue by Category (Bar Chart) */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Tag className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">Receita por Categoria</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 40, top: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} stroke="var(--muted-foreground)" fontSize={11} />
                                    <YAxis type="category" dataKey="name" width={150} stroke="var(--muted-foreground)" fontSize={10} />
                                    <Tooltip
                                        formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="value" name="Receita" radius={[0, 6, 6, 0]}>
                                        {categoryData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Top Products */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">Top Produtos por Receita</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={topSkuData} layout="vertical" margin={{ left: 10, right: 40, top: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} stroke="var(--muted-foreground)" fontSize={11} />
                                    <YAxis type="category" dataKey="name" width={180} stroke="var(--muted-foreground)" fontSize={9} />
                                    <Tooltip
                                        formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="receita" name="Receita" radius={[0, 6, 6, 0]}>
                                        {topSkuData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Charts Row 2: Revenue by State */}
            {!loading && realData && (
                <section>
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">Receita por Estado</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={stateData} layout="vertical" margin={{ left: 10, right: 40, top: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} stroke="var(--muted-foreground)" fontSize={11} />
                                    <YAxis type="category" dataKey="name" width={100} stroke="var(--muted-foreground)" fontSize={11} />
                                    <Tooltip
                                        formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="value" name="Receita" fill="#10b981" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </section>
            )}
        </div>
    );
}
