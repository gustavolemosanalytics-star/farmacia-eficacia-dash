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

    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [filterAtribuicao, setFilterAtribuicao] = useState<string | null>(null);

    const filterOptions = catalogoData?.filterOptions || { status: [], atribuicoes: [] };

    // Analytics and Insights
    const analytics = useMemo(() => {
        if (!catalogoData?.rawData) return null;

        let filtered = catalogoData.rawData;

        if (filterStatus) {
            filtered = filtered.filter((d: any) => d.status === filterStatus);
        } else {
            // Default active statuses
            filtered = filtered.filter((d: any) =>
                d.status?.toLowerCase().includes('complete') ||
                d.status?.toLowerCase().includes('completo') ||
                d.status?.toLowerCase().includes('pago') ||
                d.status?.toLowerCase().includes('enviado') ||
                d.status?.toLowerCase().includes('faturado') ||
                !d.status
            );
        }

        if (filterAtribuicao) filtered = filtered.filter((d: any) => d.atribuicao === filterAtribuicao);

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
            const dateRaw = d.data;
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

        // ======= IMPROVED TOP PRODUCTS + ROAS CALCULATION =======
        // 1. Map costs by campaign from GAds
        const campaignCosts: Record<string, number> = {};
        if (gadsKpis?.byCampaign) {
            gadsKpis.byCampaign.forEach((c: any) => {
                campaignCosts[c.campaign] = c.spend || 0;
            });
        }

        // 2. Aggregate product revenue and track campaign distribution
        const productData: Record<string, {
            name: string,
            receita: number,
            quantidade: number,
            campaigns: Record<string, number>
        }> = {};

        const totalCampaignRevenue: Record<string, number> = {};

        filtered.forEach((d: any) => {
            const prodName = d.nomeProduto || d.sku;
            if (!prodName) return;

            if (!productData[prodName]) {
                productData[prodName] = { name: prodName, receita: 0, quantidade: 0, campaigns: {} };
            }

            const revenue = d.receitaProduto || 0;
            const campaign = d.campanha || 'Desconhecida';

            productData[prodName].receita += revenue;
            productData[prodName].quantidade += d.quantidade || 1;
            productData[prodName].campaigns[campaign] = (productData[prodName].campaigns[campaign] || 0) + revenue;

            totalCampaignRevenue[campaign] = (totalCampaignRevenue[campaign] || 0) + revenue;
        });

        // 3. Calculate investment and ROAS per product
        const topProducts = Object.values(productData)
            .map(prod => {
                let investment = 0;
                Object.entries(prod.campaigns).forEach(([campaign, revenueGenerated]) => {
                    const cost = campaignCosts[campaign] || 0;
                    const totalRev = totalCampaignRevenue[campaign] || 0;

                    // Allocate cost proportionally based on revenue share within that campaign
                    if (totalRev > 0) {
                        investment += cost * (revenueGenerated / totalRev);
                    }
                });

                return {
                    name: prod.name.length > 30 ? prod.name.substring(0, 30) + '...' : prod.name,
                    fullName: prod.name,
                    receita: prod.receita,
                    quantidade: prod.quantidade,
                    investimento: investment,
                    roas: investment > 0 ? prod.receita / investment : 0
                };
            })
            .sort((a, b) => b.receita - a.receita)
            .slice(0, 10);
        // ========================================================

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

        // For totalReceitaGeral, we want to respect the Status filter but NOT the attribution filter
        const totalReceitaGeral = catalogoData.rawData.filter((d: any) => {
            if (filterStatus) return d.status === filterStatus;
            return d.status?.toLowerCase().includes('complete') ||
                d.status?.toLowerCase().includes('completo') ||
                d.status?.toLowerCase().includes('pago') ||
                d.status?.toLowerCase().includes('enviado') ||
                d.status?.toLowerCase().includes('faturado') ||
                !d.status;
        }).reduce((sum: number, d: any) => sum + (d.receitaProduto || 0), 0);

        // ROAS calculation (specifically for Google_Ads, respecting current Status)
        const receitaGoogleAds = catalogoData.rawData.filter((d: any) => {
            const matchesAtrib = d.atribuicao?.toLowerCase().includes('google_ads');
            const matchesStatus = filterStatus ? (d.status === filterStatus) : (
                d.status?.toLowerCase().includes('complete') ||
                d.status?.toLowerCase().includes('completo') ||
                d.status?.toLowerCase().includes('pago') ||
                d.status?.toLowerCase().includes('enviado') ||
                d.status?.toLowerCase().includes('faturado') ||
                !d.status
            );
            return matchesAtrib && matchesStatus;
        }).reduce((sum: number, d: any) => sum + (d.receitaProduto || 0), 0);

        return {
            totalReceita,
            totalReceitaGeral,
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
    }, [catalogoData, filterStatus, filterAtribuicao, gadsKpis]);

    // Funnel data
    const funnelMetrics = {
        clicks: gadsKpis?.clicks || 0,
        conversionsGads: gadsKpis?.conversions || 0,
        pedidos: analytics?.totalPedidos || 0,
    };

    const funnelData = [
        { name: 'Cliques', value: funnelMetrics.clicks, fill: FUNNEL_COLORS[1] },
        { name: 'Conv. GAds', value: Math.round(funnelMetrics.conversionsGads), fill: FUNNEL_COLORS[2] },
        { name: 'Pedidos', value: funnelMetrics.pedidos, fill: FUNNEL_COLORS[4] },
    ];

    // ROAS
    const roas = analytics?.receitaGoogleAds && gadsKpis?.spend > 0
        ? analytics.receitaGoogleAds / gadsKpis.spend : 0;

    // Conversion rates
    const rates = {
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
            id: 'receita_geral',
            titulo: 'Receita Geral Magento',
            valor: analytics?.totalReceitaGeral || 0,
            valorFormatado: `R$ ${(analytics?.totalReceitaGeral || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            variacao: 0,
            tendencia: 'up' as const,
            sparklineData: [1, 1.02, 1.05, 1.08, 1.1],
        },
        {
            id: 'receita_midia_paga',
            titulo: 'Receita Mídia Paga (GAds)',
            valor: analytics?.receitaGoogleAds || 0,
            valorFormatado: `R$ ${(analytics?.receitaGoogleAds || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            variacao: 0,
            tendencia: 'up' as const,
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
                title="Performance de Ecommerce"
                description="Painel tático de performance e comportamento de compra"
            >
                <FilterDropdown label="Status" options={filterOptions.status} value={filterStatus} onChange={setFilterStatus} />
                <FilterDropdown label="Atribuição" options={filterOptions.atribuicoes} value={filterAtribuicao} onChange={setFilterAtribuicao} />
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
                    {/* Conversion Funnel with Percentages and Gaps */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium">Funil de Conversão com Gaps</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(() => {
                                // Market benchmarks
                                const benchmarks = {
                                    convRate: 2.5,
                                    orderRate: 65
                                };

                                const actualConvRate = funnelMetrics.clicks > 0 ? (funnelMetrics.conversionsGads / funnelMetrics.clicks) * 100 : 0;
                                const actualOrderRate = funnelMetrics.conversionsGads > 0 ? (funnelMetrics.pedidos / funnelMetrics.conversionsGads) * 100 : 0;

                                const funnelWithGaps = [
                                    { name: 'Cliques Ads', value: funnelMetrics.clicks, rate: null, benchmark: null, gap: null, fill: FUNNEL_COLORS[1] },
                                    { name: 'Conv. GAds', value: Math.round(funnelMetrics.conversionsGads), rate: actualConvRate, benchmark: benchmarks.convRate, gap: actualConvRate - benchmarks.convRate, fill: FUNNEL_COLORS[2] },
                                    { name: 'Pedidos', value: funnelMetrics.pedidos, rate: actualOrderRate, benchmark: benchmarks.orderRate, gap: actualOrderRate - benchmarks.orderRate, fill: FUNNEL_COLORS[4] },
                                ];

                                const maxValue = Math.max(...funnelWithGaps.map(s => s.value));
                                return (
                                    <div className="space-y-3">
                                        {funnelWithGaps.map((step, idx) => (
                                            <div key={step.name} className="flex items-center gap-3">
                                                <div className="w-24 text-xs font-medium">{step.name}</div>
                                                <div className="flex-1">
                                                    <div className="h-6 bg-slate-100 dark:bg-zinc-800 rounded overflow-hidden">
                                                        <div
                                                            className="h-full rounded transition-all"
                                                            style={{
                                                                width: `${(step.value / maxValue) * 100}%`,
                                                                backgroundColor: step.fill,
                                                                minWidth: step.value > 0 ? '5px' : '0'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="w-16 text-right text-xs font-mono">
                                                    {step.value >= 1000 ? `${(step.value / 1000).toFixed(1)}k` : step.value}
                                                </div>
                                                {step.rate !== null && (
                                                    <div className="w-32 text-right">
                                                        <span className={`text-xs font-bold ${(step.gap || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                            {step.rate.toFixed(1)}%
                                                        </span>
                                                        <span className={`text-[10px] ml-1 ${(step.gap || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                            ({(step.gap || 0) >= 0 ? '+' : ''}{(step.gap || 0).toFixed(1)}pp)
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        <p className="text-[10px] text-muted-foreground mt-2">
                                            Benchmarks: Conv (Ads) 2.5% | Fechamento 65%
                                        </p>
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>

                    {/* Conversion Rates */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium">Taxas de Conversão</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Taxa Conv. Ads</p>
                                    <p className="text-2xl font-bold">{rates.conversionRate}%</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">ROAS (Pago)</p>
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
                                <AreaChart data={analytics.dailyTrend} margin={{ top: 10, right: 10, left: 45, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorReceita2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={10} tickFormatter={(val) => {
                                        if (typeof val === 'string' && val.includes('/')) {
                                            const parts = val.split('/');
                                            return `${parts[0]}/${parts[1]}`;
                                        }
                                        return val;
                                    }} />
                                    <YAxis
                                        stroke="var(--muted-foreground)"
                                        fontSize={10}
                                        tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                                        width={45}
                                    />
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
                                    <YAxis type="category" dataKey="name" width={90} stroke="var(--muted-foreground)" fontSize={10} />
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
                            <ResponsiveContainer width="100%" height={420}>
                                <BarChart data={analytics.topCategories} margin={{ top: 40, right: 10, left: 60, bottom: 70 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="var(--muted-foreground)"
                                        fontSize={10}
                                        angle={-35}
                                        textAnchor="end"
                                        height={80}
                                        interval={0}
                                    />
                                    <YAxis
                                        stroke="var(--muted-foreground)"
                                        fontSize={10}
                                        tickFormatter={(v) => `R$ ${(v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v)}`}
                                        width={75}
                                    />
                                    <Tooltip
                                        formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]}
                                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="receita" radius={[6, 6, 0, 0]} name="Receita" barSize={50}>
                                        {analytics.topCategories.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                        <LabelList
                                            dataKey="receita"
                                            position="top"
                                            formatter={(v: any) => `R$ ${(Number(v) / 1000).toFixed(1)}k`}
                                            style={{ fill: 'var(--muted-foreground)', fontSize: '11px', fontWeight: '500' }}
                                            offset={10}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Top Products Table with ROAS and Investment */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium">Top 10 Produtos + ROAS</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-[350px] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-card">
                                        <tr className="border-b border-border">
                                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Produto</th>
                                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">Receita</th>
                                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">Investimento</th>
                                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">ROAS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics.topProducts.map((prod, i) => {
                                            const productRoas = prod.roas;
                                            const investEstimado = prod.investimento;

                                            return (
                                                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50">
                                                    <td className="py-2 px-2 text-xs max-w-[150px] truncate" title={prod.fullName}>{prod.name}</td>
                                                    <td className="py-2 px-2 text-right text-xs font-medium text-emerald-600">
                                                        R$ {prod.receita.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                                    </td>
                                                    <td className="py-2 px-2 text-right text-xs text-muted-foreground font-mono">
                                                        R$ {investEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                                    </td>
                                                    <td className={`py-2 px-2 text-right text-xs font-bold ${productRoas >= 3 ? 'text-green-600' : productRoas >= 1.5 ? 'text-yellow-600' : 'text-red-500'}`}>
                                                        {productRoas.toFixed(1)}x
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2">
                                * Investimento calculado via cruzamento de Campanhas (BD Mag x GAds)
                            </p>
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
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg text-center">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Receita GA4</p>
                                        <p className="text-base font-bold">{ga4Kpis.totalRevenue_formatted}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg text-center">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Transações</p>
                                        <p className="text-base font-bold">{ga4Kpis.totalTransactions?.toLocaleString('pt-BR')}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg text-center">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Sessões</p>
                                        <p className="text-base font-bold">{ga4Kpis.totalSessions?.toLocaleString('pt-BR')}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg text-center">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Investimento Ads</p>
                                        <p className="text-base font-bold">{gadsKpis?.spend_formatted || 'R$ 0'}</p>
                                    </div>
                                    {/* Buyers vs New Buyers */}
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center col-span-2">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Compradores</p>
                                        <div className="flex justify-around">
                                            <div>
                                                <p className="text-lg font-bold text-emerald-600">{ga4Kpis.totalPurchasers?.toLocaleString('pt-BR') || analytics?.totalPedidos || 0}</p>
                                                <p className="text-[10px] text-muted-foreground">Total</p>
                                            </div>
                                            <div className="border-l border-border pl-4">
                                                <p className="text-lg font-bold text-blue-600">
                                                    {ga4Kpis.newPurchasers?.toLocaleString('pt-BR') || Math.round((analytics?.totalPedidos || 0) * 0.35) || 0}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">Novos</p>
                                            </div>
                                            <div className="border-l border-border pl-4">
                                                <p className="text-lg font-bold text-purple-600">
                                                    {ga4Kpis.returningPurchasers?.toLocaleString('pt-BR') || Math.round((analytics?.totalPedidos || 0) * 0.65) || 0}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">Recorrentes</p>
                                            </div>
                                        </div>
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
