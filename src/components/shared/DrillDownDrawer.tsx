'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeSeriesChart } from '@/components/charts/TimeSeriesChart';
import { Download, X } from 'lucide-react';
import type { KPIData, TimeSeriesPoint } from '@/types/dashboard';

interface DrillDownDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    kpi: KPIData | null;
    timeSeriesData?: TimeSeriesPoint[];
    decomposicao?: {
        dimensao: string;
        items: { nome: string; valor: number; variacao: number }[];
    }[];
}

export function DrillDownDrawer({
    open,
    onOpenChange,
    kpi,
    timeSeriesData = [],
    decomposicao = []
}: DrillDownDrawerProps) {
    if (!kpi) return null;

    const exportCSV = () => {
        const headers = ['Data', 'Valor', 'Comparativo'];
        const rows = timeSeriesData.map(d => [d.data, d.valor, d.comparativo || '']);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${kpi.id}_dados.csv`;
        a.click();
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[85vh] border-zinc-800 bg-zinc-950 p-0">
                <SheetHeader className="flex flex-row items-center justify-between border-b border-zinc-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <SheetTitle className="text-lg font-semibold text-white">{kpi.titulo}</SheetTitle>
                        <Badge
                            variant="outline"
                            className={kpi.variacao >= 0
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                : 'border-red-500/30 bg-red-500/10 text-red-400'}
                        >
                            {kpi.variacao >= 0 ? '+' : ''}{kpi.variacao.toFixed(1)}%
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2 border-zinc-700 text-zinc-400">
                            <Download className="h-4 w-4" />
                            Exportar CSV
                        </Button>
                    </div>
                </SheetHeader>

                <div className="p-6 space-y-6 overflow-y-auto h-[calc(85vh-80px)]">
                    {/* Resumo */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                            <p className="text-xs text-zinc-500">Valor Atual</p>
                            <p className="text-2xl font-bold text-white">{kpi.valorFormatado}</p>
                        </div>
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                            <p className="text-xs text-zinc-500">Meta</p>
                            <p className="text-2xl font-bold text-zinc-400">
                                {kpi.meta ? (kpi.unidade === 'R$' ? `R$ ${(kpi.meta / 1000).toFixed(0)}k` : kpi.meta) : 'N/A'}
                            </p>
                        </div>
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                            <p className="text-xs text-zinc-500">Variação</p>
                            <p className={`text-2xl font-bold ${kpi.variacao >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {kpi.variacao >= 0 ? '+' : ''}{kpi.variacao.toFixed(1)}%
                            </p>
                        </div>
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                            <p className="text-xs text-zinc-500">% da Meta</p>
                            <p className="text-2xl font-bold text-purple-400">
                                {kpi.meta ? ((kpi.valor / kpi.meta) * 100).toFixed(0) : 'N/A'}%
                            </p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <Tabs defaultValue="serie" className="w-full">
                        <TabsList className="bg-zinc-900 border border-zinc-800">
                            <TabsTrigger value="serie" className="text-xs data-[state=active]:bg-zinc-800">
                                Série Temporal
                            </TabsTrigger>
                            <TabsTrigger value="decomposicao" className="text-xs data-[state=active]:bg-zinc-800">
                                Decomposição
                            </TabsTrigger>
                            <TabsTrigger value="evidencias" className="text-xs data-[state=active]:bg-zinc-800">
                                Evidências
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="serie" className="mt-4">
                            {timeSeriesData.length > 0 ? (
                                <TimeSeriesChart
                                    data={timeSeriesData}
                                    title={`${kpi.titulo} - Últimos 30 dias`}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-48 rounded-lg border border-zinc-800 bg-zinc-900">
                                    <p className="text-sm text-zinc-500">Dados temporais não disponíveis</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="decomposicao" className="mt-4">
                            <div className="space-y-4">
                                {decomposicao.length > 0 ? decomposicao.map((dim) => (
                                    <div key={dim.dimensao} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                                            Por {dim.dimensao}
                                        </h4>
                                        <div className="space-y-2">
                                            {dim.items.map((item) => (
                                                <div key={item.nome} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                                                    <span className="text-sm text-zinc-300">{item.nome}</span>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm font-medium text-white">
                                                            {kpi.unidade === 'R$' ? `R$ ${item.valor.toLocaleString('pt-BR')}` : item.valor.toLocaleString('pt-BR')}
                                                        </span>
                                                        <span className={`text-xs ${item.variacao >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {item.variacao >= 0 ? '+' : ''}{item.variacao.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="flex items-center justify-center h-48 rounded-lg border border-zinc-800 bg-zinc-900">
                                        <p className="text-sm text-zinc-500">Decomposição não disponível</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="evidencias" className="mt-4">
                            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                                    Dados Brutos (Últimos 7 dias)
                                </h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-zinc-800">
                                                <th className="text-left py-2 text-xs text-zinc-500">Data</th>
                                                <th className="text-right py-2 text-xs text-zinc-500">Valor</th>
                                                <th className="text-right py-2 text-xs text-zinc-500">Comparativo</th>
                                                <th className="text-right py-2 text-xs text-zinc-500">Variação</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {timeSeriesData.slice(-7).map((row) => {
                                                const variacaoRow = row.comparativo
                                                    ? ((row.valor - row.comparativo) / row.comparativo) * 100
                                                    : 0;
                                                return (
                                                    <tr key={row.data} className="border-b border-zinc-800/50">
                                                        <td className="py-2 text-zinc-300">{row.data}</td>
                                                        <td className="py-2 text-right text-white">{row.valor.toLocaleString('pt-BR')}</td>
                                                        <td className="py-2 text-right text-zinc-400">{row.comparativo?.toLocaleString('pt-BR') || '-'}</td>
                                                        <td className={`py-2 text-right ${variacaoRow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {variacaoRow >= 0 ? '+' : ''}{variacaoRow.toFixed(1)}%
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    );
}
