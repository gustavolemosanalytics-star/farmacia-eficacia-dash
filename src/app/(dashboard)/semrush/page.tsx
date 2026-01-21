'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageFilters } from '@/components/ui/PageFilters';
import {
    Search,
    Globe,
    TrendingUp,
    MousePointer,
    BarChart3,
    Activity,
    AlertCircle,
    Target,
    Zap,
    Eye,
    DollarSign,
    Award,
    Lightbulb
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    AreaChart,
    Area,
    LabelList
} from 'recharts';
import { cn } from '@/lib/utils';

export default function SemrushPage() {
    const [overview, setOverview] = useState<any>(null);
    const [keywords, setKeywords] = useState<any[]>([]);
    const [competitors, setCompetitors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                // Fetch All Data in Parallel
                const [ovRes, kwRes, compRes] = await Promise.all([
                    fetch('/api/semrush?type=domain_rank'),
                    fetch('/api/semrush?type=organic_keywords'),
                    fetch('/api/semrush?type=competitors')
                ]);

                const [ovData, kwData, compData] = await Promise.all([
                    ovRes.json(),
                    kwRes.json(),
                    compRes.json()
                ]);

                if (ovData.success) setOverview(ovData.data[0]);
                if (kwData.success) setKeywords(kwData.data || []);
                if (compData.success) setCompetitors(compData.data || []);

                if (ovData.error || kwData.error || compData.error) {
                    setError(ovData.error || kwData.error || compData.error);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="text-center">
                    <Activity className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="mt-2 text-muted-foreground">Consultando SEMRush API...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                    <div>
                        <h3 className="font-bold">Erro ao carregar dados do SEMRush</h3>
                        <p className="text-sm opacity-90">{error}</p>
                        <p className="text-xs mt-2 italic">Verifique sua chave de API e saldo de créditos.</p>
                    </div>
                </div>
            </div>
        );
    }

    // KPIs
    const organicKeywords = parseInt(overview?.Or || 0);
    const organicTraffic = parseInt(overview?.Ot || 0);
    const organicCost = parseInt(overview?.Oc || 0);
    const adwordsKeywords = parseInt(overview?.Ad || 0);

    const kpis = [
        {
            title: 'Organic Keywords',
            value: organicKeywords.toLocaleString(),
            description: 'Palavras-chave rankeando',
            icon: Search,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
        },
        {
            title: 'Organic Traffic',
            value: organicTraffic.toLocaleString(),
            description: 'Visitas estimadas/mês',
            icon: MousePointer,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
        },
        {
            title: 'Traffic Value',
            value: `USD ${organicCost.toLocaleString()}`,
            description: 'Valor equiv. em Ads',
            icon: DollarSign,
            color: 'text-primary',
            bgColor: 'bg-primary/10',
        },
        {
            title: 'AdWords Keywords',
            value: adwordsKeywords.toLocaleString(),
            description: 'Keywords em Paid Search',
            icon: BarChart3,
            color: 'text-orange-500',
            bgColor: 'bg-orange-500/10',
        }
    ];

    // Position Distribution Analysis
    const posDistData = [
        { name: 'Top 3', count: keywords.filter(k => parseInt(k.Po) <= 3).length, fill: '#10b981', opportunity: 'Manter' },
        { name: 'Pos 4-10', count: keywords.filter(k => parseInt(k.Po) > 3 && parseInt(k.Po) <= 10).length, fill: '#3b82f6', opportunity: 'Otimizar para Top 3' },
        { name: 'Pos 11-20', count: keywords.filter(k => parseInt(k.Po) > 10 && parseInt(k.Po) <= 20).length, fill: '#f59e0b', opportunity: 'Prioridade Alta' },
        { name: 'Pos 21-50', count: keywords.filter(k => parseInt(k.Po) > 20 && parseInt(k.Po) <= 50).length, fill: '#ef4444', opportunity: 'Conteúdo Longo' },
        { name: 'Pos 51+', count: keywords.filter(k => parseInt(k.Po) > 50).length, fill: '#94a3b8', opportunity: 'Revisar Estratégia' },
    ];

    // Traffic Distribution by Keyword
    const keywordsChartData = keywords
        .slice(0, 15)
        .map(kw => ({
            name: kw.Ph?.substring(0, 20) + (kw.Ph?.length > 20 ? '...' : '') || '',
            traffic: parseFloat(kw.Tr || 0),
            volume: parseInt(kw.Nq || 0),
            position: parseInt(kw.Po || 0),
            cpc: parseFloat(kw.Cp || 0),
        }));

    // Competitors Analysis
    const competitorsData = competitors.map(c => ({
        name: c.Dn?.replace('www.', '') || '',
        traffic: parseInt(c.Ot || 0),
        overlap: parseInt(c.Cr || 0),
        commonKw: parseInt(c.Np || 0),
    })).sort((a, b) => b.traffic - a.traffic);

    // Keyword Intent Analysis (based on keyword patterns)
    const intentAnalysis = {
        transactional: keywords.filter(k =>
            k.Ph?.toLowerCase().includes('comprar') ||
            k.Ph?.toLowerCase().includes('preço') ||
            k.Ph?.toLowerCase().includes('onde') ||
            k.Ph?.toLowerCase().includes('melhor')
        ).length,
        informational: keywords.filter(k =>
            k.Ph?.toLowerCase().includes('como') ||
            k.Ph?.toLowerCase().includes('o que') ||
            k.Ph?.toLowerCase().includes('para que')
        ).length,
        navigational: keywords.filter(k =>
            k.Ph?.toLowerCase().includes('farmacia') ||
            k.Ph?.toLowerCase().includes('eficacia')
        ).length,
        commercial: keywords.length - keywords.filter(k =>
            k.Ph?.toLowerCase().includes('comprar') ||
            k.Ph?.toLowerCase().includes('preço') ||
            k.Ph?.toLowerCase().includes('como') ||
            k.Ph?.toLowerCase().includes('o que')
        ).length
    };

    const intentPieData = [
        { name: 'Transacional', value: intentAnalysis.transactional, color: '#10b981' },
        { name: 'Informacional', value: intentAnalysis.informational, color: '#3b82f6' },
        { name: 'Navegacional', value: intentAnalysis.navigational, color: '#8b5cf6' },
        { name: 'Comercial', value: intentAnalysis.commercial, color: '#f59e0b' },
    ].filter(d => d.value > 0);

    // Top Opportunities (high volume, position 4-20)
    const topOpportunities = keywords
        .filter(k => parseInt(k.Po) >= 4 && parseInt(k.Po) <= 20 && parseInt(k.Nq) > 100)
        .sort((a, b) => parseInt(b.Nq) - parseInt(a.Nq))
        .slice(0, 10);

    // CPC Analysis (value of keywords)
    const avgCPC = keywords.length > 0
        ? keywords.reduce((sum, k) => sum + parseFloat(k.Cp || 0), 0) / keywords.length
        : 0;

    const highValueKeywords = keywords
        .filter(k => parseFloat(k.Cp) > avgCPC)
        .sort((a, b) => parseFloat(b.Cp) - parseFloat(a.Cp))
        .slice(0, 10);

    return (
        <div className="space-y-6">
            <PageFilters
                title="SEMRush Analytics"
                description="Análise completa de visibilidade orgânica para farmaciaeficacia.com.br"
            />

            {/* KPI Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {kpis.map((kpi, i) => (
                    <Card key={i} className="border-border bg-card hover:shadow-lg transition-shadow">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between space-x-4">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{kpi.title}</p>
                                    <p className="text-2xl font-bold text-card-foreground">{kpi.value}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">{kpi.description}</p>
                                </div>
                                <div className={cn("rounded-full p-3", kpi.bgColor, kpi.color)}>
                                    <kpi.icon className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-emerald-500/30 bg-emerald-500/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Award className="h-8 w-8 text-emerald-500" />
                            <div>
                                <p className="text-2xl font-bold">{posDistData[0].count + posDistData[1].count}</p>
                                <p className="text-xs text-muted-foreground">Keywords na 1ª página</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-blue-500/30 bg-blue-500/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Lightbulb className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-2xl font-bold">{topOpportunities.length}</p>
                                <p className="text-xs text-muted-foreground">Oportunidades de otimização</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-orange-500/30 bg-orange-500/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <DollarSign className="h-8 w-8 text-orange-500" />
                            <div>
                                <p className="text-2xl font-bold">USD {avgCPC.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">CPC médio das keywords</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 1: Position Distribution + Intent Analysis */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Position Distribution */}
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            Distribuição de Posições no Google
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={posDistData} layout="vertical" margin={{ left: 10, right: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} />
                                <YAxis type="category" dataKey="name" width={70} stroke="var(--muted-foreground)" fontSize={11} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    formatter={(value, _, props: any) => [`${value ?? 0} keywords`, props?.payload?.opportunity || '']}
                                />
                                <Bar dataKey="count" name="Keywords" radius={[0, 4, 4, 0]}>
                                    {posDistData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                    <LabelList dataKey="count" position="right" style={{ fill: 'var(--muted-foreground)', fontSize: '11px' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Keyword Intent Analysis */}
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Eye className="h-4 w-4 text-primary" />
                            Análise de Intenção de Busca
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={intentPieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {intentPieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    formatter={(value) => [`${value} keywords`]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Traffic Distribution + Competitor Comparison */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Traffic Distribution Chart */}
                <Card className="lg:col-span-2 border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            Distribuição de Tráfego por Keyword (Top 15)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={keywordsChartData} margin={{ left: 20, right: 30, top: 20 }}>
                                <defs>
                                    <linearGradient id="colorTrafficSR" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={9} angle={-45} textAnchor="end" height={80} />
                                <YAxis stroke="var(--muted-foreground)" fontSize={11} unit="%" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    formatter={(value, name) => [
                                        name === 'traffic' ? `${value ?? 0}%` : (value ?? 0).toLocaleString(),
                                        name === 'traffic' ? 'Traffic Share' : name === 'volume' ? 'Volume' : 'Posição'
                                    ]}
                                />
                                <Area type="monotone" dataKey="traffic" name="traffic" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorTrafficSR)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Competitor Radar */}
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Globe className="h-4 w-4 text-blue-500" />
                            Comparativo Competidores
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={competitorsData.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                                <YAxis type="category" dataKey="name" width={90} stroke="var(--muted-foreground)" fontSize={10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    formatter={(value) => [(value ?? 0).toLocaleString(), 'Tráfego']}
                                />
                                <Bar dataKey="traffic" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                                    {competitorsData.slice(0, 6).map((_, idx) => (
                                        <Cell key={idx} fill={idx === 0 ? '#8b5cf6' : '#3b82f6'} opacity={1 - (idx * 0.12)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Row 3: Opportunities Table + High Value Keywords */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Top Opportunities */}
                <Card className="border-border bg-card overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            Oportunidades de Otimização (Pos 4-20, Vol &gt; 100)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto max-h-[400px]">
                            <table className="w-full text-left text-xs text-muted-foreground">
                                <thead className="border-b border-border text-[10px] uppercase text-foreground/70 sticky top-0 bg-card">
                                    <tr>
                                        <th className="px-3 py-3">Keyword</th>
                                        <th className="px-3 py-3 text-center">Pos</th>
                                        <th className="px-3 py-3 text-center">Volume</th>
                                        <th className="px-3 py-3 text-right">Potencial</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {topOpportunities.map((kw, i) => {
                                        const pos = parseInt(kw.Po);
                                        const vol = parseInt(kw.Nq);
                                        const potential = pos <= 10 ? 'Alto' : pos <= 15 ? 'Médio' : 'Baixo';
                                        return (
                                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-3 py-2 font-medium text-foreground">{kw.Ph}</td>
                                                <td className="px-3 py-2 text-center">
                                                    <Badge variant="outline" className={pos <= 10 ? "border-emerald-500 text-emerald-500" : "border-yellow-500 text-yellow-500"}>
                                                        {pos}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-2 text-center font-mono">{vol.toLocaleString()}</td>
                                                <td className="px-3 py-2 text-right">
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded",
                                                        potential === 'Alto' ? "bg-emerald-500/10 text-emerald-500" :
                                                        potential === 'Médio' ? "bg-yellow-500/10 text-yellow-500" :
                                                        "bg-red-500/10 text-red-500"
                                                    )}>
                                                        {potential}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {topOpportunities.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                                                Nenhuma oportunidade identificada
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* High CPC Keywords */}
                <Card className="border-border bg-card overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-orange-500" />
                            Keywords de Alto Valor (CPC acima da média)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto max-h-[400px]">
                            <table className="w-full text-left text-xs text-muted-foreground">
                                <thead className="border-b border-border text-[10px] uppercase text-foreground/70 sticky top-0 bg-card">
                                    <tr>
                                        <th className="px-3 py-3">Keyword</th>
                                        <th className="px-3 py-3 text-center">Pos</th>
                                        <th className="px-3 py-3 text-center">CPC (USD)</th>
                                        <th className="px-3 py-3 text-right">Volume</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {highValueKeywords.map((kw, i) => (
                                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-3 py-2 font-medium text-foreground">{kw.Ph}</td>
                                            <td className="px-3 py-2 text-center">
                                                <Badge variant="outline" className={parseInt(kw.Po) <= 10 ? "border-emerald-500 text-emerald-500" : "bg-muted/30"}>
                                                    {kw.Po}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-2 text-center font-mono font-bold text-orange-500">${parseFloat(kw.Cp).toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right font-mono">{parseInt(kw.Nq).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 4: Full Keywords Table */}
            <Card className="border-border bg-card overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Search className="h-4 w-4 text-primary" />
                        Top 30 Organic Keywords (Detalhado)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full text-left text-xs text-muted-foreground">
                            <thead className="border-b border-border text-[10px] uppercase text-foreground/70 sticky top-0 bg-card z-10">
                                <tr>
                                    <th className="px-3 py-3">Keyword</th>
                                    <th className="px-3 py-3 text-center">Posição</th>
                                    <th className="px-3 py-3 text-center">Volume</th>
                                    <th className="px-3 py-3 text-center">CPC (USD)</th>
                                    <th className="px-3 py-3 text-center">Competição</th>
                                    <th className="px-3 py-3 text-right">Traffic %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {keywords.slice(0, 30).map((kw, i) => (
                                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-3 py-2 font-medium text-foreground">{kw.Ph}</td>
                                        <td className="px-3 py-2 text-center">
                                            <Badge variant="outline" className={parseInt(kw.Po) <= 3 ? "border-emerald-500 text-emerald-500 bg-emerald-500/5" : parseInt(kw.Po) <= 10 ? "border-blue-500 text-blue-500" : "bg-muted/30"}>
                                                {kw.Po}
                                            </Badge>
                                        </td>
                                        <td className="px-3 py-2 text-center font-mono">{Number(kw.Nq).toLocaleString()}</td>
                                        <td className="px-3 py-2 text-center font-mono">${kw.Cp}</td>
                                        <td className="px-3 py-2 text-center">
                                            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
                                                <div
                                                    className="bg-primary h-1.5 rounded-full"
                                                    style={{ width: `${parseFloat(kw.Co || 0) * 100}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-right font-bold text-foreground">{kw.Tr}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Competitors Full Table */}
            <Card className="border-border bg-card overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-500" />
                        Análise Detalhada de Concorrentes Orgânicos
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-muted-foreground">
                            <thead className="border-b border-border text-[10px] uppercase text-foreground/70 sticky top-0 bg-card">
                                <tr>
                                    <th className="px-3 py-3">Domínio</th>
                                    <th className="px-3 py-3 text-center">Tráfego Estimado</th>
                                    <th className="px-3 py-3 text-center">Keywords Comuns</th>
                                    <th className="px-3 py-3 text-center">Relevância</th>
                                    <th className="px-3 py-3 text-right">Ameaça</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {competitorsData.map((c, i) => {
                                    const threat = c.overlap > 50 ? 'Alta' : c.overlap > 25 ? 'Média' : 'Baixa';
                                    return (
                                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-3 py-2 font-medium text-foreground">{c.name}</td>
                                            <td className="px-3 py-2 text-center font-mono">{c.traffic.toLocaleString()}</td>
                                            <td className="px-3 py-2 text-center font-mono">{c.commonKw.toLocaleString()}</td>
                                            <td className="px-3 py-2 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-16 bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
                                                        <div
                                                            className="bg-blue-500 h-1.5 rounded-full"
                                                            style={{ width: `${c.overlap}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px]">{c.overlap}%</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <span className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded",
                                                    threat === 'Alta' ? "bg-red-500/10 text-red-500" :
                                                    threat === 'Média' ? "bg-yellow-500/10 text-yellow-500" :
                                                    "bg-emerald-500/10 text-emerald-500"
                                                )}>
                                                    {threat}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Action Card */}
            <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Zap className="h-10 w-10 text-primary" />
                            <div>
                                <h3 className="font-bold text-lg">Resumo Executivo</h3>
                                <p className="text-sm text-muted-foreground">
                                    Você tem <strong>{posDistData[0].count + posDistData[1].count}</strong> keywords na 1ª página,
                                    com <strong>{topOpportunities.length}</strong> oportunidades de otimização rápida.
                                    O valor estimado do tráfego orgânico é <strong>USD {organicCost.toLocaleString()}</strong>/mês.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
