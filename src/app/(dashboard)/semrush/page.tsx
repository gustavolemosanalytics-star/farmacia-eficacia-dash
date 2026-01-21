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

                if (ovData.success) setOverview(ovData.data[0]);
                if (kwData.success) setKeywords(kwData.data);

                if (ovData.error || kwData.error) {
                    setError(ovData.error || kwData.error);
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
            value: Number(overview?.Or || 0).toLocaleString(),
            icon: Search,
            color: 'text-emerald-500',
        },
        {
            title: 'Organic Traffic',
            value: Number(overview?.Ot || 0).toLocaleString(),
            icon: MousePointer,
            color: 'text-blue-500',
        },
        {
            title: 'Organic Cost',
            value: `USD ${Number(overview?.Oc || 0).toLocaleString()}`,
            icon: TrendingUp,
            color: 'text-primary',
        },
        {
            title: 'AdWords Keywords',
            value: Number(overview?.Ad || 0).toLocaleString(),
            icon: BarChart3,
            color: 'text-orange-500',
        }
    ];

    // Chart Data: Top 10 Keywords by Traffic %
    const chartData = keywords
        .slice(0, 10)
        .map(kw => ({
            name: kw.Ph,
            traffic: parseFloat(kw.Tr || 0),
            volume: parseInt(kw.Nq || 0),
            position: parseInt(kw.Po || 0)
        }))
        .sort((a, b) => b.traffic - a.traffic);

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

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Traffic Distribution Chart */}
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Distribuição de Tráfego por Keyword (%)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={chartData} layout="vertical" margin={{ left: 30, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                <XAxis type="number" unit="%" stroke="var(--muted-foreground)" fontSize={11} />
                                <YAxis type="category" dataKey="name" width={100} stroke="var(--muted-foreground)" fontSize={11} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    formatter={(value: any) => [`${value}%`, 'Traffic Share']}
                                />
                                <Bar dataKey="traffic" radius={[0, 4, 4, 0]} fill="var(--primary)">
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index < 3 ? '#8b5cf6' : '#94a3b8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Keywords Table */}
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Top 20 Organic Keywords</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative overflow-x-auto">
                            <table className="w-full text-left text-xs text-muted-foreground">
                                <thead className="border-b border-border text-[10px] uppercase text-foreground/70">
                                    <tr>
                                        <th className="px-2 py-3">Keyword</th>
                                        <th className="px-2 py-3 text-center">Pos</th>
                                        <th className="px-2 py-3 text-center">Vol</th>
                                        <th className="px-2 py-3 text-center">Traffic %</th>
                                        <th className="px-2 py-3 text-right">Trend</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {keywords.map((kw, i) => (
                                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-2 py-3 font-medium text-foreground truncate max-w-[150px]">{kw.Ph}</td>
                                            <td className="px-2 py-3 text-center">
                                                <Badge variant="outline" className={parseInt(kw.Po) <= 3 ? "border-emerald-500 text-emerald-500" : ""}>
                                                    {kw.Po}
                                                </Badge>
                                            </td>
                                            <td className="px-2 py-3 text-center">{Number(kw.Nq).toLocaleString()}</td>
                                            <td className="px-2 py-3 text-center">{kw.Tr}%</td>
                                            <td className="px-2 py-3 text-right">
                                                {parseInt(kw.Pd) > 0 ? (
                                                    <div className="flex items-center justify-end text-emerald-500">
                                                        <ArrowUpRight className="h-3 w-3" />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end text-red-500">
                                                        <ArrowDownRight className="h-3 w-3" />
                                                    </div>
                                                )}
                                            </td>
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
