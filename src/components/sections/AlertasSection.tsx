'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { alertasCriticos } from '@/lib/mockData';
import { AlertTriangle, AlertCircle, Info, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const iconMap = {
    critical: AlertTriangle,
    warning: AlertCircle,
    info: Info,
};

const styleMap = {
    critical: {
        badge: 'bg-red-500/10 text-red-400 border-red-500/30',
        icon: 'text-red-400',
        border: 'border-l-red-500',
    },
    warning: {
        badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        icon: 'text-yellow-400',
        border: 'border-l-yellow-500',
    },
    info: {
        badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        icon: 'text-blue-400',
        border: 'border-l-blue-500',
    },
};

export function AlertasSection() {
    return (
        <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300">Alertas & Incidentes</CardTitle>
                <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-400">
                    {alertasCriticos.filter(a => a.tipo === 'critical').length} críticos
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {alertasCriticos.map((alerta) => {
                        const Icon = iconMap[alerta.tipo];
                        const styles = styleMap[alerta.tipo];

                        return (
                            <div
                                key={alerta.id}
                                className={cn(
                                    'group flex items-start gap-3 rounded-lg border border-l-4 border-zinc-800 bg-zinc-900 p-3 transition-all hover:bg-zinc-800/50 cursor-pointer',
                                    styles.border
                                )}
                            >
                                <div className={cn('mt-0.5 flex h-5 w-5 items-center justify-center rounded', styles.icon)}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-white truncate">{alerta.titulo}</span>
                                        <Badge variant="outline" className={cn('text-[10px]', styles.badge)}>
                                            {alerta.tipo === 'critical' ? 'Crítico' : alerta.tipo === 'warning' ? 'Atenção' : 'Info'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-zinc-400 line-clamp-2">{alerta.descricao}</p>
                                    <div className="mt-2 flex items-center gap-3">
                                        {alerta.impacto && (
                                            <span className="text-[10px] font-medium text-red-400">{alerta.impacto}</span>
                                        )}
                                        <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                                            <Clock className="h-3 w-3" />
                                            {formatDistanceToNow(new Date(alerta.timestamp), { addSuffix: true, locale: ptBR })}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
