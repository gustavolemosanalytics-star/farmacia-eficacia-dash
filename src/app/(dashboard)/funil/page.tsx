'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/kpi/KPICard';
import { FunnelChart } from '@/components/charts/FunnelChart';
import { metrícasFunil, buscaInterna, errosCheckout } from '@/lib/mockData';
import { Search, AlertTriangle, XCircle } from 'lucide-react';

export default function FunilPage() {
    return (
        <div className="space-y-6">
            {/* Título */}
            <div>
                <h1 className="text-2xl font-bold text-white">Funil E-commerce (CRO)</h1>
                <p className="text-sm text-zinc-400">Análise do funil de conversão, fricções e busca interna</p>
            </div>

            {/* Funil Visual */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FunnelChart />

                {/* Métricas de Fricção */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-zinc-300">Métricas de Fricção</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        {metrícasFunil.slice(0, 4).map((kpi) => (
                            <div key={kpi.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                                <p className="text-xs text-zinc-500 mb-1">{kpi.titulo}</p>
                                <p className="text-2xl font-bold text-white">{kpi.valorFormatado}</p>
                                <span className={`text-xs ${kpi.variacao >= 0 && kpi.id !== 'aprovacao_pagamento' ? 'text-red-400' : kpi.variacao < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {kpi.variacao >= 0 ? '+' : ''}{kpi.variacao.toFixed(1)}% vs mês anterior
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>

            {/* KPIs Detalhados */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Taxas do Funil</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    {metrícasFunil.map((kpi) => (
                        <KPICard
                            key={kpi.id}
                            data={kpi}
                            compact
                            invertedVariation={kpi.id === 'abandono_carrinho' || kpi.id === 'tempo_compra'}
                        />
                    ))}
                </div>
            </section>

            {/* Busca Interna */}
            <section>
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-zinc-300">Busca Interna</CardTitle>
                        <Badge variant="outline" className="border-yellow-500/30 bg-yellow-500/10 text-yellow-400">
                            {buscaInterna.filter(b => b.resultados === 0).length} termos sem resultados
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-800">
                                        <th className="text-left py-3 px-2 text-xs font-medium text-zinc-500">Termo</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Buscas</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Resultados</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">CR</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Receita</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {buscaInterna.map((row) => (
                                        <tr key={row.termo} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                            <td className="py-3 px-2">
                                                <span className="flex items-center gap-2 text-zinc-300">
                                                    <Search className="h-3 w-3 text-zinc-500" />
                                                    {row.termo}
                                                    {row.resultados === 0 && (
                                                        <Badge variant="destructive" className="text-[10px]">Zero Results</Badge>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-right text-zinc-400">{row.buscas.toLocaleString('pt-BR')}</td>
                                            <td className="py-3 px-2 text-right">
                                                <span className={row.resultados === 0 ? 'text-red-400' : 'text-zinc-300'}>
                                                    {row.resultados}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-right text-zinc-300">{row.cr.toFixed(1)}%</td>
                                            <td className="py-3 px-2 text-right text-zinc-300">
                                                {row.receita > 0 ? `R$ ${(row.receita / 1000).toFixed(1)}k` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Erros de Checkout */}
            <section>
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-zinc-300">Erros de Checkout</CardTitle>
                        <Badge variant="destructive">
                            {errosCheckout.reduce((sum, e) => sum + e.ocorrencias, 0)} erros
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {errosCheckout.map((erro) => (
                                <div key={erro.erro} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
                                            <XCircle className="h-4 w-4 text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-zinc-300">{erro.erro}</p>
                                            <p className="text-xs text-zinc-500">{erro.ocorrencias} ocorrências</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-red-400">- R$ {(erro.impacto / 1000).toFixed(1)}k</p>
                                        <p className="text-xs text-zinc-500">impacto estimado</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
