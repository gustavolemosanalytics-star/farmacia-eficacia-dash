'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/ui/MockDataBadge';
import { GlobalDatePicker } from '@/components/ui/GlobalDatePicker';
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

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useState } from 'react';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useCRMData } from '@/hooks/useSheetData';

export default function CrmPage() {
    const { data: realData, loading } = useCRMData();
    const [selectedSegment, setSelectedSegment] = useState<any | null>(null);

    // Use property 'segments' from realData if available
    const segments = realData?.segments || segmentosRFM;

    // Transform RFM data for chart
    const rfmChartData = segments.map((seg: any) => ({
        name: seg.segmento,
        clientes: seg.clientes,
        percentual: seg.percentual,
        receitaEstimada: seg.clientes * (seg.valorMedio || 150), // Fallback tickey
        ...seg // Pass full segment data to click handler
    })).sort((a: any, b: any) => b.clientes - a.clientes);

    const handleBarClick = (data: any) => {
        if (data && data.activePayload && data.activePayload.length > 0) {
            const segmentData = data.activePayload[0].payload;
            setSelectedSegment(segmentData);
        }
    };

    // Helper to extract top cities from selected segment
    const getSegmentGeoStats = (customers: any[]) => {
        if (!customers || customers.length === 0) return [];
        const cityCounts: { [key: string]: number } = {};
        const stateCounts: { [key: string]: number } = {};

        customers.forEach(c => {
            const city = c.cidade || 'N/A';
            const state = c.estado || 'N/A';
            cityCounts[city] = (cityCounts[city] || 0) + 1;
            stateCounts[state] = (stateCounts[state] || 0) + 1;
        });

        const topCities = Object.entries(cityCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        return topCities;
    };


    // ...

    return (
        <div className="space-y-6">
            {/* Header with Date Picker */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <PageHeader
                    title="CRM & Retenção"
                    description="Análise de clientes, vendas e retenção"
                    hasRealData={!!realData}
                />
                <GlobalDatePicker />
            </div>

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
                        <p className="text-xs text-muted-foreground">Clique numa barra para ver detalhes e lista de clientes.</p>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            {loading ? (
                                <div className="flex h-full items-center justify-center">
                                    <span className="loading loading-spinner text-muted-foreground">Carregando dados RFM...</span>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={rfmChartData}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        onClick={handleBarClick}
                                        className="cursor-pointer"
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
                                            {rfmChartData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={
                                                    entry.name === 'Campeões' ? '#eab308' :
                                                        entry.name === 'Perdidos' ? '#ef4444' :
                                                            '#3b82f6'
                                                } />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
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
                            {segments.slice(0, 4).map((seg: any) => (
                                <div key={seg.segmento} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-accent/30 cursor-pointer hover:bg-accent/50 transition-colors"
                                    onClick={() => setSelectedSegment(seg.customerList ? seg : null)}>
                                    <div className="mt-1">{getSegmentoIcon(seg.segmento)}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-foreground">{seg.segmento}</span>
                                            <Badge variant="outline" className="text-xs bg-background">{seg.percentual?.toFixed(1) || 0}%</Badge>
                                        </div>
                                        <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                            <div>
                                                <span className="block font-medium text-foreground">{seg.clientes?.toLocaleString()}</span>
                                                Clientes
                                            </div>
                                            <div>
                                                <span className="block font-medium text-foreground">R$ {seg.valorMedio?.toFixed(0)}</span>
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

            {/* Segment Details Modal */}
            <Dialog open={!!selectedSegment} onOpenChange={(open) => !open && setSelectedSegment(null)}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedSegment && getSegmentoIcon(selectedSegment.name || selectedSegment.segmento)}
                            <span>Segmento: {selectedSegment?.name || selectedSegment?.segmento}</span>
                        </DialogTitle>
                        <DialogDescription>
                            Análise detalhada e lista de clientes deste cluster.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedSegment && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                            {/* Left Column: Stats & Geo */}
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs uppercase text-muted-foreground">Resumo</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm">Total Clientes:</span>
                                            <span className="font-bold">{selectedSegment.clientes}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm">Ticket Médio:</span>
                                            <span className="font-bold">R$ {selectedSegment.valorMedio?.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs uppercase text-muted-foreground">Top Cidades (Geo)</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {getSegmentGeoStats(selectedSegment.customerList).map((city, idx) => (
                                                <div key={idx} className="flex justify-between text-sm items-center">
                                                    <span className="truncate max-w-[120px]" title={city.name}>{city.name}</span>
                                                    <Badge variant="secondary" className="text-xs">{city.count}</Badge>
                                                </div>
                                            ))}
                                            {getSegmentGeoStats(selectedSegment.customerList).length === 0 && (
                                                <span className="text-xs text-muted-foreground">Sem dados geográficos</span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Column: Customer List */}
                            <div className="md:col-span-2">
                                <h3 className="text-sm font-semibold mb-3">Lista de Clientes (Top 50)</h3>
                                <div className="border rounded-md max-h-[400px] overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 sticky top-0">
                                            <tr>
                                                <th className="p-2 text-left font-medium">Nome/ID</th>
                                                <th className="p-2 text-left font-medium">Cidade/UF</th>
                                                <th className="p-2 text-right font-medium">Receita Total</th>
                                                <th className="p-2 text-right font-medium">Última Compra</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedSegment.customerList?.slice(0, 50).map((c: any, i: number) => (
                                                <tr key={i} className="border-t hover:bg-muted/30">
                                                    <td className="p-2">
                                                        <div className="font-medium truncate max-w-[150px]" title={c.nome || c.id}>{c.nome || c.id}</div>
                                                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">{c.email}</div>
                                                    </td>
                                                    <td className="p-2 text-xs">
                                                        {c.cidade ? `${c.cidade}/${c.estado}` : '-'}
                                                    </td>
                                                    <td className="p-2 text-right font-medium text-emerald-600">
                                                        R$ {c.receita?.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                                    </td>
                                                    <td className="p-2 text-right text-xs text-muted-foreground">
                                                        {c.recenciaDays} dias atrás
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!selectedSegment.customerList || selectedSegment.customerList.length === 0) && (
                                                <tr>
                                                    <td colSpan={4} className="p-4 text-center text-muted-foreground">
                                                        Nenhum cliente listado neste segmento.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            {/* Header Padronizado */}
            <PageHeader
                title="CRM & Retenção"
                description="Análise de base de clientes, cohorts e segmentação RFM"
                hasRealData={!!realData}
                hasMockData={!realData}
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
                            {loading ? (
                                <div className="flex h-full items-center justify-center">
                                    <span className="loading loading-spinner text-muted-foreground">Carregando dados RFM...</span>
                                </div>
                            ) : (
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
                                            {rfmChartData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={
                                                    entry.name === 'Campeões' ? '#eab308' :
                                                        entry.name === 'Perdidos' ? '#ef4444' :
                                                            '#3b82f6'
                                                } />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
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
                            {segments.slice(0, 4).map((seg: any) => (
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
                                                <span className="block font-medium text-foreground">R$ {seg.valorMedio.toFixed(0)}</span>
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

            {/* Top Clientes & Vendas por Vendedor */}
            {
                realData && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Clientes */}
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-foreground">Top 10 Clientes (Receita)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Cliente (CPF/ID)</th>
                                                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Pedidos</th>
                                                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Receita</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {realData.topCustomers?.map((row: any) => (
                                                <tr key={row.email || row.nome} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                                                    <td className="py-3 px-2">
                                                        <p className="font-medium text-foreground">{row.nome}</p>
                                                        {row.email && <p className="text-xs text-muted-foreground">{row.email}</p>}
                                                    </td>
                                                    <td className="py-3 px-2 text-right text-muted-foreground">
                                                        {row.qtdPedidos}
                                                    </td>
                                                    <td className="py-3 px-2 text-right font-medium text-foreground">
                                                        {row.receita_formatted}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Vendas por Vendedor */}
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-foreground">Receita por Vendedor</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    {realData.bySeller?.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={realData.bySeller.slice(0, 8)}
                                                layout="vertical"
                                                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                                                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`} />
                                                <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} width={80} />
                                                <Tooltip
                                                    formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                                                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                                />
                                                <Bar dataKey="value" name="Receita" fill="#10b981" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            Sem dados de vendedores
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            }

            {/* Vendas por Cidade */}
            {
                realData && (
                    <section>
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-foreground">Top 10 Cidades (Receita)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    {realData.byCity?.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={realData.byCity}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                                                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`} />
                                                <Tooltip
                                                    formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                                                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                                />
                                                <Bar dataKey="value" name="Receita" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            Sem dados de cidades
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                )
            }

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
        </div >
    );
}
