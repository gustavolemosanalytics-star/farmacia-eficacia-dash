'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/kpi/KPICard';
import { kpisPreco, comparativoPrecos } from '@/lib/mockData';

export default function PrecoPage() {
    return (
        <div className="space-y-6">
            {/* Título */}
            <div>
                <h1 className="text-2xl font-bold text-white">Preço & Concorrência</h1>
                <p className="text-sm text-zinc-400">Monitoramento de preços e posicionamento vs mercado</p>
            </div>

            {/* KPIs */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Visão Geral</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {kpisPreco.map((kpi) => (
                        <KPICard key={kpi.id} data={kpi} invertedVariation={kpi.id === 'skus_mais_caros'} />
                    ))}
                </div>
            </section>

            {/* Comparativo por Categoria */}
            <section>
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-zinc-300">Comparativo por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-800">
                                        <th className="text-left py-3 px-2 text-xs font-medium text-zinc-500">Categoria</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Nosso Preço</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">P25</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">P50 (Mediana)</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">P75</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Índice</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparativoPrecos.map((row) => (
                                        <tr key={row.categoria} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                            <td className="py-3 px-2 text-zinc-300 font-medium">{row.categoria}</td>
                                            <td className="py-3 px-2 text-right text-white font-medium">R$ {row.nossoPreco.toLocaleString('pt-BR')}</td>
                                            <td className="py-3 px-2 text-right text-zinc-500">R$ {row.mercadoP25.toLocaleString('pt-BR')}</td>
                                            <td className="py-3 px-2 text-right text-zinc-400">R$ {row.mercadoP50.toLocaleString('pt-BR')}</td>
                                            <td className="py-3 px-2 text-right text-zinc-500">R$ {row.mercadoP75.toLocaleString('pt-BR')}</td>
                                            <td className="py-3 px-2 text-right">
                                                <Badge variant={row.indice >= 100 ? 'secondary' : 'default'} className={row.indice < 100 ? 'bg-emerald-500' : ''}>
                                                    {row.indice.toFixed(1)}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Boxplot Visual */}
            <section>
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-zinc-300">Dispersão de Preços (Boxplot)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {comparativoPrecos.map((row) => {
                                const min = row.mercadoP25 * 0.8;
                                const max = row.mercadoP75 * 1.2;
                                const range = max - min;
                                const p25Pos = ((row.mercadoP25 - min) / range) * 100;
                                const p50Pos = ((row.mercadoP50 - min) / range) * 100;
                                const p75Pos = ((row.mercadoP75 - min) / range) * 100;
                                const nossoPos = ((row.nossoPreco - min) / range) * 100;

                                return (
                                    <div key={row.categoria} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-zinc-300">{row.categoria}</span>
                                            <span className="text-xs text-zinc-500">R$ {min.toFixed(0)} - R$ {max.toFixed(0)}</span>
                                        </div>
                                        <div className="relative h-8 rounded-lg bg-zinc-800">
                                            {/* Box (P25-P75) */}
                                            <div
                                                className="absolute top-1/2 -translate-y-1/2 h-4 bg-zinc-600 rounded"
                                                style={{ left: `${p25Pos}%`, width: `${p75Pos - p25Pos}%` }}
                                            />
                                            {/* Median line */}
                                            <div
                                                className="absolute top-1/2 -translate-y-1/2 w-0.5 h-6 bg-zinc-400"
                                                style={{ left: `${p50Pos}%` }}
                                            />
                                            {/* Our price marker */}
                                            <div
                                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-purple-500 border-2 border-white"
                                                style={{ left: `${nossoPos}%`, transform: 'translate(-50%, -50%)' }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Legenda */}
                        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-zinc-500">
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-zinc-600" /> Mercado (P25-P75)</span>
                            <span className="flex items-center gap-1"><span className="w-0.5 h-3 bg-zinc-400" /> Mediana</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-500" /> Nosso preço</span>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
