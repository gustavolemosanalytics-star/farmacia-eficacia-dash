'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/MockDataBadge';
import { oportunidades, trendingProducts, scaleCandidates } from '@/lib/mockData';
import { TrendingUp, Rocket, Sparkles, Target, Zap } from 'lucide-react';
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ZAxis,
    ReferenceLine,
    Label
} from 'recharts';
import { PageFilters } from '@/components/ui/PageFilters';

export default function TendenciasPage() {
    // Prepare Data for Scatter Matrix
    // Mapping Impacto (Y) and Esforço (X)
    const scatterData = oportunidades.map(op => ({
        x: op.esforco,
        y: op.impacto,
        z: 10, // Size bubble
        name: op.titulo,
        score: op.score,
        category: op.categoria
    }));

    return (
        <div className="space-y-6">
            <PageFilters
                title="Tendências & Oportunidades"
                description="Growth Radar - Oportunidades priorizadas por impacto"
            />

            {/* Matriz de Oportunidades (Scatter Plot) */}
            <section>
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Target className="h-5 w-5 text-emerald-500" />
                        <CardTitle className="text-sm font-medium text-foreground">Matriz de Priorização (Impacto x Esforço)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart
                                    margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis type="number" dataKey="x" name="Esforço" unit="%" stroke="var(--muted-foreground)" domain={[0, 100]} fontSize={12}>
                                        <Label value="Esforço" offset={-10} position="insideBottom" />
                                    </XAxis>
                                    <YAxis type="number" dataKey="y" name="Impacto" unit="%" stroke="var(--muted-foreground)" domain={[0, 100]} fontSize={12}>
                                        <Label value="Impacto" angle={-90} position="insideLeft" />
                                    </YAxis>
                                    <ZAxis type="number" dataKey="z" range={[60, 400]} />
                                    <Tooltip
                                        cursor={{ strokeDasharray: '3 3' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-popover border border-border p-3 rounded-lg shadow-md text-sm">
                                                        <p className="font-bold text-foreground mb-1">{data.name}</p>
                                                        <p className="text-muted-foreground">{data.category}</p>
                                                        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                                                            <span>Impacto: {data.y}%</span>
                                                            <span>Esforço: {data.x}%</span>
                                                        </div>
                                                        <div className="mt-1 font-bold text-accent-foreground">Score: {data.score}</div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    {/* Quadrant Lines */}
                                    <ReferenceLine x={50} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
                                    <ReferenceLine y={50} stroke="var(--muted-foreground)" strokeDasharray="3 3" />

                                    <Scatter name="Oportunidades" data={scatterData} fill="#8b5cf6">
                                        {scatterData.map((entry, index) => (
                                            // We can customize cell colors based on quadrants if needed
                                            <></>
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                            {/* Quadrant Labels Overlay */}
                            <div className="absolute top-2 right-2 text-[10px] text-muted-foreground opacity-50 font-bold">Quick Wins (Alto Imp / Baixo Esf)</div>
                            <div className="absolute top-2 left-12 text-[10px] text-muted-foreground opacity-50 font-bold">Major Projects</div>
                            <div className="absolute bottom-10 right-2 text-[10px] text-muted-foreground opacity-50 font-bold">Fill Ins</div>
                            <div className="absolute bottom-10 left-12 text-[10px] text-muted-foreground opacity-50 font-bold">Thankless Tasks</div>
                        </div>

                        {/* Lista de Prioridades */}
                        <div className="mt-6 space-y-2">
                            <h3 className="text-sm font-semibold text-foreground mb-3">Top Prioridades (Ordenado por Score)</h3>
                            {oportunidades.map((op, index) => (
                                <div key={op.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{op.titulo}</p>
                                            <p className="text-xs text-muted-foreground">{op.categoria}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Score</p>
                                            <p className="text-lg font-bold text-primary">{op.score}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trending Products List */}
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Rocket className="h-5 w-5 text-orange-500" />
                        <CardTitle className="text-sm font-medium text-foreground">Produtos em Alta (Momentum)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {trendingProducts.map((product) => (
                                <div key={product.sku} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{product.nome}</p>
                                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 mb-1">
                                            +{product.crescimento.toFixed(1)}%
                                        </Badge>
                                        <p className="text-xs text-muted-foreground">{product.viewsHoje.toLocaleString()} views hoje</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Scale Candidates List */}
                <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        <CardTitle className="text-sm font-medium text-foreground">Campanhas para Escalar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {scaleCandidates.map((camp) => (
                                <div key={camp.campanha} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{camp.campanha}</p>
                                        <p className="text-xs text-muted-foreground">{camp.plataforma} • SOV: {camp.shareOfVoice}%</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-emerald-500 mb-1">{camp.roas.toFixed(1)}x ROAS</p>
                                        <Badge variant={camp.potencial === 'Alto' ? 'default' : 'secondary'} className={camp.potencial === 'Alto' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                                            {camp.potencial} Potencial
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
