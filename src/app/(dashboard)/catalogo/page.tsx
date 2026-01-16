'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/ui/MockDataBadge';
import { Package, ShoppingCart, TrendingUp, MapPin, Tag } from 'lucide-react';
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
import { useCatalogoData } from '@/hooks/useSheetData';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

export default function CatalogoPage() {
    const { data: realData, loading, error } = useCatalogoData();

    // Build KPIs from real data
    const kpis = realData ? [
        {
            id: 'receita_total',
            titulo: 'Receita Total',
            valor: realData.totalReceita,
            valorFormatado: realData.totalReceita_formatted,
            variacao: 0,
            tendencia: 'up' as const,
            sparklineData: [realData.totalReceita * 0.8, realData.totalReceita * 0.9, realData.totalReceita * 0.95, realData.totalReceita],
        },
        {
            id: 'total_pedidos',
            titulo: 'Total de Pedidos',
            valor: realData.totalPedidos,
            valorFormatado: realData.totalPedidos.toLocaleString('pt-BR'),
            variacao: 0,
            tendencia: 'up' as const,
            sparklineData: [realData.totalPedidos * 0.8, realData.totalPedidos * 0.9, realData.totalPedidos * 0.95, realData.totalPedidos],
        },
        {
            id: 'ticket_medio',
            titulo: 'Ticket Médio',
            valor: realData.ticketMedio,
            valorFormatado: realData.ticketMedio_formatted,
            variacao: 0,
            tendencia: 'up' as const,
            sparklineData: [realData.ticketMedio * 0.95, realData.ticketMedio * 0.98, realData.ticketMedio * 0.99, realData.ticketMedio],
        },
        {
            id: 'total_clientes',
            titulo: 'Clientes Únicos',
            valor: realData.totalClientes,
            valorFormatado: realData.totalClientes.toLocaleString('pt-BR'),
            variacao: 0,
            tendencia: 'up' as const,
            sparklineData: [realData.totalClientes * 0.85, realData.totalClientes * 0.9, realData.totalClientes * 0.95, realData.totalClientes],
        },
    ] : [];

    // Use data from API or empty arrays
    const topSkus = realData?.topSkus || [];
    const byCategory = realData?.byCategory || [];
    const byState = realData?.byState || [];
    const byChannel = realData?.byChannel || [];

    // Data for Top SKUs Chart
    const skuData = topSkus.map((sku: any) => ({
        name: sku.nome.length > 25 ? sku.nome.substring(0, 25) + '...' : sku.nome,
        receita: sku.receita,
        qtd: sku.qtdVendas
    }));

    // Data for category pie chart
    const categoryData = byCategory.map((cat: any, index: number) => ({
        name: cat.name,
        value: cat.value,
        color: COLORS[index % COLORS.length]
    }));

    return (
        <div className="space-y-6">
            {/* Header Padronizado */}
            <PageHeader
                title="Catálogo & E-commerce (Magento)"
                description="Dados do CRM Magento - Aba BD Mag"
                hasRealData={!!realData}
                hasMockData={!realData && !loading}
            >
                <DatePickerWithRange />
            </PageHeader>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Carregando dados do Magento...</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <Card className="border-destructive bg-destructive/10">
                    <CardContent className="pt-6">
                        <p className="text-destructive">Erro ao carregar dados: {error}</p>
                    </CardContent>
                </Card>
            )}

            {/* KPIs */}
            {realData && (
                <>
                    <section>
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Indicadores de Vendas
                        </h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {kpis.map((kpi) => (
                                <KPICard key={kpi.id} data={kpi} />
                            ))}
                        </div>
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Revenue by Category (Pie Chart) */}
                        <Card className="lg:col-span-1 border-border bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-primary" />
                                    <CardTitle className="text-sm font-medium text-foreground">Receita por Categoria</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[280px] w-full relative">
                                    {categoryData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={categoryData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={80}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {categoryData.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                                                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                                />
                                                <Legend
                                                    layout="horizontal"
                                                    verticalAlign="bottom"
                                                    align="center"
                                                    wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            Sem dados de categoria
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top SKUs Chart (Bar chart) */}
                        <Card className="lg:col-span-2 border-border bg-card">
                            <CardHeader className="flex flex-row items-center gap-2">
                                <Package className="h-4 w-4 text-primary" />
                                <CardTitle className="text-sm font-medium text-foreground">Top Produtos por Receita</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    {skuData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={skuData}
                                                layout="vertical"
                                                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                                                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`} />
                                                <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={10} width={100} />
                                                <Tooltip
                                                    formatter={(value, name) => [
                                                        name === 'receita' ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : value,
                                                        name === 'receita' ? 'Receita' : 'Qtd Vendas'
                                                    ]}
                                                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                                />
                                                <Bar dataKey="receita" name="Receita" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            Sem dados de produtos
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Revenue by State */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <CardTitle className="text-sm font-medium text-foreground">Receita por Estado</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                {byState.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={byState}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                                            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`} />
                                            <Tooltip
                                                formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                                                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                            />
                                            <Bar dataKey="value" name="Receita" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        Sem dados de estados
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Lista detalhada SKUs (Tabela) */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-primary" />
                            <CardTitle className="text-sm font-medium text-foreground">Detalhamento Top Produtos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Produto</th>
                                            <th className="text-right py-3 px-2 font-medium text-muted-foreground">Qtd Vendas</th>
                                            <th className="text-right py-3 px-2 font-medium text-muted-foreground">Receita</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topSkus.map((row: any) => (
                                            <tr key={row.sku} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                                                <td className="py-3 px-2">
                                                    <div>
                                                        <p className="font-medium text-foreground">{row.nome}</p>
                                                        <p className="text-xs text-muted-foreground">{row.sku}</p>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    <Badge variant="outline">
                                                        {row.qtdVendas} un
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-2 text-right font-medium text-foreground">
                                                    R$ {row.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Revenue by Channel & Seller */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue by Channel Chart */}
                        {byChannel.length > 0 && (
                            <Card className="border-border bg-card">
                                <CardHeader className="flex flex-row items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    <CardTitle className="text-sm font-medium text-foreground">Receita por Canal de Origem</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={byChannel.slice(0, 8)}
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
                                                <Bar dataKey="value" name="Receita" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Revenue by Seller (Magento) */}
                        <Card className="border-border bg-card">
                            <CardHeader className="flex flex-row items-center gap-2">
                                <Package className="h-4 w-4 text-primary" />
                                <CardTitle className="text-sm font-medium text-foreground">Receita por Vendedor</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    {(realData?.bySeller?.length || 0) > 0 ? (
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
                                                <Bar dataKey="value" name="Receita" fill="#ec4899" radius={[0, 4, 4, 0]} />
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
                </>
            )}
        </div>
    );
}
