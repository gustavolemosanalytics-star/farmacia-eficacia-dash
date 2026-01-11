'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/kpi/KPICard';
import { kpisCatalogo, topSkusReceita, merchantCenterStatus } from '@/lib/mockData';
import { Package, Check, X, AlertTriangle } from 'lucide-react';

export default function CatalogoPage() {
    const totalProdutos = merchantCenterStatus.aprovados + merchantCenterStatus.reprovados + merchantCenterStatus.pendentes;
    const percentualAprovados = ((merchantCenterStatus.aprovados / totalProdutos) * 100).toFixed(1);

    return (
        <div className="space-y-6">
            {/* Título */}
            <div>
                <h1 className="text-2xl font-bold text-white">Catálogo & Merchandising</h1>
                <p className="text-sm text-zinc-400">Gestão de SKUs, estoque e qualidade do catálogo</p>
            </div>

            {/* KPIs */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Saúde do Catálogo</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {kpisCatalogo.map((kpi) => (
                        <KPICard
                            key={kpi.id}
                            data={kpi}
                            invertedVariation={kpi.id === 'skus_sem_venda' || kpi.id === 'skus_ruptura'}
                        />
                    ))}
                </div>
            </section>

            {/* Top SKUs */}
            <section>
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-zinc-300">Top SKUs por Receita</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-800">
                                        <th className="text-left py-3 px-2 text-xs font-medium text-zinc-500">SKU</th>
                                        <th className="text-left py-3 px-2 text-xs font-medium text-zinc-500">Produto</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Receita</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Margem</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Estoque</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topSkusReceita.map((row, index) => (
                                        <tr key={row.sku} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                            <td className="py-3 px-2">
                                                <span className="flex items-center gap-2">
                                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-[10px] font-bold text-purple-400">
                                                        {index + 1}
                                                    </span>
                                                    <code className="text-xs text-zinc-400">{row.sku}</code>
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-zinc-300">{row.nome}</td>
                                            <td className="py-3 px-2 text-right text-white font-medium">R$ {(row.receita / 1000).toFixed(1)}k</td>
                                            <td className="py-3 px-2 text-right">
                                                <span className={row.margem >= 20 ? 'text-emerald-400' : 'text-zinc-300'}>
                                                    {row.margem.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <Badge variant={row.estoque < 10 ? 'destructive' : 'secondary'} className="text-xs">
                                                    {row.estoque} un
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

            {/* Merchant Center */}
            <section>
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-zinc-300">Google Merchant Center</CardTitle>
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                            {percentualAprovados}% aprovados
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        {/* Status Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                                <Check className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-emerald-400">{merchantCenterStatus.aprovados.toLocaleString('pt-BR')}</p>
                                <p className="text-xs text-zinc-400">Aprovados</p>
                            </div>
                            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center">
                                <X className="h-6 w-6 text-red-400 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-red-400">{merchantCenterStatus.reprovados}</p>
                                <p className="text-xs text-zinc-400">Reprovados</p>
                            </div>
                            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-center">
                                <AlertTriangle className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-yellow-400">{merchantCenterStatus.pendentes}</p>
                                <p className="text-xs text-zinc-400">Pendentes</p>
                            </div>
                        </div>

                        {/* Motivos de Reprovação */}
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Motivos de Reprovação</h4>
                        <div className="space-y-2">
                            {merchantCenterStatus.motivos.map((motivo) => (
                                <div key={motivo.motivo} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900">
                                    <span className="text-sm text-zinc-300">{motivo.motivo}</span>
                                    <Badge variant="destructive">{motivo.quantidade}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
