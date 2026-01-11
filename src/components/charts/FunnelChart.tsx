'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { funilSaude } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

export function FunnelChart() {
    const maxValor = Math.max(...funilSaude.map(s => s.valor));

    return (
        <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300">Funil de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {funilSaude.map((step, index) => {
                        const width = (step.valor / maxValor) * 100;
                        const isNegative = step.variacaoTaxa < 0;
                        const TrendIcon = step.variacaoTaxa > 0 ? TrendingUp : step.variacaoTaxa < 0 ? TrendingDown : Minus;

                        return (
                            <div key={step.nome} className="group">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-zinc-300">{step.nome}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-zinc-400">{step.valor.toLocaleString('pt-BR')}</span>
                                        <span className={cn(
                                            'flex items-center gap-0.5 text-[10px] font-medium',
                                            isNegative ? 'text-red-400' : 'text-emerald-400'
                                        )}>
                                            <TrendIcon className="h-3 w-3" />
                                            {step.variacaoTaxa > 0 ? '+' : ''}{step.variacaoTaxa.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="relative h-8 rounded-lg bg-zinc-800 overflow-hidden">
                                    <div
                                        className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 transition-all group-hover:from-purple-500 group-hover:to-purple-400"
                                        style={{ width: `${width}%` }}
                                    />
                                    <div className="absolute inset-0 flex items-center px-3">
                                        <span className="text-xs font-bold text-white">
                                            {index > 0 ? `${step.taxa.toFixed(1)}%` : '100%'}
                                        </span>
                                    </div>
                                </div>
                                {index < funilSaude.length - 1 && (
                                    <div className="flex justify-center my-1">
                                        <div className="h-3 w-0.5 bg-zinc-700" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Resumo */}
                <div className="mt-4 flex items-center justify-between rounded-lg bg-zinc-800/50 p-3">
                    <div className="text-center">
                        <p className="text-[10px] text-zinc-500">Taxa Geral</p>
                        <p className="text-lg font-bold text-white">
                            {((funilSaude[funilSaude.length - 1].valor / funilSaude[0].valor) * 100).toFixed(2)}%
                        </p>
                    </div>
                    <div className="h-8 w-px bg-zinc-700" />
                    <div className="text-center">
                        <p className="text-[10px] text-zinc-500">Maior Queda</p>
                        <p className="text-lg font-bold text-red-400">Checkout</p>
                    </div>
                    <div className="h-8 w-px bg-zinc-700" />
                    <div className="text-center">
                        <p className="text-[10px] text-zinc-500">Perda Estimada</p>
                        <p className="text-lg font-bold text-yellow-400">R$ 85k</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
