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
import { useCatalogoData, useGoogleAdsKPIs, useCatalogoYoYData } from '@/hooks/useSheetData';
import { GlobalDatePicker } from '@/components/ui/GlobalDatePicker';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

import { BrazilMap } from '@/components/charts/BrazilMap';

export default function HomeExecutiva() {
    const { data: catalogoData, loading: loadingCatalogo } = useCatalogoData();
    const { data: yoyRawData, loading: loadingYoY } = useCatalogoYoYData();
    const { kpis: gadsKpis, loading: loadingGads } = useGoogleAdsKPIs();

    // Filter states
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [filterAtribuicao, setFilterAtribuicao] = useState<string | null>(null);

    const loading = loadingCatalogo || loadingGads || loadingYoY;

    // Filter options from API
    const filterOptions = catalogoData?.filterOptions || {
        status: [],
        atribuicoes: [],
    };

    // Filtered data based on selected filters
    const filteredData = useMemo(() => {
        if (!catalogoData?.rawData) return null;

        let filtered = catalogoData.rawData;

        if (filterStatus) {
            filtered = filtered.filter((d: any) => d.status === filterStatus);
        } else {
            // Default active statuses if no filter is selected
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

        // Revenue by Category (excluding items without category)
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
            totalReceita,
            totalPedidos,
            ticketMedio,
            totalClientes: uniqueClients.size,
            receitaGoogleAds,
            byAtribuicao,
            byCategory,
            dailyRevenue,
            filteredRaw: filtered,
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
    }, [catalogoData, yoyRawData, filterStatus, filterAtribuicao]);


    // Use filtered data or default from API
    const displayData = filteredData || {
        totalReceita: catalogoData?.totalReceita || 0,
        receitaGoogleAds: catalogoData?.receitaGoogleAds || 0,
        totalPedidos: catalogoData?.totalPedidos || 0,
        ticketMedio: catalogoData?.ticketMedio || 0,
        totalClientes: catalogoData?.totalClientes || 0,
        byAtribuicao: catalogoData?.byAtribuicao || [],
        byCategory: catalogoData?.byCategory || [],
        dailyRevenue: catalogoData?.dailyRevenue || [],
        filteredRaw: [],
        yoy: null
    };

    // Receita Geral: Agora reflete os filtros de Status e Atribuição selecionados
    const receitaGeral = displayData.totalReceita;
    // Receita Mídia Paga: Agora reflete os filtros (Status) e a atribuição Google_Ads
    const receitaMidiaPaga = displayData.receitaGoogleAds;

    // Main KPIs
    const kpis = [
        {
            id: 'receita_geral',
            titulo: 'Receita Geral Magento',
            valor: receitaGeral,
            valorFormatado: `R$ ${receitaGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            variacao: 0,
            tendencia: 'up' as const,
            sparklineData: [receitaGeral * 0.8, receitaGeral * 0.85, receitaGeral * 0.9, receitaGeral * 0.95, receitaGeral],
        },
        {
            id: 'receita_midia_paga',
            titulo: 'Receita Mídia Paga (GAds)',
            valor: receitaMidiaPaga,
            valorFormatado: `R$ ${receitaMidiaPaga.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            variacao: 0,
            tendencia: 'up' as const,
            sparklineData: [receitaMidiaPaga * 0.8, receitaMidiaPaga * 0.85, receitaMidiaPaga * 0.9, receitaMidiaPaga * 0.95, receitaMidiaPaga],
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
    const ecommerceSpend = gadsKpis?.segmented?.ecommerce?.spend || 0;
    const roas = receitaMidiaPaga > 0 && ecommerceSpend > 0
        ? receitaMidiaPaga / ecommerceSpend
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

            {/* Margem de Contribuição por Canal */}
            {!loading && displayData.byAtribuicao.length > 0 && gadsKpis && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Margem de Contribuição por Canal
                    </h2>
                    <Card className="border-border bg-card">
                        <CardContent className="pt-6">
                            {(() => {
                                const totalReceita = displayData.byAtribuicao.reduce((sum: number, c: any) => sum + c.value, 0);
                                const totalInvestimento = gadsKpis?.spend || 0;

                                // Assumption: Average product margin is 40%, CAC varies by channel
                                const channelMetrics = displayData.byAtribuicao.slice(0, 6).map((channel: any, idx: number) => {
                                    const shareReceita = totalReceita > 0 ? channel.value / totalReceita : 0;
                                    // Estimate CAC distribution by channel type
                                    const isGoogleAds = channel.name?.toLowerCase().includes('google');
                                    const isMeta = channel.name?.toLowerCase().includes('meta') || channel.name?.toLowerCase().includes('facebook') || channel.name?.toLowerCase().includes('instagram');
                                    const isOrganic = channel.name?.toLowerCase().includes('organic') || channel.name?.toLowerCase().includes('direto');

                                    // CAC estimation based on channel type
                                    let cacMultiplier = 1;
                                    if (isGoogleAds) cacMultiplier = 0.45;
                                    else if (isMeta) cacMultiplier = 0.30;
                                    else if (isOrganic) cacMultiplier = 0.05;
                                    else cacMultiplier = 0.20;

                                    const investimentoCanal = totalInvestimento * shareReceita * cacMultiplier;
                                    const margemBruta = channel.value * 0.40; // 40% gross margin assumption
                                    const margemContribuicao = margemBruta - investimentoCanal;
                                    const margemPercentual = channel.value > 0 ? (margemContribuicao / channel.value) * 100 : 0;

                                    return {
                                        name: channel.name,
                                        receita: channel.value,
                                        investimento: investimentoCanal,
                                        margemBruta,
                                        margemContribuicao,
                                        margemPercentual,
                                        color: COLORS[idx % COLORS.length]
                                    };
                                });

                                return (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Canal</th>
                                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Receita</th>
                                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">CAC (Est.)</th>
                                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Margem Bruta</th>
                                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Margem Contrib.</th>
                                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">MC %</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {channelMetrics.map((ch: any) => (
                                                    <tr key={ch.name} className="border-b border-border/50 hover:bg-muted/50">
                                                        <td className="py-3 px-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ch.color }}></div>
                                                                <span className="font-medium">{ch.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="text-right py-3 px-2 font-mono">R$ {ch.receita.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</td>
                                                        <td className="text-right py-3 px-2 font-mono text-red-500">R$ {ch.investimento.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</td>
                                                        <td className="text-right py-3 px-2 font-mono">R$ {ch.margemBruta.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</td>
                                                        <td className={`text-right py-3 px-2 font-mono font-bold ${ch.margemContribuicao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            R$ {ch.margemContribuicao.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                                        </td>
                                                        <td className={`text-right py-3 px-2 font-bold ${ch.margemPercentual >= 25 ? 'text-green-600' : ch.margemPercentual >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                            {ch.margemPercentual.toFixed(1)}%
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <p className="text-xs text-muted-foreground mt-3">
                                            * Margem Bruta estimada em 40%. CAC estimado proporcionalmente ao tipo de canal. MC = Margem Bruta - CAC.
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

                                // Market benchmarks (industry averages)
                                const benchmarks = {
                                    conversionRate: 2.5, // 2.5% click to conversion
                                    cartToOrder: 65, // 65% conversion to order
                                };

                                // Actual rates
                                const actualConvRate = cliques > 0 ? (conversoes / cliques) * 100 : 0;
                                const actualClosureRate = conversoes > 0 ? (pedidos / conversoes) * 100 : 0;

                                const funnelSteps = [
                                    {
                                        name: 'Cliques Ads',
                                        value: cliques,
                                        rate: 100,
                                        benchmark: 100,
                                        gap: 0,
                                        color: '#4285F4'
                                    },
                                    {
                                        name: 'Conversões GAds',
                                        value: Math.round(conversoes),
                                        rate: actualConvRate,
                                        benchmark: benchmarks.conversionRate,
                                        gap: actualConvRate - benchmarks.conversionRate,
                                        color: '#FBBC05'
                                    },
                                    {
                                        name: 'Pedidos Fechados',
                                        value: pedidos,
                                        rate: actualClosureRate,
                                        benchmark: benchmarks.cartToOrder,
                                        gap: actualClosureRate - benchmarks.cartToOrder,
                                        color: '#34A853'
                                    },
                                ];

                                const maxValue = Math.max(...funnelSteps.map(s => s.value));

                                return (
                                    <div className="space-y-4">
                                        {funnelSteps.map((step, idx) => (
                                            <div key={step.name} className="relative">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-sm">{step.name}</span>
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <span className="font-mono">{step.value.toLocaleString('pt-BR')}</span>
                                                        {idx > 0 && (
                                                            <span className={`font-bold ${step.gap >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                                {step.rate.toFixed(1)}%
                                                                <span className="text-xs ml-1">
                                                                    ({step.gap >= 0 ? '+' : ''}{step.gap.toFixed(1)}% vs mercado)
                                                                </span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="h-8 bg-slate-100 dark:bg-zinc-800 rounded-lg overflow-hidden relative">
                                                    <div
                                                        className="h-full rounded-lg transition-all duration-500"
                                                        style={{
                                                            width: `${(step.value / maxValue) * 100}%`,
                                                            backgroundColor: step.color
                                                        }}
                                                    />
                                                </div>
                                                {idx > 0 && step.gap < 0 && (
                                                    <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        <span>Gap de {Math.abs(step.gap).toFixed(1)} pontos percentuais abaixo do mercado</span>
                                                    </div>
                                                )}
                                                {idx > 0 && step.gap >= 0 && (
                                                    <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                                                        <CheckCircle className="h-3 w-3" />
                                                        <span>Acima do benchmark de mercado (+{step.gap.toFixed(1)}pp)</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        <p className="text-xs text-muted-foreground mt-4">
                                            Benchmarks: Taxa de Conversão 2.5%, Fechamento de Pedidos 65%.
                                        </p>
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Análise por Campanha e Tipo de Cliente (BD Mag - Camp) */}
            {!loading && displayData.filteredRaw && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Análise de Campanhas e Clientes (Fonte: Magento)
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Receita por Campanha (Coluna Camp) */}
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Top Campanhas (Magento - Coluna Camp)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {(() => {
                                        const campStats: Record<string, { receita: number; pedidos: number }> = {};
                                        displayData.filteredRaw.forEach((d: any) => {
                                            const camp = d.campanha || 'Outras / Direto';
                                            if (!campStats[camp]) campStats[camp] = { receita: 0, pedidos: 0 };
                                            campStats[camp].receita += d.receitaProduto || 0;
                                            campStats[camp].pedidos += 1;
                                        });

                                        const sortedStats = Object.entries(campStats)
                                            .map(([name, data]) => ({ name, ...data }))
                                            .sort((a, b) => b.receita - a.receita)
                                            .slice(0, 5);

                                        const totalReceita = sortedStats.reduce((s, d) => s + d.receita, 0);

                                        return sortedStats.map((item, i) => (
                                            <div key={item.name} className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="font-medium truncate max-w-[200px]">{item.name}</span>
                                                    <span className="text-muted-foreground">R$ {item.receita.toLocaleString('pt-BR')} • {item.pedidos} ped.</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary"
                                                        style={{ width: `${(item.receita / sortedStats[0].receita) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status dos Pedidos */}
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Status dos Pedidos (Resumo)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {(() => {
                                        const statusStats: Record<string, { receita: number; count: number }> = {};
                                        displayData.filteredRaw.forEach((d: any) => {
                                            const status = d.status || 'Sem Status';
                                            if (!statusStats[status]) statusStats[status] = { receita: 0, count: 0 };
                                            statusStats[status].receita += d.receitaProduto || 0;
                                            statusStats[status].count += 1;
                                        });

                                        const sortedStatus = Object.entries(statusStats)
                                            .map(([name, data]) => ({ name, ...data }))
                                            .sort((a, b) => b.receita - a.receita);

                                        return sortedStatus.map((item) => (
                                            <div key={item.name} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/50">
                                                <div className="flex items-center gap-2">
                                                    <Activity className="h-3 w-3 text-muted-foreground" />
                                                    <span className="capitalize">{item.name}</span>
                                                </div>
                                                <div className="flex gap-4">
                                                    <span className="font-medium">R$ {item.receita.toLocaleString('pt-BR')}</span>
                                                    <span className="text-muted-foreground">{item.count} ped.</span>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            )}

            {/* Vendas por Hora - Análise de Horário Pico */}
            {!loading && catalogoData?.rawData && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Vendas por Hora do Dia
                    </h2>
                    <Card className="border-border bg-card">
                        <CardContent className="pt-6">
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart
                                    data={(() => {
                                        // Aggregate sales by hour
                                        const hourlyMap: { [key: number]: { receita: number; pedidos: number } } = {};
                                        for (let i = 0; i < 24; i++) {
                                            hourlyMap[i] = { receita: 0, pedidos: 0 };
                                        }

                                        catalogoData.rawData.filter((d: any) =>
                                            d.status?.toLowerCase().includes('complete') ||
                                            d.status?.toLowerCase().includes('completo') ||
                                            d.status?.toLowerCase().includes('pago') ||
                                            d.status?.toLowerCase().includes('enviado') ||
                                            d.status?.toLowerCase().includes('faturado') ||
                                            !d.status
                                        ).forEach((d: any) => {
                                            const hora = d.hora || d.horaSimples;
                                            if (hora) {
                                                // Parse hour from "HH:MM:SS" or just "HH"
                                                const hourStr = hora.toString().split(':')[0];
                                                const hour = parseInt(hourStr);
                                                if (!isNaN(hour) && hour >= 0 && hour < 24) {
                                                    hourlyMap[hour].receita += d.receitaProduto || 0;
                                                    hourlyMap[hour].pedidos += 1;
                                                }
                                            }
                                        });

                                        return Object.entries(hourlyMap)
                                            .map(([hour, data]) => ({
                                                hora: `${hour.padStart(2, '0')}h`,
                                                receita: data.receita,
                                                pedidos: data.pedidos
                                            }))
                                            .filter(d => d.receita > 0 || d.pedidos > 0);
                                    })()}
                                    margin={{ top: 20, right: 60, left: 0, bottom: 50 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis
                                        dataKey="hora"
                                        stroke="var(--muted-foreground)"
                                        fontSize={10}
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={50}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        stroke="var(--muted-foreground)"
                                        fontSize={10}
                                        tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        stroke="#10b981"
                                        fontSize={10}
                                        tickFormatter={(v) => v.toString()}
                                    />
                                    <Tooltip
                                        formatter={(value: any, name: any) => [
                                            name === 'receita'
                                                ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                                : value,
                                            name === 'receita' ? 'Receita' : 'Pedidos'
                                        ]}
                                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="receita" fill="#8b5cf6" name="Receita" radius={[4, 4, 0, 0]}>
                                        <LabelList
                                            dataKey="receita"
                                            position="top"
                                            formatter={(v: any) => Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(1)}k` : ''}
                                            style={{ fill: 'var(--muted-foreground)', fontSize: '9px' }}
                                        />
                                    </Bar>
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="pedidos"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        name="Pedidos"
                                        dot={{ fill: '#10b981', r: 3 }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                            <p className="text-xs text-muted-foreground text-center mt-2">
                                Receita (barras) e Quantidade de Pedidos (linha) por hora do dia baseada no campo "Hora: Min: Seg" do BD Mag
                            </p>
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
                                        <LabelList
                                            dataKey="value"
                                            position="right"
                                            formatter={(val: any) => `R$ ${(Number(val) / 1000).toFixed(1)}k`}
                                            style={{ fill: 'var(--muted-foreground)', fontSize: '11px' }}
                                        />
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

            {/* YoY Analysis Section */}
            {!loading && filteredData?.yoy && (
                <section className="space-y-6">
                    {/* Monthly Comparison Chart */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium">Análise Ano a Ano (YoY) - Receita Mensal</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={320}>
                                <LineChart data={filteredData.yoy.monthlyComparison} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                                    <YAxis
                                        stroke="var(--muted-foreground)"
                                        fontSize={10}
                                        tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                                        width={70}
                                    />
                                    <Tooltip
                                        formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]}
                                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="currentYear"
                                        name={`${filteredData.yoy.currentYear}`}
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#8b5cf6' }}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="previousYear"
                                        name={`${filteredData.yoy.previousYear}`}
                                        stroke="#94a3b8"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={{ r: 3, fill: '#94a3b8' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* YoY KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-border bg-card">
                            <CardContent className="pt-6 text-center">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Receita YoY</p>
                                <p className={`text-3xl font-bold ${filteredData.yoy.receitaYoYPercent >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {filteredData.yoy.receitaYoYPercent >= 0 ? '+' : ''}{filteredData.yoy.receitaYoYPercent.toFixed(1)}%
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {filteredData.yoy.previousYear}: R$ {filteredData.yoy.previousYearReceita.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-border bg-card">
                            <CardContent className="pt-6 text-center">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Pedidos YoY</p>
                                <p className={`text-3xl font-bold ${filteredData.yoy.pedidosYoYPercent >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {filteredData.yoy.pedidosYoYPercent >= 0 ? '+' : ''}{filteredData.yoy.pedidosYoYPercent.toFixed(1)}%
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {filteredData.yoy.previousYear}: {filteredData.yoy.previousYearPedidos.toLocaleString('pt-BR')} pedidos
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-border bg-card">
                            <CardContent className="pt-6 text-center">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Ticket Médio YoY</p>
                                <p className={`text-3xl font-bold ${filteredData.yoy.ticketYoYPercent >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {filteredData.yoy.ticketYoYPercent >= 0 ? '+' : ''}{filteredData.yoy.ticketYoYPercent.toFixed(1)}%
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Variação do ticket médio anual
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Top Growing Categories */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium">Top Categorias em Crescimento (YoY)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart
                                    data={filteredData.yoy.categoryGrowth}
                                    layout="vertical"
                                    margin={{ left: 20, right: 80, top: 10, bottom: 10 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                    <XAxis
                                        type="number"
                                        tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`}
                                        stroke="var(--muted-foreground)"
                                        fontSize={10}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={120}
                                        stroke="var(--muted-foreground)"
                                        fontSize={10}
                                        tickFormatter={(v) => v.length > 18 ? v.substring(0, 18) + '...' : v}
                                    />
                                    <Tooltip
                                        formatter={(value: any, name: any) => [
                                            `${Number(value) >= 0 ? '+' : ''}${Number(value).toFixed(1)}%`,
                                            'Crescimento'
                                        ]}
                                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="growth" radius={[0, 4, 4, 0]}>
                                        {filteredData.yoy.categoryGrowth.map((entry: any, index: number) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.growth >= 0 ? '#10b981' : '#ef4444'}
                                            />
                                        ))}
                                        <LabelList
                                            dataKey="growth"
                                            position="right"
                                            formatter={(v: any) => `${Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(1)}%`}
                                            style={{ fill: 'var(--muted-foreground)', fontSize: '10px', fontWeight: '500' }}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </section>
            )}
        </div>
    );
}
