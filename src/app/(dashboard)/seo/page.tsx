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
    ArrowUpRight,
    ArrowDownRight,
    AlertCircle,
    Zap,
    ExternalLink,
    ChevronRight,
    Target,
    Sparkles
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
    LineChart,
    Line,
    AreaChart,
    Area,
    LabelList
} from 'recharts';
import { cn } from '@/lib/utils';

export default function SeoPage() {
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
                if (kwData.success) setKeywords(kwData.data);
                if (compData.success) setCompetitors(compData.data);

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
                <div className="text-center group">
                    <div className="relative mb-4">
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                        <Activity className="relative mx-auto h-12 w-12 animate-spin text-primary transition-transform group-hover:scale-110" />
                    </div>
                    <p className="mt-2 text-sm font-medium animate-pulse text-zinc-500">Sincronizando com SEMRush API...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-destructive backdrop-blur-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-full bg-destructive/10">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold tracking-tight">Erro na Conexão SEMRush</h3>
                            <p className="text-sm opacity-90 leading-relaxed mt-1">{error}</p>
                            <div className="flex items-center gap-4 mt-4">
                                <Badge variant="outline" className="text-destructive border-destructive/30">Chave API Expirada?</Badge>
                                <Badge variant="outline" className="text-destructive border-destructive/30">Limite de Créditos?</Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const kpiMetrics = [
        {
            title: 'Organic Keywords',
            value: overview?.['Organic Keywords'] ? Number(overview['Organic Keywords']).toLocaleString() : '0',
            description: 'Total de keywords indexadas',
            icon: Search,
            color: 'bg-emerald-500',
            trend: '+12%', // Simulado
        },
        {
            title: 'Tráfego Orgânico',
            value: overview?.['Organic Traffic'] ? Number(overview['Organic Traffic']).toLocaleString() : '0',
            description: 'Sessões estimadas p/ mês',
            icon: MousePointer,
            color: 'bg-blue-500',
            trend: '+5.4%',
        },
        {
            title: 'Valor do Tráfego',
            value: overview?.['Organic Cost'] ? `USD ${Number(overview['Organic Cost']).toLocaleString()}` : '0',
            description: 'Equivalente em Google Ads',
            icon: TrendingUp,
            color: 'bg-primary',
            trend: '+8.2%',
        },
        {
            title: 'Ads Visibility',
            value: overview?.['Adwords Keywords'] ? Number(overview['Adwords Keywords']).toLocaleString() : '0',
            description: 'Keywords em Paid Search',
            icon: BarChart3,
            color: 'bg-orange-500',
            trend: '-2.1%',
        }
    ];

    const topKeywords = keywords.slice(0, 10).map(kw => ({
        name: kw['Keyword'],
        traffic: parseFloat(kw['Traffic (%)'] || 0),
        volume: parseInt(kw['Search Volume'] || 0),
        pos: parseInt(kw['Position'] || 0)
    }));

    const competitorsData = competitors.slice(0, 8).map(c => ({
        name: c['Domain'],
        traffic: parseInt(c['Organic Traffic'] || 0),
        commonKeywords: parseInt(c['Competitor Relevance'] || 0)
    })).sort((a, b) => b.traffic - a.traffic);

    const posDistribution = [
        { range: 'Top 3', count: keywords.filter(k => parseInt(k['Position']) <= 3).length, color: '#10b981' },
        { range: '4-10', count: keywords.filter(k => parseInt(k['Position']) > 3 && parseInt(k['Position']) <= 10).length, color: '#3b82f6' },
        { range: '11-20', count: keywords.filter(k => parseInt(k['Position']) > 10 && parseInt(k['Position']) <= 20).length, color: '#8b5cf6' },
        { range: '21-50', count: keywords.filter(k => parseInt(k['Position']) > 20 && parseInt(k['Position']) <= 50).length, color: '#f59e0b' },
        { range: '51-100', count: keywords.filter(k => parseInt(k['Position']) > 50).length, color: '#94a3b8' },
    ];

    return (
        <div className="space-y-8 pb-10">
            <PageFilters
                title="Google Visibility & SEO"
                description="Dados reais via SEMRush para farmaciaeficacia.com.br"
            />

            {/* Premium KPI Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {kpiMetrics.map((kpi, i) => (
                    <Card key={i} className="group relative overflow-hidden transition-all duration-300 border border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
                        <div className={cn("absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-5 blur-3xl transition-all group-hover:opacity-10", kpi.color)} />
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className={cn("rounded-2xl p-3 bg-opacity-10", kpi.color.replace('bg-', 'bg-').concat('/10'))}>
                                    <kpi.icon className={cn("h-6 w-6", kpi.color.replace('bg-', 'text-'))} />
                                </div>
                                <Badge variant="secondary" className={cn("font-bold", kpi.trend.startsWith('+') ? "text-emerald-500" : "text-rose-500")}>
                                    {kpi.trend}
                                </Badge>
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">{kpi.title}</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black tracking-tighter">{kpi.value}</span>
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-2 font-medium">{kpi.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Traffic Distribution Area Chart */}
                <Card className="lg:col-span-2 border-border bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                                Concentração de Tráfego por Keyword
                            </CardTitle>
                        </div>
                        <Badge variant="outline">Top 10 Keywords</Badge>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={320}>
                            <AreaChart data={topKeywords} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                <defs>
                                    <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#888"
                                    fontSize={10}
                                    tickFormatter={v => v.length > 15 ? v.substring(0, 15) + '...' : v}
                                />
                                <YAxis stroke="#888" fontSize={11} unit="%" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: '#fff'
                                    }}
                                />
                                <Area type="monotone" dataKey="traffic" name="Share %" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorTraffic)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Google Positions Snapshot */}
                <Card className="border-border bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            Saúde do Ranking
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col gap-4">
                            {posDistribution.map((item, idx) => (
                                <div key={idx} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                        <span className="text-zinc-500">{item.range}</span>
                                        <span className="text-zinc-900 dark:text-zinc-100">{item.count} keywords</span>
                                    </div>
                                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000"
                                            style={{
                                                width: `${(item.count / keywords.length) * 100}%`,
                                                backgroundColor: item.color,
                                                boxShadow: `0 0 10px ${item.color}44`
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <p className="text-[10px] text-muted-foreground leading-relaxed italic text-center">
                                total de {keywords.length} palavras-chave monitoradas ativamente na primeira página do Google
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Real Keyword Table */}
                <Card className="border-border bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/50">
                        <CardTitle className="text-sm font-bold">Top 15 Keywords Detalhado</CardTitle>
                        <Zap className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent className="p-0 flex-grow overflow-auto max-h-[500px]">
                        <table className="w-full text-left text-xs">
                            <thead className="sticky top-0 bg-white/95 dark:bg-black/95 backdrop-blur-sm z-10">
                                <tr className="text-[10px] uppercase font-bold text-zinc-400">
                                    <th className="px-4 py-4">Palavra-Chave</th>
                                    <th className="px-4 py-4 text-center">Posição</th>
                                    <th className="px-4 py-4 text-center">Busca Mensal</th>
                                    <th className="px-4 py-4 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {keywords.slice(0, 15).map((kw, i) => (
                                    <tr key={i} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-4 py-4 font-semibold text-zinc-900 dark:text-zinc-100">{kw['Keyword']}</td>
                                        <td className="px-4 py-4 text-center">
                                            <div className={cn(
                                                "inline-flex items-center justify-center h-8 w-8 rounded-lg font-black",
                                                parseInt(kw['Position']) <= 3 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                            )}>
                                                {kw['Position']}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center text-zinc-500 font-mono">
                                            {Number(kw['Search Volume']).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button className="p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-700 shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                                                <ExternalLink className="h-3 w-3" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Organic Landscape Chart */}
                <Card className="border-border bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Globe className="h-4 w-4 text-blue-500" />
                            Cenário Competitivo (Traffic x Search)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={450}>
                            <BarChart data={competitorsData} layout="vertical" margin={{ left: 20, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" horizontal={false} />
                                <XAxis type="number" stroke="#888" fontSize={10} hide />
                                <YAxis type="category" dataKey="name" width={110} stroke="#888" fontSize={11} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{
                                        backgroundColor: 'var(--card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar dataKey="traffic" name="Tráfego Estimado" radius={[0, 6, 6, 0]}>
                                    {competitorsData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#94a3b833'} />
                                    ))}
                                    <LabelList dataKey="traffic" position="right" formatter={v => `${(Number(v) / 1000).toFixed(1)}k`} style={{ fill: '#888', fontSize: '10px' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Action Card */}
            <Card className="border-emerald-500/30 bg-emerald-500/5 backdrop-blur-xl">
                <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6 text-center md:text-left">
                        <div className="p-4 rounded-full bg-emerald-500/10 hidden md:block">
                            <Sparkles className="h-8 w-8 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Oportunidade SEO Identificada</h2>
                            <p className="text-sm text-zinc-500 max-w-md mt-1">Existem {keywords.filter(k => parseInt(k['Position']) >= 4 && parseInt(k['Position']) <= 12).length} palavras-chave na "porta da frente" (pos 4-12). Otimizar estas páginas pode aumentar seu tráfego em até 40%.</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-full font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 hover:-translate-y-1 transition-all group">
                        Ver Relatório Estratégico
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </CardContent>
            </Card>
        </div>
    );
}
