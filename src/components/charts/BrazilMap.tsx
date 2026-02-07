'use client';

import { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, DollarSign, ShoppingCart, Users, Trophy, Percent, TrendingUp, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
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

type MetricType = 'receita' | 'pedidos' | 'clientes' | 'ticketMedio' | 'txConversao' | 'roas';
type SortDirection = 'asc' | 'desc';

interface BrazilMapProps {
    rawData?: any[];
    gadsData?: any; // Google Ads data for ROAS calculation
    sessionsData?: any; // Sessions data for conversion rate
}

export function BrazilMap({ rawData = [], gadsData, sessionsData }: BrazilMapProps) {
    const [selectedMetric, setSelectedMetric] = useState<MetricType>('receita');
    const [hoveredState, setHoveredState] = useState<string | null>(null);
    const [tooltipContent, setTooltipContent] = useState<any>(null);
    const [sortBy, setSortBy] = useState<MetricType>('receita');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Total investment from Google Ads
    const totalAdsSpend = gadsData?.spend || 0;
    const totalSessions = sessionsData?.totalSessions || 0;

    // Process data by state with all metrics (for the map visualization)
    const stateMetrics = useMemo(() => {
        const metrics: { [key: string]: { receita: number; pedidos: number; clientes: Set<string>; orders: Set<string>; sessions: number } } = {};

        rawData.forEach((d: any) => {
            const state = d.estado || 'Não informado';
            if (!metrics[state]) {
                metrics[state] = { receita: 0, pedidos: 0, clientes: new Set(), orders: new Set(), sessions: 0 };
            }
            metrics[state].receita += d.receitaProduto || 0;
            if (d.pedido) metrics[state].orders.add(d.pedido);
            if (d.cpfCliente) metrics[state].clientes.add(d.cpfCliente);
        });

        const totalReceita = Object.values(metrics).reduce((sum, m) => sum + m.receita, 0);

        return Object.entries(metrics).map(([name, data]) => {
            const pedidos = data.orders.size;
            const receita = data.receita;
            // Proportion-based metrics (simplified - assuming proportional distribution)
            const revenueShare = totalReceita > 0 ? receita / totalReceita : 0;
            const estimatedSpend = totalAdsSpend * revenueShare;
            const estimatedSessions = Math.round(totalSessions * revenueShare);

            return {
                name,
                receita,
                pedidos,
                clientes: data.clientes.size,
                ticketMedio: pedidos > 0 ? receita / pedidos : 0,
                txConversao: estimatedSessions > 0 ? (pedidos / estimatedSessions) * 100 : 0,
                roas: estimatedSpend > 0 ? receita / estimatedSpend : 0,
                estimatedSpend,
                estimatedSessions
            };
        });
    }, [rawData, totalAdsSpend, totalSessions]);

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

        const totalReceita = Object.values(metrics).reduce((sum, m) => sum + m.receita, 0);

        return Object.entries(metrics).map(([name, data]) => {
            const pedidos = data.orders.size;
            const receita = data.receita;
            const revenueShare = totalReceita > 0 ? receita / totalReceita : 0;
            const estimatedSpend = totalAdsSpend * revenueShare;
            const estimatedSessions = Math.round(totalSessions * revenueShare);

            return {
                name,
                receita,
                pedidos,
                clientes: data.clientes.size,
                ticketMedio: pedidos > 0 ? receita / pedidos : 0,
                txConversao: estimatedSessions > 0 ? (pedidos / estimatedSessions) * 100 : 0,
                roas: estimatedSpend > 0 ? receita / estimatedSpend : 0,
            };
        });
    }, [rawData, totalAdsSpend, totalSessions]);

    // Sorted city metrics
    const sortedCityMetrics = useMemo(() => {
        return [...cityMetrics].sort((a, b) => {
            const aVal = a[sortBy] || 0;
            const bVal = b[sortBy] || 0;
            return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
        });
    }, [cityMetrics, sortBy, sortDirection]);

    const handleSort = (metric: MetricType) => {
        if (sortBy === metric) {
            setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(metric);
            setSortDirection('desc');
        }
    };

    const getColor = (stateName: string) => {
        const state = stateMetrics.find(s => s.name === stateName || stateAbbreviations[s.name] === stateName || stateName.includes(s.name));
        if (!state) return '#f1f5f9';

        const value = state[selectedMetric] || 0;
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
        if (type === 'txConversao') {
            return `${value.toFixed(2)}%`;
        }
        if (type === 'roas') {
            return `${value.toFixed(2)}x`;
        }
        return value.toLocaleString('pt-BR');
    };

    const metrics = [
        { id: 'receita' as MetricType, label: 'Receita', icon: DollarSign, shortLabel: 'Receita' },
        { id: 'pedidos' as MetricType, label: 'Pedidos', icon: ShoppingCart, shortLabel: 'Pedidos' },
        { id: 'clientes' as MetricType, label: 'Clientes', icon: Users, shortLabel: 'Clientes' },
        { id: 'ticketMedio' as MetricType, label: 'Ticket Médio', icon: MapPin, shortLabel: 'Ticket' },
        { id: 'txConversao' as MetricType, label: 'Tx Conversão', icon: Percent, shortLabel: 'Tx Conv' },
        { id: 'roas' as MetricType, label: 'ROAS', icon: TrendingUp, shortLabel: 'ROAS' },
    ];

    const SortIcon = ({ metric }: { metric: MetricType }) => {
        if (sortBy !== metric) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
        return sortDirection === 'desc'
            ? <ChevronDown className="h-3 w-3 text-primary" />
            : <ChevronUp className="h-3 w-3 text-primary" />;
    };

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
                                onClick={() => setSelectedMetric(m.id)}
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
                <div className="lg:col-span-5 relative bg-slate-50/50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-2 min-h-[400px] flex items-center justify-center">
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
                                                    setTooltipContent(stateData || { name: stateName, receita: 0, pedidos: 0, clientes: 0, ticketMedio: 0, txConversao: 0, roas: 0 });
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
                        <div className="absolute top-4 right-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-4 min-w-[200px] z-20 animate-in fade-in zoom-in duration-200">
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
                                <div className="flex justify-between items-center px-1.5">
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase">Tx Conversão</span>
                                    <span className="text-xs font-bold text-blue-600">{(tooltipContent.txConversao || 0).toFixed(2)}%</span>
                                </div>
                                <div className="flex justify-between items-center px-1.5">
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase">ROAS</span>
                                    <span className={cn(
                                        "text-xs font-bold",
                                        (tooltipContent.roas || 0) >= 3 ? "text-emerald-600" : (tooltipContent.roas || 0) >= 2 ? "text-amber-600" : "text-red-600"
                                    )}>{(tooltipContent.roas || 0).toFixed(2)}x</span>
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

                {/* Table Part - Top Cities with Sortable Headers */}
                <div className="lg:col-span-7 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-black uppercase tracking-tighter text-muted-foreground flex items-center gap-2">
                            <Trophy className="h-3 w-3 text-yellow-500" />
                            Ranking: Top 10 Cidades
                        </h4>
                        <span className="text-[10px] text-muted-foreground">Clique para ordenar</span>
                    </div>

                    {/* Sortable Table Header */}
                    <div className="grid grid-cols-12 gap-2 mb-2 px-2">
                        <div className="col-span-4 text-[10px] font-bold text-muted-foreground uppercase">Cidade</div>
                        {[
                            { id: 'receita' as MetricType, label: 'Receita', cols: 3 },
                            { id: 'pedidos' as MetricType, label: 'Pedidos', cols: 2 },
                            { id: 'ticketMedio' as MetricType, label: 'Ticket', cols: 2 },
                            { id: 'txConversao' as MetricType, label: 'Tx Conv', cols: 1 },
                        ].map(col => (
                            <button
                                key={col.id}
                                onClick={() => handleSort(col.id)}
                                className={cn(
                                    `col-span-${col.cols} flex items-center gap-1 text-[10px] font-bold uppercase transition-colors`,
                                    sortBy === col.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {col.label}
                                <SortIcon metric={col.id} />
                            </button>
                        ))}
                    </div>

                    {/* Table Rows */}
                    <div className="space-y-2 flex-grow overflow-y-auto max-h-[400px]">
                        {sortedCityMetrics
                            .slice(0, 10)
                            .map((city, i) => (
                                <div key={city.name} className="group grid grid-cols-12 gap-2 items-center p-2.5 bg-white dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/50 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
                                    <div className="col-span-4 flex items-center gap-2">
                                        <div className={cn(
                                            "w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black shadow-sm shrink-0",
                                            i === 0 ? "bg-yellow-400 text-yellow-900" :
                                                i === 1 ? "bg-zinc-300 text-zinc-800" :
                                                    i === 2 ? "bg-orange-400/30 text-orange-700" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                        )}>
                                            {i + 1}
                                        </div>
                                        <span className="font-bold text-xs text-foreground tracking-tight truncate">{city.name}</span>
                                    </div>
                                    <div className="col-span-3 text-right">
                                        <span className={cn(
                                            "font-bold text-xs",
                                            sortBy === 'receita' ? "text-primary" : "text-foreground"
                                        )}>
                                            R$ {(city.receita / 1000).toFixed(1)}k
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className={cn(
                                            "font-medium text-xs",
                                            sortBy === 'pedidos' ? "text-primary" : "text-muted-foreground"
                                        )}>
                                            {city.pedidos}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className={cn(
                                            "font-medium text-xs",
                                            sortBy === 'ticketMedio' ? "text-primary" : "text-muted-foreground"
                                        )}>
                                            R$ {city.ticketMedio.toFixed(0)}
                                        </span>
                                    </div>
                                    <div className="col-span-1 text-right">
                                        <span className={cn(
                                            "font-medium text-xs",
                                            sortBy === 'txConversao' ? "text-primary" : "text-blue-500"
                                        )}>
                                            {city.txConversao.toFixed(1)}%
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

                    <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                        <p className="text-[10px] text-primary font-bold leading-relaxed">
                            Insight: {sortedCityMetrics[0]?.name.split(' (')[0]} lidera em {metrics.find(m => m.id === sortBy)?.label.toLowerCase()} com {formatValue(sortedCityMetrics[0]?.[sortBy] || 0, sortBy)}.
                            {sortBy === 'roas' && sortedCityMetrics[0]?.roas >= 3 && ' Excelente retorno sobre investimento!'}
                            {sortBy === 'txConversao' && sortedCityMetrics[0]?.txConversao >= 3 && ' Taxa de conversão acima do benchmark!'}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
