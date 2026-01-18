'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/ui/MockDataBadge';
import { GlobalDatePicker } from '@/components/ui/GlobalDatePicker';
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

    // Prepare attribution data from Magento
    const atribuicaoData = catalogoData?.byAtribuicao?.slice(0, 6).map((item: any, index: number) => ({
        ...item,
        color: COLORS[index % COLORS.length]
    })) || [];

    // Daily revenue from Magento
    const dailyRevenue = catalogoData?.dailyRevenue?.slice(-14) || [];

    // KPIs from both sources
    const kpis = [
        {
            id: 'receita',
            titulo: 'Receita (Magento)',
            valor: catalogoData?.totalReceita || 0,
            valorFormatado: catalogoData?.totalReceita_formatted || 'R$ 0,00',
            variacao: 8.5,
            tendencia: 'up' as const,
            sparklineData: [1, 1.1, 1.2, 1.15, 1.3],
        },
        {
            id: 'pedidos',
            titulo: 'Pedidos (Magento)',
            valor: catalogoData?.totalPedidos || 0,
            valorFormatado: (catalogoData?.totalPedidos || 0).toLocaleString('pt-BR'),
            variacao: 5.2,
            tendencia: 'up' as const,
            sparklineData: [1, 1.05, 1.1, 1.08, 1.15],
        },
        {
            id: 'ticket',
            titulo: 'Ticket Médio',
            valor: catalogoData?.ticketMedio || 0,
            valorFormatado: catalogoData?.ticketMedio_formatted || 'R$ 0,00',
            variacao: 3.1,
            tendencia: 'stable' as const,
            sparklineData: [1, 1.01, 1.02, 1.015, 1.03],
        },
        {
            id: 'clientes',
            titulo: 'Clientes Únicos',
            valor: catalogoData?.totalClientes || 0,
            valorFormatado: (catalogoData?.totalClientes || 0).toLocaleString('pt-BR'),
            variacao: 4.2,
            tendencia: 'up' as const,
            sparklineData: [1, 1.02, 1.05, 1.04, 1.08],
        },
    ];

    // GA4 revenue by channel formatted
    const totalGA4Revenue = ga4Kpis?.totalRevenue || 0;

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
                                        if (typeof val === 'string' && val.includes('-')) {
                                            const parts = val.split('-');
                                            if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
                                        }
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
                                    <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-lg">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Conversão Est.</p>
                                        <p className="text-xl font-bold text-card-foreground">
                                            {ga4Kpis.totalTransactions && totalGA4Revenue ? ((ga4Kpis.totalTransactions / totalGA4Revenue) * 100).toFixed(2) : '0'}%
                                        </p>
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

            {/* Revenue by Category and State (Magento) */}
            {!loading && catalogoData && (
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* By Category */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">Receita por Categoria (Magento)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart
                                    data={catalogoData.byCategory?.slice(0, 5).map((item: any, i: number) => ({ ...item, color: COLORS[i % COLORS.length] }))}
                                    layout="vertical"
                                    margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} stroke="var(--muted-foreground)" fontSize={10} />
                                    <YAxis type="category" dataKey="name" width={120} stroke="var(--muted-foreground)" fontSize={9} tickFormatter={(v) => v.length > 20 ? v.substring(0, 20) + '...' : v} />
                                    <Tooltip
                                        formatter={(value) => [`R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="value" name="Receita" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* By State */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">Receita por Estado (Magento)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart
                                    data={catalogoData.byState?.slice(0, 8).map((item: any, i: number) => ({ ...item, color: COLORS[i % COLORS.length] }))}
                                    layout="vertical"
                                    margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} stroke="var(--muted-foreground)" fontSize={10} />
                                    <YAxis type="category" dataKey="name" width={100} stroke="var(--muted-foreground)" fontSize={10} />
                                    <Tooltip
                                        formatter={(value) => [`R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
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
