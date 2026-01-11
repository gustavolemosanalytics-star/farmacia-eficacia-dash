'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KPICard } from '@/components/kpi/KPICard';
import {
    kpisAquisicao,
    tabelaCanais,
    topLandingPages,
    dadosAtribuicao,
} from '@/lib/mockData';
import { TrendingDown, TrendingUp, ExternalLink } from 'lucide-react';

export default function AquisicaoPage() {
    return (
        <div className="space-y-6">
            {/* Título */}
            <div>
                <h1 className="text-2xl font-bold text-white">Aquisição & Tráfego</h1>
                <p className="text-sm text-zinc-400">Análise de sessões, usuários, engajamento e qualidade do tráfego por canal</p>
            </div>

            {/* KPIs */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">KPIs de Tráfego</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    {kpisAquisicao.map((kpi) => (
                        <KPICard
                            key={kpi.id}
                            data={kpi}
                            compact
                            invertedVariation={kpi.id === 'bounce_rate'}
                        />
                    ))}
                </div>
            </section>

            {/* Tabela de Canais */}
            <section>
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-zinc-300">Breakdown por Canal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-800">
                                        <th className="text-left py-3 px-2 text-xs font-medium text-zinc-500">Canal</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Sessões</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Usuários</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">CR</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Receita</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Variação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tabelaCanais.map((row) => (
                                        <tr key={row.canal} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                            <td className="py-3 px-2 text-zinc-300 font-medium">{row.canal}</td>
                                            <td className="py-3 px-2 text-right text-zinc-400">{row.sessoes.toLocaleString('pt-BR')}</td>
                                            <td className="py-3 px-2 text-right text-zinc-400">{row.usuarios.toLocaleString('pt-BR')}</td>
                                            <td className="py-3 px-2 text-right text-zinc-300">{row.cr.toFixed(2)}%</td>
                                            <td className="py-3 px-2 text-right text-zinc-300">R$ {(row.receita / 1000).toFixed(1)}k</td>
                                            <td className="py-3 px-2 text-right">
                                                <span className={`flex items-center justify-end gap-1 ${row.variacao >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {row.variacao >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                    {row.variacao >= 0 ? '+' : ''}{row.variacao.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Top Landing Pages */}
            <section>
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-zinc-300">Top 20 Landing Pages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-800">
                                        <th className="text-left py-3 px-2 text-xs font-medium text-zinc-500">Página</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Sessões</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Bounce Rate</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Receita</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Variação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topLandingPages.map((row) => (
                                        <tr key={row.pagina} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                            <td className="py-3 px-2">
                                                <span className="flex items-center gap-2 text-zinc-300">
                                                    {row.pagina}
                                                    <ExternalLink className="h-3 w-3 text-zinc-500" />
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-right text-zinc-400">{row.sessoes.toLocaleString('pt-BR')}</td>
                                            <td className="py-3 px-2 text-right">
                                                <span className={row.bounce > 50 ? 'text-red-400' : 'text-zinc-300'}>
                                                    {row.bounce.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-right text-zinc-300">R$ {(row.receita / 1000).toFixed(1)}k</td>
                                            <td className="py-3 px-2 text-right">
                                                <span className={`${row.variacao >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {row.variacao >= 0 ? '+' : ''}{row.variacao.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Atribuição */}
            <section>
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-zinc-300">Modelos de Atribuição</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="lastclick" className="w-full">
                            <TabsList className="mb-4 bg-zinc-900 border border-zinc-800">
                                <TabsTrigger value="lastclick" className="text-xs data-[state=active]:bg-zinc-800">Last Click</TabsTrigger>
                                <TabsTrigger value="datadriven" className="text-xs data-[state=active]:bg-zinc-800">Data-Driven</TabsTrigger>
                            </TabsList>
                            <TabsContent value="lastclick">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                    {dadosAtribuicao.lastClick.map((item) => (
                                        <div key={item.canal} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-center">
                                            <p className="text-xs text-zinc-500 mb-1">{item.canal}</p>
                                            <p className="text-lg font-bold text-white">R$ {(item.receita / 1000).toFixed(1)}k</p>
                                            <p className="text-xs text-zinc-400">{item.percentual.toFixed(1)}%</p>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>
                            <TabsContent value="datadriven">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                    {dadosAtribuicao.dataDriven.map((item) => (
                                        <div key={item.canal} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-center">
                                            <p className="text-xs text-zinc-500 mb-1">{item.canal}</p>
                                            <p className="text-lg font-bold text-white">R$ {(item.receita / 1000).toFixed(1)}k</p>
                                            <p className="text-xs text-zinc-400">{item.percentual.toFixed(1)}%</p>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
