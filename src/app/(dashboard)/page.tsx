'use client';

import { KPICard } from '@/components/kpi/KPICard';
import { ContributionHeatmap } from '@/components/charts/ContributionHeatmap';
import { FunnelChart } from '@/components/charts/FunnelChart';
import { TimeSeriesChart } from '@/components/charts/TimeSeriesChart';
import { AlertasSection } from '@/components/sections/AlertasSection';
import { PlanoAcaoIA } from '@/components/sections/PlanoAcaoIA';
import {
    kpisprincipais,
    metrícasFunil,
    heatmapCanais,
    heatmapCategorias,
    heatmapDispositivos,
    heatmapRegioes,
    heatmapTipoCliente,
    timeSeriesReceita,
} from '@/lib/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function HomeExecutiva() {
    return (
        <div className="space-y-6">
            {/* Título da Página */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Home Executiva</h1>
                    <p className="text-sm text-zinc-400">
                        Visão geral de performance • Responda &quot;O que caiu, por quê, e o que fazer&quot; em 60 segundos
                    </p>
                </div>
            </div>

            {/* Row A - KPIs Principais */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                    KPIs Principais
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {kpisprincipais.slice(0, 5).map((kpi) => (
                        <KPICard
                            key={kpi.id}
                            data={kpi}
                            onClick={() => { }}
                            invertedVariation={kpi.id === 'cac_paid'}
                        />
                    ))}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {kpisprincipais.slice(5).map((kpi) => (
                        <KPICard
                            key={kpi.id}
                            data={kpi}
                            onClick={() => { }}
                            compact
                            invertedVariation={kpi.id === 'cac_paid'}
                        />
                    ))}
                </div>
            </section>

            {/* Gráfico de Tendência */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <TimeSeriesChart
                    data={timeSeriesReceita}
                    title="Receita - Últimos 30 dias"
                    formatValue={(v) => `R$ ${(v / 1000).toFixed(1)}k`}
                />
                <FunnelChart />
            </section>

            {/* Row B - Funil de Saúde */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                    Saúde do Funil
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    {metrícasFunil.map((kpi) => (
                        <KPICard
                            key={kpi.id}
                            data={kpi}
                            compact
                            invertedVariation={kpi.id === 'abandono_carrinho' || kpi.id === 'tempo_compra'}
                        />
                    ))}
                </div>
            </section>

            {/* Row C - Drivers de Contribuição */}
            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                    Análise de Contribuição
                </h2>
                <Tabs defaultValue="todos" className="w-full">
                    <TabsList className="mb-4 bg-zinc-900 border border-zinc-800">
                        <TabsTrigger value="todos" className="text-xs data-[state=active]:bg-zinc-800">
                            Todos
                        </TabsTrigger>
                        <TabsTrigger value="canal" className="text-xs data-[state=active]:bg-zinc-800">
                            Canal
                        </TabsTrigger>
                        <TabsTrigger value="categoria" className="text-xs data-[state=active]:bg-zinc-800">
                            Categoria
                        </TabsTrigger>
                        <TabsTrigger value="dispositivo" className="text-xs data-[state=active]:bg-zinc-800">
                            Dispositivo
                        </TabsTrigger>
                        <TabsTrigger value="regiao" className="text-xs data-[state=active]:bg-zinc-800">
                            Região
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="todos">
                        <ContributionHeatmap
                            data={[heatmapCanais, heatmapDispositivos, heatmapTipoCliente]}
                            title="Impacto por Dimensão (Variação % da Receita)"
                        />
                    </TabsContent>
                    <TabsContent value="canal">
                        <ContributionHeatmap
                            data={[heatmapCanais]}
                            title="Impacto por Canal"
                        />
                    </TabsContent>
                    <TabsContent value="categoria">
                        <ContributionHeatmap
                            data={[heatmapCategorias]}
                            title="Impacto por Categoria"
                        />
                    </TabsContent>
                    <TabsContent value="dispositivo">
                        <ContributionHeatmap
                            data={[heatmapDispositivos]}
                            title="Impacto por Dispositivo"
                        />
                    </TabsContent>
                    <TabsContent value="regiao">
                        <ContributionHeatmap
                            data={[heatmapRegioes]}
                            title="Impacto por Região"
                        />
                    </TabsContent>
                </Tabs>
            </section>

            {/* Row D & E - Alertas e Plano IA */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <AlertasSection />
                <PlanoAcaoIA />
            </section>
        </div>
    );
}
