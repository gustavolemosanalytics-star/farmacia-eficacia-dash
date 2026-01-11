'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/kpi/KPICard';
import { kpisOperacao, correlacaoAtrasoRecompra } from '@/lib/mockData';
import { Truck, Clock, AlertTriangle, TrendingDown } from 'lucide-react';

export default function OperacaoPage() {
    return (
        <div className="space-y-6">
            {/* Título */}
            <div>
                <h1 className="text-2xl font-bold text-white">Operação & Experiência</h1>
                <p className="text-sm text-zinc-400">Métricas logísticas, prazos de entrega e satisfação</p>
            </div>

            {/* KPIs */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">KPIs Logísticos</h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                    {kpisOperacao.map((kpi) => (
                        <KPICard
                            key={kpi.id}
                            data={kpi}
                            invertedVariation={kpi.id === 'prazo_real' || kpi.id === 'taxa_atraso' || kpi.id === 'taxa_devolucao'}
                        />
                    ))}
                </div>
            </section>

            {/* Prazos Prometido vs Real */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Clock className="h-5 w-5 text-zinc-400" />
                        <CardTitle className="text-sm font-medium text-zinc-300">Prazo Prometido vs Real</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="text-center p-6 rounded-lg border border-zinc-800 bg-zinc-900">
                                <Truck className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
                                <p className="text-3xl font-bold text-emerald-400">5.2</p>
                                <p className="text-sm text-zinc-400">dias prometido</p>
                            </div>
                            <div className="text-center p-6 rounded-lg border border-red-500/30 bg-red-500/10">
                                <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
                                <p className="text-3xl font-bold text-red-400">6.8</p>
                                <p className="text-sm text-zinc-400">dias real</p>
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-sm text-zinc-500">
                                Diferença média: <span className="text-red-400 font-medium">+1.6 dias</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Correlação Atraso vs Recompra */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-zinc-400" />
                        <CardTitle className="text-sm font-medium text-zinc-300">Impacto do Atraso na Recompra</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {correlacaoAtrasoRecompra.map((row) => (
                                <div key={row.atraso} className="flex items-center gap-4">
                                    <div className="w-24 text-sm text-zinc-400">{row.atraso}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${row.recompra >= 25 ? 'bg-emerald-500' : row.recompra >= 15 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${(row.recompra / 30) * 100}%` }}
                                                />
                                            </div>
                                            <span className={`text-sm font-medium ${row.recompra >= 25 ? 'text-emerald-400' : row.recompra >= 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                {row.recompra}%
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-500">{row.pedidos} pedidos</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
                            <p className="text-xs text-yellow-400">
                                ⚠️ Pedidos com atraso de 5+ dias têm <strong>70% menos chance</strong> de recompra
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
