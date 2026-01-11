'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { planosAcaoIA } from '@/lib/mockData';
import { Sparkles, Check, Clock, Play, ChevronRight, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const prioridadeStyles = {
    P0: 'bg-red-500/10 text-red-400 border-red-500/30',
    P1: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    P2: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
};

const statusStyles = {
    pendente: { icon: Clock, text: 'Pendente', class: 'text-zinc-400' },
    em_andamento: { icon: Play, text: 'Em andamento', class: 'text-yellow-400' },
    concluido: { icon: Check, text: 'Concluído', class: 'text-emerald-400' },
};

export function PlanoAcaoIA() {
    return (
        <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                    <CardTitle className="text-sm font-medium text-zinc-300">Plano de Ação IA</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
                    Ver todos <ChevronRight className="h-3 w-3" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {planosAcaoIA.slice(0, 5).map((acao) => {
                        const StatusIcon = statusStyles[acao.status].icon;

                        return (
                            <div
                                key={acao.id}
                                className="group rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-800/50"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={cn('text-[10px] font-bold', prioridadeStyles[acao.prioridade])}>
                                            {acao.prioridade}
                                        </Badge>
                                        <span className={cn('flex items-center gap-1 text-[10px]', statusStyles[acao.status].class)}>
                                            <StatusIcon className="h-3 w-3" />
                                            {statusStyles[acao.status].text}
                                        </span>
                                    </div>
                                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-400">
                                        {acao.impactoEstimado}
                                    </Badge>
                                </div>

                                {/* Hipótese */}
                                <h4 className="text-sm font-medium text-white mb-1">
                                    {acao.hipotese}
                                </h4>

                                {/* Evidência */}
                                <p className="text-xs text-zinc-400 mb-2 line-clamp-2">
                                    <span className="text-zinc-500">Evidência:</span> {acao.evidencia}
                                </p>

                                {/* Ação */}
                                <div className="rounded-md bg-zinc-800/50 p-2 mb-2">
                                    <p className="text-xs text-zinc-300">
                                        <span className="text-zinc-500">Ação:</span> {acao.acao}
                                    </p>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                                        <User className="h-3 w-3" />
                                        {acao.responsavel}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 gap-1 text-[10px] text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Iniciar <ChevronRight className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
