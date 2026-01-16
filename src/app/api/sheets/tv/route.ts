import { NextResponse } from 'next/server';
import { fetchTVSalesData } from '@/lib/sheets/client';

export async function GET() {
    try {
        const data = await fetchTVSalesData();

        // Aggregate TV sales KPIs
        const totalOrders = data.length;
        const byMonth = data.reduce((acc, entry) => {
            const month = entry.month || 'Unknown';
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return NextResponse.json({
            success: true,
            data,
            count: data.length,
            kpis: {
                totalOrders,
                byMonth
            }
        });
    } catch (error: any) {
        console.error('Error in TV Sales API:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
