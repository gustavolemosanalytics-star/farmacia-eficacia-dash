'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/kpi/KPICard';
import { kpisSEO, paginasQueda, querysMaisAfetadas, oportunidadesKeywords } from '@/lib/mockData';
import { TrendingDown, Search, AlertTriangle, Sparkles } from 'lucide-react';

export default function SeoPage() {
    return (
        <div className="space-y-6">
            {/* Título */}
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">SEO & Demanda</h1>
                <Badge variant="destructive" className="animate-pulse">Atenção Crítica</Badge>
            </div>
            <p className="text-sm text-zinc-400">Análise de tráfego orgânico, quedas e oportunidades</p>

            {/* KPIs */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Google Search Console</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {kpisSEO.map((kpi) => (
                        <KPICard
                            key={kpi.id}
                            data={kpi}
                            invertedVariation={kpi.id === 'posicao_media'}
                        />
                    ))}
                </div>
            </section>

            {/* Páginas com Queda */}
            <section>
                <Card className="border-red-500/30 bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                        <CardTitle className="text-sm font-medium text-zinc-300">Páginas com Maior Queda</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-800">
                                        <th className="text-left py-3 px-2 text-xs font-medium text-zinc-500">Página</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Cliques (antes)</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Cliques (depois)</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Queda</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Posição Antes</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Posição Depois</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginasQueda.map((row) => (
                                        <tr key={row.pagina} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                            <td className="py-3 px-2 text-zinc-300">{row.pagina}</td>
                                            <td className="py-3 px-2 text-right text-zinc-400">{row.cliquesAntes.toLocaleString('pt-BR')}</td>
                                            <td className="py-3 px-2 text-right text-zinc-300">{row.cliquesDepois.toLocaleString('pt-BR')}</td>
                                            <td className="py-3 px-2 text-right">
                                                <span className="flex items-center justify-end gap-1 text-red-400 font-medium">
                                                    <TrendingDown className="h-3 w-3" />
                                                    {row.queda.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-right text-emerald-400">{row.posicaoAntes.toFixed(1)}</td>
                                            <td className="py-3 px-2 text-right text-red-400">{row.posicaoDepois.toFixed(1)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Queries Afetadas */}
            <section>
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Search className="h-5 w-5 text-zinc-400" />
                        <CardTitle className="text-sm font-medium text-zinc-300">Queries Mais Afetadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-800">
                                        <th className="text-left py-3 px-2 text-xs font-medium text-zinc-500">Query</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Volume/mês</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Cliques (antes)</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Cliques (depois)</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Posição</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {querysMaisAfetadas.map((row) => (
                                        <tr key={row.query} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                            <td className="py-3 px-2 text-zinc-300">{row.query}</td>
                                            <td className="py-3 px-2 text-right text-zinc-400">{row.volumeMensal.toLocaleString('pt-BR')}</td>
                                            <td className="py-3 px-2 text-right text-zinc-400">{row.cliquesAntes.toLocaleString('pt-BR')}</td>
                                            <td className="py-3 px-2 text-right text-red-400">{row.cliquesDepois.toLocaleString('pt-BR')}</td>
                                            <td className="py-3 px-2 text-right">
                                                <span className="text-zinc-400">{row.posicaoAntes}</span>
                                                <span className="text-zinc-600 mx-1">→</span>
                                                <span className="text-red-400">{row.posicaoDepois}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Oportunidades */}
            <section>
                <Card className="border-emerald-500/30 bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Sparkles className="h-5 w-5 text-emerald-400" />
                        <CardTitle className="text-sm font-medium text-zinc-300">Oportunidades de Keywords</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {oportunidadesKeywords.map((kw) => (
                                <div key={kw.keyword} className="flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-900">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-300">{kw.keyword}</p>
                                        <p className="text-xs text-zinc-500">Volume: {kw.volume.toLocaleString('pt-BR')}/mês • Dificuldade: {kw.dificuldade}</p>
                                    </div>
                                    <Badge variant={kw.potencial === 'Alto' ? 'default' : 'secondary'} className={kw.potencial === 'Alto' ? 'bg-emerald-500' : ''}>
                                        {kw.potencial}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
