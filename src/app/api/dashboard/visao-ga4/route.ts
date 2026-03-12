import { NextResponse } from 'next/server';
import { getVendaPorCanalData } from '@/lib/data/sheets-store';

export const dynamic = 'force-dynamic';

// Column names after sanitization by sheets-store:
// Header: "SUM de Purchase revenue Mês" → "sum_de_purchase_revenue_mes" (but csv-parse uses "Atribuição 1 Blue" etc as subsequent cols)
// Actually csv-parse maps: col0 = "sum_de_purchase_revenue_mes", col1 = "atribuicao_1_blue", col2 = "direto", etc.
// But looking at the CSV, the header is: "SUM de Purchase revenue Mês","Atribuição 1 Blue","Direto",...
// After sanitization: sum_de_purchase_revenue_mes, atribuicao_1_blue, direto, e_mail_mkt, google_ads, google_organic, meta_ads, outros, vendedor, whatsapp, _n_a, total_geral

const FIRST_COL = 'sum_de_purchase_revenue_mes';
const CANAIS = ['atribuicao_1_blue', 'direto', 'e_mail_mkt', 'google_ads', 'google_organic', 'meta_ads', 'outros', 'vendedor', 'whatsapp', '_n_a'];
const CANAIS_LABELS: Record<string, string> = {
    atribuicao_1_blue: 'Blue',
    direto: 'Direto',
    e_mail_mkt: 'E-mail MKT',
    google_ads: 'Google Ads',
    google_organic: 'Google Organic',
    meta_ads: 'Meta Ads',
    outros: 'Outros',
    vendedor: 'Vendedor',
    whatsapp: 'Whatsapp',
    _n_a: 'N/A',
};

function parseNumber(val: any): number {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    let str = val.toString().trim().replace(/[R$]/g, '').replace(/\s/g, '');
    if (str.includes(',') && str.includes('.')) {
        str = str.replace(/\./g, '').replace(',', '.');
    } else if (str.includes(',')) {
        str = str.replace(',', '.');
    }
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

function extractCanais(row: Record<string, any>): Record<string, number> {
    const canais: Record<string, number> = {};
    for (const c of CANAIS) {
        const val = parseNumber(row[c]);
        if (val > 0) canais[c] = val;
    }
    return canais;
}

export async function GET() {
    try {
        const rows = await getVendaPorCanalData();

        // The spreadsheet has two pivot tables separated by empty rows.
        // Section 1: Monthly summary (header row has "mes" column)
        // Section 2: Daily detail (header row has "data" column)
        // Since csv-parse uses the first row as headers, all rows share the same columns.
        // We distinguish by checking which identifier field is populated.

        const resumoMensal: any[] = [];
        const detalheDiario: any[] = [];

        for (const row of rows) {
            const firstCol = (row[FIRST_COL] || '').toString().trim();
            const firstColStr = firstCol.toLowerCase();

            // Skip empty rows, headers, and total rows
            if (!firstColStr || firstColStr === 'total geral' || firstColStr.includes('sum de purchase') || firstColStr === 'data') continue;

            const isDate = /^\d{2}\/\d{2}\/\d{4}$/.test(firstColStr);
            const monthNames = ['janeiro', 'fevereiro', 'marco', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
            const isMonth = monthNames.includes(firstColStr.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));

            const canais = extractCanais(row);
            const total = parseNumber(row.total_geral);

            if (isMonth) {
                resumoMensal.push({
                    mes: firstCol,
                    canais,
                    total,
                });
            } else if (isDate) {
                detalheDiario.push({
                    data: firstCol,
                    canais,
                    total,
                });
            }
        }

        // Sort daily by date
        detalheDiario.sort((a, b) => {
            const [da, ma, ya] = a.data.split('/').map(Number);
            const [db, mb, yb] = b.data.split('/').map(Number);
            return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
        });

        // Compute totals
        const totalGeral: Record<string, number> = {};
        for (const row of resumoMensal) {
            for (const [canal, val] of Object.entries(row.canais)) {
                totalGeral[canal] = (totalGeral[canal] || 0) + (val as number);
            }
        }
        const totalGeralSum = Object.values(totalGeral).reduce((a, b) => a + b, 0);

        return NextResponse.json({
            success: true,
            data: {
                resumoMensal,
                detalheDiario,
                totalGeral: { canais: totalGeral, total: totalGeralSum },
                canaisLabels: CANAIS_LABELS,
            },
        });
    } catch (error: any) {
        console.error('[API] Error in visao-ga4 route:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
