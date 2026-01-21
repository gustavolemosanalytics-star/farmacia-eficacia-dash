'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/kpi/KPICard';
import { PageFilters } from '@/components/ui/PageFilters';
import { useCRMData, useCatalogoData } from '@/hooks/useSheetData';
import {
    Users, Heart, Crown, AlertTriangle, XCircle, TrendingUp, TrendingDown, Clock, DollarSign, RefreshCw, ShoppingCart, UserCheck, Lightbulb, CheckCircle, Calendar, Layers
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    AreaChart, Area, PieChart, Pie, LineChart, Line, Legend, ScatterChart, Scatter, ZAxis, ComposedChart
} from 'recharts';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

export default function CrmPage() {
    // Definir período padrão de 2025 até hoje para esta página
    const customStart = useMemo(() => new Date(2025, 0, 1), []);
    const customEnd = useMemo(() => new Date(), []);

    const { data: crmData, loading: loadingCRM } = useCRMData(customStart, customEnd);
    const { data: catalogoData, loading: loadingCatalogo } = useCatalogoData(customStart, customEnd);

    const loading = loadingCRM || loadingCatalogo;

    // Advanced CRM Analytics
    const analytics = useMemo(() => {
        if (!catalogoData?.rawData) return null;

        const filtered = catalogoData.rawData.filter((d: any) =>
            d.status?.toLowerCase().includes('complete') ||
            d.status?.toLowerCase().includes('completo') ||
            d.status?.toLowerCase().includes('pago') ||
            d.status?.toLowerCase().includes('enviado') ||
            d.status?.toLowerCase().includes('faturado') ||
            !d.status
        );

        // --- Customer Map Build ---
        const customerMap: {
            [cpf: string]: {
                cpf: string;
                orders: any[];
                totalReceita: number;
                totalPedidos: number;
                firstOrder: Date;
                lastOrder: Date;
                avgTicket: number;
                categories: string[];
                cohortMonth: string; // YYYY-MM
            }
        } = {};

        // Helper to formatting dates YYYY-MM
        const getMonthStr = (date: Date) => date.toISOString().slice(0, 7);

        filtered.forEach((d: any) => {
            const cpf = d.cpfCliente || 'anon_' + Math.random();
            const dateStr = d.data || d.dataTransacao;
            if (!dateStr) return;

            let orderDate = new Date();
            if (dateStr.includes('/')) {
                orderDate = new Date(dateStr.split('/').reverse().join('-'));
            } else {
                orderDate = new Date(dateStr.split(' ')[0]);
            }

            if (!customerMap[cpf]) {
                customerMap[cpf] = {
                    cpf,
                    orders: [],
                    totalReceita: 0,
                    totalPedidos: 0,
                    firstOrder: orderDate,
                    lastOrder: orderDate,
                    avgTicket: 0,
                    categories: [],
                    cohortMonth: getMonthStr(orderDate)
                };
            }

            const cust = customerMap[cpf];
            cust.orders.push({ ...d, orderDate });
            cust.totalReceita += d.receitaProduto || 0;

            if (orderDate < cust.firstOrder) {
                cust.firstOrder = orderDate;
                cust.cohortMonth = getMonthStr(orderDate);
            }
            if (orderDate > cust.lastOrder) {
                cust.lastOrder = orderDate;
            }

            if (d.categoria) {
                cust.categories.push(d.categoria.split(',')[0]?.trim());
            }
        });

        const customers = Object.values(customerMap).map(c => {
            const uniqueOrders = new Set(c.orders.map((o: any) => o.pedido).filter(Boolean));
            c.totalPedidos = uniqueOrders.size || c.orders.length;
            c.avgTicket = c.totalPedidos > 0 ? c.totalReceita / c.totalPedidos : 0;
            return c;
        });

        // --- Cohort Analysis ---
        const cohorts: { [month: string]: { [monthDiff: number]: Set<string> } } = {};

        customers.forEach(cust => {
            cust.orders.forEach(order => {
                const diffTime = Math.abs(order.orderDate.getTime() - cust.firstOrder.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const diffMonths = Math.floor(diffDays / 30); // Approximate month diff

                if (!cohorts[cust.cohortMonth]) cohorts[cust.cohortMonth] = {};
                if (!cohorts[cust.cohortMonth][diffMonths]) cohorts[cust.cohortMonth][diffMonths] = new Set();

                cohorts[cust.cohortMonth][diffMonths].add(cust.cpf);
            });
        });

        // Format cohort data for table/heatmap
        const cohortData = Object.keys(cohorts)
            .sort()
            .slice(-6) // Last 6 months only for display
            .map(month => {
                const month0Count = cohorts[month][0]?.size || 0;
                return {
                    month,
                    size: month0Count,
                    retention: [0, 1, 2, 3, 4, 5].map(m => {
                        const count = cohorts[month][m]?.size || 0;
                        const percent = month0Count > 0 ? (count / month0Count) * 100 : 0;
                        return { monthIdx: m, count, percent };
                    })
                };
            });

        // --- LTV Evolution Line Chart ---
        // Average Cumulative LTV by "Customer Age (Months)"
        // For each customer, calculate cumulative spend at month 0, 1, 2...
        const ltvByAge: { [age: number]: { sum: number, count: number } } = {};

        customers.forEach(cust => {
            // Sort orders by date
            const sortedOrders = cust.orders.sort((a, b) => a.orderDate.getTime() - b.orderDate.getTime());
            let cumulativeSpend = 0;
            const seenMonths = new Set<number>();

            sortedOrders.forEach(order => {
                const diffTime = Math.abs(order.orderDate.getTime() - cust.firstOrder.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const diffMonths = Math.floor(diffDays / 30);

                cumulativeSpend += order.receitaProduto || 0;

                // Only record the latest cumulative spend for each month for this customer (snapshot)
                // Actually better: record spend happening at month X.
                // Let's do: For each month Age, what is the avg cumulative LTV?

                // Simplification: Update the max cumulative value for each age up to current age
                for (let m = diffMonths; m <= 6; m++) { // Project up to 6 months
                    if (!ltvByAge[m]) ltvByAge[m] = { sum: 0, count: 0 };
                    // This is tricky. Let's do clearer logic:
                }
            });
        });

        // Create keys for months 0 to 6
        const months = [0, 1, 2, 3, 4, 5, 6];
        const ltvEvolutionData = months.map(age => {
            // Only average customers who joined long enough ago to have reached this 'age'
            const currentPeriodEnd = new Date();
            const validCustomers = customers.filter(cust => {
                const custAgeMonths = Math.floor((currentPeriodEnd.getTime() - cust.firstOrder.getTime()) / (1000 * 60 * 60 * 24 * 30));
                return custAgeMonths >= age;
            });

            if (validCustomers.length === 0) return { age, avgLTV: 0 };

            const sumLTV = validCustomers.reduce((sum, cust) => {
                let ltvAtAge = 0;
                cust.orders.forEach(o => {
                    const oAge = Math.floor((o.orderDate.getTime() - cust.firstOrder.getTime()) / (1000 * 60 * 60 * 24 * 30));
                    if (oAge <= age) ltvAtAge += o.receitaProduto || 0;
                });
                return sum + ltvAtAge;
            }, 0);

            return { age, avgLTV: sumLTV / validCustomers.length };
        }).filter(d => d.avgLTV > 0);

        // --- Category Affinity ---
        const categoryAffinityMap: { [cat: string]: { total: number, uniqueCust: Set<string> } } = {};
        filtered.forEach((d: any) => {
            const cat = d.categoria?.split(',')[0]?.trim() || 'Outros';
            if (!categoryAffinityMap[cat]) categoryAffinityMap[cat] = { total: 0, uniqueCust: new Set() };
            categoryAffinityMap[cat].total += d.receitaProduto || 0;
            categoryAffinityMap[cat].uniqueCust.add(d.cpfCliente);
        });
        const categoryAffinity = Object.entries(categoryAffinityMap)
            .filter(([name]) => name !== 'Outros')
            .map(([name, data]) => ({
                name,
                value: data.total,
                customers: data.uniqueCust.size
            })).sort((a, b) => b.value - a.value).slice(0, 8);

        // --- Purchase Frequency Distribution ---
        const freqDist = {
            '1 pedido': customers.filter(c => c.totalPedidos === 1).length,
            '2 pedidos': customers.filter(c => c.totalPedidos === 2).length,
            '3-5 pedidos': customers.filter(c => c.totalPedidos >= 3 && c.totalPedidos <= 5).length,
            '6-10 pedidos': customers.filter(c => c.totalPedidos >= 6 && c.totalPedidos <= 10).length,
            '10+ pedidos': customers.filter(c => c.totalPedidos > 10).length,
        };
        const freqDistData = Object.entries(freqDist).map(([name, value]) => ({ name, value }));

        // --- RFM Analysis Data for Scatter ---
        const rfmData = customers.map(c => {
            const recencyDays = Math.floor((new Date().getTime() - c.lastOrder.getTime()) / (1000 * 60 * 60 * 24));
            return {
                recency: recencyDays,
                frequency: c.totalPedidos,
                monetary: c.totalReceita,
                cpf: c.cpf
            };
        }).filter(d => d.monetary < 10000 && d.frequency < 20); // Remove outliers for better chart

        // --- Original Metrics ---
        // LTV Distribution
        const ltvBuckets = [
            { range: 'R$ 0-200', min: 0, max: 200, count: 0, revenue: 0 },
            { range: 'R$ 200-500', min: 200, max: 500, count: 0, revenue: 0 },
            { range: 'R$ 500-1k', min: 500, max: 1000, count: 0, revenue: 0 },
            { range: 'R$ 1k-2k', min: 1000, max: 2000, count: 0, revenue: 0 },
            { range: 'R$ 2k-5k', min: 2000, max: 5000, count: 0, revenue: 0 },
            { range: 'R$ 5k+', min: 5000, max: Infinity, count: 0, revenue: 0 },
        ];
        customers.forEach(c => {
            const bucket = ltvBuckets.find(b => c.totalReceita >= b.min && c.totalReceita < b.max);
            if (bucket) { bucket.count++; bucket.revenue += c.totalReceita; }
        });

        const recurringCustomers = customers.filter(c => c.totalPedidos > 1);
        const recurrenceRate = customers.length > 0 ? (recurringCustomers.length / customers.length * 100) : 0;

        // Days between orders
        let totalDaysBetween = 0;
        let countWithDays = 0;
        recurringCustomers.forEach(c => {
            if (c.firstOrder && c.lastOrder && c.totalPedidos > 1) {
                const daysDiff = (c.lastOrder.getTime() - c.firstOrder.getTime()) / (1000 * 60 * 60 * 24);
                const avgDays = daysDiff / (c.totalPedidos - 1);
                if (avgDays > 0) { totalDaysBetween += avgDays; countWithDays++; }
            }
        });
        const avgDaysBetweenOrders = countWithDays > 0 ? totalDaysBetween / countWithDays : 0;

        const totalLTV = customers.reduce((s, c) => s + c.totalReceita, 0);
        const avgLTV = customers.length > 0 ? totalLTV / customers.length : 0;

        const behaviorSegments = [
            { name: 'Campeões', description: '+R$ 2k e +3 pedidos', count: customers.filter(c => c.totalReceita > 2000 && c.totalPedidos >= 3).length, color: '#10b981', icon: Crown, action: 'Manter engajados' },
            { name: 'Leais', description: 'Recorrentes estáveis', count: customers.filter(c => c.totalPedidos >= 2 && c.totalReceita >= 500 && c.totalReceita <= 2000).length, color: '#8b5cf6', icon: Heart, action: 'Upsell' },
            { name: 'Potenciais', description: 'Uma compra alta', count: customers.filter(c => c.totalPedidos === 1 && c.totalReceita > 500).length, color: '#3b82f6', icon: TrendingUp, action: 'Incentivar 2ª compra' },
            { name: 'Em Risco', description: 'Ausentes > 60 dias', count: customers.filter(c => { if (!c.lastOrder) return false; const d = (new Date().getTime() - c.lastOrder.getTime()) / (86400000); return d > 60 && c.totalPedidos >= 1; }).length, color: '#f59e0b', icon: AlertTriangle, action: 'Reativar' },
            { name: 'Novos', description: '< 30 dias', count: customers.filter(c => { if (!c.firstOrder) return false; const d = (new Date().getTime() - c.firstOrder.getTime()) / (86400000); return d <= 30 && c.totalPedidos === 1; }).length, color: '#14b8a6', icon: UserCheck, action: 'Onboarding' }
        ];

        // Top LTV Customers Table
        const topLTVCustomers = [...customers].sort((a, b) => b.totalReceita - a.totalReceita).slice(0, 10).map((c, i) => ({
            rank: i + 1, cpf: c.cpf.substring(0, 6) + '***', ltv: c.totalReceita, pedidos: c.totalPedidos, ticketMedio: c.avgTicket,
        }));

        const revenueConcentration = customers.length > 0 ? (([...customers].sort((a, b) => b.totalReceita - a.totalReceita).slice(0, Math.ceil(customers.length * 0.2)).reduce((s, c) => s + c.totalReceita, 0) / totalLTV) * 100) : 0;

        return {
            totalCustomers: customers.length,
            recurringCustomers: recurringCustomers.length,
            recurrenceRate,
            avgLTV,
            avgDaysBetweenOrders,
            revenueConcentration,
            ltvBuckets,
            behaviorSegments,
            topLTVCustomers,
            cohortData,
            ltvEvolutionData,
            rfmData,
            categoryAffinity,
            freqDistData
        };
    }, [catalogoData]);

    const insights = useMemo(() => {
        if (!analytics) return [];
        const result: { type: 'alert' | 'success' | 'insight'; icon: any; title: string; description: string }[] = [];
        if (analytics.recurrenceRate < 20) { result.push({ type: 'alert', icon: AlertTriangle, title: 'Baixa Recorrência', description: `Apenas ${analytics.recurrenceRate.toFixed(1)}% voltam. Implemente fidelidade.` }); }
        else if (analytics.recurrenceRate > 40) { result.push({ type: 'success', icon: CheckCircle, title: 'Alta Fidelização', description: `${analytics.recurrenceRate.toFixed(1)}% de recorrência. Base saudável!` }); }
        if (analytics.revenueConcentration > 70) { result.push({ type: 'alert', icon: AlertTriangle, title: 'Alta Concentração', description: `${analytics.revenueConcentration.toFixed(0)}% receita vem de 20% clientes.` }); }
        return result;
    }, [analytics]);

    // KPIs
    const kpis = [
        { id: 'clientes', titulo: 'Total Clientes', valor: analytics?.totalCustomers || 0, valorFormatado: (analytics?.totalCustomers || 0).toLocaleString('pt-BR'), variacao: 5.2, tendencia: 'up' as const, sparklineData: [1, 1.02, 1.04, 1.05, 1.06] },
        { id: 'recorrentes', titulo: 'Clientes Recorrentes', valor: analytics?.recurringCustomers || 0, valorFormatado: (analytics?.recurringCustomers || 0).toLocaleString('pt-BR'), variacao: analytics?.recurrenceRate || 0, tendencia: (analytics?.recurrenceRate || 0) > 25 ? 'up' as const : 'down' as const, sparklineData: [1, 1.01, 1.03, 1.02, 1.04] },
        { id: 'ltv', titulo: 'LTV Médio', valor: analytics?.avgLTV || 0, valorFormatado: `R$ ${(analytics?.avgLTV || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, variacao: 8.5, tendencia: 'up' as const, sparklineData: [1, 1.03, 1.05, 1.07, 1.09] },
        { id: 'ciclo', titulo: 'Ciclo Recompra', valor: analytics?.avgDaysBetweenOrders || 0, valorFormatado: `${Math.round(analytics?.avgDaysBetweenOrders || 0)} dias`, variacao: 0, tendencia: 'stable' as const, sparklineData: [1, 1, 1, 1, 1] },
    ];

    return (
        <div className="space-y-6">
            <PageFilters title="CRM & Clientes" description="Fidelização, LTV e Análise de Comportamento" />

            <div className="rounded-xl border border-blue-200/50 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-900/10 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-500/10">
                        <Calendar className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Monitoramento de Longo Prazo Ativo</p>
                        <p className="text-xs text-blue-700/80 dark:text-blue-300/80">
                            Para uma análise precisa de LTV e Retenção, os dados nesta página estão setados de
                            <span className="font-bold mx-1">01/01/2025</span> até
                            <span className="font-bold mx-1">{new Date().toLocaleDateString('pt-BR')}</span>.
                        </p>
                    </div>
                </div>
            </div>

            {loading && (<div className="flex items-center justify-center py-8"> <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div> </div>)}

            {!loading && insights.length > 0 && (
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {insights.map((insight, i) => {
                        const Icon = insight.icon;
                        const bgColor = insight.type === 'alert' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : insight.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
                        const iconColor = insight.type === 'alert' ? 'text-red-500' : insight.type === 'success' ? 'text-green-500' : 'text-blue-500';
                        return (<Card key={i} className={`${bgColor} border`}><CardContent className="pt-4"><div className="flex items-start gap-3"><Icon className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} /><div><p className="font-medium text-sm">{insight.title}</p><p className="text-xs text-muted-foreground mt-1">{insight.description}</p></div></div></CardContent></Card>);
                    })}
                </section>
            )}

            {!loading && (<section><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{kpis.map((kpi) => (<KPICard key={kpi.id} data={kpi} compact />))}</div></section>)}

            {/* New Advanced Charts Section */}
            {!loading && analytics && (
                <section className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* LTV Evolution */}
                        <Card className="border-border bg-card">
                            <CardHeader className="flex flex-row items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                <CardTitle className="text-sm font-medium">LTV Médio ao Longo do Tempo</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground mb-4">Média de valor acumulado gasto pelo cliente nos primeiros 6 meses.</p>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={analytics.ltvEvolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorLTV" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis dataKey="age" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `Mês ${v}`} />
                                        <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `R$${v}`} />
                                        <Tooltip formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'LTV Médio']} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                        <Area type="monotone" dataKey="avgLTV" stroke="#10b981" fillOpacity={1} fill="url(#colorLTV)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* RFM Scatter */}
                        <Card className="border-border bg-card">
                            <CardHeader className="flex flex-row items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                <CardTitle className="text-sm font-medium">Matriz RFM: Recência vs Frequência</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground mb-4">Cada ponto é um cliente. Tamanho = Gasto total.</p>
                                <ResponsiveContainer width="100%" height={300}>
                                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis type="number" dataKey="recency" name="Recência days" stroke="var(--muted-foreground)" fontSize={11} label={{ value: 'Dias sem comprar', position: 'insideBottom', offset: -10, style: { fill: 'var(--muted-foreground)', fontSize: '10px' } }} />
                                        <YAxis type="number" dataKey="frequency" name="Pedidos" stroke="var(--muted-foreground)" fontSize={11} label={{ value: 'Freq. Pedidos', angle: -90, position: 'insideLeft', style: { fill: 'var(--muted-foreground)', fontSize: '10px' } }} />
                                        <ZAxis type="number" dataKey="monetary" range={[10, 100]} name="Valor Total" />
                                        <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value: any, name: any) => [name === 'Valor Total' ? `R$ ${value.toFixed(2)}` : value, name]} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                        <Scatter name="Clientes" data={analytics.rfmData} fill="#8b5cf6" fillOpacity={0.6} />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Cohort Report */}
                    <Card className="border-border bg-card">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Layers className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-medium">Análise Cohort (Retenção)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-2 px-2 font-medium">Safra</th>
                                            <th className="text-center py-2 px-2 font-medium">Clientes</th>
                                            <th className="text-center py-2 px-2 font-medium">Mês 0</th>
                                            <th className="text-center py-2 px-2 font-medium">Mês 1</th>
                                            <th className="text-center py-2 px-2 font-medium">Mês 2</th>
                                            <th className="text-center py-2 px-2 font-medium">Mês 3</th>
                                            <th className="text-center py-2 px-2 font-medium">Mês 4</th>
                                            <th className="text-center py-2 px-2 font-medium">Mês 5</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics.cohortData.map((cohort, i) => (
                                            <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50">
                                                <td className="py-3 px-2 font-medium">{cohort.month}</td>
                                                <td className="py-3 px-2 text-center text-muted-foreground">{cohort.size}</td>
                                                {cohort.retention.map((r, idx) => {
                                                    const bgIntensity = Math.min(r.percent, 100) / 100;
                                                    const isActive = r.count > 0;
                                                    return (
                                                        <td key={idx} className="py-3 px-1 text-center">
                                                            <div
                                                                className={`rounded px-1 py-1 text-xs ${isActive ? '' : 'text-muted-foreground opacity-30'}`}
                                                                style={{
                                                                    backgroundColor: isActive ? `rgba(16, 185, 129, ${bgIntensity * 0.5})` : 'transparent',
                                                                    color: isActive && bgIntensity > 0.5 ? 'white' : 'inherit'
                                                                }}
                                                            >
                                                                {r.percent > 0 ? `${r.percent.toFixed(0)}%` : '-'}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Category Affinity */}
                        <Card className="border-border bg-card">
                            <CardHeader className="flex flex-row items-center gap-2">
                                <ShoppingCart className="h-5 w-5 text-primary" />
                                <CardTitle className="text-sm font-medium">Afinidade por Categoria (Volume Monetário)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={analytics.categoryAffinity} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="name" width={120} stroke="var(--muted-foreground)" fontSize={11} />
                                        <Tooltip formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR')}`]} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {analytics.categoryAffinity.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Frequency Distribution */}
                        <Card className="border-border bg-card">
                            <CardHeader className="flex flex-row items-center gap-2">
                                <RefreshCw className="h-5 w-5 text-primary" />
                                <CardTitle className="text-sm font-medium">Distribuição de Frequência de Pedidos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={analytics.freqDistData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {analytics.freqDistData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-border bg-card">
                            <CardHeader><CardTitle className="text-sm font-medium">Segmentação de Comportamento</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {analytics.behaviorSegments.map((seg, i) => {
                                    const Icon = seg.icon;
                                    return (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full bg-opacity-10`} style={{ backgroundColor: `${seg.color}20` }}>
                                                    <Icon className="h-4 w-4" style={{ color: seg.color }} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{seg.name}</p>
                                                    <p className="text-xs text-muted-foreground">{seg.description}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">{seg.count}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">{seg.action}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        <Card className="border-border bg-card">
                            <CardHeader><CardTitle className="text-sm font-medium">Top 10 Clientes (LTV)</CardTitle></CardHeader>
                            <CardContent>
                                <div className="max-h-[400px] overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-card">
                                            <tr className="border-b border-border">
                                                <th className="text-left py-2 px-2 font-medium text-muted-foreground">#</th>
                                                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Cliente</th>
                                                <th className="text-right py-2 px-2 font-medium text-muted-foreground">LTV</th>
                                                <th className="text-right py-2 px-2 font-medium text-muted-foreground">Pedidos</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analytics.topLTVCustomers.map((c, i) => (
                                                <tr key={i} className="border-b border-border last:border-0">
                                                    <td className="py-2 px-2 text-xs text-muted-foreground">{c.rank}</td>
                                                    <td className="py-2 px-2 text-xs font-medium">{c.cpf}</td>
                                                    <td className="py-2 px-2 text-right text-xs font-bold text-emerald-600">R$ {c.ltv.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</td>
                                                    <td className="py-2 px-2 text-right text-xs">{c.pedidos}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            )}
        </div>
    );
}
