// Mock Data Expandido - Dados para todas as páginas
// Cenário: Queda de Receita por Crash no Tráfego Orgânico

import type { KPIData, FunnelStep, AlertaData, AcaoIA, HeatmapData, TimeSeriesPoint } from '@/types/dashboard';

// ============================================
// HELPERS
// ============================================
const gerarSparkline = (tendencia: 'down' | 'up' | 'stable', pontos: number = 7): number[] => {
    const base = Math.random() * 100 + 50;
    return Array.from({ length: pontos }, (_, i) => {
        if (tendencia === 'down') return base * (1 - (i * 0.1) + Math.random() * 0.1);
        if (tendencia === 'up') return base * (1 + (i * 0.05) + Math.random() * 0.1);
        return base + (Math.random() - 0.5) * 20;
    });
};

const gerarTimeSeries = (dias: number, valorBase: number, tendencia: 'down' | 'up' | 'stable' = 'stable'): TimeSeriesPoint[] => {
    return Array.from({ length: dias }, (_, i) => {
        const data = new Date();
        data.setDate(data.getDate() - (dias - 1 - i));
        let fator = 1;
        if (tendencia === 'down') fator = 1 - ((i / dias) * 0.5);
        if (tendencia === 'up') fator = 1 + ((i / dias) * 0.3);
        return {
            data: data.toISOString().split('T')[0],
            valor: Math.round(valorBase * fator * (0.9 + Math.random() * 0.2)),
            comparativo: Math.round(valorBase * (0.9 + Math.random() * 0.2)),
        };
    });
};

// ============================================
// HOME EXECUTIVA (CEO)
// ============================================
export const kpisprincipais: KPIData[] = [
    {
        id: 'gmv',
        titulo: 'GMV',
        valor: 234500,
        valorFormatado: 'R$ 234.5k',
        variacao: -61.2,
        meta: 600000,
        tendencia: 'down',
        sparklineData: [580000, 520000, 410000, 350000, 280000, 250000, 234500],
        unidade: 'R$',
    },
    {
        id: 'receita_liquida',
        titulo: 'Receita Líquida',
        valor: 198200,
        valorFormatado: 'R$ 198.2k',
        variacao: -63.8,
        meta: 550000,
        tendencia: 'down',
        sparklineData: [540000, 480000, 390000, 320000, 260000, 220000, 198200],
        unidade: 'R$',
    },
    {
        id: 'pedidos',
        titulo: 'Pedidos',
        valor: 1847,
        valorFormatado: '1.847',
        variacao: -58.4,
        meta: 4500,
        tendencia: 'down',
        sparklineData: [4200, 3800, 3100, 2600, 2200, 2000, 1847],
    },
    {
        id: 'cr',
        titulo: 'Taxa de Conversão',
        valor: 1.24,
        valorFormatado: '1.24%',
        variacao: -42.3,
        meta: 2.5,
        tendencia: 'down',
        sparklineData: [2.3, 2.1, 1.8, 1.6, 1.4, 1.3, 1.24],
        unidade: '%',
    },
    {
        id: 'sessoes',
        titulo: 'Sessões',
        valor: 148920,
        valorFormatado: '148.9k',
        variacao: -52.1,
        meta: 320000,
        tendencia: 'down',
        sparklineData: [310000, 280000, 240000, 200000, 170000, 155000, 148920],
    },
    {
        id: 'cac_paid',
        titulo: 'CAC Pago',
        valor: 89.50,
        valorFormatado: 'R$ 89,50',
        variacao: 12.3,
        meta: 75,
        tendencia: 'up',
        sparklineData: [72, 75, 78, 82, 85, 87, 89.5],
        unidade: 'R$',
    },
    {
        id: 'roas',
        titulo: 'ROAS',
        valor: 3.2,
        valorFormatado: '3.2x',
        variacao: -8.5,
        meta: 4.0,
        tendencia: 'down',
        sparklineData: [3.8, 3.6, 3.5, 3.4, 3.3, 3.2, 3.2],
        unidade: 'x',
    },
    {
        id: 'aov',
        titulo: 'Ticket Médio',
        valor: 127.80,
        valorFormatado: 'R$ 127,80',
        variacao: -5.2,
        meta: 140,
        tendencia: 'down',
        sparklineData: [138, 135, 132, 130, 128, 127, 127.8],
        unidade: 'R$',
    },
    {
        id: 'margem',
        titulo: 'Margem Bruta',
        valor: 34.2,
        valorFormatado: '34.2%',
        variacao: -2.1,
        meta: 38,
        tendencia: 'down',
        sparklineData: [36.5, 36, 35.5, 35, 34.5, 34.3, 34.2],
        unidade: '%',
    },
];

// ============================================
// AQUISIÇÃO & TRÁFEGO
// ============================================
export const kpisAquisicao: KPIData[] = [
    { id: 'sessoes_total', titulo: 'Sessões', valor: 148920, valorFormatado: '148.9k', variacao: -52.1, meta: 320000, tendencia: 'down', sparklineData: gerarSparkline('down') },
    { id: 'novos_usuarios', titulo: 'Novos Usuários', valor: 98540, valorFormatado: '98.5k', variacao: -58.3, meta: 220000, tendencia: 'down', sparklineData: gerarSparkline('down') },
    { id: 'engajamento', titulo: 'Engajamento', valor: 42.5, valorFormatado: '42.5%', variacao: -8.2, meta: 55, tendencia: 'down', sparklineData: gerarSparkline('down'), unidade: '%' },
    { id: 'bounce_rate', titulo: 'Bounce Rate', valor: 58.3, valorFormatado: '58.3%', variacao: 15.4, meta: 45, tendencia: 'up', sparklineData: gerarSparkline('up'), unidade: '%' },
    { id: 'duracao_media', titulo: 'Duração Média', valor: 2.45, valorFormatado: '2:45', variacao: -22.1, meta: 4, tendencia: 'down', sparklineData: gerarSparkline('down'), unidade: 'min' },
    { id: 'paginas_sessao', titulo: 'Páginas/Sessão', valor: 3.2, valorFormatado: '3.2', variacao: -18.5, meta: 4.5, tendencia: 'down', sparklineData: gerarSparkline('down') },
];

export const tabelaCanais = [
    { canal: 'Organic Search', sessoes: 42500, usuarios: 38200, cr: 0.92, receita: 58200, variacao: -71.2 },
    { canal: 'Paid Search', sessoes: 35400, usuarios: 28500, cr: 1.85, receita: 42800, variacao: 3.5 },
    { canal: 'Paid Social', sessoes: 33000, usuarios: 29800, cr: 1.78, receita: 30000, variacao: 1.2 },
    { canal: 'Email', sessoes: 18200, usuarios: 12400, cr: 3.45, receita: 42500, variacao: -12.5 },
    { canal: 'Direct', sessoes: 15820, usuarios: 11200, cr: 1.56, receita: 18700, variacao: -28.4 },
    { canal: 'Referral', sessoes: 4000, usuarios: 3200, cr: 1.28, receita: 6000, variacao: -15.2 },
];

export const topLandingPages = [
    { pagina: '/produtos/eletronicos', sessoes: 18500, bounce: 45.2, receita: 32400, variacao: -65.3 },
    { pagina: '/', sessoes: 15200, bounce: 52.1, receita: 28500, variacao: -58.2 },
    { pagina: '/produtos/smartphones', sessoes: 12800, bounce: 38.5, receita: 45200, variacao: -72.1 },
    { pagina: '/promocoes', sessoes: 11500, bounce: 48.3, receita: 22100, variacao: -45.8 },
    { pagina: '/produtos/acessorios', sessoes: 9800, bounce: 55.7, receita: 12400, variacao: -52.3 },
    { pagina: '/categoria/beleza', sessoes: 8500, bounce: 42.8, receita: 18900, variacao: -48.5 },
    { pagina: '/outlet', sessoes: 7200, bounce: 35.2, receita: 8500, variacao: -38.2 },
    { pagina: '/produtos/casa-jardim', sessoes: 6800, bounce: 58.9, receita: 9200, variacao: -68.5 },
];

export const dadosAtribuicao = {
    lastClick: [
        { canal: 'Paid Search', receita: 42800, percentual: 21.6 },
        { canal: 'Paid Social', receita: 30000, percentual: 15.1 },
        { canal: 'Email', receita: 42500, percentual: 21.4 },
        { canal: 'Organic', receita: 58200, percentual: 29.3 },
        { canal: 'Direct', receita: 18700, percentual: 9.4 },
        { canal: 'Referral', receita: 6000, percentual: 3.0 },
    ],
    dataDriven: [
        { canal: 'Paid Search', receita: 52300, percentual: 26.4 },
        { canal: 'Paid Social', receita: 38500, percentual: 19.4 },
        { canal: 'Email', receita: 35200, percentual: 17.8 },
        { canal: 'Organic', receita: 48200, percentual: 24.3 },
        { canal: 'Direct', receita: 15800, percentual: 8.0 },
        { canal: 'Referral', receita: 8200, percentual: 4.1 },
    ],
};

// ============================================
// FUNIL E-COMMERCE (CRO)
// ============================================
export const funilSaude: FunnelStep[] = [
    { nome: 'Visualização de Produto', valor: 89500, taxa: 100, variacaoTaxa: 0 },
    { nome: 'Add to Cart', valor: 12450, taxa: 13.91, variacaoTaxa: -18.5 },
    { nome: 'Checkout Iniciado', valor: 5820, taxa: 46.75, variacaoTaxa: -8.2 },
    { nome: 'Info Adicionada', valor: 4650, taxa: 79.90, variacaoTaxa: -2.1 },
    { nome: 'Pagamento', valor: 2180, taxa: 46.88, variacaoTaxa: -15.3 },
    { nome: 'Compra', valor: 1847, taxa: 84.72, variacaoTaxa: 1.2 },
];

export const metrícasFunil: KPIData[] = [
    { id: 'add_to_cart', titulo: 'Add to Cart', valor: 13.91, valorFormatado: '13.91%', variacao: -18.5, meta: 18, tendencia: 'down', sparklineData: gerarSparkline('down'), unidade: '%' },
    { id: 'checkout_iniciado', titulo: 'Checkout Iniciado', valor: 46.75, valorFormatado: '46.75%', variacao: -8.2, meta: 55, tendencia: 'down', sparklineData: gerarSparkline('down'), unidade: '%' },
    { id: 'checkout_completo', titulo: 'Checkout Completo', valor: 31.74, valorFormatado: '31.74%', variacao: -22.4, meta: 45, tendencia: 'down', sparklineData: gerarSparkline('down'), unidade: '%' },
    { id: 'abandono_carrinho', titulo: 'Abandono Carrinho', valor: 68.26, valorFormatado: '68.26%', variacao: 15.8, meta: 55, tendencia: 'up', sparklineData: gerarSparkline('up'), unidade: '%' },
    { id: 'aprovacao_pagamento', titulo: 'Aprovação Pagamento', valor: 84.72, valorFormatado: '84.72%', variacao: 1.2, meta: 88, tendencia: 'stable', sparklineData: gerarSparkline('stable'), unidade: '%' },
    { id: 'tempo_compra', titulo: 'Tempo até Compra', valor: 4.2, valorFormatado: '4.2 dias', variacao: 35.5, meta: 3, tendencia: 'up', sparklineData: gerarSparkline('up'), unidade: 'dias' },
];

export const buscaInterna = [
    { termo: 'iphone 15', buscas: 2450, resultados: 12, cr: 4.2, receita: 45200 },
    { termo: 'samsung galaxy', buscas: 1820, resultados: 18, cr: 3.8, receita: 32100 },
    { termo: 'fone bluetooth', buscas: 1540, resultados: 45, cr: 5.2, receita: 18500 },
    { termo: 'notebook gamer', buscas: 1280, resultados: 8, cr: 2.1, receita: 28400 },
    { termo: 'smartwatch', buscas: 980, resultados: 22, cr: 4.5, receita: 12800 },
    { termo: 'carregador turbo', buscas: 850, resultados: 0, cr: 0, receita: 0 },
    { termo: 'capinha iphone', buscas: 720, resultados: 85, cr: 8.2, receita: 5400 },
    { termo: 'mouse gamer', buscas: 680, resultados: 0, cr: 0, receita: 0 },
];

export const errosCheckout = [
    { erro: 'Falha no pagamento - Cartão recusado', ocorrencias: 245, impacto: 32500 },
    { erro: 'CEP não encontrado', ocorrencias: 128, impacto: 15800 },
    { erro: 'Timeout na finalização', ocorrencias: 89, impacto: 12200 },
    { erro: 'Produto sem estoque no checkout', ocorrencias: 67, impacto: 8900 },
    { erro: 'Erro de CPF inválido', ocorrencias: 45, impacto: 5400 },
];

// ============================================
// CATÁLOGO & MERCHANDISING
// ============================================
export const kpisCatalogo: KPIData[] = [
    { id: 'skus_ativos', titulo: 'SKUs Ativos', valor: 4528, valorFormatado: '4.528', variacao: -2.5, meta: 5000, tendencia: 'down', sparklineData: gerarSparkline('stable') },
    { id: 'skus_sem_venda', titulo: 'Sem Venda (30d)', valor: 892, valorFormatado: '892', variacao: 18.5, meta: 500, tendencia: 'up', sparklineData: gerarSparkline('up') },
    { id: 'skus_ruptura', titulo: 'Em Ruptura', valor: 234, valorFormatado: '234', variacao: 45.2, meta: 100, tendencia: 'up', sparklineData: gerarSparkline('up') },
    { id: 'qualidade_media', titulo: 'Quality Score', valor: 72.5, valorFormatado: '72.5%', variacao: -5.8, meta: 85, tendencia: 'down', sparklineData: gerarSparkline('down'), unidade: '%' },
];

export const topSkusReceita = [
    { sku: 'IPHONE15-128GB-BLK', nome: 'iPhone 15 128GB Preto', receita: 45200, margem: 18.5, estoque: 24 },
    { sku: 'GALAXY-S24-256GB', nome: 'Samsung Galaxy S24 256GB', receita: 38500, margem: 22.3, estoque: 32 },
    { sku: 'MACBOOK-AIR-M2', nome: 'MacBook Air M2 13"', receita: 32100, margem: 15.8, estoque: 8 },
    { sku: 'AIRPODS-PRO-2', nome: 'AirPods Pro 2', receita: 28400, margem: 28.5, estoque: 45 },
    { sku: 'PS5-DIGITAL', nome: 'PlayStation 5 Digital', receita: 24800, margem: 12.2, estoque: 5 },
];

export const merchantCenterStatus = {
    aprovados: 3892,
    reprovados: 324,
    pendentes: 312,
    motivos: [
        { motivo: 'Preço inconsistente', quantidade: 128 },
        { motivo: 'Imagem de baixa qualidade', quantidade: 85 },
        { motivo: 'Descrição insuficiente', quantidade: 52 },
        { motivo: 'Estoque zerado', quantidade: 38 },
        { motivo: 'GTIN inválido', quantidade: 21 },
    ],
};

// ============================================
// MÍDIA PAGA (ADS)
// ============================================
export const kpisMidiaPaga: KPIData[] = [
    { id: 'spend', titulo: 'Investimento', valor: 68500, valorFormatado: 'R$ 68.5k', variacao: 2.8, meta: 70000, tendencia: 'stable', sparklineData: gerarSparkline('stable'), unidade: 'R$' },
    { id: 'impressoes', titulo: 'Impressões', valor: 2450000, valorFormatado: '2.45M', variacao: 5.2, tendencia: 'up', sparklineData: gerarSparkline('up') },
    { id: 'cliques', titulo: 'Cliques', valor: 85200, valorFormatado: '85.2k', variacao: 3.5, tendencia: 'up', sparklineData: gerarSparkline('up') },
    { id: 'ctr', titulo: 'CTR', valor: 3.48, valorFormatado: '3.48%', variacao: -1.5, meta: 4, tendencia: 'down', sparklineData: gerarSparkline('stable'), unidade: '%' },
    { id: 'cpc', titulo: 'CPC', valor: 0.80, valorFormatado: 'R$ 0,80', variacao: -0.8, meta: 0.75, tendencia: 'stable', sparklineData: gerarSparkline('stable'), unidade: 'R$' },
    { id: 'roas_ads', titulo: 'ROAS', valor: 3.42, valorFormatado: '3.42x', variacao: -5.2, meta: 4, tendencia: 'down', sparklineData: gerarSparkline('down'), unidade: 'x' },
    { id: 'mer', titulo: 'MER', valor: 2.89, valorFormatado: '2.89x', variacao: -8.5, meta: 3.5, tendencia: 'down', sparklineData: gerarSparkline('down'), unidade: 'x' },
];

export const campanhasGoogle = [
    { campanha: 'PMax - Eletrônicos', tipo: 'PMax', spend: 18500, impressoes: 450000, cliques: 15200, ctr: 3.38, cpc: 1.22, conversoes: 285, roas: 4.2 },
    { campanha: 'Shopping - Smartphones', tipo: 'Shopping', spend: 12800, impressoes: 320000, cliques: 12500, ctr: 3.91, cpc: 1.02, conversoes: 198, roas: 3.8 },
    { campanha: 'Search - Marca', tipo: 'Search', spend: 8500, impressoes: 85000, cliques: 8200, ctr: 9.65, cpc: 1.04, conversoes: 145, roas: 5.2 },
    { campanha: 'PMax - Casa', tipo: 'PMax', spend: 5200, impressoes: 180000, cliques: 5800, ctr: 3.22, cpc: 0.90, conversoes: 68, roas: 2.8 },
];

export const campanhasMeta = [
    { campanha: 'Remarketing - Carrinho', spend: 8500, alcance: 250000, impressoes: 580000, cliques: 12500, ctr: 2.16, cpc: 0.68, conversoes: 185, roas: 4.8, thumbnail: '/ads/meta-1.jpg' },
    { campanha: 'Prospecção - LAL', spend: 6200, alcance: 380000, impressoes: 720000, cliques: 9800, ctr: 1.36, cpc: 0.63, conversoes: 92, roas: 2.4, thumbnail: '/ads/meta-2.jpg' },
    { campanha: 'Lançamento iPhone', spend: 5800, alcance: 180000, impressoes: 420000, cliques: 8500, ctr: 2.02, cpc: 0.68, conversoes: 78, roas: 3.2, thumbnail: '/ads/meta-3.jpg' },
];

export const hallDaFama = [
    { id: 1, nome: 'iPhone 15 - Carousel', plataforma: 'Meta', roas: 5.8, spend: 2500, conversoes: 48, cpa: 52.08 },
    { id: 2, nome: 'Brand Search - Exato', plataforma: 'Google', roas: 5.2, spend: 4200, conversoes: 85, cpa: 49.41 },
    { id: 3, nome: 'Remarketing 7d', plataforma: 'Meta', roas: 4.9, spend: 3800, conversoes: 72, cpa: 52.78 },
    { id: 4, nome: 'Shopping - AirPods', plataforma: 'Google', roas: 4.5, spend: 2800, conversoes: 52, cpa: 53.85 },
    { id: 5, nome: 'Video View - Unbox', plataforma: 'Meta', roas: 4.2, spend: 1800, conversoes: 28, cpa: 64.29 },
];

export const budgetBleeders = [
    { id: 1, nome: 'PMax - Genérico', plataforma: 'Google', roas: 0.8, spend: 3500, conversoes: 12, cpa: 291.67 },
    { id: 2, nome: 'Prospecção Frio', plataforma: 'Meta', roas: 1.1, spend: 2800, conversoes: 15, cpa: 186.67 },
    { id: 3, nome: 'Display - GDN', plataforma: 'Google', roas: 0.5, spend: 1500, conversoes: 3, cpa: 500.00 },
];

// ============================================
// SEO & DEMANDA
// ============================================
export const kpisSEO: KPIData[] = [
    { id: 'cliques_organicos', titulo: 'Cliques Orgânicos', valor: 42500, valorFormatado: '42.5k', variacao: -71.2, meta: 150000, tendencia: 'down', sparklineData: gerarSparkline('down') },
    { id: 'impressoes_organicas', titulo: 'Impressões', valor: 1250000, valorFormatado: '1.25M', variacao: -58.5, meta: 3000000, tendencia: 'down', sparklineData: gerarSparkline('down') },
    { id: 'posicao_media', titulo: 'Posição Média', valor: 18.5, valorFormatado: '18.5', variacao: 42.3, meta: 10, tendencia: 'up', sparklineData: gerarSparkline('up') },
    { id: 'ctr_organico', titulo: 'CTR Orgânico', valor: 3.4, valorFormatado: '3.4%', variacao: -28.5, meta: 5, tendencia: 'down', sparklineData: gerarSparkline('down'), unidade: '%' },
];

export const paginasQueda = [
    { pagina: '/produtos/smartphones', cliquesAntes: 15200, cliquesDepois: 3800, queda: -75.0, posicaoAntes: 3.2, posicaoDepois: 12.5 },
    { pagina: '/produtos/eletronicos', cliquesAntes: 12800, cliquesDepois: 4200, queda: -67.2, posicaoAntes: 4.5, posicaoDepois: 15.8 },
    { pagina: '/categoria/acessorios', cliquesAntes: 8500, cliquesDepois: 2100, queda: -75.3, posicaoAntes: 5.8, posicaoDepois: 22.4 },
    { pagina: '/', cliquesAntes: 6200, cliquesDepois: 2800, queda: -54.8, posicaoAntes: 2.1, posicaoDepois: 5.2 },
    { pagina: '/produtos/notebooks', cliquesAntes: 5800, cliquesDepois: 1200, queda: -79.3, posicaoAntes: 6.2, posicaoDepois: 28.5 },
];

export const querysMaisAfetadas = [
    { query: 'comprar iphone', volumeMensal: 45000, cliquesAntes: 4500, cliquesDepois: 850, posicaoAntes: 3, posicaoDepois: 15 },
    { query: 'smartphone samsung', volumeMensal: 38000, cliquesAntes: 3200, cliquesDepois: 620, posicaoAntes: 4, posicaoDepois: 18 },
    { query: 'fone de ouvido bluetooth', volumeMensal: 28000, cliquesAntes: 2800, cliquesDepois: 520, posicaoAntes: 5, posicaoDepois: 22 },
    { query: 'notebook gamer barato', volumeMensal: 22000, cliquesAntes: 1800, cliquesDepois: 280, posicaoAntes: 6, posicaoDepois: 25 },
];

export const oportunidadesKeywords = [
    { keyword: 'iphone 15 pro max', volume: 65000, dificuldade: 45, posicaoAtual: 28, potencial: 'Alto' },
    { keyword: 'melhor smartphone 2024', volume: 42000, dificuldade: 38, posicaoAtual: 35, potencial: 'Alto' },
    { keyword: 'fone bluetooth cancelamento ruído', volume: 28000, dificuldade: 32, posicaoAtual: 42, potencial: 'Médio' },
    { keyword: 'notebook para trabalho', volume: 35000, dificuldade: 40, posicaoAtual: null, potencial: 'Alto' },
];

// ============================================
// CRM & RETENÇÃO
// ============================================
export const kpisCRM: KPIData[] = [
    { id: 'clientes_ativos', titulo: 'Clientes Ativos (90d)', valor: 12450, valorFormatado: '12.4k', variacao: -28.5, meta: 18000, tendencia: 'down', sparklineData: gerarSparkline('down') },
    { id: 'taxa_recompra', titulo: 'Taxa Recompra', valor: 18.5, valorFormatado: '18.5%', variacao: -12.3, meta: 25, tendencia: 'down', sparklineData: gerarSparkline('down'), unidade: '%' },
    { id: 'ltv_90', titulo: 'LTV 90 dias', valor: 285.50, valorFormatado: 'R$ 285,50', variacao: -8.5, meta: 320, tendencia: 'down', sparklineData: gerarSparkline('down'), unidade: 'R$' },
    { id: 'frequencia', titulo: 'Frequência Média', valor: 1.35, valorFormatado: '1.35x', variacao: -5.2, meta: 1.6, tendencia: 'down', sparklineData: gerarSparkline('down'), unidade: 'x' },
];

export const cohortData = [
    { mes: 'Jul/25', m0: 100, m1: 28, m2: 18, m3: 12, m4: 9, m5: 7, m6: 6 },
    { mes: 'Ago/25', m0: 100, m1: 26, m2: 16, m3: 11, m4: 8, m5: 6, m6: null },
    { mes: 'Set/25', m0: 100, m1: 24, m2: 14, m3: 9, m4: 7, m5: null, m6: null },
    { mes: 'Out/25', m0: 100, m1: 22, m2: 12, m3: 8, m4: null, m5: null, m6: null },
    { mes: 'Nov/25', m0: 100, m1: 18, m2: 10, m3: null, m4: null, m5: null, m6: null },
    { mes: 'Dez/25', m0: 100, m1: 15, m2: null, m3: null, m4: null, m5: null, m6: null },
];

export const segmentosRFM = [
    { segmento: 'Campeões', clientes: 1250, percentual: 10.0, valorMedio: 580, recência: 12 },
    { segmento: 'Leais', clientes: 2480, percentual: 19.9, valorMedio: 320, recência: 25 },
    { segmento: 'Potencial', clientes: 3120, percentual: 25.1, valorMedio: 185, recência: 45 },
    { segmento: 'Novos', clientes: 1850, percentual: 14.9, valorMedio: 142, recência: 8 },
    { segmento: 'Em Risco', clientes: 2350, percentual: 18.9, valorMedio: 210, recência: 75 },
    { segmento: 'Perdidos', clientes: 1400, percentual: 11.2, valorMedio: 95, recência: 120 },
];

// ============================================
// EMAIL MARKETING
// ============================================
export const kpisEmail: KPIData[] = [
    { id: 'enviados', titulo: 'Enviados', valor: 125000, valorFormatado: '125k', variacao: -8.5, tendencia: 'down', sparklineData: gerarSparkline('down') },
    { id: 'open_rate', titulo: 'Open Rate', valor: 18.5, valorFormatado: '18.5%', variacao: -12.3, meta: 25, tendencia: 'down', sparklineData: gerarSparkline('down'), unidade: '%' },
    { id: 'ctr_email', titulo: 'CTR', valor: 2.8, valorFormatado: '2.8%', variacao: -5.8, meta: 4, tendencia: 'down', sparklineData: gerarSparkline('down'), unidade: '%' },
    { id: 'revenue_email', titulo: 'Receita Email', valor: 42500, valorFormatado: 'R$ 42.5k', variacao: -15.3, meta: 55000, tendencia: 'down', sparklineData: gerarSparkline('down'), unidade: 'R$' },
    { id: 'unsubscribe', titulo: 'Unsubscribe', valor: 0.45, valorFormatado: '0.45%', variacao: 22.5, meta: 0.3, tendencia: 'up', sparklineData: gerarSparkline('up'), unidade: '%' },
];

export const fluxosAutomacao = [
    { fluxo: 'Carrinho Abandonado', envios: 8500, opens: 2125, cliques: 425, conversoes: 128, receita: 18500, cr: 1.51 },
    { fluxo: 'Welcome Series', envios: 4200, opens: 1680, cliques: 378, conversoes: 85, receita: 8500, cr: 2.02 },
    { fluxo: 'Winback 60d', envios: 3800, opens: 570, cliques: 95, conversoes: 22, receita: 4200, cr: 0.58 },
    { fluxo: 'Pós-Compra', envios: 2100, opens: 840, cliques: 168, conversoes: 45, receita: 5800, cr: 2.14 },
    { fluxo: 'Aniversário', envios: 850, opens: 382, cliques: 98, conversoes: 28, receita: 3200, cr: 3.29 },
];

// ============================================
// SOCIAL & MARCA
// ============================================
export const kpisSocial: KPIData[] = [
    { id: 'alcance', titulo: 'Alcance', valor: 850000, valorFormatado: '850k', variacao: 12.5, tendencia: 'up', sparklineData: gerarSparkline('up') },
    { id: 'engajamento_social', titulo: 'Engajamento', valor: 45200, valorFormatado: '45.2k', variacao: 8.2, tendencia: 'up', sparklineData: gerarSparkline('up') },
    { id: 'seguidores', titulo: 'Seguidores', valor: 128500, valorFormatado: '128.5k', variacao: 2.8, tendencia: 'up', sparklineData: gerarSparkline('up') },
    { id: 'link_bio', titulo: 'Cliques Link Bio', valor: 4520, valorFormatado: '4.5k', variacao: -5.2, tendencia: 'down', sparklineData: gerarSparkline('down') },
];

export const sentimentoAnalise = {
    positivo: 62,
    neutro: 28,
    negativo: 10,
    palavrasPositivas: ['ótimo', 'rápido', 'qualidade', 'recomendo', 'amei'],
    palavrasNegativas: ['atraso', 'demorou', 'caro', 'problema', 'defeito'],
};

// ============================================
// PREÇO & CONCORRÊNCIA
// ============================================
export const kpisPreco: KPIData[] = [
    { id: 'preco_medio', titulo: 'Preço Médio', valor: 425.80, valorFormatado: 'R$ 425,80', variacao: -2.5, tendencia: 'down', sparklineData: gerarSparkline('stable'), unidade: 'R$' },
    { id: 'indice_preco', titulo: 'Índice vs Mercado', valor: 98.5, valorFormatado: '98.5', variacao: -1.2, meta: 100, tendencia: 'stable', sparklineData: gerarSparkline('stable') },
    { id: 'skus_mais_caros', titulo: 'SKUs Mais Caros', valor: 245, valorFormatado: '245', variacao: 18.5, tendencia: 'up', sparklineData: gerarSparkline('up') },
    { id: 'skus_mais_baratos', titulo: 'SKUs Mais Baratos', valor: 128, valorFormatado: '128', variacao: -8.2, tendencia: 'down', sparklineData: gerarSparkline('down') },
];

export const comparativoPrecos = [
    { categoria: 'Smartphones', nossoPreco: 2850, mercadoP25: 2650, mercadoP50: 2920, mercadoP75: 3200, indice: 97.6 },
    { categoria: 'Notebooks', nossoPreco: 4250, mercadoP25: 3800, mercadoP50: 4500, mercadoP75: 5200, indice: 94.4 },
    { categoria: 'Fones', nossoPreco: 285, mercadoP25: 250, mercadoP50: 295, mercadoP75: 380, indice: 96.6 },
    { categoria: 'Smartwatches', nossoPreco: 1450, mercadoP25: 1200, mercadoP50: 1480, mercadoP75: 1850, indice: 98.0 },
];

// ============================================
// OPERAÇÃO & CX
// ============================================
export const kpisOperacao: KPIData[] = [
    { id: 'prazo_prometido', titulo: 'Prazo Prometido', valor: 5.2, valorFormatado: '5.2 dias', variacao: 0, tendencia: 'stable', sparklineData: gerarSparkline('stable'), unidade: 'dias' },
    { id: 'prazo_real', titulo: 'Prazo Real', valor: 6.8, valorFormatado: '6.8 dias', variacao: 15.2, tendencia: 'up', sparklineData: gerarSparkline('up'), unidade: 'dias' },
    { id: 'taxa_atraso', titulo: 'Taxa de Atraso', valor: 18.5, valorFormatado: '18.5%', variacao: 35.4, meta: 10, tendencia: 'up', sparklineData: gerarSparkline('up'), unidade: '%' },
    { id: 'taxa_devolucao', titulo: 'Taxa Devolução', valor: 8.2, valorFormatado: '8.2%', variacao: 12.5, meta: 5, tendencia: 'up', sparklineData: gerarSparkline('up'), unidade: '%' },
    { id: 'nps', titulo: 'NPS', valor: 42, valorFormatado: '42', variacao: -18.5, meta: 60, tendencia: 'down', sparklineData: gerarSparkline('down') },
];

export const correlacaoAtrasoRecompra = [
    { atraso: 'Sem atraso', pedidos: 1250, recompra: 28.5 },
    { atraso: '1-2 dias', pedidos: 380, recompra: 22.3 },
    { atraso: '3-5 dias', pedidos: 145, recompra: 15.8 },
    { atraso: '5+ dias', pedidos: 72, recompra: 8.2 },
];

// ============================================
// DATA QUALITY
// ============================================
export const kpisDataQuality: KPIData[] = [
    { id: 'cobertura_utm', titulo: 'Cobertura UTM', valor: 78.5, valorFormatado: '78.5%', variacao: -5.2, meta: 95, tendencia: 'down', sparklineData: gerarSparkline('down'), unidade: '%' },
    { id: 'discrepancia', titulo: 'Discrepância GA4 vs Backend', valor: 12.8, valorFormatado: '12.8%', variacao: 25.5, meta: 5, tendencia: 'up', sparklineData: gerarSparkline('up'), unidade: '%' },
    { id: 'eventos_faltando', titulo: 'Eventos Faltando', valor: 3, valorFormatado: '3', variacao: 50, tendencia: 'up', sparklineData: gerarSparkline('up') },
];

export const discrepancias = [
    { metrica: 'Receita', ga4: 198200, backend: 224500, diferenca: -11.7 },
    { metrica: 'Transações', ga4: 1847, backend: 1925, diferenca: -4.1 },
    { metrica: 'Sessões', ga4: 148920, backend: null, diferenca: null },
];

// ============================================
// GROWTH RADAR
// ============================================
export const oportunidades = [
    { id: 1, titulo: 'Recuperar SEO - Core Web Vitals', impacto: 95, esforco: 75, score: 85, categoria: 'SEO' },
    { id: 2, titulo: 'Escalar Remarketing Meta', impacto: 80, esforco: 30, score: 82, categoria: 'Ads' },
    { id: 3, titulo: 'Corrigir SKUs Merchant Center', impacto: 70, esforco: 25, score: 78, categoria: 'Catálogo' },
    { id: 4, titulo: 'Otimizar Checkout Mobile', impacto: 85, esforco: 65, score: 75, categoria: 'CRO' },
    { id: 5, titulo: 'Reativar Base Fria Email', impacto: 60, esforco: 20, score: 72, categoria: 'CRM' },
];

export const trendingProducts = [
    { sku: 'IPHONE15-PRO-256', nome: 'iPhone 15 Pro 256GB', viewsHoje: 2450, viewsOntem: 1820, crescimento: 34.6 },
    { sku: 'AIRPODS-MAX', nome: 'AirPods Max', viewsHoje: 1850, viewsOntem: 1420, crescimento: 30.3 },
    { sku: 'MACBOOK-M3', nome: 'MacBook Pro M3', viewsHoje: 1620, viewsOntem: 1280, crescimento: 26.6 },
];

export const scaleCandidates = [
    { campanha: 'Remarketing 7d', plataforma: 'Meta', roas: 4.9, spend: 3800, shareOfVoice: 12, potencial: 'Alto' },
    { campanha: 'Shopping - AirPods', plataforma: 'Google', roas: 4.5, spend: 2800, shareOfVoice: 8, potencial: 'Alto' },
    { campanha: 'Brand Search', plataforma: 'Google', roas: 5.2, spend: 4200, shareOfVoice: 45, potencial: 'Médio' },
];

// ============================================
// ALERTAS & IA
// ============================================
export const alertasCriticos: AlertaData[] = [
    { id: 'alerta-1', tipo: 'critical', titulo: 'Colapso no Tráfego Orgânico', descricao: 'Sessões orgânicas caíram 71% vs. mês anterior. Possível penalização do Google ou problema técnico de indexação.', timestamp: '2026-01-11T14:30:00', impacto: 'R$ 170k/mês em receita perdida' },
    { id: 'alerta-2', tipo: 'critical', titulo: 'CR Mobile em Queda Crítica', descricao: 'Taxa de conversão mobile caiu 45%. Core Web Vitals degradados detectados.', timestamp: '2026-01-11T12:15:00', impacto: 'R$ 85k/mês em conversões perdidas' },
    { id: 'alerta-3', tipo: 'warning', titulo: '324 SKUs Bloqueados no Merchant Center', descricao: 'Produtos desaprovados por inconsistência de preço e estoque.', timestamp: '2026-01-11T10:45:00', impacto: 'R$ 28k/mês em vendas afetadas' },
    { id: 'alerta-4', tipo: 'warning', titulo: 'Taxa de Abandono de Carrinho Elevada', descricao: 'Abandono subiu para 68%, 15 pontos acima do benchmark do setor.', timestamp: '2026-01-11T09:20:00', impacto: 'R$ 52k/mês em vendas não convertidas' },
    { id: 'alerta-5', tipo: 'info', titulo: 'CAC Pago Aumentou 12%', descricao: 'CPCs mais elevados devido à competição sazonal.', timestamp: '2026-01-11T08:00:00' },
];

export const planosAcaoIA: AcaoIA[] = [
    { id: 'acao-1', prioridade: 'P0', hipotese: 'Site foi penalizado pelo Google Core Update', evidencia: 'Queda de 71% no tráfego orgânico coincide com atualização de algoritmo de Dezembro/25', acao: 'Auditar site com foco em Core Web Vitals, E-E-A-T e conteúdo thin. Verificar Google Search Console por ações manuais.', responsavel: 'SEO', impactoEstimado: 'R$ 120k/mês', status: 'pendente' },
    { id: 'acao-2', prioridade: 'P0', hipotese: 'Problemas técnicos de indexação', evidencia: 'Cobertura de indexação caiu 45% no GSC. Sitemap com erros.', acao: 'Verificar robots.txt, sitemaps, e logs de crawl. Corrigir erros de indexação prioritários.', responsavel: 'Tech SEO', impactoEstimado: 'R$ 80k/mês', status: 'pendente' },
    { id: 'acao-3', prioridade: 'P0', hipotese: 'Core Web Vitals degradados afetam CR mobile', evidencia: 'LCP médio de 4.8s (ruim), CLS de 0.32 (ruim). Mobile CR caiu 45%.', acao: 'Otimizar imagens, lazy loading, reduzir JS. Meta: LCP < 2.5s.', responsavel: 'Frontend', impactoEstimado: 'R$ 50k/mês', status: 'em_andamento' },
    { id: 'acao-4', prioridade: 'P1', hipotese: 'SKUs bloqueados reduzem alcance de Shopping', evidencia: '324 produtos desaprovados = 18% do catálogo inativo em Google Shopping.', acao: 'Corrigir inconsistências de preço/estoque no feed. Revalidar produtos.', responsavel: 'Marketplace', impactoEstimado: 'R$ 28k/mês', status: 'pendente' },
    { id: 'acao-5', prioridade: 'P1', hipotese: 'Checkout mobile com fricção excessiva', evidencia: '68% de abandono no checkout, 23 pontos acima do desktop.', acao: 'Simplificar formulário mobile, adicionar Apple/Google Pay, reduzir passos.', responsavel: 'CRO', impactoEstimado: 'R$ 35k/mês', status: 'pendente' },
];

// ============================================
// HEATMAPS
// ============================================
export const heatmapCanais: HeatmapData = { categoria: 'Canal', items: [{ nome: 'Orgânico', valor: -74.5, variacao: -71.2 }, { nome: 'Pago', valor: 1.8, variacao: 2.3 }, { nome: 'E-mail', valor: -15.3, variacao: -12.5 }, { nome: 'Direto', valor: -32.1, variacao: -28.4 }, { nome: 'Referral', valor: -18.7, variacao: -15.2 }] };
export const heatmapCategorias: HeatmapData = { categoria: 'Categoria', items: [{ nome: 'Eletrônicos', valor: -68.2, variacao: -65.5 }, { nome: 'Moda', valor: -52.3, variacao: -48.7 }, { nome: 'Casa & Jardim', valor: -71.8, variacao: -69.2 }, { nome: 'Beleza', valor: -45.2, variacao: -42.1 }, { nome: 'Esportes', valor: -58.9, variacao: -55.3 }] };
export const heatmapDispositivos: HeatmapData = { categoria: 'Dispositivo', items: [{ nome: 'Mobile', valor: -72.4, variacao: -68.5 }, { nome: 'Desktop', valor: -48.2, variacao: -45.1 }, { nome: 'Tablet', valor: -55.8, variacao: -52.3 }] };
export const heatmapRegioes: HeatmapData = { categoria: 'Região', items: [{ nome: 'Sudeste', valor: -65.2, variacao: -62.4 }, { nome: 'Sul', valor: -58.7, variacao: -55.2 }, { nome: 'Nordeste', valor: -72.1, variacao: -68.9 }, { nome: 'Centro-Oeste', valor: -61.4, variacao: -58.5 }, { nome: 'Norte', valor: -68.9, variacao: -65.7 }] };
export const heatmapTipoCliente: HeatmapData = { categoria: 'Tipo Cliente', items: [{ nome: 'Novos', valor: -78.5, variacao: -75.2 }, { nome: 'Recorrentes', valor: -42.3, variacao: -38.8 }] };

// ============================================
// TIME SERIES
// ============================================
export const timeSeriesReceita = gerarTimeSeries(30, 20000, 'down');
export const timeSeriesSessoes = gerarTimeSeries(30, 10333, 'down');

// ============================================
// NAVEGAÇÃO
// ============================================
export const navegacaoItems = [
    { titulo: 'Home Executiva', href: '/', icone: 'LayoutDashboard', grupo: 'ceo' as const, isMockData: false },
    { titulo: 'Diagnóstico IA', href: '/diagnostico', icone: 'Brain', grupo: 'ceo' as const, badge: '3', isMockData: false },
    { titulo: 'Aquisição & Tráfego', href: '/aquisicao', icone: 'Users', grupo: 'marketing' as const, isMockData: false },
    { titulo: 'Mídia Paga', href: '/midia-paga', icone: 'Target', grupo: 'marketing' as const, isMockData: false },
    { titulo: 'SEO & Demanda', href: '/seo', icone: 'Search', grupo: 'marketing' as const, badge: '!', isMockData: true },
    { titulo: 'Funil E-commerce', href: '/funil', icone: 'Filter', grupo: 'cro' as const, isMockData: false },
    { titulo: 'Catálogo & Merchandising', href: '/catalogo', icone: 'Package', grupo: 'cro' as const, isMockData: true },
    { titulo: 'CRM & Retenção', href: '/crm', icone: 'Heart', grupo: 'crm' as const, isMockData: true },
    { titulo: 'E-mail & Automação', href: '/email', icone: 'Mail', grupo: 'crm' as const, isMockData: true },
    { titulo: 'Social & Marca', href: '/social', icone: 'Share2', grupo: 'crm' as const, isMockData: true },
    { titulo: 'Preço & Concorrência', href: '/preco', icone: 'DollarSign', grupo: 'operacao' as const, isMockData: true },
    { titulo: 'Operação & Experiência', href: '/operacao', icone: 'Truck', grupo: 'operacao' as const, isMockData: true },
    { titulo: 'Data Quality', href: '/data-quality', icone: 'Database', grupo: 'dados' as const, isMockData: true },
    { titulo: 'Tendências & Oportunidades', href: '/tendencias', icone: 'TrendingUp', grupo: 'dados' as const, isMockData: true },
];

export const gruposLabels = { ceo: 'Executivo', marketing: 'Marketing', cro: 'Conversão', crm: 'Retenção', operacao: 'Operação', dados: 'Dados & IA' };
export const ultimaAtualizacao = new Date().toISOString();
