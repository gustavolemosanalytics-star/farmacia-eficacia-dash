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
};

export type GoogleAdsItem = {
    day: string;
    account: string;
    campaign: string;
    cost: number;
    conversions: number;
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
};

// --- DATA FETCHERS ---

export async function getCatalogoData(startDate?: Date, endDate?: Date): Promise<CatalogoItem[]> {
    const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM bd_mag`);

    return rows.map(r => ({
        mpn: r.mpn || '',
        pedido: r.pedido || '',
        dataTransacao: r.data_transacao || '',
        status: r.status || '',
        nomeProduto: r.nome_do_produto || r.nome_do_produto2 || '',
        receitaProduto: parseFloat(r.receita_do_produto || '0'),
        cidade: r.cidade || '',
        estado: r.estado || '',
        valorTotalSemFrete: parseFloat(r.valor_total_sem_frete || '0'),
        valorTotalComFrete: parseFloat(r.valor_total_com_frete || '0'),
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
        transactionId: r.transaction || r.transaction_id || '',
        transactionDate: r.date || '',
        eventSourceMedium: r.event_source_medium || '',
        eventCampaign: r.event_campaign || r.campaign || '',
        purchaseRevenue: parseFloat(r.purchase_revenue || '0'),
        googleAdsAccount: r.event_google_ads_account || r.google_ads_account || '',
        midia: r.midia || '',
        status: r.status || '',
        data: r.data || '',
    }));
}

export async function getGoogleAdsData(): Promise<GoogleAdsItem[]> {
    const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM google_ads`);

    return rows.map(r => ({
        day: r.day || '',
        account: r.account_cust || r.account || '',
        campaign: r.campaign || '',
        cost: parseFloat((r.cost || '0').toString().replace(',', '.')),
        conversions: parseFloat((r.conversions || '0').toString().replace(',', '.')),
        clicks: parseInt((r.clicks || '0').toString().replace('.', '')),
        impressions: parseInt((r.impressions || '0').toString().replace('.', '')),
        ctr: parseFloat((r.ctr || '0').toString().replace('%', '').replace(',', '.')),
        campaignCategory: r.campanha || '',
    }));
}

export async function getGA4SessionsData(startDate?: Date, endDate?: Date): Promise<GA4SessionsItem[]> {
    const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM ga4_sessions`);

    return rows.map(r => ({
        date: r.date || '',
        sessions: parseInt((r.sessions || '0').toString().replace('.', '')),
        source: r.session_source || r.session_source_medium || '',
        campaign: r.session_campaign || '',
        engagementRate: parseFloat((r.engagement_rate || r.taxa_de_engajamento || '0').toString().replace('%', '').replace(',', '.').trim()) / 100 || 0,
    }));
}
