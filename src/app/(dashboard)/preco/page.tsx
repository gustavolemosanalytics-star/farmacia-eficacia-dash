'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/ui/MockDataBadge';
import { kpisPreco, comparativoPrecos } from '@/lib/mockData';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ComposedChart,
    Line,
    Legend,
    ReferenceLine
} from 'recharts';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';

export default function PrecoPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Preço & Concorrência"
                description="Monitoramento de preços e posicionamento vs mercado"
                hasMockData={true}
            >
                <DatePickerWithRange />
            </PageHeader>

            {/* KPIs */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Visão Geral</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {kpisPreco.map((kpi) => (
                        <KPICard key={kpi.id} data={kpi} invertedVariation={kpi.id === 'skus_mais_caros'} />
                    ))}
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Comparativo de Preços (Bar Chart) */}
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-foreground">Comparativo de Preços Médios</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={comparativoPrecos}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="categoria" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis tickFormatter={(val) => `R$${val}`} stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        formatter={(value) => `R$ ${value}`}
                                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="nossoPreco" name="Nosso Preço" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="mercadoP50" name="Mercado (Média)" fill="#64748b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Dispersão de Preços (Simulated Candle/Range Chart using ComposedChart) */}
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-foreground">Posicionamento de Mercado (Range)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    layout="vertical"
                                    data={comparativoPrecos}
                                    margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                                    <XAxis type="number" tickFormatter={(val) => `R$${val}`} stroke="var(--muted-foreground)" fontSize={12} />
                                    <YAxis type="category" dataKey="categoria" width={100} stroke="var(--muted-foreground)" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                        labelStyle={{ color: 'var(--foreground)' }}
                                    />
                                    <Legend />
                                    {/* Using Bars to simulate range min-max visual would require custom shape, using Scatter/Line for simplicity or simplified bars */}
                                    <Bar dataKey="mercadoP75" name="Range Mercado" fill="#e2e8f0" barSize={20} radius={[0, 4, 4, 0]} stackId="a" />

                                    {/* Line for Our Price */}
                                    <Line dataKey="nossoPreco" name="Nosso Preço" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: "#8b5cf6" }} />
                                    <Line dataKey="mercadoP50" name="Mediana Mercado" stroke="#64748b" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabela de Índices */}
            <Card className="border-border bg-card">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-foreground">Índice de Competitividade</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Categoria</th>
                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Nosso Preço</th>
                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Mercado (Méd)</th>
                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Índice</th>
                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparativoPrecos.map((row) => (
                                    <tr key={row.categoria} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                                        <td className="py-3 px-2 font-medium text-foreground">{row.categoria}</td>
                                        <td className="py-3 px-2 text-right text-foreground">R$ {row.nossoPreco.toLocaleString('pt-BR')}</td>
                                        <td className="py-3 px-2 text-right text-muted-foreground">R$ {row.mercadoP50.toLocaleString('pt-BR')}</td>
                                        <td className="py-3 px-2 text-right">{row.indice.toFixed(1)}</td>
                                        <td className="py-3 px-2 text-right">
                                            <Badge variant={row.indice > 105 ? 'destructive' : row.indice < 95 ? 'default' : 'secondary'}
                                                className={row.indice < 95 ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                                                {row.indice > 105 ? 'Caro' : row.indice < 95 ? 'Competitivo' : 'Na Média'}
                                            </Badge>
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
