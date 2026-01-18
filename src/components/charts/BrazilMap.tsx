'use client';

import { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, DollarSign, ShoppingCart, Users } from 'lucide-react';

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

interface StateData {
    name: string;
    receita: number;
    pedidos: number;
    clientes: number;
}

interface BrazilMapProps {
    byState?: StateData[];
    rawData?: any[];
}

export function BrazilMap({ byState = [], rawData = [] }: BrazilMapProps) {
    const [selectedMetric, setSelectedMetric] = useState<MetricType>('receita');
    const [hoveredState, setHoveredState] = useState<string | null>(null);
    const [tooltipContent, setTooltipContent] = useState<any>(null);

    // Process data by state with all metrics
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

    // Get max value for color scale
    const maxValue = useMemo(() => {
        if (stateMetrics.length === 0) return 1;
        return Math.max(...stateMetrics.map(s => s[selectedMetric] || 0));
    }, [stateMetrics, selectedMetric]);

    // Get color based on value
    const getColor = (stateName: string) => {
        const stateData = stateMetrics.find(s => s.name === stateName);
        if (!stateData) return '#e2e8f0';

        const value = stateData[selectedMetric] || 0;
        const intensity = Math.min(value / maxValue, 1);

        // Color scale from light to dark purple
        const colors = ['#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7c3aed', '#6d28d9'];
        const index = Math.floor(intensity * (colors.length - 1));
        return colors[index];
    };

    // Format value based on metric
    const formatValue = (value: number, metric: MetricType) => {
        switch (metric) {
            case 'receita':
            case 'ticketMedio':
                return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            default:
                return value.toLocaleString('pt-BR');
        }
    };

    const metrics = [
        { id: 'receita' as MetricType, label: 'Receita', icon: DollarSign },
        { id: 'pedidos' as MetricType, label: 'Pedidos', icon: ShoppingCart },
        { id: 'clientes' as MetricType, label: 'Clientes', icon: Users },
        { id: 'ticketMedio' as MetricType, label: 'Ticket Médio', icon: DollarSign },
    ];

    return (
        <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm font-medium text-card-foreground">Mapa de Vendas por Estado</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                {/* Metric Selector */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {metrics.map((metric) => {
                        const Icon = metric.icon;
                        return (
                            <button
                                key={metric.id}
                                onClick={() => setSelectedMetric(metric.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedMetric === metric.id
                                        ? 'bg-primary text-primary-foreground shadow-lg'
                                        : 'bg-slate-100 dark:bg-zinc-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-zinc-700'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {metric.label}
                            </button>
                        );
                    })}
                </div>

                {/* Map Container */}
                <div className="relative h-[400px] w-full rounded-lg overflow-hidden bg-slate-50 dark:bg-zinc-800/50">
                    <ComposableMap
                        projection="geoMercator"
                        projectionConfig={{
                            scale: 800,
                            center: [-55, -15]
                        }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <ZoomableGroup>
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
                                                    hover: { outline: 'none', fill: '#7c3aed' },
                                                    pressed: { outline: 'none' },
                                                }}
                                                onMouseEnter={() => {
                                                    setHoveredState(stateName);
                                                    setTooltipContent(stateData);
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

                    {/* Tooltip */}
                    {hoveredState && tooltipContent && (
                        <div className="absolute top-4 right-4 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-slate-200 dark:border-zinc-700 p-4 min-w-[200px]">
                            <h4 className="font-bold text-lg text-foreground">{hoveredState}</h4>
                            <p className="text-xs text-muted-foreground mb-3">{stateAbbreviations[hoveredState] || ''}</p>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Receita:</span>
                                    <span className="font-semibold text-green-600">
                                        {formatValue(tooltipContent.receita, 'receita')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Pedidos:</span>
                                    <span className="font-semibold">{tooltipContent.pedidos}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Clientes:</span>
                                    <span className="font-semibold">{tooltipContent.clientes}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Ticket Médio:</span>
                                    <span className="font-semibold text-purple-600">
                                        {formatValue(tooltipContent.ticketMedio, 'ticketMedio')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-slate-200 dark:border-zinc-700 p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                            {metrics.find(m => m.id === selectedMetric)?.label}
                        </p>
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Baixo</span>
                            <div className="flex">
                                {['#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7c3aed', '#6d28d9'].map((color, i) => (
                                    <div key={i} className="w-4 h-4" style={{ backgroundColor: color }} />
                                ))}
                            </div>
                            <span className="text-xs text-muted-foreground">Alto</span>
                        </div>
                    </div>
                </div>

                {/* Top States Table */}
                <div className="mt-4">
                    <h4 className="text-sm font-medium text-card-foreground mb-2">Top 5 Estados</h4>
                    <div className="space-y-2">
                        {stateMetrics
                            .sort((a, b) => (b[selectedMetric] || 0) - (a[selectedMetric] || 0))
                            .slice(0, 5)
                            .map((state, i) => (
                                <div key={state.name} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-zinc-800/50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 flex items-center justify-center bg-primary/10 text-primary rounded-full text-xs font-bold">
                                            {i + 1}
                                        </span>
                                        <span className="font-medium text-sm">{state.name}</span>
                                    </div>
                                    <span className="font-semibold text-sm text-primary">
                                        {formatValue(state[selectedMetric] || 0, selectedMetric)}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
