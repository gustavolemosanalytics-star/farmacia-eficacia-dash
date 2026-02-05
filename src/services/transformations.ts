
import { parse, format, getWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Helper to convert raw sheet rows (array of arrays) to array of objects
export function rowsToObjects(rows: any[][], headerRowIndex: number = 0): Record<string, any>[] {
    if (!rows || rows.length <= headerRowIndex) return [];

    const headers = rows[headerRowIndex].map((h: string) => h?.toString().trim());
    const data = rows.slice(headerRowIndex + 1);

    return data.map(row => {
        const obj: Record<string, any> = {};
        headers.forEach((header: string, index: number) => {
            if (header) {
                // Keep raw value
                let val = row[index];
                if (val === undefined) val = null;
                obj[header] = val;
            }
        });
        return obj;
    });
}

// Helper: Safe number parser
function parseNumber(val: any): number | null {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') return val;
    const str = val.toString().trim();
    // Handle Brazilian format (1.234,56) vs US (1,234.56)
    // Simple heuristic: if contains ',' assume BR decimal.
    let clean = str;
    if (str.includes(',')) {
        clean = str.replace(/\./g, '').replace(',', '.');
    }
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
}

// Logic for BD Mag
export function processBDMag(bdMagRaw: any[][], ga4Raw: any[][]): any[] {
    const magObjects = rowsToObjects(bdMagRaw, 0);

    // --- LOOKUP MAPS (Performance Optimization) ---
    // GA4 Map
    const ga4Map = new Map<string, { camp: string, origem: string, midia: string }>();
    if (ga4Raw && ga4Raw.length) {
        ga4Raw.forEach(row => {
            const key = row[0]?.toString().trim(); // Transaction
            if (key) {
                ga4Map.set(key, {
                    camp: row[3],   // Col 4 (Index 3)
                    origem: row[6], // Col 7 (Index 6)
                    midia: row[7]   // Col 8 (Index 7)
                });
            }
        });
    }

    // --- PRE-CALCULATION FOR "Qde Total Pedidos" (1/CONT.SES) ---
    const getDateKey = (row: any) => {
        const rawDate = row['Data Transação'] || '';
        return rawDate.toString().substring(0, 10).trim();
    };

    const countMap = new Map<string, number>();
    magObjects.forEach(row => {
        const pedido = row['Pedido'] || '';
        const dataKey = getDateKey(row);
        if (pedido) {
            const key = `${pedido}_${dataKey}`;
            countMap.set(key, (countMap.get(key) || 0) + 1);
        }
    });

    return magObjects.map(row => {
        // 1. DATA & HORA
        const rawTransacao = row['Data Transação']?.toString() || '';
        const dataStr = rawTransacao.substring(0, 10).trim(); // "DD/MM/YYYY"
        const horaMinSeg = rawTransacao.length >= 8 ? rawTransacao.slice(-8) : '';
        const hora = horaMinSeg.substring(0, 2);

        // Parse Date
        let dateObj: Date | null = null;
        if (dataStr.length === 10) {
            if (dataStr.includes('/')) {
                // DD/MM/YYYY
                dateObj = parse(dataStr, 'dd/MM/yyyy', new Date());
            } else if (dataStr.includes('-')) {
                // YYYY-MM-DD
                dateObj = parse(dataStr, 'yyyy-MM-dd', new Date());
            }
        }

        // 2. STATUS
        const rawStatus = row['Status'] || '';
        let status = 'Faturado';
        const cancelStatuses = [
            "Pagamento Cancelado - Por favor, refaça a compra",
            "Cancelado",
            "Pagamento Pendente",
            "Aguardando Confirmação de Pagamento",
            "Pedido Cancelado"
        ];
        if (rawStatus === "") status = "";
        else if (cancelStatuses.includes(rawStatus)) status = 'Cancelado';

        // 3. LOOKUPS
        const pedido = row['Pedido']?.toString().trim();
        const ga4Data = ga4Map.get(pedido);

        let origem = "Vendedor";
        if (pedido && ga4Data?.origem) origem = ga4Data.origem;
        if (!pedido) origem = "";

        let midia = "Vendedor";
        if (pedido && ga4Data?.midia) midia = ga4Data.midia;
        if (!pedido) midia = "";

        let camp = " ";
        if (pedido && ga4Data?.camp) camp = ga4Data.camp;

        const camp2 = camp ? camp.substring(0, 8) : "";

        // 4. ATRIBUIÇÃO
        const T2 = origem || '';
        const U2 = midia || '';

        let atribuicao = "Outros";
        if (!pedido) atribuicao = "";
        else {
            // Basic logic
            if (T2 === 'Google' && U2 === 'cpc') atribuicao = "Google_Ads";
            else if (T2 === 'Google' && U2 === 'organic') atribuicao = "Google_Organic";
            else if (T2 === 'Facebook') atribuicao = "Facebook Ads";
            else if (T2 === 'allinmail' && U2 === 'Email') atribuicao = "E-mail MKT";
            else if (T2 === 'Criteo') atribuicao = "Criteo";
            else if (T2 === '(direct)') atribuicao = "Url_Direta";
            else if (T2 === 'carrinho_abandonado' && U2 === 'email') atribuicao = "E-mail MKT";
            else if (T2 === 'yotpo' && U2 === 'general') atribuicao = "E-mail MKT";
            else if (T2 === 'linktr.ee' && U2 === 'referral') atribuicao = "Instagram";
            else if (T2 === 'igshopping' && U2 === 'social') atribuicao = "Instagram";
            else if (T2 === 'm.facebook.com' && U2 === 'REFERRAL') atribuicao = "Facebook";
            else if ((T2 === 'l.instagram.com' || T2.includes('instagram')) && U2 === 'referral') atribuicao = "Instagram";
            else if ((T2.includes('facebook')) && U2 === 'referral') atribuicao = "Facebook";
            else if (T2 === 'BTG360' && U2 === 'email') atribuicao = "E-mail MKT";
            else if (T2 === 'bing' && U2 === 'organic') atribuicao = "Bing_Organico";
            else if (T2.toLowerCase().includes('vendedor')) atribuicao = "Vendedor";
            else if (T2 === 'bLUE' && U2 === 'CPC') atribuicao = "Blue";
            else if (T2 === 'Blog' && U2 === 'Texto') atribuicao = "Blog";
            else if (T2 === 'facebook' && U2 === 'cpc') atribuicao = "Facebook Ads";
            else if (T2 === 'ActiveCampaign' && U2 === 'email') atribuicao = "E-mail MKT";
        }

        // Nome do Produto 2
        const e2 = row['Nome do Produto'] || '';
        let nomeProduto2 = e2;
        if (e2 && typeof e2 === 'string' && e2.includes('-')) {
            nomeProduto2 = e2.split('-')[0];
        }

        // Qde Total Pedidos
        const countKey = `${pedido}_${dataStr}`;
        const totalCount = countMap.get(countKey) || 1;
        const qdeTotalPedidos = pedido ? (1 / totalCount) : 0;

        // Date helpers
        let diaSemana = "";
        let mes = "";
        let semana = "";

        if (pedido && dateObj && !isNaN(dateObj.getTime())) {
            diaSemana = format(dateObj, 'eee', { locale: ptBR });
            mes = format(dateObj, 'MMMM', { locale: ptBR });
            semana = `${getWeek(dateObj)} Semana`;
        }

        return {
            ...row,
            'Nome do produto2': nomeProduto2,
            'Status': status,
            'Data': dataStr,
            'Hora: Min: Seg': horaMinSeg,
            'Hora': hora,
            'Origem': origem,
            'Mídia': midia,
            'Camp': camp,
            'Camp2': camp2,
            'Cupom': row['Cupom'],
            'Atribuição': atribuicao,
            'Qde Total Pedidos': qdeTotalPedidos,
            'Dia da Semana': diaSemana,
            'Mês': mes,
            'semana': semana,
        };
    });
}

// Logic for GA4
export function processGA4(ga4Raw: any[][], bdMagRaw: any[][], attributionRaw: any[] = [], googleAdsRaw: any[][] = []): any[] {
    const ga4Objects = rowsToObjects(ga4Raw, 1); // Header index 1
    const magObjects = rowsToObjects(bdMagRaw, 0); // Header index 0
    const googleAdsObjects = rowsToObjects(googleAdsRaw, 0); // Assuming header 0

    // --- LOOKUP MAPS ---

    // BD Mag Map: Key = Pedido (Col B / Col 1). 
    const magMap = new Map<string, any>();
    magObjects.forEach(row => {
        const pedido = row['Pedido']?.toString().trim();
        if (pedido) magMap.set(pedido, row);
    });

    // Attribution Map: Key = Origem. Value = Canal.
    const attributionMap = new Map<string, string>();
    attributionRaw.forEach(row => {
        const key = row['Origem']?.toString().trim();
        if (key) attributionMap.set(key, row['Canal']);
    });

    // Google Ads Map: Key = Campaign. Value = data row.
    const gAdsMap = new Map<string, any>();
    googleAdsObjects.forEach(row => {
        const camp = row['Campaign']?.toString().trim();
        if (camp) gAdsMap.set(camp, row);
    });

    // Pre-calc Counts for "Qde Pedidos" = 1 / CountIfs(Transaction, Transaction, Data, Data)
    const ga4CountMap = new Map<string, number>();
    ga4Objects.forEach(row => {
        const trans = row['Transaction']?.toString().trim() || row['Pedido']?.toString().trim() || '(not set)';
        const date = row['Date'] || '';
        const key = `${trans}_${date}`;
        ga4CountMap.set(key, (ga4CountMap.get(key) || 0) + 1);
    });

    return ga4Objects.map(row => {
        let rawTransId = row['Transaction']?.toString().trim() || row['Pedido']?.toString().trim() || '';

        let transactionId = rawTransId;
        const campaignName = row['Event campaign'] || row['Campaign'] || '';

        // LOGIC: Transaction ID Handling
        if (!transactionId || transactionId === '(not set)' || transactionId === '') {
            // "Look at campaign_name of ga4 to cross with campaign of google_ads"
            // If match found, we could potentially lookup something, but user didn't specify.
            // We just ensure we TRIED to look it up.
            if (campaignName && gAdsMap.has(campaignName)) {
                // Match found. Logic placeholder.
            }
        } else {
            // "When transactionid has 000007011, remove leading zeros"
            transactionId = transactionId.replace(/^0+/, '');
        }

        // Now lookup in BD Mag
        const magEntry = magMap.get(transactionId);

        // 1. ORIGEM & MIDIA
        const sourceMedium = row['Event source / medium'] || '';
        let origem = " ";
        let midia = " ";
        if (sourceMedium && sourceMedium.includes(' / ')) {
            const parts = sourceMedium.split(' / ');
            origem = parts[0];
            midia = parts.slice(1).join(' / ');
        } else if (sourceMedium) origem = sourceMedium;

        // 2. STATUS
        let status = "";
        if (magEntry) status = magEntry['Status'] || "";

        // 3. DATA
        let data = "";
        if (magEntry) data = magEntry['Data'] || magEntry['Data Transação'] || "";

        // 4. CAMP2 & CAMP3
        let camp2 = "";
        let camp3 = "";
        if (status) { // Only if Status exists? User formula logic: =SE(F3="",""...) (F3 is Status)
            const c = campaignName;
            camp2 = c.substring(0, 8);
            camp3 = c.substring(0, 6);
        }

        // 5. PRODUTO & PROD2
        let produto = "";
        let prod2 = "";
        if (magEntry && status) {
            produto = magEntry['Nome do Produto'] || "";
            prod2 = produto.substring(0, 7);
        }

        // 6. VENDA OU SITE?
        let vendaOuSite = "";
        if (magEntry) {
            vendaOuSite = magEntry['Pertence a'] || magEntry['Canal'] || "";
        }

        // 7. ATRIBUIÇÃO 1
        const atrib1 = attributionMap.get(sourceMedium) || attributionMap.get(origem) || "";

        // 8. ATRIBUIÇÃO 2
        let atrib2 = " ";
        if (magEntry) atrib2 = vendaOuSite || " ";

        // 9. UF & CIDADE
        let uf = "";
        let cidade = "";
        if (status && magEntry) {
            uf = magEntry['UF'] || "";
            cidade = magEntry['CIDADE'] || "";
        }

        // 10. CÓDIGO
        let codigo = "";
        if (status) {
            codigo = transactionId.substring(0, 4);
        }

        // 11. CÓDIGO X 1
        let codigoX1: number | string = "0";
        if (status && codigo) {
            const parsed = parseInt(codigo);
            if (!isNaN(parsed)) codigoX1 = parsed;
        }

        // 12. QDE PEDIDOS
        // Key: Raw Transaction + Raw Date
        const rowDate = row['Date'] || magEntry?.['Data'] || '';
        let qdePedidos = 0;
        if (status) {
            const key = `${rawTransId}_${rowDate}`;
            const count = ga4CountMap.get(key) || 1;
            qdePedidos = 1 / count;
        }

        // 13. SEMANA & MÊS
        let semana = "";
        let mes = "";
        if (status && rowDate) {
            let dateObj: Date | null = null;
            if (rowDate.match(/^\d{8}$/)) dateObj = parse(rowDate, 'yyyyMMdd', new Date());
            else if (rowDate.includes('/')) dateObj = parse(rowDate, 'dd/MM/yyyy', new Date());
            else if (rowDate.includes('-')) dateObj = parse(rowDate, 'yyyy-MM-dd', new Date());

            if (dateObj && !isNaN(dateObj.getTime())) {
                semana = `${getWeek(dateObj)} Semana`;
                mes = format(dateObj, 'MMMM', { locale: ptBR });
            }
        }

        return {
            ...row,
            'Transaction': transactionId, // Override with stripped value (no leading zeros)
            'Origem': origem,
            'Mídia': midia,
            'Status': status,
            'Data': data,
            'Camp2': camp2,
            'Produto': produto,
            'Prod2': prod2,
            'Venda ou Site?': vendaOuSite,
            'Atribuição 1': atrib1,
            'Atribuição 2': atrib2,
            'Semana Calendário': semana,
            'Mês': mes,
            'UF': uf,
            'CIDADE': cidade,
            'Código': codigo,
            'Código x 1': codigoX1,
            'Qde Pedidos': qdePedidos,
            'Camp3': camp3
        };
    });
}
