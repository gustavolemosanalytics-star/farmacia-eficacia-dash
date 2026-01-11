'use client';

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TimeSeriesPoint } from '@/types/dashboard';

interface TimeSeriesChartProps {
    data: TimeSeriesPoint[];
    title: string;
    dataKey?: string;
    color?: string;
    showComparison?: boolean;
    formatValue?: (value: number) => string;
}

export function TimeSeriesChart({
    data,
    title,
    dataKey = 'valor',
    color = '#8b5cf6',
    showComparison = true,
    formatValue = (v) => v.toLocaleString('pt-BR'),
}: TimeSeriesChartProps) {
    return (
        <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorComparison" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#71717a" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis
                            dataKey="data"
                            stroke="#52525b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: ptBR })}
                        />
                        <YAxis
                            stroke="#52525b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => {
                                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                                return value.toString();
                            }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#18181b',
                                border: '1px solid #27272a',
                                borderRadius: '8px',
                                fontSize: '12px',
                            }}
                            labelFormatter={(value) => format(new Date(value as string), "dd 'de' MMMM", { locale: ptBR })}
                            formatter={(value, name) => [
                                formatValue(value as number),
                                name === 'valor' ? 'Período Atual' : 'Período Anterior',
                            ]}
                        />
                        {showComparison && (
                            <Area
                                type="monotone"
                                dataKey="comparativo"
                                stroke="#71717a"
                                strokeWidth={1}
                                strokeDasharray="4 4"
                                fillOpacity={1}
                                fill="url(#colorComparison)"
                            />
                        )}
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorMain)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
