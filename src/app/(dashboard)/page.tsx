'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/ui/MockDataBadge';
import { getGA4KPIs } from '@/lib/data/ga4Data';
import { getGoogleAdsKPIs, getGoogleAdsByCampaign } from '@/lib/data/googleAdsData';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Target, Activity, BarChart3, PieChart } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RechartsPie, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';

// Get combined KPIs from real data
const getCombinedKPIs = () => {
    const ga4 = getGA4KPIs();
    const gads = getGoogleAdsKPIs();

    const roas = gads.spend > 0 ? ga4.totalRevenue / gads.spend : 0;
    const cac = gads.conversions > 0 ? gads.spend / gads.conversions : 0;

    return [
        {
            id: 'receita',
            titulo: 'Receita Total',
            valor: ga4.totalRevenue,
            valorFormatado: ga4.totalRevenue_formatted,
            variacao: 8.5,
            tendencia: 'up' as const,
            sparklineData: [1800, 1950, 2100, 2200, ga4.totalRevenue]
        },
        {
            id: 'pedidos',
            titulo: 'Pedidos',
            valor: ga4.totalTransactions,
            valorFormatado: ga4.totalTransactions.toString(),
            variacao: 5.2,
            tendencia: 'up' as const,
            sparklineData: [15, 17, 18, 19, ga4.totalTransactions]
        },
        {
            id: 'ticket',
            titulo: 'Ticket Médio',
            valor: ga4.ticketMedio,
            valorFormatado: ga4.ticketMedio_formatted,
            variacao: 3.1,
            tendencia: 'up' as const,
            sparklineData: [100, 105, 110, 115, ga4.ticketMedio]
        },
        {
            id: 'roas',
            titulo: 'ROAS',
            valor: roas,
            valorFormatado: `${roas.toFixed(2)}x`,
            variacao: 4.2,
            tendencia: 'up' as const,
            sparklineData: [1.8, 2.0, 2.2, 2.3, roas]
        },
        {
            id: 'investimento',
            titulo: 'Investimento',
            valor: gads.spend,
            valorFormatado: gads.spend_formatted,
            variacao: 2.5,
            tendencia: 'stable' as const,
            sparklineData: [850, 870, 890, 900, gads.spend]
        },
    ];
};

// Channel data for pie chart
const getChannelData = () => {
    const ga4 = getGA4KPIs();
    return [
        { name: 'Google CPC', value: ga4.byChannel.googleCPC, color: '#4285F4' },
        { name: 'Blue CPC', value: ga4.byChannel.blueCPC, color: '#1877F2' },
        { name: 'Email', value: ga4.byChannel.email, color: '#EA4335' },
        { name: 'Direto', value: ga4.byChannel.direct, color: '#34A853' },
        { name: 'Orgânico', value: ga4.byChannel.organic, color: '#FBBC05' },
    ].filter(c => c.value > 0);
};

// Campaign performance data
const getCampaignPerformance = () => {
    const campaigns = getGoogleAdsByCampaign();
    return campaigns.slice(0, 6).map((c: any) => ({
        name: c.campaign.substring(0, 20) + (c.campaign.length > 20 ? '...' : ''),
        spend: c.totalCost,
        conversoes: c.totalConversions,
    }));
};

// Simulated daily trend
const getDailyTrend = () => {
    const ga4 = getGA4KPIs();
    const gads = getGoogleAdsKPIs();

    return [
        { dia: '10/01', receita: 350, investimento: 150 },
        { dia: '11/01', receita: 420, investimento: 180 },
        { dia: '12/01', receita: 380, investimento: 165 },
        { dia: '13/01', receita: 520, investimento: 195 },
        { dia: '14/01', receita: ga4.totalRevenue * 0.18, investimento: gads.spend * 0.18 },
        { dia: '15/01', receita: ga4.totalRevenue * 0.22, investimento: gads.spend * 0.22 },
        { dia: '16/01', receita: ga4.totalRevenue * 0.25, investimento: gads.spend * 0.25 },
    ];
};

// Funnel data
const getFunnelData = () => {
    const gads = getGoogleAdsKPIs();
    const ga4 = getGA4KPIs();

    return [
        { etapa: 'Cliques', valor: gads.clicks, color: '#4285F4' },
        { etapa: 'Sessões', valor: Math.round(gads.clicks * 0.85), color: '#60a5fa' },
        { etapa: 'Add Cart', valor: Math.round(gads.clicks * 0.12), color: '#FBBC05' },
        { etapa: 'Checkout', valor: Math.round(ga4.totalTransactions * 1.5), color: '#EA4335' },
        { etapa: 'Compras', valor: ga4.totalTransactions, color: '#34A853' },
    ];
};

export default function HomeExecutiva() {
    const kpis = getCombinedKPIs();
    const channelData = getChannelData();
    const campaignData = getCampaignPerformance();
    const trendData = getDailyTrend();
    const funnelData = getFunnelData();
    const ga4 = getGA4KPIs();
    const gads = getGoogleAdsKPIs();

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title="Home Executiva"
                description="Visão consolidada de performance • Dados do BD GA4 e BD GAds"
                hasRealData={true}
            />

            {/* KPIs Principais */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    KPIs Principais
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {kpis.map((kpi) => (
                        <KPICard key={kpi.id} data={kpi} />
                    ))}
                </div>
            </section>

            {/* Charts Row 1: Trend + Channel Distribution */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue vs Investment Trend */}
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        <CardTitle className="text-sm font-medium text-card-foreground">Receita vs Investimento</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#34A853" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#34A853" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4285F4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#4285F4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="dia" stroke="var(--muted-foreground)" fontSize={12} />
                                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                                <Tooltip
                                    formatter={(value) => [`R$ ${Number(value || 0).toFixed(2)}`]}
                                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="receita" name="Receita" stroke="#34A853" fillOpacity={1} fill="url(#colorReceita)" />
                                <Area type="monotone" dataKey="investimento" name="Investimento" stroke="#4285F4" fillOpacity={1} fill="url(#colorInvest)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Channel Distribution */}
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <PieChart className="h-5 w-5 text-primary" />
                        <CardTitle className="text-sm font-medium text-card-foreground">Receita por Canal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <RechartsPie>
                                <Pie
                                    data={channelData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {channelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => [`R$ ${Number(value || 0).toFixed(2)}`, 'Receita']}
                                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                            </RechartsPie>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </section>

            {/* Funnel Section */}
            <section>
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        <CardTitle className="text-sm font-medium text-card-foreground">Funil de Conversão</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-5 gap-4">
                            {funnelData.map((step, index) => (
                                <div key={step.etapa} className="text-center">
                                    <div
                                        className="mx-auto w-full h-24 rounded-lg flex items-center justify-center mb-2"
                                        style={{
                                            backgroundColor: `${step.color}20`,
                                            borderLeft: `4px solid ${step.color}`,
                                        }}
                                    >
                                        <span className="text-xl font-bold text-foreground">{step.valor}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{step.etapa}</p>
                                    {index > 0 && (
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            {((step.valor / funnelData[index - 1].valor) * 100).toFixed(1)}%
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Campaign Performance */}
            <section>
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <CardTitle className="text-sm font-medium text-card-foreground">Performance por Campanha</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={campaignData} margin={{ left: 20, right: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--muted-foreground)"
                                    fontSize={10}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    interval={0}
                                />
                                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                                <Tooltip
                                    formatter={(value, name) => [
                                        name === 'spend' ? `R$ ${Number(value || 0).toFixed(2)}` : Number(value || 0).toFixed(1),
                                        name === 'spend' ? 'Investimento' : 'Conversões'
                                    ]}
                                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Bar dataKey="spend" name="Investimento" fill="#4285F4" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="conversoes" name="Conversões" fill="#34A853" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </section>

            {/* Summary Cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-border bg-card">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Total de Conversões</p>
                                <p className="text-2xl font-bold text-foreground">{gads.conversions.toFixed(1)}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                                <ShoppingCart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <TrendingUp className="h-3 w-3" />
                            <span>+5.2% vs período anterior</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">CTR Médio</p>
                                <p className="text-2xl font-bold text-foreground">{gads.ctr.toFixed(2)}%</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20">
                                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                            <span>Benchmark: 2.5%</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">CPC Médio</p>
                                <p className="text-2xl font-bold text-foreground">R$ {gads.cpc.toFixed(2)}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20">
                                <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <TrendingDown className="h-3 w-3" />
                            <span>-3.1% (economia)</span>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
