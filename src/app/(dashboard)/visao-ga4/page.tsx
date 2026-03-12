'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RowData {
    mes?: string;
    data?: string;
    canais: Record<string, number>;
    total: number;
}

interface VisaoGA4Data {
    resumoMensal: RowData[];
    detalheDiario: RowData[];
    totalGeral: { canais: Record<string, number>; total: number };
    canaisLabels: Record<string, string>;
}

function formatBRL(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function CanalTable({ rows, labelField, canaisLabels, totalRow }: {
    rows: RowData[];
    labelField: 'mes' | 'data';
    canaisLabels: Record<string, string>;
    totalRow?: { canais: Record<string, number>; total: number };
}) {
    // Collect all canal keys that appear in any row
    const allCanais = new Set<string>();
    for (const row of rows) {
        for (const key of Object.keys(row.canais)) allCanais.add(key);
    }
    if (totalRow) {
        for (const key of Object.keys(totalRow.canais)) allCanais.add(key);
    }
    // Order canais by their label
    const canaisList = Array.from(allCanais).sort((a, b) =>
        (canaisLabels[a] || a).localeCompare(canaisLabels[b] || b)
    );

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b text-left text-zinc-500">
                        <th className="pb-2 pr-4 sticky left-0 bg-white dark:bg-zinc-950">{labelField === 'mes' ? 'Mês' : 'Data'}</th>
                        {canaisList.map(c => (
                            <th key={c} className="pb-2 px-3 text-right whitespace-nowrap">{canaisLabels[c] || c}</th>
                        ))}
                        <th className="pb-2 pl-3 text-right font-semibold">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
                            <td className="py-2 pr-4 font-medium sticky left-0 bg-white dark:bg-zinc-950 capitalize whitespace-nowrap">
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
                            <td className="py-2 pr-4 sticky left-0 bg-white dark:bg-zinc-950">Total</td>
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

export default function VisaoGA4Page() {
    const [data, setData] = useState<VisaoGA4Data | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/dashboard/visao-ga4')
            .then(res => res.json())
            .then(json => {
                if (json.success) {
                    setData(json.data);
                } else {
                    setError(json.error || 'Erro ao carregar dados');
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-zinc-500 animate-pulse">Carregando dados da planilha...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-red-500">Erro: {error}</p>
            </div>
        );
    }

    // Top KPIs from totalGeral
    const topCanais = Object.entries(data.totalGeral.canais)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold">Visão GA4 — Receita por Canal</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-1 pt-4 px-4">
                        <CardTitle className="text-xs text-blue-600 dark:text-blue-400 font-medium">Receita Total</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatBRL(data.totalGeral.total)}</p>
                    </CardContent>
                </Card>
                {topCanais.map(([canal, valor]) => (
                    <Card key={canal}>
                        <CardHeader className="pb-1 pt-4 px-4">
                            <CardTitle className="text-xs text-zinc-500 font-medium">{data.canaisLabels[canal] || canal}</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <p className="text-lg font-bold">{formatBRL(valor)}</p>
                            <p className="text-xs text-zinc-400">{((valor / data.totalGeral.total) * 100).toFixed(1)}%</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Resumo Mensal */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Receita por Canal — Resumo Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                    <CanalTable
                        rows={data.resumoMensal}
                        labelField="mes"
                        canaisLabels={data.canaisLabels}
                        totalRow={data.totalGeral}
                    />
                </CardContent>
            </Card>

            {/* Detalhe Diário */}
            {data.detalheDiario.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Receita por Canal — Detalhe Diário (Mês Atual)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CanalTable
                            rows={data.detalheDiario}
                            labelField="data"
                            canaisLabels={data.canaisLabels}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
