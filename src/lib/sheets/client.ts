// ==========================================
// DATA CLIENT - PostgreSQL Only
// ==========================================

// Import PostgreSQL data fetchers directly
import {
    getCatalogoData,
    getGA4Data,
    getGoogleAdsData,
    getGA4SessionsData,
    getTVSalesData,
    getMetasData,
} from '@/lib/data/postgres';

// ==========================================
// FETCH FUNCTIONS - Direct PostgreSQL calls
// ==========================================

// Fetch Google Ads data
export const fetchGoogleAdsData = async (startDate?: Date, endDate?: Date) => {
    console.log('[Data] Fetching Google Ads data from PostgreSQL');
    return await getGoogleAdsData(startDate, endDate);
};

// Fetch GA4 data
export const fetchGA4Data = async (startDate?: Date, endDate?: Date) => {
    console.log('[Data] Fetching GA4 data from PostgreSQL');
    return await getGA4Data(startDate, endDate);
};

// Fetch GA4 Sessions data
export const fetchGA4SessionsData = async (startDate?: Date, endDate?: Date) => {
    console.log('[Data] Fetching GA4 Sessions data from PostgreSQL');
    return await getGA4SessionsData(startDate, endDate);
};

// Fetch TV Sales data
export const fetchTVSalesData = async () => {
    console.log('[Data] Fetching TV Sales data from PostgreSQL');
    return await getTVSalesData();
};

// Fetch Metas data
export const fetchMetasData = async () => {
    console.log('[Data] Fetching Metas data from PostgreSQL');
    return await getMetasData();
};

// Helper to parse date consistently (always returns local time at midnight)
const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;

    let d: Date | null = null;

    // Try YYYY-MM-DD (e.g. 2026-01-15)
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [y, m, day] = dateStr.split('-').map(Number);
        d = new Date(y, m - 1, day);
    }
    // Try DD/MM/YYYY (e.g. 15/01/2026)
    else if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        const [day, month, year] = dateStr.split('/');
        d = new Date(Number(year), Number(month) - 1, Number(day));
    }
    else {
        // Fallback for other formats
        d = new Date(dateStr);
    }

    if (!d || isNaN(d.getTime())) return null;

    // Always normalize to start of day in local time for consistent comparison
    d.setHours(0, 0, 0, 0);
    return d;
};

// Aggregate Google Ads KPIs
export const aggregateGoogleAdsKPIs = async (startDate?: Date, endDate?: Date) => {
    const data = await fetchGoogleAdsData(startDate, endDate);

    // Excluindo campanhas "Lead" e "Visita" para custo do ROAS conforme solicitado
    const isLeadsCampaign = (campaign: string) => (campaign || '').toLowerCase().includes('lead');
    const isVisitaCampaign = (campaign: string) => (campaign || '').toLowerCase().includes('visita');

    const totalGrossCost = data.reduce((sum, entry) => sum + (entry.cost || 0), 0);
    const ecommerceData = data.filter(entry => !isLeadsCampaign(entry.campaign) && !isVisitaCampaign(entry.campaign));
    const totalCost = ecommerceData.reduce((sum, entry) => sum + (entry.cost || 0), 0); // Este será o "Investimento Google Ads" principal para o ROAS

    const totalConversions = data.reduce((sum, entry) => sum + (entry.conversions || 0), 0);
    const totalEcommerceClicks = ecommerceData.reduce((sum, entry) => sum + (entry.clicks || 0), 0);
    const totalEcommerceImpressions = ecommerceData.reduce((sum, entry) => sum + (entry.impressions || 0), 0);

    // Weighted CTR (Total Clicks / Total Impressions) using filtered ecommerce data
    const avgCTR = totalEcommerceImpressions > 0 ? (totalEcommerceClicks / totalEcommerceImpressions) * 100 : 0;

    const costPerConversion = totalConversions > 0 ? totalCost / totalConversions : 0;

    // Daily Cost and Conversions Aggregation (needed for CPA forecast)
    const dailyMetricsMap: { [key: string]: { cost: number; conversions: number } } = {};
    data.forEach(entry => {
        const date = parseDate(entry.day);
        if (date) {
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
            if (!dailyMetricsMap[dateStr]) {
                dailyMetricsMap[dateStr] = { cost: 0, conversions: 0 };
            }
            dailyMetricsMap[dateStr].cost += entry.cost || 0;
            dailyMetricsMap[dateStr].conversions += entry.conversions || 0;
        }
    });
    const dailyData = Object.entries(dailyMetricsMap)
        .map(([date, metrics]) => ({ date, cost: metrics.cost, conversions: metrics.conversions }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // Metas definidas pelo usuário
    const LEADS_META = 28000;
    const ECOMMERCE_META = 66000;

    const leadsData = data.filter(entry => isLeadsCampaign(entry.campaign));
    const leadsSpend = leadsData.reduce((sum, entry) => sum + (entry.cost || 0), 0);
    const ecommerceSpend = totalCost;
    const leadsConversions = leadsData.reduce((sum, entry) => sum + (entry.conversions || 0), 0);
    const ecommerceConversions = ecommerceData.reduce((sum, entry) => sum + (entry.conversions || 0), 0);
    const leadsClicks = leadsData.reduce((sum, entry) => sum + (entry.clicks || 0), 0);
    const ecommerceClicks = ecommerceData.reduce((sum, entry) => sum + (entry.clicks || 0), 0);

    // Conversion Value for ROAS calculation (from google_ads table)
    const totalConversionValue = ecommerceData.reduce((sum, entry) => sum + (entry.conversionValue || 0), 0);
    const roas = totalCost > 0 ? totalConversionValue / totalCost : 0;

    // ==========================================
    // CLASSIFICAÇÃO DE CAMPANHAS (5 tipos)
    // ==========================================
    type CampaignType = 'pmax_ecommerce' | 'shopping' | 'search_institucional' | 'search_leads' | 'visita_loja' | 'outros';

    const classifyCampaign = (campaign: string): CampaignType => {
        const lower = (campaign || '').toLowerCase();

        // Check in specific order (most restrictive first)
        if (lower.includes('visita')) return 'visita_loja';
        if (lower.includes('lead')) return 'search_leads';
        if (lower.includes('institucional') && !lower.includes('lead') && !lower.includes('visita')) return 'search_institucional';
        if (lower.includes('shopping')) return 'shopping';
        if (lower.includes('pmax') && !lower.includes('lead') && !lower.includes('visita')) return 'pmax_ecommerce';

        return 'outros';
    };

    const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
        'pmax_ecommerce': 'PMAX Ecommerce',
        'shopping': 'Shopping',
        'search_institucional': 'Search Institucional',
        'search_leads': 'Search Leads',
        'visita_loja': 'Visita à Loja',
        'outros': 'Outros'
    };

    // ==========================================
    // DADOS POR CAMPANHA (para tabela detalhada)
    // ==========================================
    const campaignMap: {
        [key: string]: {
            campaign: string;
            spend: number;
            conversions: number;
            conversionValue: number;  // For ROAS
            clicks: number;
            impressions: number;
            tipo: CampaignType;
        }
    } = {};

    data.forEach(entry => {
        const campaign = entry.campaign || 'Desconhecida';
        if (!campaignMap[campaign]) {
            campaignMap[campaign] = {
                campaign,
                spend: 0,
                conversions: 0,
                conversionValue: 0,
                clicks: 0,
                impressions: 0,
                tipo: classifyCampaign(campaign)
            };
        }
        campaignMap[campaign].spend += entry.cost || 0;
        campaignMap[campaign].conversions += entry.conversions || 0;
        campaignMap[campaign].conversionValue += entry.conversionValue || 0;
        campaignMap[campaign].clicks += entry.clicks || 0;
        campaignMap[campaign].impressions += entry.impressions || 0;
    });

    const byCampaign = Object.values(campaignMap)
        .map(c => ({
            ...c,
            ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
            cpc: c.clicks > 0 ? c.spend / c.clicks : 0,
            cpa: c.conversions > 0 ? c.spend / c.conversions : 0,
            roas: c.spend > 0 ? c.conversionValue / c.spend : 0,  // Campaign-level ROAS
        }))
        .sort((a, b) => b.spend - a.spend);

    return {
        spend: totalCost,
        totalGrossCost,
        spend_formatted: `R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        conversions: totalConversions,
        conversionValue: totalConversionValue,  // Campaign revenue from google_ads
        roas,  // ROAS calculated from conversion_value / cost
        clicks: totalEcommerceClicks,
        impressions: totalEcommerceImpressions,
        ctr: avgCTR,
        ctr_formatted: `${avgCTR.toFixed(2)}%`,
        costPerConversion,
        cpc: totalEcommerceClicks > 0 ? totalCost / totalEcommerceClicks : 0,
        dailyData,
        // Segmentação Leads vs Ecommerce
        segmented: {
            leads: {
                spend: leadsSpend,
                spend_formatted: `R$ ${leadsSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                conversions: leadsConversions,
                conversionsLabel: 'Leads', // Label para exibição
                clicks: leadsClicks,
                meta: LEADS_META,
                percentMeta: LEADS_META > 0 ? (leadsSpend / LEADS_META) * 100 : 0,
            },
            ecommerce: {
                spend: ecommerceSpend,
                spend_formatted: `R$ ${ecommerceSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                conversions: ecommerceConversions,
                conversionsLabel: 'Compras', // Label para exibição
                clicks: ecommerceClicks,
                meta: ECOMMERCE_META,
                percentMeta: ECOMMERCE_META > 0 ? (ecommerceSpend / ECOMMERCE_META) * 100 : 0,
            },
        },
        byCampaign,
        // Agregação por tipo de campanha (5 tipos) para drill-down interativo
        byCampaignType: (() => {
            const typeMap: Record<CampaignType, { spend: number; conversions: number; clicks: number; impressions: number; campaigns: string[] }> = {
                'pmax_ecommerce': { spend: 0, conversions: 0, clicks: 0, impressions: 0, campaigns: [] },
                'shopping': { spend: 0, conversions: 0, clicks: 0, impressions: 0, campaigns: [] },
                'search_institucional': { spend: 0, conversions: 0, clicks: 0, impressions: 0, campaigns: [] },
                'search_leads': { spend: 0, conversions: 0, clicks: 0, impressions: 0, campaigns: [] },
                'visita_loja': { spend: 0, conversions: 0, clicks: 0, impressions: 0, campaigns: [] },
                'outros': { spend: 0, conversions: 0, clicks: 0, impressions: 0, campaigns: [] },
            };

            byCampaign.forEach(c => {
                const t = typeMap[c.tipo];
                if (t) {
                    t.spend += c.spend;
                    t.conversions += c.conversions;
                    t.clicks += c.clicks;
                    t.impressions += c.impressions;
                    t.campaigns.push(c.campaign);
                }
            });

            return Object.entries(typeMap).map(([type, data]) => ({
                type: type as CampaignType,
                label: CAMPAIGN_TYPE_LABELS[type as CampaignType],
                ...data,
                ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
                cpc: data.clicks > 0 ? data.spend / data.clicks : 0,
                cpa: data.conversions > 0 ? data.spend / data.conversions : 0,
                campaignCount: data.campaigns.length,
            })).filter(t => t.spend > 0); // Only include types with spend
        })(),
        rawData: data,
    };
};

// Aggregate GA4 KPIs
export const aggregateGA4KPIs = async (startDate?: Date, endDate?: Date) => {
    const [filteredTransactions, filteredSessions, filteredGads] = await Promise.all([
        fetchGA4Data(startDate, endDate),
        fetchGA4SessionsData(startDate, endDate),
        fetchGoogleAdsData(startDate, endDate)
    ]);

    const totalRevenue = filteredTransactions.reduce((sum, entry) => sum + (entry.purchaseRevenue || 0), 0);
    const totalTransactions = filteredTransactions.length;
    const ticketMedio = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const totalSessions = filteredSessions.reduce((sum, entry) => sum + (entry.sessions || 0), 0);

    // Cross-analysis Session campaign vs Google Ads Campaign
    const campaignStats: Record<string, {
        campaign: string;
        sessions: number;
        engagementRate: number;
        cost: number;
        clicks: number;
        conv: number;
        addToCarts: number;
        checkouts: number;
        purchases: number;
    }> = {};

    // Aggregate Sessions (GA4) - Only for Google Ads Campaigns
    const excludeCamps = ['(not set)', 'direct', '(direct)', 'organic', '(organic)', 'cross-network', '(not provided)'];

    filteredSessions.forEach(s => {
        const camp = s.campaign || '';
        const lowerCamp = camp.toLowerCase();
        const lowerSource = (s.source || '').toLowerCase();

        // Must be google source and NOT in exclude list
        if (!lowerSource.includes('google')) return;
        if (!camp || excludeCamps.some(ex => lowerCamp.includes(ex))) return;

        if (!campaignStats[camp]) {
            campaignStats[camp] = {
                campaign: camp, sessions: 0, engagementRate: 0, cost: 0, clicks: 0, conv: 0,
                addToCarts: 0, checkouts: 0, purchases: 0
            };
        }
        const totalEngaged = campaignStats[camp].sessions * campaignStats[camp].engagementRate + (s.sessions * (s.engagementRate || 0));
        campaignStats[camp].sessions += s.sessions;
        campaignStats[camp].engagementRate = campaignStats[camp].sessions > 0 ? totalEngaged / campaignStats[camp].sessions : 0;
        campaignStats[camp].addToCarts += s.addToCarts || 0;
        campaignStats[camp].checkouts += s.checkouts || 0;
        campaignStats[camp].purchases += s.purchases || 0;
    });

    // Aggregate Ads Data (GAds)
    filteredGads.forEach(g => {
        const camp = g.campaign || 'Desconhecida';
        if (campaignStats[camp]) {
            campaignStats[camp].cost += g.cost || 0;
            campaignStats[camp].clicks += g.clicks || 0;
            campaignStats[camp].conv += g.conversions || 0;
        }
    });

    const campaignCrossAnalysis = Object.values(campaignStats)
        .filter(c => c.sessions > 0 || c.cost > 0)
        .sort((a, b) => b.sessions - a.sessions);

    // Group by channel (Transactions)
    const googleCPC = filteredTransactions.filter(e => e.eventSourceMedium?.includes('google') && e.eventSourceMedium?.includes('cpc'))
        .reduce((sum, e) => sum + (e.purchaseRevenue || 0), 0);
    const organic = filteredTransactions.filter(e => e.eventSourceMedium?.includes('organic'))
        .reduce((sum, e) => sum + (e.purchaseRevenue || 0), 0);
    const direct = filteredTransactions.filter(e => e.eventSourceMedium?.includes('direct'))
        .reduce((sum, e) => sum + (e.purchaseRevenue || 0), 0);
    const email = filteredTransactions.filter(e => e.eventSourceMedium?.toLowerCase().includes('email') || e.eventSourceMedium?.toLowerCase().includes('activecampaign'))
        .reduce((sum, e) => sum + (e.purchaseRevenue || 0), 0);
    const social = filteredTransactions.filter(e => e.eventSourceMedium?.includes('social') || e.eventSourceMedium?.includes('ig'))
        .reduce((sum, e) => sum + (e.purchaseRevenue || 0), 0);

    // Daily Trend (Sessions)
    const dailySessionsMap: { [key: string]: number } = {};
    filteredSessions.forEach(s => {
        const d = parseDate(s.date);
        if (d) {
            const key = d.toISOString().split('T')[0];
            dailySessionsMap[key] = (dailySessionsMap[key] || 0) + s.sessions;
        }
    });
    const dailyTrend = Object.entries(dailySessionsMap)
        .map(([date, sessions]) => ({ date, sessions }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // Avg Engagement Rate
    const totalEngagedSum = filteredSessions.reduce((sum, s) => sum + (s.sessions * (s.engagementRate || 0)), 0);
    const avgEngagementRate = totalSessions > 0 ? totalEngagedSum / totalSessions : 0;

    // Google Ads Specific Sessions (for funnel) as requested: atribuicao === 'Google_Ads'
    const googleSessionsData = filteredSessions.filter(s => s.atribuicao === 'Google_Ads');
    const googleSessions = googleSessionsData.reduce((sum, s) => sum + s.sessions, 0);
    const googleEngagedSum = googleSessionsData.reduce((sum, s) => sum + (s.sessions * (s.engagementRate || 0)), 0);
    const googleEngagementRate = googleSessions > 0 ? googleEngagedSum / googleSessions : 0;

    const totalImpressions = filteredGads.reduce((sum, g) => sum + (g.impressions || 0), 0);
    const totalGadsClicks = filteredGads.reduce((sum, g) => sum + (g.clicks || 0), 0);
    const clickToSessionRate = totalGadsClicks > 0 ? googleSessions / totalGadsClicks : 0;

    return {
        totalRevenue,
        totalRevenue_formatted: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        totalTransactions,
        totalSessions,
        googleSessions,
        totalImpressions,
        googleEngagementRate,
        clickToSessionRate,
        avgEngagementRate,
        dailyTrend,
        ticketMedio,
        ticketMedio_formatted: `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        campaignCrossAnalysis,
        byChannel: {
            googleCPC,
            organic,
            direct,
            email,
            social
        }
    };
};

// Fetch Magento (BD Mag) data - E-commerce CRM data
export const fetchMagData = async () => {
    console.log('[Data] Fetching Catalogo/Mag data from PostgreSQL');
    return await getCatalogoData();
};

// Aggregate Catalogo/Magento KPIs
export const aggregateCatalogoKPIs = async (startDate?: Date, endDate?: Date) => {
    const data = await getCatalogoData(startDate, endDate);

    // Filter only completed orders (status validation)
    const completedOrders = data.filter(d =>
        d.status?.toLowerCase().includes('complete') ||
        d.status?.toLowerCase().includes('completo') ||
        d.status?.toLowerCase().includes('pago') ||
        d.status?.toLowerCase().includes('enviado') ||
        d.status?.toLowerCase().includes('faturado') ||
        !d.status // Include if no status
    );

    // Total revenue
    const totalReceita = completedOrders.reduce((sum, entry) => sum + (entry.receitaProduto || 0), 0);
    const totalValorSemFrete = completedOrders.reduce((sum, entry) => sum + (entry.valorTotalSemFrete || 0), 0);
    const totalValorComFrete = completedOrders.reduce((sum, entry) => sum + (entry.valorTotalComFrete || 0), 0);

    // Receita específica do canal Google_Ads (Mídia Paga)
    // Captura variações: "Google_Ads", "Google Ads", "google_ads", "GoogleAds", etc.
    const isGoogleAdsAttribution = (atrib: string) => {
        const lower = (atrib || '').toLowerCase().replace(/[_\s]/g, '');
        return lower === 'googleads' || lower.includes('googleads');
    };

    const receitaGoogleAds = completedOrders
        .filter(d => isGoogleAdsAttribution(d.atribuicao))
        .reduce((sum, entry) => sum + (entry.receitaProduto || 0), 0);

    // Receita para cálculo do ROAS (Atribuição != Vendedor e != Outros)
    const receitaParaROAS = completedOrders
        .filter(d => {
            const atrib = (d.atribuicao || '').toLowerCase();
            return atrib !== 'vendedor' && atrib !== 'outros' && atrib !== '';
        })
        .reduce((sum, entry) => sum + (entry.receitaProduto || 0), 0);

    // Unique orders count
    const uniqueOrders = new Set(completedOrders.map(d => d.pedido).filter(Boolean));
    const totalPedidos = uniqueOrders.size || completedOrders.length;

    // Ticket médio
    const ticketMedio = totalPedidos > 0 ? totalValorSemFrete / totalPedidos : 0;

    // Top Products by revenue
    const productRevenue: { [key: string]: { nome: string; receita: number; qtd: number } } = {};
    completedOrders.forEach(order => {
        const nome = order.nomeProduto;
        if (nome) {
            if (!productRevenue[nome]) {
                productRevenue[nome] = { nome, receita: 0, qtd: 0 };
            }
            productRevenue[nome].receita += order.receitaProduto || 0;
            productRevenue[nome].qtd += 1;
        }
    });

    const topSkus = Object.values(productRevenue)
        .sort((a, b) => b.receita - a.receita)
        .slice(0, 10)
        .map((p, i) => ({
            sku: `SKU-${i + 1}`,
            nome: p.nome.substring(0, 50) + (p.nome.length > 50 ? '...' : ''),
            receita: p.receita,
            qtdVendas: p.qtd,
            estoque: Math.floor(Math.random() * 100) + 10, // Placeholder - ideally from another sheet
            margem: Math.floor(Math.random() * 30) + 15, // Placeholder
        }));

    // Revenue by category
    const categoryRevenue: { [key: string]: number } = {};
    completedOrders.forEach(order => {
        const cat = order.categoria || 'Sem Categoria';
        categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (order.receitaProduto || 0);
    });

    const byCategory = Object.entries(categoryRevenue)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

    // Revenue by state
    const stateRevenue: { [key: string]: number } = {};
    completedOrders.forEach(order => {
        const state = order.estado || 'N/A';
        stateRevenue[state] = (stateRevenue[state] || 0) + (order.receitaProduto || 0);
    });

    const byState = Object.entries(stateRevenue)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    // Revenue by channel/origin
    const channelRevenue: { [key: string]: number } = {};
    completedOrders.forEach(order => {
        const channel = order.origem || 'Não identificado';
        channelRevenue[channel] = (channelRevenue[channel] || 0) + (order.receitaProduto || 0);
    });

    const byChannel = Object.entries(channelRevenue)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Revenue by Atribuição (user requested for "Receita por Canal de Origem" chart)
    const atribuicaoRevenue: { [key: string]: number } = {};
    completedOrders.forEach(order => {
        const atrib = order.atribuicao || 'Não identificado';
        atribuicaoRevenue[atrib] = (atribuicaoRevenue[atrib] || 0) + (order.receitaProduto || 0);
    });

    const byAtribuicao = Object.entries(atribuicaoRevenue)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Revenue by seller
    const sellerRevenue: { [key: string]: number } = {};
    completedOrders.forEach(order => {
        const seller = order.vendedor || 'Não atribuído';
        sellerRevenue[seller] = (sellerRevenue[seller] || 0) + (order.receitaProduto || 0);
    });

    const bySeller = Object.entries(sellerRevenue)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    // Revenue by day of week
    const dayOfWeekRevenue: { [key: string]: number } = {};
    completedOrders.forEach(order => {
        const day = order.diaSemana || 'N/A';
        dayOfWeekRevenue[day] = (dayOfWeekRevenue[day] || 0) + (order.receitaProduto || 0);
    });

    const byDayOfWeek = Object.entries(dayOfWeekRevenue)
        .map(([name, value]) => ({ name, value }));

    // Unique customers by CPF only
    const uniqueCustomers = new Set(completedOrders.map(d => d.cpfCliente).filter(Boolean));

    // Filter options for dropdowns
    const filterOrigens = [...new Set(data.map(d => d.origem).filter(Boolean))].sort();
    const filterMidias = [...new Set(data.map(d => d.midia).filter(Boolean))].sort();
    const filterCategorias = [...new Set(data.map(d => d.categoria).filter(Boolean))].sort();
    const filterAtribuicoes = [...new Set(data.map(d => d.atribuicao).filter(Boolean))].sort();
    const filterStatus = [...new Set(data.map(d => d.status).filter(Boolean))].sort();

    // Daily Revenue (Real Data)
    const dailyRevenueMap: { [key: string]: { receita: number; pedidos: number } } = {};
    completedOrders.forEach(order => {
        const dateRaw = order.data;
        if (dateRaw) {
            const key = dateRaw.split(' ')[0];
            if (!dailyRevenueMap[key]) {
                dailyRevenueMap[key] = { receita: 0, pedidos: 0 };
            }
            dailyRevenueMap[key].receita += order.receitaProduto || 0;
            dailyRevenueMap[key].pedidos += 1;
        }
    });

    const dailyRevenue = Object.entries(dailyRevenueMap)
        .map(([date, val]) => ({
            date,
            receita: val.receita,
            pedidos: val.pedidos,
            sortDate: date.includes('/') ? new Date(date.split('/').reverse().join('-')) : new Date(date)
        }))
        .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
        .map(({ date, receita, pedidos }) => ({ date, receita, pedidos }));

    // Daily Revenue by Atribuição (for line chart showing evolution over time)
    const dailyAtribuicaoMap: { [key: string]: { [atrib: string]: number } } = {};
    completedOrders.forEach(order => {
        const dateRaw = order.data;
        if (dateRaw) {
            const key = dateRaw.split(' ')[0];
            const atrib = order.atribuicao || 'Não identificado';
            if (!dailyAtribuicaoMap[key]) {
                dailyAtribuicaoMap[key] = {};
            }
            dailyAtribuicaoMap[key][atrib] = (dailyAtribuicaoMap[key][atrib] || 0) + (order.receitaProduto || 0);
        }
    });

    // Get all unique attributions
    const allAtribuicoes = [...new Set(completedOrders.map(o => o.atribuicao || 'Não identificado'))];

    const dailyRevenueByAtribuicao = Object.entries(dailyAtribuicaoMap)
        .map(([date, atribData]) => {
            const entry: any = {
                date,
                sortDate: date.includes('/') ? new Date(date.split('/').reverse().join('-')) : new Date(date)
            };
            allAtribuicoes.forEach(atrib => {
                entry[atrib] = atribData[atrib] || 0;
            });
            return entry;
        })
        .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
        .map(({ sortDate, ...rest }) => rest);

    return {
        totalReceita,
        totalReceita_formatted: `R$ ${totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        receitaGoogleAds,
        receitaGoogleAds_formatted: `R$ ${receitaGoogleAds.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        receitaParaROAS,
        receitaParaROAS_formatted: `R$ ${receitaParaROAS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        totalValorSemFrete,
        totalValorSemFrete_formatted: `R$ ${totalValorSemFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        totalValorComFrete,
        totalValorComFrete_formatted: `R$ ${totalValorComFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        totalPedidos,
        ticketMedio,
        ticketMedio_formatted: `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        totalClientes: uniqueCustomers.size,
        totalProdutosVendidos: completedOrders.length,
        topSkus,
        byCategory,
        byState,
        byChannel,
        byAtribuicao,
        bySeller,
        byDayOfWeek,
        dailyRevenue,
        dailyRevenueByAtribuicao,
        allAtribuicoes,
        filterOptions: {
            origens: filterOrigens,
            midias: filterMidias,
            categorias: filterCategorias,
            atribuicoes: filterAtribuicoes,
            status: filterStatus,
        },
        rawData: data,
    };
};

// Aggregate CRM KPIs
export const aggregateCRMKPIs = async (startDate?: Date, endDate?: Date) => {
    const data = await getCatalogoData(startDate, endDate);

    // Filter only completed orders
    const completedOrders = data.filter(d =>
        d.status?.toLowerCase().includes('complete') ||
        d.status?.toLowerCase().includes('completo') ||
        d.status?.toLowerCase().includes('pago') ||
        d.status?.toLowerCase().includes('enviado') ||
        !d.status
    );


    // Unique customers
    const uniqueCustomers = new Set(completedOrders.map(d => d.emailCliente || d.cpfCliente).filter(Boolean));
    const totalClientes = uniqueCustomers.size;

    // Top Customers by revenue
    const customerRevenue: { [key: string]: { nome: string; email: string; receita: number; qtdPedidos: number } } = {};
    completedOrders.forEach(order => {
        const key = order.emailCliente || order.cpfCliente || 'Unknown';
        if (key !== 'Unknown') {
            if (!customerRevenue[key]) {
                customerRevenue[key] = {
                    nome: order.cpfCliente || 'Cliente', // Name not explicit in data, using CPF/Email/Placeholder
                    email: order.emailCliente || '',
                    receita: 0,
                    qtdPedidos: 0
                };
            }
            customerRevenue[key].receita += order.receitaProduto || 0;
            customerRevenue[key].qtdPedidos += 1;
        }
    });

    const topCustomers = Object.values(customerRevenue)
        .sort((a, b) => b.receita - a.receita)
        .slice(0, 10)
        .map(c => ({
            ...c,
            receita_formatted: `R$ ${c.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        }));

    // Revenue by Seller
    const sellerRevenue: { [key: string]: number } = {};
    completedOrders.forEach(order => {
        const seller = order.vendedor || 'Não atribuído';
        sellerRevenue[seller] = (sellerRevenue[seller] || 0) + (order.receitaProduto || 0);
    });

    const bySeller = Object.entries(sellerRevenue)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Revenue by State
    const stateRevenue: { [key: string]: number } = {};
    completedOrders.forEach(order => {
        const state = order.estado || 'N/A';
        stateRevenue[state] = (stateRevenue[state] || 0) + (order.receitaProduto || 0);
    });

    const byState = Object.entries(stateRevenue)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Revenue by City (Top 10)
    const cityRevenue: { [key: string]: number } = {};
    completedOrders.forEach(order => {
        const city = order.cidade || 'N/A';
        cityRevenue[city] = (cityRevenue[city] || 0) + (order.receitaProduto || 0);
    });

    const byCity = Object.entries(cityRevenue)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    // --- RFM IMPLEMENTATION ---
    const now = new Date();
    const customerRFM: {
        [key: string]: {
            id: string;
            nome: string;
            email: string;
            recencia: number;
            frequencia: number;
            receita: number;
            lastOrderDate: Date;
            cidade: string;
            estado: string;
        }
    } = {};

    completedOrders.forEach(order => {
        const key = order.emailCliente || order.cpfCliente || 'Unknown';
        if (key !== 'Unknown') {
            const orderDate = order.data ?
                (order.data.includes('/') ? new Date(order.data.split('/').reverse().join('-')) : new Date(order.data)) :
                new Date();

            if (!customerRFM[key]) {
                customerRFM[key] = {
                    id: key,
                    nome: order.cpfCliente || 'Cliente',
                    email: order.emailCliente || '',
                    recencia: 0,
                    frequencia: 0,
                    receita: 0,
                    lastOrderDate: orderDate,
                    cidade: order.cidade || '',
                    estado: order.estado || ''
                };
            }

            customerRFM[key].frequencia += 1;
            customerRFM[key].receita += order.receitaProduto || 0;
            if (orderDate > customerRFM[key].lastOrderDate) {
                customerRFM[key].lastOrderDate = orderDate;
                // Update geo data to latest order location
                customerRFM[key].cidade = order.cidade || customerRFM[key].cidade;
                customerRFM[key].estado = order.estado || customerRFM[key].estado;
            }
        }
    });

    const rfmList = Object.values(customerRFM).map(c => {
        const diffTime = Math.abs(now.getTime() - c.lastOrderDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { ...c, recenciaDays: diffDays };
    });

    // Scoring (Simple Quintiles or fixed thresholds)
    // For simplicity/robustness without huge data, we use thresholds
    // R: 0-30 (5), 31-60 (4), 61-90 (3), 91-180 (2), 180+ (1)
    // F: 1 (1), 2 (2), 3-5 (3), 6-10 (4), 10+ (5)
    // M: based on market - let's assume Ticket Medio ~450
    const getRScore = (d: number) => d <= 30 ? 5 : d <= 60 ? 4 : d <= 90 ? 3 : d <= 180 ? 2 : 1;
    const getFScore = (f: number) => f >= 10 ? 5 : f >= 6 ? 4 : f >= 3 ? 3 : f >= 2 ? 2 : 1;
    const getMScore = (m: number) => m >= 5000 ? 5 : m >= 2000 ? 4 : m >= 1000 ? 3 : m >= 500 ? 2 : 1;

    const scoredDetails = rfmList.map(c => {
        const r = getRScore(c.recenciaDays);
        const f = getFScore(c.frequencia);
        const m = getMScore(c.receita);
        return { ...c, r, f, m, score: (r * 100) + (f * 10) + m };
    });

    // Categorization
    const segmentsMap: { [key: string]: typeof scoredDetails } = {
        'Campeões': [],
        'Leais': [],
        'Potencial de Lealdade': [],
        'Novos': [],
        'Promissores': [],
        'Precisa de Atenção': [],
        'Em Risco': [],
        'Perdidos': [],
        'Hibernando': []
    };

    scoredDetails.forEach(c => {
        const { r, f, m } = c;
        let segment = 'Outros';

        if (r >= 4 && f >= 4 && m >= 4) segment = 'Campeões';
        else if (r >= 3 && f >= 3 && m >= 3) segment = 'Leais';
        else if (r >= 4 && f <= 2) segment = 'Novos';
        else if (r >= 3 && f <= 3) segment = 'Promissores';
        else if (r >= 3 && m >= 3) segment = 'Potencial de Lealdade';
        else if (r === 2 && f > 2) segment = 'Precisa de Atenção';
        else if (r <= 2 && f >= 2) segment = 'Em Risco';
        else if (r <= 2 && f <= 1) segment = 'Perdidos';
        else if (r === 2 && f <= 2) segment = 'Hibernando';

        if (segmentsMap[segment]) {
            segmentsMap[segment].push(c);
        }
    });

    // Repeat Customers & Loyalty
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.receitaProduto || 0), 0);
    const totalOrdersCount = new Set(completedOrders.map(d => d.pedido).filter(Boolean)).size || completedOrders.length;

    const repeatCustomersCount = Object.values(customerRFM).filter(c => c.frequencia > 1).length;
    const repurchaseRate = totalClientes > 0 ? (repeatCustomersCount / totalClientes) * 100 : 0;
    const avgOrdersPerCustomer = totalClientes > 0 ? totalOrdersCount / totalClientes : 0;
    const ltv = totalClientes > 0 ? totalRevenue / totalClientes : 0;

    // Cohort Analysis (Simplified: Month of first order)
    const cohorts: Record<string, { count: number, revenue: number, months: Record<number, number> }> = {};
    const customerFirstVisit: Record<string, string> = {};

    // Sort orders by date to find first visit
    const sortedOrders = [...data]
        .map(d => {
            let date: Date | null = null;
            if (d.data?.includes('/')) {
                date = new Date(d.data.split('/').reverse().join('-'));
            } else if (d.data) {
                date = new Date(d.data.split(' ')[0]);
            }
            return { ...d, parsedDate: date };
        })
        .filter(d => d.cpfCliente && d.parsedDate)
        .sort((a: any, b: any) => a.parsedDate.getTime() - b.parsedDate.getTime());

    sortedOrders.forEach(order => {
        const cpf = order.cpfCliente;
        const monthYear = (order as any).parsedDate.toISOString().slice(0, 7); // YYYY-MM

        if (!customerFirstVisit[cpf]) {
            customerFirstVisit[cpf] = monthYear;
            if (!cohorts[monthYear]) {
                cohorts[monthYear] = { count: 0, revenue: 0, months: {} };
            }
            cohorts[monthYear].count += 1;
        }

        const firstMonth = new Date(customerFirstVisit[cpf] + '-01');
        const currentMonth = new Date(monthYear + '-01');
        const monthsDiff = (currentMonth.getFullYear() - firstMonth.getFullYear()) * 12 + (currentMonth.getMonth() - firstMonth.getMonth());

        cohorts[customerFirstVisit[cpf]].revenue += order.receitaProduto || 0;
        cohorts[customerFirstVisit[cpf]].months[monthsDiff] = (cohorts[customerFirstVisit[cpf]].months[monthsDiff] || 0) + 1;
    });

    // Format for frontend
    const segments = Object.entries(segmentsMap)
        .filter(([_, list]) => list.length > 0)
        .map(([name, list]) => ({
            segmento: name,
            clientes: list.length,
            valorMedio: list.reduce((sum, c) => sum + c.receita, 0) / list.length,
            percentual: (list.length / totalClientes) * 100,
            customerList: list.sort((a, b) => b.receita - a.receita) // Top customers first
        }))
        .sort((a, b) => b.clientes - a.clientes);

    // Seasonality Analysis (Last 12 Months independent of filter)
    const seasonalityMap: { [key: string]: number } = {};
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setHours(0, 0, 0, 0);

    data.forEach(order => {
        // Parse date safely
        let orderDate: Date | null = null;
        if (order.data?.includes('/')) {
            orderDate = new Date(order.data.split('/').reverse().join('-'));
        } else if (order.data) {
            orderDate = new Date(order.data.split(' ')[0]);
        }

        if (!orderDate) return;

        // Filter last 12 months and valid status
        if (orderDate >= oneYearAgo) {
            const status = order.status?.toLowerCase() || '';
            if (status.includes('complete') || status.includes('completo') || status.includes('faturado') || status.includes('entregue')) {
                const monthKey = orderDate.toISOString().slice(0, 7); // YYYY-MM
                seasonalityMap[monthKey] = (seasonalityMap[monthKey] || 0) + (order.receitaProduto || 0);
            }
        }
    });

    const seasonality = Object.entries(seasonalityMap)
        .map(([date, value]) => ({
            date,
            month: new Date(date + '-02').toLocaleString('pt-BR', { month: 'short' }), // formatted month
            fullDate: date,
            receita: value
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return {
        totalClientes,
        repurchaseRate,
        avgOrdersPerCustomer,
        ltv,
        topCustomers,
        bySeller,
        byState,
        byCity,
        segments,
        seasonality,
        cohorts,
        rawData: data
    };
};
