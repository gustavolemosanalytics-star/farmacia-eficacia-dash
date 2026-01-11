'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/kpi/KPICard';
import { kpisCRM, cohortData, segmentosRFM } from '@/lib/mockData';
import { Users, Heart, Crown, AlertTriangle, XCircle } from 'lucide-react';

const getCohortColor = (value: number | null) => {
    if (value === null) return 'bg-zinc-900';
    if (value >= 20) return 'bg-emerald-600';
    if (value >= 15) return 'bg-emerald-500/70';
    if (value >= 10) return 'bg-yellow-500/70';
    if (value >= 5) return 'bg-orange-500/70';
    return 'bg-red-500/70';
};

const getSegmentoIcon = (segmento: string) => {
    switch (segmento) {
        case 'Campeões': return <Crown className="h-4 w-4 text-yellow-400" />;
        case 'Leais': return <Heart className="h-4 w-4 text-emerald-400" />;
        case 'Em Risco': return <AlertTriangle className="h-4 w-4 text-orange-400" />;
        case 'Perdidos': return <XCircle className="h-4 w-4 text-red-400" />;
        default: return <Users className="h-4 w-4 text-zinc-400" />;
    }
};

export default function CrmPage() {
    return (
        <div className="space-y-6">
            {/* Título */}
            <div>
                <h1 className="text-2xl font-bold text-white">CRM & Retenção</h1>
                <p className="text-sm text-zinc-400">Análise de base de clientes, cohorts e segmentação RFM</p>
            </div>

            {/* KPIs */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Saúde da Base</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {kpisCRM.map((kpi) => (
                        <KPICard key={kpi.id} data={kpi} />
                    ))}
                </div>
            </section>

            {/* Cohort Heatmap */}
            <section>
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-zinc-300">Matriz de Cohort (Retenção %)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-800">
                                        <th className="text-left py-3 px-2 text-xs font-medium text-zinc-500">Cohort</th>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-zinc-500">M0</th>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-zinc-500">M1</th>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-zinc-500">M2</th>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-zinc-500">M3</th>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-zinc-500">M4</th>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-zinc-500">M5</th>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-zinc-500">M6</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cohortData.map((row) => (
                                        <tr key={row.mes} className="border-b border-zinc-800/50">
                                            <td className="py-3 px-2 text-zinc-300 font-medium">{row.mes}</td>
                                            {[row.m0, row.m1, row.m2, row.m3, row.m4, row.m5, row.m6].map((value, index) => (
                                                <td key={index} className="py-2 px-1 text-center">
                                                    <span className={`inline-block w-12 py-1 rounded text-xs font-medium text-white ${getCohortColor(value)}`}>
                                                        {value !== null ? `${value}%` : '-'}
                                                    </span>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Legenda */}
                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500">
                            <span>Retenção:</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/70" /> {'<5%'}</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500/70" /> 5-10%</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500/70" /> 10-15%</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/70" /> 15-20%</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-600" /> {'>20%'}</span>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Segmentação RFM */}
            <section>
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-zinc-300">Segmentação RFM</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {segmentosRFM.map((seg) => (
                                <div key={seg.segmento} className="flex items-start gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-900">
                                    <div className="mt-1">{getSegmentoIcon(seg.segmento)}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-zinc-300">{seg.segmento}</span>
                                            <Badge variant="outline" className="text-xs">{seg.percentual.toFixed(1)}%</Badge>
                                        </div>
                                        <p className="text-lg font-bold text-white mb-1">{seg.clientes.toLocaleString('pt-BR')} clientes</p>
                                        <div className="text-xs text-zinc-500 space-y-0.5">
                                            <p>Ticket médio: R$ {seg.valorMedio}</p>
                                            <p>Recência: {seg.recência} dias</p>
                                        </div>
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
