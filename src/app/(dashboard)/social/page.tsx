'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/ui/MockDataBadge';
import { kpisSocial, sentimentoAnalise } from '@/lib/mockData';
import { ThumbsUp, ThumbsDown, Minus, Hash, MessageCircle, Share2 } from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';

export default function SocialPage() {
    // Data for Sentiment Pie Chart
    const sentimentData = [
        { name: 'Positivo', value: sentimentoAnalise.positivo, color: '#10b981' }, // emerald-500
        { name: 'Neutro', value: sentimentoAnalise.neutro, color: '#64748b' },   // slate-500
        { name: 'Negativo', value: sentimentoAnalise.negativo, color: '#ef4444' }, // red-500
    ];

    // Dummy Mock Data for Engagement over platforms (Since original mock was limited, expanding slightly for visuals)
    const engagementData = [
        { platform: 'Instagram', engagement: 65, reach: 80 },
        { platform: 'TikTok', engagement: 85, reach: 90 },
        { platform: 'Facebook', engagement: 30, reach: 45 },
        { platform: 'LinkedIn', engagement: 45, reach: 20 },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Social & Marca"
                description="Métricas de redes sociais e análise de sentimento"
                hasMockData={true}
            >
                <DatePickerWithRange />
            </PageHeader>

            {/* KPIs */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Métricas de Social</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {kpisSocial.map((kpi) => (
                        <KPICard key={kpi.id} data={kpi} invertedVariation={kpi.id === 'link_bio'} />
                    ))}
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Análise de Sentimento (Donut Chart) */}
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-foreground">Análise de Sentimento</CardTitle>
                        <Hash className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sentimentData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {sentimentData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                        itemStyle={{ color: 'var(--foreground)' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Summary Center */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center">
                                <span className="block text-3xl font-bold text-emerald-500">{sentimentoAnalise.positivo}%</span>
                                <span className="text-xs text-muted-foreground">Positivo</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Engajamento por Plataforma (Bar Chart) */}
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-foreground">Engajamento Score por Canal</CardTitle>
                        <Share2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={engagementData}
                                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="platform" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'var(--accent)', opacity: 0.2 }}
                                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                    />
                                    <Bar dataKey="engagement" name="Engajamento" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="reach" name="Alcance Relativo" fill="#a78bfa" radius={[4, 4, 0, 0]} opacity={0.5} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Word Cloud Visual Representation */}
            <Card className="border-border bg-card">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-foreground">Termos em Alta (Word Cloud)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                            <div className="flex items-center gap-2 mb-3">
                                <ThumbsUp className="h-4 w-4 text-emerald-500" />
                                <h4 className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Sentimento Positivo</h4>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {sentimentoAnalise.palavrasPositivas.map((palavra, i) => (
                                    <span
                                        key={palavra}
                                        className="inline-block px-3 py-1 rounded-full bg-background border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                        style={{ fontSize: `${Math.max(12, 18 - i)}px`, opacity: Math.max(0.6, 1 - i * 0.1) }}
                                    >
                                        {palavra}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10">
                            <div className="flex items-center gap-2 mb-3">
                                <ThumbsDown className="h-4 w-4 text-red-500" />
                                <h4 className="text-sm font-medium text-red-600 dark:text-red-400">Pontos de Atenção</h4>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {sentimentoAnalise.palavrasNegativas.map((palavra, i) => (
                                    <span
                                        key={palavra}
                                        className="inline-block px-3 py-1 rounded-full bg-background border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 shadow-sm"
                                        style={{ fontSize: `${Math.max(12, 18 - i)}px`, opacity: Math.max(0.6, 1 - i * 0.1) }}
                                    >
                                        {palavra}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
