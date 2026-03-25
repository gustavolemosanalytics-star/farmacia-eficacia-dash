import { NextResponse } from 'next/server';
import { getBdMagData, getGoogleAdsStoreData, getBdGa4Data } from '@/lib/data/sheets-store';

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

const PAID_MEDIA_ATTRIBUTIONS = ['Google_Ads', 'Meta Ads'];

interface MonthData {
    investimento: number;
    receita: number;
    roas: number;
    totalPedidos: number;
    byCidade: { cidade: string; receita: number; pedidos: number; percentual: number; investimento: number; roas: number }[];
}

function processMonth(
    bdMagRows: Record<string, any>[],
    gadsRows: Record<string, any>[],
    bdGa4Rows: Record<string, any>[],
    monthStart: string,
    monthEnd: string,
): MonthData {
    // Filter Google Ads by date range, excluding Lead and Visita campaigns (for investment/cost only)
    const filteredGads = gadsRows.filter(r => {
        const d = normalizeDate(r.date);
        if (!d || d < monthStart || d > monthEnd) return false;
        const camp = (r.campaign || '').toLowerCase();
        if (camp.includes('lead') || camp.includes('visita')) return false;
        return true;
    });

    // Google Ads: investment (cost) from Google Ads sheet
    let investimento = 0;
    for (const g of filteredGads) {
        investimento += parseNumber(g.spend || g.cost || g.investimento);
    }

    // Revenue from BD GA4 (atribuicao_1 = Google_Ads)
    const filteredBdGa4 = bdGa4Rows.filter(r => {
        const atrib = (r.atribuicao_1 || '').toString().trim();
        if (atrib !== 'Google_Ads') return false;
        const d = normalizeDate(r.date || r.data);
        if (!d || d < monthStart || d > monthEnd) return false;
        return true;
    });

    let receita = 0;
    for (const r of filteredBdGa4) {
        receita += parseNumber(r.purchase_revenue);
    }

    // Group by city from BD GA4 (Google_Ads orders) for proportional distribution
    const cityMap: Record<string, { receitaGa4: number; pedidos: Set<string> }> = {};
    let totalReceitaGa4 = 0;

    for (const r of filteredBdGa4) {
        const cidade = (r.cidade || 'N/A').trim();
        const rev = parseNumber(r.purchase_revenue);
        const pedido = r.transaction_id || '';

        totalReceitaGa4 += rev;
        if (!cityMap[cidade]) cityMap[cidade] = { receitaGa4: 0, pedidos: new Set() };
        cityMap[cidade].receitaGa4 += rev;
        if (pedido) cityMap[cidade].pedidos.add(pedido);
    }

    const pedidoSet = new Set(filteredBdGa4.map(r => r.transaction_id).filter(Boolean));

    // Distribute revenue and investment proportionally by city's share
    const byCidade = Object.entries(cityMap)
        .map(([cidade, d]) => {
            const percentual = totalReceitaGa4 > 0 ? (d.receitaGa4 / totalReceitaGa4) * 100 : 0;
            const cidadeReceita = receita * (percentual / 100);
            const cidadeInvestimento = investimento * (percentual / 100);
            return {
                cidade,
                receita: cidadeReceita,
                pedidos: d.pedidos.size,
                percentual,
                investimento: cidadeInvestimento,
                roas: cidadeInvestimento > 0 ? cidadeReceita / cidadeInvestimento : 0,
            };
        })
        .sort((a, b) => b.receita - a.receita);

    return {
        investimento,
        receita,
        roas: investimento > 0 ? receita / investimento : 0,
        totalPedidos: pedidoSet.size,
        byCidade,
    };
}

const MONTH_NAMES = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MONTH_LABELS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function getMonthRange(year: number, month: number): { start: string; end: string } {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { start, end };
}

export async function GET() {
    try {
        const [bdMag, gads, bdGa4] = await Promise.all([
            getBdMagData(),
            getGoogleAdsStoreData(),
            getBdGa4Data(),
        ]);

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-based

        const startYear = 2026;
        const startMonth = 1;

        const months: Record<string, MonthData> = {};
        const monthLabels: Record<string, string> = {};
        let totalInvestimento = 0;
        let totalReceita = 0;
        let totalPedidos = 0;

        for (let y = startYear; y <= currentYear; y++) {
            const mStart = y === startYear ? startMonth : 1;
            const mEnd = y === currentYear ? currentMonth : 12;
            for (let m = mStart; m <= mEnd; m++) {
                const { start, end } = getMonthRange(y, m);
                const key = MONTH_NAMES[m - 1] + (y > startYear ? `_${y}` : '');
                const data = processMonth(bdMag, gads, bdGa4, start, end);
                months[key] = data;
                monthLabels[key] = `${MONTH_LABELS[m - 1]} ${y}`;
                totalInvestimento += data.investimento;
                totalReceita += data.receita;
                totalPedidos += data.totalPedidos;
            }
        }

        const totalROAS = totalInvestimento > 0 ? totalReceita / totalInvestimento : 0;

        return NextResponse.json({
            success: true,
            data: {
                totais: {
                    investimento: totalInvestimento,
                    receita: totalReceita,
                    roas: totalROAS,
                    pedidos: totalPedidos,
                },
                months,
                monthLabels,
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
