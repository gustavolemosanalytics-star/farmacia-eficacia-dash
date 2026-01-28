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
import { useCatalogoData, useGoogleAdsKPIs, useCatalogoYoYData, useGA4KPIs } from '@/hooks/useSheetData';
import { GlobalDatePicker } from '@/components/ui/GlobalDatePicker';
import { cn } from '@/lib/utils';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

import { BrazilMap } from '@/components/charts/BrazilMap';
import { CampaignRankingTable } from '@/components/tables/CampaignRankingTable';
import { GrowthProjection } from '@/components/dashboard/GrowthProjection';
import { ExecutiveInsights } from '@/components/dashboard/ExecutiveInsights';

export default function HomeExecutiva() {
    const { data: catalogoData, comparisonData: catalogoComparisonData, loading: loadingCatalogo } = useCatalogoData();
    const { data: yoyRawData, loading: loadingYoY } = useCatalogoYoYData();
    const { kpis: gadsKpis, comparisonKpis: gadsComparisonKpis, loading: loadingGads } = useGoogleAdsKPIs();
    const { kpis: ga4Kpis, loading: loadingGA4 } = useGA4KPIs();

    // Filter states
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [filterAtribuicao, setFilterAtribuicao] = useState<string | null>(null);

    const loading = loadingCatalogo || loadingGads || loadingYoY || loadingGA4;

    // Filter options from API
    const filterOptions = catalogoData?.filterOptions || {
        status: [],
        atribuicoes: [],
    };

    // Filtered data based on selected filters
    const filteredData = useMemo(() => {
        if (!catalogoData?.rawData) return null;

        // Helper function to aggregate data
        const aggregateData = (data: any[]) => {
            if (!data) return null;

            let filtered = data;

            if (filterStatus) {
                filtered = filtered.filter((d: any) => d.status === filterStatus);
            } else {
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

            const totalReceita = filtered.reduce((sum: number, d: any) => sum + (d.receitaProduto || 0), 0);
            const uniqueOrders = new Set(filtered.map((d: any) => d.pedido).filter(Boolean));
            const totalPedidos = uniqueOrders.size || filtered.length;
            const ticketMedio = totalPedidos > 0 ? totalReceita / totalPedidos : 0;
            const uniqueClients = new Set(filtered.map((d: any) => d.cpfCliente).filter(Boolean));

            const receitaGoogleAds = filtered
                .filter((d: any) => d.atribuicao === 'Google_Ads')
                .reduce((sum: number, d: any) => sum + (d.receitaProduto || 0), 0);

            const receitaParaROAS = filtered
                .filter((d: any) => {
                    const atrib = (d.atribuicao || '').toLowerCase();
                    return atrib !== 'vendedor' && atrib !== 'outros' && atrib !== '';
                })
                .reduce((sum: number, d: any) => sum + (d.receitaProduto || 0), 0);

            // Additional aggregations for charts (only needed for main data, but harmless here)
            const atribuicaoRevenue: { [key: string]: number } = {};
            filtered.forEach((d: any) => {
                const atrib = d.atribuicao || 'Não identificado';
                atribuicaoRevenue[atrib] = (atribuicaoRevenue[atrib] || 0) + (d.receitaProduto || 0);
            });
            const byAtribuicao = Object.entries(atribuicaoRevenue)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);

            const categoryRevenue: { [key: string]: number } = {};
            filtered.forEach((d: any) => {
                const cat = d.categoria;
                if (cat && cat.trim() !== '') {
                    categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (d.receitaProduto || 0);
                }
            });
            const byCategory = Object.entries(categoryRevenue)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 8);

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

            const dailyAtribuicaoMap: { [key: string]: { [atrib: string]: number } } = {};
            filtered.forEach((d: any) => {
                const dateRaw = d.data || d.dataTransacao;
                if (dateRaw) {
                    const key = dateRaw.split(' ')[0];
                    const atrib = d.atribuicao || 'Não identificado';
                    if (!dailyAtribuicaoMap[key]) {
                        dailyAtribuicaoMap[key] = {};
                    }
                    dailyAtribuicaoMap[key][atrib] = (dailyAtribuicaoMap[key][atrib] || 0) + (d.receitaProduto || 0);
                }
            });

            const allAtribuicoes: string[] = Array.from(new Set(filtered.map((d: any) => (d.atribuicao || 'Não identificado') as string)));
            const dailyRevenueByAtribuicao = Object.entries(dailyAtribuicaoMap)
                .map(([date, atribData]) => {
                    const entry: any = { date };
                    allAtribuicoes.forEach((atrib: string) => {
                        entry[atrib] = atribData[atrib] || 0;
                    });
                    return entry;
                })
                .sort((a, b) => {
                    const dateA = a.date.includes('/') ? new Date(a.date.split('/').reverse().join('-')) : new Date(a.date);
                    const dateB = b.date.includes('/') ? new Date(b.date.split('/').reverse().join('-')) : new Date(b.date);
                    return dateA.getTime() - dateB.getTime();
                });

            return {
                totalReceita,
                totalPedidos,
                ticketMedio,
                totalClientes: uniqueClients.size,
                receitaGoogleAds,
                receitaParaROAS,
                byAtribuicao,
                byCategory,
                dailyRevenue,
                dailyRevenueByAtribuicao,
                allAtribuicoes,
                filteredRaw: filtered,
            };
        };

        // Current Period Aggregation
        const current = aggregateData(catalogoData.rawData);

        // Comparison Period Aggregation
        const comparison = catalogoComparisonData?.rawData ? aggregateData(catalogoComparisonData.rawData) : null;

        // Calculate Variations
        const calcVar = (curr: number, prev: number) => prev > 0 ? ((curr - prev) / prev) * 100 : 0;

        const variations = {
            totalReceita: comparison ? calcVar(current?.totalReceita || 0, comparison.totalReceita) : 0,
            receitaGoogleAds: comparison ? calcVar(current?.receitaGoogleAds || 0, comparison.receitaGoogleAds) : 0,
            totalPedidos: comparison ? calcVar(current?.totalPedidos || 0, comparison.totalPedidos) : 0,
            ticketMedio: comparison ? calcVar(current?.ticketMedio || 0, comparison.ticketMedio) : 0,
            totalClientes: comparison ? calcVar(current?.totalClientes || 0, comparison.totalClientes) : 0,
        };

        // ======= YoY ANALYSIS DATA =======
        const currentYear = new Date().getFullYear(); // 2026
        const previousYear = currentYear - 1; // 2025
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        // Helper to parse date
        const parseYoYDate = (dateStr: string): Date | null => {
            if (!dateStr) return null;
            // Try DD/MM/YYYY
            if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}/)) {
                const [day, month, year] = dateStr.split('/');
                return new Date(Number(year), Number(month) - 1, Number(day));
            }
            // Try YYYY-MM-DD
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
                const [y, m, d] = dateStr.split('-').map(Number);
                return new Date(y, m - 1, d);
            }
            return new Date(dateStr);
        };

        // Aggregate by year and month using FULL historical data
        const monthlyByYear: Record<number, Record<number, { receita: number; pedidos: Set<string> }>> = {};
        const categoryByYear: Record<number, Record<string, number>> = {};

        // Use yoyRawData for historical context, otherwise fall back to filtered (which might be empty for past years)
        const historicalSource = yoyRawData?.rawData || [];

        historicalSource.forEach((d: any) => {
            const dateStr = d.data || d.dataTransacao;
            const parsed = parseYoYDate(dateStr);
            if (!parsed || isNaN(parsed.getTime())) return;

            const year = parsed.getFullYear();
            const month = parsed.getMonth();
            const cat = d.categoria;

            // Monthly aggregation
            if (!monthlyByYear[year]) monthlyByYear[year] = {};
            if (!monthlyByYear[year][month]) monthlyByYear[year][month] = { receita: 0, pedidos: new Set() };
            monthlyByYear[year][month].receita += d.receitaProduto || 0;
            if (d.pedido) monthlyByYear[year][month].pedidos.add(d.pedido);

            // Category by year
            if (cat && cat.trim() !== '') {
                if (!categoryByYear[year]) categoryByYear[year] = {};
                categoryByYear[year][cat] = (categoryByYear[year][cat] || 0) + (d.receitaProduto || 0);
            }
        });

        // Build monthly comparison data for chart
        const monthlyComparison = monthNames.map((name, idx) => ({
            month: name,
            currentYear: monthlyByYear[currentYear]?.[idx]?.receita || 0,
            previousYear: monthlyByYear[previousYear]?.[idx]?.receita || 0,
        }));

        // Calculate YoY totals
        const currentYearReceita = Object.values(monthlyByYear[currentYear] || {}).reduce((sum, m) => sum + m.receita, 0);
        const previousYearReceita = Object.values(monthlyByYear[previousYear] || {}).reduce((sum, m) => sum + m.receita, 0);
        const currentYearPedidos = Object.values(monthlyByYear[currentYear] || {}).reduce((sum, m) => sum + m.pedidos.size, 0);
        const previousYearPedidos = Object.values(monthlyByYear[previousYear] || {}).reduce((sum, m) => sum + m.pedidos.size, 0);

        const receitaYoYPercent = previousYearReceita > 0 ? ((currentYearReceita - previousYearReceita) / previousYearReceita) * 100 : 0;
        const pedidosYoYPercent = previousYearPedidos > 0 ? ((currentYearPedidos - previousYearPedidos) / previousYearPedidos) * 100 : 0;

        const currentYearTicket = currentYearPedidos > 0 ? currentYearReceita / currentYearPedidos : 0;
        const previousYearTicket = previousYearPedidos > 0 ? previousYearReceita / previousYearPedidos : 0;
        const ticketYoYPercent = previousYearTicket > 0 ? ((currentYearTicket - previousYearTicket) / previousYearTicket) * 100 : 0;

        // Top growing categories
        const currentCats = categoryByYear[currentYear] || {};
        const previousCats = categoryByYear[previousYear] || {};
        const allCats = new Set([...Object.keys(currentCats), ...Object.keys(previousCats)]);
        const categoryGrowth = Array.from(allCats).map(cat => {
            const curr = currentCats[cat] || 0;
            const prev = previousCats[cat] || 0;
            const growth = prev > 0 ? ((curr - prev) / prev) * 100 : (curr > 0 ? 100 : 0);
            return { name: cat, currentYear: curr, previousYear: prev, growth };
        })
            .filter(c => c.currentYear > 0 || c.previousYear > 0)
            .sort((a, b) => b.growth - a.growth)
            .slice(0, 6);

        return {
            ...current,
            variations,
            // YoY Data
            yoy: {
                monthlyComparison,
                receitaYoYPercent,
                pedidosYoYPercent,
                ticketYoYPercent,
                currentYearReceita,
                previousYearReceita,
                currentYearPedidos,
                previousYearPedidos,
                categoryGrowth,
                currentYear,
                previousYear,
            }
        };
    }, [catalogoData, catalogoComparisonData, yoyRawData, filterStatus, filterAtribuicao]);


    // Use filtered data or default from API
    const displayData = filteredData || {
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
        filteredRaw: [],
        yoy: null,
        variations: {
            totalReceita: 0,
            receitaGoogleAds: 0,
            totalPedidos: 0,
            ticketMedio: 0,
            totalClientes: 0,
        }
    };

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
    const ecommerceSpend = gadsKpis?.spend || 0; // spend já exclui Lead e Visita no backend
    const receitaParaROASCalc = displayData.receitaParaROAS || 0;
    const roas = receitaParaROASCalc > 0 && ecommerceSpend > 0
        ? receitaParaROASCalc / ecommerceSpend
        : 0;

    // Filter KPIs to show only Receita Geral and Ticket Médio as requested
    const filteredKpis = kpis.filter(k => k.id === 'receita_geral' || k.id === 'ticket_medio');

    // Calculate Campaign Analysis for ROAS Table
    const campaignAnalysis = useMemo(() => {
        if (!gadsKpis?.byCampaign || !catalogoData?.rawData) return [];

        // Map revenue from Magento to Campaign Name
        const revenueMap: Record<string, number> = {};
        catalogoData.rawData.forEach((d: any) => {
            const c = d.campanha?.toLowerCase().trim();
            if (c) revenueMap[c] = (revenueMap[c] || 0) + (d.receitaProduto || 0);
        });

        return gadsKpis.byCampaign.map((camp: any) => {
            const cName = camp.campaign?.toLowerCase().trim();
            const revenue = revenueMap[cName] || 0;
            const roas = camp.spend > 0 ? revenue / camp.spend : 0;
            return { ...camp, revenue, roas };
        }).sort((a: any, b: any) => b.revenue - a.revenue);
    }, [gadsKpis, catalogoData]);

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

            {/* Growth Projection (New Analysis) */}
            {!loading && gadsKpis && (
                <section className="mb-6">
                    <GrowthProjection
                        currentRevenue={displayData.receitaParaROAS}
                        currentRoas={roas}
                        currentSessions={ga4Kpis?.totalSessions || 0}
                        currentClicks={gadsKpis?.clicks || 0}
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

            {/* Eficiência de Mídia (ROAS Real) */}
            {!loading && displayData.byAtribuicao.length > 0 && gadsKpis && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Eficiência de Mídia por Canal (ROAS)
                    </h2>
                    <Card className="border-border bg-card">
                        <CardContent className="pt-6">
                            {(() => {
                                const totalInvestimento = gadsKpis?.spend || 0;

                                // Filter and map real data
                                const channelMetrics = displayData.byAtribuicao.slice(0, 8).map((channel: any, idx: number) => {
                                    // Identify Google Ads channel
                                    const isGoogleAds = channel.name === 'Google_Ads';

                                    // Attribution: We only have cost data for Google Ads currently
                                    const investimentoCanal = isGoogleAds ? totalInvestimento : 0;

                                    // "Marketing Contribution" = Revenue - Ad Spend
                                    // This ignores COGS (Product Cost) as we don't have it in the database
                                    const receitaLiquidaAds = channel.value - investimentoCanal;

                                    const roas = investimentoCanal > 0 ? channel.value / investimentoCanal : 0;

                                    return {
                                        name: channel.name,
                                        receita: channel.value,
                                        investimento: investimentoCanal,
                                        receitaLiquidaAds,
                                        roas,
                                        color: COLORS[idx % COLORS.length]
                                    };
                                });

                                return (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Canal</th>
                                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Receita Captada</th>
                                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Investimento (Ads)</th>
                                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Receita Líquida (Ads)</th>
                                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">ROAS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {channelMetrics.map((ch: any) => (
                                                    <tr key={ch.name} className="border-b border-border/50 hover:bg-muted/50">
                                                        <td className="py-3 px-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ch.color }}></div>
                                                                <span className="font-medium truncate max-w-[150px]">{ch.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="text-right py-3 px-2 font-mono">R$ {ch.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                        <td className="text-right py-3 px-2 font-mono text-red-500">
                                                            {ch.investimento > 0 ? `R$ ${ch.investimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                                        </td>
                                                        <td className={`text-right py-3 px-2 font-mono font-bold ${ch.receitaLiquidaAds >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            R$ {ch.receitaLiquidaAds.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="text-right py-3 px-2">
                                                            {ch.roas > 0 ? (
                                                                <span className={`font-bold ${ch.roas >= 4 ? 'text-green-600' : ch.roas >= 2 ? 'text-blue-500' : 'text-amber-500'}`}>
                                                                    {ch.roas.toFixed(2)}x
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                                            * <strong>Investimento (Ads):</strong> Valor gasto reportado pelo Google Ads. Atribuído apenas ao canal 'Google_Ads'.<br />
                                            * <strong>Receita Líquida (Ads):</strong> Receita Total - Custo de Mídia. Não inclui CMV (Custo do Produto) ou impostos.<br />
                                            * Demais canais exibem apenas Receita pois não possuem custo de mídia vinculado na base de dados atual.
                                        </p>
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Funil de Conversão com Gaps de Mercado */}
            {!loading && gadsKpis && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Funil de Conversão vs Benchmarks de Mercado
                    </h2>
                    <Card className="border-border bg-card">
                        <CardContent className="pt-6">
                            {(() => {
                                const cliques = gadsKpis.clicks || 0;
                                const conversoes = gadsKpis.conversions || 0;
                                const pedidos = displayData.totalPedidos || 0;
                                const sessoesGoogle = ga4Kpis?.googleSessions || 0;

                                // Market benchmarks (industry averages)
                                const benchmarks = {
                                    clickToSession: 80, // 80% of clicks should become sessions
                                    sessionToConv: 6.97, // 6.97% should become orders (User target)
                                };

                                const funnelSteps = [
                                    {
                                        name: 'Cliques Ads',
                                        value: cliques,
                                        rate: 100,
                                        benchmark: 100,
                                        color: '#3b82f6'
                                    },
                                    {
                                        name: 'Sessões (Google)',
                                        value: sessoesGoogle,
                                        rate: cliques > 0 ? (sessoesGoogle / cliques) * 100 : 0,
                                        benchmark: benchmarks.clickToSession,
                                        label: 'Engajamento (Sessões/Cliques)',
                                        color: '#8b5cf6'
                                    },
                                    {
                                        name: 'Pedidos (BD Mag)',
                                        value: pedidos,
                                        rate: sessoesGoogle > 0 ? (pedidos / sessoesGoogle) * 100 : 0,
                                        benchmark: benchmarks.sessionToConv,
                                        label: 'Taxa de Conversão Real',
                                        color: '#10b981'
                                    },
                                ];

                                const maxValue = Math.max(...funnelSteps.map(s => s.value));

                                return (
                                    <div className="space-y-6">
                                        {funnelSteps.map((step, idx) => (
                                            <div key={step.name} className="relative group/funnel">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-xs uppercase tracking-wider text-zinc-500">{step.name}</span>
                                                        {step.label && (
                                                            <span className="text-[10px] text-muted-foreground">{step.label}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-right">
                                                            <p className="text-lg font-black tracking-tighter">{step.value.toLocaleString('pt-BR')}</p>
                                                        </div>
                                                        {idx > 0 && (
                                                            <div className={cn(
                                                                "flex flex-col items-end min-w-[80px]",
                                                                step.rate >= step.benchmark ? "text-emerald-500" : "text-rose-500"
                                                            )}>
                                                                <span className="text-lg font-black tracking-tighter">{step.rate.toFixed(1)}%</span>
                                                                <span className="text-[9px] font-bold opacity-70 uppercase tracking-tighter">vs {step.benchmark}% benchmark</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-full overflow-hidden relative shadow-inner border border-zinc-200/20">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-1000 ease-in-out group-hover/funnel:brightness-110"
                                                        style={{
                                                            width: `${(step.value / maxValue) * 100}%`,
                                                            backgroundColor: step.color,
                                                            boxShadow: `0 0 15px ${step.color}33`
                                                        }}
                                                    />
                                                </div>

                                                {idx > 0 && step.rate < step.benchmark && (
                                                    <div className="flex items-center gap-1.5 mt-2 text-[10px] font-medium text-rose-500/80 bg-rose-500/5 p-1 px-2 rounded-md w-fit">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        <span>Identificamos um gap de {(step.benchmark - step.rate).toFixed(1)}pp em relação ao benchmark</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        <div className="mt-8 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                                            <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
                                                * Benchmarks baseados em médias de mercado para o segmento: <br />
                                                <strong>Click to Session: 80%</strong> |
                                                <strong> Session to Order: 6.97%</strong>
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>
                </section>
            )}









            {/* Receita por Atribuição - Pie Chart + Line Chart */}
            {!loading && displayData.byAtribuicao.length > 0 && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Receita por Atribuição - Análise Detalhada
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pie Chart - Distribution */}
                        <Card className="border-border bg-card">
                            <CardHeader className="flex flex-row items-center gap-2">
                                <PieChart className="h-5 w-5 text-primary" />
                                <CardTitle className="text-sm font-medium text-card-foreground">Distribuição por Canal de Atribuição</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                    <RechartsPie>
                                        <Pie
                                            data={displayData.byAtribuicao.slice(0, 8).map((item: any, idx: number) => ({
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
                                            {displayData.byAtribuicao.slice(0, 8).map((_: any, index: number) => (
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
                                <CardTitle className="text-sm font-medium text-card-foreground">Evolução Diária por Atribuição</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                    <LineChart data={displayData.dailyRevenueByAtribuicao?.slice(-30) || []} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
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
                                        {(displayData.allAtribuicoes || []).slice(0, 6).map((atrib: string, idx: number) => (
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
                                    Últimos 30 dias • Receita diária por canal de atribuição
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            )}

            {/* Geographic Map */}
            {!loading && catalogoData && catalogoData.rawData && (
                <section>
                    <BrazilMap
                        rawData={catalogoData.rawData}
                        gadsData={gadsKpis}
                        sessionsData={ga4Kpis}
                    />
                </section>
            )}

            {/* YoY Analysis Section - Temporarily hidden for data verification */}
            {/* {!loading && filteredData?.yoy && (
                <section className="space-y-6">
                   ... (YoY content)
                </section>
            )} */}
        </div>
    );
}
