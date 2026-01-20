'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/kpi/KPICard';
import { PageFilters } from '@/components/ui/PageFilters';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { useGoogleAdsKPIs, useCatalogoData, useGA4KPIs } from '@/hooks/useSheetData';
import {
    TrendingUp, TrendingDown, DollarSign, Target, ShoppingCart, Activity, BarChart3, Users, AlertTriangle, CheckCircle, Lightbulb, Clock, Zap, Package, MapPin
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
    AreaChart, Area, Legend, PieChart, Pie, LineChart, Line, FunnelChart, Funnel, ComposedChart
} from 'recharts';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];
const FUNNEL_COLORS = ['#94a3b8', '#4285F4', '#60a5fa', '#FBBC05', '#EA4335', '#34A853'];

export default function EcommercePage() {
    const { kpis: gadsKpis, loading: loadingGads } = useGoogleAdsKPIs();
    const { data: catalogoData, loading: loadingCatalogo } = useCatalogoData();
    const { kpis: ga4Kpis, loading: loadingGA4 } = useGA4KPIs();

    const loading = loadingGads || loadingCatalogo || loadingGA4;

    const [filterOrigem, setFilterOrigem] = useState<string | null>(null);
    const [filterAtribuicao, setFilterAtribuicao] = useState<string | null>(null);
    const [filterCategoria, setFilterCategoria] = useState<string | null>(null);

    const filterOptions = catalogoData?.filterOptions || { origens: [], atribuicoes: [], categorias: [] };

    // Analytics and Insights
    const analytics = useMemo(() => {
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
        if (filterAtribuicao) filtered = filtered.filter((d: any) => d.atribuicao === filterAtribuicao);
        if (filterCategoria) filtered = filtered.filter((d: any) => d.categoria?.includes(filterCategoria));

        // Basic metrics
        const totalReceita = filtered.reduce((sum: number, d: any) => sum + (d.receitaProduto || 0), 0);
        const uniqueOrders = new Set(filtered.map((d: any) => d.pedido).filter(Boolean));
        const totalPedidos = uniqueOrders.size || filtered.length;
        const ticketMedio = totalPedidos > 0 ? totalReceita / totalPedidos : 0;
        const uniqueClients = new Set(filtered.map((d: any) => d.cpfCliente).filter(Boolean));

        // Attribution analysis
        const atribuicaoRevenue: { [key: string]: { receita: number; pedidos: number } } = {};
        filtered.forEach((d: any) => {
            const atrib = d.atribuicao || 'Não identificado';
            if (!atribuicaoRevenue[atrib]) atribuicaoRevenue[atrib] = { receita: 0, pedidos: 0 };
            atribuicaoRevenue[atrib].receita += d.receitaProduto || 0;
            atribuicaoRevenue[atrib].pedidos += 1;
        });

        const byAtribuicao = Object.entries(atribuicaoRevenue)
            .map(([name, data]) => ({
                name,
                value: data.receita,
                receita: data.receita,
                pedidos: data.pedidos,
                ticketMedio: data.pedidos > 0 ? data.receita / data.pedidos : 0
            }))
            .sort((a, b) => b.receita - a.receita);

        // Best channel analysis
        const bestChannel = byAtribuicao[0];

        // Daily revenue trend
        const dailyMap: { [key: string]: { receita: number; pedidos: number } } = {};
        filtered.forEach((d: any) => {
            const dateRaw = d.data || d.dataTransacao;
            if (dateRaw) {
                const key = dateRaw.split(' ')[0];
                if (!dailyMap[key]) dailyMap[key] = { receita: 0, pedidos: 0 };
                dailyMap[key].receita += d.receitaProduto || 0;
                dailyMap[key].pedidos += 1;
            }
        });
        const dailyTrend = Object.entries(dailyMap)
            .map(([date, val]) => ({ date, ...val }))
            .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime())
            .slice(-14);

        // Calculate trend (last 7 days vs previous 7 days)
        const recentDays = dailyTrend.slice(-7);
        const previousDays = dailyTrend.slice(-14, -7);
        const recentRevenue = recentDays.reduce((s, d) => s + d.receita, 0);
        const previousRevenue = previousDays.reduce((s, d) => s + d.receita, 0);
        const trendPercent = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue * 100) : 0;

        // Hour analysis for peak hours
        const hourlyMap: { [key: number]: { receita: number; pedidos: number } } = {};
        for (let i = 0; i < 24; i++) hourlyMap[i] = { receita: 0, pedidos: 0 };
        filtered.forEach((d: any) => {
            const hora = d.hora || d.horaSimples;
            if (hora) {
                const hour = parseInt(hora.toString().split(':')[0]);
                if (!isNaN(hour) && hour >= 0 && hour < 24) {
                    hourlyMap[hour].receita += d.receitaProduto || 0;
                    hourlyMap[hour].pedidos += 1;
                }
            }
        });
        const peakHour = Object.entries(hourlyMap).sort((a, b) => b[1].receita - a[1].receita)[0];

        const hourlyData = Object.entries(hourlyMap).map(([hour, data]) => ({
            hour: parseInt(hour),
            receita: data.receita,
            pedidos: data.pedidos
        }));

        // Category performance
        const categoryMap: { [key: string]: { receita: number; pedidos: number } } = {};
        filtered.forEach((d: any) => {
            const cat = d.categoria?.split(',')[0]?.trim();
            if (cat && cat !== '') {
                if (!categoryMap[cat]) categoryMap[cat] = { receita: 0, pedidos: 0 };
                categoryMap[cat].receita += d.receitaProduto || 0;
                categoryMap[cat].pedidos += 1;
            }
        });
        const topCategories = Object.entries(categoryMap)
            .map(([name, data]) => ({ name: name.length > 25 ? name.substring(0, 25) + '...' : name, ...data }))
            .sort((a, b) => b.receita - a.receita)
            .slice(0, 8);

        // Top Products
        const productMap: { [key: string]: { receita: number; quantidade: number } } = {};
        filtered.forEach((d: any) => {
            const prod = d.nomeProduto || d.sku;
            if (prod) {
                if (!productMap[prod]) productMap[prod] = { receita: 0, quantidade: 0 };
                productMap[prod].receita += d.receitaProduto || 0;
                productMap[prod].quantidade += d.quantidade || 1;
            }
        });
        const topProducts = Object.entries(productMap)
            .map(([name, data]) => ({ name: name.length > 30 ? name.substring(0, 30) + '...' : name, ...data }))
            .sort((a, b) => b.receita - a.receita)
            .slice(0, 10);

        // Revenue by State
        const stateMap: { [key: string]: number } = {};
        filtered.forEach((d: any) => {
            const state = d.estado || d.uf;
            if (state) {
                stateMap[state] = (stateMap[state] || 0) + (d.receitaProduto || 0);
            }
        });
        const byState = Object.entries(stateMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        // ROAS calculation
        const receitaGoogleAds = filtered
            .filter((d: any) => d.atribuicao === 'Google_Ads')
            .reduce((sum: number, d: any) => sum + (d.receitaProduto || 0), 0);

        return {
            totalReceita,
            totalPedidos,
            ticketMedio,
            totalClientes: uniqueClients.size,
            byAtribuicao,
            bestChannel,
            hourlyData,
            dailyTrend,
            trendPercent,
            peakHour,
            topCategories,
            topProducts,
            byState,
            receitaGoogleAds,
        };
    }, [catalogoData, filterOrigem, filterAtribuicao, filterCategoria]);

    // Funnel data
    const funnelMetrics = {
        clicks: gadsKpis?.clicks || 0,
        impressions: (gadsKpis?.clicks || 0) * 50,
        conversionsGads: gadsKpis?.conversions || 0,
        pedidos: analytics?.totalPedidos || 0,
    };

    const funnelData = [
        { name: 'Impressões', value: funnelMetrics.impressions, fill: FUNNEL_COLORS[0] },
        { name: 'Cliques', value: funnelMetrics.clicks, fill: FUNNEL_COLORS[1] },
        { name: 'Conversões GAds', value: Math.round(funnelMetrics.conversionsGads), fill: FUNNEL_COLORS[2] },
        { name: 'Pedidos', value: funnelMetrics.pedidos, fill: FUNNEL_COLORS[4] },
    ];

    // ROAS
    const roas = analytics?.receitaGoogleAds && gadsKpis?.spend > 0
        ? analytics.receitaGoogleAds / gadsKpis.spend : 0;

    // Conversion rates
    const rates = {
        ctr: funnelMetrics.impressions > 0 ? (funnelMetrics.clicks / funnelMetrics.impressions * 100).toFixed(2) : '0',
        conversionRate: funnelMetrics.clicks > 0 ? (funnelMetrics.conversionsGads / funnelMetrics.clicks * 100).toFixed(2) : '0',
    };

    // Generate intelligent insights
    const insights = useMemo(() => {
        if (!analytics) return [];

        const result: { type: 'alert' | 'success' | 'insight'; icon: any; title: string; description: string }[] = [];

        // ROAS insight
        if (roas < 2) {
            result.push({
                type: 'alert',
                icon: AlertTriangle,
                title: 'ROAS Abaixo do Ideal',
                description: `ROAS atual de ${roas.toFixed(2)}x. Otimize campanhas ou pause as de pior desempenho.`
            });
        } else if (roas >= 4) {
            result.push({
                type: 'success',
                icon: CheckCircle,
                title: 'ROAS Excelente',
                description: `ROAS de ${roas.toFixed(2)}x. Campanhas altamente rentáveis. Considere escalar!`
            });
        }

        // Trend insight
        if (analytics.trendPercent < -10) {
            result.push({
                type: 'alert',
                icon: TrendingDown,
                title: 'Queda nas Vendas',
                description: `Receita caiu ${Math.abs(analytics.trendPercent).toFixed(1)}% nos últimos 7 dias.`
            });
        } else if (analytics.trendPercent > 10) {
            result.push({
                type: 'success',
                icon: TrendingUp,
                title: 'Crescimento Acelerado',
                description: `Receita cresceu ${analytics.trendPercent.toFixed(1)}% nos últimos 7 dias!`
            });
        }

        // Peak hour insight
        if (analytics.peakHour) {
            result.push({
                type: 'insight',
                icon: Clock,
                title: 'Horário de Pico',
                description: `${parseInt(analytics.peakHour[0])}h é o horário com maior faturamento.`
            });
        }

        // Best channel insight
        if (analytics.bestChannel) {
            result.push({
                type: 'insight',
                icon: Zap,
                title: 'Canal Mais Rentável',
                description: `${analytics.bestChannel.name} gera R$ ${(analytics.bestChannel.receita / 1000).toFixed(1)}k.`
            });
        }

        return result;
    }, [analytics, roas]);

    // KPIs
    const kpis = [
        {
            id: 'receita',
            titulo: 'Receita Total',
            valor: analytics?.totalReceita || 0,
            valorFormatado: `R$ ${(analytics?.totalReceita || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            variacao: analytics?.trendPercent || 0,
            tendencia: (analytics?.trendPercent || 0) >= 0 ? 'up' as const : 'down' as const,
            sparklineData: [1, 1.02, 1.05, 1.08, 1.1],
        },
        {
            id: 'pedidos',
            titulo: 'Total Pedidos',
            valor: analytics?.totalPedidos || 0,
            valorFormatado: (analytics?.totalPedidos || 0).toLocaleString('pt-BR'),
            variacao: 5.2,
            tendencia: 'up' as const,
            sparklineData: [1, 1.01, 1.03, 1.04, 1.06],
        },
        {
            id: 'ticket',
            titulo: 'Ticket Médio',
            valor: analytics?.ticketMedio || 0,
            valorFormatado: `R$ ${(analytics?.ticketMedio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            variacao: 3.1,
            tendencia: 'stable' as const,
            sparklineData: [1, 1, 1.01, 1.02, 1.03],
        },
        {
            id: 'roas',
            titulo: 'ROAS',
            valor: roas,
            valorFormatado: `${roas.toFixed(2)}x`,
            variacao: roas >= 3 ? 5.0 : -2.0,
            tendencia: roas >= 3 ? 'up' as const : 'down' as const,
            sparklineData: [1, 1.01, 1.03, 1.04, 1.05],
        },
    ];

    return (
        <div className="space-y-6">
            <PageFilters
                title="Ecommerce"
                description="Análise completa de vendas e performance • Dados do BD Mag, Google Ads e GA4"
            >
                <FilterDropdown label="Origem" options={filterOptions.origens} value={filterOrigem} onChange={setFilterOrigem} />
                <FilterDropdown label="Atribuição" options={filterOptions.atribuicoes} value={filterAtribuicao} onChange={setFilterAtribuicao} />
                <FilterDropdown label="Categoria" options={filterOptions.categorias} value={filterCategoria} onChange={setFilterCategoria} />
            </PageFilters>

            {loading && (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}

            {/* Intelligent Insights Panel */}
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

            {/* KPIs */}
            {!loading && (
                <section>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {kpis.map((kpi) => (
                            <KPICard key={kpi.id} data={kpi} compact />
                        ))}
                    </div>
                </section>
            )}

            {/* Funnel + Conversion Rates */}
            {!loading && (
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Conversion Funnel */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium">Funil de Conversão</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={funnelData} layout="vertical" margin={{ left: 10, right: 60, top: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} stroke="var(--muted-foreground)" fontSize={10} />
                                    <YAxis type="category" dataKey="name" width={110} stroke="var(--muted-foreground)" fontSize={11} />
                                    <Tooltip formatter={(value: any) => [value.toLocaleString('pt-BR'), 'Quantidade']} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {funnelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                        <LabelList dataKey="value" position="right" formatter={(v: any) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} style={{ fill: 'var(--muted-foreground)', fontSize: '11px' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Conversion Rates */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium">Taxas de Conversão</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">CTR</p>
                                    <p className="text-2xl font-bold">{rates.ctr}%</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Conv. Rate</p>
                                    <p className="text-2xl font-bold">{rates.conversionRate}%</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">ROAS</p>
                                    <p className="text-2xl font-bold text-emerald-600">{roas.toFixed(2)}x</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Investimento</p>
                                    <p className="text-2xl font-bold">{gadsKpis?.spend_formatted || 'R$ 0'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Revenue Trend + Attribution */}
            {!loading && analytics && (
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Daily Trend */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium">Tendência de Receita (14 dias)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={analytics.dailyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorReceita2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={10} />
                                    <YAxis stroke="var(--muted-foreground)" fontSize={10} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                    <Area type="monotone" dataKey="receita" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorReceita2)" name="Receita" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Revenue by Attribution */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium">Receita por Atribuição</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={analytics.byAtribuicao.slice(0, 6)} layout="vertical" margin={{ left: 10, right: 60, top: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} stroke="var(--muted-foreground)" fontSize={10} />
                                    <YAxis type="category" dataKey="name" width={100} stroke="var(--muted-foreground)" fontSize={10} />
                                    <Tooltip formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {analytics.byAtribuicao.slice(0, 6).map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                        <LabelList dataKey="value" position="right" formatter={(v: any) => `R$ ${(Number(v) / 1000).toFixed(1)}k`} style={{ fill: 'var(--muted-foreground)', fontSize: '10px' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Category + Top Products */}
            {!loading && analytics && (
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Categories */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium">Top Categorias por Receita</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analytics.topCategories} margin={{ top: 20, right: 30, left: 0, bottom: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={9} angle={-45} textAnchor="end" height={80} />
                                    <YAxis stroke="var(--muted-foreground)" fontSize={10} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                    <Bar dataKey="receita" fill="#10b981" radius={[4, 4, 0, 0]} name="Receita">
                                        {analytics.topCategories.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Top Products Table */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium">Top 10 Produtos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-[300px] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-card">
                                        <tr className="border-b border-border">
                                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Produto</th>
                                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">Receita</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics.topProducts.map((prod, i) => (
                                            <tr key={i} className="border-b border-border last:border-0">
                                                <td className="py-2 px-2 text-xs">{prod.name}</td>
                                                <td className="py-2 px-2 text-right text-xs font-medium text-emerald-600">
                                                    R$ {prod.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

            {/* Peak Hour Analysis */}
            {!loading && analytics?.hourlyData && (
                <section>
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium">Análise de Vendas por Horário</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart data={analytics.hourlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="hour" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `${v}h`} />
                                    <YAxis yAxisId="left" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} label={{ value: 'Receita', angle: -90, position: 'insideLeft', style: { fill: 'var(--muted-foreground)', fontSize: '10px' } }} />
                                    <YAxis yAxisId="right" orientation="right" stroke="var(--muted-foreground)" fontSize={11} label={{ value: 'Pedidos', angle: 90, position: 'insideRight', style: { fill: 'var(--muted-foreground)', fontSize: '10px' } }} />
                                    <Tooltip
                                        formatter={(value: any, name: any) => [
                                            name === 'receita' ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : value,
                                            name === 'receita' ? 'Receita' : 'Pedidos'
                                        ]}
                                        labelFormatter={(v) => `${v}:00 - ${v}:59`}
                                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="receita" name="Receita" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.8} />
                                    <Line yAxisId="right" type="monotone" dataKey="pedidos" name="Pedidos" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Revenue by State + GA4 Metrics */}
            {!loading && analytics && (
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue by State */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium">Receita por Estado</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={analytics.byState} layout="vertical" margin={{ left: 10, right: 60, top: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} stroke="var(--muted-foreground)" fontSize={10} />
                                    <YAxis type="category" dataKey="name" width={40} stroke="var(--muted-foreground)" fontSize={11} />
                                    <Tooltip formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                                        <LabelList dataKey="value" position="right" formatter={(v: any) => `R$ ${(Number(v) / 1000).toFixed(1)}k`} style={{ fill: 'var(--muted-foreground)', fontSize: '10px' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* GA4 Metrics */}
                    {ga4Kpis && (
                        <Card className="border-border bg-card">
                            <CardHeader className="flex flex-row items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                <CardTitle className="text-sm font-medium">Métricas GA4</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-lg text-center">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Receita GA4</p>
                                        <p className="text-lg font-bold">{ga4Kpis.totalRevenue_formatted}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-lg text-center">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Transações</p>
                                        <p className="text-lg font-bold">{ga4Kpis.totalTransactions?.toLocaleString('pt-BR')}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-lg text-center">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sessões</p>
                                        <p className="text-lg font-bold">{ga4Kpis.totalSessions?.toLocaleString('pt-BR')}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-lg text-center">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Investimento Ads</p>
                                        <p className="text-lg font-bold">{gadsKpis?.spend_formatted || 'R$ 0'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </section>
            )}
        </div>
    );
}
