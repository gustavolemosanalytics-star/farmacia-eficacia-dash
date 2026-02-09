'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Lightbulb,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Target,
    DollarSign,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles,
    BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightData {
    type: 'opportunity' | 'warning' | 'trend' | 'recommendation';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    metric?: string;
    impact?: string;
}

interface ExecutiveInsightsProps {
    catalogoData: any;
    gadsKpis: any;
    ga4Kpis?: any;
}

export function ExecutiveInsights({ catalogoData, gadsKpis, ga4Kpis }: ExecutiveInsightsProps) {
    const [selectedInsight, setSelectedInsight] = useState<InsightData | null>(null);

    const insights = useMemo(() => {
        const generatedInsights: InsightData[] = [];

        if (!catalogoData?.rawData || !gadsKpis) return generatedInsights;

        // ========================================
        // 1. ANÁLISE DE PRODUTOS POR PERFORMANCE
        // ========================================
        const productAnalysis: {
            [key: string]: {
                nome: string;
                receita: number;
                pedidos: number;
                categoria: string;
            }
        } = {};

        catalogoData.rawData.forEach((d: any) => {
            const nome = d.nomeProduto;
            if (!nome) return;

            if (!productAnalysis[nome]) {
                productAnalysis[nome] = {
                    nome,
                    receita: 0,
                    pedidos: 0,
                    categoria: d.categoria || 'Sem categoria'
                };
            }
            productAnalysis[nome].receita += d.receitaProduto || 0;
            productAnalysis[nome].pedidos += 1;
        });

        const products = Object.values(productAnalysis).sort((a, b) => b.receita - a.receita);
        const totalReceita = products.reduce((sum, p) => sum + p.receita, 0);

        // Top 20% produtos (responsáveis pela maior parte da receita)
        const top20Percent = Math.ceil(products.length * 0.2);
        const topProducts = products.slice(0, top20Percent);
        const topProductsRevenue = topProducts.reduce((sum, p) => sum + p.receita, 0);
        const topProductsShare = totalReceita > 0 ? (topProductsRevenue / totalReceita) * 100 : 0;

        // Bottom produtos (baixa performance)
        const bottomProducts = products.slice(-Math.ceil(products.length * 0.3));
        const bottomProductsRevenue = bottomProducts.reduce((sum, p) => sum + p.receita, 0);
        const bottomProductsShare = totalReceita > 0 ? (bottomProductsRevenue / totalReceita) * 100 : 0;

        // ========================================
        // 2. ANÁLISE DE CATEGORIAS
        // ========================================
        const categoryAnalysis: {
            [key: string]: {
                receita: number;
                pedidos: number;
                ticketMedio: number;
            }
        } = {};

        catalogoData.rawData.forEach((d: any) => {
            const cat = d.categoria || 'Sem categoria';
            if (!categoryAnalysis[cat]) {
                categoryAnalysis[cat] = { receita: 0, pedidos: 0, ticketMedio: 0 };
            }
            categoryAnalysis[cat].receita += d.receitaProduto || 0;
            categoryAnalysis[cat].pedidos += 1;
        });

        const categories = Object.entries(categoryAnalysis)
            .map(([name, data]) => ({
                name,
                ...data,
                ticketMedio: data.pedidos > 0 ? data.receita / data.pedidos : 0
            }))
            .sort((a, b) => b.receita - a.receita);

        // ========================================
        // 3. ANÁLISE DE ROAS E EFICIÊNCIA
        // ========================================
        const roas = gadsKpis?.roas || 0;

        // ========================================
        // 4. ANÁLISE DE TENDÊNCIAS (Últimos 7 dias vs anterior)
        // ========================================
        const dailyRevenue = catalogoData?.dailyRevenue || [];
        if (dailyRevenue.length >= 14) {
            const last7 = dailyRevenue.slice(-7);
            const previous7 = dailyRevenue.slice(-14, -7);

            const last7Revenue = last7.reduce((sum: number, d: any) => sum + (d.receita || 0), 0);
            const previous7Revenue = previous7.reduce((sum: number, d: any) => sum + (d.receita || 0), 0);
            const revenueGrowth = previous7Revenue > 0 ? ((last7Revenue - previous7Revenue) / previous7Revenue) * 100 : 0;

            if (Math.abs(revenueGrowth) > 10) {
                generatedInsights.push({
                    type: revenueGrowth > 0 ? 'trend' : 'warning',
                    priority: Math.abs(revenueGrowth) > 20 ? 'high' : 'medium',
                    title: revenueGrowth > 0 ? 'Tendência de Crescimento' : 'Tendência de Queda',
                    description: revenueGrowth > 0
                        ? `A receita dos últimos 7 dias cresceu ${revenueGrowth.toFixed(1)}% em relação à semana anterior. Aproveite o momento para intensificar campanhas.`
                        : `A receita dos últimos 7 dias caiu ${Math.abs(revenueGrowth).toFixed(1)}% em relação à semana anterior. Recomenda-se revisar campanhas e ofertas.`,
                    metric: `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`,
                    impact: `R$ ${Math.abs(last7Revenue - previous7Revenue).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
                });
            }
        }

        // ========================================
        // 5. INSIGHT: CONCENTRAÇÃO DE RECEITA
        // ========================================
        if (topProductsShare > 70) {
            generatedInsights.push({
                type: 'warning',
                priority: 'medium',
                title: 'Alta Concentração de Receita',
                description: `${top20Percent} produtos (20% do catálogo) representam ${topProductsShare.toFixed(0)}% da receita. Considere diversificar o portfólio para reduzir riscos.`,
                metric: `${topProductsShare.toFixed(0)}%`,
                impact: `R$ ${topProductsRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
            });
        }

        // ========================================
        // 6. INSIGHT: PRODUTOS COM POTENCIAL
        // ========================================
        const midRangeProducts = products.slice(top20Percent, Math.ceil(products.length * 0.5));
        const highTicketMidRange = midRangeProducts.filter(p => {
            const avgTicket = p.pedidos > 0 ? p.receita / p.pedidos : 0;
            return avgTicket > (catalogoData?.ticketMedio || 0) * 1.2;
        });

        if (highTicketMidRange.length > 0) {
            generatedInsights.push({
                type: 'opportunity',
                priority: 'high',
                title: 'Produtos com Alto Potencial',
                description: `Identificados ${highTicketMidRange.length} produtos com ticket médio acima da média que podem ser promovidos na mídia paga para aumentar receita.`,
                metric: `${highTicketMidRange.length} produtos`,
                impact: `Ticket +${((highTicketMidRange[0]?.receita / (highTicketMidRange[0]?.pedidos || 1)) / (catalogoData?.ticketMedio || 1) * 100 - 100).toFixed(0)}% acima`
            });
        }

        // ========================================
        // 7. INSIGHT: EFICIÊNCIA DE MÍDIA
        // ========================================
        if (roas > 0) {
            if (roas < 2) {
                generatedInsights.push({
                    type: 'warning',
                    priority: 'high',
                    title: 'ROAS Abaixo do Ideal',
                    description: `O ROAS atual é de ${roas.toFixed(2)}x. Para operações saudáveis, recomenda-se ROAS mínimo de 3x. Revise campanhas de baixo desempenho.`,
                    metric: `${roas.toFixed(2)}x`,
                    impact: `Ideal: 3x ou mais`
                });
            } else if (roas >= 4) {
                generatedInsights.push({
                    type: 'opportunity',
                    priority: 'high',
                    title: 'ROAS Excelente - Escalar',
                    description: `O ROAS atual de ${roas.toFixed(2)}x está excelente. Considere aumentar o investimento em mídia para escalar resultados mantendo a eficiência.`,
                    metric: `${roas.toFixed(2)}x`,
                    impact: `Potencial de escala alto`
                });
            }
        }

        // ========================================
        // 8. INSIGHT: CATEGORIAS SUBEXPLORADAS
        // ========================================
        const avgCategoryRevenue = categories.reduce((sum, c) => sum + c.receita, 0) / categories.length;
        const underperformingCategories = categories.filter(c =>
            c.receita < avgCategoryRevenue * 0.5 && c.ticketMedio > (catalogoData?.ticketMedio || 0)
        );

        if (underperformingCategories.length > 0) {
            generatedInsights.push({
                type: 'opportunity',
                priority: 'medium',
                title: 'Categorias Subexploradas',
                description: `${underperformingCategories.length} categorias têm ticket médio alto mas baixo volume. "${underperformingCategories[0]?.name}" pode ser uma oportunidade de crescimento.`,
                metric: `${underperformingCategories.length} categorias`,
                impact: `Ticket médio: R$ ${underperformingCategories[0]?.ticketMedio.toFixed(0)}`
            });
        }

        // ========================================
        // 9. INSIGHT: CUSTO POR CONVERSÃO
        // ========================================
        const cpa = gadsKpis?.costPerConversion || 0;
        const ticketMedio = catalogoData?.ticketMedio || 0;

        if (cpa > 0 && ticketMedio > 0) {
            const cpaToTicketRatio = (cpa / ticketMedio) * 100;

            if (cpaToTicketRatio > 30) {
                generatedInsights.push({
                    type: 'warning',
                    priority: 'high',
                    title: 'CPA Alto vs Ticket Médio',
                    description: `O custo por aquisição (R$ ${cpa.toFixed(2)}) representa ${cpaToTicketRatio.toFixed(0)}% do ticket médio. Otimize campanhas para melhorar margem.`,
                    metric: `${cpaToTicketRatio.toFixed(0)}%`,
                    impact: `CPA: R$ ${cpa.toFixed(2)}`
                });
            }
        }

        // ========================================
        // 10. INSIGHT: BEST SELLERS RECOMENDADOS
        // ========================================
        const topSellingProducts = products.slice(0, 5);
        if (topSellingProducts.length > 0) {
            generatedInsights.push({
                type: 'recommendation',
                priority: 'medium',
                title: 'Foco em Mídia Paga',
                description: `Recomenda-se priorizar os top 5 produtos em campanhas: ${topSellingProducts.slice(0, 3).map(p => p.nome.substring(0, 20)).join(', ')}... Representam os maiores geradores de receita.`,
                metric: `Top 5`,
                impact: `R$ ${topSellingProducts.reduce((s, p) => s + p.receita, 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
            });
        }

        // ========================================
        // 11. INSIGHT: TAXA DE CONVERSÃO
        // ========================================
        if (ga4Kpis) {
            const sessions = ga4Kpis?.googleSessions || 0;
            const pedidos = catalogoData?.totalPedidos || 0;
            const convRate = sessions > 0 ? (pedidos / sessions) * 100 : 0;

            if (convRate < 2) {
                generatedInsights.push({
                    type: 'warning',
                    priority: 'medium',
                    title: 'Taxa de Conversão Baixa',
                    description: `A taxa de conversão de ${convRate.toFixed(2)}% está abaixo do benchmark de 3%. Revise a experiência do site, checkout e ofertas.`,
                    metric: `${convRate.toFixed(2)}%`,
                    impact: `Benchmark: 3%+`
                });
            }
        }

        // Sort by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return generatedInsights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    }, [catalogoData, gadsKpis, ga4Kpis]);

    const getIcon = (type: InsightData['type']) => {
        switch (type) {
            case 'opportunity': return <Target className="h-4 w-4" />;
            case 'warning': return <AlertTriangle className="h-4 w-4" />;
            case 'trend': return <TrendingUp className="h-4 w-4" />;
            case 'recommendation': return <Lightbulb className="h-4 w-4" />;
            default: return <Sparkles className="h-4 w-4" />;
        }
    };

    const getTypeStyles = (type: InsightData['type'], priority: InsightData['priority']) => {
        const base = {
            opportunity: {
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/20',
                icon: 'text-emerald-500',
                badge: 'bg-emerald-500/20 text-emerald-600'
            },
            warning: {
                bg: priority === 'high' ? 'bg-red-500/10' : 'bg-amber-500/10',
                border: priority === 'high' ? 'border-red-500/20' : 'border-amber-500/20',
                icon: priority === 'high' ? 'text-red-500' : 'text-amber-500',
                badge: priority === 'high' ? 'bg-red-500/20 text-red-600' : 'bg-amber-500/20 text-amber-600'
            },
            trend: {
                bg: 'bg-blue-500/10',
                border: 'border-blue-500/20',
                icon: 'text-blue-500',
                badge: 'bg-blue-500/20 text-blue-600'
            },
            recommendation: {
                bg: 'bg-violet-500/10',
                border: 'border-violet-500/20',
                icon: 'text-violet-500',
                badge: 'bg-violet-500/20 text-violet-600'
            }
        };
        return base[type];
    };

    if (insights.length === 0) return null;

    return (
        <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Sparkles className="h-5 w-5 text-violet-500" />
                <div>
                    <CardTitle className="text-sm font-bold">Insights Inteligentes</CardTitle>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Análise automatizada dos seus dados
                    </p>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {insights.slice(0, 6).map((insight, idx) => {
                    const styles = getTypeStyles(insight.type, insight.priority);
                    return (
                        <div
                            key={idx}
                            className={cn(
                                "p-4 rounded-xl border transition-all hover:scale-[1.01] cursor-pointer",
                                styles.bg,
                                styles.border
                            )}
                            onClick={() => setSelectedInsight(insight)}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1">
                                    <div className={cn("p-2 rounded-lg", styles.bg, styles.icon)}>
                                        {getIcon(insight.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-sm text-foreground">{insight.title}</h4>
                                            {insight.priority === 'high' && (
                                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-600">
                                                    Prioridade Alta
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {insight.description}
                                        </p>
                                    </div>
                                </div>
                                {insight.metric && (
                                    <div className="text-right shrink-0">
                                        <p className={cn("text-lg font-black", styles.icon)}>{insight.metric}</p>
                                        {insight.impact && (
                                            <p className="text-[10px] text-muted-foreground">{insight.impact}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </CardContent>

            <Dialog open={!!selectedInsight} onOpenChange={(open) => !open && setSelectedInsight(null)}>
                {selectedInsight && (
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={cn("p-2 rounded-lg", getTypeStyles(selectedInsight.type, selectedInsight.priority).bg, getTypeStyles(selectedInsight.type, selectedInsight.priority).icon)}>
                                    {getIcon(selectedInsight.type)}
                                </div>
                                <DialogTitle>{selectedInsight.title}</DialogTitle>
                            </div>
                            <DialogDescription className="text-base leading-relaxed pt-2">
                                {selectedInsight.description}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-4 grid grid-cols-2 gap-4">
                            {selectedInsight.metric && (
                                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Métrica Chave</p>
                                    <p className={cn("text-2xl font-black", getTypeStyles(selectedInsight.type, selectedInsight.priority).icon)}>
                                        {selectedInsight.metric}
                                    </p>
                                </div>
                            )}
                            {selectedInsight.impact && (
                                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Impacto/Referência</p>
                                    <p className="text-lg font-bold text-foreground">
                                        {selectedInsight.impact}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 p-4 rounded-lg border border-dashed border-primary/20 bg-primary/5">
                            <h5 className="text-sm font-bold flex items-center gap-2 mb-2">
                                <Lightbulb className="h-4 w-4 text-primary" />
                                Recomendação Executiva
                            </h5>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Com base nos dados analisados, recomendamos uma revisão imediata desta métrica para garantir que os objetivos de negócio sejam atingidos. Nossos modelos indicam que otimizações nesta área podem resultar em melhorias significativas na eficiência global da operação.
                            </p>
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </Card>
    );
}
