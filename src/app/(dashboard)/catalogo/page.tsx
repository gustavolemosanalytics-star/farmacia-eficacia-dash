'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/ui/MockDataBadge';
import { kpisCatalogo, topSkusReceita, merchantCenterStatus } from '@/lib/mockData';
import { Package, Check, X, AlertTriangle } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

import { DatePickerWithRange } from '@/components/ui/date-range-picker';

export default function CatalogoPage() {
    const totalProdutos = merchantCenterStatus.aprovados + merchantCenterStatus.reprovados + merchantCenterStatus.pendentes;
    const percentualAprovados = ((merchantCenterStatus.aprovados / totalProdutos) * 100).toFixed(1);

    // Data for Pie Chart
    const pieData = [
        { name: 'Aprovados', value: merchantCenterStatus.aprovados, color: '#10b981' }, // emerald-500
        { name: 'Reprovados', value: merchantCenterStatus.reprovados, color: '#ef4444' }, // red-500
        { name: 'Pendentes', value: merchantCenterStatus.pendentes, color: '#eab308' }, // yellow-500
    ];

    // Data for Top SKUs Chart
    const skuData = topSkusReceita.map(sku => ({
        name: sku.sku,
        receita: sku.receita,
        margem: sku.margem
    }));

    return (
        <div className="space-y-6">
            {/* Header Padronizado */}
            <PageHeader
                title="Catálogo & Merchandising"
                description="Gestão de SKUs, estoque e qualidade do catálogo"
                hasMockData={true}
            >
                <DatePickerWithRange />
            </PageHeader>

            {/* KPIs */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Saúde do Catálogo</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {kpisCatalogo.map((kpi) => (
                        <KPICard
                            key={kpi.id}
                            data={kpi}
                            invertedVariation={kpi.id === 'skus_sem_venda' || kpi.id === 'skus_ruptura'}
                        />
                    ))}
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Google Merchant Center Status (Chart + Stats) */}
                <Card className="lg:col-span-1 border-border bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-foreground">Merchant Center Status</CardTitle>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                            {percentualAprovados}% Aprovado
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                        itemStyle={{ color: 'var(--foreground)' }}
                                    />
                                    <Legend
                                        layout="horizontal"
                                        verticalAlign="bottom"
                                        align="center"
                                        wrapperStyle={{ paddingTop: '10px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Central Label */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-4 text-center">
                                <span className="block text-2xl font-bold text-foreground">{totalProdutos.toLocaleString()}</span>
                                <span className="text-xs text-muted-foreground">Total</span>
                            </div>
                        </div>

                        {/* Motivos de Reprovação Highlight */}
                        <div className="mt-6 space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Principais Motivos de Reprovação</h4>
                            {merchantCenterStatus.motivos.slice(0, 3).map((motivo) => (
                                <div key={motivo.motivo} className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">{motivo.motivo}</span>
                                    <Badge variant="secondary" className="text-xs font-mono">
                                        {motivo.quantidade}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top SKUs Chart (Bar chart replacing table) */}
                <Card className="lg:col-span-2 border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-foreground">Top SKUs por Receita (vs Margem)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={skuData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="left" orientation="left" stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(value) => `R$${value / 1000}k`} tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="right" orientation="right" stroke="var(--muted-foreground)" fontSize={12} unit="%" tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'var(--accent)', opacity: 0.2 }}
                                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                    />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="receita" name="Receita" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    <Bar yAxisId="right" dataKey="margem" name="Margem %" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Lista detalhada SKUs (Tabela simplificada) */}
            <Card className="border-border bg-card">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-foreground">Detalhamento Top SKUs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Produto</th>
                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Estoque</th>
                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Receita</th>
                                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Margem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topSkusReceita.map((row) => (
                                    <tr key={row.sku} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                                        <td className="py-3 px-2">
                                            <div>
                                                <p className="font-medium text-foreground">{row.nome}</p>
                                                <p className="text-xs text-muted-foreground">{row.sku}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <Badge variant={row.estoque < 10 ? 'destructive' : 'outline'}>
                                                {row.estoque} un
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-2 text-right font-medium text-foreground">
                                            R$ {row.receita.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <span className={row.margem > 20 ? 'text-emerald-500' : 'text-yellow-500'}>
                                                {row.margem}%
                                            </span>
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
