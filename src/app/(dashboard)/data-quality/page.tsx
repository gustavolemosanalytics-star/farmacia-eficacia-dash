'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/ui/MockDataBadge';
import { kpisDataQuality, discrepancias } from '@/lib/mockData';
import { Database, AlertTriangle, Check, X, ShieldCheck } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadialBarChart,
    RadialBar,
    Legend,
    Cell
} from 'recharts';
import { PageFilters } from '@/components/ui/PageFilters';

export default function DataQualityPage() {
    // Score Global de Qualidade (Simulado para Visualização)
    const healthScoreData = [
        { name: 'Integridade', uv: 98, fill: '#10b981' },
        { name: 'Completude', uv: 92, fill: '#3b82f6' },
        { name: 'Consistência', uv: 85, fill: '#eab308' },
        { name: 'Temporalidade', uv: 100, fill: '#8b5cf6' },
    ];

    return (
        <div className="space-y-6">
            <PageFilters
                title="Data Quality & Governança"
                description="Monitoramento de integridade e qualidade dos dados"
                isMocked={true}
            />

            {/* KPIs */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Saúde dos Dados</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {kpisDataQuality.map((kpi) => (
                        <KPICard
                            key={kpi.id}
                            data={kpi}
                            invertedVariation={kpi.id === 'discrepancia' || kpi.id === 'eventos_faltando'}
                        />
                    ))}
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Discrepâncias Visual (Bar Chart) */}
                <Card className="lg:col-span-2 border-border bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-foreground">Discrepância GA4 vs Backend (%)</CardTitle>
                        <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">
                            Diferença Média: 4.2%
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={discrepancias}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                                    <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} domain={[-20, 20]} />
                                    <YAxis
                                        type="category"
                                        dataKey="metrica"
                                        width={100}
                                        stroke="var(--muted-foreground)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'var(--accent)', opacity: 0.2 }}
                                        formatter={(value: any) => [`${value}%`, 'Diferença']}
                                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                    />
                                    <Bar dataKey="diferenca" name="Diferença %" radius={[0, 4, 4, 0]} barSize={20}>
                                        {discrepancias.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.diferenca && Math.abs(entry.diferenca) > 5 ? '#ef4444' : '#eab308'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Score de Saúde (Radial Bar) */}
                <Card className="lg:col-span-1 border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-foreground">Score de Qualidade</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart
                                    innerRadius="30%"
                                    outerRadius="100%"
                                    barSize={20}
                                    data={healthScoreData}
                                    startAngle={180}
                                    endAngle={0}
                                    cy="60%"
                                >
                                    <RadialBar
                                        label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }} // Removed background prop as it's not valid
                                        background={{ fill: 'var(--muted)' }}  // Correct usage of background for the track
                                        dataKey="uv"
                                        cornerRadius={5}
                                    />
                                    <Legend
                                        iconSize={10}
                                        layout="vertical"
                                        verticalAlign="bottom"
                                        wrapperStyle={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                    />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center mt-4">
                                <span className="block text-4xl font-bold text-foreground">94</span>
                                <span className="text-xs text-muted-foreground">Score Geral</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tracking Status List */}
            <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium text-foreground">Monitoramento de Tags & Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 hover:bg-yellow-500/15 transition-colors">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                <div>
                                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">UTM Coverage baixa em Paid Social</p>
                                    <p className="text-xs text-muted-foreground">22% das sessões de Meta Ads sem UTM parameters</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="border-yellow-500/30 text-yellow-500 bg-background">Warning</Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <Check className="h-5 w-5 text-emerald-500" />
                                <div>
                                    <p className="text-sm font-medium text-foreground">Eventos de Purchase funcionando</p>
                                    <p className="text-xs text-muted-foreground">1.847 eventos registrados nas últimas 24h</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/5">OK</Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/15 transition-colors">
                            <div className="flex items-center gap-3">
                                <X className="h-5 w-5 text-red-500" />
                                <div>
                                    <p className="text-sm font-medium text-red-600 dark:text-red-400">Evento view_item_list faltando</p>
                                    <p className="text-xs text-muted-foreground">Não detectado nas últimas 48h - possível quebra</p>
                                </div>
                            </div>
                            <Badge variant="destructive">Erro Crítico</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
