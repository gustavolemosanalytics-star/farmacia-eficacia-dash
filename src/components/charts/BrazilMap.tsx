'use client';

import { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, DollarSign, ShoppingCart, Users, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

// Brazil GeoJSON URL
const BRAZIL_GEO_URL = 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson';

// State name to abbreviation mapping
const stateAbbreviations: { [key: string]: string } = {
    'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM',
    'Bahia': 'BA', 'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES',
    'Goiás': 'GO', 'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS',
    'Minas Gerais': 'MG', 'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR',
    'Pernambuco': 'PE', 'Piauí': 'PI', 'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
    'Rio Grande do Sul': 'RS', 'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC',
    'São Paulo': 'SP', 'Sergipe': 'SE', 'Tocantins': 'TO'
};

type MetricType = 'receita' | 'pedidos' | 'clientes' | 'ticketMedio';

interface BrazilMapProps {
    rawData?: any[];
}

export function BrazilMap({ rawData = [] }: BrazilMapProps) {
    const [selectedMetric, setSelectedMetric] = useState<MetricType>('receita');
    const [hoveredState, setHoveredState] = useState<string | null>(null);
    const [tooltipContent, setTooltipContent] = useState<any>(null);

    // Process data by state with all metrics (for the map visualization)
    const stateMetrics = useMemo(() => {
        const metrics: { [key: string]: { receita: number; pedidos: number; clientes: Set<string>; orders: Set<string> } } = {};

        rawData.forEach((d: any) => {
            const state = d.estado || 'Não informado';
            if (!metrics[state]) {
                metrics[state] = { receita: 0, pedidos: 0, clientes: new Set(), orders: new Set() };
            }
            metrics[state].receita += d.receitaProduto || 0;
            if (d.pedido) metrics[state].orders.add(d.pedido);
            if (d.cpfCliente) metrics[state].clientes.add(d.cpfCliente);
        });

        return Object.entries(metrics).map(([name, data]) => ({
            name,
            receita: data.receita,
            pedidos: data.orders.size,
            clientes: data.clientes.size,
            ticketMedio: data.orders.size > 0 ? data.receita / data.orders.size : 0,
        }));
    }, [rawData]);

    // Process data by city with all metrics (for the top cities table)
    const cityMetrics = useMemo(() => {
        const metrics: { [key: string]: { receita: number; pedidos: number; clientes: Set<string>; orders: Set<string>, state: string } } = {};

        rawData.forEach((d: any) => {
            const city = d.cidade || d.city || 'Não informado';
            if (city === 'Não informado') return;

            const state = d.estado || d.uf || '';
            const key = `${city} (${state})`;

            if (!metrics[key]) {
                metrics[key] = { receita: 0, pedidos: 0, clientes: new Set(), orders: new Set(), state };
            }
            metrics[key].receita += d.receitaProduto || 0;
            if (d.pedido) metrics[key].orders.add(d.pedido);
            if (d.cpfCliente) metrics[key].clientes.add(d.cpfCliente);
        });

        return Object.entries(metrics).map(([name, data]) => ({
            name,
            receita: data.receita,
            pedidos: data.orders.size,
            clientes: data.clientes.size,
            ticketMedio: data.orders.size > 0 ? data.receita / data.orders.size : 0,
        })).sort((a, b) => b.receita - a.receita);
    }, [rawData]);

    const maxReceita = Math.max(...stateMetrics.map(s => s.receita), 1);

    const getColor = (stateName: string) => {
        const state = stateMetrics.find(s => s.name === stateName || stateAbbreviations[s.name] === stateName || stateName.includes(s.name));
        if (!state) return '#f1f5f9';

        const value = state[selectedMetric];
        const maxValue = Math.max(...stateMetrics.map(s => s[selectedMetric] || 0), 1);
        const intensity = value / maxValue;

        // Colors: Light Violet to Deep Indigo
        const colors = ['#f5f3ff', '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'];
        const index = Math.min(Math.floor(intensity * colors.length), colors.length - 1);
        return colors[index];
    };

    const formatValue = (value: number, type: MetricType) => {
        if (type === 'receita' || type === 'ticketMedio') {
            return `R$ ${(value / 1000).toFixed(1)}k`;
        }
        return value.toLocaleString('pt-BR');
    };

    const metrics = [
        { id: 'receita', label: 'Receita', icon: DollarSign },
        { id: 'pedidos', label: 'Pedidos', icon: ShoppingCart },
        { id: 'clientes', label: 'Clientes', icon: Users },
        { id: 'ticketMedio', label: 'Ticket Médio', icon: MapPin },
    ];

    return (
        <Card className="border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                        <CardTitle className="text-sm font-bold">Distribuição Geográfica</CardTitle>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Análise de Vendas por Cidade</p>
                    </div>
                </div>
                <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                    {metrics.map((m) => {
                        const Icon = m.icon;
                        return (
                            <button
                                key={m.id}
                                onClick={() => setSelectedMetric(m.id as MetricType)}
                                className={cn(
                                    "p-1.5 rounded-md transition-all",
                                    selectedMetric === m.id
                                        ? "bg-white dark:bg-zinc-800 shadow-sm text-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                                title={m.label}
                            >
                                <Icon className="h-3.5 w-3.5" />
                            </button>
                        );
                    })}
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
                {/* Map Part */}
                <div className="lg:col-span-7 relative bg-slate-50/50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-2 min-h-[400px] flex items-center justify-center">
                    <ComposableMap
                        projection="geoMercator"
                        projectionConfig={{ scale: 700, center: [-54, -15] }}
                        className="w-full h-full"
                    >
                        <ZoomableGroup zoom={1} maxZoom={5}>
                            <Geographies geography={BRAZIL_GEO_URL}>
                                {({ geographies }) =>
                                    geographies.map((geo) => {
                                        const stateName = geo.properties.name;
                                        const stateData = stateMetrics.find(s => s.name === stateName);
                                        const isHovered = hoveredState === stateName;

                                        return (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                fill={getColor(stateName)}
                                                stroke="#fff"
                                                strokeWidth={isHovered ? 2 : 0.5}
                                                style={{
                                                    default: { outline: 'none' },
                                                    hover: { outline: 'none', fill: '#7c3aed', cursor: 'pointer' },
                                                    pressed: { outline: 'none' },
                                                }}
                                                onMouseEnter={() => {
                                                    setHoveredState(stateName);
                                                    setTooltipContent(stateData || { name: stateName, receita: 0, pedidos: 0, clientes: 0, ticketMedio: 0 });
                                                }}
                                                onMouseLeave={() => {
                                                    setHoveredState(null);
                                                    setTooltipContent(null);
                                                }}
                                            />
                                        );
                                    })
                                }
                            </Geographies>
                        </ZoomableGroup>
                    </ComposableMap>

                    {/* Tooltip Overlay */}
                    {hoveredState && tooltipContent && (
                        <div className="absolute top-4 right-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-4 min-w-[180px] z-20 animate-in fade-in zoom-in duration-200">
                            <h4 className="font-black text-sm tracking-tight text-foreground uppercase">{hoveredState}</h4>
                            <div className="mt-3 space-y-2">
                                <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800 p-1.5 rounded-lg">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Receita</span>
                                    <span className="text-xs font-black text-emerald-600">R$ {Number(tooltipContent.receita).toLocaleString('pt-BR')}</span>
                                </div>
                                <div className="flex justify-between items-center px-1.5">
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase">Pedidos</span>
                                    <span className="text-xs font-bold">{tooltipContent.pedidos}</span>
                                </div>
                                <div className="flex justify-between items-center px-1.5">
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase">Ticket Médio</span>
                                    <span className="text-xs font-bold text-violet-600">R$ {Number(tooltipContent.ticketMedio || 0).toFixed(0)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 flex flex-col items-start bg-white/50 dark:bg-black/50 backdrop-blur-sm p-3 rounded-xl border border-white/20">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Intensidade de {metrics.find(m => m.id === selectedMetric)?.label}</span>
                        <div className="flex gap-0.5">
                            {['#f5f3ff', '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9'].map((c, i) => (
                                <div key={i} className="w-4 h-1.5 rounded-full" style={{ backgroundColor: c }} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table Part - Top Cities */}
                <div className="lg:col-span-5 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-black uppercase tracking-tighter text-muted-foreground flex items-center gap-2">
                            <Trophy className="h-3 w-3 text-yellow-500" />
                            Ranking: Top 10 Cidades
                        </h4>
                        <Badge className="bg-primary/10 text-primary border-none text-[10px]">Por {metrics.find(m => m.id === selectedMetric)?.label}</Badge>
                    </div>
                    <div className="space-y-2.5 flex-grow">
                        {cityMetrics
                            .sort((a, b) => (b[selectedMetric] || 0) - (a[selectedMetric] || 0))
                            .slice(0, 10)
                            .map((city, i) => (
                                <div key={city.name} className="group flex items-center justify-between p-2.5 bg-white dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/50 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all hover:translate-x-1">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-black shadow-sm",
                                            i === 0 ? "bg-yellow-400 text-yellow-900" :
                                                i === 1 ? "bg-zinc-300 text-zinc-800" :
                                                    i === 2 ? "bg-orange-400/30 text-orange-700" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                        )}>
                                            {i + 1}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-foreground tracking-tight">{city.name}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-black text-sm text-primary tracking-tighter">
                                            {formatValue(city[selectedMetric] || 0, selectedMetric)}
                                        </span>
                                    </div>
                                </div>
                            ))}

                        {cityMetrics.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                                <MapPin className="h-8 w-8 mb-2" />
                                <p className="text-xs font-medium uppercase tracking-widest">Sem dados de geolocalização</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                        <p className="text-[10px] text-primary font-bold leading-relaxed">
                            💡 Insight: {cityMetrics[0]?.name.split(' (')[0]} concentra {((cityMetrics[0]?.receita / (rawData.reduce((s, d) => s + (d.receitaProduto || 0), 0) || 1)) * 100).toFixed(1)}% do faturamento total do e-commerce.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black border", className)}>
            {children}
        </span>
    );
}
