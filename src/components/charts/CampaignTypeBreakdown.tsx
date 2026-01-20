'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Target, MousePointer, DollarSign, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

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
}

interface Props {
    byCampaignType: CampaignType[];
    byCampaign: Campaign[];
}

const TYPE_COLORS: Record<string, string> = {
    'pmax_ecommerce': '#8b5cf6',
    'shopping': '#10b981',
    'search_institucional': '#3b82f6',
    'search_leads': '#f59e0b',
    'visita_loja': '#ec4899',
    'outros': '#6b7280',
};

export function CampaignTypeBreakdown({ byCampaignType, byCampaign }: Props) {
    const [expandedType, setExpandedType] = useState<string | null>(null);

    const toggleExpand = (type: string) => {
        setExpandedType(expandedType === type ? null : type);
    };

    const getCampaignsForType = (type: string) => {
        return byCampaign.filter(c => c.tipo === type).slice(0, 10); // Limit to 10
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {byCampaignType.map((typeData) => {
                const isExpanded = expandedType === typeData.type;
                const campaigns = getCampaignsForType(typeData.type);
                const color = TYPE_COLORS[typeData.type] || '#6b7280';

                return (
                    <Card
                        key={typeData.type}
                        className={`cursor-pointer transition-all duration-200 ${isExpanded ? 'md:col-span-2 lg:col-span-3' : ''}`}
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
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
                                        Top Campanhas
                                    </h4>
                                    <ResponsiveContainer width="100%" height={Math.min(campaigns.length * 40 + 40, 300)}>
                                        <BarChart
                                            data={campaigns}
                                            layout="vertical"
                                            margin={{ left: 10, right: 60, top: 5, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                            <XAxis
                                                type="number"
                                                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
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
                                                formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Investimento']}
                                                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                            />
                                            <Bar dataKey="spend" fill={color} radius={[0, 4, 4, 0]}>
                                                <LabelList
                                                    dataKey="spend"
                                                    position="right"
                                                    formatter={(val: any) => `R$ ${(Number(val) / 1000).toFixed(1)}k`}
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
