'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/MockDataBadge';
import { GlobalDatePicker } from '@/components/ui/GlobalDatePicker';
import { getGA4KPIs } from '@/lib/data/ga4Data';
import { getGoogleAdsKPIs, getGoogleAdsByCampaign } from '@/lib/data/googleAdsData';
import { Brain, MessageSquare, Send, TrendingUp, TrendingDown, Lightbulb, AlertTriangle, CheckCircle, Target } from 'lucide-react';

// Generate insights from real data
const generateInsights = () => {
    const ga4 = getGA4KPIs();
    const gads = getGoogleAdsKPIs();
    const roas = gads.spend > 0 ? ga4.totalRevenue / gads.spend : 0;
    const campaigns = getGoogleAdsByCampaign();

    // Find best and worst campaigns
    const sortedCampaigns = campaigns.sort((a: any, b: any) => {
        const roasA = a.totalCost > 0 ? (a.totalConversions * 80) / a.totalCost : 0;
        const roasB = b.totalCost > 0 ? (b.totalConversions * 80) / b.totalCost : 0;
        return roasB - roasA;
    });
    const bestCampaign = sortedCampaigns[0];
    const worstCampaign = sortedCampaigns[sortedCampaigns.length - 1];

    return {
        roas,
        totalRevenue: ga4.totalRevenue,
        totalSpend: gads.spend,
        totalTransactions: ga4.totalTransactions,
        ticketMedio: ga4.ticketMedio,
        ctr: gads.ctr,
        cpc: gads.cpc,
        conversions: gads.conversions,
        bestCampaign: bestCampaign?.campaign || 'N/A',
        worstCampaign: worstCampaign?.campaign || 'N/A',
        byChannel: ga4.byChannel,
    };
};

export default function DiagnosticoPage() {
    const [pergunta, setPergunta] = useState('');
    const insights = generateInsights();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const initialResponse = `## Análise Integrada GA4 + Google Ads

Baseado nos dados reais das suas planilhas, aqui está o diagnóstico atual:

### 📊 Performance Geral
- **Receita Total:** R$ ${insights.totalRevenue.toFixed(2)}
- **Investimento:** R$ ${insights.totalSpend.toFixed(2)}
- **ROAS:** ${insights.roas.toFixed(2)}x ${insights.roas >= 3 ? '✅' : insights.roas >= 2 ? '⚠️' : '🔴'}
- **Transações:** ${insights.totalTransactions}
- **Ticket Médio:** R$ ${insights.ticketMedio.toFixed(2)}

### 🎯 Campanhas
- **CTR Médio:** ${insights.ctr.toFixed(2)}%
- **CPC Médio:** R$ ${insights.cpc.toFixed(2)}
- **Melhor Campanha:** ${insights.bestCampaign.substring(0, 40)}...
- **Campanha p/ Otimizar:** ${insights.worstCampaign.substring(0, 40)}...

### 💡 Recomendações
1. ${insights.roas < 3 ? 'Aumentar investimento em campanhas de alto ROAS' : 'Manter estratégia atual - ROAS saudável'}
2. ${insights.ctr < 2 ? 'Revisar criativos para melhorar CTR' : 'CTR está acima da média'}
3. Considerar redistribuição de budget para Google CPC (R$ ${insights.byChannel.googleCPC.toFixed(2)} em receita)`;

    const [respostas, setRespostas] = useState<{ pergunta: string; resposta: string }[]>([
        { pergunta: 'Qual é a situação atual do meu e-commerce?', resposta: initialResponse }
    ]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [respostas]);

    const handleEnviar = () => {
        if (!pergunta.trim()) return;

        // Generate dynamic response based on question
        let resposta = '';
        const lowerQ = pergunta.toLowerCase();

        if (lowerQ.includes('roas') || lowerQ.includes('retorno')) {
            resposta = `📈 **Análise de ROAS**\n\nSeu ROAS atual é de **${insights.roas.toFixed(2)}x**.\n\n${insights.roas >= 3
                ? '✅ Excelente! Você está gerando R$' + insights.roas.toFixed(2) + ' para cada R$1 investido.'
                : insights.roas >= 2
                    ? '⚠️ ROAS aceitável, mas há espaço para melhoria. Considere otimizar campanhas de baixo desempenho.'
                    : '🔴 ROAS abaixo do ideal. Recomendo revisar a segmentação e pausar campanhas com baixo retorno.'}\n\nReceita: R$ ${insights.totalRevenue.toFixed(2)}\nInvestimento: R$ ${insights.totalSpend.toFixed(2)}`;
        } else if (lowerQ.includes('campanha') || lowerQ.includes('melhor')) {
            resposta = `🎯 **Análise de Campanhas**\n\n**Top Campanha:**\n${insights.bestCampaign}\n\n**Campanha para Otimizar:**\n${insights.worstCampaign}\n\n💡 Recomendação: Analise os criativos e segmentação da campanha de baixo desempenho e considere realocar budget.`;
        } else if (lowerQ.includes('canal') || lowerQ.includes('tráfego')) {
            resposta = `📊 **Breakdown por Canal (GA4)**\n\n- Google CPC: R$ ${insights.byChannel.googleCPC.toFixed(2)}\n- Blue CPC: R$ ${insights.byChannel.blueCPC.toFixed(2)}\n- Email: R$ ${insights.byChannel.email.toFixed(2)}\n- Direto: R$ ${insights.byChannel.direct.toFixed(2)}\n- Orgânico: R$ ${insights.byChannel.organic.toFixed(2)}\n\n💡 O canal com maior receita é Google CPC. Considere aumentar investimento neste canal.`;
        } else if (lowerQ.includes('cpc') || lowerQ.includes('custo')) {
            resposta = `💰 **Análise de Custos**\n\n- CPC Médio: R$ ${insights.cpc.toFixed(2)}\n- CTR Médio: ${insights.ctr.toFixed(2)}%\n- Conversões: ${insights.conversions.toFixed(1)}\n\n${insights.cpc > 1 ? '⚠️ CPC acima de R$1. Considere otimizar keywords e negativar termos irrelevantes.' : '✅ CPC está em um nível saudável.'}`;
        } else {
            resposta = `Analisando sua pergunta com base nos dados do BD GA4 e BD GAds...\n\n📊 **Dados Disponíveis:**\n- Receita: R$ ${insights.totalRevenue.toFixed(2)}\n- ROAS: ${insights.roas.toFixed(2)}x\n- Transações: ${insights.totalTransactions}\n- CTR: ${insights.ctr.toFixed(2)}%\n\nPara uma análise mais específica, pergunte sobre: ROAS, campanhas, canais, ou custos.`;
        }

        setRespostas([...respostas, { pergunta, resposta }]);
        setPergunta('');
    };

    // Key metrics cards
    const keyMetrics = [
        { label: 'ROAS', value: `${insights.roas.toFixed(2)}x`, status: insights.roas >= 3 ? 'good' : insights.roas >= 2 ? 'warning' : 'bad' },
        { label: 'Receita', value: `R$ ${insights.totalRevenue.toFixed(0)}`, status: 'good' },
        { label: 'Conversões', value: insights.conversions.toFixed(0), status: 'good' },
        { label: 'CTR', value: `${insights.ctr.toFixed(2)}%`, status: insights.ctr >= 2 ? 'good' : 'warning' },
    ];

    return (
        <div className="space-y-6">
            {/* Header with Date Picker */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <PageHeader
                    title="Diagnóstico IA"
                    description="Root Cause Analysis com dados reais do GA4 e Google Ads"
                    hasRealData={true}
                />
                <GlobalDatePicker />
            </div>

            {/* Key Metrics */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {keyMetrics.map((metric, index) => (
                    <Card key={index} className="border-border bg-card">
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                                    <p className="text-xl font-bold text-foreground">{metric.value}</p>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${metric.status === 'good' ? 'bg-emerald-500' :
                                    metric.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                                    }`} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Insights Panel */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="border-border bg-card">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-card-foreground flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-amber-500" />
                                Insights Automáticos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {insights.roas >= 3 ? (
                                <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">ROAS Excelente</p>
                                        <p className="text-xs text-muted-foreground">Retorno de {insights.roas.toFixed(2)}x sobre investimento</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">ROAS para Otimizar</p>
                                        <p className="text-xs text-muted-foreground">Atual: {insights.roas.toFixed(2)}x - Meta: 3x</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-foreground">Top Canal</p>
                                    <p className="text-xs text-muted-foreground">Google CPC gerando R$ {insights.byChannel.googleCPC.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                                <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-foreground">Ticket Médio</p>
                                    <p className="text-xs text-muted-foreground">R$ {insights.ticketMedio.toFixed(2)} por pedido</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Chat Interface */}
                <div className="lg:col-span-2">
                    <Card className="border-border bg-card h-full flex flex-col">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                                <Brain className="h-4 w-4 text-white" />
                            </div>
                            <CardTitle className="text-sm font-medium text-card-foreground">Pergunte aos Dados</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                            {/* Respostas */}
                            <div className="flex-1 space-y-4 mb-4 max-h-[400px] overflow-y-auto">
                                {respostas.map((item, index) => (
                                    <div key={index} className="space-y-3">
                                        <div className="flex justify-end">
                                            <div className="max-w-[80%] rounded-lg bg-primary/10 p-3">
                                                <p className="text-sm text-foreground">{item.pergunta}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-start">
                                            <div className="max-w-[90%] rounded-lg bg-muted p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Brain className="h-4 w-4 text-purple-500" />
                                                    <span className="text-xs text-purple-500 font-medium">IA Assistant</span>
                                                </div>
                                                <div className="text-sm text-foreground whitespace-pre-wrap">{item.resposta}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Sugestões */}
                            <div className="flex gap-2 mb-3 flex-wrap">
                                {['Como está o ROAS?', 'Qual a melhor campanha?', 'Análise de canais'].map((sugestao) => (
                                    <Button
                                        key={sugestao}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => setPergunta(sugestao)}
                                    >
                                        {sugestao}
                                    </Button>
                                ))}
                            </div>

                            {/* Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={pergunta}
                                    onChange={(e) => setPergunta(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleEnviar()}
                                    placeholder="Ex: Como está meu ROAS? Qual canal converte mais?"
                                    className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                                />
                                <Button onClick={handleEnviar} className="bg-purple-600 hover:bg-purple-700">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
