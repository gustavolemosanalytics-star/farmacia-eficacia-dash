'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/kpi/KPICard';
import { kpisEmail, fluxosAutomacao } from '@/lib/mockData';
import { Mail, Send, MousePointer, ShoppingCart, UserPlus, Gift, RotateCcw, Heart } from 'lucide-react';

const getFluxoIcon = (fluxo: string) => {
    if (fluxo.includes('Carrinho')) return <ShoppingCart className="h-4 w-4 text-orange-400" />;
    if (fluxo.includes('Welcome')) return <UserPlus className="h-4 w-4 text-blue-400" />;
    if (fluxo.includes('Winback')) return <RotateCcw className="h-4 w-4 text-purple-400" />;
    if (fluxo.includes('Aniversário')) return <Gift className="h-4 w-4 text-pink-400" />;
    if (fluxo.includes('Pós-Compra')) return <Heart className="h-4 w-4 text-emerald-400" />;
    return <Mail className="h-4 w-4 text-zinc-400" />;
};

export default function EmailPage() {
    return (
        <div className="space-y-6">
            {/* Título */}
            <div>
                <h1 className="text-2xl font-bold text-white">E-mail & Automação</h1>
                <p className="text-sm text-zinc-400">Performance de campanhas e fluxos automatizados</p>
            </div>

            {/* KPIs */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Métricas Gerais</h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                    {kpisEmail.map((kpi) => (
                        <KPICard
                            key={kpi.id}
                            data={kpi}
                            compact
                            invertedVariation={kpi.id === 'unsubscribe'}
                        />
                    ))}
                </div>
            </section>

            {/* Fluxos de Automação */}
            <section>
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-zinc-300">Fluxos de Automação</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-800">
                                        <th className="text-left py-3 px-2 text-xs font-medium text-zinc-500">Fluxo</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Envios</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Opens</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Cliques</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Conversões</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Receita</th>
                                        <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">CR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fluxosAutomacao.map((fluxo) => (
                                        <tr key={fluxo.fluxo} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                            <td className="py-3 px-2">
                                                <span className="flex items-center gap-2 text-zinc-300">
                                                    {getFluxoIcon(fluxo.fluxo)}
                                                    {fluxo.fluxo}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-right text-zinc-400">{fluxo.envios.toLocaleString('pt-BR')}</td>
                                            <td className="py-3 px-2 text-right text-zinc-300">
                                                {fluxo.opens.toLocaleString('pt-BR')}
                                                <span className="text-xs text-zinc-500 ml-1">({((fluxo.opens / fluxo.envios) * 100).toFixed(1)}%)</span>
                                            </td>
                                            <td className="py-3 px-2 text-right text-zinc-300">
                                                {fluxo.cliques.toLocaleString('pt-BR')}
                                                <span className="text-xs text-zinc-500 ml-1">({((fluxo.cliques / fluxo.envios) * 100).toFixed(1)}%)</span>
                                            </td>
                                            <td className="py-3 px-2 text-right text-emerald-400">{fluxo.conversoes}</td>
                                            <td className="py-3 px-2 text-right text-white font-medium">R$ {(fluxo.receita / 1000).toFixed(1)}k</td>
                                            <td className="py-3 px-2 text-right">
                                                <Badge variant={fluxo.cr >= 2 ? 'default' : 'secondary'} className={fluxo.cr >= 2 ? 'bg-emerald-500' : ''}>
                                                    {fluxo.cr.toFixed(2)}%
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

            {/* Funil Visual */}
            <section>
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-zinc-300">Funil - Carrinho Abandonado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between gap-4 overflow-x-auto py-4">
                            {['Envios', 'Opens', 'Cliques', 'Conversões'].map((step, index) => {
                                const fluxo = fluxosAutomacao[0];
                                const values = [fluxo.envios, fluxo.opens, fluxo.cliques, fluxo.conversoes];
                                const percentuals = values.map(v => (v / fluxo.envios) * 100);

                                return (
                                    <div key={step} className="flex-1 min-w-[120px]">
                                        <div className="text-center mb-2">
                                            <p className="text-2xl font-bold text-white">{values[index].toLocaleString('pt-BR')}</p>
                                            <p className="text-xs text-zinc-500">{step}</p>
                                        </div>
                                        <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400"
                                                style={{ width: `${percentuals[index]}%` }}
                                            />
                                        </div>
                                        <p className="text-center text-xs text-zinc-400 mt-1">{percentuals[index].toFixed(1)}%</p>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
