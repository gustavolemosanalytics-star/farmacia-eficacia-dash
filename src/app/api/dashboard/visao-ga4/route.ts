import { NextRequest, NextResponse } from 'next/server';
import { getGa4StoreData } from '@/lib/data/sheets-store';

export const dynamic = 'force-dynamic';

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

function parseDate(val: string): Date | null {
    if (!val) return null;
    const str = val.trim();
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d);
    }
    // DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
        const [d, m, y] = str.split('/').map(Number);
        return new Date(y, m - 1, d);
    }
    return null;
}

function formatDateKey(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function getMonthKey(d: Date): string {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${meses[d.getMonth()]} ${d.getFullYear()}`;
}

interface AggregatedPeriod {
    resumoMensal: { mes: string; canais: Record<string, number>; total: number }[];
    detalheDiario: { data: string; canais: Record<string, number>; total: number }[];
    totalGeral: { canais: Record<string, number>; total: number };
}

function aggregateRows(rows: Record<string, any>[], startDate?: Date, endDate?: Date): AggregatedPeriod {
    // Filter by date range if provided
    const filtered = rows.filter(row => {
        const d = parseDate(row.date);
        if (!d) return false;
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
    });

    // Aggregate by month
    const monthMap = new Map<string, Record<string, number>>();
    // Aggregate by day
    const dayMap = new Map<string, Record<string, number>>();
    // Total by channel
    const totalCanais: Record<string, number> = {};

    for (const row of filtered) {
        const d = parseDate(row.date);
        if (!d) continue;

        const canal = (row.atribuicao || 'Outros').toString();
        const revenue = parseNumber(row.purchase_revenue);

        if (revenue === 0) continue;

        // Monthly
        const monthKey = getMonthKey(d);
        if (!monthMap.has(monthKey)) monthMap.set(monthKey, {});
        const mEntry = monthMap.get(monthKey)!;
        mEntry[canal] = (mEntry[canal] || 0) + revenue;

        // Daily
        const dayKey = formatDateKey(d);
        if (!dayMap.has(dayKey)) dayMap.set(dayKey, {});
        const dEntry = dayMap.get(dayKey)!;
        dEntry[canal] = (dEntry[canal] || 0) + revenue;

        // Total
        totalCanais[canal] = (totalCanais[canal] || 0) + revenue;
    }

    // Build resumoMensal sorted chronologically
    const resumoMensal = Array.from(monthMap.entries())
        .sort((a, b) => {
            // Parse "Mês YYYY" to sort
            const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            const [mesA, yearA] = a[0].split(' ');
            const [mesB, yearB] = b[0].split(' ');
            const ya = parseInt(yearA), yb = parseInt(yearB);
            if (ya !== yb) return ya - yb;
            return meses.indexOf(mesA) - meses.indexOf(mesB);
        })
        .map(([mes, canais]) => ({
            mes,
            canais,
            total: Object.values(canais).reduce((a, b) => a + b, 0),
        }));

    // Build detalheDiario sorted by date
    const detalheDiario = Array.from(dayMap.entries())
        .sort((a, b) => {
            const [da, ma, ya] = a[0].split('/').map(Number);
            const [db, mb, yb] = b[0].split('/').map(Number);
            return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
        })
        .map(([data, canais]) => ({
            data,
            canais,
            total: Object.values(canais).reduce((a, b) => a + b, 0),
        }));

    const totalSum = Object.values(totalCanais).reduce((a, b) => a + b, 0);

    return {
        resumoMensal,
        detalheDiario,
        totalGeral: { canais: totalCanais, total: totalSum },
    };
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');
        const compareStartStr = searchParams.get('compareStartDate');
        const compareEndStr = searchParams.get('compareEndDate');

        const rows = await getGa4StoreData();

        // Parse dates
        const startDate = startDateStr ? new Date(startDateStr + 'T00:00:00') : undefined;
        const endDate = endDateStr ? new Date(endDateStr + 'T23:59:59') : undefined;
        const compareStart = compareStartStr ? new Date(compareStartStr + 'T00:00:00') : undefined;
        const compareEnd = compareEndStr ? new Date(compareEndStr + 'T23:59:59') : undefined;

        // Aggregate current period
        const current = aggregateRows(rows, startDate, endDate);

        // Collect all unique channel names for labels
        const allCanais = new Set<string>();
        for (const [canal] of Object.entries(current.totalGeral.canais)) allCanais.add(canal);

        // Build canaisLabels (channel name → friendly display)
        const canaisLabels: Record<string, string> = {};
        for (const canal of allCanais) {
            canaisLabels[canal] = canal.replace(/_/g, ' ');
        }

        // Aggregate comparison period if requested
        let comparison: AggregatedPeriod | undefined;
        if (compareStart && compareEnd) {
            comparison = aggregateRows(rows, compareStart, compareEnd);
            for (const [canal] of Object.entries(comparison.totalGeral.canais)) {
                allCanais.add(canal);
                if (!canaisLabels[canal]) canaisLabels[canal] = canal.replace(/_/g, ' ');
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                current: {
                    ...current,
                    canaisLabels,
                },
                comparison: comparison || null,
                channels: Array.from(allCanais).sort(),
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
