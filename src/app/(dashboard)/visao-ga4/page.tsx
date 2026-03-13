'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { PageFilters } from '@/components/ui/PageFilters';
import { DateRange } from 'react-day-picker';
import { startOfMonth, subDays, format, subYears, startOfYear, endOfYear, getISOWeek, getYear, setISOWeek, startOfISOWeek, endOfISOWeek } from 'date-fns';

// ==========================================
// Types
// ==========================================

interface RowData {
    mes?: string;
    data?: string;
    canais: Record<string, number>;
    total: number;
}

interface AggregatedPeriod {
    resumoMensal: RowData[];
    detalheDiario: RowData[];
    totalGeral: { canais: Record<string, number>; total: number };
    canaisLabels?: Record<string, string>;
}

interface VisaoGA4Response {
    current: AggregatedPeriod & { canaisLabels: Record<string, string> };
    comparison: AggregatedPeriod | null;
    channels: string[];
}

type ComparisonType = 'none' | 'day' | 'week' | 'month' | 'quarter' | 'semester' | 'quadrimester';

const COMPARISON_LABELS: Record<ComparisonType, string> = {
    none: 'Sem comparação',
    day: 'Mesmo dia (ano anterior)',
    week: 'Mesma semana (ano anterior)',
    month: 'Mesmo mês (ano anterior)',
    quarter: 'Mesmo trimestre (ano anterior)',
    semester: 'Mesmo semestre (ano anterior)',
    quadrimester: 'Mesmo quadrimestre (ano anterior)',
};

// ==========================================
// Comparison date calculation
// ==========================================

function getComparisonDates(start: Date, end: Date, type: ComparisonType): { from: Date; to: Date } | null {
    if (type === 'none') return null;

    switch (type) {
        case 'day':
            return { from: subYears(start, 1), to: subYears(end, 1) };

        case 'week': {
            const weekNum = getISOWeek(start);
            const yearPrev = getYear(start) - 1;
            const weekStart = startOfISOWeek(setISOWeek(new Date(yearPrev, 5, 1), weekNum));
            const weekEnd = endOfISOWeek(setISOWeek(new Date(yearPrev, 5, 1), weekNum));
            return { from: weekStart, to: weekEnd };
        }

        case 'month':
            return {
                from: new Date(start.getFullYear() - 1, start.getMonth(), 1),
                to: new Date(end.getFullYear() - 1, end.getMonth() + 1, 0),
            };

        case 'quarter': {
            const q = Math.floor(start.getMonth() / 3);
            const yearPrev = start.getFullYear() - 1;
            return {
                from: new Date(yearPrev, q * 3, 1),
                to: new Date(yearPrev, q * 3 + 3, 0),
            };
        }

        case 'semester': {
            const s = start.getMonth() < 6 ? 0 : 1;
            const yearPrev = start.getFullYear() - 1;
            return {
                from: new Date(yearPrev, s * 6, 1),
                to: new Date(yearPrev, s * 6 + 6, 0),
            };
        }

        case 'quadrimester': {
            const qd = Math.floor(start.getMonth() / 4);
            const yearPrev = start.getFullYear() - 1;
            return {
                from: new Date(yearPrev, qd * 4, 1),
                to: new Date(yearPrev, qd * 4 + 4, 0),
            };
        }

        default:
            return null;
    }
}

// ==========================================
// Helpers
// ==========================================

function formatBRL(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatVariation(current: number, previous: number): { text: string; color: string } {
    if (previous === 0) return { text: current > 0 ? '+100%' : '—', color: current > 0 ? 'text-emerald-600' : 'text-zinc-400' };
    const pct = ((current - previous) / previous) * 100;
    const sign = pct >= 0 ? '+' : '';
    return {
        text: `${sign}${pct.toFixed(1)}%`,
        color: pct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
    };
}

// ==========================================
// Table component
// ==========================================

function CanalTable({ rows, labelField, canaisLabels, totalRow }: {
    rows: RowData[];
    labelField: 'mes' | 'data';
    canaisLabels: Record<string, string>;
    totalRow?: { canais: Record<string, number>; total: number };
}) {
    const allCanais = new Set<string>();
    for (const row of rows) {
        for (const key of Object.keys(row.canais)) allCanais.add(key);
    }
    if (totalRow) {
        for (const key of Object.keys(totalRow.canais)) allCanais.add(key);
    }
    const canaisList = Array.from(allCanais).sort((a, b) =>
        (canaisLabels[a] || a).localeCompare(canaisLabels[b] || b)
    );

    if (rows.length === 0) {
        return <p className="text-zinc-400 text-sm py-4">Sem dados para o período selecionado.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b text-left text-zinc-500">
                        <th className="pb-2 pr-4 sticky left-0 bg-white dark:bg-zinc-950 z-10">{labelField === 'mes' ? 'Mês' : 'Data'}</th>
                        {canaisList.map(c => (
                            <th key={c} className="pb-2 px-3 text-right whitespace-nowrap">{canaisLabels[c] || c}</th>
                        ))}
                        <th className="pb-2 pl-3 text-right font-semibold">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
                            <td className="py-2 pr-4 font-medium sticky left-0 bg-white dark:bg-zinc-950 z-10 capitalize whitespace-nowrap">
                                {row[labelField]}
                            </td>
                            {canaisList.map(c => (
                                <td key={c} className="py-2 px-3 text-right tabular-nums">
                                    {row.canais[c] ? formatBRL(row.canais[c]) : '—'}
                                </td>
                            ))}
                            <td className="py-2 pl-3 text-right font-semibold tabular-nums">
                                {formatBRL(row.total)}
                            </td>
                        </tr>
                    ))}
                </tbody>
                {totalRow && (
                    <tfoot>
                        <tr className="font-semibold border-t-2">
                            <td className="py-2 pr-4 sticky left-0 bg-white dark:bg-zinc-950 z-10">Total</td>
                            {canaisList.map(c => (
                                <td key={c} className="py-2 px-3 text-right tabular-nums">
                                    {totalRow.canais[c] ? formatBRL(totalRow.canais[c]) : '—'}
                                </td>
                            ))}
                            <td className="py-2 pl-3 text-right tabular-nums">
                                {formatBRL(totalRow.total)}
                            </td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
}

// ==========================================
// Comparison table
// ==========================================

function ComparisonTable({ current, comparison, channels, canaisLabels }: {
    current: { canais: Record<string, number>; total: number };
    comparison: { canais: Record<string, number>; total: number };
    channels: string[];
    canaisLabels: Record<string, string>;
}) {
    const sortedChannels = [...channels].sort((a, b) =>
        (current.canais[b] || 0) - (current.canais[a] || 0)
    );

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b text-left text-zinc-500">
                        <th className="pb-2 pr-4">Canal</th>
                        <th className="pb-2 px-3 text-right">Período Atual</th>
                        <th className="pb-2 px-3 text-right">Período Anterior</th>
                        <th className="pb-2 pl-3 text-right">Variação</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedChannels.map(canal => {
                        const cur = current.canais[canal] || 0;
                        const prev = comparison.canais[canal] || 0;
                        const variation = formatVariation(cur, prev);
                        return (
                            <tr key={canal} className="border-b border-zinc-100 dark:border-zinc-800">
                                <td className="py-2 pr-4 font-medium">{canaisLabels[canal] || canal}</td>
                                <td className="py-2 px-3 text-right tabular-nums">{formatBRL(cur)}</td>
                                <td className="py-2 px-3 text-right tabular-nums">{formatBRL(prev)}</td>
                                <td className={`py-2 pl-3 text-right font-semibold tabular-nums ${variation.color}`}>
                                    {variation.text}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr className="font-semibold border-t-2">
                        <td className="py-2 pr-4">Total</td>
                        <td className="py-2 px-3 text-right tabular-nums">{formatBRL(current.total)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{formatBRL(comparison.total)}</td>
                        <td className={`py-2 pl-3 text-right tabular-nums ${formatVariation(current.total, comparison.total).color}`}>
                            {formatVariation(current.total, comparison.total).text}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

// ==========================================
// Page component
// ==========================================

export default function VisaoGA4Page() {
    const today = new Date();
    const defaultStart = startOfMonth(today);
    const defaultEnd = subDays(today, 1);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: defaultStart,
        to: defaultEnd,
    });
    const [comparisonType, setComparisonType] = useState<ComparisonType>('none');
    const [data, setData] = useState<VisaoGA4Response | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!dateRange?.from || !dateRange?.to) return;

        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
            startDate: format(dateRange.from, 'yyyy-MM-dd'),
            endDate: format(dateRange.to, 'yyyy-MM-dd'),
        });

        const compDates = getComparisonDates(dateRange.from, dateRange.to, comparisonType);
        if (compDates) {
            params.set('compareStartDate', format(compDates.from, 'yyyy-MM-dd'));
            params.set('compareEndDate', format(compDates.to, 'yyyy-MM-dd'));
        }

        try {
            const res = await fetch(`/api/dashboard/visao-ga4?${params}`);
            const json = await res.json();
            if (json.success) {
                setData(json.data);
            } else {
                setError(json.error || 'Erro ao carregar dados');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [dateRange, comparisonType]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const compDates = dateRange?.from && dateRange?.to
        ? getComparisonDates(dateRange.from, dateRange.to, comparisonType)
        : null;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <PageFilters
                title="Visão GA4 — Receita por Canal"
                description="Dados agregados da aba GA4 com atribuição dinâmica"
                showDatePicker={false}
            >
                <DateRangePicker
                    date={dateRange}
                    setDate={setDateRange}
                />
                <Select
                    value={comparisonType}
                    onValueChange={(v) => setComparisonType(v as ComparisonType)}
                >
                    <SelectTrigger className="w-[260px]">
                        <SelectValue placeholder="Tipo de comparação" />
                    </SelectTrigger>
                    <SelectContent>
                        {(Object.entries(COMPARISON_LABELS) as [ComparisonType, string][]).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {compDates && (
                    <span className="text-xs text-zinc-500">
                        vs {format(compDates.from, 'dd/MM/yyyy')} — {format(compDates.to, 'dd/MM/yyyy')}
                    </span>
                )}
            </PageFilters>

            {loading && (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <p className="text-zinc-500 animate-pulse">Carregando dados...</p>
                </div>
            )}

            {error && (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <p className="text-red-500">Erro: {error}</p>
                </div>
            )}

            {!loading && !error && data && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                            <CardHeader className="pb-1 pt-4 px-4">
                                <CardTitle className="text-xs text-blue-600 dark:text-blue-400 font-medium">Receita Total</CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                                    {formatBRL(data.current.totalGeral.total)}
                                </p>
                                {data.comparison && (
                                    <p className={`text-xs font-semibold ${formatVariation(data.current.totalGeral.total, data.comparison.totalGeral.total).color}`}>
                                        {formatVariation(data.current.totalGeral.total, data.comparison.totalGeral.total).text}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                        {Object.entries(data.current.totalGeral.canais)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 4)
                            .map(([canal, valor]) => {
                                const prevVal = data.comparison?.totalGeral.canais[canal] || 0;
                                const variation = data.comparison ? formatVariation(valor, prevVal) : null;
                                return (
                                    <Card key={canal}>
                                        <CardHeader className="pb-1 pt-4 px-4">
                                            <CardTitle className="text-xs text-zinc-500 font-medium">
                                                {data.current.canaisLabels[canal] || canal}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="px-4 pb-4">
                                            <p className="text-lg font-bold">{formatBRL(valor)}</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs text-zinc-400">
                                                    {((valor / data.current.totalGeral.total) * 100).toFixed(1)}%
                                                </p>
                                                {variation && (
                                                    <p className={`text-xs font-semibold ${variation.color}`}>
                                                        {variation.text}
                                                    </p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                    </div>

                    {/* Comparison Table */}
                    {data.comparison && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Comparação por Canal</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ComparisonTable
                                    current={data.current.totalGeral}
                                    comparison={data.comparison.totalGeral}
                                    channels={data.channels}
                                    canaisLabels={data.current.canaisLabels}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Resumo Mensal */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Receita por Canal — Resumo Mensal</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CanalTable
                                rows={data.current.resumoMensal}
                                labelField="mes"
                                canaisLabels={data.current.canaisLabels}
                                totalRow={data.current.totalGeral}
                            />
                        </CardContent>
                    </Card>

                    {/* Detalhe Diário */}
                    {data.current.detalheDiario.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Receita por Canal — Detalhe Diário</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CanalTable
                                    rows={data.current.detalheDiario}
                                    labelField="data"
                                    canaisLabels={data.current.canaisLabels}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Comparison monthly detail */}
                    {data.comparison && data.comparison.resumoMensal.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">
                                    Período Anterior — Resumo Mensal
                                    {compDates && (
                                        <span className="text-zinc-400 font-normal ml-2">
                                            ({format(compDates.from, 'dd/MM/yyyy')} — {format(compDates.to, 'dd/MM/yyyy')})
                                        </span>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CanalTable
                                    rows={data.comparison.resumoMensal}
                                    labelField="mes"
                                    canaisLabels={data.current.canaisLabels}
                                    totalRow={data.comparison.totalGeral}
                                />
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
