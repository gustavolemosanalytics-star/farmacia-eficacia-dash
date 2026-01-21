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
    AlertCircle
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

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
                // Fetch Overview
                const ovRes = await fetch('/api/semrush?type=domain_rank');
                const ovData = await ovRes.json();

                // Fetch Keywords
                const kwRes = await fetch('/api/semrush?type=organic_keywords');
                const kwData = await kwRes.json();

                // Fetch Competitors
                const compRes = await fetch('/api/semrush?type=competitors');
                const compData = await compRes.json();

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

    const kpis = [
        {
            title: 'Organic Keywords',
            value: overview?.['Organic Keywords'] ? Number(overview['Organic Keywords']).toLocaleString() : '0',
            icon: Search,
            color: 'text-emerald-500',
        },
        {
            title: 'Organic Traffic',
            value: overview?.['Organic Traffic'] ? Number(overview['Organic Traffic']).toLocaleString() : '0',
            icon: MousePointer,
            color: 'text-blue-500',
        },
        {
            title: 'Organic Cost',
            value: overview?.['Organic Cost'] ? `USD ${Number(overview['Organic Cost']).toLocaleString()}` : '0',
            icon: TrendingUp,
            color: 'text-primary',
        },
        {
            title: 'AdWords Keywords',
            value: overview?.['Adwords Keywords'] ? Number(overview['Adwords Keywords']).toLocaleString() : '0',
            icon: BarChart3,
            color: 'text-orange-500',
        }
    ];

    // Chart Data: Top 10 Keywords by Traffic %
    const keywordsChartData = keywords
        .slice(0, 10)
        .map(kw => ({
            name: kw['Keyword'],
            traffic: parseFloat(kw['Traffic (%)'] || 0),
            volume: parseInt(kw['Search Volume'] || 0),
        }));

    // Pos Distribution
    const posDist = [
        { name: 'Top 3', count: keywords.filter(k => parseInt(k['Position']) <= 3).length, fill: '#10b981' },
        { name: 'Top 10', count: keywords.filter(k => parseInt(k['Position']) > 3 && parseInt(k['Position']) <= 10).length, fill: '#3b82f6' },
        { name: 'Top 20', count: keywords.filter(k => parseInt(k['Position']) > 10 && parseInt(k['Position']) <= 20).length, fill: '#f59e0b' },
        { name: 'Top 50', count: keywords.filter(k => parseInt(k['Position']) > 20).length, fill: '#94a3b8' },
    ];

    // Competitors Chart
    const competitorsData = competitors.map(c => ({
        name: c['Domain'],
        overlap: parseInt(c['Competitor Relevance'] || 0),
        traffic: parseInt(c['Organic Traffic'] || 0)
    })).sort((a, b) => b.traffic - a.traffic);

    return (
        <div className="space-y-6">
            <PageFilters
                title="Google Visibility (SEMRush)"
                description="Dados em tempo real via SEMRush API para farmaciaeficacia.com.br"
            />

            {/* KPI Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {kpis.map((kpi, i) => (
                    <Card key={i} className="border-border bg-card">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between space-x-4">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{kpi.title}</p>
                                    <p className="text-2xl font-bold text-card-foreground">{kpi.value}</p>
                                </div>
                                <div className={`rounded-full p-2 bg-muted/50 ${kpi.color}`}>
                                    <kpi.icon className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Traffic Distribution Chart */}
                <Card className="lg:col-span-2 border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-foreground">Distribuição de Tráfego por Keyword (%)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={keywordsChartData} margin={{ left: 20, right: 30, top: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickFormatter={v => v.length > 12 ? v.substring(0, 12) + '...' : v} />
                                <YAxis stroke="var(--muted-foreground)" fontSize={11} unit="%" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                                <Bar dataKey="traffic" name="Traffic Share" radius={[4, 4, 0, 0]} fill="#8b5cf6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Position Distribution */}
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-foreground">Posicionamento no Google</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={posDist} layout="vertical" margin={{ left: 10, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} />
                                <YAxis type="category" dataKey="name" width={60} stroke="var(--muted-foreground)" fontSize={11} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                <Bar dataKey="count" name="Keywords" radius={[0, 4, 4, 0]}>
                                    {posDist.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Competitors Chart */}
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-foreground">Principais Concorrentes Orgânicos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={competitorsData} layout="vertical" margin={{ left: 30, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                <XAxis type="number" name="Tráfego" stroke="var(--muted-foreground)" fontSize={11} />
                                <YAxis type="category" dataKey="name" width={100} stroke="var(--muted-foreground)" fontSize={11} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    formatter={(v) => Number(v).toLocaleString()}
                                />
                                <Bar dataKey="traffic" name="Tráfego Estimado" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Keywords Table */}
                <Card className="border-border bg-card overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-foreground">Top 20 Organic Keywords</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative overflow-x-auto">
                            <table className="w-full text-left text-xs text-muted-foreground">
                                <thead className="border-b border-border text-[10px] uppercase text-foreground/70">
                                    <tr>
                                        <th className="px-2 py-3">Keyword</th>
                                        <th className="px-2 py-3 text-center">Pos</th>
                                        <th className="px-2 py-3 text-center">Volume</th>
                                        <th className="px-2 py-3 text-center">CPC (USD)</th>
                                        <th className="px-2 py-3 text-right">Traffic %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {keywords.slice(0, 20).map((kw, i) => (
                                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-2 py-3 font-medium text-foreground truncate max-w-[150px]">{kw['Keyword']}</td>
                                            <td className="px-2 py-3 text-center">
                                                <Badge variant="outline" className={parseInt(kw['Position']) <= 3 ? "border-emerald-500 text-emerald-500 bg-emerald-500/5" : "bg-muted/30"}>
                                                    {kw['Position']}
                                                </Badge>
                                            </td>
                                            <td className="px-2 py-3 text-center">{Number(kw['Search Volume']).toLocaleString()}</td>
                                            <td className="px-2 py-3 text-center">{kw['CPC']}</td>
                                            <td className="px-2 py-3 text-right font-bold text-foreground">{kw['Traffic (%)']}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
