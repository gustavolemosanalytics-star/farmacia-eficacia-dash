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
};

// --- DATA FETCHERS ---

// Helper to parse Brazilian number format (comma as decimal, dot as thousands)
function parseBRNumber(val: any): number {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    // Remove currency, spaces, and dots (thousands), replace comma with dot
    const str = val.toString().trim()
        .replace(/[R$]/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

export async function getCatalogoData(startDate?: Date, endDate?: Date): Promise<CatalogoItem[]> {
    const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM bd_mag`);

    return rows.map(r => ({
        mpn: r.mpn || '',
        pedido: r.pedido || '',
        dataTransacao: r.data_transacao || '',
        status: r.status || '',
        nomeProduto: r.nome_do_produto || r.nome_do_produto2 || '',
        receitaProduto: parseBRNumber(r.receita_do_produto),
        cidade: r.cidade || '',
        estado: r.estado || '',
        valorTotalSemFrete: parseBRNumber(r.valor_total_sem_frete),
        valorTotalComFrete: parseBRNumber(r.valor_total_com_frete),
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
    const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM ga4`);

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

export async function getGoogleAdsData(): Promise<GoogleAdsItem[]> {
    const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM google_ads`);

    return rows.map(r => ({
        day: r.date || r.day || '',
        account: r.account_name || r.account_cust || r.account || '',
        campaign: r.campaign || '',
        cost: parseBRNumber(r.spend || r.cost || r.investimento),
        conversions: parseBRNumber(r.conversions || r.conversoes),
        conversionValue: parseBRNumber(r.conversion_value || r.conv_value || r.receita),
        clicks: Math.round(parseBRNumber(r.clicks || r.cliques)),
        impressions: Math.round(parseBRNumber(r.impressions || r.impressoes)),
        ctr: parseBRNumber(r.ctr?.toString().replace('%', '')),
        campaignCategory: r.campanha || '',
    }));
}

export async function getGA4SessionsData(startDate?: Date, endDate?: Date): Promise<GA4SessionsItem[]> {
    // Reading sessions from the 'ga4' table as requested (user says sessions are in ga4 tab)
    const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM ga4`);

    return rows.map(r => ({
        date: r.date || '',
        sessions: parseInt((r.sessions || '0').toString().replace(/\./g, '').replace(',', '.')),
        source: r.session_source_medium || r.event_source_medium || r.origem || '',
        campaign: r.campaign_name || r.event_campaign || r.campanha || '',
        engagementRate: parseFloat((r.engagement_rate || r.taxa_de_engajamento || '0').toString().replace('%', '').replace(',', '.').trim()) / 100 || 0,
        atribuicao: (r.atribuicao || '').toString().trim(),
    }));
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
