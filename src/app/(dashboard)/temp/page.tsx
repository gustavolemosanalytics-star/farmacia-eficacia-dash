'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageFilters } from '@/components/ui/PageFilters';

interface CidadeData {
    cidade: string;
    receita: number;
    pedidos: number;
    percentual: number;
    investimento: number;
    roas: number;
}

interface MonthData {
    investimento: number;
    receita: number;
    roas: number;
    totalPedidos: number;
    byCidade: CidadeData[];
}

interface TempData {
    totais: { investimento: number; receita: number; roas: number; pedidos: number };
    months: Record<string, MonthData>;
    monthLabels: Record<string, string>;
}

function formatBRL(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function MonthSection({ title, data }: { title: string; data: MonthData }) {
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card>
                    <CardHeader className="pb-1 pt-4 px-4">
                        <CardTitle className="text-xs text-zinc-500 font-medium">Investimento</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-lg font-bold">{formatBRL(data.investimento)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-1 pt-4 px-4">
                        <CardTitle className="text-xs text-zinc-500 font-medium">Receita Mídia Paga</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-lg font-bold">{formatBRL(data.receita)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-1 pt-4 px-4">
                        <CardTitle className="text-xs text-zinc-500 font-medium">ROAS</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-lg font-bold">{data.roas.toFixed(2)}x</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-1 pt-4 px-4">
                        <CardTitle className="text-xs text-zinc-500 font-medium">Pedidos</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-lg font-bold">{data.totalPedidos.toLocaleString('pt-BR')}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Receita por Cidade (Mídia Paga)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-zinc-500">
                                    <th className="pb-2 pr-4">#</th>
                                    <th className="pb-2 pr-4">Cidade</th>
                                    <th className="pb-2 pr-4 text-right">Investimento*</th>
                                    <th className="pb-2 pr-4 text-right">Receita</th>
                                    <th className="pb-2 pr-4 text-right">ROAS</th>
                                    <th className="pb-2 pr-4 text-right">Pedidos</th>
                                    <th className="pb-2 text-right">%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.byCidade.map((c, i) => (
                                    <tr key={c.cidade} className="border-b border-zinc-100 dark:border-zinc-800">
                                        <td className="py-2 pr-4 text-zinc-400">{i + 1}</td>
                                        <td className="py-2 pr-4 font-medium">{c.cidade}</td>
                                        <td className="py-2 pr-4 text-right">{formatBRL(c.investimento)}</td>
                                        <td className="py-2 pr-4 text-right">{formatBRL(c.receita)}</td>
                                        <td className="py-2 pr-4 text-right">{c.roas.toFixed(2)}x</td>
                                        <td className="py-2 pr-4 text-right">{c.pedidos}</td>
                                        <td className="py-2 text-right">{c.percentual.toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="font-semibold border-t-2">
                                    <td className="py-2 pr-4"></td>
                                    <td className="py-2 pr-4">Total</td>
                                    <td className="py-2 pr-4 text-right">{formatBRL(data.investimento)}</td>
                                    <td className="py-2 pr-4 text-right">{formatBRL(data.receita)}</td>
                                    <td className="py-2 pr-4 text-right">{data.roas.toFixed(2)}x</td>
                                    <td className="py-2 pr-4 text-right">{data.totalPedidos}</td>
                                    <td className="py-2 text-right">100%</td>
                                </tr>
                            </tfoot>
                        </table>
                        <p className="text-xs text-zinc-400 mt-2">* Investimento proporcional à participação de receita da cidade</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function TempPage() {
    const [data, setData] = useState<TempData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/dashboard/temp')
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

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <PageFilters title="Relatório Mídia Paga — 2026" showDatePicker={false} />

            {/* Totais */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-1 pt-4 px-4">
                        <CardTitle className="text-xs text-blue-600 dark:text-blue-400 font-medium">Investimento Total</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatBRL(data.totais.investimento)}</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <CardHeader className="pb-1 pt-4 px-4">
                        <CardTitle className="text-xs text-green-600 dark:text-green-400 font-medium">Receita Mídia Paga</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-xl font-bold text-green-700 dark:text-green-300">{formatBRL(data.totais.receita)}</p>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
                    <CardHeader className="pb-1 pt-4 px-4">
                        <CardTitle className="text-xs text-purple-600 dark:text-purple-400 font-medium">ROAS Geral</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{data.totais.roas.toFixed(2)}x</p>
                    </CardContent>
                </Card>
                <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
                    <CardHeader className="pb-1 pt-4 px-4">
                        <CardTitle className="text-xs text-orange-600 dark:text-orange-400 font-medium">Total Pedidos</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-xl font-bold text-orange-700 dark:text-orange-300">{data.totais.pedidos.toLocaleString('pt-BR')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Meses dinâmicos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(data.months).map(([key, monthData]) => (
                    <MonthSection key={key} title={data.monthLabels[key] || key} data={monthData} />
                ))}
            </div>
        </div>
    );
}
