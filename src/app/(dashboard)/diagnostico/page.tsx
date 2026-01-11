'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { alertasCriticos, planosAcaoIA } from '@/lib/mockData';
import { Brain, MessageSquare, Send, Clock, AlertTriangle, CheckCircle, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DiagnosticoPage() {
    const [pergunta, setPergunta] = useState('');
    const [respostas, setRespostas] = useState<{ pergunta: string; resposta: string }[]>([
        {
            pergunta: 'Por que a receita caiu tanto este mês?',
            resposta: 'A análise indica que a queda de receita (-61%) foi causada principalmente por:\n\n1. **Colapso do tráfego orgânico** (-71%): O site perdeu posicionamento em keywords importantes após o Google Core Update de Dezembro/25.\n\n2. **CR Mobile degradado** (-45%): Core Web Vitals ruins (LCP 4.8s) estão afetando conversões mobile.\n\n3. **SKUs bloqueados** (324): 18% do catálogo está inativo no Google Shopping.\n\nRecomendação: Priorizar auditoria SEO técnica e otimização de performance mobile.'
        }
    ]);

    const handleEnviar = () => {
        if (!pergunta.trim()) return;
        setRespostas([...respostas, {
            pergunta,
            resposta: 'Analisando seus dados... Esta é uma simulação. Em produção, a IA analisaria seus dados reais e retornaria insights acionáveis com evidências.'
        }]);
        setPergunta('');
    };

    return (
        <div className="space-y-6">
            {/* Título */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                    <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Sala de Diagnóstico IA</h1>
                    <p className="text-sm text-zinc-400">Root Cause Analysis automatizada</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timeline de Incidentes */}
                <div className="lg:col-span-1">
                    <Card className="border-zinc-800 bg-zinc-900/50 h-full">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-zinc-300">Timeline de Incidentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {alertasCriticos.map((alerta) => (
                                    <div key={alerta.id} className="relative pl-6 pb-4 border-l-2 border-zinc-800 last:border-l-0">
                                        <div className={`absolute left-[-5px] top-0 w-2 h-2 rounded-full ${alerta.tipo === 'critical' ? 'bg-red-500' : alerta.tipo === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                                            }`} />
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={alerta.tipo === 'critical' ? 'destructive' : 'secondary'} className="text-[10px]">
                                                    {alerta.tipo === 'critical' ? 'Crítico' : alerta.tipo === 'warning' ? 'Atenção' : 'Info'}
                                                </Badge>
                                                <span className="text-[10px] text-zinc-500">
                                                    {formatDistanceToNow(new Date(alerta.timestamp), { addSuffix: true, locale: ptBR })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-300">{alerta.titulo}</p>
                                            {alerta.impacto && (
                                                <p className="text-[10px] text-red-400">{alerta.impacto}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Chat Interface */}
                <div className="lg:col-span-2">
                    <Card className="border-zinc-800 bg-zinc-900/50 h-full flex flex-col">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-purple-400" />
                            <CardTitle className="text-sm font-medium text-zinc-300">Pergunte aos Dados</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                            {/* Respostas */}
                            <div className="flex-1 space-y-4 mb-4 max-h-[400px] overflow-y-auto">
                                {respostas.map((item, index) => (
                                    <div key={index} className="space-y-3">
                                        <div className="flex justify-end">
                                            <div className="max-w-[80%] rounded-lg bg-purple-500/20 p-3">
                                                <p className="text-sm text-purple-200">{item.pergunta}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-start">
                                            <div className="max-w-[90%] rounded-lg bg-zinc-800 p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Brain className="h-4 w-4 text-purple-400" />
                                                    <span className="text-xs text-purple-400">IA Assistant</span>
                                                </div>
                                                <div className="text-sm text-zinc-300 whitespace-pre-wrap">{item.resposta}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={pergunta}
                                    onChange={(e) => setPergunta(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleEnviar()}
                                    placeholder="Ex: Por que o CR mobile caiu?"
                                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-purple-500 focus:outline-none"
                                />
                                <Button onClick={handleEnviar} className="bg-purple-600 hover:bg-purple-700">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Ações Sugeridas */}
            <section>
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-zinc-300">Ações Sugeridas pela IA</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {planosAcaoIA.slice(0, 4).map((acao) => (
                                <div key={acao.id} className="flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-900">
                                    <div className="flex items-center gap-4">
                                        <Badge variant={acao.prioridade === 'P0' ? 'destructive' : 'secondary'}>
                                            {acao.prioridade}
                                        </Badge>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-300">{acao.hipotese}</p>
                                            <p className="text-xs text-zinc-500">{acao.responsavel} • {acao.impactoEstimado}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {acao.status === 'em_andamento' ? (
                                            <Badge variant="outline" className="border-yellow-500/30 bg-yellow-500/10 text-yellow-400">
                                                <Play className="h-3 w-3 mr-1" /> Em andamento
                                            </Badge>
                                        ) : acao.status === 'concluido' ? (
                                            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                                                <CheckCircle className="h-3 w-3 mr-1" /> Concluído
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="border-zinc-500/30 text-zinc-400">
                                                <Clock className="h-3 w-3 mr-1" /> Pendente
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
