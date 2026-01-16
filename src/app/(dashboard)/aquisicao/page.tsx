'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/ui/MockDataBadge';
import { GlobalDatePicker } from '@/components/ui/GlobalDatePicker';
import {
    ga4Data,
    getGA4KPIs,
    getTopAttribution,
    getDailyRevenue,
    getRevenueByState,
    getRevenueByCity,
    getStatusBreakdown,
    getTopProductsByAttribution
} from '@/lib/data/ga4Data';
import {
    TrendingDown, TrendingUp, BarChart3, PieChart, Activity, MapPin,
    ShoppingBag, AlignJustify, DollarSign, AlertCircle
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RechartsPie, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

const COLORS = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#60a5fa', '#81c995'];
const STATUS_COLORS = { 'Faturado': '#34A853', 'Cancelado': '#EA4335' }; // Green for Paid, Red for Cancelled

export default function AquisicaoPage() {
    // Fetch data (In a real app, we would filter by date here)
    const kpis = getGA4KPIs();
    const attributionData = getTopAttribution();
    const dailyData = getDailyRevenue();
    const stateData = getRevenueByState();
    const cityData = getRevenueByCity();
    const statusData = getStatusBreakdown();
    const topProducts = getTopProductsByAttribution();

    // Pie chart Data
    const pieData = Object.entries(kpis.byChannel).map(([name, value], index) => ({
        name: name === 'googleCPC' ? 'Google CPC' :
            name === 'blueCPC' ? 'Blue CPC' :
                name === 'organic' ? 'Orgânico' :
                    name === 'direct' ? 'Direto' :
                        name === 'email' ? 'Email' :
                            name === 'social' ? 'Social' : name,
        value,
        color: COLORS[index % COLORS.length]
    })).filter(item => item.value > 0);

    return (
        <div className="space-y-6">
            {/* Header with Date Picker */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <PageHeader
                    title="Aquisição & Tráfego"
                    description="Performance de canais, atribuição e produtos (Base: BD GA4)"
                    hasRealData={true}
                />
                <GlobalDatePicker />
            </div>

            {/* KPIs Principais */}
            <section>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <KPICard
                        data={{
                            id: 'receita',
                            titulo: 'Receita Total',
                            valor: kpis.totalRevenue,
                            valorFormatado: kpis.totalRevenue_formatted,
                            variacao: 12.5,
                            tendencia: 'up',
                            sparklineData: [1000, 1200, 1100, 1300, 1400, 1500, kpis.totalRevenue]
                        }}
                    />
                    <KPICard
                        data={{
                            id: 'transacoes',
                            titulo: 'Transações',
                            valor: kpis.totalTransactions,
                            valorFormatado: kpis.totalTransactions.toString(),
                            variacao: 8.2,
                            tendencia: 'up',
                            sparklineData: [10, 12, 15, 14, 18, 20, kpis.totalTransactions]
                        }}
                    />
                    <KPICard
                        data={{
                            id: 'ticket',
                            titulo: 'Ticket Médio',
                            valor: kpis.ticketMedio,
                            valorFormatado: kpis.ticketMedio_formatted,
                            variacao: 3.1,
                            tendencia: 'stable',
                            sparklineData: [120, 125, 130, 128, 132, 133, kpis.ticketMedio]
                        }}
                    />
                    <KPICard
                        data={{
                            id: 'roas_est',
                            titulo: 'Est. Conversão',
                            valor: 1.8,
                            valorFormatado: '1.8%',
                            variacao: -2.1,
                            tendencia: 'down',
                            sparklineData: [2.1, 2.0, 1.9, 1.85, 1.8]
                        }}
                    />
                </div>
            </section>

            {/* Row 1: Top Atribuição & Daily Revenue */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Atribuição 1 (Vertical Bar) */}
                <Card className="lg:col-span-1 border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <AlignJustify className="h-5 w-5 text-primary" />
                        <CardTitle className="text-sm font-medium text-card-foreground">Top Atribuição 1 (Receita)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={attributionData.slice(0, 5)} layout="vertical" margin={{ left: 40, right: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    stroke="var(--muted-foreground)"
                                    fontSize={11}
                                    width={80}
                                    tickFormatter={(val) => val === '' ? 'Orgânico' : val}
                                />
                                <Tooltip
                                    formatter={(value) => [`R$ ${Number(value || 0).toFixed(2)}`, 'Receita']}
                                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {attributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Receita por Dia (Area Chart) */}
                <Card className="lg:col-span-2 border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        <CardTitle className="text-sm font-medium text-card-foreground">Evolução de Receita (Diária)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenueDaily" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#34A853" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#34A853" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(val) => val.substring(0, 5)} />
                                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                                <Tooltip
                                    formatter={(value) => [`R$ ${Number(value || 0).toFixed(2)}`, 'Receita']}
                                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#34A853" fillOpacity={1} fill="url(#colorRevenueDaily)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Geo Analysis & Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Receita por UF */}
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <CardTitle className="text-sm font-medium text-card-foreground">Receita por Estado (UF)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stateData.slice(0, 8)} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                                <Tooltip
                                    formatter={(value) => [`R$ ${Number(value || 0).toFixed(2)}`, 'Receita']}
                                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                                <Bar dataKey="value" fill="#4285F4" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Receita por Cidade */}
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <CardTitle className="text-sm font-medium text-card-foreground">Top Cidades</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {cityData.map((city, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-muted-foreground w-4">{idx + 1}</span>
                                        <span className="text-sm text-foreground">{city.name}</span>
                                    </div>
                                    <span className="text-sm font-medium text-foreground">R$ {city.value.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Status Breakdown */}
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-primary" />
                        <CardTitle className="text-sm font-medium text-card-foreground">Pedidos: Faturado vs Cancelado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <RechartsPie>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.name === 'Faturado' ? '#34A853' : entry.name === 'Cancelado' ? '#EA4335' : COLORS[index]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </RechartsPie>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Top Products by Attribution */}
            <section>
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    Top Produtos por Origem
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Google Ads */}
                    <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-blue-700 dark:text-blue-400">Google Ads</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {topProducts.googleAds.length > 0 ? topProducts.googleAds.map((prod, idx) => (
                                    <div key={idx} className="flex flex-col border-b border-blue-100 dark:border-blue-800/50 pb-2 last:border-0 last:pb-0">
                                        <span className="text-xs font-medium text-foreground line-clamp-2">{prod.name}</span>
                                        <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">R$ {prod.value.toFixed(2)}</span>
                                    </div>
                                )) : <span className="text-xs text-muted-foreground">Sem dados</span>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Blue */}
                    <Card className="border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-900/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-indigo-700 dark:text-indigo-400">Blue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {topProducts.blue.length > 0 ? topProducts.blue.map((prod, idx) => (
                                    <div key={idx} className="flex flex-col border-b border-indigo-100 dark:border-indigo-800/50 pb-2 last:border-0 last:pb-0">
                                        <span className="text-xs font-medium text-foreground line-clamp-2">{prod.name}</span>
                                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">R$ {prod.value.toFixed(2)}</span>
                                    </div>
                                )) : <span className="text-xs text-muted-foreground">Sem dados</span>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Orgânico */}
                    <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-900/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-amber-700 dark:text-amber-400">Orgânico</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {topProducts.organic.length > 0 ? topProducts.organic.map((prod, idx) => (
                                    <div key={idx} className="flex flex-col border-b border-amber-100 dark:border-amber-800/50 pb-2 last:border-0 last:pb-0">
                                        <span className="text-xs font-medium text-foreground line-clamp-2">{prod.name}</span>
                                        <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">R$ {prod.value.toFixed(2)}</span>
                                    </div>
                                )) : <span className="text-xs text-muted-foreground">Sem dados</span>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Direto */}
                    <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-900/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Direto</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {topProducts.direct.length > 0 ? topProducts.direct.map((prod, idx) => (
                                    <div key={idx} className="flex flex-col border-b border-emerald-100 dark:border-emerald-800/50 pb-2 last:border-0 last:pb-0">
                                        <span className="text-xs font-medium text-foreground line-clamp-2">{prod.name}</span>
                                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">R$ {prod.value.toFixed(2)}</span>
                                    </div>
                                )) : <span className="text-xs text-muted-foreground">Sem dados</span>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}
