import { NextResponse } from 'next/server';
import { getBdMagData, getGoogleAdsStoreData } from '@/lib/data/sheets-store';

export const dynamic = 'force-dynamic';

function normalizeDate(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    const s = dateStr.toString().trim().split(' ')[0];
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
    if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) {
        return s.substring(6, 10) + '-' + s.substring(3, 5) + '-' + s.substring(0, 2);
    }
    return null;
}

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

function isCompletedStatus(status: string | null | undefined): boolean {
    if (!status || status === '') return true;
    const lower = status.toLowerCase();
    return lower.includes('complete') || lower.includes('completo') ||
        lower.includes('pago') || lower.includes('enviado') ||
        lower.includes('faturado') || lower.includes('entregue') ||
        lower.includes('delivered');
}

const PAID_MEDIA_ATTRIBUTIONS = ['Google_Ads', 'Meta Ads'];

interface MonthData {
    investimento: number;
    receita: number;
    roas: number;
    totalPedidos: number;
    byCidade: { cidade: string; receita: number; pedidos: number; percentual: number }[];
}

function processMonth(
    bdMagRows: Record<string, any>[],
    gadsRows: Record<string, any>[],
    monthStart: string,
    monthEnd: string,
): MonthData {
    // Filter BD Mag: date in range, completed, paid media attribution
    const filteredBdMag = bdMagRows.filter(r => {
        const d = normalizeDate(r.data);
        if (!d || d < monthStart || d > monthEnd) return false;
        if (!isCompletedStatus(r.status)) return false;
        return true;
    });

    // Filter Google Ads by date range
    const filteredGads = gadsRows.filter(r => {
        const d = normalizeDate(r.date);
        return d && d >= monthStart && d <= monthEnd;
    });

    // Total investment from Google Ads
    let investimento = 0;
    for (const g of filteredGads) {
        investimento += parseNumber(g.spend || g.cost || g.investimento);
    }

    // Group by city — only paid media attributed orders
    const paidMediaOrders = filteredBdMag.filter(r =>
        PAID_MEDIA_ATTRIBUTIONS.includes(r.atribuicao)
    );

    const cityMap: Record<string, { receita: number; pedidos: Set<string> }> = {};
    let receita = 0;

    for (const r of paidMediaOrders) {
        const cidade = (r.cidade || 'N/A').trim();
        const rev = parseNumber(r.receita_do_produto);
        const pedido = r.pedido || '';

        receita += rev;
        if (!cityMap[cidade]) cityMap[cidade] = { receita: 0, pedidos: new Set() };
        cityMap[cidade].receita += rev;
        if (pedido) cityMap[cidade].pedidos.add(pedido);
    }

    const pedidoSet = new Set(paidMediaOrders.map(r => r.pedido).filter(Boolean));

    const byCidade = Object.entries(cityMap)
        .map(([cidade, d]) => ({
            cidade,
            receita: d.receita,
            pedidos: d.pedidos.size,
            percentual: receita > 0 ? (d.receita / receita) * 100 : 0,
        }))
        .sort((a, b) => b.receita - a.receita);

    return {
        investimento,
        receita,
        roas: investimento > 0 ? receita / investimento : 0,
        totalPedidos: pedidoSet.size,
        byCidade,
    };
}

export async function GET() {
    try {
        const [bdMag, gads] = await Promise.all([
            getBdMagData(),
            getGoogleAdsStoreData(),
        ]);

        const janeiro = processMonth(bdMag, gads, '2026-01-01', '2026-01-31');
        const fevereiro = processMonth(bdMag, gads, '2026-02-01', '2026-02-28');

        const totalInvestimento = janeiro.investimento + fevereiro.investimento;
        const totalReceita = janeiro.receita + fevereiro.receita;
        const totalROAS = totalInvestimento > 0 ? totalReceita / totalInvestimento : 0;
        const totalPedidos = janeiro.totalPedidos + fevereiro.totalPedidos;

        return NextResponse.json({
            success: true,
            data: {
                totais: {
                    investimento: totalInvestimento,
                    receita: totalReceita,
                    roas: totalROAS,
                    pedidos: totalPedidos,
                },
                janeiro,
                fevereiro,
            },
        });
    } catch (error: any) {
        console.error('[API] Error in temp route:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
