'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Search, ArrowUpDown } from 'lucide-react';

interface Campaign {
    campaign: string;
    spend: number;
    clicks: number;
    conversions: number;
    roas: number;
    revenue?: number; // Optional if not always present
}

interface CampaignRankingTableProps {
    campaigns: Campaign[];
}

export function CampaignRankingTable({ campaigns }: CampaignRankingTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Campaign | 'receitaEstimada'; direction: 'asc' | 'desc' }>({
        key: 'roas',
        direction: 'desc'
    });

    const sortedAndFilteredCampaigns = useMemo(() => {
        let filtered = campaigns;

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = campaigns.filter(c =>
                c.campaign?.toLowerCase().includes(lowerTerm)
            );
        }

        return [...filtered].sort((a: any, b: any) => {
            const aValue = a[sortConfig.key] ?? 0;
            const bValue = b[sortConfig.key] ?? 0;

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [campaigns, searchTerm, sortConfig]);

    const requestSort = (key: keyof Campaign | 'receitaEstimada') => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ column }: { column: keyof Campaign | 'receitaEstimada' }) => {
        if (sortConfig.key !== column) return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground/30" />;
        return <ArrowUpDown className={`h-3 w-3 ml-1 ${sortConfig.direction === 'asc' ? 'text-emerald-500' : 'text-rose-500'}`} />;
    };

    return (
        <Card className="border-border bg-card">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <CardTitle className="text-sm font-medium">Ranking de Campanhas por ROAS</CardTitle>
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
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-3 px-2 font-medium text-muted-foreground w-12">#</th>
                                <th
                                    className="text-left py-3 px-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors group select-none"
                                    onClick={() => requestSort('campaign')}
                                >
                                    <div className="flex items-center">
                                        Campanha
                                        <SortIcon column="campaign" />
                                    </div>
                                </th>
                                <th
                                    className="text-right py-3 px-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors group select-none"
                                    onClick={() => requestSort('spend')}
                                >
                                    <div className="flex items-center justify-end">
                                        Investimento
                                        <SortIcon column="spend" />
                                    </div>
                                </th>
                                <th
                                    className="text-right py-3 px-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors group select-none"
                                    onClick={() => requestSort('clicks')}
                                >
                                    <div className="flex items-center justify-end">
                                        Cliques
                                        <SortIcon column="clicks" />
                                    </div>
                                </th>
                                <th
                                    className="text-right py-3 px-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors group select-none"
                                    onClick={() => requestSort('conversions')}
                                >
                                    <div className="flex items-center justify-end">
                                        Conv.
                                        <SortIcon column="conversions" />
                                    </div>
                                </th>
                                <th
                                    className="text-right py-3 px-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors group select-none"
                                    onClick={() => requestSort('roas')}
                                >
                                    <div className="flex items-center justify-end">
                                        ROAS
                                        <SortIcon column="roas" />
                                    </div>
                                </th>
                                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Recomendação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAndFilteredCampaigns.length > 0 ? (
                                sortedAndFilteredCampaigns.slice(0, 10).map((camp, i) => (
                                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                                        <td className="py-3 px-2 font-medium text-muted-foreground">{i + 1}</td>
                                        <td className="py-3 px-2 max-w-[200px] truncate" title={camp.campaign}>
                                            {camp.campaign}
                                        </td>
                                        <td className="py-3 px-2 text-right">R$ {camp.spend?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="py-3 px-2 text-right">{camp.clicks?.toLocaleString('pt-BR')}</td>
                                        <td className="py-3 px-2 text-right">{camp.conversions?.toFixed(0)}</td>
                                        <td className={`py-3 px-2 text-right font-medium ${camp.roas >= 2 ? 'text-green-600' : camp.roas >= 1 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {camp.roas.toFixed(2)}x
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <span className={`text-xs px-2 py-1 rounded-full ${camp.roas >= 3 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                camp.roas >= 1.5 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    camp.roas >= 1 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {camp.roas >= 3 ? 'Escalar' : camp.roas >= 1.5 ? 'Manter' : camp.roas >= 1 ? 'Otimizar' : 'Pausar'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                                        Nenhuma campanha encontrada para "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {sortedAndFilteredCampaigns.length > 10 && (
                        <div className="p-4 text-center border-t border-border mt-2">
                            <p className="text-xs text-muted-foreground">
                                Mostrando 10 de {sortedAndFilteredCampaigns.length} campanhas. Utilize a busca para encontrar itens específicos.
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
