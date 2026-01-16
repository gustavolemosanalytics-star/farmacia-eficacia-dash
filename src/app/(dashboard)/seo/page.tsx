'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/kpi/KPICard';
import { PageHeader } from '@/components/ui/MockDataBadge';
import { kpisSEO, paginasQueda, querysMaisAfetadas, oportunidadesKeywords } from '@/lib/mockData';
import { TrendingDown, Search, AlertTriangle, Sparkles } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

import { DatePickerWithRange } from '@/components/ui/date-range-picker';

export default function SeoPage() {
    // Transform mock data for charts
    const dropData = paginasQueda.map(page => ({
        name: page.pagina.length > 20 ? page.pagina.substring(0, 20) + '...' : page.pagina,
        cliquesAntes: page.cliquesAntes,
        cliquesDepois: page.cliquesDepois,
        fullPath: page.pagina
    }));

    return (
        <div className="space-y-6">
            {/* Header Padronizado */}
            <PageHeader
                title="SEO & Demanda"
                description="Análise de tráfego orgânico, quedas e oportunidades"
                hasMockData={true}
            >
                <DatePickerWithRange />
            </PageHeader>

            {/* Alerta Crítico */}
            <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 p-4">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <div>
                        <h4 className="font-semibold text-red-900 dark:text-red-200">Queda Crítica Detectada</h4>
                        <p className="text-sm text-red-700 dark:text-red-300">
                            Tráfego orgânico caiu 71% em comparação com o mês anterior. Páginas de produto foram as mais afetadas.
                        </p>
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Google Search Console</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {kpisSEO.map((kpi) => (
                        <KPICard
                            key={kpi.id}
                            data={kpi}
                            invertedVariation={kpi.id === 'posicao_media'}
                        />
                    ))}
                </div>
            </section>

            {/* Gráficos de Queda */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Visualização de Queda de Tráfego */}
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-foreground">Impacto por Página (Cliques)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={dropData}
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                                    <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={100}
                                        stroke="var(--muted-foreground)"
                                        fontSize={12}
                                        tick={{ fill: 'var(--muted-foreground)' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--card)',
                                            borderColor: 'var(--border)',
                                            color: 'var(--foreground)'
                                        }}
                                        itemStyle={{ color: 'var(--foreground)' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="cliquesAntes" name="Antes" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="cliquesDepois" name="Depois" fill="#ef4444" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabela Simplificada de Quedas */}
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-red-500" />
                        <CardTitle className="text-sm font-medium text-foreground">Top Páginas com Maior Queda (%)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {paginasQueda.slice(0, 5).map((row) => (
                                <div key={row.pagina} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-foreground truncate max-w-[200px]" title={row.pagina}>
                                            {row.pagina}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Posição: {row.posicaoAntes} → <span className="text-red-500">{row.posicaoDepois}</span>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-red-500">{row.queda.toFixed(1)}%</p>
                                        <p className="text-xs text-muted-foreground">
                                            {row.cliquesAntes.toLocaleString()} → {row.cliquesDepois.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Queries e Oportunidades */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Queries Afetadas (Lista) */}
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Search className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-sm font-medium text-foreground">Queries Mais Afetadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {querysMaisAfetadas.map((row) => (
                                <div key={row.query} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-foreground">{row.query}</p>
                                        <p className="text-xs text-muted-foreground">Vol: {row.volumeMensal.toLocaleString()}/mês</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Cliques</p>
                                            <p className="text-sm font-medium text-red-500">{row.cliquesDepois.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Posição</p>
                                            <div className="flex items-center gap-1 text-sm font-medium">
                                                <span className="text-muted-foreground">{row.posicaoAntes}</span>
                                                <span className="text-muted-foreground">→</span>
                                                <span className="text-red-500">{row.posicaoDepois}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Oportunidades (Cards) */}
                <Card className="border-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-900/5">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Sparkles className="h-5 w-5 text-emerald-500" />
                        <CardTitle className="text-sm font-medium text-foreground">Oportunidades de Keywords</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-3">
                            {oportunidadesKeywords.map((kw) => (
                                <div key={kw.keyword} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{kw.keyword}</p>
                                        <p className="text-xs text-muted-foreground">Volume: {kw.volume.toLocaleString('pt-BR')}/mês • KD: {kw.dificuldade}</p>
                                    </div>
                                    <Badge variant={kw.potencial === 'Alto' ? 'default' : 'secondary'} className={kw.potencial === 'Alto' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                                        {kw.potencial}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
