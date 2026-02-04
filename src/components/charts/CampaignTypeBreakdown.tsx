'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Target, MousePointer, DollarSign, BarChart3, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { cn } from '@/lib/utils';

interface CampaignType {
    type: string;
    label: string;
    spend: number;
    conversions: number;
    clicks: number;
    impressions: number;
    ctr: number;
    cpc: number;
    cpa: number;
    campaigns: string[];
    campaignCount: number;
}

interface Campaign {
    campaign: string;
    spend: number;
    conversions: number;
    clicks: number;
    tipo: string;
    ctr: number;
    cpc: number;
    cpa: number;
    roas?: number;
    revenue?: number;
}

interface RevenueByType {
    type: string;
    revenue: number;
    orders: number;
}

interface Props {
    byCampaignType: CampaignType[];
    byCampaign: Campaign[];
    revenueByType?: RevenueByType[]; // Optional revenue data per campaign type
}

const TYPE_COLORS: Record<string, string> = {
    'pmax_ecommerce': '#8b5cf6',
    'shopping': '#10b981',
    'search_institucional': '#3b82f6',
    'search_leads': '#f59e0b',
    'visita_loja': '#ec4899',
    'outros': '#6b7280',
};

export function CampaignTypeBreakdown({ byCampaignType, byCampaign, revenueByType }: Props) {
    const [expandedType, setExpandedType] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'spend' | 'roas'>('spend');

    const toggleExpand = (type: string) => {
        setExpandedType(expandedType === type ? null : type);
    };

    const getCampaignsForType = (type: string) => {
        const filtered = byCampaign.filter(c => c.tipo === type);

        if (sortBy === 'roas') {
            return filtered.sort((a, b) => (b.roas || 0) - (a.roas || 0)).slice(0, 10);
        }

        return filtered.sort((a, b) => b.spend - a.spend).slice(0, 10);
    };

    // Get revenue for a campaign type
    const getRevenueForType = (type: string): { revenue: number; roas: number; orders: number } => {
        if (!revenueByType) {
            // Calculate from byCampaign if revenueByType not provided
            const campaignsOfType = byCampaign.filter(c => c.tipo === type);
            const revenue = campaignsOfType.reduce((sum, c) => sum + (c.revenue || 0), 0);
            const spend = campaignsOfType.reduce((sum, c) => sum + c.spend, 0);
            return {
                revenue,
                roas: spend > 0 ? revenue / spend : 0,
                orders: 0
            };
        }

        const typeRevenue = revenueByType.find(r => r.type === type);
        if (!typeRevenue) return { revenue: 0, roas: 0, orders: 0 };

        const typeData = byCampaignType.find(t => t.type === type);
        const spend = typeData?.spend || 0;

        return {
            revenue: typeRevenue.revenue,
            roas: spend > 0 ? typeRevenue.revenue / spend : 0,
            orders: typeRevenue.orders
        };
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {byCampaignType.map((typeData) => {
                const isExpanded = expandedType === typeData.type;
                const campaigns = getCampaignsForType(typeData.type);
                const color = TYPE_COLORS[typeData.type] || '#6b7280';
                const revenueData = getRevenueForType(typeData.type);
                const isLeadsOrVisita = typeData.type === 'search_leads' || typeData.type === 'visita_loja';

                return (
                    <Card
                        key={typeData.type}
                        className={`cursor-pointer transition-all duration-200 ${isExpanded ? 'md:col-span-2 lg:col-span-3 ring-2 ring-primary/20' : ''}`}
                        onClick={() => toggleExpand(typeData.type)}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: color }}
                                    />
                                    <CardTitle className="text-sm font-medium">{typeData.label}</CardTitle>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {typeData.campaignCount} campanha{typeData.campaignCount !== 1 ? 's' : ''}
                            </p>
                        </CardHeader>
                        <CardContent>
                            {/* Receita e ROAS Card - New! */}
                            {!isLeadsOrVisita && revenueData.revenue > 0 && (
                                <div className="mb-3 p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200/50 dark:border-emerald-800/30">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mb-0.5">
                                                <TrendingUp className="h-3 w-3" />
                                                Receita Atribuída
                                            </div>
                                            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                                R$ {revenueData.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground mb-0.5">ROAS</div>
                                            <p className={cn(
                                                "text-xl font-bold",
                                                revenueData.roas >= 3 ? "text-emerald-600 dark:text-emerald-400" :
                                                    revenueData.roas >= 2 ? "text-blue-600 dark:text-blue-400" :
                                                        revenueData.roas >= 1 ? "text-amber-600 dark:text-amber-400" :
                                                            "text-red-600 dark:text-red-400"
                                            )}>
                                                {revenueData.roas.toFixed(2)}x
                                            </p>
                                        </div>
                                    </div>
                                    {revenueData.orders > 0 && (
                                        <div className="mt-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/30 text-xs text-muted-foreground">
                                            {revenueData.orders} pedidos atribuídos
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Leads/Visita - No ROAS message */}
                            {isLeadsOrVisita && (
                                <div className="mb-3 p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700">
                                    <p className="text-xs text-muted-foreground text-center">
                                        {typeData.type === 'search_leads' ? '📞 Foco em Leads' : '🏪 Foco em Visitas à Loja'}
                                        <br />
                                        <span className="text-[10px]">ROAS não aplicável</span>
                                    </p>
                                </div>
                            )}

                            {/* Summary KPIs */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-lg p-2">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                                        <DollarSign className="h-3 w-3" />
                                        Investimento
                                    </div>
                                    <p className="text-sm font-semibold">
                                        R$ {typeData.spend.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                                <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-lg p-2">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                                        <Target className="h-3 w-3" />
                                        Conversões
                                    </div>
                                    <p className="text-sm font-semibold">{typeData.conversions.toFixed(0)}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-lg p-2">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                                        <MousePointer className="h-3 w-3" />
                                        CPC
                                    </div>
                                    <p className="text-sm font-semibold">R$ {typeData.cpc.toFixed(2)}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-lg p-2">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                                        <BarChart3 className="h-3 w-3" />
                                        CPA
                                    </div>
                                    <p className="text-sm font-semibold">
                                        R$ {typeData.cpa > 0 ? typeData.cpa.toFixed(2) : '—'}
                                    </p>
                                </div>
                            </div>

                            {/* Expanded: Campaign Chart */}
                            {isExpanded && campaigns.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                                            Top Campanhas por {sortBy === 'spend' ? 'Investimento' : 'Eficiência (ROAS)'}
                                        </h4>
                                        <div className="flex bg-slate-100 dark:bg-zinc-800 rounded-md p-0.5">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSortBy('spend'); }}
                                                className={`text-[10px] px-2 py-1 rounded-sm font-medium transition-all ${sortBy === 'spend' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                Investimento
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSortBy('roas'); }}
                                                className={`text-[10px] px-2 py-1 rounded-sm font-medium transition-all ${sortBy === 'roas' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                ROAS (Eficiência)
                                            </button>
                                        </div>
                                    </div>
                                    <ResponsiveContainer width="100%" height={Math.min(campaigns.length * 40 + 40, 300)}>
                                        <BarChart
                                            data={campaigns}
                                            layout="vertical"
                                            margin={{ left: 10, right: 60, top: 5, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                            <XAxis
                                                type="number"
                                                tickFormatter={(v) => sortBy === 'spend' ? `R$${(v / 1000).toFixed(0)}k` : `${v}x`}
                                                stroke="var(--muted-foreground)"
                                                fontSize={10}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="campaign"
                                                width={120}
                                                stroke="var(--muted-foreground)"
                                                fontSize={9}
                                                tickFormatter={(val: string) => val.length > 18 ? val.substring(0, 18) + '...' : val}
                                            />
                                            <Tooltip
                                                formatter={(value: any, name: any, props: any) => {
                                                    if (sortBy === 'roas') return [`${Number(value).toFixed(2)}x`, 'ROAS'];
                                                    return [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Investimento'];
                                                }}
                                                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                            />
                                            <Bar
                                                dataKey={sortBy === 'spend' ? "spend" : "roas"}
                                                fill={sortBy === 'spend' ? color : '#10b981'}
                                                radius={[0, 4, 4, 0]}
                                            >
                                                <LabelList
                                                    dataKey={sortBy === 'spend' ? "spend" : "roas"}
                                                    position="right"
                                                    formatter={(val: any) => sortBy === 'spend' ? `R$ ${(Number(val) / 1000).toFixed(1)}k` : `${Number(val).toFixed(2)}x`}
                                                    style={{ fill: 'var(--muted-foreground)', fontSize: '9px' }}
                                                />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
