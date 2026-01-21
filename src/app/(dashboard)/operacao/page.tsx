'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/ui/MockDataBadge';
import { kpisOperacao, correlacaoAtrasoRecompra } from '@/lib/mockData';
import { Truck, Clock, AlertTriangle, TrendingDown } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    ComposedChart,
    Line,
    Legend,
    Cell
} from 'recharts';
import { PageFilters } from '@/components/ui/PageFilters';

export default function OperacaoPage() {
    return (
        <div className="space-y-6">
            <PageFilters
                title="Operação & Experiência"
                description="Métricas logísticas, prazos de entrega e satisfação"
                isMocked={true}
            />

            {/* KPIs */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">KPIs Logísticos</h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                    {kpisOperacao.map((kpi) => (
                        <KPICard
                            key={kpi.id}
                            data={kpi}
                            invertedVariation={kpi.id === 'prazo_real' || kpi.id === 'taxa_atraso' || kpi.id === 'taxa_devolucao'}
                        />
                    ))}
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Prazo Prometido vs Real (Chart) */}
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-foreground">Prazo Prometido vs Real</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {/* Visualização Simplificada usando Barras Horizontais Customizadas */}
                        <div className="flex items-center justify-center py-8">
                            <div className="flex gap-8 text-center">
                                <div>
                                    <div className="text-3xl font-bold text-emerald-500">5.2</div>
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground mt-1">Dias Prometido</div>
                                </div>
                                <div className="h-12 w-px bg-border"></div>
                                <div>
                                    <div className="text-3xl font-bold text-red-500">6.8</div>
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground mt-1">Dias Real</div>
                                </div>
                            </div>
                        </div>

                        {/* Gráfico de Tendência (Simulado) */}
                        <div className="h-[200px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[
                                    { dia: '1', real: 6.5, prometido: 5.2 },
                                    { dia: '5', real: 6.7, prometido: 5.2 },
                                    { dia: '10', real: 6.8, prometido: 5.2 },
                                    { dia: '15', real: 6.6, prometido: 5.2 },
                                    { dia: '20', real: 6.9, prometido: 5.2 },
                                    { dia: '25', real: 6.8, prometido: 5.2 },
                                ]}>
                                    <defs>
                                        <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="dia" hide />
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                                    <Area type="monotone" dataKey="real" stroke="#ef4444" fillOpacity={1} fill="url(#colorReal)" name="Real" />
                                    <Area type="monotone" dataKey="prometido" stroke="#10b981" strokeDasharray="3 3" fill="transparent" name="Prometido" />
                                    <Legend />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Correlação Atraso vs Recompra (Bar Chart) */}
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm font-medium text-foreground">Impacto do Atraso na Recompra</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={correlacaoAtrasoRecompra}
                                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="atraso" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(val) => `${val}%`} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'var(--accent)', opacity: 0.2 }}
                                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                    />
                                    <Bar dataKey="recompra" name="Taxa Recompra %" radius={[4, 4, 0, 0]}>
                                        {correlacaoAtrasoRecompra.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={
                                                entry.recompra >= 25 ? '#10b981' :
                                                    entry.recompra >= 15 ? '#eab308' :
                                                        '#ef4444'
                                            } />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 dark:bg-yellow-900/10">
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Atrasos de 5+ dias reduzem recompra em 70%
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
