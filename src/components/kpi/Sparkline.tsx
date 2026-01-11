'use client';

import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface SparklineProps {
    data: number[];
    color?: 'green' | 'red' | 'yellow';
    height?: number;
}

export function Sparkline({ data, color = 'green', height = 32 }: SparklineProps) {
    const chartData = data.map((value, index) => ({ value, index }));

    const colors = {
        green: { stroke: '#22c55e', fill: 'url(#sparklineGreen)' },
        red: { stroke: '#ef4444', fill: 'url(#sparklineRed)' },
        yellow: { stroke: '#eab308', fill: 'url(#sparklineYellow)' },
    };

    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="sparklineGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="sparklineRed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="sparklineYellow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#eab308" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#eab308" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke={colors[color].stroke}
                    strokeWidth={1.5}
                    fill={colors[color].fill}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
