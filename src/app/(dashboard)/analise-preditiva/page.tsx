'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageFilters } from '@/components/ui/PageFilters';
import { useCatalogoData, useGoogleAdsKPIs } from '@/hooks/useSheetData';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine
} from 'recharts';
import { Brain, TrendingUp, AlertCircle } from 'lucide-react';

// Simple Linear Regression
function linearRegression(y: number[], x: number[]) {
    const n = y.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumXX += x[i] * x[i];
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
}

// Helper to safely parse dates (DD/MM/YYYY or YYYY-MM-DD)
function parseDate(dateStr: string) {
    if (!dateStr) return new Date();
    // Handle DD/MM/YYYY
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            // parts[0] is day, parts[1] is month, parts[2] is year
            return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
    }
    return new Date(dateStr);
}

export default function AnalisePreditivaPage() {
    const { data: catalogoData, loading: loadingCatalogo } = useCatalogoData();
    const { kpis: gadsKpis, loading: loadingGads } = useGoogleAdsKPIs();
    const loading = loadingCatalogo || loadingGads;

    // Forecast de Receita (Baseado no histórico carregado)
    const revenueForecast = useMemo(() => {
        if (!catalogoData?.dailyRevenue || catalogoData.dailyRevenue.length < 5) return null;

        const data = catalogoData.dailyRevenue; // { date: string, receita: number }[]
        const values = data.map((d: any) => d.receita);
        const indices = data.map((_: any, i: number) => i);

        const { slope, intercept } = linearRegression(values, indices);

        // Project next 30 days
        const projection = [];
        const lastDate = parseDate(data[data.length - 1].date);

        for (let i = 1; i <= 30; i++) {
            const nextIndex = indices.length - 1 + i;
            const forecastedValue = Math.max(0, slope * nextIndex + intercept);
            const nextDate = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + i);

            projection.push({
                date: nextDate.toISOString().split('T')[0],
                receitaForecast: forecastedValue,
                isForecast: true
            });
        }

        // Combine history and forecast
        const history = data.map((d: any) => ({
            date: d.date.includes('/') ? parseDate(d.date).toISOString().split('T')[0] : d.date, // Normalize date for chart
            receita: d.receita,
            receitaTrend: slope * indices[data.indexOf(d)] + intercept, // Trend line for history
            isForecast: false
        }));

        return [...history, ...projection];
    }, [catalogoData]);

    // Forecast de CPA (Google Ads)
    const cpaForecast = useMemo(() => {
        if (!gadsKpis?.dailyData || gadsKpis.dailyData.length < 5) return null;

        const data = gadsKpis.dailyData.filter((d: any) => d.cost > 0 && d.conversions > 0);
        if (data.length < 5) return null;

        const cpaValues = data.map((d: any) => d.cost / d.conversions);
        const indices = data.map((_: any, i: number) => i);

        const { slope, intercept } = linearRegression(cpaValues, indices);

        // Project next 14 days
        const projection = [];
        const lastDate = parseDate(data[data.length - 1].date);

        for (let i = 1; i <= 14; i++) {
            const nextIndex = indices.length - 1 + i;
            const forecastedValue = Math.max(0, slope * nextIndex + intercept);
            const nextDate = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + i);

            projection.push({
                date: nextDate.toISOString().split('T')[0],
                cpaForecast: forecastedValue,
                isForecast: true
            });
        }

        const history = data.map((d: any, i: number) => ({
            date: d.date,
            cpa: d.cost / d.conversions,
            cpaTrend: slope * i + intercept,
            isForecast: false
        }));

        return [...history, ...projection];
    }, [gadsKpis]);

    return (
        <div className="space-y-6">
            <PageFilters
                title="Análise Preditiva (Beta)"
                description="Projeções baseadas em regressão linear simples dos dados históricos atuais."
            />

            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Calculando projeções...</p>
                    </div>
                </div>
            )}

            {!loading && (
                <>
                    {/* Disclaimer */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
                        <Brain className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-medium text-blue-500">Modelo Preditivo Simplificado</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Esta análise utiliza regressão linear sobre o período selecionado para projetar tendências futuras.
                                A precisão depende da estabilidade histórica e sazonalidade não é considerada neste modelo básico.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue Forecast */}
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Projeção de Receita (Próx. 30 dias)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[350px] w-full">
                                    {revenueForecast ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={revenueForecast} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="var(--muted-foreground)"
                                                    fontSize={12}
                                                    tickFormatter={(val) => {
                                                        const d = new Date(val);
                                                        return `${d.getDate()}/${d.getMonth() + 1}`;
                                                    }}
                                                />
                                                <YAxis
                                                    stroke="var(--muted-foreground)"
                                                    fontSize={12}
                                                    tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                                                />
                                                <Tooltip
                                                    formatter={(value: any, name: any) => [
                                                        `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                                                        name === 'receita' ? 'Receita Real' : name === 'receitaForecast' ? 'Projeção' : 'Tendência'
                                                    ]}
                                                    labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                                                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                                                />
                                                <Legend />
                                                <Line
                                                    type="monotone"
                                                    dataKey="receita"
                                                    name="Receita Real"
                                                    stroke="#10b981"
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="receitaForecast"
                                                    name="Projeção"
                                                    stroke="#8b5cf6"
                                                    strokeWidth={2}
                                                    strokeDasharray="5 5"
                                                    dot={false}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="receitaTrend"
                                                    name="Tendência Histórica"
                                                    stroke="#94a3b8"
                                                    strokeWidth={1}
                                                    dot={false}
                                                    activeDot={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                                            Dados insuficientes para projeção. Selecione um período maior.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* CPA Forecast */}
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Tendência de CPA - Google Ads
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[350px] w-full">
                                    {cpaForecast ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={cpaForecast} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="var(--muted-foreground)"
                                                    fontSize={12}
                                                    tickFormatter={(val) => {
                                                        const d = new Date(val);
                                                        return `${d.getDate()}/${d.getMonth() + 1}`;
                                                    }}
                                                />
                                                <YAxis
                                                    stroke="var(--muted-foreground)"
                                                    fontSize={12}
                                                    tickFormatter={(val) => `R$${val.toFixed(0)}`}
                                                />
                                                <Tooltip
                                                    formatter={(value: any, name: any) => [
                                                        `R$ ${Number(value).toFixed(2)}`,
                                                        name === 'cpa' ? 'CPA Real' : name === 'cpaForecast' ? 'Projeção (14d)' : 'Tendência'
                                                    ]}
                                                    labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                                                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                                                />
                                                <Legend />
                                                <Line
                                                    type="monotone"
                                                    dataKey="cpa"
                                                    name="CPA Real"
                                                    stroke="#ef4444"
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="cpaForecast"
                                                    name="Projeção (14d)"
                                                    stroke="#f59e0b"
                                                    strokeWidth={2}
                                                    strokeDasharray="5 5"
                                                    dot={false}
                                                />
                                                <ReferenceLine y={gadsKpis?.cpa || 0} stroke="var(--muted-foreground)" strokeDasharray="3 3" label="Média Atual" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                                            Dados insuficientes para projeção de CPA.
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
