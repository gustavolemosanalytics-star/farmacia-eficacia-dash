import prisma from '@/lib/prisma';

// Helper to define types based on the contract needed by useSheetData/page.tsx
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
    conversionValue: number;  // For ROAS calculation
    clicks: number;
    impressions: number;
    ctr: number;
    campaignCategory: string; // 'Campanha' column
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

// --- DATA FETCHERS ---

// Helper to parse Brazilian number format (comma as decimal, dot as thousands) or plain numbers
function parseNumber(val: any): number {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;

    // Remove currency, spaces
    let str = val.toString().trim()
        .replace(/[R$]/g, '')
        .replace(/\s/g, '');

    // If it has a comma and a dot, it's definitely mixed format (e.g. 1.234,56)
    if (str.includes(',') && str.includes('.')) {
        str = str.replace(/\./g, '').replace(',', '.');
    }
    // If it has only a comma, it's likely decimal (e.g. 1234,56)
    else if (str.includes(',')) {
        str = str.replace(',', '.');
    }

    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

// Helper to build date WHERE clause for TEXT date columns
// Supports both DD/MM/YYYY and YYYY-MM-DD formats
function buildDateFilter(column: string, startDate?: Date, endDate?: Date): { clause: string; params: any[] } {
    if (!startDate || !endDate) return { clause: '', params: [] };

    const startStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const endStr = endDate.toISOString().split('T')[0];

    // Handle both date formats in a single query using CASE
    const clause = ` AND (
        CASE
            WHEN ${column} ~ '^\\d{4}-\\d{2}-\\d{2}' THEN SUBSTRING(${column} FROM 1 FOR 10)
            WHEN ${column} ~ '^\\d{2}/\\d{2}/\\d{4}' THEN
                SUBSTRING(${column} FROM 7 FOR 4) || '-' || SUBSTRING(${column} FROM 4 FOR 2) || '-' || SUBSTRING(${column} FROM 1 FOR 2)
            ELSE NULL
        END
    ) BETWEEN $1 AND $2`;

    return { clause, params: [startStr, endStr] };
}

export async function getCatalogoData(filters: CatalogoFilters = {}): Promise<CatalogoItem[]> {
    const { where, params } = buildCatalogoWhere(filters);

    const query = `SELECT * FROM bd_mag ${where}`;

    const rows = await prisma.$queryRawUnsafe<any[]>(query, ...params);

    return rows.map(r => ({
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
        cupom: r.cupom || '',
        atribuicao: r.atribuicao || '',
        qtdTotalPedidos: parseInt(r.qde_total_pedidos || '1'),
        pertenceA: r.pertence_a || '',
        diaSemana: r.dia_da_semana || '',
        mes: r.mes || '',
        semana: r.semana || '',
    }));
}

export async function getGA4Data(startDate?: Date, endDate?: Date): Promise<GA4Item[]> {
    const dateFilter = buildDateFilter('date', startDate, endDate);

    const query = `SELECT * FROM ga4 WHERE 1=1${dateFilter.clause}`;

    const rows = await prisma.$queryRawUnsafe<any[]>(query, ...dateFilter.params);

    return rows.map(r => ({
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
    const dateFilter = buildDateFilter('date', startDate, endDate);

    const query = `SELECT * FROM google_ads WHERE 1=1${dateFilter.clause}`;

    const rows = await prisma.$queryRawUnsafe<any[]>(query, ...dateFilter.params);

    return rows.map(r => ({
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
    const dateFilter = buildDateFilter('date', startDate, endDate);

    const query = `SELECT * FROM ga4 WHERE 1=1${dateFilter.clause}`;

    const rows = await prisma.$queryRawUnsafe<any[]>(query, ...dateFilter.params);

    return rows.map(r => ({
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
// SQL-LEVEL AGGREGATION (avoids full table scans)
// ============================================

const COMPLETED_STATUS_FILTER = `(status IS NULL OR status = '' OR LOWER(status) LIKE '%complete%' OR LOWER(status) LIKE '%completo%' OR LOWER(status) LIKE '%pago%' OR LOWER(status) LIKE '%enviado%' OR LOWER(status) LIKE '%faturado%' OR LOWER(status) LIKE '%entregue%' OR LOWER(status) LIKE '%delivered%')`;

const NORMALIZE_DATE_EXPR = (col: string) => `
    CASE
        WHEN ${col} ~ '^\\d{4}-\\d{2}-\\d{2}' THEN SUBSTRING(${col} FROM 1 FOR 10)
        WHEN ${col} ~ '^\\d{2}/\\d{2}/\\d{4}' THEN
            SUBSTRING(${col} FROM 7 FOR 4) || '-' || SUBSTRING(${col} FROM 4 FOR 2) || '-' || SUBSTRING(${col} FROM 1 FOR 2)
        ELSE NULL
    END`;

interface CatalogoFilters {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    atribuicao?: string;
}

function buildCatalogoWhere(filters: CatalogoFilters): { where: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filters.startDate && filters.endDate) {
        const startStr = filters.startDate.toISOString().split('T')[0];
        const endStr = filters.endDate.toISOString().split('T')[0];
        conditions.push(`(${NORMALIZE_DATE_EXPR('data')}) BETWEEN $${idx} AND $${idx + 1}`);
        params.push(startStr, endStr);
        idx += 2;
    }

    if (filters.status) {
        conditions.push(`status = $${idx}`);
        params.push(filters.status);
        idx++;
    } else {
        conditions.push(COMPLETED_STATUS_FILTER);
    }

    if (filters.atribuicao) {
        conditions.push(`atribuicao = $${idx}`);
        params.push(filters.atribuicao);
        idx++;
    }

    return {
        where: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '',
        params
    };
}

export async function getCatalogoKPIsAggregated(filters: CatalogoFilters = {}) {
    const { where, params } = buildCatalogoWhere(filters);

    // Run all aggregation queries in parallel
    // Build date filter for google_ads table (date is YYYY-MM-DD format)
    const gadsDateParams: any[] = [];
    let gadsDateClause = '';
    if (filters.startDate && filters.endDate) {
        const startStr = filters.startDate.toISOString().split('T')[0];
        const endStr = filters.endDate.toISOString().split('T')[0];
        gadsDateClause = ` AND date BETWEEN '${startStr}' AND '${endStr}'`;
    }

    const [
        totalsResult,
        byAtribuicaoResult,
        byCategoryResult,
        byStateResult,
        bySellerResult,
        byDayOfWeekResult,
        dailyRevenueResult,
        dailyAtribuicaoResult,
        filterOptionsResult,
        googleAdsRevenueResult,
        roasRevenueResult,
        uniqueCustomersResult,
        gadsConversionValueResult,
        gadsDailyConversionValueResult,
    ] = await Promise.all([
        // 1. Totals
        prisma.$queryRawUnsafe<any[]>(`
            SELECT
                COALESCE(SUM(CASE WHEN receita_do_produto ~ '^[0-9]' THEN
                    CAST(REPLACE(REPLACE(receita_do_produto, '.', ''), ',', '.') AS NUMERIC)
                    ELSE 0 END), 0) as total_receita,
                COALESCE(SUM(CASE WHEN valor_total_sem_frete ~ '^[0-9]' THEN
                    CAST(REPLACE(REPLACE(valor_total_sem_frete, '.', ''), ',', '.') AS NUMERIC)
                    ELSE 0 END), 0) as total_sem_frete,
                COALESCE(SUM(CASE WHEN valor_total_com_frete ~ '^[0-9]' THEN
                    CAST(REPLACE(REPLACE(valor_total_com_frete, '.', ''), ',', '.') AS NUMERIC)
                    ELSE 0 END), 0) as total_com_frete,
                COUNT(DISTINCT NULLIF(pedido, '')) as total_pedidos,
                COUNT(*) as total_produtos
            FROM bd_mag ${where}
        `, ...params),

        // 2. By Atribuição
        prisma.$queryRawUnsafe<any[]>(`
            SELECT COALESCE(NULLIF(atribuicao, ''), 'Não identificado') as name,
                COALESCE(SUM(CASE WHEN receita_do_produto ~ '^[0-9]' THEN
                    CAST(REPLACE(REPLACE(receita_do_produto, '.', ''), ',', '.') AS NUMERIC)
                    ELSE 0 END), 0) as value
            FROM bd_mag ${where}
            GROUP BY COALESCE(NULLIF(atribuicao, ''), 'Não identificado')
            ORDER BY value DESC
        `, ...params),

        // 3. By Categoria (top 8)
        prisma.$queryRawUnsafe<any[]>(`
            SELECT COALESCE(NULLIF(categoria, ''), 'Sem Categoria') as name,
                COALESCE(SUM(CASE WHEN receita_do_produto ~ '^[0-9]' THEN
                    CAST(REPLACE(REPLACE(receita_do_produto, '.', ''), ',', '.') AS NUMERIC)
                    ELSE 0 END), 0) as value
            FROM bd_mag ${where}
            GROUP BY COALESCE(NULLIF(categoria, ''), 'Sem Categoria')
            ORDER BY value DESC LIMIT 8
        `, ...params),

        // 4. By Estado (top 10)
        prisma.$queryRawUnsafe<any[]>(`
            SELECT COALESCE(NULLIF(estado, ''), 'N/A') as name,
                COALESCE(SUM(CASE WHEN receita_do_produto ~ '^[0-9]' THEN
                    CAST(REPLACE(REPLACE(receita_do_produto, '.', ''), ',', '.') AS NUMERIC)
                    ELSE 0 END), 0) as value
            FROM bd_mag ${where}
            GROUP BY COALESCE(NULLIF(estado, ''), 'N/A')
            ORDER BY value DESC LIMIT 10
        `, ...params),

        // 5. By Seller (top 5) - FALLBACK if column missing
        prisma.$queryRawUnsafe<any[]>(`
            SELECT 'Não atribuído' as name, 0 as value
        `),

        // 6. By Day of Week
        prisma.$queryRawUnsafe<any[]>(`
            SELECT COALESCE(NULLIF(dia_da_semana, ''), 'N/A') as name,
                COALESCE(SUM(CASE WHEN receita_do_produto ~ '^[0-9]' THEN
                    CAST(REPLACE(REPLACE(receita_do_produto, '.', ''), ',', '.') AS NUMERIC)
                    ELSE 0 END), 0) as value
            FROM bd_mag ${where}
            GROUP BY COALESCE(NULLIF(dia_da_semana, ''), 'N/A')
        `, ...params),

        // 7. Daily Revenue
        prisma.$queryRawUnsafe<any[]>(`
            SELECT SPLIT_PART(data, ' ', 1) as date,
                COALESCE(SUM(CASE WHEN receita_do_produto ~ '^[0-9]' THEN
                    CAST(REPLACE(REPLACE(receita_do_produto, '.', ''), ',', '.') AS NUMERIC)
                    ELSE 0 END), 0) as receita,
                COUNT(*) as pedidos
            FROM bd_mag ${where} AND data IS NOT NULL AND data != ''
            GROUP BY SPLIT_PART(data, ' ', 1)
            ORDER BY (${NORMALIZE_DATE_EXPR("SPLIT_PART(data, ' ', 1)")}) ASC
        `, ...params),

        // 8. Daily Revenue by Atribuição
        prisma.$queryRawUnsafe<any[]>(`
            SELECT SPLIT_PART(data, ' ', 1) as date,
                COALESCE(NULLIF(atribuicao, ''), 'Não identificado') as atribuicao,
                COALESCE(SUM(CASE WHEN receita_do_produto ~ '^[0-9]' THEN
                    CAST(REPLACE(REPLACE(receita_do_produto, '.', ''), ',', '.') AS NUMERIC)
                    ELSE 0 END), 0) as receita
            FROM bd_mag ${where} AND data IS NOT NULL AND data != ''
            GROUP BY SPLIT_PART(data, ' ', 1), COALESCE(NULLIF(atribuicao, ''), 'Não identificado')
            ORDER BY (${NORMALIZE_DATE_EXPR("SPLIT_PART(data, ' ', 1)")}) ASC
        `, ...params),

        // 9. Filter options (distinct values)
        prisma.$queryRawUnsafe<any[]>(`
            SELECT
                array_agg(DISTINCT status) FILTER (WHERE status IS NOT NULL AND status != '') as statuses,
                array_agg(DISTINCT atribuicao) FILTER (WHERE atribuicao IS NOT NULL AND atribuicao != '') as atribuicoes,
                array_agg(DISTINCT origem) FILTER (WHERE origem IS NOT NULL AND origem != '') as origens,
                array_agg(DISTINCT midia) FILTER (WHERE midia IS NOT NULL AND midia != '') as midias,
                array_agg(DISTINCT categoria) FILTER (WHERE categoria IS NOT NULL AND categoria != '') as categorias
            FROM bd_mag
        `),

        // 10. Google Ads revenue (atribuicao contains 'google')
        prisma.$queryRawUnsafe<any[]>(`
            SELECT COALESCE(SUM(CASE WHEN receita_do_produto ~ '^[0-9]' THEN
                    CAST(REPLACE(REPLACE(receita_do_produto, '.', ''), ',', '.') AS NUMERIC)
                    ELSE 0 END), 0) as value
            FROM bd_mag ${where} AND LOWER(atribuicao) LIKE '%google%'
        `, ...params),

        // 11. ROAS revenue (atribuicao not in 'vendedor', 'outros', '')
        prisma.$queryRawUnsafe<any[]>(`
            SELECT COALESCE(SUM(CASE WHEN receita_do_produto ~ '^[0-9]' THEN
                    CAST(REPLACE(REPLACE(receita_do_produto, '.', ''), ',', '.') AS NUMERIC)
                    ELSE 0 END), 0) as value
            FROM bd_mag ${where} AND LOWER(atribuicao) NOT IN ('vendedor', 'outros', '')
                AND atribuicao IS NOT NULL
        `, ...params),

        // 12. Unique customers
        prisma.$queryRawUnsafe<any[]>(`
            SELECT COUNT(DISTINCT NULLIF(cpf_cliente, '')) as total
            FROM bd_mag ${where}
        `, ...params),

        // 13. Google Ads conversion_value total (from google_ads table)
        prisma.$queryRawUnsafe<any[]>(`
            SELECT COALESCE(SUM(CASE WHEN conversion_value ~ '^[0-9]' THEN
                CAST(REPLACE(REPLACE(conversion_value, '.', ''), ',', '.') AS NUMERIC)
                ELSE 0 END), 0) as value
            FROM google_ads WHERE 1=1${gadsDateClause}
        `),

        // 14. Google Ads daily conversion_value (from google_ads table)
        prisma.$queryRawUnsafe<any[]>(`
            SELECT date,
                COALESCE(SUM(CASE WHEN conversion_value ~ '^[0-9]' THEN
                    CAST(REPLACE(REPLACE(conversion_value, '.', ''), ',', '.') AS NUMERIC)
                    ELSE 0 END), 0) as receita
            FROM google_ads WHERE 1=1${gadsDateClause}
            GROUP BY date
            ORDER BY date ASC
        `),
    ]);

    const totals = totalsResult[0] || {};
    const totalReceita = parseFloat(totals.total_receita || '0');
    const totalValorSemFrete = parseFloat(totals.total_sem_frete || '0');
    const totalValorComFrete = parseFloat(totals.total_com_frete || '0');
    const totalPedidos = parseInt(totals.total_pedidos || '0');
    const totalProdutosVendidos = parseInt(totals.total_produtos || '0');
    const totalClientes = parseInt(uniqueCustomersResult[0]?.total || '0');
    const ticketMedio = totalPedidos > 0 ? totalValorSemFrete / totalPedidos : 0;

    // Replace Google_Ads value with conversion_value from google_ads table
    const gadsConversionTotal = parseFloat(gadsConversionValueResult[0]?.value || '0');
    const byAtribuicao = byAtribuicaoResult.map(r => {
        const name = r.name;
        const value = parseFloat(r.value || '0');
        // Override Google_Ads with conversion_value from google_ads table
        if (name === 'Google_Ads') {
            return { name, value: gadsConversionTotal };
        }
        return { name, value };
    });
    const byCategory = byCategoryResult.map(r => ({ name: r.name, value: parseFloat(r.value || '0') }));
    const byState = byStateResult.map(r => ({ name: r.name, value: parseFloat(r.value || '0') }));
    const bySeller = bySellerResult.map(r => ({ name: r.name, value: parseFloat(r.value || '0') }));
    const byDayOfWeek = byDayOfWeekResult.map(r => ({ name: r.name, value: parseFloat(r.value || '0') }));
    const byChannel = byAtribuicao; // same data, different name

    const dailyRevenue = dailyRevenueResult.map(r => ({
        date: r.date,
        receita: parseFloat(r.receita || '0'),
        pedidos: parseInt(r.pedidos || '0'),
    }));

    // Build daily google_ads conversion_value lookup
    const gadsDailyMap: Record<string, number> = {};
    gadsDailyConversionValueResult.forEach(r => {
        gadsDailyMap[r.date] = parseFloat(r.receita || '0');
    });

    // Pivot daily atribuicao data, replacing Google_Ads with conversion_value
    const allAtribuicoes = [...new Set(dailyAtribuicaoResult.map(r => r.atribuicao))];
    const dailyAtribuicaoMap: Record<string, Record<string, number>> = {};
    dailyAtribuicaoResult.forEach(r => {
        if (!dailyAtribuicaoMap[r.date]) dailyAtribuicaoMap[r.date] = {};
        dailyAtribuicaoMap[r.date][r.atribuicao] = parseFloat(r.receita || '0');
    });

    // Also inject google_ads daily data for dates that only exist in google_ads
    Object.keys(gadsDailyMap).forEach(date => {
        if (!dailyAtribuicaoMap[date]) dailyAtribuicaoMap[date] = {};
    });

    const dailyRevenueByAtribuicao = Object.entries(dailyAtribuicaoMap).map(([date, atribData]) => {
        const entry: any = { date };
        // Normalize date format for gadsDailyMap lookup (bd_mag may have DD/MM/YYYY)
        let normalizedDate = date;
        if (date.includes('/')) {
            const [d, m, y] = date.split('/');
            normalizedDate = `${y}-${m}-${d}`;
        }
        allAtribuicoes.forEach(a => {
            if (a === 'Google_Ads') {
                entry[a] = gadsDailyMap[normalizedDate] || 0;
            } else {
                entry[a] = atribData[a] || 0;
            }
        });
        return entry;
    });

    const receitaGoogleAds = gadsConversionTotal;
    const receitaParaROAS = parseFloat(roasRevenueResult[0]?.value || '0');

    const filterOpts = filterOptionsResult[0] || {};

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
        totalClientes,
        totalProdutosVendidos,
        topSkus: [] as any[], // Not computed in SQL to avoid complexity
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
            origens: (filterOpts.origens || []).sort(),
            midias: (filterOpts.midias || []).sort(),
            categorias: (filterOpts.categorias || []).sort(),
            atribuicoes: (filterOpts.atribuicoes || []).sort(),
            status: (filterOpts.statuses || []).sort(),
        },
    };
}

// YoY aggregation - SQL-level, returns ~24 rows instead of 198k
export async function getCatalogoYoYAggregated() {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    const [monthlyResult, categoryResult] = await Promise.all([
        // Monthly aggregation by year
        prisma.$queryRawUnsafe<any[]>(`
            SELECT
                CAST(SUBSTRING(normalized_date FROM 1 FOR 4) AS INTEGER) as year,
                CAST(SUBSTRING(normalized_date FROM 6 FOR 2) AS INTEGER) as month,
                COALESCE(SUM(CASE WHEN receita_do_produto ~ '^[0-9]' THEN
                    CAST(REPLACE(REPLACE(receita_do_produto, '.', ''), ',', '.') AS NUMERIC)
                    ELSE 0 END), 0) as receita,
                COUNT(DISTINCT NULLIF(pedido, '')) as pedidos
            FROM (
                SELECT *, ${NORMALIZE_DATE_EXPR('data')} as normalized_date
                FROM bd_mag
                WHERE ${COMPLETED_STATUS_FILTER}
            ) sub
            WHERE normalized_date IS NOT NULL
                AND CAST(SUBSTRING(normalized_date FROM 1 FOR 4) AS INTEGER) IN ($1, $2)
            GROUP BY year, month
            ORDER BY year, month
        `, currentYear, previousYear),

        // Category aggregation by year
        prisma.$queryRawUnsafe<any[]>(`
            SELECT
                CAST(SUBSTRING(normalized_date FROM 1 FOR 4) AS INTEGER) as year,
                COALESCE(NULLIF(categoria, ''), 'Sem Categoria') as categoria,
                COALESCE(SUM(CASE WHEN receita_do_produto ~ '^[0-9]' THEN
                    CAST(REPLACE(REPLACE(receita_do_produto, '.', ''), ',', '.') AS NUMERIC)
                    ELSE 0 END), 0) as receita
            FROM (
                SELECT *, ${NORMALIZE_DATE_EXPR('data')} as normalized_date
                FROM bd_mag
                WHERE ${COMPLETED_STATUS_FILTER}
            ) sub
            WHERE normalized_date IS NOT NULL
                AND CAST(SUBSTRING(normalized_date FROM 1 FOR 4) AS INTEGER) IN ($1, $2)
                AND categoria IS NOT NULL AND categoria != ''
            GROUP BY year, categoria
            ORDER BY receita DESC
        `, currentYear, previousYear),
    ]);

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // Build monthly data by year
    const monthlyByYear: Record<number, Record<number, { receita: number; pedidos: number }>> = {};
    monthlyResult.forEach(r => {
        const year = parseInt(r.year);
        const month = parseInt(r.month) - 1; // 0-indexed
        if (!monthlyByYear[year]) monthlyByYear[year] = {};
        monthlyByYear[year][month] = { receita: parseFloat(r.receita || '0'), pedidos: parseInt(r.pedidos || '0') };
    });

    const monthlyComparison = monthNames.map((name, idx) => ({
        month: name,
        currentYear: monthlyByYear[currentYear]?.[idx]?.receita || 0,
        previousYear: monthlyByYear[previousYear]?.[idx]?.receita || 0,
    }));

    const currentYearReceita = Object.values(monthlyByYear[currentYear] || {}).reduce((sum, m) => sum + m.receita, 0);
    const previousYearReceita = Object.values(monthlyByYear[previousYear] || {}).reduce((sum, m) => sum + m.receita, 0);
    const currentYearPedidos = Object.values(monthlyByYear[currentYear] || {}).reduce((sum, m) => sum + m.pedidos, 0);
    const previousYearPedidos = Object.values(monthlyByYear[previousYear] || {}).reduce((sum, m) => sum + m.pedidos, 0);

    const receitaYoYPercent = previousYearReceita > 0 ? ((currentYearReceita - previousYearReceita) / previousYearReceita) * 100 : 0;
    const pedidosYoYPercent = previousYearPedidos > 0 ? ((currentYearPedidos - previousYearPedidos) / previousYearPedidos) * 100 : 0;
    const currentYearTicket = currentYearPedidos > 0 ? currentYearReceita / currentYearPedidos : 0;
    const previousYearTicket = previousYearPedidos > 0 ? previousYearReceita / previousYearPedidos : 0;
    const ticketYoYPercent = previousYearTicket > 0 ? ((currentYearTicket - previousYearTicket) / previousYearTicket) * 100 : 0;

    // Category growth
    const categoryByYear: Record<number, Record<string, number>> = {};
    categoryResult.forEach(r => {
        const year = parseInt(r.year);
        if (!categoryByYear[year]) categoryByYear[year] = {};
        categoryByYear[year][r.categoria] = parseFloat(r.receita || '0');
    });

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

export async function getTVSalesData(): Promise<any[]> {
    const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM tv_sales`);
    return rows.map(r => ({
        orderNumber: r.n_pedido || r.pedido || '',
        orderDate: r.data || '',
        televendas: r.televendas || '',
        month: r.mes || '',
    }));
}

export async function getMetasData(): Promise<any[]> {
    const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM metas`);
    return rows;
}
