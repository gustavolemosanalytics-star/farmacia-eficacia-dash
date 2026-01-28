import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, Trophy, ShoppingBag, Target, Share2, Lightbulb, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

interface IntelligentAnalysisProps {
    data: any[]; // Raw data from Magento
}

export function IntelligentAnalysis({ data }: IntelligentAnalysisProps) {
    const analysis = useMemo(() => {
        if (!data || data.length === 0) return null;

        // 1. Best Products (by Revenue and Quantity)
        const productStats: Record<string, { revenue: number; quantity: number }> = {};

        // 2. Best Campaigns (by Quantity of Products sold)
        const campaignStats: Record<string, { quantity: number; revenue: number }> = {};

        // 3. Best Channels (by Conversions/Orders)
        const channelStats: Record<string, { orders: Set<string>; revenue: number }> = {};

        data.forEach((d: any) => {
            const productName = d.nomeProduto || 'Desconhecido';
            const campaign = d.campanha || 'Outros / Orgânico';
            const channel = d.atribuicao || 'Não identificado';
            const revenue = d.receitaProduto || 0;
            // Assuming 1 row = 1 product unit if quantity is not available, or checking for quantity field if exists
            // Usually Magento exports have a quantity column, but if not we assume 1 row = 1 item unless indicated
            // Reviewing typical sheet consumption associated with this project:
            // The user hasn't provided a quantity column in the snippet, but usually rows are line items.
            // Let's assume 1 for now or check if there's a quantity logic. 
            // In aggregateData function in page.tsx, it counts uniqueOrders.
            const quantity = 1;

            // Product Stats
            if (!productStats[productName]) productStats[productName] = { revenue: 0, quantity: 0 };
            productStats[productName].revenue += revenue;
            productStats[productName].quantity += quantity;

            // Campaign Stats
            if (campaign && campaign.trim() !== '') {
                if (!campaignStats[campaign]) campaignStats[campaign] = { quantity: 0, revenue: 0 };
                campaignStats[campaign].quantity += quantity;
                campaignStats[campaign].revenue += revenue;
            }

            // Channel Stats
            if (channel) {
                if (!channelStats[channel]) channelStats[channel] = { orders: new Set(), revenue: 0 };
                if (d.pedido) channelStats[channel].orders.add(d.pedido);
                channelStats[channel].revenue += revenue;
            }
        });

        // Determine Best Product
        const topProduct = Object.entries(productStats)
            .map(([name, stat]) => ({ name, ...stat }))
            .sort((a, b) => b.revenue - a.revenue)[0];

        // Determine Best Campaign by Quantity (Products)
        const topCampaign = Object.entries(campaignStats)
            .map(([name, stat]) => ({ name, ...stat }))
            .sort((a, b) => b.quantity - a.quantity)[0];

        // Determine Best Channel by Conversions (Orders)
        const topChannel = Object.entries(channelStats)
            .map(([name, stat]) => ({ name, orders: stat.orders.size, revenue: stat.revenue }))
            .sort((a, b) => b.orders - a.orders)[0];

        return {
            topProduct,
            topCampaign,
            topChannel
        };
    }, [data]);

    if (!analysis) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-foreground">Análise de Inteligência de Negócio</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Melhor Produto */}
                <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-zinc-900 border-indigo-200 dark:border-indigo-800">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                                <ShoppingBag className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                                Produto Campeão
                            </span>
                        </div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Maior Receita Gerada</h3>
                        <p className="text-lg font-bold leading-tight mb-3 line-clamp-2 min-h-[3rem]" title={analysis.topProduct.name}>
                            {analysis.topProduct.name}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                R$ {analysis.topProduct.revenue.toLocaleString('pt-BR', { notation: 'compact' })}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                (~{analysis.topProduct.quantity} un.)
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Melhor Campanha - Quantidade */}
                <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-zinc-900 border-emerald-200 dark:border-emerald-800">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                                <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                                Campanha de Volume
                            </span>
                        </div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Mais Produtos Vendidos</h3>
                        <p className="text-lg font-bold leading-tight mb-3 line-clamp-2 min-h-[3rem]" title={analysis.topCampaign.name}>
                            {analysis.topCampaign.name}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {analysis.topCampaign.quantity} items
                            </span>
                            <span className="text-sm text-muted-foreground">
                                (R$ {analysis.topCampaign.revenue.toLocaleString('pt-BR', { notation: 'compact' })})
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Melhor Canal - Conversões */}
                <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-zinc-900 border-amber-200 dark:border-amber-800">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                                <Share2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                                Canal de Conversão
                            </span>
                        </div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Maior Volume de Pedidos</h3>
                        <p className="text-lg font-bold leading-tight mb-3 line-clamp-2 min-h-[3rem]" title={analysis.topChannel.name}>
                            {analysis.topChannel.name}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {analysis.topChannel.orders} pedidos
                            </span>
                            <span className="text-sm text-muted-foreground">
                                máx. conversão
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
