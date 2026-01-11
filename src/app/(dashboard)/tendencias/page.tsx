'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { oportunidades, trendingProducts, scaleCandidates } from '@/lib/mockData';
import { TrendingUp, Rocket, Sparkles, Target, Zap } from 'lucide-react';

export default function TendenciasPage() {
    return (
        <div className="space-y-6">
            {/* Título */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                    <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Tendências & Oportunidades</h1>
                    <p className="text-sm text-zinc-400">Growth Radar - Oportunidades priorizadas por impacto</p>
                </div>
            </div>

            {/* Matriz de Oportunidades */}
            <section>
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Target className="h-5 w-5 text-emerald-400" />
                        <CardTitle className="text-sm font-medium text-zinc-300">Matriz de Oportunidades (Impacto x Esforço)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative h-64 mb-4">
                            {/* Grid background */}
                            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                                <div className="border-r border-b border-zinc-800 flex items-center justify-center text-[10px] text-zinc-600">Alto Impacto / Baixo Esforço</div>
                                <div className="border-b border-zinc-800 flex items-center justify-center text-[10px] text-zinc-600">Alto Impacto / Alto Esforço</div>
                                <div className="border-r border-zinc-800 flex items-center justify-center text-[10px] text-zinc-600">Baixo Impacto / Baixo Esforço</div>
                                <div className="flex items-center justify-center text-[10px] text-zinc-600">Baixo Impacto / Alto Esforço</div>
                            </div>
                            {/* Points */}
                            {oportunidades.map((op) => (
                                <div
                                    key={op.id}
                                    className="absolute flex items-center justify-center"
                                    style={{
                                        left: `${op.esforco}%`,
                                        bottom: `${op.impacto}%`,
                                        transform: 'translate(-50%, 50%)'
                                    }}
                                >
                                    <div
                                        className="w-10 h-10 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center text-xs font-bold text-purple-400 cursor-pointer hover:scale-110 transition-transform"
                                        title={op.titulo}
                                    >
                                        {op.score}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Lista */}
                        <div className="space-y-2">
                            {oportunidades.map((op, index) => (
                                <div key={op.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm text-zinc-300">{op.titulo}</p>
                                            <p className="text-xs text-zinc-500">{op.categoria}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-xs text-zinc-500">Score</p>
                                            <p className="text-lg font-bold text-purple-400">{op.score}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trending Products */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Rocket className="h-5 w-5 text-orange-400" />
                        <CardTitle className="text-sm font-medium text-zinc-300">Produtos em Alta (Momentum)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {trendingProducts.map((product) => (
                                <div key={product.sku} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900">
                                    <div>
                                        <p className="text-sm text-zinc-300">{product.nome}</p>
                                        <p className="text-xs text-zinc-500">{product.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-emerald-400">+{product.crescimento.toFixed(1)}%</p>
                                        <p className="text-xs text-zinc-500">{product.viewsHoje} views hoje</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Scale Candidates */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-400" />
                        <CardTitle className="text-sm font-medium text-zinc-300">Campanhas para Escalar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {scaleCandidates.map((camp) => (
                                <div key={camp.campanha} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900">
                                    <div>
                                        <p className="text-sm text-zinc-300">{camp.campanha}</p>
                                        <p className="text-xs text-zinc-500">{camp.plataforma} • SOV: {camp.shareOfVoice}%</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-emerald-400">{camp.roas.toFixed(1)}x ROAS</p>
                                        <Badge variant={camp.potencial === 'Alto' ? 'default' : 'secondary'} className={camp.potencial === 'Alto' ? 'bg-emerald-500' : ''}>
                                            {camp.potencial}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
