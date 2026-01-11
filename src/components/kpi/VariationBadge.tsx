import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface VariationBadgeProps {
    value: number;
    showIcon?: boolean;
    size?: 'sm' | 'md';
    inverted?: boolean; // Para métricas onde "up" é ruim (ex: CAC, abandono)
}

export function VariationBadge({ value, showIcon = true, size = 'sm', inverted = false }: VariationBadgeProps) {
    const isPositive = inverted ? value < 0 : value > 0;
    const isNegative = inverted ? value > 0 : value < 0;
    const isNeutral = value === 0;

    const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-0.5 rounded font-medium',
                size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1',
                isPositive && 'bg-emerald-500/10 text-emerald-400',
                isNegative && 'bg-red-500/10 text-red-400',
                isNeutral && 'bg-zinc-500/10 text-zinc-400'
            )}
        >
            {showIcon && <Icon className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />}
            {value > 0 && '+'}
            {value.toFixed(1)}%
        </span>
    );
}
