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
        if (error instanceof Error) {
            console.error('Error Stack:', error.stack);
            console.error('Error Message:', error.message);
        }
        // If it's a file issue (missing credentials), log it clearly
        // Don't swallow the error, let it bubble up to the route handler which returns 500
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
export const aggregateGA4KPIs = async (startDate?: Date, endDate?: Date) => {
    let data = await fetchGA4Data();

    if (startDate && endDate) {
        data = data.filter(entry => {
            const entryDate = parseDate(entry.transactionDate || entry.data);
            if (!entryDate) return true;
            return entryDate >= startDate && entryDate <= endDate;
        });
    }

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

// Fetch Magento (BD Mag) data - E-commerce CRM data
export const fetchMagData = async () => {
    const data = await getSheetData(SHEETS.BD_MAG);

    if (data.length < 2) return [];

    const headers = data[0];
    const rows = data.slice(1);

    return rows.map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || '';
        });

        // Parse numeric values
        const parseNumber = (val: string) => {
            if (!val) return 0;
            return parseFloat(val.toString().replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
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
    const data = await fetchMagData();

    // Filter only completed orders (status validation)
    let completedOrders = data.filter(d =>
        d.status?.toLowerCase().includes('complete') ||
        d.status?.toLowerCase().includes('completo') ||
        d.status?.toLowerCase().includes('pago') ||
        d.status?.toLowerCase().includes('enviado') ||
        !d.status // Include if no status
    );

    // Filter by Date Range if provided
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
                    // Adjust for timezone if needed, usually new Date('YYYY-MM-DD') is UTC, 
                    // but simple comparison usually works if we reset hours.
                    // For safety, assume local time if it's simple date string
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

    // Total revenue
    const totalReceita = completedOrders.reduce((sum, entry) => sum + (entry.receitaProduto || 0), 0);
    const totalValorSemFrete = completedOrders.reduce((sum, entry) => sum + (entry.valorTotalSemFrete || 0), 0);
    const totalValorComFrete = completedOrders.reduce((sum, entry) => sum + (entry.valorTotalComFrete || 0), 0);

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

    return {
        totalClientes,
        topCustomers,
        bySeller,
        byState,
        byCity,
        segments, // New RFM segments with full data
        // Include raw data for flexible client-side processing if needed
        rawData: data
    };
};
