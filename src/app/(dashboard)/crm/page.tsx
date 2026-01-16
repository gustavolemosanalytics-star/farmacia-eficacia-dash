'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/ui/MockDataBadge';
import { kpisCRM, cohortData, segmentosRFM } from '@/lib/mockData';
import { Users, Heart, Crown, AlertTriangle, XCircle, TrendingUp } from 'lucide-react';
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

const getCohortColor = (value: number | null) => {
    if (value === null) return 'bg-muted';
    if (value >= 20) return 'bg-emerald-500 text-white';
    if (value >= 15) return 'bg-emerald-400/80 text-white';
    if (value >= 10) return 'bg-yellow-400/80 text-black';
    if (value >= 5) return 'bg-orange-400/80 text-white';
    return 'bg-red-400/80 text-white';
};

const getSegmentoIcon = (segmento: string) => {
    switch (segmento) {
        case 'Campeões': return <Crown className="h-5 w-5 text-yellow-500" />;
        case 'Leais': return <Heart className="h-5 w-5 text-emerald-500" />;
        case 'Em Risco': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
        case 'Perdidos': return <XCircle className="h-5 w-5 text-red-500" />;
        default: return <Users className="h-5 w-5 text-muted-foreground" />;
    }
};

import { DatePickerWithRange } from '@/components/ui/date-range-picker';

export default function CrmPage() {
    // Transform RFM data for chart
    const rfmChartData = segmentosRFM.map(seg => ({
        name: seg.segmento,
        clientes: seg.clientes,
        percentual: seg.percentual,
        receitaEstimada: seg.clientes * seg.valorMedio
    })).sort((a, b) => b.clientes - a.clientes);

    return (
        <div className="space-y-6">
            {/* Header Padronizado */}
            <PageHeader
                title="CRM & Retenção"
                description="Análise de base de clientes, cohorts e segmentação RFM"
                hasMockData={true}
            >
                <DatePickerWithRange />
            </PageHeader>

            {/* KPIs */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Saúde da Base</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {kpisCRM.map((kpi) => (
                        <KPICard key={kpi.id} data={kpi} />
                    ))}
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Visualização RFM */}
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-foreground">Distribuição de Clientes por Segmento</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={rfmChartData}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={80}
                                        tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'var(--accent)', opacity: 0.2 }}
                                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                    />
                                    <Bar dataKey="clientes" name="Clientes" radius={[0, 4, 4, 0]}>
                                        {rfmChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={
                                                entry.name === 'Campeões' ? '#eab308' :
                                                    entry.name === 'Perdidos' ? '#ef4444' :
                                                        '#3b82f6'
                                            } />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Detalhes RFM */}
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-foreground">Insights dos Segmentos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                            {segmentosRFM.slice(0, 4).map((seg) => (
                                <div key={seg.segmento} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-accent/30">
                                    <div className="mt-1">{getSegmentoIcon(seg.segmento)}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-foreground">{seg.segmento}</span>
                                            <Badge variant="outline" className="text-xs bg-background">{seg.percentual.toFixed(1)}%</Badge>
                                        </div>
                                        <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                            <div>
                                                <span className="block font-medium text-foreground">{seg.clientes.toLocaleString()}</span>
                                                Clientes
                                            </div>
                                            <div>
                                                <span className="block font-medium text-foreground">R$ {seg.valorMedio}</span>
                                                Ticket Médio
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Cohort Heatmap */}
            <section>
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-foreground">Matriz de Cohort (Retenção %)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Cohort</th>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground">M0</th>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground">M1</th>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground">M2</th>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground">M3</th>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground">M4</th>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground">M5</th>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground">M6</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cohortData.map((row) => (
                                        <tr key={row.mes} className="border-b border-border last:border-0 hover:bg-muted/30">
                                            <td className="py-3 px-2 text-foreground font-medium">{row.mes}</td>
                                            {[row.m0, row.m1, row.m2, row.m3, row.m4, row.m5, row.m6].map((value, index) => (
                                                <td key={index} className="py-2 px-1 text-center">
                                                    <div className={`flex items-center justify-center w-full max-w-[50px] mx-auto py-1.5 rounded text-xs font-medium ${getCohortColor(value)}`}>
                                                        {value !== null ? `${value}%` : '-'}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Legenda simples */}
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-400" /> &lt;5%</div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-orange-400" /> 5-10%</div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-yellow-400" /> 10-15%</div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-400" /> &gt;15%</div>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
