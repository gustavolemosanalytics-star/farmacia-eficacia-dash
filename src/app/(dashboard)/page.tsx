'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/kpi/KPICard';
import { PageFilters } from '@/components/ui/PageFilters';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { TrendingUp, DollarSign, ShoppingCart, Target, Activity, BarChart3, PieChart, Package, Users, Filter, AlertTriangle, CheckCircle } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RechartsPie, Pie, Cell, Legend, AreaChart, Area, LabelList, Line, LineChart
} from 'recharts';
import { useCatalogoData, useGoogleAdsKPIs, useCatalogoYoYData, useGA4KPIs } from '@/hooks/useDashboardData';
import { GlobalDatePicker } from '@/components/ui/GlobalDatePicker';
import { cn } from '@/lib/utils';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

import { CampaignRankingTable } from '@/components/tables/CampaignRankingTable';
import { GrowthProjection } from '@/components/dashboard/GrowthProjection';
import { ExecutiveInsights } from '@/components/dashboard/ExecutiveInsights';
import { Bussola } from '@/components/dashboard/Bussola';
import { CityRevenueChart } from '@/components/charts/CityRevenueChart';

export default function HomeExecutiva() {
    // Filter states
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [filterAtribuicao, setFilterAtribuicao] = useState<string | null>(null);

    // Pass filters to server-side - SWR will refetch when filters change
    const { data: catalogoData, comparisonData: catalogoComparisonData, loading: loadingCatalogo } = useCatalogoData(
        undefined, undefined,
        filterStatus || undefined,
        filterAtribuicao || undefined
    );

    // Fetch unfiltered data for the goals compass (ignoring attribution filter)
    const { data: catalogoDataUnfiltered, loading: loadingUnfiltered } = useCatalogoData(
        undefined, undefined,
        filterStatus || undefined,
        undefined
    );

    const { data: yoyData, loading: loadingYoY } = useCatalogoYoYData();
    const { kpis: gadsKpis, comparisonKpis: gadsComparisonKpis, loading: loadingGads } = useGoogleAdsKPIs();
    const { kpis: ga4Kpis, loading: loadingGA4 } = useGA4KPIs();

    const loading = loadingCatalogo || loadingGads || loadingYoY || loadingGA4 || loadingUnfiltered;

    // Filter options from API
    const filterOptions = catalogoData?.filterOptions || {
        status: [],
        atribuicoes: [],
    };

    // Compute variations from comparison data
    const variations = useMemo(() => {
        if (!catalogoData || !catalogoComparisonData) {
            return { totalReceita: 0, receitaGoogleAds: 0, totalPedidos: 0, ticketMedio: 0, totalClientes: 0 };
        }
        const calcVar = (curr: number, prev: number) => prev > 0 ? ((curr - prev) / prev) * 100 : 0;
        return {
            totalReceita: calcVar(catalogoData.totalReceita || 0, catalogoComparisonData.totalReceita || 0),
            receitaGoogleAds: calcVar(catalogoData.receitaGoogleAds || 0, catalogoComparisonData.receitaGoogleAds || 0),
            totalPedidos: calcVar(catalogoData.totalPedidos || 0, catalogoComparisonData.totalPedidos || 0),
            ticketMedio: calcVar(catalogoData.ticketMedio || 0, catalogoComparisonData.ticketMedio || 0),
            totalClientes: calcVar(catalogoData.totalClientes || 0, catalogoComparisonData.totalClientes || 0),
        };
    }, [catalogoData, catalogoComparisonData]);

    // Use server-computed data directly
    const displayData = {
        totalReceita: catalogoData?.totalReceita || 0,
        receitaGoogleAds: catalogoData?.receitaGoogleAds || 0,
        receitaParaROAS: catalogoData?.receitaParaROAS || 0,
        totalPedidos: catalogoData?.totalPedidos || 0,
        ticketMedio: catalogoData?.ticketMedio || 0,
        totalClientes: catalogoData?.totalClientes || 0,
        byAtribuicao: catalogoData?.byAtribuicao || [],
        byCategory: catalogoData?.byCategory || [],
        dailyRevenue: catalogoData?.dailyRevenue || [],
        dailyRevenueByAtribuicao: catalogoData?.dailyRevenueByAtribuicao || [],
        allAtribuicoes: catalogoData?.allAtribuicoes || [],
        googleAdsOrdersCount: catalogoData?.googleAdsOrdersCount || 0,
        variations,
        yoy: yoyData || null,
        rawData: catalogoData?.rawData || [],
    };

    // Calculate Top Products from Raw Data (Client-side)
    const topProducts = useMemo(() => {
        if (!displayData.rawData || !displayData.rawData.length) return [];

        const productMap: Record<string, { name: string, receita: number, qtd: number }> = {};

        displayData.rawData.forEach((item: any) => {
            const name = item.nomeProduto || item.sku || 'Desconhecido';
            if (!productMap[name]) productMap[name] = { name, receita: 0, qtd: 0 };
            productMap[name].receita += item.receitaProduto || 0;
            productMap[name].qtd += item.quantidade || 1;
        });

        return Object.values(productMap)
            .sort((a, b) => b.receita - a.receita)
            .slice(0, 5);
    }, [displayData.rawData]);

    // Receita Geral: Agora reflete os filtros de Status e Atribuição selecionados
    const receitaGeral = displayData.totalReceita;
    // Receita Mídia Paga: Agora reflete os filtros (Status) e a atribuição Google_Ads
    const receitaMidiaPaga = displayData.receitaGoogleAds;

    // Variations
    const varReceita = displayData.variations?.totalReceita || 0;
    const varMidiaPaga = displayData.variations?.receitaGoogleAds || 0;
    const varPedidos = displayData.variations?.totalPedidos || 0;
    const varTicket = displayData.variations?.ticketMedio || 0;
    const varClientes = displayData.variations?.totalClientes || 0;

    // Ads variation
    const gadsSpend = gadsKpis?.totalGrossCost || 0;
    const gadsComparisonSpend = gadsComparisonKpis?.totalGrossCost || 0;
    const varAdsSpend = gadsComparisonSpend > 0 ? ((gadsSpend - gadsComparisonSpend) / gadsComparisonSpend) * 100 : 0;

    // Main KPIs
    const kpis = [
        {
            id: 'receita_geral',
            titulo: 'Receita Geral Magento',
            valor: receitaGeral,
            valorFormatado: `R$ ${receitaGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            variacao: varReceita,
            tendencia: varReceita >= 0 ? 'up' as const : 'down' as const,
            sparklineData: [receitaGeral * 0.8, receitaGeral * 0.85, receitaGeral * 0.9, receitaGeral * 0.95, receitaGeral],
        },
        {
            id: 'receita_midia_paga',
            titulo: 'Receita Mídia Paga (GAds)',
            valor: receitaMidiaPaga,
            valorFormatado: `R$ ${receitaMidiaPaga.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            variacao: varMidiaPaga,
            tendencia: varMidiaPaga >= 0 ? 'up' as const : 'down' as const,
            sparklineData: [receitaMidiaPaga * 0.8, receitaMidiaPaga * 0.85, receitaMidiaPaga * 0.9, receitaMidiaPaga * 0.95, receitaMidiaPaga],
        },
        {
            id: 'pedidos',
            titulo: 'Pedidos',
            valor: displayData.totalPedidos,
            valorFormatado: displayData.totalPedidos.toLocaleString('pt-BR'),
            variacao: varPedidos,
            tendencia: varPedidos >= 0 ? 'up' as const : 'down' as const,
            sparklineData: [displayData.totalPedidos * 0.8, displayData.totalPedidos * 0.85, displayData.totalPedidos * 0.9, displayData.totalPedidos * 0.95, displayData.totalPedidos],
        },
        {
            id: 'ticket_medio',
            titulo: 'Ticket Médio',
            valor: displayData.ticketMedio,
            valorFormatado: `R$ ${displayData.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            variacao: varTicket,
            tendencia: varTicket >= 0 ? 'up' as const : 'down' as const,
            sparklineData: [displayData.ticketMedio * 0.95, displayData.ticketMedio * 0.97, displayData.ticketMedio * 0.98, displayData.ticketMedio * 0.99, displayData.ticketMedio],
        },
        {
            id: 'clientes_unicos',
            titulo: 'Clientes Únicos',
            valor: displayData.totalClientes,
            valorFormatado: displayData.totalClientes.toLocaleString('pt-BR'),
            variacao: varClientes,
            tendencia: varClientes >= 0 ? 'up' as const : 'down' as const,
            sparklineData: [displayData.totalClientes * 0.85, displayData.totalClientes * 0.88, displayData.totalClientes * 0.92, displayData.totalClientes * 0.96, displayData.totalClientes],
        },
        {
            id: 'investimento_ads',
            titulo: 'Investimento Ads (Geral)',
            valor: gadsKpis?.totalGrossCost || 0,
            valorFormatado: `R$ ${(gadsKpis?.totalGrossCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            variacao: varAdsSpend,
            tendencia: varAdsSpend >= 0 ? 'up' as const : 'down' as const,
            sparklineData: gadsKpis ? [gadsKpis.totalGrossCost * 0.9, gadsKpis.totalGrossCost * 0.92, gadsKpis.totalGrossCost * 0.95, gadsKpis.totalGrossCost * 0.98, gadsKpis.totalGrossCost] : [0, 0, 0, 0, 0],
        },
    ];

    // Calculate ROAS using:
    // - Custo: Campanhas que NÃO contêm "Lead" e NÃO contêm "Visita" (ecommerceSpend já é isso)
    // - Receita: BD Mag com Atribuição diferente de "Vendedor" e diferente de "Outros"
    const roas = gadsKpis?.roas || 0;

    // Filter KPIs to show only Receita Geral and Ticket Médio as requested
    const filteredKpis = kpis.filter(k => k.id === 'receita_geral' || k.id === 'ticket_medio');

    // Calculate Campaign Analysis for ROAS Table
    const campaignAnalysis = useMemo(() => {
        if (!gadsKpis?.byCampaign) return [];

        return gadsKpis.byCampaign.map((camp: any) => {
            const revenue = camp.conversionValue || 0;
            const roas = camp.spend > 0 ? revenue / camp.spend : 0;
            return { ...camp, revenue, roas };
        }).sort((a: any, b: any) => b.roas - a.roas);
    }, [gadsKpis]);

    // Use server-computed data directly - ORIGEM BD MAGENTO (POSTGRES) 
    // O usuário solicitou explicitamente para NÃO substituir dados do BD pelos da API do Google
    const adjustedByAtribuicao = displayData.byAtribuicao || [];
    const adjustedDailyByAtribuicao = displayData.dailyRevenueByAtribuicao || [];

    // Get all unique attribution names for the data
    const adjustedAtribuicoes = displayData.allAtribuicoes || [];

    // Chart data using adjusted values
    const atribuicaoData = adjustedByAtribuicao.slice(0, 6).map((c: any, i: number) => ({
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
            {/* Header with Period Filter + Dropdowns */}
            <PageFilters
                title="Visão Geral Executiva"
                description="Visão consolidada de performance • Dados do Magento (BD Mag) e Google Ads"
            >
                <FilterDropdown label="Status" options={filterOptions.status} value={filterStatus} onChange={setFilterStatus} />
                <FilterDropdown label="Atribuição" options={filterOptions.atribuicoes} value={filterAtribuicao} onChange={setFilterAtribuicao} />
            </PageFilters>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Carregando dados...</p>
                    </div>
                </div>
            )}

            {/* Bússola de Metas */}
            {!loading && gadsKpis && (
                <section className="mb-6">
                    <Bussola
                        currentRevenue={catalogoDataUnfiltered?.totalReceita || 0}
                        currentImpressions={gadsKpis?.segmented?.ecommerce?.impressions || 0}
                        currentClicks={gadsKpis?.segmented?.ecommerce?.clicks || 0}
                        currentOrders={catalogoDataUnfiltered?.totalPedidos || 0}
                        targetRevenue={600000}
                        targetImpressions={2000000}
                        targetClicks={80000}
                        targetOrders={1500}
                    />
                </section>
            )}

            {/* Growth Projection (New Analysis) */}
            {!loading && gadsKpis && (
                <section className="mb-6">
                    <GrowthProjection
                        currentRevenue={displayData.receitaParaROAS}
                        currentRoas={roas}
                        currentSessions={ga4Kpis?.googleSessions || 0}
                        currentClicks={gadsKpis?.clicks || 0}
                        currentCTR={gadsKpis?.ctr || 0}
                        currentOrders={displayData.totalPedidos || 0}
                        currentTicketMedio={displayData.ticketMedio || 0}
                        targetRevenue={400000}
                        targetRoas={3.0}
                    />
                </section>
            )}


            {/* Executive Insights - AI Analysis */}
            {!loading && catalogoData && gadsKpis && (
                <section>
                    <ExecutiveInsights
                        catalogoData={catalogoData}
                        gadsKpis={gadsKpis}
                        ga4Kpis={ga4Kpis}
                    />
                </section>
            )}

            {/* KPIs Principais - Refined */}
            {!loading && filteredKpis.length > 0 && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        KPIs Principais
                    </h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {filteredKpis.map((kpi) => (
                            <KPICard key={kpi.id} data={kpi} />
                        ))}
                    </div>
                </section>
            )}

            {/* Campaign ROAS Ranking */}
            {!loading && campaignAnalysis.length > 0 && (
                <section>
                    <CampaignRankingTable campaigns={campaignAnalysis} />
                </section>
            )}



            {/* Funil de Conversão com Gaps de Mercado - REDESIGNED */}
            {!loading && gadsKpis && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Funil de Conversão vs Benchmarks de Mercado
                    </h2>
                    <Card className="border-border bg-gradient-to-br from-slate-50 to-white dark:from-zinc-900 dark:to-zinc-950">
                        <CardContent className="pt-6">
                            {(() => {
                                // Usando segmented.ecommerce (exclui campanhas Lead e Visita)
                                // Mesma abordagem da Bússola que usa segmented.leads
                                const impressoes = gadsKpis?.segmented?.ecommerce?.impressions || 0;
                                const cliques = gadsKpis?.segmented?.ecommerce?.clicks || 0;
                                const sessoesGoogle = ga4Kpis?.googleSessions || 0;
                                const addToCarts = ga4Kpis?.totalAddToCarts || 0;
                                const checkouts = ga4Kpis?.totalCheckouts || 0;
                                const pedidos = displayData.totalPedidos || 0;

                                // Market benchmarks
                                const benchmarks = {
                                    ctr: 2.5,
                                    clickToSession: 80,
                                    sessionToCart: 8.0,
                                    cartToCheckout: 50,
                                    checkoutToOrder: 70,
                                };

                                // Calculate rates
                                const ctr = impressoes > 0 ? (cliques / impressoes) * 100 : 0;
                                const clickToSession = cliques > 0 ? (sessoesGoogle / cliques) * 100 : 0;
                                const sessionToCart = sessoesGoogle > 0 ? (addToCarts / sessoesGoogle) * 100 : 0;
                                const cartToCheckout = addToCarts > 0 ? (checkouts / addToCarts) * 100 : 0;
                                const checkoutToOrder = checkouts > 0 ? (pedidos / checkouts) * 100 : 0;

                                const funnelSteps = [
                                    { name: 'Impressões', value: impressoes, rate: null, benchmark: null, color: '#ec4899' },
                                    { name: 'Cliques', value: cliques, rate: ctr, benchmark: benchmarks.ctr, label: 'CTR', color: '#3b82f6' },
                                    { name: 'Sessões', value: sessoesGoogle, rate: clickToSession, benchmark: benchmarks.clickToSession, label: 'Click→Session', color: '#8b5cf6' },
                                    { name: 'Add to Cart', value: addToCarts, rate: sessionToCart, benchmark: benchmarks.sessionToCart, label: 'Session→Cart', color: '#f59e0b' },
                                    { name: 'Checkout', value: checkouts, rate: cartToCheckout, benchmark: benchmarks.cartToCheckout, label: 'Cart→Checkout', color: '#14b8a6' },
                                    { name: 'Pedidos', value: pedidos, rate: checkoutToOrder, benchmark: benchmarks.checkoutToOrder, label: 'Checkout→Compra', color: '#10b981' },
                                ];

                                const maxValue = funnelSteps[0].value || 1;

                                const formatValue = (val: number) => {
                                    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                                    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
                                    return val.toLocaleString('pt-BR');
                                };

                                return (
                                    <div className="space-y-6">
                                        {/* Horizontal Funnel Grid */}
                                        <div className="grid grid-cols-6 gap-1">
                                            {funnelSteps.map((step, idx) => {
                                                const widthPercent = 100 - (idx * 10); // Decreasing visual effect
                                                const isGood = step.rate === null || ((step.rate || 0) >= (step.benchmark || 0));

                                                return (
                                                    <div key={step.name} className="relative">
                                                        {/* Step Box */}
                                                        <div
                                                            className="rounded-lg p-3 text-center transition-all hover:scale-105"
                                                            style={{
                                                                background: `linear-gradient(180deg, ${step.color}ee, ${step.color}99)`,
                                                                minHeight: `${60 + (6 - idx) * 8}px` // Tapered height
                                                            }}
                                                        >
                                                            <p className="text-white font-bold text-xs truncate">{step.name}</p>
                                                            <p className="text-white font-black text-lg mt-1">
                                                                {formatValue(step.value)}
                                                            </p>
                                                            {step.rate !== null && (
                                                                <p className={cn(
                                                                    "text-[10px] font-semibold mt-1 px-1 py-0.5 rounded",
                                                                    isGood
                                                                        ? "bg-white/30 text-white"
                                                                        : "bg-rose-900/50 text-rose-200"
                                                                )}>
                                                                    {step.rate.toFixed(1)}%
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Arrow */}
                                                        {idx < funnelSteps.length - 1 && (
                                                            <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 text-muted-foreground/50 text-xs z-10">
                                                                →
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Detailed Rates Table */}
                                        <div className="grid grid-cols-5 gap-2 text-center">
                                            {funnelSteps.slice(1).map((step) => {
                                                const isGood = (step.rate || 0) >= (step.benchmark || 0);
                                                return (
                                                    <div
                                                        key={step.name}
                                                        className={cn(
                                                            "p-2 rounded-lg border",
                                                            isGood
                                                                ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                                                                : "bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800"
                                                        )}
                                                    >
                                                        <p className="text-[10px] text-muted-foreground truncate">{step.label}</p>
                                                        <p className={cn(
                                                            "text-lg font-black",
                                                            isGood ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                                        )}>
                                                            {step.rate?.toFixed(1)}%
                                                        </p>
                                                        <p className="text-[9px] text-muted-foreground">
                                                            Bench: {step.benchmark}%
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Summary Stats */}
                                        <div className="grid grid-cols-4 gap-3">
                                            <div className="text-center p-3 rounded-lg bg-muted/30">
                                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Taxa Geral</p>
                                                <p className="text-lg font-black text-foreground">
                                                    {impressoes > 0 ? ((pedidos / impressoes) * 100).toFixed(3) : 0}%
                                                </p>
                                            </div>
                                            <div className="text-center p-3 rounded-lg bg-muted/30">
                                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">CTR</p>
                                                <p className={cn(
                                                    "text-lg font-black",
                                                    ctr >= 2.5 ? "text-emerald-500" : "text-rose-500"
                                                )}>
                                                    {ctr.toFixed(2)}%
                                                </p>
                                            </div>
                                            <div className="text-center p-3 rounded-lg bg-muted/30">
                                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Conversão</p>
                                                <p className={cn(
                                                    "text-lg font-black",
                                                    (pedidos / sessoesGoogle * 100) >= 3.0 ? "text-emerald-500" : "text-rose-500"
                                                )}>
                                                    {sessoesGoogle > 0 ? ((pedidos / sessoesGoogle) * 100).toFixed(2) : 0}%
                                                </p>
                                            </div>
                                            <div className="text-center p-3 rounded-lg bg-muted/30">
                                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Abandono</p>
                                                <p className={cn(
                                                    "text-lg font-black",
                                                    (1 - checkouts / addToCarts) * 100 <= 50 ? "text-emerald-500" : "text-amber-500"
                                                )}>
                                                    {addToCarts > 0 ? ((1 - checkouts / addToCarts) * 100).toFixed(1) : 0}%
                                                </p>
                                            </div>
                                        </div>

                                        {/* Footer note */}
                                        <p className="text-[10px] text-muted-foreground text-center">
                                            * Impressões e Cliques filtrados para <strong>E-commerce</strong> (excluindo campanhas Lead e Visita)
                                        </p>
                                    </div>
                                );

                            })()}
                        </CardContent>
                    </Card>
                </section>
            )}



            {/* Receita por Atribuição - Pie Chart + Line Chart */}
            {!loading && adjustedByAtribuicao.length > 0 && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Receita por Atribuição - Análise Detalhada
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pie Chart - Distribution */}
                        <Card className="border-border bg-card">
                            <CardHeader className="flex flex-row items-center gap-2">
                                <PieChart className="h-5 w-5 text-primary" />
                                <div>
                                    <CardTitle className="text-sm font-medium text-card-foreground">Distribuição por Canal de Atribuição</CardTitle>
                                    <p className="text-[10px] text-muted-foreground">Dados do Banco de Dados (Magento)</p>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                    <RechartsPie>
                                        <Pie
                                            data={adjustedByAtribuicao.slice(0, 8).map((item: any, idx: number) => ({
                                                ...item,
                                                color: COLORS[idx % COLORS.length]
                                            }))}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={120}
                                            paddingAngle={2}
                                            dataKey="value"
                                            nameKey="name"
                                            label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}
                                            labelLine={false}
                                        >
                                            {adjustedByAtribuicao.slice(0, 8).map((_: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => [`R$ ${(value ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                                            contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                        />
                                        <Legend />
                                    </RechartsPie>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Line Chart - Daily Evolution by Attribution */}
                        <Card className="border-border bg-card">
                            <CardHeader className="flex flex-row items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                <div>
                                    <CardTitle className="text-sm font-medium text-card-foreground">Evolução Diária por Atribuição</CardTitle>
                                    <p className="text-[10px] text-muted-foreground">Dados do Banco de Dados (Magento)</p>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                    <LineChart data={adjustedDailyByAtribuicao.slice(-30) || []} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="var(--muted-foreground)"
                                            fontSize={10}
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                            tickFormatter={(val) => {
                                                if (typeof val === 'string' && val.includes('-')) {
                                                    const parts = val.split('-');
                                                    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
                                                }
                                                if (typeof val === 'string' && val.includes('/')) {
                                                    return val.slice(0, 5);
                                                }
                                                return val;
                                            }}
                                        />
                                        <YAxis
                                            stroke="var(--muted-foreground)"
                                            fontSize={10}
                                            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                                        />
                                        <Tooltip
                                            formatter={(value, name) => [`R$ ${(value ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, name]}
                                            contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                        />
                                        <Legend />
                                        {adjustedAtribuicoes.slice(0, 6).map((atrib: string, idx: number) => (
                                            <Line
                                                key={atrib}
                                                type="monotone"
                                                dataKey={atrib}
                                                name={atrib}
                                                stroke={COLORS[idx % COLORS.length]}
                                                strokeWidth={2}
                                                dot={false}
                                                activeDot={{ r: 4 }}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                                <p className="text-xs text-muted-foreground text-center mt-2">
                                    Últimos 30 dias • Dados extraídos diretamente do Magento (PostgreSQL)
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            )}



            {/* Vendas por Cidade */}
            {!loading && catalogoData && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Análise Geográfica - Vendas por Cidade
                    </h2>
                    <CityRevenueChart catalogoData={catalogoData} />
                </section>
            )}

            {/* Detalhes de Vendas (Magento) - RESTORED CHARTS */}
            {!loading && catalogoData && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Detalhes de Vendas (Magento)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Top Products Table */}
                        <Card className="border-border bg-card">
                            <CardHeader className="flex flex-row items-center gap-2">
                                <Package className="h-5 w-5 text-primary" />
                                <div>
                                    <CardTitle className="text-sm font-medium">Top 5 Produtos</CardTitle>
                                    <p className="text-[10px] text-muted-foreground">Por Receita (BD Magento)</p>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {(topProducts || []).map((prod: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between border-b border-border last:border-0 pb-2">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                    #{i + 1}
                                                </div>
                                                <div className="truncate text-xs font-medium" title={prod.name}>
                                                    {prod.name.length > 30 ? prod.name.substring(0, 30) + '...' : prod.name}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-xs font-bold text-emerald-600">R$ {prod.receita.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
                                                <div className="text-[10px] text-muted-foreground">{prod.qtd} un.</div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!topProducts || topProducts.length === 0) && (
                                        <p className="text-xs text-muted-foreground text-center py-4">Nenhum dado encontrado.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Categories Chart */}
                        <Card className="border-border bg-card">
                            <CardHeader className="flex flex-row items-center gap-2">
                                <PieChart className="h-5 w-5 text-primary" />
                                <div>
                                    <CardTitle className="text-sm font-medium">Top Categorias</CardTitle>
                                    <p className="text-[10px] text-muted-foreground">Por Receita (BD Magento)</p>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart
                                        data={displayData.byCategory.slice(0, 5)}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                                        <Tooltip
                                            formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Receita']}
                                            contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                        />
                                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                                            <LabelList dataKey="value" position="right" formatter={(v: any) => `R$ ${(Number(v) / 1000).toFixed(0)}k`} style={{ fontSize: '10px', fill: 'var(--muted-foreground)' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            )}

            {/* YoY Analysis Section - Temporarily hidden for data verification */}

            {/* {!loading && displayData.yoy && (
                <section className="space-y-6">
                   ... (YoY content)
                </section>
            )} */}
        </div>
    );
}
