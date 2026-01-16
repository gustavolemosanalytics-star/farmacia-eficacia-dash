// Google Ads Data (BD GAds) - Estrutura extraída da planilha
// Colunas: Day, Account (Custumer ID), Campaign, Cost, Cost/conv, Conversions, Campaign start date, 
// Campaign status, Clicks, CTR, Nº da Semana, Data, Mês, Campanha, Meta Daniel

export interface GoogleAdsEntry {
    day: string;
    account: string;
    campaign: string;
    cost: number;
    costPerConversion: number;
    conversions: number;
    campaignStartDate: string;
    campaignStatus: string;
    clicks: number;
    ctr: number;
    weekNumber: string;
    data: string;
    month: string;
    campaignCategory: string;
    metaDaniel: string;
}

// Dados reais extraídos da planilha (amostra)
export const googleAdsData: GoogleAdsEntry[] = [
    {
        day: '2025-12-28',
        account: 'Principal',
        campaign: 'Pmax_Candidase',
        cost: 7.17,
        costPerConversion: 7.17,
        conversions: 1,
        campaignStartDate: '2025-10-21',
        campaignStatus: 'Eligible (limited)',
        clicks: 4,
        ctr: 0.089,
        weekNumber: '53 Semana',
        data: '28/12/2025',
        month: 'dezembro',
        campaignCategory: '',
        metaDaniel: ''
    },
    {
        day: '2025-12-28',
        account: 'Principal',
        campaign: 'Pmax_Dapa-Borico-Ejaculacao_MG',
        cost: 14.85,
        costPerConversion: 28.42,
        conversions: 2,
        campaignStartDate: '2025-10-25',
        campaignStatus: 'Eligible (limited)',
        clicks: 34,
        ctr: 2.41,
        weekNumber: '53 Semana',
        data: '28/12/2025',
        month: 'dezembro',
        campaignCategory: '',
        metaDaniel: ''
    },
    {
        day: '2025-12-28',
        account: 'Principal',
        campaign: 'Pmax_Magnetislo',
        cost: 22.01,
        costPerConversion: 0,
        conversions: 0,
        campaignStartDate: '2025-10-29',
        campaignStatus: 'Eligible (limited)',
        clicks: 7,
        ctr: 1.50,
        weekNumber: '53 Semana',
        data: '28/12/2025',
        month: 'dezembro',
        campaignCategory: '',
        metaDaniel: ''
    },
    {
        day: '2025-12-28',
        account: 'Principal',
        campaign: 'Pmax_Visitas-a-Loja_Av-Brasil',
        cost: 0.02,
        costPerConversion: 0,
        conversions: 0,
        campaignStartDate: '2024-10-25',
        campaignStatus: 'Eligible (limited)',
        clicks: 2,
        ctr: 3.64,
        weekNumber: '53 Semana',
        data: '28/12/2025',
        month: 'dezembro',
        campaignCategory: '',
        metaDaniel: ''
    },
    {
        day: '2025-12-28',
        account: 'Principal',
        campaign: 'Pmax_Visitas-a-Loja_Curitiba',
        cost: 15.97,
        costPerConversion: 5.53,
        conversions: 2,
        campaignStartDate: '2024-10-25',
        campaignStatus: 'Eligible (limited)',
        clicks: 54,
        ctr: 5.56,
        weekNumber: '53 Semana',
        data: '28/12/2025',
        month: 'dezembro',
        campaignCategory: '',
        metaDaniel: ''
    },
    {
        day: '2025-12-28',
        account: 'Principal',
        campaign: 'Pmax_Visitas-a-Loja_Life-Center',
        cost: 1.20,
        costPerConversion: 0,
        conversions: 0,
        campaignStartDate: '2024-01-24',
        campaignStatus: 'Eligible (limited)',
        clicks: 54,
        ctr: 5.56,
        weekNumber: '53 Semana',
        data: '28/12/2025',
        month: 'dezembro',
        campaignCategory: '',
        metaDaniel: ''
    },
    {
        day: '2025-12-28',
        account: 'Principal',
        campaign: 'Pmax_Vitamina_BH',
        cost: 39.79,
        costPerConversion: 0,
        conversions: 4,
        campaignStartDate: '2024-05-14',
        campaignStatus: 'eligible',
        clicks: 0,
        ctr: 0,
        weekNumber: '53 Semana',
        data: '28/12/2025',
        month: 'dezembro',
        campaignCategory: '',
        metaDaniel: ''
    },
    {
        day: '2025-12-28',
        account: 'Principal',
        campaign: 'Search_Leads_Manipulados_MG',
        cost: 84.93,
        costPerConversion: 9.99,
        conversions: 8.5,
        campaignStartDate: '2024-05-14',
        campaignStatus: 'Eligible',
        clicks: 4,
        ctr: 5.60,
        weekNumber: '53 Semana',
        data: '28/12/2025',
        month: 'dezembro',
        campaignCategory: '',
        metaDaniel: ''
    },
    {
        day: '2025-12-28',
        account: 'Principal',
        campaign: 'Shopping-Conteção_Todos-os-Produtos',
        cost: 490.49,
        costPerConversion: 24.65,
        conversions: 19.90,
        campaignStartDate: '2024-10-25',
        campaignStatus: 'Eligible',
        clicks: 790,
        ctr: 0.96,
        weekNumber: '53 Semana',
        data: '28/12/2025',
        month: 'dezembro',
        campaignCategory: '',
        metaDaniel: ''
    },
    {
        day: '2025-12-28',
        account: 'Principal',
        campaign: 'Shopping_Curva-A2',
        cost: 25.84,
        costPerConversion: 0,
        conversions: 0,
        campaignStartDate: '2024-10-25',
        campaignStatus: 'Eligible',
        clicks: 35,
        ctr: 0.07,
        weekNumber: '53 Semana',
        data: '28/12/2025',
        month: 'dezembro',
        campaignCategory: '',
        metaDaniel: ''
    },
    {
        day: '2025-12-28',
        account: 'Principal',
        campaign: 'Shopping_Vitamina',
        cost: 11.47,
        costPerConversion: 1.49,
        conversions: 0,
        campaignStartDate: '2024-05-01',
        campaignStatus: 'Eligible',
        clicks: 22,
        ctr: 1.53,
        weekNumber: '53 Semana',
        data: '28/12/2025',
        month: 'dezembro',
        campaignCategory: '',
        metaDaniel: ''
    },
    {
        day: '2025-12-28',
        account: 'Principal',
        campaign: 'Shopping_Curva-B2',
        cost: 30.1,
        costPerConversion: 10.03,
        conversions: 3,
        campaignStartDate: '2025-11-13',
        campaignStatus: 'Eligible',
        clicks: 53,
        ctr: 1.03,
        weekNumber: '53 Semana',
        data: '28/12/2025',
        month: 'dezembro',
        campaignCategory: '',
        metaDaniel: ''
    },
    {
        day: '2025-12-28',
        account: 'Principal',
        campaign: 'Shopping_Dapa',
        cost: 15.36,
        costPerConversion: 0,
        conversions: 1,
        campaignStartDate: '2024-12-25',
        campaignStatus: 'Eligible',
        clicks: 23,
        ctr: 7.04,
        weekNumber: '53 Semana',
        data: '28/12/2025',
        month: 'dezembro',
        campaignCategory: '',
        metaDaniel: ''
    },
    {
        day: '2025-12-28',
        account: 'Principal',
        campaign: 'Shopping_Dapa-Borico-Spray_MG',
        cost: 39.97,
        costPerConversion: 58.97,
        conversions: 0,
        campaignStartDate: '2024-12-09',
        campaignStatus: 'Eligible',
        clicks: 98,
        ctr: 1.29,
        weekNumber: '53 Semana',
        data: '28/12/2025',
        month: 'dezembro',
        campaignCategory: '',
        metaDaniel: ''
    },
    {
        day: '2025-12-28',
        account: 'Principal',
        campaign: 'Shopping_Dapa-Borico-Spray_Outras-Regiões',
        cost: 126.34,
        costPerConversion: 22.97,
        conversions: 5.5,
        campaignStartDate: '2025-12-09',
        campaignStatus: 'Eligible',
        clicks: 102,
        ctr: 1.29,
        weekNumber: '53 Semana',
        data: '28/12/2025',
        month: 'dezembro',
        campaignCategory: '',
        metaDaniel: ''
    },
];

// Função para agregar KPIs de Google Ads
export const getGoogleAdsKPIs = (data: GoogleAdsEntry[] = googleAdsData) => {
    const totalCost = data.reduce((sum, entry) => sum + entry.cost, 0);
    const totalConversions = data.reduce((sum, entry) => sum + entry.conversions, 0);
    const totalClicks = data.reduce((sum, entry) => sum + entry.clicks, 0);

    const avgCTR = data.length > 0 ? data.reduce((sum, entry) => sum + entry.ctr, 0) / data.length : 0;
    const costPerConversion = totalConversions > 0 ? totalCost / totalConversions : 0;

    // Campanhas por status
    const campaignsByStatus = data.reduce((acc, entry) => {
        const status = entry.campaignStatus || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return {
        spend: totalCost,
        spend_formatted: `R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        conversions: totalConversions,
        clicks: totalClicks,
        ctr: avgCTR,
        ctr_formatted: `${avgCTR.toFixed(2)}%`,
        costPerConversion: costPerConversion,
        cpc: totalClicks > 0 ? totalCost / totalClicks : 0,
        campaignsByStatus
    };
};

// Função para agrupar por campanha
export const getGoogleAdsByCampaign = (data: GoogleAdsEntry[] = googleAdsData) => {
    const campaigns = data.reduce((acc, entry) => {
        if (!acc[entry.campaign]) {
            acc[entry.campaign] = {
                campaign: entry.campaign,
                totalCost: 0,
                totalConversions: 0,
                totalClicks: 0,
                status: entry.campaignStatus,
                entries: 0
            };
        }
        acc[entry.campaign].totalCost += entry.cost;
        acc[entry.campaign].totalConversions += entry.conversions;
        acc[entry.campaign].totalClicks += entry.clicks;
        acc[entry.campaign].entries++;
        return acc;
    }, {} as Record<string, any>);

    return Object.values(campaigns).sort((a: any, b: any) => b.totalCost - a.totalCost);
};
