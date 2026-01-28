'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageFilters } from '@/components/ui/PageFilters';
import { useCatalogoData, useGoogleAdsKPIs, useCatalogoYoYData } from '@/hooks/useSheetData';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine,
    Area,
    ComposedChart,
    Bar
} from 'recharts';
import { Brain, TrendingUp, AlertCircle, Calendar, Target, BarChart3, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// ========================================
// MODELOS PREDITIVOS MELHORADOS
// ========================================

// Média Móvel Simples
function movingAverage(data: number[], window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
        if (i < window - 1) {
            result.push(data[i]);
        } else {
            const slice = data.slice(i - window + 1, i + 1);
            result.push(slice.reduce((a, b) => a + b, 0) / window);
        }
    }
    return result;
}

// Média Móvel Exponencial
function exponentialMovingAverage(data: number[], alpha: number = 0.3): number[] {
    const result: number[] = [data[0]];
    for (let i = 1; i < data.length; i++) {
        result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
    }
    return result;
}

// Regressão Linear melhorada com R²
function linearRegressionWithStats(y: number[], x: number[]) {
    const n = y.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;

    for (let i = 0; i < n; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumXX += x[i] * x[i];
        sumYY += y[i] * y[i];
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // R² (coeficiente de determinação)
    const yMean = sumY / n;
    let ssTot = 0, ssRes = 0;
    for (let i = 0; i < n; i++) {
        const predicted = slope * x[i] + intercept;
        ssTot += Math.pow(y[i] - yMean, 2);
        ssRes += Math.pow(y[i] - predicted, 2);
    }
    const rSquared = 1 - (ssRes / ssTot);

    // Erro padrão
    const standardError = Math.sqrt(ssRes / (n - 2));

    return { slope, intercept, rSquared, standardError };
}

// Decomposição Sazonal Simples (detecta padrões semanais)
function detectSeasonality(data: number[], period: number = 7): number[] {
    if (data.length < period * 2) return new Array(period).fill(1);

    const seasonalFactors: number[] = [];
    const avg = data.reduce((a, b) => a + b, 0) / data.length;

    for (let i = 0; i < period; i++) {
        let sum = 0, count = 0;
        for (let j = i; j < data.length; j += period) {
            if (data[j] > 0) {
                sum += data[j] / avg;
                count++;
            }
        }
        seasonalFactors.push(count > 0 ? sum / count : 1);
    }

    return seasonalFactors;
}

// Modelo Holt-Winters simplificado (para tendência + sazonalidade)
function holtWintersPredict(
    data: number[],
    forecastPeriods: number,
    seasonPeriod: number = 7,
    alpha: number = 0.3,
    beta: number = 0.1,
    gamma: number = 0.2
): { forecast: number[], upper: number[], lower: number[] } {
    const n = data.length;
    if (n < seasonPeriod * 2) {
        // Fallback para média móvel se dados insuficientes
        const avg = data.reduce((a, b) => a + b, 0) / n;
        return {
            forecast: new Array(forecastPeriods).fill(avg),
            upper: new Array(forecastPeriods).fill(avg * 1.2),
            lower: new Array(forecastPeriods).fill(avg * 0.8)
        };
    }

    // Inicialização
    const level: number[] = [data.slice(0, seasonPeriod).reduce((a, b) => a + b, 0) / seasonPeriod];
    const trend: number[] = [0];
    const seasonal: number[] = [];

    // Sazonalidade inicial
    const firstSeasonAvg = data.slice(0, seasonPeriod).reduce((a, b) => a + b, 0) / seasonPeriod;
    for (let i = 0; i < seasonPeriod; i++) {
        seasonal.push(data[i] / firstSeasonAvg || 1);
    }

    // Suavização
    for (let t = 1; t < n; t++) {
        const seasonIdx = t % seasonPeriod;
        const newLevel = alpha * (data[t] / (seasonal[seasonIdx] || 1)) + (1 - alpha) * (level[t - 1] + trend[t - 1]);
        const newTrend = beta * (newLevel - level[t - 1]) + (1 - beta) * trend[t - 1];

        level.push(newLevel);
        trend.push(newTrend);

        // Atualiza sazonalidade
        if (t >= seasonPeriod) {
            seasonal[seasonIdx] = gamma * (data[t] / newLevel) + (1 - gamma) * seasonal[seasonIdx];
        }
    }

    // Previsões
    const forecast: number[] = [];
    const lastLevel = level[level.length - 1];
    const lastTrend = trend[trend.length - 1];

    // Calcular desvio padrão dos erros para intervalos de confiança
    const errors: number[] = [];
    for (let t = seasonPeriod; t < n; t++) {
        const predicted = (level[t - 1] + trend[t - 1]) * seasonal[t % seasonPeriod];
        errors.push(data[t] - predicted);
    }
    const stdError = Math.sqrt(errors.reduce((sum, e) => sum + e * e, 0) / errors.length) || (lastLevel * 0.1);

    for (let h = 1; h <= forecastPeriods; h++) {
        const seasonIdx = (n + h - 1) % seasonPeriod;
        const predicted = (lastLevel + h * lastTrend) * (seasonal[seasonIdx] || 1);
        forecast.push(Math.max(0, predicted));
    }

    // Intervalos de confiança (95%)
    const z = 1.96;
    const upper = forecast.map((f, i) => f + z * stdError * Math.sqrt(1 + i * 0.1));
    const lower = forecast.map((f, i) => Math.max(0, f - z * stdError * Math.sqrt(1 + i * 0.1)));

    return { forecast, upper, lower };
}

// Parse de data seguro
function parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
}

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

export default function AnalisePreditivaPage() {
    const { data: catalogoData, loading: loadingCatalogo } = useCatalogoData();
    const { data: yoyData, loading: loadingYoY } = useCatalogoYoYData();
    const { kpis: gadsKpis, loading: loadingGads } = useGoogleAdsKPIs();
    const loading = loadingCatalogo || loadingGads || loadingYoY;

    // ========================================
    // PREVISÃO DE RECEITA DIÁRIA (30 DIAS)
    // ========================================
    const dailyForecast = useMemo(() => {
        if (!catalogoData?.dailyRevenue || catalogoData.dailyRevenue.length < 14) return null;

        const data = catalogoData.dailyRevenue;
        const values = data.map((d: any) => d.receita || 0);

        // Aplicar Holt-Winters
        const { forecast, upper, lower } = holtWintersPredict(values, 30, 7);

        // Estatísticas do modelo
        const indices = values.map((_: number, i: number) => i);
        const stats = linearRegressionWithStats(values, indices);

        // Histórico formatado
        const history = data.map((d: any, i: number) => ({
            date: d.date.includes('/') ? parseDate(d.date)?.toISOString().split('T')[0] : d.date,
            receita: d.receita,
            ma7: i >= 6 ? movingAverage(values.slice(0, i + 1), 7).pop() : null,
            isForecast: false
        }));

        // Projeções
        const lastDate = parseDate(data[data.length - 1].date) || new Date();
        const projections = forecast.map((val, i) => {
            const nextDate = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + i + 1);
            return {
                date: nextDate.toISOString().split('T')[0],
                receitaForecast: val,
                upperBound: upper[i],
                lowerBound: lower[i],
                isForecast: true
            };
        });

        return {
            data: [...history, ...projections],
            stats: {
                rSquared: stats.rSquared,
                trend: stats.slope > 0 ? 'up' : 'down',
                trendPercent: values.length > 0 ? (stats.slope / (values.reduce((a: number, b: number) => a + b, 0) / values.length)) * 100 * 30 : 0
            }
        };
    }, [catalogoData]);

    // ========================================
    // PREVISÃO MENSAL (PRÓXIMOS 6 MESES)
    // ========================================
    const monthlyForecast = useMemo(() => {
        // Usar dados históricos completos (YoY) para melhor previsão
        const sourceData = yoyData?.rawData || catalogoData?.rawData;
        if (!sourceData || sourceData.length < 100) return null;

        // Agregar por mês
        const monthlyMap: { [key: string]: number } = {};

        sourceData.forEach((d: any) => {
            const dateStr = d.data || d.dataTransacao;
            const parsed = parseDate(dateStr);
            if (!parsed) return;

            // Filtrar apenas pedidos válidos
            const status = (d.status || '').toLowerCase();
            if (status && !status.includes('complete') && !status.includes('pago') && !status.includes('faturado')) return;

            const monthKey = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
            monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + (d.receitaProduto || 0);
        });

        const months = Object.entries(monthlyMap)
            .map(([month, receita]) => ({ month, receita }))
            .sort((a, b) => a.month.localeCompare(b.month));

        if (months.length < 6) return null;

        const values = months.map(m => m.receita);

        // Detectar sazonalidade anual (12 meses) se tiver dados suficientes
        const seasonPeriod = values.length >= 24 ? 12 : Math.min(values.length / 2, 6);
        const { forecast, upper, lower } = holtWintersPredict(values, 6, seasonPeriod, 0.4, 0.15, 0.3);

        // Calcular estatísticas
        const indices = values.map((_, i) => i);
        const stats = linearRegressionWithStats(values, indices);

        // Histórico
        const history = months.slice(-12).map(m => ({
            month: m.month,
            monthLabel: new Date(m.month + '-01').toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
            receita: m.receita,
            isForecast: false
        }));

        // Projeções
        const lastMonth = new Date(months[months.length - 1].month + '-01');
        const projections = forecast.map((val, i) => {
            const nextMonth = new Date(lastMonth);
            nextMonth.setMonth(lastMonth.getMonth() + i + 1);
            const monthKey = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
            return {
                month: monthKey,
                monthLabel: nextMonth.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
                receitaForecast: val,
                upperBound: upper[i],
                lowerBound: lower[i],
                isForecast: true
            };
        });

        // Calcular meta projetada (soma dos 6 meses)
        const projectedTotal = forecast.reduce((a, b) => a + b, 0);
        const lastSixMonthsTotal = values.slice(-6).reduce((a, b) => a + b, 0);
        const growthProjection = lastSixMonthsTotal > 0 ? ((projectedTotal - lastSixMonthsTotal) / lastSixMonthsTotal) * 100 : 0;

        return {
            data: [...history, ...projections],
            stats: {
                rSquared: stats.rSquared,
                projectedTotal,
                growthProjection,
                avgMonthly: projectedTotal / 6
            }
        };
    }, [yoyData, catalogoData]);

    // ========================================
    // PREVISÃO DE CPA
    // ========================================
    const cpaForecast = useMemo(() => {
        if (!gadsKpis?.dailyData || gadsKpis.dailyData.length < 7) return null;

        const data = gadsKpis.dailyData.filter((d: any) => d.cost > 0 && d.conversions > 0);
        if (data.length < 7) return null;

        const cpaValues = data.map((d: any) => d.cost / d.conversions);
        const { forecast, upper, lower } = holtWintersPredict(cpaValues, 14, 7, 0.3, 0.1, 0.1);

        const indices = cpaValues.map((_: number, i: number) => i);
        const stats = linearRegressionWithStats(cpaValues, indices);

        const history = data.map((d: any) => ({
            date: d.date,
            cpa: d.cost / d.conversions,
            isForecast: false
        }));

        const lastDate = parseDate(data[data.length - 1].date) || new Date();
        const projections = forecast.map((val, i) => {
            const nextDate = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + i + 1);
            return {
                date: nextDate.toISOString().split('T')[0],
                cpaForecast: val,
                upperBound: upper[i],
                lowerBound: lower[i],
                isForecast: true
            };
        });

        const currentAvg = cpaValues.reduce((a: number, b: number) => a + b, 0) / cpaValues.length;
        const projectedAvg = forecast.reduce((a, b) => a + b, 0) / forecast.length;

        return {
            data: [...history, ...projections],
            stats: {
                rSquared: stats.rSquared,
                trend: stats.slope > 0 ? 'increasing' : 'decreasing',
                currentAvg,
                projectedAvg,
                change: ((projectedAvg - currentAvg) / currentAvg) * 100
            }
        };
    }, [gadsKpis]);

    // ========================================
    // RENDER
    // ========================================
    return (
        <div className="space-y-6">
            <PageFilters
                title="Análise Preditiva"
                description="Previsões baseadas em modelos de séries temporais com sazonalidade e tendência"
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
                    {/* Model Info */}
                    <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4 flex items-start gap-3">
                        <Brain className="h-5 w-5 text-violet-500 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-medium text-violet-500">Modelo Preditivo Avançado</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Utilizamos o modelo Holt-Winters que considera tendência e sazonalidade (semanal e mensal).
                                Os intervalos de confiança (faixa sombreada) representam 95% de probabilidade.
                            </p>
                        </div>
                    </div>

                    {/* KPIs das Previsões */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {monthlyForecast && (
                            <Card className="border-border bg-card">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="h-4 w-4 text-violet-500" />
                                        <span className="text-xs font-medium text-muted-foreground uppercase">Receita Projetada (6 meses)</span>
                                    </div>
                                    <p className="text-2xl font-black">
                                        R$ {monthlyForecast.stats.projectedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </p>
                                    <p className={cn(
                                        "text-xs font-medium mt-1",
                                        monthlyForecast.stats.growthProjection >= 0 ? "text-emerald-500" : "text-red-500"
                                    )}>
                                        {monthlyForecast.stats.growthProjection >= 0 ? '+' : ''}{monthlyForecast.stats.growthProjection.toFixed(1)}% vs últimos 6 meses
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {monthlyForecast && (
                            <Card className="border-border bg-card">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="h-4 w-4 text-blue-500" />
                                        <span className="text-xs font-medium text-muted-foreground uppercase">Média Mensal Projetada</span>
                                    </div>
                                    <p className="text-2xl font-black">
                                        R$ {monthlyForecast.stats.avgMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Confiabilidade: {(monthlyForecast.stats.rSquared * 100).toFixed(0)}%
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {cpaForecast && (
                            <Card className="border-border bg-card">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <BarChart3 className="h-4 w-4 text-amber-500" />
                                        <span className="text-xs font-medium text-muted-foreground uppercase">CPA Projetado (14 dias)</span>
                                    </div>
                                    <p className="text-2xl font-black">
                                        R$ {cpaForecast.stats.projectedAvg.toFixed(2)}
                                    </p>
                                    <p className={cn(
                                        "text-xs font-medium mt-1",
                                        cpaForecast.stats.change <= 0 ? "text-emerald-500" : "text-red-500"
                                    )}>
                                        {cpaForecast.stats.change >= 0 ? '+' : ''}{cpaForecast.stats.change.toFixed(1)}% vs atual
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Gráfico de Previsão Mensal */}
                    {monthlyForecast && (
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-blue-500" />
                                    Previsão de Receita Mensal (Próximos 6 Meses)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={monthlyForecast.data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                            <defs>
                                                <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                            <XAxis
                                                dataKey="monthLabel"
                                                stroke="var(--muted-foreground)"
                                                fontSize={12}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                stroke="var(--muted-foreground)"
                                                fontSize={12}
                                                tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                formatter={(value: any, name: any) => [
                                                    `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`,
                                                    name === 'receita' ? 'Receita Real' :
                                                        name === 'receitaForecast' ? 'Previsão' :
                                                            name === 'upperBound' ? 'Limite Superior' : 'Limite Inferior'
                                                ]}
                                                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                                            />
                                            <Legend />

                                            {/* Intervalo de confiança */}
                                            <Area
                                                type="monotone"
                                                dataKey="upperBound"
                                                stroke="none"
                                                fill="url(#forecastGradient)"
                                                name="Intervalo Superior"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="lowerBound"
                                                stroke="none"
                                                fill="transparent"
                                                name="Intervalo Inferior"
                                            />

                                            {/* Barras para histórico */}
                                            <Bar
                                                dataKey="receita"
                                                name="Receita Real"
                                                fill="#10b981"
                                                radius={[4, 4, 0, 0]}
                                            />

                                            {/* Linha de previsão */}
                                            <Line
                                                type="monotone"
                                                dataKey="receitaForecast"
                                                name="Previsão"
                                                stroke="#8b5cf6"
                                                strokeWidth={3}
                                                strokeDasharray="5 5"
                                                dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                                    <p className="text-xs text-muted-foreground">
                                        <Sparkles className="h-3 w-3 inline mr-1" />
                                        <strong>Insight:</strong> O modelo considera sazonalidade histórica.
                                        {monthlyForecast.stats.growthProjection > 5
                                            ? ' A tendência indica crescimento - considere aumentar estoque e investimento em mídia.'
                                            : monthlyForecast.stats.growthProjection < -5
                                                ? ' A tendência indica desaceleração - revise estratégias de marketing e ofertas.'
                                                : ' A tendência está estável - mantenha as operações atuais.'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Previsão Diária */}
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                    Projeção Diária (Próx. 30 dias)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[350px] w-full">
                                    {dailyForecast ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={dailyForecast.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="var(--muted-foreground)"
                                                    fontSize={10}
                                                    tickFormatter={(val) => {
                                                        const d = new Date(val);
                                                        return `${d.getDate()}/${d.getMonth() + 1}`;
                                                    }}
                                                    interval="preserveStartEnd"
                                                />
                                                <YAxis
                                                    stroke="var(--muted-foreground)"
                                                    fontSize={10}
                                                    tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                                                />
                                                <Tooltip
                                                    formatter={(value: any, name: any) => [
                                                        `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                                                        name === 'receita' ? 'Real' : name === 'receitaForecast' ? 'Previsão' : name === 'ma7' ? 'Média Móvel 7d' : name
                                                    ]}
                                                    labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                                                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                                                />
                                                <Legend />
                                                <Area
                                                    type="monotone"
                                                    dataKey="upperBound"
                                                    stroke="none"
                                                    fill="url(#dailyGradient)"
                                                    name="Intervalo Confiança"
                                                />
                                                <Line type="monotone" dataKey="receita" name="Real" stroke="#10b981" strokeWidth={2} dot={false} />
                                                <Line type="monotone" dataKey="ma7" name="Média 7d" stroke="#94a3b8" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                                                <Line type="monotone" dataKey="receitaForecast" name="Previsão" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                                            Dados insuficientes. Selecione um período maior.
                                        </div>
                                    )}
                                </div>
                                {dailyForecast && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        R²: {(dailyForecast.stats.rSquared * 100).toFixed(0)}% |
                                        Tendência: {dailyForecast.stats.trend === 'up' ? '📈' : '📉'} {dailyForecast.stats.trendPercent.toFixed(1)}% em 30d
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Previsão de CPA */}
                        <Card className="border-border bg-card">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                    Tendência de CPA - Google Ads
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[350px] w-full">
                                    {cpaForecast ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={cpaForecast.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="cpaGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="var(--muted-foreground)"
                                                    fontSize={10}
                                                    tickFormatter={(val) => {
                                                        const d = new Date(val);
                                                        return `${d.getDate()}/${d.getMonth() + 1}`;
                                                    }}
                                                />
                                                <YAxis
                                                    stroke="var(--muted-foreground)"
                                                    fontSize={10}
                                                    tickFormatter={(val) => `R$${val.toFixed(0)}`}
                                                />
                                                <Tooltip
                                                    formatter={(value: any, name: any) => [
                                                        `R$ ${Number(value).toFixed(2)}`,
                                                        name === 'cpa' ? 'CPA Real' : 'Projeção'
                                                    ]}
                                                    labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                                                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                                                />
                                                <Legend />
                                                <ReferenceLine y={cpaForecast.stats.currentAvg} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'Média Atual', position: 'right', fontSize: 10 }} />
                                                <Area
                                                    type="monotone"
                                                    dataKey="upperBound"
                                                    stroke="none"
                                                    fill="url(#cpaGradient)"
                                                    name="Intervalo"
                                                />
                                                <Line type="monotone" dataKey="cpa" name="CPA Real" stroke="#ef4444" strokeWidth={2} dot={false} />
                                                <Line type="monotone" dataKey="cpaForecast" name="Projeção" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                                            Dados insuficientes para projeção de CPA.
                                        </div>
                                    )}
                                </div>
                                {cpaForecast && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        CPA Atual: R$ {cpaForecast.stats.currentAvg.toFixed(2)} |
                                        Projeção: R$ {cpaForecast.stats.projectedAvg.toFixed(2)} |
                                        Tendência: {cpaForecast.stats.trend === 'increasing' ? '⚠️ Subindo' : '✅ Caindo'}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Notas sobre o modelo */}
                    <Card className="border-border bg-muted/30">
                        <CardContent className="pt-6">
                            <h4 className="text-sm font-bold mb-3">Sobre os Modelos Preditivos</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
                                <div>
                                    <strong className="text-foreground">Holt-Winters</strong>
                                    <p>Modelo que decompõe a série temporal em nível, tendência e sazonalidade para previsões mais precisas.</p>
                                </div>
                                <div>
                                    <strong className="text-foreground">Intervalo de Confiança</strong>
                                    <p>A faixa sombreada representa 95% de probabilidade de que o valor real esteja dentro desse intervalo.</p>
                                </div>
                                <div>
                                    <strong className="text-foreground">R² (Confiabilidade)</strong>
                                    <p>Quanto maior o R², mais confiável é o modelo. Valores acima de 70% indicam boa capacidade preditiva.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
