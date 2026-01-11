'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KPICard } from '@/components/kpi/KPICard';
import { kpisMidiaPaga, campanhasGoogle, campanhasMeta, hallDaFama, budgetBleeders } from '@/lib/mockData';
import { TrendingUp, TrendingDown, Trophy, AlertTriangle, Target, Image } from 'lucide-react';

export default function MidiaPagaPage() {
    return (
        <div className="space-y-6">
            {/* Título */}
            <div>
                <h1 className="text-2xl font-bold text-white">Mídia Paga</h1>
                <p className="text-sm text-zinc-400">Performance de Google Ads e Meta Ads</p>
            </div>

            {/* KPIs Overview */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Visão Geral</h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
                    {kpisMidiaPaga.map((kpi) => (
                        <KPICard
                            key={kpi.id}
                            data={kpi}
                            compact
                            invertedVariation={kpi.id === 'cpc'}
                        />
                    ))}
                </div>
            </section>

            {/* Google & Meta Tabs */}
            <section>
                <Tabs defaultValue="google" className="w-full">
                    <TabsList className="mb-4 bg-zinc-900 border border-zinc-800">
                        <TabsTrigger value="google" className="flex items-center gap-2 text-xs data-[state=active]:bg-zinc-800">
                            <Target className="h-3 w-3" /> Google Ads
                        </TabsTrigger>
                        <TabsTrigger value="meta" className="flex items-center gap-2 text-xs data-[state=active]:bg-zinc-800">
                            <Image className="h-3 w-3" /> Meta Ads
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="google">
                        <Card className="border-zinc-800 bg-zinc-900/50">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-zinc-300">Campanhas Google</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-zinc-800">
                                                <th className="text-left py-3 px-2 text-xs font-medium text-zinc-500">Campanha</th>
                                                <th className="text-left py-3 px-2 text-xs font-medium text-zinc-500">Tipo</th>
                                                <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Spend</th>
                                                <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Cliques</th>
                                                <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">CTR</th>
                                                <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">CPC</th>
                                                <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Conv.</th>
                                                <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">ROAS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {campanhasGoogle.map((row) => (
                                                <tr key={row.campanha} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                                    <td className="py-3 px-2 text-zinc-300">{row.campanha}</td>
                                                    <td className="py-3 px-2">
                                                        <Badge variant="outline" className="text-xs">{row.tipo}</Badge>
                                                    </td>
                                                    <td className="py-3 px-2 text-right text-zinc-400">R$ {(row.spend / 1000).toFixed(1)}k</td>
                                                    <td className="py-3 px-2 text-right text-zinc-400">{row.cliques.toLocaleString('pt-BR')}</td>
                                                    <td className="py-3 px-2 text-right text-zinc-300">{row.ctr.toFixed(2)}%</td>
                                                    <td className="py-3 px-2 text-right text-zinc-300">R$ {row.cpc.toFixed(2)}</td>
                                                    <td className="py-3 px-2 text-right text-zinc-300">{row.conversoes}</td>
                                                    <td className="py-3 px-2 text-right">
                                                        <span className={row.roas >= 3 ? 'text-emerald-400 font-medium' : row.roas >= 2 ? 'text-yellow-400' : 'text-red-400'}>
                                                            {row.roas.toFixed(1)}x
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="meta">
                        <Card className="border-zinc-800 bg-zinc-900/50">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-zinc-300">Campanhas Meta</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-zinc-800">
                                                <th className="text-left py-3 px-2 text-xs font-medium text-zinc-500">Campanha</th>
                                                <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Spend</th>
                                                <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Alcance</th>
                                                <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Cliques</th>
                                                <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">CTR</th>
                                                <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">Conv.</th>
                                                <th className="text-right py-3 px-2 text-xs font-medium text-zinc-500">ROAS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {campanhasMeta.map((row) => (
                                                <tr key={row.campanha} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                                    <td className="py-3 px-2 text-zinc-300">{row.campanha}</td>
                                                    <td className="py-3 px-2 text-right text-zinc-400">R$ {(row.spend / 1000).toFixed(1)}k</td>
                                                    <td className="py-3 px-2 text-right text-zinc-400">{(row.alcance / 1000).toFixed(0)}k</td>
                                                    <td className="py-3 px-2 text-right text-zinc-400">{row.cliques.toLocaleString('pt-BR')}</td>
                                                    <td className="py-3 px-2 text-right text-zinc-300">{row.ctr.toFixed(2)}%</td>
                                                    <td className="py-3 px-2 text-right text-zinc-300">{row.conversoes}</td>
                                                    <td className="py-3 px-2 text-right">
                                                        <span className={row.roas >= 3 ? 'text-emerald-400 font-medium' : row.roas >= 2 ? 'text-yellow-400' : 'text-red-400'}>
                                                            {row.roas.toFixed(1)}x
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </section>

            {/* Hall da Fama vs Budget Bleeders */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hall da Fama */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-400" />
                        <CardTitle className="text-sm font-medium text-zinc-300">Hall da Fama (Top ROAS)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {hallDaFama.map((item, index) => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500/20 text-[10px] font-bold text-yellow-400">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm text-zinc-300">{item.nome}</p>
                                            <p className="text-xs text-zinc-500">{item.plataforma}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-emerald-400">{item.roas.toFixed(1)}x</p>
                                        <p className="text-xs text-zinc-500">{item.conversoes} conv.</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Budget Bleeders */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                        <CardTitle className="text-sm font-medium text-zinc-300">Budget Bleeders (Baixo ROAS)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {budgetBleeders.map((item, index) => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-[10px] font-bold text-red-400">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm text-zinc-300">{item.nome}</p>
                                            <p className="text-xs text-zinc-500">{item.plataforma}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-red-400">{item.roas.toFixed(1)}x</p>
                                        <p className="text-xs text-zinc-500">CPA R$ {item.cpa.toFixed(0)}</p>
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
