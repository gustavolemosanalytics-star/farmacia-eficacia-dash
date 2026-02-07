'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Search, ArrowUpDown } from 'lucide-react';

interface CampaignData {
    campaign: string;
    sessions: number;
    addToCarts: number;
    checkouts: number;
    purchases: number;
    cost: number;
    clicks: number;
}

interface CampaignCrossAnalysisTableProps {
    data: CampaignData[];
}

export function CampaignCrossAnalysisTable({ data }: CampaignCrossAnalysisTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{
        key: keyof CampaignData | 'costPerSession';
        direction: 'asc' | 'desc'
    }>({
        key: 'sessions',
        direction: 'desc'
    });

    const sortedAndFilteredData = useMemo(() => {
        let filtered = data.filter(c => c.sessions > 0);

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
                c.campaign?.toLowerCase().includes(lowerTerm)
            );
        }

        return [...filtered].sort((a: any, b: any) => {
            let aValue: number | string = 0;
            let bValue: number | string = 0;

            if (sortConfig.key === 'costPerSession') {
                aValue = a.sessions > 0 ? a.cost / a.sessions : 0;
                bValue = b.sessions > 0 ? b.cost / b.sessions : 0;
            } else {
                aValue = a[sortConfig.key] ?? 0;
                bValue = b[sortConfig.key] ?? 0;
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [data, searchTerm, sortConfig]);

    const requestSort = (key: keyof CampaignData | 'costPerSession') => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ column }: { column: keyof CampaignData | 'costPerSession' }) => {
        if (sortConfig.key !== column) return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground/30" />;
        return <ArrowUpDown className={`h-3 w-3 ml-1 ${sortConfig.direction === 'asc' ? 'text-indigo-500' : 'text-indigo-500 font-bold'}`} />;
    };

    return (
        <Card className="border-border bg-card">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-indigo-500" />
                    <div>
                        <CardTitle className="text-sm font-medium text-foreground">Cruzamento GA4 vs Google Ads</CardTitle>
                        <p className="text-xs text-muted-foreground">Análise de campanhas mapeando Sessões (GA4) vs Investimento (GAds)</p>
                    </div>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar campanha..."
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-muted-foreground">
                        <thead className="border-b border-border text-[10px] uppercase text-foreground/70">
                            <tr>
                                <th
                                    className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group select-none"
                                    onClick={() => requestSort('campaign')}
                                >
                                    <div className="flex items-center">
                                        Campanha
                                        <SortIcon column="campaign" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-right cursor-pointer hover:text-foreground transition-colors group select-none"
                                    onClick={() => requestSort('sessions')}
                                >
                                    <div className="flex items-center justify-end">
                                        Sessões (GA4)
                                        <SortIcon column="sessions" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-right cursor-pointer hover:text-foreground transition-colors group select-none"
                                    onClick={() => requestSort('addToCarts')}
                                >
                                    <div className="flex items-center justify-end">
                                        Add to Cart
                                        <SortIcon column="addToCarts" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-right cursor-pointer hover:text-foreground transition-colors group select-none"
                                    onClick={() => requestSort('checkouts')}
                                >
                                    <div className="flex items-center justify-end">
                                        Checkouts
                                        <SortIcon column="checkouts" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-right cursor-pointer hover:text-foreground transition-colors group select-none"
                                    onClick={() => requestSort('purchases')}
                                >
                                    <div className="flex items-center justify-end">
                                        Purchases
                                        <SortIcon column="purchases" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-right cursor-pointer hover:text-foreground transition-colors group select-none"
                                    onClick={() => requestSort('cost')}
                                >
                                    <div className="flex items-center justify-end">
                                        Investimento (Ads)
                                        <SortIcon column="cost" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-right cursor-pointer hover:text-foreground transition-colors group select-none"
                                    onClick={() => requestSort('clicks')}
                                >
                                    <div className="flex items-center justify-end">
                                        Cliques (Ads)
                                        <SortIcon column="clicks" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-right cursor-pointer hover:text-foreground transition-colors group select-none"
                                    onClick={() => requestSort('costPerSession')}
                                >
                                    <div className="flex items-center justify-end">
                                        Custo/Sessão
                                        <SortIcon column="costPerSession" />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {sortedAndFilteredData.length > 0 ? (
                                sortedAndFilteredData.slice(0, 15).map((c, i) => (
                                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate" title={c.campaign}>
                                            {c.campaign}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                                            {c.sessions.toLocaleString('pt-BR')}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">
                                            {c.addToCarts?.toLocaleString('pt-BR') || '0'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">
                                            {c.checkouts?.toLocaleString('pt-BR') || '0'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-emerald-600 font-bold">
                                            {c.purchases?.toLocaleString('pt-BR') || '0'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">
                                            {c.cost > 0 ? `R$ ${c.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">
                                            {c.clicks?.toLocaleString('pt-BR') || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-medium">
                                            {c.sessions > 0 ? `R$ ${(c.cost / c.sessions).toFixed(2)}` : '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                                        Nenhuma campanha encontrada para "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
