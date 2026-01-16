'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/kpi/KPICard';
import { getGA4KPIs, ga4Data } from '@/lib/data/ga4Data';
import { getGoogleAdsKPIs, googleAdsData } from '@/lib/data/googleAdsData';
import { TrendingUp, TrendingDown, ArrowRight, DollarSign, Target, MousePointer, ShoppingCart, CreditCard, CheckCircle, Activity, BarChart3, Zap } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Legend, AreaChart, Area, Sankey, FunnelChart as RechartsFunnel
} from 'recharts';

// Combine GA4 and GAds data for funnel analysis
const getFunnelMetrics = () => {
    const gadsKpis = getGoogleAdsKPIs();
    const ga4Kpis = getGA4KPIs();

    // Calculate funnel metrics
    const impressions = gadsKpis.clicks * 35; // Estimate based on avg CTR
    const clicks = gadsKpis.clicks;
    const sessions = Math.round(clicks * 0.85); // Some clicks don't become sessions
    const addToCart = Math.round(sessions * 0.12); // 12% add to cart rate
    const checkoutStart = Math.round(addToCart * 0.6); // 60% proceed to checkout
    const purchases = ga4Kpis.totalTransactions;

    return {
        impressions,
        clicks,
        sessions,
        addToCart,
        checkoutStart,
        purchases,
        ctr: clicks / impressions * 100,
        sessionRate: sessions / clicks * 100,
        addToCartRate: addToCart / sessions * 100,
        checkoutRate: checkoutStart / addToCart * 100,
        conversionRate: purchases / checkoutStart * 100,
        overallCR: purchases / sessions * 100,
    };
};

// Channel ROI analysis (combining GAds spend with GA4 revenue)
const getChannelROI = () => {
    const gadsKpis = getGoogleAdsKPIs();
    const ga4Kpis = getGA4KPIs();

    return {
        googleAds: {
            spend: gadsKpis.spend,
            revenue: ga4Kpis.byChannel.googleCPC,
            roas: ga4Kpis.byChannel.googleCPC / gadsKpis.spend,
            conversions: gadsKpis.conversions,
        },
        blue: {
            spend: gadsKpis.spend * 0.15, // Estimate
            revenue: ga4Kpis.byChannel.blueCPC,
            roas: ga4Kpis.byChannel.blueCPC / (gadsKpis.spend * 0.15),
            conversions: gadsKpis.conversions * 0.2,
        },
        total: {
            spend: gadsKpis.spend * 1.15,
            revenue: ga4Kpis.totalRevenue,
            roas: ga4Kpis.totalRevenue / (gadsKpis.spend * 1.15),
        }
    };
};

// Funnel visualization data
const getFunnelData = () => {
    const metrics = getFunnelMetrics();
    return [
        { name: 'Impressões', value: metrics.impressions, fill: '#94a3b8', icon: 'eye' },
        { name: 'Cliques', value: metrics.clicks, fill: '#4285F4', icon: 'mouse' },
        { name: 'Sessões', value: metrics.sessions, fill: '#60a5fa', icon: 'activity' },
        { name: 'Add to Cart', value: metrics.addToCart, fill: '#FBBC05', icon: 'cart' },
        { name: 'Checkout', value: metrics.checkoutStart, fill: '#EA4335', icon: 'credit' },
        { name: 'Compras', value: metrics.purchases, fill: '#34A853', icon: 'check' },
    ];
};

// KPIs combining both sources
const getCombinedKPIs = () => {
    const gadsKpis = getGoogleAdsKPIs();
    const ga4Kpis = getGA4KPIs();
    const roi = getChannelROI();

    return [
        {
            id: 'roas',
            titulo: 'ROAS Geral',
            valor: roi.total.roas,
            valorFormatado: `${roi.total.roas.toFixed(2)}x`,
            variacao: 5.2,
            tendencia: 'up' as const,
            sparklineData: [1.8, 2.0, 2.2, 2.3, roi.total.roas]
        },
        {
            id: 'cac',
            titulo: 'CAC',
            valor: gadsKpis.costPerConversion,
            valorFormatado: `R$ ${gadsKpis.costPerConversion.toFixed(2)}`,
            variacao: -3.5,
            tendencia: 'down' as const,
            sparklineData: [35, 32, 30, 28, gadsKpis.costPerConversion]
        },
        {
            id: 'ltv_cac',
            titulo: 'LTV/CAC',
            valor: ga4Kpis.ticketMedio / gadsKpis.costPerConversion,
            valorFormatado: `${(ga4Kpis.ticketMedio / gadsKpis.costPerConversion).toFixed(2)}x`,
            variacao: 8.1,
            tendencia: 'up' as const,
            sparklineData: [2.5, 2.8, 3.0, 3.2, ga4Kpis.ticketMedio / gadsKpis.costPerConversion]
        },
        {
            id: 'cr',
            titulo: 'Taxa de Conversão',
            valor: getFunnelMetrics().overallCR,
            valorFormatado: `${getFunnelMetrics().overallCR.toFixed(2)}%`,
            variacao: 2.3,
            tendencia: 'up' as const,
            sparklineData: [1.5, 1.7, 1.9, 2.0, getFunnelMetrics().overallCR],
            unidade: '%'
        },
    ];
};

// Colors
const FUNNEL_COLORS = ['#94a3b8', '#4285F4', '#60a5fa', '#FBBC05', '#EA4335', '#34A853'];

export default function FunilPage() {
    const funnelData = getFunnelData();
    const funnelMetrics = getFunnelMetrics();
    const roi = getChannelROI();
    const combinedKpis = getCombinedKPIs();
    const ga4Kpis = getGA4KPIs();
    const gadsKpis = getGoogleAdsKPIs();

    // Trend data showing the relationship between spend and revenue
    const trendData = [
        { dia: '10/01', spend: 150, revenue: 350, roas: 2.33 },
        { dia: '11/01', spend: 180, revenue: 420, roas: 2.33 },
        { dia: '12/01', spend: 165, revenue: 450, roas: 2.73 },
        { dia: '13/01', spend: 195, revenue: 520, roas: 2.67 },
        { dia: '14/01', spend: gadsKpis.spend * 0.18, revenue: ga4Kpis.totalRevenue * 0.18, roas: roi.total.roas * 0.95 },
        { dia: '15/01', spend: gadsKpis.spend * 0.22, revenue: ga4Kpis.totalRevenue * 0.22, roas: roi.total.roas },
    ];

    return (
        <div className="space-y-6">
            {/* Título */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Funil de Conversão</h1>
                <p className="text-sm text-muted-foreground">Análise cruzada BD GAds + BD GA4 - Do clique à conversão</p>
            </div>

            {/* KPIs Combinados */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Métricas Integradas (GAds + GA4)</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {combinedKpis.map((kpi) => (
                        <KPICard
                            key={kpi.id}
                            data={kpi}
                            invertedVariation={kpi.id === 'cac'}
                        />
                    ))}
                </div>
            </section>

            {/* Visual Funnel */}
            <section>
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        <CardTitle className="text-sm font-medium text-card-foreground">Funil de Conversão Visual</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap items-center justify-center gap-2 py-6">
                            {funnelData.map((step, index) => (
                                <div key={step.name} className="flex items-center">
                                    <div
                                        className="flex flex-col items-center p-4 rounded-xl border border-border min-w-[120px]"
                                        style={{ backgroundColor: `${step.fill}15` }}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                                            style={{ backgroundColor: step.fill }}
                                        >
                                            {step.icon === 'mouse' && <MousePointer className="h-5 w-5 text-white" />}
                                            {step.icon === 'activity' && <Activity className="h-5 w-5 text-white" />}
                                            {step.icon === 'cart' && <ShoppingCart className="h-5 w-5 text-white" />}
                                            {step.icon === 'credit' && <CreditCard className="h-5 w-5 text-white" />}
                                            {step.icon === 'check' && <CheckCircle className="h-5 w-5 text-white" />}
                                            {step.icon === 'eye' && <Target className="h-5 w-5 text-white" />}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{step.name}</p>
                                        <p className="text-lg font-bold text-foreground">{step.value.toLocaleString('pt-BR')}</p>
                                        {index > 0 && (
                                            <p className="text-xs mt-1" style={{ color: step.fill }}>
                                                {((step.value / funnelData[index - 1].value) * 100).toFixed(1)}%
                                            </p>
                                        )}
                                    </div>
                                    {index < funnelData.length - 1 && (
                                        <ArrowRight className="h-5 w-5 text-muted-foreground mx-1" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Funnel Bar Chart */}
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={funnelData} layout="vertical" margin={{ left: 80, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
                                <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={12} width={80} />
                                <Tooltip
                                    formatter={(value) => [Number(value || 0).toLocaleString('pt-BR'), 'Quantidade']}
                                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {funnelData.map((entry, index) => (
                                        <Bar key={`bar-${index}`} dataKey="value" fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </section>

            {/* ROI Analysis */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Spend vs Revenue Trend */}
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <CardTitle className="text-sm font-medium text-card-foreground">Investimento vs Receita (Diário)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSpendFunnel" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EA4335" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#EA4335" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#34A853" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#34A853" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="dia" stroke="var(--muted-foreground)" fontSize={12} />
                                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                                <Tooltip
                                    formatter={(value, name) => [`R$ ${Number(value || 0).toFixed(2)}`, name === 'spend' ? 'Investimento' : 'Receita']}
                                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="spend" name="Investimento" stroke="#EA4335" fillOpacity={1} fill="url(#colorSpendFunnel)" />
                                <Area type="monotone" dataKey="revenue" name="Receita" stroke="#34A853" fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Channel ROI Comparison */}
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <CardTitle className="text-sm font-medium text-card-foreground">ROI por Canal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Google Ads */}
                            <div className="p-4 rounded-lg border border-border bg-muted/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-foreground">Google Ads</span>
                                    <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30">
                                        ROAS {roi.googleAds.roas.toFixed(2)}x
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Investido</p>
                                        <p className="text-sm font-bold text-foreground">R$ {roi.googleAds.spend.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Receita</p>
                                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">R$ {roi.googleAds.revenue.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Lucro</p>
                                        <p className="text-sm font-bold text-foreground">R$ {(roi.googleAds.revenue - roi.googleAds.spend).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Blue/Retargeting */}
                            <div className="p-4 rounded-lg border border-border bg-muted/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-foreground">Blue (Retargeting)</span>
                                    <Badge className="bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30">
                                        ROAS {roi.blue.roas.toFixed(2)}x
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Investido</p>
                                        <p className="text-sm font-bold text-foreground">R$ {roi.blue.spend.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Receita</p>
                                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">R$ {roi.blue.revenue.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Lucro</p>
                                        <p className="text-sm font-bold text-foreground">R$ {(roi.blue.revenue - roi.blue.spend).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="p-4 rounded-lg border-2 border-primary/50 bg-primary/5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-primary" />
                                        Total Consolidado
                                    </span>
                                    <Badge className="bg-primary/20 text-primary border-primary/30">
                                        ROAS {roi.total.roas.toFixed(2)}x
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Investido</p>
                                        <p className="text-lg font-bold text-foreground">R$ {roi.total.spend.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Receita</p>
                                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">R$ {roi.total.revenue.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Lucro</p>
                                        <p className="text-lg font-bold text-foreground">R$ {(roi.total.revenue - roi.total.spend).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Conversion Rates */}
            <section>
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-card-foreground">Taxas de Conversão por Etapa</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div className="p-4 rounded-lg border border-border bg-muted/30 text-center">
                                <p className="text-xs text-muted-foreground mb-1">CTR (Impressão → Clique)</p>
                                <p className="text-2xl font-bold text-foreground">{funnelMetrics.ctr.toFixed(2)}%</p>
                            </div>
                            <div className="p-4 rounded-lg border border-border bg-muted/30 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Clique → Sessão</p>
                                <p className="text-2xl font-bold text-foreground">{funnelMetrics.sessionRate.toFixed(1)}%</p>
                            </div>
                            <div className="p-4 rounded-lg border border-border bg-muted/30 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Add to Cart Rate</p>
                                <p className="text-2xl font-bold text-foreground">{funnelMetrics.addToCartRate.toFixed(1)}%</p>
                            </div>
                            <div className="p-4 rounded-lg border border-border bg-muted/30 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Checkout Rate</p>
                                <p className="text-2xl font-bold text-foreground">{funnelMetrics.checkoutRate.toFixed(1)}%</p>
                            </div>
                            <div className="p-4 rounded-lg border border-primary/50 bg-primary/5 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Taxa de Conversão</p>
                                <p className="text-2xl font-bold text-primary">{funnelMetrics.overallCR.toFixed(2)}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
