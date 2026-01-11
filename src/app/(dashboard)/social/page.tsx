'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/kpi/KPICard';
import { kpisSocial, sentimentoAnalise } from '@/lib/mockData';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

export default function SocialPage() {
    return (
        <div className="space-y-6">
            {/* Título */}
            <div>
                <h1 className="text-2xl font-bold text-white">Social & Marca</h1>
                <p className="text-sm text-zinc-400">Métricas de redes sociais e análise de sentimento</p>
            </div>

            {/* KPIs */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Métricas de Social</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {kpisSocial.map((kpi) => (
                        <KPICard key={kpi.id} data={kpi} invertedVariation={kpi.id === 'link_bio'} />
                    ))}
                </div>
            </section>

            {/* Análise de Sentimento */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-zinc-300">Análise de Sentimento</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="text-center p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                                <ThumbsUp className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-emerald-400">{sentimentoAnalise.positivo}%</p>
                                <p className="text-xs text-zinc-400">Positivo</p>
                            </div>
                            <div className="text-center p-4 rounded-lg border border-zinc-700 bg-zinc-800">
                                <Minus className="h-6 w-6 text-zinc-400 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-zinc-400">{sentimentoAnalise.neutro}%</p>
                                <p className="text-xs text-zinc-400">Neutro</p>
                            </div>
                            <div className="text-center p-4 rounded-lg border border-red-500/30 bg-red-500/10">
                                <ThumbsDown className="h-6 w-6 text-red-400 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-red-400">{sentimentoAnalise.negativo}%</p>
                                <p className="text-xs text-zinc-400">Negativo</p>
                            </div>
                        </div>
                        {/* Progress bar */}
                        <div className="h-4 rounded-full overflow-hidden flex">
                            <div className="bg-emerald-500" style={{ width: `${sentimentoAnalise.positivo}%` }} />
                            <div className="bg-zinc-500" style={{ width: `${sentimentoAnalise.neutro}%` }} />
                            <div className="bg-red-500" style={{ width: `${sentimentoAnalise.negativo}%` }} />
                        </div>
                    </CardContent>
                </Card>

                {/* Word Cloud */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-zinc-300">Palavras Mais Mencionadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-semibold text-emerald-400 mb-2">Positivas</h4>
                                <div className="flex flex-wrap gap-2">
                                    {sentimentoAnalise.palavrasPositivas.map((palavra, i) => (
                                        <span
                                            key={palavra}
                                            className="px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                            style={{ fontSize: `${14 - i}px` }}
                                        >
                                            {palavra}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-red-400 mb-2">Negativas</h4>
                                <div className="flex flex-wrap gap-2">
                                    {sentimentoAnalise.palavrasNegativas.map((palavra, i) => (
                                        <span
                                            key={palavra}
                                            className="px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400"
                                            style={{ fontSize: `${14 - i}px` }}
                                        >
                                            {palavra}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
