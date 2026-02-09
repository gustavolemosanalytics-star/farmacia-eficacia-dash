'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Package, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CityRevenueProps {
    catalogoData: {
        rawData?: Array<{
            cidade?: string;
            receitaProduto?: number;
            nomeProduto?: string;
        }>;
    };
}

const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#14b8a6', '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b'];

export function CityRevenueChart({ catalogoData }: CityRevenueProps) {
    const [selectedCity, setSelectedCity] = useState<string | null>(null);

    const { cityData, topProducts, totalRevenue } = useMemo(() => {
        if (!catalogoData?.rawData || catalogoData.rawData.length === 0) {
            return { cityData: [], topProducts: {}, totalRevenue: 0 };
        }

        const rawData = catalogoData.rawData;

        // Aggregate by city
        const cityMap: Record<string, { revenue: number; products: Record<string, { qty: number; revenue: number }> }> = {};
        let total = 0;

        rawData.forEach(item => {
            const city = (item.cidade || 'Não informado').trim();
            const revenue = item.receitaProduto || 0;
            const product = (item.nomeProduto || 'Produto não identificado').trim();

            if (!cityMap[city]) {
                cityMap[city] = { revenue: 0, products: {} };
            }

            cityMap[city].revenue += revenue;
            total += revenue;

            if (!cityMap[city].products[product]) {
                cityMap[city].products[product] = { qty: 0, revenue: 0 };
            }
            cityMap[city].products[product].qty += 1;
            cityMap[city].products[product].revenue += revenue;
        });

        // Sort cities by revenue and take top 10
        const sortedCities = Object.entries(cityMap)
            .map(([city, data]) => ({
                city,
                revenue: data.revenue,
                products: data.products
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // Find top product for each city
        const topProductsMap: Record<string, { name: string; qty: number; revenue: number }> = {};
        sortedCities.forEach(cityEntry => {
            const products = Object.entries(cityEntry.products)
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.revenue - a.revenue);

            if (products.length > 0) {
                topProductsMap[cityEntry.city] = products[0];
            }
        });

        return {
            cityData: sortedCities.map(c => ({ name: c.city, receita: c.revenue })),
            topProducts: topProductsMap,
            totalRevenue: total
        };
    }, [catalogoData]);

    if (cityData.length === 0) {
        return (
            <Card className="border-border bg-card">
                <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground text-center py-8">
                        Sem dados de cidade disponíveis
                    </p>
                </CardContent>
            </Card>
        );
    }

    const selectedCityData = selectedCity ? topProducts[selectedCity] : null;

    return (
        <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <MapPin className="h-5 w-5 text-primary" />
                <div className="flex-1">
                    <CardTitle className="text-sm font-medium text-card-foreground">
                        Vendas por Cidade (Top 10)
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        Clique em uma cidade para ver o produto mais vendido
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Top 10</p>
                    <p className="text-lg font-bold text-foreground">
                        R$ {cityData.reduce((sum, c) => sum + c.receita, 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </p>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Bar Chart */}
                    <div className="lg:col-span-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart
                                data={cityData}
                                layout="vertical"
                                margin={{ left: 10, right: 20, top: 10, bottom: 10 }}
                            >
                                <XAxis
                                    type="number"
                                    tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                                    tick={{ fontSize: 10 }}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={100}
                                    tick={{ fontSize: 10 }}
                                />
                                <Tooltip
                                    formatter={(value) => {
                                        const numValue = typeof value === 'number' ? value : 0;
                                        return [`R$ ${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita'];
                                    }}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar
                                    dataKey="receita"
                                    radius={[0, 4, 4, 0]}
                                    cursor="pointer"
                                    onClick={(data) => data?.name && setSelectedCity(data.name)}
                                >
                                    {cityData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={selectedCity === entry.name ? '#10b981' : COLORS[index % COLORS.length]}
                                            opacity={selectedCity && selectedCity !== entry.name ? 0.5 : 1}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Selected City Details */}
                    <div className="space-y-4">
                        {selectedCity && selectedCityData ? (
                            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800">
                                <div className="flex items-center gap-2 mb-3">
                                    <MapPin className="h-4 w-4 text-emerald-600" />
                                    <h4 className="font-bold text-sm text-emerald-700 dark:text-emerald-300">{selectedCity}</h4>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Produto Mais Vendido</p>
                                        <div className="flex items-start gap-2">
                                            <Package className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm font-medium text-foreground leading-tight">
                                                {selectedCityData.name.length > 50
                                                    ? selectedCityData.name.substring(0, 50) + '...'
                                                    : selectedCityData.name}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-2 rounded-lg bg-white/50 dark:bg-zinc-900/50">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Quantidade</p>
                                            <p className="text-lg font-bold text-foreground">{selectedCityData.qty}</p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-white/50 dark:bg-zinc-900/50">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Receita</p>
                                            <p className="text-lg font-bold text-foreground">
                                                R$ {selectedCityData.revenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border">
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <MapPin className="h-8 w-8 text-muted-foreground/50 mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        Clique em uma cidade no gráfico para ver o produto mais vendido
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Top 3 Cities Quick View */}
                        <div className="space-y-2">
                            <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Top 3 Cidades
                            </h5>
                            {cityData.slice(0, 3).map((city, idx) => (
                                <div
                                    key={city.name}
                                    className="flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors"
                                    onClick={() => setSelectedCity(city.name)}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-zinc-400' : 'bg-amber-700'
                                            }`}>
                                            {idx + 1}
                                        </span>
                                        <span className="text-xs font-medium truncate max-w-[100px]">{city.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-foreground">
                                        R$ {(city.receita / 1000).toFixed(1)}k
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
