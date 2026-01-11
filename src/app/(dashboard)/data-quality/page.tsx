'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/kpi/KPICard';
import { kpisDataQuality, discrepancias } from '@/lib/mockData';
import { Database, AlertTriangle, Check, X } from 'lucide-react';

export default function DataQualityPage() {
    return (
        <div className="space-y-6">
            {/* Título */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                    <Database className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Data Quality & Governança</h1>
                    <p className="text-sm text-zinc-400">Monitoramento de integridade e qualidade dos dados</p>
                </div>
            </div>

            {/* KPIs */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Saúde dos Dados</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {kpisDataQuality.map((kpi) => (
                        <KPICard
                            key={kpi.id}
                            data={kpi}
                            invertedVariation={kpi.id === 'discrepancia' || kpi.id === 'eventos_faltando'}
                        />
                    ))}
                </div>
            </section>

            {/* Discrepâncias */}
            <section>
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-zinc-300">Discrepância GA4 vs Backend</CardTitle>
                        <Badge variant="destructive">Atenção</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-800">
                                        <th className="text-left py-3 px-2 text-xs font-medium text-zinc-500">Métrica</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">GA4</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Backend</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Diferença</th>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-zinc-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {discrepancias.map((row) => (
                                        <tr key={row.metrica} className="border-b border-zinc-800/50">
                                            <td className="py-3 px-2 text-zinc-300 font-medium">{row.metrica}</td>
                                            <td className="py-3 px-2 text-right text-zinc-400">
                                                {row.metrica === 'Receita' ? `R$ ${(row.ga4 / 1000).toFixed(1)}k` : row.ga4?.toLocaleString('pt-BR') || '-'}
                                            </td>
                                            <td className="py-3 px-2 text-right text-zinc-300">
                                                {row.backend ? (row.metrica === 'Receita' ? `R$ ${(row.backend / 1000).toFixed(1)}k` : row.backend.toLocaleString('pt-BR')) : '-'}
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                {row.diferenca !== null ? (
                                                    <span className={Math.abs(row.diferenca) > 5 ? 'text-red-400' : 'text-yellow-400'}>
                                                        {row.diferenca > 0 ? '+' : ''}{row.diferenca.toFixed(1)}%
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                {row.diferenca !== null ? (
                                                    Math.abs(row.diferenca) > 5 ? (
                                                        <X className="h-4 w-4 text-red-400 mx-auto" />
                                                    ) : (
                                                        <AlertTriangle className="h-4 w-4 text-yellow-400 mx-auto" />
                                                    )
                                                ) : (
                                                    <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Alertas de Tracking */}
            <section>
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-zinc-300">Alertas de Tracking</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                                    <div>
                                        <p className="text-sm font-medium text-yellow-400">UTM Coverage baixa em Paid Social</p>
                                        <p className="text-xs text-zinc-400">22% das sessões de Meta Ads sem UTM parameters</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">Warning</Badge>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-900">
                                <div className="flex items-center gap-3">
                                    <Check className="h-5 w-5 text-emerald-400" />
                                    <div>
                                        <p className="text-sm font-medium text-zinc-300">Eventos de Purchase funcionando</p>
                                        <p className="text-xs text-zinc-400">1.847 eventos registrados nas últimas 24h</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">OK</Badge>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg border border-red-500/30 bg-red-500/10">
                                <div className="flex items-center gap-3">
                                    <X className="h-5 w-5 text-red-400" />
                                    <div>
                                        <p className="text-sm font-medium text-red-400">Evento view_item_list faltando</p>
                                        <p className="text-xs text-zinc-400">Não detectado nas últimas 48h - possível quebra</p>
                                    </div>
                                </div>
                                <Badge variant="destructive">Erro</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
