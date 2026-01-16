import { google } from 'googleapis';
import path from 'path';

// Spreadsheet ID extracted from the URL
const SPREADSHEET_ID = '198auS_FJrjvfvGMuTxWFFwgL8NHLiq3dMFsWSyBpBpA';

// Sheet names/GIDs
export const SHEETS = {
    BD_GADS: 'BD GAds',
    BD_GA4: 'BD GA4',
    BD_TV: 'bd tv',
    VENDA_DIARIA: 'Venda Diaria',
    META_2026: 'Meta 2026',
} as const;

// Initialize the Google Sheets client
const getAuthClient = async () => {
    const credentialsPath = path.join(process.cwd(), 'credentials.json');

    const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    return auth.getClient();
};

// Create Sheets API instance
const getSheetsClient = async () => {
    const authClient = await getAuthClient();
    return google.sheets({ version: 'v4', auth: authClient as any });
};

// Generic function to fetch data from a sheet
export const getSheetData = async (sheetName: string, range?: string): Promise<any[][]> => {
    try {
        const sheets = await getSheetsClient();
        const fullRange = range ? `${sheetName}!${range}` : sheetName;

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: fullRange,
        });

        return response.data.values || [];
    } catch (error) {
        console.error(`Error fetching sheet ${sheetName}:`, error);
        throw error;
    }
};

// Fetch Google Ads data
export const fetchGoogleAdsData = async () => {
    const data = await getSheetData(SHEETS.BD_GADS);

    if (data.length < 2) return [];

    const headers = data[0];
    const rows = data.slice(1);

    return rows.map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || '';
        });
        return {
            day: obj['Day'] || '',
            account: obj['Account (Cust...)'] || obj['Account'] || '',
            campaign: obj['Campaign'] || '',
            cost: parseFloat(obj['Cost']?.replace(',', '.') || '0'),
            costPerConversion: parseFloat(obj['Cost / conv.']?.replace(',', '.') || '0'),
            conversions: parseFloat(obj['Conversions']?.replace(',', '.') || '0'),
            campaignStartDate: obj['Campaign start date'] || '',
            campaignStatus: obj['Campaign status'] || '',
            clicks: parseInt(obj['Clicks'] || '0'),
            ctr: parseFloat(obj['CTR']?.replace('%', '')?.replace(',', '.') || '0'),
            weekNumber: obj['Nº da Semana'] || '',
            data: obj['Data'] || '',
            month: obj['Mês'] || '',
            campaignCategory: obj['Campanha'] || '',
            metaDaniel: obj['Meta Daniel'] || '',
        };
    });
};

// Fetch GA4 data
export const fetchGA4Data = async () => {
    const data = await getSheetData(SHEETS.BD_GA4);

    if (data.length < 2) return [];

    const headers = data[0];
    const rows = data.slice(1);

    return rows.map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || '';
        });
        return {
            transactionId: obj['Transaction'] || '',
            transactionDate: obj['Date'] || '',
            eventSourceMedium: obj['Event source / medium'] || '',
            eventCampaign: obj['Event campaign'] || '',
            purchaseRevenue: parseFloat(obj['Purchase revenue']?.replace(',', '.') || '0'),
            googleAdsAccount: obj['Event Google Ads acco...'] || obj['Google Ads Account'] || '',
            midia: obj['Mídia'] || '',
            status: obj['Status'] || '',
            data: obj['Data'] || '',
        };
    });
};

// Fetch TV Sales data
export const fetchTVSalesData = async () => {
    const data = await getSheetData(SHEETS.BD_TV);

    if (data.length < 2) return [];

    const headers = data[0];
    const rows = data.slice(1);

    return rows.map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || '';
        });
        return {
            orderNumber: obj['N_Pedido'] || obj['N Pedido'] || '',
            orderDate: obj['Data'] || '',
            televendas: obj['Televendas'] || '',
            month: obj['Mês'] || obj['Mes'] || '',
        };
    });
};

// Aggregate Google Ads KPIs
export const aggregateGoogleAdsKPIs = async () => {
    const data = await fetchGoogleAdsData();

    const totalCost = data.reduce((sum, entry) => sum + (entry.cost || 0), 0);
    const totalConversions = data.reduce((sum, entry) => sum + (entry.conversions || 0), 0);
    const totalClicks = data.reduce((sum, entry) => sum + (entry.clicks || 0), 0);
    const avgCTR = data.length > 0 ? data.reduce((sum, entry) => sum + (entry.ctr || 0), 0) / data.length : 0;
    const costPerConversion = totalConversions > 0 ? totalCost / totalConversions : 0;

    return {
        spend: totalCost,
        spend_formatted: `R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        conversions: totalConversions,
        clicks: totalClicks,
        ctr: avgCTR,
        ctr_formatted: `${avgCTR.toFixed(2)}%`,
        costPerConversion,
        cpc: totalClicks > 0 ? totalCost / totalClicks : 0,
    };
};

// Aggregate GA4 KPIs
export const aggregateGA4KPIs = async () => {
    const data = await fetchGA4Data();

    const totalRevenue = data.reduce((sum, entry) => sum + (entry.purchaseRevenue || 0), 0);
    const totalTransactions = data.length;
    const ticketMedio = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Group by channel
    const googleCPC = data.filter(e => e.eventSourceMedium?.includes('google') && e.eventSourceMedium?.includes('cpc'))
        .reduce((sum, e) => sum + (e.purchaseRevenue || 0), 0);
    const blueCPC = data.filter(e => e.eventSourceMedium?.includes('blue'))
        .reduce((sum, e) => sum + (e.purchaseRevenue || 0), 0);
    const organic = data.filter(e => e.eventSourceMedium?.includes('organic'))
        .reduce((sum, e) => sum + (e.purchaseRevenue || 0), 0);
    const direct = data.filter(e => e.eventSourceMedium?.includes('direct'))
        .reduce((sum, e) => sum + (e.purchaseRevenue || 0), 0);
    const email = data.filter(e => e.eventSourceMedium?.toLowerCase().includes('email') || e.eventSourceMedium?.toLowerCase().includes('activecampaign'))
        .reduce((sum, e) => sum + (e.purchaseRevenue || 0), 0);
    const social = data.filter(e => e.eventSourceMedium?.includes('social') || e.eventSourceMedium?.includes('ig'))
        .reduce((sum, e) => sum + (e.purchaseRevenue || 0), 0);

    return {
        totalRevenue,
        totalRevenue_formatted: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        totalTransactions,
        ticketMedio,
        ticketMedio_formatted: `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
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
