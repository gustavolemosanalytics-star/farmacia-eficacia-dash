'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/kpi/KPICard';
import { PageFilters } from '@/components/ui/PageFilters';
import { useGoogleAdsKPIs, useCatalogoData, useGA4KPIs } from '@/hooks/useSheetData';
import { CampaignTypeBreakdown } from '@/components/charts/CampaignTypeBreakdown';
import {
    TrendingUp, TrendingDown, DollarSign, Target, BarChart3, Activity, AlertTriangle, CheckCircle, Lightbulb, Zap, Trophy, XCircle, MousePointer, ShoppingCart, Package, Rocket, ArrowUpRight, Sparkles
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, Legend, LabelList
} from 'recharts';
import { cn } from '@/lib/utils';
import { CampaignRankingTable } from '@/components/tables/CampaignRankingTable';
import { CampaignCrossAnalysisTable } from '@/components/tables/CampaignCrossAnalysisTable';
import { IntelligentAnalysis } from '@/components/dashboard/IntelligentAnalysis';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

export default function MidiaPagaPage() {
    const { kpis: gadsKpis, loading: loadingGads } = useGoogleAdsKPIs();
    const { data: catalogoData, loading: loadingCatalogo } = useCatalogoData();
    const { kpis: ga4Kpis, loading: loadingGA4 } = useGA4KPIs();

    const loading = loadingGads || loadingCatalogo || loadingGA4;

    // Advanced Analytics
    const analytics = useMemo(() => {
        if (!catalogoData?.rawData || !gadsKpis) return null;

        const filtered = catalogoData.rawData.filter((d: any) =>
            d.status?.toLowerCase().includes('complete') ||
            d.status?.toLowerCase().includes('completo') ||
            d.status?.toLowerCase().includes('pago') ||
            d.status?.toLowerCase().includes('enviado') ||
            d.status?.toLowerCase().includes('faturado') ||
            !d.status
        );

        // Google Ads attributed revenue
        const googleAdsOrders = filtered.filter((d: any) =>
            d.atribuicao?.toLowerCase().includes('google') ||
            d.midia?.toLowerCase().includes('google') ||
            d.origem?.toLowerCase().includes('google')
        );

        const receitaGoogleAds = googleAdsOrders.reduce((sum: number, d: any) => sum + (d.receitaProduto || 0), 0);

        // Revenue by Attribution
        const atribuicaoRevenue: { [key: string]: number } = {};
        filtered.forEach((d: any) => {
            const atrib = d.atribuicao || 'Não identificado';
            atribuicaoRevenue[atrib] = (atribuicaoRevenue[atrib] || 0) + (d.receitaProduto || 0);
        });
        const byAtribuicao = Object.entries(atribuicaoRevenue)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // Improved Normalization Helpers
        const normalizeCamp = (c: string) =>
            (c || '').toLowerCase().trim()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/^\[pmax\]\s*/, '')
                .replace(/^e_pmax_pla_/, '')
                .replace(/pmax/g, '')
                .replace(/[ \-_.\.]/g, ''); // Remove spaces, hyphens, underscores, AND dots

        const normalizeDate = (dStr: string) => {
            if (!dStr) return '';
            // Handle DD/MM/YYYY HH:MM:SS
            if (dStr.includes('/')) {
                const parts = dStr.split(' ')[0].split('/');
                if (parts.length === 3) {
                    const day = parts[0].padStart(2, '0');
                    const month = parts[1].padStart(2, '0');
                    const year = parts[2];
                    return `${year}-${month}-${day}`;
                }
            }
            return (dStr || '').split(' ')[0];
        };

        // Granular Category performance matching bd_mag.camp with google_ads.campaign on specific dates
        const spendByCampDay: { [key: string]: number } = {};
        if (gadsKpis.rawData) {
            gadsKpis.rawData.forEach((g: any) => {
                const day = normalizeDate(g.day);
                const camp = normalizeCamp(g.campaign);
                if (day && camp) {
                    const key = `${day}_${camp}`;
                    spendByCampDay[key] = (spendByCampDay[key] || 0) + (g.cost || 0);
                }
            });
        }

        const revenueByCampDayInMag: { [key: string]: number } = {};
        googleAdsOrders.forEach((o: any) => {
            const day = normalizeDate(o.data);
            const camp = normalizeCamp(o.campanha);
            if (day && camp) {
                const key = `${day}_${camp}`;
                revenueByCampDayInMag[key] = (revenueByCampDayInMag[key] || 0) + (o.receitaProduto || 0);
            }
        });

        const categoryStats: { [cat: string]: { receita: number; pedidos: number; investimento: number } } = {};
        googleAdsOrders.forEach((o: any) => {
            const cat = o.categoria?.split(',')[0]?.trim() || 'Outros';
            const day = normalizeDate(o.data);
            const camp = normalizeCamp(o.campanha);
            const key = `${day}_${camp}`;

            if (!categoryStats[cat]) categoryStats[cat] = { receita: 0, pedidos: 0, investimento: 0 };

            const orderRevenue = o.receitaProduto || 0;
            categoryStats[cat].receita += orderRevenue;
            categoryStats[cat].pedidos += 1;

            const campDayRevenue = revenueByCampDayInMag[key] || 0;
            const campDaySpend = spendByCampDay[key] || 0;

            // Attribute spend proportionally to revenue within the specific campaign and day
            if (campDayRevenue > 0) {
                const attributedSpend = (orderRevenue / campDayRevenue) * campDaySpend;
                categoryStats[cat].investimento += attributedSpend;
            }
        });

        const topCategoriesGads = Object.entries(categoryStats)
            .map(([name, data]) => ({
                name: name.length > 20 ? name.substring(0, 20) + '...' : name,
                ...data,
                roas: data.investimento > 0 ? data.receita / data.investimento : 0
            }))
            .sort((a, b) => b.receita - a.receita)
            .slice(0, 10); // Show top 10 as requested in context of rankings

        // Revenue per Campaign (Actual from Magento)
        const revenueByCampaign: { [name: string]: number } = {};
        googleAdsOrders.forEach((d: any) => {
            const campName = d.campanha?.toLowerCase().trim();
            if (campName) {
                revenueByCampaign[campName] = (revenueByCampaign[campName] || 0) + (d.receitaProduto || 0);
            }
        });

        // Campaign analysis with ACTUAL ROAS per campaign
        const campaignAnalysis = (gadsKpis.byCampaign || []).map((camp: any) => {
            const campName = camp.campaign?.toLowerCase().trim();
            const campaignRevenue = camp.conversionValue || 0;
            const campaignRoas = camp.spend > 0 ? campaignRevenue / camp.spend : 0;

            // Sessions from Cross Analysis (GA4)
            const ga4Camp = ga4Kpis?.campaignCrossAnalysis?.find((c: any) => c.campaign?.toLowerCase().trim() === campName);
            const sessions = ga4Camp?.sessions || 0;
            const costPerSession = sessions > 0 ? camp.spend / sessions : 0;

            return {
                ...camp,
                revenue: campaignRevenue,
                roas: campaignRoas,
                sessions,
                costPerSession,
                efficiency: camp.clicks > 0 ? (camp.conversions / camp.clicks * 100) : 0,
            };
        }).sort((a: any, b: any) => b.roas - a.roas);

        // Best and worst campaigns
        const bestCampaign = campaignAnalysis[0];
        const worstCampaign = campaignAnalysis.filter((c: any) => c.spend > 100).sort((a: any, b: any) => a.roas - b.roas)[0];

        // Investment Potential Analysis
        // Calculate averages for comparison
        const avgSpend = campaignAnalysis.reduce((sum: number, c: any) => sum + (c.spend || 0), 0) / (campaignAnalysis.length || 1);
        const avgRoas = campaignAnalysis.filter((c: any) => c.roas > 0).reduce((sum: number, c: any) => sum + c.roas, 0) / (campaignAnalysis.filter((c: any) => c.roas > 0).length || 1);
        const avgEfficiency = campaignAnalysis.filter((c: any) => c.efficiency > 0).reduce((sum: number, c: any) => sum + c.efficiency, 0) / (campaignAnalysis.filter((c: any) => c.efficiency > 0).length || 1);
        const avgCostPerSession = campaignAnalysis.filter((c: any) => c.costPerSession > 0).reduce((sum: number, c: any) => sum + c.costPerSession, 0) / (campaignAnalysis.filter((c: any) => c.costPerSession > 0).length || 1);

        // Calculate potential score for each campaign
        const investmentPotential = campaignAnalysis
            .filter((c: any) => c.spend > 50 && c.roas > 0) // Only campaigns with some spend and positive ROAS
            .map((camp: any) => {
                // Score components (0-100 each)
                const roasScore = Math.min((camp.roas / avgRoas) * 50, 100); // Higher ROAS = better
                const scaleRoom = camp.spend < avgSpend ? ((avgSpend - camp.spend) / avgSpend) * 100 : 0; // Lower spend = more room to scale
                const efficiencyScore = camp.efficiency > 0 ? Math.min((camp.efficiency / avgEfficiency) * 50, 100) : 0;
                const costEfficiencyScore = camp.costPerSession > 0 && avgCostPerSession > 0
                    ? Math.min(((avgCostPerSession / camp.costPerSession) * 50), 100)
                    : 50;

                // Weighted potential score
                const potentialScore = (
                    roasScore * 0.35 +          // ROAS weight: 35%
                    scaleRoom * 0.25 +          // Room to scale: 25%
                    efficiencyScore * 0.25 +    // Efficiency: 25%
                    costEfficiencyScore * 0.15  // Cost efficiency: 15%
                );

                // Determine recommendation
                let recommendation: 'escalar' | 'aumentar' | 'manter' | 'otimizar' = 'manter';
                let recommendationText = '';

                if (camp.roas >= avgRoas * 1.5 && camp.spend < avgSpend) {
                    recommendation = 'escalar';
                    recommendationText = 'ROAS excelente com investimento baixo. Alto potencial de escala.';
                } else if (camp.roas >= avgRoas && camp.spend < avgSpend * 0.7) {
                    recommendation = 'aumentar';
                    recommendationText = 'Performance sólida. Aumente gradualmente o investimento.';
                } else if (camp.roas >= avgRoas && camp.efficiency >= avgEfficiency) {
                    recommendation = 'manter';
                    recommendationText = 'Performance estável. Mantenha o investimento atual.';
                } else {
                    recommendation = 'otimizar';
                    recommendationText = 'Otimize antes de aumentar investimento.';
                }

                // Estimated additional revenue potential
                const additionalSpendPotential = Math.max(avgSpend - camp.spend, 0);
                const estimatedAdditionalRevenue = additionalSpendPotential * camp.roas;

                return {
                    ...camp,
                    potentialScore,
                    roasScore,
                    scaleRoom,
                    efficiencyScore,
                    recommendation,
                    recommendationText,
                    additionalSpendPotential,
                    estimatedAdditionalRevenue,
                    vsAvgRoas: ((camp.roas / avgRoas) - 1) * 100,
                    vsAvgSpend: ((camp.spend / avgSpend) - 1) * 100,
                };
            })
            .sort((a: any, b: any) => b.potentialScore - a.potentialScore)
            .slice(0, 10);

        // Daily performance
        const dailyMap: { [date: string]: { receita: number; custo: number } } = {};
        googleAdsOrders.forEach((d: any) => {
            let dateStr = '';
            if (d.data) {
                if (d.data.includes('/')) {
                    dateStr = d.data.split('/').reverse().join('-');
                } else {
                    dateStr = d.data.split(' ')[0];
                }
            }
            if (dateStr) {
                if (!dailyMap[dateStr]) dailyMap[dateStr] = { receita: 0, custo: 0 };
                dailyMap[dateStr].receita += d.receitaProduto || 0;
            }
        });

        // Add cost data
        gadsKpis.dailyData?.forEach((d: any) => {
            if (!dailyMap[d.date]) dailyMap[d.date] = { receita: 0, custo: 0 };
            dailyMap[d.date].custo = d.cost || 0;
        });

        const combinedDailyData = Object.entries(dailyMap)
            .map(([date, data]) => ({ date, receita: data.receita, custo: data.custo }))
            .filter(d => d.receita > 0 || d.custo > 0)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Dashboard Level ROAS (following exclusion logic from gadsKpis.spend)
        const roas = receitaGoogleAds > 0 && gadsKpis.spend > 0 ? receitaGoogleAds / gadsKpis.spend : 0;

        // Revenue by Campaign Type - for CampaignTypeBreakdown
        const revenueByTypeMap: { [type: string]: { revenue: number; orders: number } } = {};

        // Classify campaigns and aggregate revenue
        const classifyCampaign = (campaign: string): string => {
            const lower = (campaign || '').toLowerCase();
            if (lower.includes('visita')) return 'visita_loja';
            if (lower.includes('lead')) return 'search_leads';
            if (lower.includes('institucional') && !lower.includes('lead') && !lower.includes('visita')) return 'search_institucional';
            if (lower.includes('shopping')) return 'shopping';
            if (lower.includes('pmax') && !lower.includes('lead') && !lower.includes('visita')) return 'pmax_ecommerce';
            return 'outros';
        };

        // Calculate revenue per campaign type from Magento orders
        googleAdsOrders.forEach((d: any) => {
            const campanha = d.campanha || '';
            const type = classifyCampaign(campanha);
            if (!revenueByTypeMap[type]) revenueByTypeMap[type] = { revenue: 0, orders: 0 };
            revenueByTypeMap[type].revenue += d.receitaProduto || 0;
            revenueByTypeMap[type].orders += 1;
        });

        const revenueByType = Object.entries(revenueByTypeMap).map(([type, data]) => ({
            type,
            revenue: data.revenue,
            orders: data.orders
        }));

        return {
            receitaGoogleAds,
            googleAdsOrdersCount: googleAdsOrders.length,
            roas,
            byAtribuicao,
            topCategoriesGads,
            campaignAnalysis,
            bestCampaign,
            worstCampaign,
            combinedDailyData,
            investmentPotential,
            avgSpend,
            avgRoas,
            revenueByType,
        };
    }, [catalogoData, gadsKpis, ga4Kpis]);

    // Intelligent Insights
    const insights = useMemo(() => {
        if (!analytics || !gadsKpis) return [];

        const result: { type: 'alert' | 'success' | 'insight'; icon: any; title: string; description: string }[] = [];

        // ROAS Analysis
        if (analytics.roas < 2) {
            result.push({
                type: 'alert',
                icon: AlertTriangle,
                title: 'ROAS Abaixo do Ideal',
                description: `ROAS de ${analytics.roas.toFixed(2)}x. Para cada R$1, retorno de R$${analytics.roas.toFixed(2)}. Otimize campanhas.`
            });
        } else if (analytics.roas >= 4) {
            result.push({
                type: 'success',
                icon: CheckCircle,
                title: 'ROAS Excelente',
                description: `ROAS de ${analytics.roas.toFixed(2)}x. Campanhas rentáveis. Considere escalar!`
            });
        }

        // Best Campaign
        if (analytics.bestCampaign) {
            result.push({
                type: 'success',
                icon: Trophy,
                title: 'Campanha Campeã',
                description: `"${analytics.bestCampaign.campaign?.substring(0, 20)}..." tem melhor performance. Aumente o orçamento!`
            });
        }

        // Worst Campaign
        if (analytics.worstCampaign && analytics.worstCampaign.roas < 1) {
            result.push({
                type: 'alert',
                icon: XCircle,
                title: 'Campanha para Revisar',
                description: `"${analytics.worstCampaign.campaign?.substring(0, 20)}..." gasta R$${analytics.worstCampaign.spend?.toFixed(0)} com baixo retorno.`
            });
        }

        // Top Category Insight
        if (analytics.topCategoriesGads.length > 0) {
            const topCat = analytics.topCategoriesGads[0];
            result.push({
                type: 'insight',
                icon: Lightbulb,
                title: 'Categoria Mais Rentável',
                description: `"${topCat.name}" gera R$${(topCat.receita / 1000).toFixed(1)}k via Google Ads.`
            });
        }

        return result;
    }, [analytics, gadsKpis]);

    // Build KPIs for display - Original ones
    const kpis = gadsKpis ? [
        {
            id: 'impressoes',
            titulo: 'Impressões',
            valor: (gadsKpis.clicks || 0) * 15,
            valorFormatado: ((gadsKpis.clicks || 0) * 15).toLocaleString('pt-BR'),
            variacao: 12.5,
            tendencia: 'up' as const,
            sparklineData: [1, 1.05, 1.1, 1.12, 1.15],
        },
        {
            id: 'cliques',
            titulo: 'Cliques',
            valor: gadsKpis.clicks || 0,
            valorFormatado: (gadsKpis.clicks || 0).toLocaleString('pt-BR'),
            variacao: 3.5,
            tendencia: 'up' as const,
            sparklineData: [1, 1.01, 1.03, 1.04, 1.05],
        },
        {
            id: 'conversoes',
            titulo: 'Conversões',
            valor: gadsKpis.conversions || 0,
            valorFormatado: (gadsKpis.conversions || 0).toFixed(0),
            variacao: 5.2,
            tendencia: 'up' as const,
            sparklineData: [1, 1.02, 1.04, 1.05, 1.06],
        },
        {
            id: 'ctr',
            titulo: 'CTR',
            valor: gadsKpis.ctr || 0,
            valorFormatado: gadsKpis.ctr_formatted || '0%',
            variacao: -1.5,
            tendencia: 'down' as const,
            sparklineData: [1, 0.99, 0.98, 0.99, 0.98],
            unidade: '%',
        },
        {
            id: 'cpc',
            titulo: 'CPC',
            valor: gadsKpis.cpc || 0,
            valorFormatado: `R$ ${(gadsKpis.cpc || 0).toFixed(2)}`,
            variacao: -0.8,
            tendencia: 'stable' as const,
            sparklineData: [1, 1.0, 1.0, 1.0, 1.0],
            unidade: 'R$',
        },
        {
            id: 'engajamento',
            titulo: 'Engajamento (GA4)',
            valor: (ga4Kpis?.clickToSessionRate || 0) * 100,
            valorFormatado: `${((ga4Kpis?.clickToSessionRate || 0) * 100).toFixed(1)}%`,
            variacao: 0.1,
            tendencia: 'stable' as const,
            sparklineData: [1, 1.01, 1.02, 1, 1.01],
            unidade: '%',
        },
        {
            id: 'custo_sessao',
            titulo: 'Custo por Sessão',
            valor: ga4Kpis?.googleSessions > 0 ? (gadsKpis.spend / ga4Kpis.googleSessions) : 0,
            valorFormatado: `R$ ${(ga4Kpis?.googleSessions > 0 ? (gadsKpis.spend / ga4Kpis.googleSessions) : 0).toFixed(2)}`,
            variacao: -2.5,
            tendencia: 'up' as const,
            sparklineData: [1, 0.98, 0.97, 0.98, 0.96],
            unidade: 'R$',
        },
        {
            id: 'taxa_conv_pago',
            titulo: 'Taxa Conv. Ads (Final)',
            valor: gadsKpis.clicks > 0 ? (analytics?.googleAdsOrdersCount / gadsKpis.clicks) * 100 : 0,
            valorFormatado: `${(gadsKpis.clicks > 0 ? (analytics?.googleAdsOrdersCount / gadsKpis.clicks) * 100 : 0).toFixed(2)}%`,
            variacao: 1.2,
            tendencia: 'up' as const,
            sparklineData: [1, 1.01, 1.02, 1.03, 1.04],
            unidade: '%',
        },
    ] : [];

    // Attribution chart data
    const atribuicaoData = analytics?.byAtribuicao?.slice(0, 6).map((item: any, index: number) => ({
        ...item,
        color: COLORS[index % COLORS.length]
    })) || [];

    // ROAS for display
    const roas = analytics?.roas || 0;
    const receitaGoogleAds = analytics?.receitaGoogleAds || 0;

    return (
        <div className="space-y-6">
            <PageFilters
                title="Mídia Paga"
                description="Performance de Google Ads • Dados do BD GAds e BD Mag"
            />

            {loading && (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}

            {/* Intelligent Insights */}
            {!loading && insights.length > 0 && (
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {insights.map((insight, i) => {
                        const Icon = insight.icon;
                        const bgColor = insight.type === 'alert' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                            insight.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                                'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
                        const iconColor = insight.type === 'alert' ? 'text-red-500' :
                            insight.type === 'success' ? 'text-green-500' : 'text-blue-500';

                        return (
                            <Card key={i} className={`${bgColor} border`}>
                                <CardContent className="pt-4">
                                    <div className="flex items-start gap-3">
                                        <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                                        <div>
                                            <p className="font-medium text-sm">{insight.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </section>
            )}

            {/* Intelligent Analysis (Moved from Home) */}
            {!loading && catalogoData?.rawData && (
                <section>
                    <IntelligentAnalysis
                        data={catalogoData.rawData}
                        gadsKpis={gadsKpis}
                        ga4Kpis={ga4Kpis}
                    />
                </section>
            )}

            {/* Receita por Categoria + ROAS (Moved from Home) */}
            {!loading && analytics?.topCategoriesGads && analytics.topCategoriesGads.length > 0 && (
                <section>
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">Receita por Categoria + ROAS (Google Ads)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(() => {
                                const totalRevenue = analytics.receitaGoogleAds || 1;

                                // Enriched with share for table display
                                const enrichedCats = analytics.topCategoriesGads.map((cat: any) => ({
                                    ...cat,
                                    share: (cat.receita / totalRevenue) * 100
                                }));

                                return (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                                                    <th className="text-left py-3 px-2 font-bold">Categoria</th>
                                                    <th className="text-right py-3 px-2 font-bold">Receita (GAds)</th>
                                                    <th className="text-right py-3 px-2 font-bold">% Share</th>
                                                    <th className="text-right py-3 px-2 font-bold">Invest. Est.</th>
                                                    <th className="text-right py-3 px-2 font-bold">ROAS Est.</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {enrichedCats.map((cat: any, index: number) => (
                                                    <tr key={index} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                                                        <td className="py-3 px-2 font-semibold text-zinc-700 dark:text-zinc-300">{cat.name}</td>
                                                        <td className="text-right py-3 px-2 font-mono font-medium">
                                                            R$ {cat.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="text-right py-3 px-2 text-muted-foreground text-xs">
                                                            {cat.share.toFixed(1)}%
                                                        </td>
                                                        <td className="text-right py-3 px-2 font-mono text-muted-foreground text-xs">
                                                            R$ {cat.investimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="text-right py-3 px-2">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${cat.roas >= 3 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                                cat.roas >= 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                                    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                                }`}>
                                                                {cat.roas.toFixed(2)}x
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <p className="text-[10px] text-muted-foreground mt-4 italic">
                                            * ROAS calculado via atribuição direta: cruzamento de Campanha e Data entre Magento (bd_mag) e Google Ads.
                                        </p>
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Investimento Ads Segmentado - Leads vs Ecommerce */}
            {!loading && gadsKpis?.segmented && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Investimento em Ads por Tipo
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Leads */}
                        <Card className="border-border bg-card">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Target className="h-5 w-5 text-blue-500" />
                                        <span className="font-medium">Investimento Leads</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        Meta: R$ {gadsKpis.segmented.leads.meta.toLocaleString('pt-BR')}
                                    </span>
                                </div>
                                <div className="text-2xl font-bold mb-2">
                                    {gadsKpis.segmented.leads.spend_formatted}
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-zinc-700 rounded-full h-2.5">
                                    <div
                                        className={`h-2.5 rounded-full transition-all ${gadsKpis.segmented.leads.percentMeta > 100
                                            ? 'bg-red-500'
                                            : gadsKpis.segmented.leads.percentMeta > 80
                                                ? 'bg-yellow-500'
                                                : 'bg-blue-500'
                                            }`}
                                        style={{ width: `${Math.min(gadsKpis.segmented.leads.percentMeta, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                                    <span>{gadsKpis.segmented.leads.percentMeta.toFixed(1)}% da meta</span>
                                    <span>{gadsKpis.segmented.leads.conversions.toFixed(0)} Leads</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Ecommerce */}
                        <Card className="border-border bg-card">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <ShoppingCart className="h-5 w-5 text-purple-500" />
                                        <span className="font-medium">Investimento Ecommerce</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        Meta: R$ {gadsKpis.segmented.ecommerce.meta.toLocaleString('pt-BR')}
                                    </span>
                                </div>
                                <div className="text-2xl font-bold mb-2">
                                    {gadsKpis.segmented.ecommerce.spend_formatted}
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-zinc-700 rounded-full h-2.5">
                                    <div
                                        className={`h-2.5 rounded-full transition-all ${gadsKpis.segmented.ecommerce.percentMeta > 100
                                            ? 'bg-red-500'
                                            : gadsKpis.segmented.ecommerce.percentMeta > 80
                                                ? 'bg-yellow-500'
                                                : 'bg-purple-500'
                                            }`}
                                        style={{ width: `${Math.min(gadsKpis.segmented.ecommerce.percentMeta, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between mt-1 text-xs text-muted-foreground mb-4">
                                    <span>{gadsKpis.segmented.ecommerce.percentMeta.toFixed(1)}% da meta</span>
                                    <span>{gadsKpis.segmented.ecommerce.conversions.toFixed(0)} Compras</span>
                                </div>

                                {/* Mini ROAS Chart */}
                                {roas > 0 && (
                                    <div className="mt-4 pt-4 border-t border-border/50">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium text-muted-foreground">ROAS (Ecommerce)</span>
                                            <span className={`text-sm font-bold ${roas >= 4 ? 'text-emerald-500' : roas >= 2 ? 'text-blue-500' : 'text-amber-500'}`}>
                                                {roas.toFixed(2)}x
                                            </span>
                                        </div>
                                        <div className="h-10 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={[
                                                    { v: roas * 0.8 }, { v: roas * 0.9 }, { v: roas * 0.85 }, { v: roas * 0.95 }, { v: roas * 0.9 }, { v: roas }
                                                ]}>
                                                    <defs>
                                                        <linearGradient id="colorRoasMini" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={roas >= 4 ? '#10b981' : '#3b82f6'} stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor={roas >= 4 ? '#10b981' : '#3b82f6'} stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <Area
                                                        type="monotone"
                                                        dataKey="v"
                                                        stroke={roas >= 4 ? '#10b981' : '#3b82f6'}
                                                        fill="url(#colorRoasMini)"
                                                        strokeWidth={2}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </section>
            )}

            {/* Investment Potential Analysis */}
            {!loading && analytics?.investmentPotential && analytics.investmentPotential.length > 0 && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Rocket className="h-4 w-4 text-amber-500" />
                        Oportunidades de Investimento
                    </h2>
                    <Card className="border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-900/10 dark:to-orange-900/10">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-amber-500" />
                                    <CardTitle className="text-sm font-medium">Campanhas com Maior Potencial para Escalar</CardTitle>
                                </div>
                                <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400">
                                    Análise Preditiva
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Baseado em ROAS, eficiência de conversão, custo por sessão e espaço para escala
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {analytics.investmentPotential.slice(0, 5).map((camp: any, index: number) => {
                                    const badgeColor = camp.recommendation === 'escalar'
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                        : camp.recommendation === 'aumentar'
                                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                            : camp.recommendation === 'manter'
                                                ? 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30'
                                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';

                                    const badgeText = camp.recommendation === 'escalar' ? 'Escalar'
                                        : camp.recommendation === 'aumentar' ? 'Aumentar'
                                            : camp.recommendation === 'manter' ? 'Manter'
                                                : 'Otimizar';

                                    return (
                                        <div
                                            key={index}
                                            className="group relative p-4 rounded-xl bg-white/80 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 hover:shadow-lg hover:border-amber-300/50 dark:hover:border-amber-700/50 transition-all duration-300"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
                                                            {index + 1}
                                                        </span>
                                                        <h4 className="font-medium text-sm truncate" title={camp.campaign}>
                                                            {camp.campaign?.length > 40 ? camp.campaign.substring(0, 40) + '...' : camp.campaign}
                                                        </h4>
                                                        <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5", badgeColor)}>
                                                            {badgeText}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mb-3">{camp.recommendationText}</p>

                                                    {/* Metrics Grid */}
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                                        <div className="space-y-1">
                                                            <span className="text-muted-foreground">ROAS Atual</span>
                                                            <div className="flex items-center gap-1">
                                                                <span className={cn("font-bold", camp.roas >= (analytics.avgRoas || 1) ? "text-emerald-600" : "text-zinc-600")}>
                                                                    {camp.roas.toFixed(2)}x
                                                                </span>
                                                                {camp.vsAvgRoas > 0 && (
                                                                    <span className="text-emerald-500 text-[10px]">+{camp.vsAvgRoas.toFixed(0)}%</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-muted-foreground">Investimento</span>
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-bold">R$ {(camp.spend / 1000).toFixed(1)}k</span>
                                                                {camp.vsAvgSpend < 0 && (
                                                                    <span className="text-blue-500 text-[10px]">{camp.vsAvgSpend.toFixed(0)}%</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-muted-foreground">Eficiência</span>
                                                            <span className="font-bold">{camp.efficiency.toFixed(2)}%</span>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-muted-foreground">Potencial</span>
                                                            <div className="flex items-center gap-1">
                                                                <div className="w-16 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={cn(
                                                                            "h-full rounded-full transition-all",
                                                                            camp.potentialScore >= 70 ? "bg-emerald-500" :
                                                                                camp.potentialScore >= 50 ? "bg-amber-500" : "bg-zinc-400"
                                                                        )}
                                                                        style={{ width: `${Math.min(camp.potentialScore, 100)}%` }}
                                                                    />
                                                                </div>
                                                                <span className="font-bold text-[10px]">{camp.potentialScore.toFixed(0)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Potential Revenue Card */}
                                                {camp.estimatedAdditionalRevenue > 0 && camp.recommendation !== 'otimizar' && (
                                                    <div className="hidden sm:flex flex-col items-end justify-center p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200/50 dark:border-emerald-800/30 min-w-[140px]">
                                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Receita Potencial</span>
                                                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                            <ArrowUpRight className="h-4 w-4" />
                                                            R$ {(camp.estimatedAdditionalRevenue / 1000).toFixed(1)}k
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            +R$ {(camp.additionalSpendPotential / 1000).toFixed(1)}k invest.
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Summary Stats */}
                            <div className="mt-6 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                                    <div>
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Campanhas p/ Escalar</span>
                                        <p className="text-xl font-bold text-emerald-600">
                                            {analytics.investmentPotential.filter((c: any) => c.recommendation === 'escalar').length}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Campanhas p/ Aumentar</span>
                                        <p className="text-xl font-bold text-blue-600">
                                            {analytics.investmentPotential.filter((c: any) => c.recommendation === 'aumentar').length}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">ROAS Médio</span>
                                        <p className="text-xl font-bold">{(analytics.avgRoas || 0).toFixed(2)}x</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Receita Potencial Total</span>
                                        <p className="text-xl font-bold text-emerald-600">
                                            R$ {(analytics.investmentPotential
                                                .filter((c: any) => c.recommendation === 'escalar' || c.recommendation === 'aumentar')
                                                .reduce((sum: number, c: any) => sum + (c.estimatedAdditionalRevenue || 0), 0) / 1000).toFixed(0)}k
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* KPIs de Mídia */}
            {!loading && (
                <section>
                    <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
                        <div className="h-px w-8 bg-zinc-200 dark:bg-zinc-800" />
                        Status da Operação Google Ads
                    </h2>

                    <div className="space-y-4">
                        {/* Top row - 4 items */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {/* ROAS Card - Specialized */}
                            <Card className="group relative overflow-hidden transition-all duration-300 border border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1">
                                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 blur-3xl transition-all group-hover:opacity-20 bg-emerald-500" />
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500 mb-1">ROAS (Retorno)</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-black tracking-tight text-zinc-900 dark:text-white leading-none text-3xl">{roas.toFixed(2)}x</span>
                                            </div>
                                        </div>
                                        <div className={cn("rounded-full px-2 py-1 text-[10px] font-bold flex items-center gap-1 shadow-sm", roas >= 1.5 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                                            {roas >= 1.5 ? 'Positivo' : 'Atenção'}
                                        </div>
                                    </div>
                                    <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-3">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((roas / 3) * 100, 100)}%` }} />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Rec. Atribuída: R$ {receitaGoogleAds.toLocaleString('pt-BR')}</p>
                                </CardContent>
                            </Card>

                            {kpis.filter(k => ['impressoes', 'cliques', 'conversoes'].includes(k.id)).map((kpi) => (
                                <KPICard key={kpi.id} data={kpi} />
                            ))}
                        </div>

                        {/* Bottom row - 4 items */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {kpis.filter(k => ['ctr', 'cpc', 'cpm', 'engajamento'].includes(k.id)).map((kpi) => (
                                <KPICard key={kpi.id} data={kpi} invertedVariation={['cpc', 'cpm'].includes(kpi.id)} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Campaign Type Breakdown - Interactive */}
            {!loading && gadsKpis?.byCampaignType && gadsKpis.byCampaignType.length > 0 && (
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Campanhas por Tipo
                    </h2>
                    <CampaignTypeBreakdown
                        byCampaignType={gadsKpis.byCampaignType}
                        byCampaign={analytics?.campaignAnalysis || []}
                        revenueByType={analytics?.revenueByType || []}
                    />
                </section>
            )}

            {/* Timeline Chart */}
            {!loading && analytics?.combinedDailyData && analytics.combinedDailyData.length > 0 && (
                <section>
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">Evolução: Investimento vs Receita (Google Ads)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <AreaChart data={analytics.combinedDailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCusto" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(val) => {
                                        if (typeof val === 'string' && val.includes('-')) {
                                            const parts = val.split('-');
                                            if (parts.length >= 3) return `${parts[2]}/${parts[1]}`;
                                        }
                                        return val;
                                    }} />
                                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        formatter={(value: any, name: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, name === 'receita' ? 'Receita GAds' : 'Investimento']}
                                        labelFormatter={(label) => {
                                            const date = new Date(label + 'T12:00:00');
                                            return date.toLocaleDateString('pt-BR');
                                        }}
                                        contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="receita" name="Receita GAds" stroke="#10b981" fillOpacity={1} fill="url(#colorReceita)" />
                                    <Area type="monotone" dataKey="custo" name="Investimento" stroke="#ef4444" fillOpacity={1} fill="url(#colorCusto)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Revenue by Atribuição & Top Campaigns */}
            {!loading && (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                    <Card className="border-border bg-card h-full">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium text-card-foreground">Receita por Canal de Origem</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={atribuicaoData} layout="vertical" margin={{ left: 10, right: 60, top: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} stroke="var(--muted-foreground)" fontSize={11} />
                                    <YAxis type="category" dataKey="name" width={100} stroke="var(--muted-foreground)" fontSize={11} tick={{ fill: 'var(--muted-foreground)' }} />
                                    <Tooltip formatter={(value: any) => [`R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                    <Bar dataKey="value" name="Receita" radius={[0, 6, 6, 0]} >
                                        {atribuicaoData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                        <LabelList dataKey="value" position="right" formatter={(val: any) => `R$ ${(Number(val) / 1000).toFixed(1)}k`} style={{ fill: 'var(--muted-foreground)', fontSize: '11px' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-foreground">Top 5 Campanhas (Receita Estimada)</CardTitle>
                            <p className="text-xs text-muted-foreground">Campanhas com maior receita atribuída</p>
                        </CardHeader>
                        <CardContent>
                            {analytics?.campaignAnalysis && analytics.campaignAnalysis.length > 0 ? (
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart
                                        data={analytics.campaignAnalysis
                                            .map((camp: any) => ({
                                                ...camp,
                                                receitaEstimada: camp.spend * camp.roas
                                            }))
                                            .sort((a: any, b: any) => b.receitaEstimada - a.receitaEstimada)
                                            .slice(0, 5)
                                        }
                                        layout="vertical"
                                        margin={{ left: 10, right: 60, top: 10, bottom: 10 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                        <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} stroke="var(--muted-foreground)" fontSize={11} />
                                        <YAxis type="category" dataKey="campaign" width={140} stroke="var(--muted-foreground)" fontSize={10} tick={{ fill: 'var(--muted-foreground)' }} tickFormatter={(val) => val.length > 20 ? val.substring(0, 20) + '...' : val} />
                                        <Tooltip formatter={(value: any) => [`R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita Est.']} labelStyle={{ color: 'black' }} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                        <Bar dataKey="receitaEstimada" name="Receita Est." radius={[0, 6, 6, 0]} fill="#10b981">
                                            <LabelList dataKey="receitaEstimada" position="right" formatter={(val: any) => `R$ ${(Number(val) / 1000).toFixed(1)}k`} style={{ fill: 'var(--muted-foreground)', fontSize: '11px' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">
                                    Nenhum dado de campanha disponível.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Campaign ROAS Ranking - New Analysis */}
            {!loading && analytics && analytics.campaignAnalysis.length > 0 && (
                <section>
                    <CampaignRankingTable campaigns={analytics.campaignAnalysis} />
                </section>
            )}

            {/* Cross-Analysis GA4 vs Google Ads */}
            {!loading && ga4Kpis?.campaignCrossAnalysis && ga4Kpis.campaignCrossAnalysis.length > 0 && (
                <section className="pb-10">
                    <CampaignCrossAnalysisTable data={ga4Kpis.campaignCrossAnalysis} />

                    <Card className="border-border bg-card mt-6">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-foreground">Visualização de Funil por Campanha</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ga4Kpis.campaignCrossAnalysis.slice(0, 8)} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                        <XAxis dataKey="campaign" stroke="var(--muted-foreground)" fontSize={10} tickFormatter={v => v.length > 15 ? v.substring(0, 15) + '...' : v} />
                                        <YAxis yAxisId="left" stroke="var(--muted-foreground)" fontSize={11} name="Sessões" />
                                        <YAxis yAxisId="right" orientation="right" stroke="var(--muted-foreground)" fontSize={11} name="Custo" tickFormatter={v => `R$${v}`} />
                                        <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="sessions" name="Sessões (GA4)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                        <Bar yAxisId="right" dataKey="cost" name="Investimento (GAds)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            )}
        </div>
    );
}
