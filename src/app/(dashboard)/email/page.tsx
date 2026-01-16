'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/ui/MockDataBadge';
import { kpisEmail, fluxosAutomacao } from '@/lib/mockData';
import { Mail, Send, MousePointer, ShoppingCart, UserPlus, Gift, RotateCcw, Heart, ArrowRight } from 'lucide-react';
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
    Legend
} from 'recharts';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';

const getFluxoIcon = (fluxo: string) => {
    if (fluxo.includes('Carrinho')) return <ShoppingCart className="h-4 w-4 text-orange-500" />;
    if (fluxo.includes('Welcome')) return <UserPlus className="h-4 w-4 text-blue-500" />;
    if (fluxo.includes('Winback')) return <RotateCcw className="h-4 w-4 text-purple-500" />;
    if (fluxo.includes('Aniversário')) return <Gift className="h-4 w-4 text-pink-500" />;
    if (fluxo.includes('Pós-Compra')) return <Heart className="h-4 w-4 text-emerald-500" />;
    return <Mail className="h-4 w-4 text-muted-foreground" />;
};

export default function EmailPage() {
    // Transform data for charts
    const performanceData = fluxosAutomacao.map(f => ({
        name: f.fluxo.replace('Fluxo ', ''),
        envios: f.envios,
        opens: f.opens,
        cliques: f.cliques,
        receita: f.receita,
        conversionRate: f.cr
    })).sort((a, b) => b.receita - a.receita);

    // Funnel Data for "Carrinho Abandonado" (index 0 usually)
    const cartFlow = fluxosAutomacao.find(f => f.fluxo.includes('Carrinho'));
    const funnelData = cartFlow ? [
        { stage: 'Envios', value: cartFlow.envios, fill: '#94a3b8' },
        { stage: 'Aberturas', value: cartFlow.opens, fill: '#60a5fa' },
        { stage: 'Cliques', value: cartFlow.cliques, fill: '#818cf8' },
        { stage: 'Conversões', value: cartFlow.conversoes, fill: '#10b981' },
    ] : [];

    return (
        <div className="space-y-6">
            <PageHeader
                title="E-mail & Automação"
                description="Performance de campanhas e fluxos automatizados"
                hasMockData={true}
            >
                <DatePickerWithRange />
            </PageHeader>

            {/* KPIs */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Métricas Gerais</h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                    {kpisEmail.map((kpi) => (
                        <KPICard
                            key={kpi.id}
                            data={kpi}
                            compact
                            invertedVariation={kpi.id === 'unsubscribe'}
                        />
                    ))}
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Receita por Fluxo (Bar Chart) */}
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-foreground">Receita por Fluxo Automático</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={performanceData}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={100}
                                        tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'var(--accent)', opacity: 0.2 }}
                                        formatter={(value: any) => `R$ ${Number(value || 0).toLocaleString()}`}
                                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                    />
                                    <Bar dataKey="receita" name="Receita" radius={[0, 4, 4, 0]}>
                                        {performanceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={
                                                index === 0 ? '#10b981' : // Top 1 Emerald
                                                    index === 1 ? '#3b82f6' : // Top 2 Blue
                                                        '#64748b'                 // Others Slate
                                            } />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Funil Visual - Carrinho Abandonado */}
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-foreground">Funil: Recuperação de Carrinho</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col justify-center h-[300px] space-y-4">
                            {funnelData.map((step, index) => {
                                // Calculate width relative to first step
                                const firstValue = funnelData[0]?.value || 1;
                                const widthPercentage = (step.value / firstValue) * 100;
                                const previousValue = index > 0 ? funnelData[index - 1].value : step.value;
                                const dropOff = index > 0 ? ((1 - (step.value / previousValue)) * 100).toFixed(0) : 0;

                                return (
                                    <div key={step.stage} className="relative">
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="font-medium text-foreground">{step.stage}</span>
                                            <span className="font-bold text-foreground">{step.value.toLocaleString()}</span>
                                        </div>
                                        <div className="h-8 bg-muted rounded-r-lg overflow-hidden relative">
                                            <div
                                                className="h-full rounded-r-lg transition-all duration-1000 ease-out"
                                                style={{
                                                    width: `${widthPercentage}%`,
                                                    backgroundColor: step.fill
                                                }}
                                            />
                                        </div>
                                        {index > 0 && (
                                            <div className="absolute right-0 top-8 text-xs text-muted-foreground">
                                                {dropOff}% drop
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabela Detalhada (Refatorada) */}
            <Card className="border-border bg-card">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-foreground">Performance Detalhada</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Fluxo</th>
                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Open Rate</th>
                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Click Rate</th>
                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Conv. Rate</th>
                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Receita</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fluxosAutomacao.map((fluxo) => (
                                    <tr key={fluxo.fluxo} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                                        <td className="py-3 px-2">
                                            <div className="flex items-center gap-2">
                                                {getFluxoIcon(fluxo.fluxo)}
                                                <span className="font-medium text-foreground">{fluxo.fluxo}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2 text-right text-muted-foreground">
                                            {((fluxo.opens / fluxo.envios) * 100).toFixed(1)}%
                                        </td>
                                        <td className="py-3 px-2 text-right text-muted-foreground">
                                            {((fluxo.cliques / fluxo.envios) * 100).toFixed(1)}%
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <Badge variant={fluxo.cr >= 2 ? 'default' : 'secondary'} className={fluxo.cr >= 2 ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                                                {fluxo.cr.toFixed(1)}%
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-2 text-right font-medium text-foreground">
                                            R$ {fluxo.receita.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
