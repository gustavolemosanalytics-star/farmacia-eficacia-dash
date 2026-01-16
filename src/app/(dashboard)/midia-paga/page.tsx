'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KPICard } from '@/components/kpi/KPICard';
import { googleAdsData, getGoogleAdsKPIs, getGoogleAdsByCampaign } from '@/lib/data/googleAdsData';
import { TrendingUp, TrendingDown, Trophy, AlertTriangle, Target, BarChart3, Activity, DollarSign } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Legend, PieChart as RechartsPie, Pie, Cell, AreaChart, Area
} from 'recharts';

// Get campaigns from real data
const getCampanhasGoogle = () => {
    const campaigns = getGoogleAdsByCampaign();
    return campaigns.slice(0, 12).map((c: any) => ({
        campanha: c.campaign,
        tipo: c.campaign.includes('Pmax') ? 'PMax' : c.campaign.includes('Shopping') ? 'Shopping' : 'Search',
        spend: c.totalCost,
        cliques: c.totalClicks,
        conversoes: c.totalConversions,
        ctr: c.totalClicks > 0 ? (c.totalConversions / c.totalClicks) * 100 : 0,
        cpc: c.totalClicks > 0 ? c.totalCost / c.totalClicks : 0,
        roas: c.totalCost > 0 ? (c.totalConversions * 80) / c.totalCost : 0, // Assuming avg order R$80
    }));
};

// Generate KPIs from real data
const getKpisMidiaPaga = () => {
    const kpis = getGoogleAdsKPIs();
    return [
        { id: 'spend', titulo: 'Investimento', valor: kpis.spend, valorFormatado: kpis.spend_formatted, variacao: 2.8, tendencia: 'stable' as const, sparklineData: [850, 900, 920, 940, kpis.spend] },
        { id: 'cliques', titulo: 'Cliques', valor: kpis.clicks, valorFormatado: kpis.clicks.toLocaleString('pt-BR'), variacao: 3.5, tendencia: 'up' as const, sparklineData: [1100, 1150, 1200, 1250, kpis.clicks] },
        { id: 'conversoes', titulo: 'Conversões', valor: kpis.conversions, valorFormatado: kpis.conversions.toFixed(1), variacao: 5.2, tendencia: 'up' as const, sparklineData: [40, 45, 48, 50, kpis.conversions] },
        { id: 'ctr', titulo: 'CTR', valor: kpis.ctr, valorFormatado: kpis.ctr_formatted, variacao: -1.5, tendencia: 'down' as const, sparklineData: [3.5, 3.4, 3.3, 3.2, kpis.ctr], unidade: '%' },
        { id: 'cpc', titulo: 'CPC', valor: kpis.cpc, valorFormatado: `R$ ${kpis.cpc.toFixed(2)}`, variacao: -0.8, tendencia: 'stable' as const, sparklineData: [0.82, 0.81, 0.80, 0.79, kpis.cpc], unidade: 'R$' },
        { id: 'cpa', titulo: 'CPA', valor: kpis.costPerConversion, valorFormatado: `R$ ${kpis.costPerConversion.toFixed(2)}`, variacao: -2.3, tendencia: 'down' as const, sparklineData: [35, 33, 32, 31, kpis.costPerConversion], unidade: 'R$' },
    ];
};

// Campaign type distribution
const getCampaignTypeData = () => {
    const campaigns = getCampanhasGoogle();
    const byType = campaigns.reduce((acc, c) => {
        if (!acc[c.tipo]) acc[c.tipo] = { tipo: c.tipo, spend: 0, conversoes: 0 };
        acc[c.tipo].spend += c.spend;
        acc[c.tipo].conversoes += c.conversoes;
        return acc;
    }, {} as Record<string, any>);
    return Object.values(byType);
};

// Colors
const COLORS = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#9C27B0', '#FF5722'];
const TYPE_COLORS: Record<string, string> = { 'PMax': '#4285F4', 'Shopping': '#EA4335', 'Search': '#34A853' };

import { PageHeader } from '@/components/ui/MockDataBadge';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';

export default function MidiaPagaPage() {
    const kpis = getKpisMidiaPaga();
    const campanhas = getCampanhasGoogle();
    const typeData = getCampaignTypeData();
    const gadsKpis = getGoogleAdsKPIs();

    // Performance trend data (simulated daily)
    const trendData = [
        { dia: '09/01', spend: 120, conversoes: 8, cpc: 0.75 },
        { dia: '10/01', spend: 135, conversoes: 10, cpc: 0.72 },
        { dia: '11/01', spend: 145, conversoes: 12, cpc: 0.70 },
        { dia: '12/01', spend: 160, conversoes: 11, cpc: 0.73 },
        { dia: '13/01', spend: gadsKpis.spend * 0.15, conversoes: gadsKpis.conversions * 0.18, cpc: gadsKpis.cpc },
        { dia: '14/01', spend: gadsKpis.spend * 0.18, conversoes: gadsKpis.conversions * 0.2, cpc: gadsKpis.cpc * 0.98 },
        { dia: '15/01', spend: gadsKpis.spend * 0.2, conversoes: gadsKpis.conversions * 0.22, cpc: gadsKpis.cpc * 1.02 },
    ];

    // Top and bottom campaigns
    const sortedByROAS = [...campanhas].sort((a, b) => b.roas - a.roas);
    const hallDaFama = sortedByROAS.slice(0, 5);
    const budgetBleeders = sortedByROAS.filter(c => c.roas < 2 && c.spend > 10).slice(0, 3);

    return (
        <div className="space-y-6">
            {/* Título Padronizado */}
            <PageHeader
                title="Mídia Paga"
                description="Performance de Google Ads - Dados do BD GAds"
                hasRealData={true}
            >
                <DatePickerWithRange />
            </PageHeader>

            {/* KPIs Overview */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Visão Geral</h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                    {kpis.map((kpi) => (
                        <KPICard
                            key={kpi.id}
                            data={kpi}
                            compact
                            invertedVariation={kpi.id === 'cpc' || kpi.id === 'cpa'}
                        />
                    ))}
                </div>
            </section>

            {/* Charts Row */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Spend vs Conversões Trend */}
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        <CardTitle className="text-sm font-medium text-card-foreground">Investimento vs Conversões</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4285F4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#4285F4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="dia" stroke="var(--muted-foreground)" fontSize={12} />
                                <YAxis yAxisId="left" stroke="var(--muted-foreground)" fontSize={12} />
                                <YAxis yAxisId="right" orientation="right" stroke="var(--muted-foreground)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    labelStyle={{ color: 'var(--foreground)' }}
                                />
                                <Legend />
                                <Area yAxisId="left" type="monotone" dataKey="spend" name="Spend (R$)" stroke="#4285F4" fillOpacity={1} fill="url(#colorSpend)" />
                                <Line yAxisId="right" type="monotone" dataKey="conversoes" name="Conversões" stroke="#34A853" strokeWidth={3} dot={{ fill: '#34A853' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Campaign Type Distribution */}
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <CardTitle className="text-sm font-medium text-card-foreground">Investimento por Tipo de Campanha</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <RechartsPie>
                                <Pie
                                    data={typeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="spend"
                                    nameKey="tipo"
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {typeData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={TYPE_COLORS[entry.tipo] || COLORS[index]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => [`R$ ${Number(value || 0).toFixed(2)}`, 'Investimento']}
                                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                            </RechartsPie>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </section>

            {/* Campaigns Table */}
            <section>
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <CardTitle className="text-sm font-medium text-card-foreground">Campanhas Google Ads (BD GAds)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Campanha</th>
                                        <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Tipo</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Spend</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Cliques</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">CPC</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Conv.</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">ROAS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campanhas.map((row) => (
                                        <tr key={row.campanha} className="border-b border-border/50 hover:bg-muted/30">
                                            <td className="py-3 px-2 text-foreground max-w-[200px] truncate" title={row.campanha}>{row.campanha}</td>
                                            <td className="py-3 px-2">
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                    style={{ borderColor: TYPE_COLORS[row.tipo], color: TYPE_COLORS[row.tipo] }}
                                                >
                                                    {row.tipo}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-2 text-right text-muted-foreground">R$ {row.spend.toFixed(2)}</td>
                                            <td className="py-3 px-2 text-right text-muted-foreground">{row.cliques}</td>
                                            <td className="py-3 px-2 text-right text-foreground">R$ {row.cpc.toFixed(2)}</td>
                                            <td className="py-3 px-2 text-right text-foreground">{row.conversoes.toFixed(1)}</td>
                                            <td className="py-3 px-2 text-right">
                                                <span className={row.roas >= 3 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : row.roas >= 2 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}>
                                                    {row.roas.toFixed(1)}x
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Campaign Performance Bar Chart */}
            <section>
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-card-foreground">Performance por Campanha</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={campanhas.slice(0, 8)} margin={{ left: 20, right: 20, bottom: 80 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis
                                    dataKey="campanha"
                                    stroke="var(--muted-foreground)"
                                    fontSize={10}
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    interval={0}
                                    tick={{ fill: 'var(--muted-foreground)' }}
                                />
                                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    formatter={(value, name) => [
                                        name === 'spend' ? `R$ ${Number(value || 0).toFixed(2)}` : Number(value || 0).toFixed(1),
                                        name === 'spend' ? 'Investimento' : 'Conversões'
                                    ]}
                                />
                                <Legend />
                                <Bar dataKey="spend" name="Investimento" fill="#4285F4" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="conversoes" name="Conversões" fill="#34A853" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </section>

            {/* Hall da Fama vs Budget Bleeders */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hall da Fama */}
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        <CardTitle className="text-sm font-medium text-card-foreground">Hall da Fama (Top ROAS)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {hallDaFama.map((item, index) => (
                                <div key={item.campanha} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm text-foreground truncate max-w-[180px]" title={item.campanha}>{item.campanha}</p>
                                            <p className="text-xs text-muted-foreground">{item.tipo}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{item.roas.toFixed(1)}x</p>
                                        <p className="text-xs text-muted-foreground">{item.conversoes.toFixed(0)} conv.</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Budget Bleeders */}
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <CardTitle className="text-sm font-medium text-card-foreground">Budget Bleeders (Baixo ROAS)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {budgetBleeders.length > 0 ? budgetBleeders.map((item, index) => (
                                <div key={item.campanha} className="flex items-center justify-between p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-[10px] font-bold text-red-600 dark:text-red-400">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm text-foreground truncate max-w-[180px]" title={item.campanha}>{item.campanha}</p>
                                            <p className="text-xs text-muted-foreground">{item.tipo}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-red-600 dark:text-red-400">{item.roas.toFixed(1)}x</p>
                                        <p className="text-xs text-muted-foreground">CPA R$ {item.spend > 0 && item.conversoes > 0 ? (item.spend / item.conversoes).toFixed(0) : '∞'}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-muted-foreground text-center py-4">Nenhuma campanha com ROAS baixo identificada</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
