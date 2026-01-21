import { google } from 'googleapis';
import path from 'path';

// ==========================================
// SPREADSHEET CONFIGURATION
// ==========================================

// Current/Live Spreadsheet (2026+)
const SPREADSHEET_ID = '198auS_FJrjvfvGMuTxWFFwgL8NHLiq3dMFsWSyBpBpA';

// Historical Spreadsheet (2024-01 to 2025-12)
const HISTORICAL_SPREADSHEET_ID = '1nZaUBP-7DhI1iXhAnDOJsQs8aJlkb9x_BGGfRfIinK8';

// Sheet names/GIDs
export const SHEETS = {
    BD_GADS: 'BD GAds',
    BD_GA4: 'BD GA4',
    GA4_SESSOES: 'GA4 sessões',
    BD_TV: 'bd tv',
    VENDA_DIARIA: 'Venda Diaria',
    META_2026: 'Meta 2026',
    BD_MAG: 'BD Mag',
} as const;

// Initialize the Google Sheets client
const getAuthClient = async () => {
    // Priority 1: Check for Environment Variable (Vercel/Production)
    if (process.env.GOOGLE_CREDENTIALS) {
        try {
            const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

            // Use GoogleAuth with credentials object directly
            const auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: credentials.client_email,
                    private_key: credentials.private_key,
                },
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
            });

            return auth.getClient();
        } catch (error) {
            console.error('Error parsing GOOGLE_CREDENTIALS env var:', error);
            throw new Error('Failed to parse GOOGLE_CREDENTIALS environment variable');
        }
    }

    // Priority 2: Check for local file (Development)
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

// Import cache functions
import { getCachedSheetData, setCachedSheetData } from '@/lib/cache';

// Generic function to fetch data from a specific spreadsheet (with caching)
export const getSheetData = async (sheetName: string, range?: string, spreadsheetId: string = SPREADSHEET_ID): Promise<any[][]> => {
    // Generate cache key based on sheet and spreadsheet
    const cacheKey = `${sheetName}_${spreadsheetId.slice(-8)}`;

    // Check cache first (only for full sheet fetches without range)
    if (!range) {
        const cached = await getCachedSheetData(cacheKey);
        if (cached) {
            console.log(`[Sheets] Cache HIT: ${sheetName}`);
            return cached;
        }
    }

    console.log(`[Sheets] Fetching: ${sheetName} from ${spreadsheetId.slice(-8)}...`);

    try {
        const sheets = await getSheetsClient();
        const fullRange = range ? `${sheetName}!${range}` : sheetName;

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: fullRange,
        });

        const data = response.data.values || [];

        // Cache the result (only for full sheet fetches)
        if (!range && data.length > 0) {
            await setCachedSheetData(cacheKey, data);
            console.log(`[Sheets] Cached: ${sheetName} (${data.length} rows)`);
        }

        return data;
    } catch (error) {
        console.error(`[Sheets] Error fetching ${sheetName}:`, error);
        if (error instanceof Error) {
            console.error('Error Message:', error.message);
        }
        throw error;
    }
};

// Fetch data from both current and historical spreadsheets and merge (with parallel fetching)
export const getSheetDataWithHistory = async (sheetName: string, range?: string): Promise<any[][]> => {
    console.log(`[Sheets] Fetching with history: ${sheetName}`);

    try {
        // Parallel fetch from both spreadsheets for better performance
        const [currentData, historicalData] = await Promise.all([
            getSheetData(sheetName, range, SPREADSHEET_ID),
            getSheetData(sheetName, range, HISTORICAL_SPREADSHEET_ID).catch(err => {
                console.warn(`[Sheets] Historical data not available for ${sheetName}`);
                return [] as any[][];
            })
        ]);

        if (historicalData.length === 0) {
            console.log(`[Sheets] Using current data only for ${sheetName}`);
            return currentData;
        }

        // Merge data
        // For BD GAds and BD GA4, headers are in row 1 (index 1), data starts at row 2
        // For BD Mag and others, headers are in row 0 (index 0), data starts at row 1
        const isGAdsOrGA4 = sheetName === SHEETS.BD_GADS || sheetName === SHEETS.BD_GA4;
        const dataStartIndex = isGAdsOrGA4 ? 2 : 1;

        // Get headers from current data
        const headers = currentData.slice(0, dataStartIndex);

        // Get data rows from both sources
        const historicalRows = historicalData.slice(dataStartIndex);
        const currentRows = currentData.slice(dataStartIndex);

        // Combine: headers + historical + current
        const merged = [...headers, ...historicalRows, ...currentRows];
        console.log(`[Sheets] Merged ${sheetName}: ${historicalRows.length} historical + ${currentRows.length} current = ${merged.length - dataStartIndex} total rows`);

        return merged;

    } catch (error) {
        console.error(`[Sheets] Error fetching merged data for ${sheetName}:`, error);
        throw error;
    }
};

// Fetch Google Ads data (including historical)
export const fetchGoogleAdsData = async () => {
    const data = await getSheetDataWithHistory(SHEETS.BD_GADS);

    if (data.length < 3) return [];

    // Headers are in row 2 (index 1)
    const headers = data[1];
    const rows = data.slice(2);

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
            impressions: (() => {
                const c = parseInt(obj['Clicks'] || '0');
                const ctr = parseFloat(obj['CTR']?.replace('%', '')?.replace(',', '.') || '0');
                return ctr > 0 ? Math.round(c / (ctr / 100)) : 0;
            })(),
            weekNumber: obj['Nº da Semana'] || '',
            data: obj['Data'] || '',
            month: obj['Mês'] || '',
            campaignCategory: obj['Campanha'] || '',
            metaDaniel: obj['Meta Daniel'] || '',
        };
    });
};

// Fetch GA4 data (including historical)
export const fetchGA4Data = async () => {
    const data = await getSheetDataWithHistory(SHEETS.BD_GA4);

    if (data.length < 3) return [];

    // Headers are in row 2 (index 1)
    const headers = data[1];
    const rows = data.slice(2);

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
// Fetch GA4 Sessions data (from GA4 sessões tab)
export const fetchGA4SessionsData = async () => {
    // Header starts on line 2 (index 1) according to user
    const data = await getSheetData(SHEETS.GA4_SESSOES);

    if (data.length < 2) return [];

    const headers = data[1];
    const rows = data.slice(2);

    return rows.map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || '';
        });
        return {
            date: obj['Date'] || '',
            sessions: parseInt(obj['Sessions'] || '0'),
            sourceMedium: obj['Session source / medium'] || '',
            campaign: obj['Session campaign'] || '',
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

// Helper to parse date
const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    // Try YYYY-MM-DD
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return new Date(dateStr);
    // Try DD/MM/YYYY
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        const [d, m, y] = dateStr.split('/');
        return new Date(Number(y), Number(m) - 1, Number(d));
    }
    // Try parsing as is
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
};

// Aggregate Google Ads KPIs
export const aggregateGoogleAdsKPIs = async (startDate?: Date, endDate?: Date) => {
    let data = await fetchGoogleAdsData();

    if (startDate && endDate) {
        data = data.filter(entry => {
            const entryDate = parseDate(entry.day || entry.data || entry.campaignStartDate);
            if (!entryDate) return true; // Keep if no date (safe?) or false? false is safer.
            return entryDate >= startDate && entryDate <= endDate;
        });
    }

    const totalCost = data.reduce((sum, entry) => sum + (entry.cost || 0), 0);
    const totalConversions = data.reduce((sum, entry) => sum + (entry.conversions || 0), 0);
    const totalClicks = data.reduce((sum, entry) => sum + (entry.clicks || 0), 0);
    const totalImpressions = data.reduce((sum, entry) => sum + (entry.impressions || 0), 0);

    // Weighted CTR (Total Clicks / Total Impressions) is more accurate than avg of CTRs
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    const costPerConversion = totalConversions > 0 ? totalCost / totalConversions : 0;
    const avgCPM = totalImpressions > 0 ? (totalCost / totalImpressions) * 1000 : 0;

    // Daily Cost Aggregation
    const dailyCostMap: { [key: string]: number } = {};
    data.forEach(entry => {
        const date = parseDate(entry.day || entry.data || entry.campaignStartDate);
        if (date) {
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
            dailyCostMap[dateStr] = (dailyCostMap[dateStr] || 0) + (entry.cost || 0);
        }
    });
    const dailyData = Object.entries(dailyCostMap)
        .map(([date, cost]) => ({ date, cost }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // ==========================================
    // SEGMENTAÇÃO: Leads vs Ecommerce
    // ==========================================
    // Campanhas de Leads: contém "Lead" no nome da campanha
    // Campanhas Ecommerce: NÃO contém "Lead" E NÃO contém "Visita"
    const isLeadsCampaign = (campaign: string) => {
        const lowerCampaign = campaign?.toLowerCase() || '';
        return lowerCampaign.includes('lead');
    };

    const isVisitaCampaign = (campaign: string) => {
        const lowerCampaign = campaign?.toLowerCase() || '';
        return lowerCampaign.includes('visita');
    };

    const leadsData = data.filter(entry => isLeadsCampaign(entry.campaign));
    // Ecommerce excludes Leads AND Visita
    const ecommerceData = data.filter(entry => !isLeadsCampaign(entry.campaign) && !isVisitaCampaign(entry.campaign));

    const leadsSpend = leadsData.reduce((sum, entry) => sum + (entry.cost || 0), 0);
    const ecommerceSpend = ecommerceData.reduce((sum, entry) => sum + (entry.cost || 0), 0);
    const leadsConversions = leadsData.reduce((sum, entry) => sum + (entry.conversions || 0), 0);
    const ecommerceConversions = ecommerceData.reduce((sum, entry) => sum + (entry.conversions || 0), 0);
    const leadsClicks = leadsData.reduce((sum, entry) => sum + (entry.clicks || 0), 0);
    const ecommerceClicks = ecommerceData.reduce((sum, entry) => sum + (entry.clicks || 0), 0);

    // Metas definidas pelo usuário
    const LEADS_META = 28000;
    const ECOMMERCE_META = 66000;

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
                clicks: 0,
                impressions: 0,
                tipo: classifyCampaign(campaign)
            };
        }
        campaignMap[campaign].spend += entry.cost || 0;
        campaignMap[campaign].conversions += entry.conversions || 0;
        campaignMap[campaign].clicks += entry.clicks || 0;
        campaignMap[campaign].impressions += entry.impressions || 0;
    });

    const byCampaign = Object.values(campaignMap)
        .map(c => ({
            ...c,
            ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
            cpm: c.impressions > 0 ? (c.spend / c.impressions) * 1000 : 0,
            cpc: c.clicks > 0 ? c.spend / c.clicks : 0,
            cpa: c.conversions > 0 ? c.spend / c.conversions : 0,
        }))
        .sort((a, b) => b.spend - a.spend);

    return {
        spend: totalCost,
        spend_formatted: `R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        conversions: totalConversions,
        clicks: totalClicks,
        impressions: totalImpressions,
        ctr: avgCTR,
        ctr_formatted: `${avgCTR.toFixed(2)}%`,
        cpm: avgCPM,
        cpm_formatted: `R$ ${avgCPM.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        costPerConversion,
        cpc: totalClicks > 0 ? totalCost / totalClicks : 0,
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
    };
};

// Aggregate GA4 KPIs
export const aggregateGA4KPIs = async (startDate?: Date, endDate?: Date) => {
    const [transactionData, sessionData] = await Promise.all([
        fetchGA4Data(),
        fetchGA4SessionsData()
    ]);

    let filteredTransactions = transactionData;
    let filteredSessions = sessionData;

    if (startDate && endDate) {
        filteredTransactions = transactionData.filter(entry => {
            const entryDate = parseDate(entry.transactionDate || entry.data);
            if (!entryDate) return true;
            return entryDate >= startDate && entryDate <= endDate;
        });

        filteredSessions = sessionData.filter(entry => {
            const entryDate = parseDate(entry.date);
            if (!entryDate) return true;
            return entryDate >= startDate && entryDate <= endDate;
        });
    }

    const totalRevenue = filteredTransactions.reduce((sum, entry) => sum + (entry.purchaseRevenue || 0), 0);
    const totalTransactions = filteredTransactions.length;
    const ticketMedio = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const totalSessions = filteredSessions.reduce((sum, entry) => sum + (entry.sessions || 0), 0);

    // Group by channel (Transactions)
    const googleCPC = filteredTransactions.filter(e => e.eventSourceMedium?.includes('google') && e.eventSourceMedium?.includes('cpc'))
        .reduce((sum, e) => sum + (e.purchaseRevenue || 0), 0);
    const blueCPC = filteredTransactions.filter(e => e.eventSourceMedium?.includes('blue'))
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

    return {
        totalRevenue,
        totalRevenue_formatted: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        totalTransactions,
        totalSessions,
        dailyTrend,
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

// Fetch Magento (BD Mag) data - E-commerce CRM data (including historical)
export const fetchMagData = async () => {
    const data = await getSheetDataWithHistory(SHEETS.BD_MAG);

    if (data.length < 2) return [];

    // BD Mag has headers in row 1 (index 0)
    const headers = data[0];
    const rows = data.slice(1);

    return rows.map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || '';
        });

        // Parse numeric values
        // Parse numeric values 
        const parseNumber = (val: string) => {
            if (!val) return 0;
            let clean = val.toString().replace(/[^\d.,-]/g, '');

            // If it has a comma, assume BR format (1.234,56)
            if (clean.includes(',')) {
                clean = clean.replace(/\./g, '').replace(',', '.');
            } else {
                // No comma. Check if dot is a thousands separator or decimal
                // Heuristic: if there's more than one dot, or exactly one dot followed by 3 digits, 
                // it's likely a thousands separator (e.g., 1.234 or 1.234.567)
                // BUT if it's like 12.34 it's likely a decimal.
                const dotParts = clean.split('.');
                if (dotParts.length > 2) {
                    // Multiple dots: 1.234.567 -> 1234567
                    clean = clean.replace(/\./g, '');
                } else if (dotParts.length === 2) {
                    // One dot. If 3 digits after dot, it's ambiguous. 
                    // However, in Magento/Sheets, usually if no comma is present, dot is decimal or value < 1000.
                    // For the sake of safety, let's assume one dot with 2 digits is decimal.
                    if (dotParts[1].length === 2) {
                        // Keep the dot as decimal
                    } else if (dotParts[1].length === 3) {
                        // Likely thousands: 1.234 -> 1234
                        clean = clean.replace(/\./g, '');
                    }
                    // If 1 digit, likely decimal: 1.5
                }
            }

            return parseFloat(clean) || 0;
        };

        return {
            mpn: obj['Mpn'] || '',
            pedido: obj['Pedido'] || '',
            dataTransacao: obj['Data Transação'] || '',
            status: obj['Status'] || '',
            nomeProduto: obj['Nome do Produto'] || obj['Nome do produto2'] || '',
            receitaProduto: parseNumber(obj['Receita do Produto']),
            cidade: obj['Cidade'] || '',
            estado: obj['Estado'] || '',
            valorTotalSemFrete: parseNumber(obj['Valor total sem frete']),
            valorTotalComFrete: parseNumber(obj['Valor total com frete']),
            emailCliente: obj['E-mail cliente'] || '',
            cpfCliente: obj['CPF Cliente'] || '',
            categoria: obj['Categoria'] || '',
            vendedor: obj['Vendedor'] || '',
            data: obj['Data'] || '',
            hora: obj['Hora: Min: Seg'] || '',
            horaSimples: obj['Hora'] || '',
            origem: obj['Origem'] || '',
            midia: obj['Mídia'] || '',
            campanha: obj['Camp'] || obj['Camp2'] || '',
            cupom: obj['Cupom'] || '',
            atribuicao: obj['Atribuição'] || '',
            qtdTotalPedidos: parseInt(obj['Qde Total Pedidos'] || '1'),
            pertenceA: obj['Pertence a'] || '',
            diaSemana: obj['Dia da Semana'] || '',
            mes: obj['Mês'] || '',
            semana: obj['semana'] || '',
        };
    });
};

// Aggregate Catalogo/Magento KPIs
export const aggregateCatalogoKPIs = async (startDate?: Date, endDate?: Date) => {
    let data = await fetchMagData();

    // Filter by Date Range if provided
    if (startDate && endDate) {
        // Adjust bounds to cover full days
        const start = new Date(startDate); start.setHours(0, 0, 0, 0);
        const end = new Date(endDate); end.setHours(23, 59, 59, 999);

        data = data.filter(order => {
            const dateStr = order.data; // Prioritize 'Data' column as requested
            if (!dateStr) return false;

            try {
                let orderDate: Date | null = null;
                const datePart = dateStr.includes(' ') ? dateStr.split(' ')[0] : dateStr;

                // BD Mag format: DD/MM/YYYY
                if (datePart.includes('/')) {
                    const parts = datePart.split('/');
                    if (parts.length === 3) {
                        orderDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                    }
                } else if (datePart.includes('-')) {
                    // Fallback for YYYY-MM-DD
                    orderDate = new Date(datePart);
                    if (orderDate) orderDate.setHours(12, 0, 0, 0);
                }

                if (orderDate && !isNaN(orderDate.getTime())) {
                    return orderDate >= start && orderDate <= end;
                }
                return false;
            } catch (e) {
                return false;
            }
        });
    }

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
    const receitaGoogleAds = completedOrders
        .filter(d => d.atribuicao?.toLowerCase().includes('google_ads'))
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
        const dateRaw = order.data || order.dataTransacao;
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

    return {
        totalReceita,
        totalReceita_formatted: `R$ ${totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        receitaGoogleAds,
        receitaGoogleAds_formatted: `R$ ${receitaGoogleAds.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
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
    const data = await fetchMagData();

    // Filter only completed orders
    let completedOrders = data.filter(d =>
        d.status?.toLowerCase().includes('complete') ||
        d.status?.toLowerCase().includes('completo') ||
        d.status?.toLowerCase().includes('pago') ||
        d.status?.toLowerCase().includes('enviado') ||
        !d.status
    );

    // Filter by Date Range if provided
    if (startDate && endDate) {
        completedOrders = completedOrders.filter(order => {
            const dateStr = order.data || order.dataTransacao;
            if (!dateStr) return false;

            try {
                // Normaliza a data para objeto Date
                let orderDate: Date | null = null;
                const datePart = dateStr.includes(' ') ? dateStr.split(' ')[0] : dateStr;

                if (datePart.includes('/')) {
                    // Formato DD/MM/YYYY
                    const parts = datePart.split('/');
                    if (parts.length === 3) {
                        orderDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                    }
                } else if (datePart.includes('-')) {
                    // Formato YYYY-MM-DD
                    orderDate = new Date(datePart);
                    if (orderDate) orderDate.setHours(12, 0, 0, 0);
                }

                if (orderDate && !isNaN(orderDate.getTime())) {
                    // Reset hours for comparison
                    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
                    const end = new Date(endDate); end.setHours(23, 59, 59, 999);
                    return orderDate >= start && orderDate <= end;
                }

                return true;
            } catch (e) {
                return true;
            }
        });
    }


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
        let orderDate: Date;
        try {
            if (order.data?.includes('/')) {
                orderDate = new Date(order.data.split('/').reverse().join('-'));
            } else if (order.data) {
                orderDate = new Date(order.data.split(' ')[0]);
            } else {
                return;
            }
        } catch (e) { return; }

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
        topCustomers,
        bySeller,
        byState,
        byCity,
        segments, // New RFM segments with full data
        seasonality, // New seasonality data
        // Include raw data for flexible client-side processing if needed
        rawData: data
    };
};
