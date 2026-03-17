/**
 * postgres.ts — In-Memory Data Layer (replaces PostgreSQL)
 *
 * All data comes from the public Google Sheets via sheets-store.ts.
 * Function signatures and return types are IDENTICAL to the old SQL version
 * so that client.ts and API routes need zero changes.
 */

import {
    getBdMagData,
    getGa4StoreData,
    getGoogleAdsStoreData,
    getTvSalesStoreData,
    getMetasStoreData,
} from './sheets-store';

// ============================================
// TYPE EXPORTS (unchanged)
// ============================================

export type CatalogoItem = {
    mpn: string;
    pedido: string;
    dataTransacao: string;
    status: string;
    nomeProduto: string;
    receitaProduto: number;
    cidade: string;
    estado: string;
    valorTotalSemFrete: number;
    valorTotalComFrete: number;
    emailCliente: string;
    cpfCliente: string;
    categoria: string;
    vendedor: string;
    data: string;
    hora: string;
    horaSimples: string;
    origem: string;
    midia: string;
    campanha: string;
    cupom: string;
    atribuicao: string;
    qtdTotalPedidos: number;
    pertenceA: string;
    diaSemana: string;
    mes: string;
    semana: string;
};

export type GA4Item = {
    transactionId: string;
    transactionDate: string;
    eventSourceMedium: string;
    eventCampaign: string;
    purchaseRevenue: number;
    googleAdsAccount: string;
    midia: string;
    status: string;
    data: string;
    atribuicao: string;
};

export type GoogleAdsItem = {
    day: string;
    account: string;
    campaign: string;
    cost: number;
    conversions: number;
    conversionValue: number;
    clicks: number;
    impressions: number;
    ctr: number;
    campaignCategory: string;
};

export type GA4SessionsItem = {
    date: string;
    sessions: number;
    source: string;
    campaign: string;
    engagementRate: number;
    atribuicao?: string;
    addToCarts: number;
    checkouts: number;
    purchases: number;
};

// ============================================
// HELPERS
// ============================================

function parseNumber(val: any): number {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;

    let str = val.toString().trim()
        .replace(/[R$]/g, '')
        .replace(/\s/g, '');

    if (str.includes(',') && str.includes('.')) {
        str = str.replace(/\./g, '').replace(',', '.');
    } else if (str.includes(',')) {
        str = str.replace(',', '.');
    }

    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

function normalizeDate(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    const s = dateStr.toString().trim().split(' ')[0]; // strip time part
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
    if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) {
        return s.substring(6, 10) + '-' + s.substring(3, 5) + '-' + s.substring(0, 2);
    }
    return null;
}

function isCompletedStatus(status: string | null | undefined): boolean {
    if (!status || status === '') return true;
    const lower = status.toLowerCase();
    return lower.includes('complete') || lower.includes('completo') ||
        lower.includes('pago') || lower.includes('enviado') ||
        lower.includes('faturado') || lower.includes('entregue') ||
        lower.includes('delivered');
}

function isInDateRange(dateStr: string | null | undefined, startDate?: Date, endDate?: Date): boolean {
    if (!startDate || !endDate) return true;
    const normalized = normalizeDate(dateStr);
    if (!normalized) return false;
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    return normalized >= startStr && normalized <= endStr;
}

// ============================================
// FILTERS
// ============================================

interface CatalogoFilters {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    atribuicao?: string;
    categoria?: string;
    estado?: string;
}

function filterBdMagRows(rows: Record<string, any>[], filters: CatalogoFilters): Record<string, any>[] {
    return rows.filter(r => {
        // Date filter
        if (filters.startDate && filters.endDate) {
            if (!isInDateRange(r.data, filters.startDate, filters.endDate)) return false;
        }
        // Status filter
        if (filters.status) {
            if (r.status !== filters.status) return false;
        } else {
            if (!isCompletedStatus(r.status)) return false;
        }
        // Atribuicao filter
        if (filters.atribuicao) {
            if (r.atribuicao !== filters.atribuicao) return false;
        }
        // Categoria filter
        if (filters.categoria) {
            if (r.categoria !== filters.categoria) return false;
        }
        // Estado filter
        if (filters.estado) {
            if (r.estado !== filters.estado) return false;
        }
        return true;
    });
}

function mapRowToCatalogoItem(r: Record<string, any>): CatalogoItem {
    return {
        mpn: r.mpn || '',
        pedido: r.pedido || '',
        dataTransacao: r.data_transacao || '',
        status: r.status || '',
        nomeProduto: r.nome_do_produto || r.nome_do_produto2 || '',
        receitaProduto: parseNumber(r.receita_do_produto),
        cidade: r.cidade || '',
        estado: r.estado || '',
        valorTotalSemFrete: parseNumber(r.valor_total_sem_frete),
        valorTotalComFrete: parseNumber(r.valor_total_com_frete),
        emailCliente: r.e_mail_cliente || '',
        cpfCliente: r.cpf_cliente || '',
        categoria: r.categoria || '',
        vendedor: r.vendedor || '',
        data: r.data || '',
        hora: r.hora_min_seg || '',
        horaSimples: r.hora || '',
        origem: r.origem || '',
        midia: r.midia || '',
        campanha: r.camp || r.camp2 || '',
        cupom: r.cupom || r.especialmente || '',
        atribuicao: r.atribuicao || '',
        qtdTotalPedidos: parseInt(r.qde_total_pedidos || '1'),
        pertenceA: r.pertence_a || '',
        diaSemana: r.dia_da_semana || '',
        mes: r.mes || '',
        semana: r.semana || '',
    };
}

// ============================================
// DATA FETCHERS
// ============================================

export async function getCatalogoData(filters: CatalogoFilters = {}): Promise<CatalogoItem[]> {
    const allRows = await getBdMagData();
    const filtered = filterBdMagRows(allRows, filters);
    return filtered.map(mapRowToCatalogoItem);
}

export async function getGA4Data(startDate?: Date, endDate?: Date): Promise<GA4Item[]> {
    const allRows = await getGa4StoreData();
    const filtered = allRows.filter(r => isInDateRange(r.date, startDate, endDate));

    return filtered.map(r => ({
        transactionId: r.transactionid || r.transaction_id || r.transaction || '',
        transactionDate: r.date || '',
        eventSourceMedium: r.session_source_medium || r.event_source_medium || '',
        eventCampaign: r.campaign_name || r.event_campaign || r.campaign || '',
        purchaseRevenue: parseFloat(r.purchase_revenue || '0'),
        googleAdsAccount: r.event_google_ads_account || r.google_ads_account || '',
        midia: r.midia || '',
        status: r.status || '',
        data: r.data || '',
        atribuicao: (r.atribuicao || '').toString().trim(),
    }));
}

export async function getGoogleAdsData(startDate?: Date, endDate?: Date): Promise<GoogleAdsItem[]> {
    const allRows = await getGoogleAdsStoreData();
    const filtered = allRows.filter(r => isInDateRange(r.date, startDate, endDate));

    return filtered.map(r => ({
        day: r.date || r.day || '',
        account: r.account_name || r.account_cust || r.account || '',
        campaign: r.campaign || '',
        cost: parseNumber(r.spend || r.cost || r.investimento),
        conversions: parseNumber(r.conversions || r.conversoes),
        conversionValue: parseNumber(r.conversion_value || r.conv_value || r.receita),
        clicks: Math.round(parseNumber(r.clicks || r.cliques)),
        impressions: Math.round(parseNumber(r.impressions || r.impressoes)),
        ctr: parseNumber(r.ctr?.toString().replace('%', '')),
        campaignCategory: r.campanha || '',
    }));
}

export async function getGA4SessionsData(startDate?: Date, endDate?: Date): Promise<GA4SessionsItem[]> {
    const allRows = await getGa4StoreData();
    const filtered = allRows.filter(r => isInDateRange(r.date, startDate, endDate));

    return filtered.map(r => ({
        date: r.date || '',
        sessions: parseInt((r.sessions || '0').toString().replace(/\./g, '').replace(',', '.')),
        source: r.session_source_medium || r.event_source_medium || r.origem || '',
        campaign: r.campaign_name || r.event_campaign || r.campanha || '',
        engagementRate: parseNumber(r.engagement_rate || r.taxa_de_engajamento) / (r.engagement_rate?.toString().includes('%') ? 100 : 1),
        atribuicao: (r.atribuicao || '').toString().trim(),
        addToCarts: Math.round(parseNumber(r.add_to_carts)),
        checkouts: Math.round(parseNumber(r.checkouts)),
        purchases: Math.round(parseNumber(r.ecommerce_purchases || r.purchases)),
    }));
}

// ============================================
// CATALOGO KPIs AGGREGATION (replaces 14 SQL queries)
// ============================================

export async function getCatalogoKPIsAggregated(filters: CatalogoFilters = {}) {
    const [allBdMag, allGoogleAds] = await Promise.all([
        getBdMagData(),
        getGoogleAdsStoreData(),
    ]);

    const rows = filterBdMagRows(allBdMag, filters);

    // Single-pass aggregation
    let totalReceita = 0;
    let totalSemFrete = 0;
    let totalComFrete = 0;
    const pedidoSet = new Set<string>();
    const cpfSet = new Set<string>();
    const atribuicaoMap: Record<string, number> = {};
    const categoriaMap: Record<string, number> = {};
    const estadoMap: Record<string, number> = {};
    const diaSemanaMap: Record<string, number> = {};
    const dailyMap: Record<string, { receita: number; pedidos: number }> = {};
    const dailyAtribMap: Record<string, Record<string, number>> = {};
    const allAtribuicoesSet = new Set<string>();
    let googleAdsReceita = 0;
    let roasReceita = 0;

    for (const r of rows) {
        const receita = parseNumber(r.receita_do_produto);
        const semFrete = parseNumber(r.valor_total_sem_frete);
        const comFrete = parseNumber(r.valor_total_com_frete);
        const pedido = r.pedido || '';
        const cpf = r.cpf_cliente || '';
        const atrib = r.atribuicao || '';
        const cat = r.categoria || '';
        const estado = r.estado || '';
        const diaSemana = r.dia_da_semana || '';
        const dateRaw = (r.data || '').split(' ')[0];

        totalReceita += receita;
        totalSemFrete += semFrete;
        totalComFrete += comFrete;
        if (pedido) pedidoSet.add(pedido);
        if (cpf) cpfSet.add(cpf);

        // By atribuicao
        const atribKey = atrib || 'Não identificado';
        atribuicaoMap[atribKey] = (atribuicaoMap[atribKey] || 0) + receita;
        allAtribuicoesSet.add(atribKey);

        // By categoria
        const catKey = cat || 'Sem Categoria';
        categoriaMap[catKey] = (categoriaMap[catKey] || 0) + receita;

        // By estado
        const estKey = estado || 'N/A';
        estadoMap[estKey] = (estadoMap[estKey] || 0) + receita;

        // By dia da semana
        const dsKey = diaSemana || 'N/A';
        diaSemanaMap[dsKey] = (diaSemanaMap[dsKey] || 0) + receita;

        // Daily (normalize to YYYY-MM-DD for consistent keys)
        const normalizedDate = normalizeDate(dateRaw);
        if (normalizedDate) {
            if (!dailyMap[normalizedDate]) dailyMap[normalizedDate] = { receita: 0, pedidos: 0 };
            dailyMap[normalizedDate].receita += receita;
            dailyMap[normalizedDate].pedidos += 1;

            if (!dailyAtribMap[normalizedDate]) dailyAtribMap[normalizedDate] = {};
            dailyAtribMap[normalizedDate][atribKey] = (dailyAtribMap[normalizedDate][atribKey] || 0) + receita;
        }

        // Google Ads revenue
        if (atrib.toLowerCase().includes('google')) {
            googleAdsReceita += receita;
        }

        // ROAS revenue
        const lowerAtrib = atrib.toLowerCase();
        if (atrib && lowerAtrib !== 'vendedor' && lowerAtrib !== 'outros') {
            roasReceita += receita;
        }
    }

    // Google Ads conversion_value from google_ads table
    const gadsFiltered = allGoogleAds.filter(r => isInDateRange(r.date, filters.startDate, filters.endDate));
    let gadsConversionTotal = 0;
    const gadsDailyMap: Record<string, number> = {};
    for (const g of gadsFiltered) {
        const cv = parseNumber(g.conversion_value || g.conv_value || g.receita);
        gadsConversionTotal += cv;
        const gDate = normalizeDate(g.date) || '';
        if (gDate) {
            gadsDailyMap[gDate] = (gadsDailyMap[gDate] || 0) + cv;
        }
    }

    // Build results
    const totalPedidos = pedidoSet.size;
    const totalClientes = cpfSet.size;
    const totalProdutosVendidos = rows.length;
    const ticketMedio = totalPedidos > 0 ? totalSemFrete / totalPedidos : 0;

    // Override Google_Ads with conversion_value from google_ads table
    const byAtribuicao = Object.entries(atribuicaoMap)
        .map(([name, value]) => ({
            name,
            value: name === 'Google_Ads' ? gadsConversionTotal : value,
        }))
        .sort((a, b) => b.value - a.value);

    const byCategory = Object.entries(categoriaMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

    const byState = Object.entries(estadoMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    const bySeller = [{ name: 'Não atribuído', value: 0 }];

    const byDayOfWeek = Object.entries(diaSemanaMap)
        .map(([name, value]) => ({ name, value }));

    const byChannel = byAtribuicao;

    // Daily revenue sorted by date (already YYYY-MM-DD)
    const dailyRevenue = Object.entries(dailyMap)
        .map(([date, d]) => ({ date, receita: d.receita, pedidos: d.pedidos }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // Inject google_ads daily data for dates only in google_ads
    Object.keys(gadsDailyMap).forEach(date => {
        if (!dailyAtribMap[date]) dailyAtribMap[date] = {};
    });

    const allAtribuicoes = [...allAtribuicoesSet];

    const dailyRevenueByAtribuicao = Object.entries(dailyAtribMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, atribData]) => {
            const entry: any = { date };
            allAtribuicoes.forEach(a => {
                if (a === 'Google_Ads') {
                    entry[a] = gadsDailyMap[date] || 0;
                } else {
                    entry[a] = atribData[a] || 0;
                }
            });
            return entry;
        });

    const receitaGoogleAds = gadsConversionTotal;
    const receitaParaROAS = roasReceita;

    // Filter options from ALL data (not filtered)
    const filterOptions = {
        origens: [...new Set(allBdMag.map(r => r.origem).filter(Boolean))].sort(),
        midias: [...new Set(allBdMag.map(r => r.midia).filter(Boolean))].sort(),
        categorias: [...new Set(allBdMag.map(r => r.categoria).filter(Boolean))].sort(),
        atribuicoes: [...new Set(allBdMag.map(r => r.atribuicao).filter(Boolean))].sort(),
        status: [...new Set(allBdMag.map(r => r.status).filter(Boolean))].sort(),
        estados: [...new Set(allBdMag.map(r => r.estado).filter(Boolean))].sort(),
        cidades: [...new Set(allBdMag.map(r => r.cidade).filter(Boolean))].sort(),
    };

    return {
        totalReceita,
        totalReceita_formatted: `R$ ${totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        receitaGoogleAds,
        receitaGoogleAds_formatted: `R$ ${receitaGoogleAds.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        receitaParaROAS,
        receitaParaROAS_formatted: `R$ ${receitaParaROAS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        totalValorSemFrete: totalSemFrete,
        totalValorSemFrete_formatted: `R$ ${totalSemFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        totalValorComFrete: totalComFrete,
        totalValorComFrete_formatted: `R$ ${totalComFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        totalPedidos,
        ticketMedio,
        ticketMedio_formatted: `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        totalClientes,
        totalProdutosVendidos,
        topSkus: [] as any[],
        byCategory,
        byState,
        byChannel,
        byAtribuicao,
        bySeller,
        byDayOfWeek,
        dailyRevenue,
        dailyRevenueByAtribuicao,
        allAtribuicoes,
        filterOptions,
    };
}

// ============================================
// YoY AGGREGATION
// ============================================

export async function getCatalogoYoYAggregated() {
    const allRows = await getBdMagData();
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    // Filter: completed status, valid date, year in [currentYear, previousYear]
    const filtered = allRows.filter(r => {
        if (!isCompletedStatus(r.status)) return false;
        const normalized = normalizeDate(r.data);
        if (!normalized) return false;
        const year = parseInt(normalized.substring(0, 4));
        return year === currentYear || year === previousYear;
    });

    // Monthly aggregation
    const monthlyByYear: Record<number, Record<number, { receita: number; pedidos: Set<string> }>> = {};
    const categoryByYear: Record<number, Record<string, number>> = {};

    for (const r of filtered) {
        const normalized = normalizeDate(r.data)!;
        const year = parseInt(normalized.substring(0, 4));
        const month = parseInt(normalized.substring(5, 7)) - 1; // 0-indexed
        const receita = parseNumber(r.receita_do_produto);
        const pedido = r.pedido || '';
        const cat = r.categoria || '';

        // Monthly
        if (!monthlyByYear[year]) monthlyByYear[year] = {};
        if (!monthlyByYear[year][month]) monthlyByYear[year][month] = { receita: 0, pedidos: new Set() };
        monthlyByYear[year][month].receita += receita;
        if (pedido) monthlyByYear[year][month].pedidos.add(pedido);

        // Category
        if (cat) {
            if (!categoryByYear[year]) categoryByYear[year] = {};
            categoryByYear[year][cat] = (categoryByYear[year][cat] || 0) + receita;
        }
    }

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const monthlyComparison = monthNames.map((name, idx) => ({
        month: name,
        currentYear: monthlyByYear[currentYear]?.[idx]?.receita || 0,
        previousYear: monthlyByYear[previousYear]?.[idx]?.receita || 0,
    }));

    const currentYearReceita = Object.values(monthlyByYear[currentYear] || {}).reduce((sum, m) => sum + m.receita, 0);
    const previousYearReceita = Object.values(monthlyByYear[previousYear] || {}).reduce((sum, m) => sum + m.receita, 0);
    const currentYearPedidos = Object.values(monthlyByYear[currentYear] || {}).reduce((sum, m) => sum + m.pedidos.size, 0);
    const previousYearPedidos = Object.values(monthlyByYear[previousYear] || {}).reduce((sum, m) => sum + m.pedidos.size, 0);

    const receitaYoYPercent = previousYearReceita > 0 ? ((currentYearReceita - previousYearReceita) / previousYearReceita) * 100 : 0;
    const pedidosYoYPercent = previousYearPedidos > 0 ? ((currentYearPedidos - previousYearPedidos) / previousYearPedidos) * 100 : 0;
    const currentYearTicket = currentYearPedidos > 0 ? currentYearReceita / currentYearPedidos : 0;
    const previousYearTicket = previousYearPedidos > 0 ? previousYearReceita / previousYearPedidos : 0;
    const ticketYoYPercent = previousYearTicket > 0 ? ((currentYearTicket - previousYearTicket) / previousYearTicket) * 100 : 0;

    // Category growth
    const currentCats = categoryByYear[currentYear] || {};
    const previousCats = categoryByYear[previousYear] || {};
    const allCats = new Set([...Object.keys(currentCats), ...Object.keys(previousCats)]);
    const categoryGrowth = Array.from(allCats).map(cat => {
        const curr = currentCats[cat] || 0;
        const prev = previousCats[cat] || 0;
        const growth = prev > 0 ? ((curr - prev) / prev) * 100 : (curr > 0 ? 100 : 0);
        return { name: cat, currentYear: curr, previousYear: prev, growth };
    })
        .filter(c => c.currentYear > 0 || c.previousYear > 0)
        .sort((a, b) => b.growth - a.growth)
        .slice(0, 6);

    return {
        monthlyComparison,
        receitaYoYPercent,
        pedidosYoYPercent,
        ticketYoYPercent,
        currentYearReceita,
        previousYearReceita,
        currentYearPedidos,
        previousYearPedidos,
        categoryGrowth,
        currentYear,
        previousYear,
    };
}

// ============================================
// TV SALES & METAS
// ============================================

export async function getTVSalesData(): Promise<any[]> {
    const rows = await getTvSalesStoreData();
    return rows.map(r => ({
        orderNumber: r.n_pedido || r.pedido || '',
        orderDate: r.data || '',
        televendas: r.televendas || '',
        month: r.mes || '',
    }));
}

export async function getMetasData(): Promise<any[]> {
    const rows = await getMetasStoreData();
    return rows;
}

// ============================================
// FREIGHT BY CITY AGGREGATION
// ============================================

export async function getFreightByCityAggregated(filters: CatalogoFilters = {}) {
    const allBdMag = await getBdMagData();
    const rows = filterBdMagRows(allBdMag, filters);

    // Group by pedido first to get freight per order (avoid multi-item duplication)
    const orderMap: Record<string, { cidade: string; estado: string; frete: number }> = {};
    for (const r of rows) {
        const pedido = r.pedido || '';
        if (!pedido) continue;
        if (orderMap[pedido]) continue; // already counted this order
        const comFrete = parseNumber(r.valor_total_com_frete);
        const semFrete = parseNumber(r.valor_total_sem_frete);
        const frete = comFrete - semFrete;
        orderMap[pedido] = {
            cidade: r.cidade || 'N/A',
            estado: r.estado || 'N/A',
            frete: frete > 0 ? frete : 0,
        };
    }

    // Aggregate by city
    const cityMap: Record<string, { estado: string; totalFrete: number; pedidoCount: number }> = {};
    let grandTotalFrete = 0;
    let totalPedidos = 0;

    for (const order of Object.values(orderMap)) {
        const key = order.cidade;
        if (!cityMap[key]) {
            cityMap[key] = { estado: order.estado, totalFrete: 0, pedidoCount: 0 };
        }
        cityMap[key].totalFrete += order.frete;
        cityMap[key].pedidoCount += 1;
        grandTotalFrete += order.frete;
        totalPedidos += 1;
    }

    const cities = Object.entries(cityMap)
        .map(([cidade, data]) => ({
            cidade,
            estado: data.estado,
            totalFrete: data.totalFrete,
            avgFrete: data.pedidoCount > 0 ? data.totalFrete / data.pedidoCount : 0,
            pedidoCount: data.pedidoCount,
            percentOfTotal: grandTotalFrete > 0 ? (data.totalFrete / grandTotalFrete) * 100 : 0,
        }))
        .sort((a, b) => b.totalFrete - a.totalFrete);

    return {
        cities,
        grandTotalFrete,
        grandAvgFrete: totalPedidos > 0 ? grandTotalFrete / totalPedidos : 0,
        totalPedidos,
    };
}
