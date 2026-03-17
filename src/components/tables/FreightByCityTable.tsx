'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Search, ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';

type SortKey = 'cidade' | 'estado' | 'totalFrete' | 'avgFrete' | 'pedidoCount' | 'percentOfTotal';

interface CityFreight {
    cidade: string;
    estado: string;
    totalFrete: number;
    avgFrete: number;
    pedidoCount: number;
    percentOfTotal: number;
}

interface Props {
    cities: CityFreight[];
    grandTotalFrete: number;
    grandAvgFrete: number;
    totalPedidos: number;
}

export function FreightByCityTable({ cities, grandTotalFrete, grandAvgFrete, totalPedidos }: Props) {
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('totalFrete');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    const filtered = useMemo(() => {
        let list = cities;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(c => c.cidade.toLowerCase().includes(q) || c.estado.toLowerCase().includes(q));
        }
        return [...list].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            if (typeof aVal === 'string') {
                return sortDir === 'desc'
                    ? (bVal as string).localeCompare(aVal as string)
                    : (aVal as string).localeCompare(bVal as string);
            }
            return sortDir === 'desc' ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
        });
    }, [cities, search, sortKey, sortDir]);

    const SortBtn = ({ field, label, align = 'right' }: { field: SortKey; label: string; align?: string }) => (
        <th
            className={`${align === 'left' ? 'text-left' : 'text-right'} py-3 px-2 font-bold cursor-pointer select-none hover:text-foreground transition-colors`}
            onClick={() => handleSort(field)}
        >
            <span className="inline-flex items-center gap-1">
                {label}
                {sortKey === field ? (
                    sortDir === 'desc' ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />
                ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                )}
            </span>
        </th>
    );

    return (
        <section className="pb-10">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Custo de Frete por Cidade
            </h2>
            <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-medium text-card-foreground">Frete pago pelos clientes por cidade</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                                Total: R$ {grandTotalFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Frete Medio: R$ {grandAvgFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | {totalPedidos} pedidos
                            </p>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar cidade..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-7 pr-3 py-1.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-[180px]"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-card z-10">
                                <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                                    <th className="text-left py-3 px-2 font-bold w-8">#</th>
                                    <SortBtn field="cidade" label="Cidade" align="left" />
                                    <SortBtn field="estado" label="UF" align="left" />
                                    <SortBtn field="pedidoCount" label="Pedidos" />
                                    <SortBtn field="totalFrete" label="Frete Total" />
                                    <SortBtn field="avgFrete" label="Frete Medio" />
                                    <SortBtn field="percentOfTotal" label="% Total" />
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.slice(0, 50).map((city, i) => (
                                    <tr key={city.cidade} className="border-b border-border last:border-0 hover:bg-muted/50">
                                        <td className="py-2 px-2 text-xs text-muted-foreground">{i + 1}</td>
                                        <td className="py-2 px-2 text-xs font-medium">{city.cidade}</td>
                                        <td className="py-2 px-2 text-xs text-muted-foreground">{city.estado}</td>
                                        <td className="py-2 px-2 text-right text-xs font-mono">{city.pedidoCount}</td>
                                        <td className="py-2 px-2 text-right text-xs font-medium text-emerald-600">
                                            R$ {city.totalFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2 px-2 text-right text-xs font-mono">
                                            R$ {city.avgFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2 px-2 text-right text-xs">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${city.percentOfTotal >= 10 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                                city.percentOfTotal >= 5 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                    'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                                                }`}>
                                                {city.percentOfTotal.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-border bg-muted/30">
                                    <td colSpan={3} className="py-2 px-2 text-xs font-bold">Total ({filtered.length} cidades)</td>
                                    <td className="py-2 px-2 text-right text-xs font-bold">{totalPedidos}</td>
                                    <td className="py-2 px-2 text-right text-xs font-bold text-emerald-600">
                                        R$ {grandTotalFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-2 px-2 text-right text-xs font-bold">
                                        R$ {grandAvgFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-2 px-2 text-right text-xs font-bold">100%</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
