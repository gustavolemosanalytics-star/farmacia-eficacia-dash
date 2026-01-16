// Google Analytics 4 Data (BD GA4) - Estrutura extraída da planilha
// Colunas: Transaction Date, Event source/medium, Event campaign, Purchase revenue, 
// Event Google Ads Account, Mídia, Status, Data, Atribuição 1, Cidade, Estado, Nome do Produto

export interface GA4Entry {
    transactionId: string;
    transactionDate: string;
    eventSourceMedium: string;
    eventCampaign: string;
    purchaseRevenue: number;
    googleAdsAccount: string;
    midia: string;
    status: string;
    data: string;
    atribuicao1?: string; // Nova coluna
    cidade?: string;      // Nova coluna
    estado?: string;      // Nova coluna
    nomeProduto?: string; // Nova coluna
}

// Dados reais extraídos da planilha (amostra estruturada)
export const ga4Data: GA4Entry[] = [
    {
        transactionId: '68987',
        transactionDate: '2026-01-15',
        eventSourceMedium: 'google / cpc',
        eventCampaign: 'e_search_institucional_exata',
        purchaseRevenue: 329.17,
        googleAdsAccount: 'Principal',
        midia: '',
        status: 'Faturado',
        data: '15/01/2026',
        atribuicao1: 'Google_Ads',
        cidade: 'São Paulo',
        estado: 'SP',
        nomeProduto: 'Tadalafila 20mg 30 Comprimidos'
    },
    {
        transactionId: '70000',
        transactionDate: '2026-01-15',
        eventSourceMedium: '(direct) / (none)',
        eventCampaign: '(direct)',
        purchaseRevenue: 201.00,
        googleAdsAccount: '(not set)',
        midia: '',
        status: 'Faturado',
        data: '15/01/2026',
        atribuicao1: 'Direto',
        cidade: 'Rio de Janeiro',
        estado: 'RJ',
        nomeProduto: 'Minoxidil 5% 100ml'
    },
    {
        transactionId: '70001',
        transactionDate: '2026-01-15',
        eventSourceMedium: 'ig / social',
        eventCampaign: '(referral)',
        purchaseRevenue: 201.00,
        googleAdsAccount: '(not set)',
        midia: '',
        status: 'Faturado',
        data: '15/01/2026',
        atribuicao1: 'Orgânico',
        cidade: 'Belo Horizonte',
        estado: 'MG',
        nomeProduto: 'Minoxidil 5% 100ml'
    },
    {
        transactionId: '70009',
        transactionDate: '2026-01-15',
        eventSourceMedium: 'google / cpc',
        eventCampaign: 'e_search_institucional_exata',
        purchaseRevenue: 137.99,
        googleAdsAccount: 'Principal',
        midia: '',
        status: 'Cancelado',
        data: '15/01/2026',
        atribuicao1: 'Google_Ads',
        cidade: 'Curitiba',
        estado: 'PR',
        nomeProduto: 'Finasterida 1mg'
    },
    {
        transactionId: '70014',
        transactionDate: '2026-01-15',
        eventSourceMedium: 'google / cpc',
        eventCampaign: 'Pmax_Dapa-Bórico-Ejaculação_MG',
        purchaseRevenue: 14.29,
        googleAdsAccount: 'Principal',
        midia: '',
        status: 'Faturado',
        data: '15/01/2026',
        atribuicao1: 'Google_Ads',
        cidade: 'Belo Horizonte',
        estado: 'MG',
        nomeProduto: 'Vitamina C'
    },
    {
        transactionId: '70015',
        transactionDate: '2026-01-15',
        eventSourceMedium: 'google / cpc',
        eventCampaign: 'e_search_institucional_exata',
        purchaseRevenue: 74.45,
        googleAdsAccount: 'Principal',
        midia: '',
        status: 'Faturado',
        data: '15/01/2026',
        atribuicao1: 'Google_Ads',
        cidade: 'São Paulo',
        estado: 'SP',
        nomeProduto: 'Omega 3'
    },
    {
        transactionId: '70016',
        transactionDate: '2026-01-15',
        eventSourceMedium: 'blue / cpc',
        eventCampaign: 'retargetingblue',
        purchaseRevenue: 6.84,
        googleAdsAccount: 'Principal',
        midia: '',
        status: 'Faturado',
        data: '15/01/2026',
        atribuicao1: 'Blue',
        cidade: 'Porto Alegre',
        estado: 'RS',
        nomeProduto: 'Dipirona'
    },
    {
        transactionId: '69088',
        transactionDate: '2026-01-15',
        eventSourceMedium: 'google / cpc',
        eventCampaign: 'Shopping-Contenção_Todos-os-Produtos',
        purchaseRevenue: 1.55,
        googleAdsAccount: 'Principal',
        midia: '',
        status: 'Faturado',
        data: '15/01/2026',
        atribuicao1: 'Google_Ads',
        cidade: 'Campinas',
        estado: 'SP',
        nomeProduto: 'Aspirina'
    },
    {
        transactionId: '17009',
        transactionDate: '2026-01-14',
        eventSourceMedium: 'ActiveCampaign / email',
        eventCampaign: 'ac_desempenho_2',
        purchaseRevenue: 0.47,
        googleAdsAccount: '',
        midia: '',
        status: 'Faturado',
        data: '14/01/2026',
        atribuicao1: 'Email',
        cidade: 'Salvador',
        estado: 'BA',
        nomeProduto: 'Teste Produto'
    },
    {
        transactionId: '68919',
        transactionDate: '2026-01-14',
        eventSourceMedium: 'google / cpc',
        eventCampaign: 'Shopping-Contenção_Todos-os-Produtos',
        purchaseRevenue: 0,
        googleAdsAccount: 'Principal',
        midia: '',
        status: 'Cancelado',
        data: '14/01/2026',
        atribuicao1: 'Google_Ads',
        cidade: 'Recife',
        estado: 'PE',
        nomeProduto: 'Produto Cancelado'
    },
    {
        transactionId: '69918',
        transactionDate: '2026-01-14',
        eventSourceMedium: 'blue / cpc',
        eventCampaign: 'retargetingblue',
        purchaseRevenue: 284.4,
        googleAdsAccount: '(not set)',
        midia: '',
        status: 'Faturado',
        data: '14/01/2026',
        atribuicao1: 'Blue',
        cidade: 'São Paulo',
        estado: 'SP',
        nomeProduto: 'Kit Emagrecimento'
    },
    {
        transactionId: '69946',
        transactionDate: '2026-01-14',
        eventSourceMedium: 'blue / cpc',
        eventCampaign: 'retargetingblue',
        purchaseRevenue: 275.54,
        googleAdsAccount: '(not set)',
        midia: '',
        status: 'Faturado',
        data: '14/01/2026',
        atribuicao1: 'Blue',
        cidade: 'Rio de Janeiro',
        estado: 'RJ',
        nomeProduto: 'Suplemento Whey'
    },
    {
        transactionId: '3000042211',
        transactionDate: '2026-01-14',
        eventSourceMedium: 'google / cpc',
        eventCampaign: 'Pmax-far_Todos-os-produtos',
        purchaseRevenue: 206.00,
        googleAdsAccount: 'Secundária',
        midia: '',
        status: 'Faturado',
        data: '14/01/2026',
        atribuicao1: 'Google_Ads',
        cidade: 'Brasília',
        estado: 'DF',
        nomeProduto: 'Polivitamínico'
    },
    {
        transactionId: '70026',
        transactionDate: '2026-01-14',
        eventSourceMedium: 'ActiveCampaing / E-mail',
        eventCampaign: '(not set)',
        purchaseRevenue: 1.67,
        googleAdsAccount: '',
        midia: '',
        status: 'Faturado',
        data: '14/01/2026',
        atribuicao1: 'Email',
        cidade: 'Fortaleza',
        estado: 'CE',
        nomeProduto: 'Amostra Grátis'
    },
    {
        transactionId: '69988',
        transactionDate: '2026-01-14',
        eventSourceMedium: 'ActiveCampaing / E-mail',
        eventCampaign: '(not set)',
        purchaseRevenue: 177.00,
        googleAdsAccount: '(not set)',
        midia: '',
        status: 'Faturado',
        data: '14/01/2026',
        atribuicao1: 'Email',
        cidade: 'Goiânia',
        estado: 'GO',
        nomeProduto: 'Kit Pele'
    },
    {
        transactionId: '69992',
        transactionDate: '2026-01-14',
        eventSourceMedium: 'google / cpc',
        eventCampaign: 'Shopping-Contenção_Todos-os-Produtos',
        purchaseRevenue: 168.99,
        googleAdsAccount: 'Principal',
        midia: '',
        status: 'Faturado',
        data: '14/01/2026',
        atribuicao1: 'Google_Ads',
        cidade: 'Curitiba',
        estado: 'PR',
        nomeProduto: 'Creme Facial'
    },
    {
        transactionId: '68902',
        transactionDate: '2026-01-14',
        eventSourceMedium: '(direct)',
        eventCampaign: '(none)',
        purchaseRevenue: 144.50,
        googleAdsAccount: '',
        midia: '',
        status: 'Faturado',
        data: '14/01/2026',
        atribuicao1: 'Direto',
        cidade: 'Manaus',
        estado: 'AM',
        nomeProduto: 'Protetor Solar'
    },
    {
        transactionId: '69943',
        transactionDate: '2026-01-14',
        eventSourceMedium: 'accounts.google.com / referral',
        eventCampaign: '',
        purchaseRevenue: 151.22,
        googleAdsAccount: '',
        midia: '',
        status: 'Faturado',
        data: '14/01/2026',
        atribuicao1: 'Orgânico',
        cidade: 'Belém',
        estado: 'PA',
        nomeProduto: 'Shampoo Antiqueda'
    },
    {
        transactionId: '69914',
        transactionDate: '2026-01-14',
        eventSourceMedium: 'google / cpc',
        eventCampaign: 'Shopping-Contenção_Todos-os-Produtos',
        purchaseRevenue: 148,
        googleAdsAccount: 'Principal',
        midia: '',
        status: 'Faturado',
        data: '14/01/2026',
        atribuicao1: 'Google_Ads',
        cidade: 'Vitória',
        estado: 'ES',
        nomeProduto: 'Colágeno'
    },
    {
        transactionId: '68952',
        transactionDate: '2026-01-14',
        eventSourceMedium: 'google / organic',
        eventCampaign: '(organic)',
        purchaseRevenue: 149.45,
        googleAdsAccount: '',
        midia: '',
        status: 'Faturado',
        data: '14/01/2026',
        atribuicao1: 'Orgânico',
        cidade: 'Florianópolis',
        estado: 'SC',
        nomeProduto: 'Magnésio'
    },
];

// Função para agregar KPIs de GA4
export const getGA4KPIs = (data: GA4Entry[] = ga4Data) => {
    const totalRevenue = data.reduce((sum, entry) => sum + entry.purchaseRevenue, 0);
    const totalTransactions = data.length;
    const ticketMedio = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Agrupar por source/medium
    const bySourceMedium = data.reduce((acc, entry) => {
        const source = entry.eventSourceMedium || 'Unknown';
        if (!acc[source]) {
            acc[source] = { revenue: 0, transactions: 0 };
        }
        acc[source].revenue += entry.purchaseRevenue;
        acc[source].transactions++;
        return acc;
    }, {} as Record<string, { revenue: number; transactions: number }>);

    // Calcular receita por canal
    const googleCPC = data.filter(e => e.eventSourceMedium?.includes('google / cpc'))
        .reduce((sum, e) => sum + e.purchaseRevenue, 0);
    const blueCPC = data.filter(e => e.eventSourceMedium?.includes('blue / cpc'))
        .reduce((sum, e) => sum + e.purchaseRevenue, 0);
    const organic = data.filter(e => e.eventSourceMedium?.includes('organic'))
        .reduce((sum, e) => sum + e.purchaseRevenue, 0);
    const direct = data.filter(e => e.eventSourceMedium?.includes('direct'))
        .reduce((sum, e) => sum + e.purchaseRevenue, 0);
    const email = data.filter(e => e.eventSourceMedium?.toLowerCase().includes('email'))
        .reduce((sum, e) => sum + e.purchaseRevenue, 0);
    const social = data.filter(e => e.eventSourceMedium?.includes('social'))
        .reduce((sum, e) => sum + e.purchaseRevenue, 0);

    return {
        totalRevenue,
        totalRevenue_formatted: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        totalTransactions,
        ticketMedio,
        ticketMedio_formatted: `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        bySourceMedium,
        byChannel: {
            googleCPC,
            blueCPC,
            organic,
            direct,
            email,
            social
        }
    };
};

// Top Atribuição 1 por Receita
export const getTopAttribution = (data: GA4Entry[] = ga4Data) => {
    const acc = data.reduce((acc, entry) => {
        const attr = entry.atribuicao1 || 'Orgânico'; // Substituir N/A por Orgânico
        if (!acc[attr]) acc[attr] = 0;
        acc[attr] += entry.purchaseRevenue;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(acc)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value }));
};

// Receita por Dia
export const getDailyRevenue = (data: GA4Entry[] = ga4Data) => {
    const acc = data.reduce((acc, entry) => {
        const date = entry.data || entry.transactionDate;
        // Normalizar data dd/mm/yyyy
        if (!acc[date]) acc[date] = 0;
        acc[date] += entry.purchaseRevenue;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(acc)
        .sort((a, b) => new Date(a[0].split('/').reverse().join('-')).getTime() - new Date(b[0].split('/').reverse().join('-')).getTime())
        .map(([date, value]) => ({ date, value }));
};

// Receita por UF
export const getRevenueByState = (data: GA4Entry[] = ga4Data) => {
    const acc = data.reduce((acc, entry) => {
        const state = entry.estado || 'Outros';
        if (!acc[state]) acc[state] = 0;
        acc[state] += entry.purchaseRevenue;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(acc)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value }));
};

// Receita por Cidade
export const getRevenueByCity = (data: GA4Entry[] = ga4Data) => {
    const acc = data.reduce((acc, entry) => {
        const city = entry.cidade || 'Outros';
        if (!acc[city]) acc[city] = 0;
        acc[city] += entry.purchaseRevenue;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(acc)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10) // Top 10
        .map(([name, value]) => ({ name, value }));
};

// Status Breakdown (Faturado vs Cancelado)
export const getStatusBreakdown = (data: GA4Entry[] = ga4Data) => {
    const acc = data.reduce((acc, entry) => {
        const status = entry.status || 'Desconhecido';
        if (!acc[status]) acc[status] = 0;
        acc[status]++;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(acc)
        .map(([name, value]) => ({ name, value }));
};

// Top Produtos por Atribuição
export const getTopProductsByAttribution = (data: GA4Entry[] = ga4Data) => {
    const getTopFor = (attr: string) => {
        const filtered = data.filter(e => (e.atribuicao1 || 'Orgânico').includes(attr));
        const products = filtered.reduce((acc, entry) => {
            const prod = entry.nomeProduto || 'Produto Desconhecido';
            if (!acc[prod]) acc[prod] = 0;
            acc[prod] += entry.purchaseRevenue;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(products)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value]) => ({ name, value }));
    };

    return {
        googleAds: getTopFor('Google_Ads'),
        blue: getTopFor('Blue'),
        organic: getTopFor('Orgânico'),
        direct: getTopFor('Direto')
    };
};
