import { NextResponse } from 'next/server';
import { fetchGA4Data, aggregateGA4KPIs } from '@/lib/sheets/client';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const aggregated = searchParams.get('aggregated') === 'true';

        if (aggregated) {
            const kpis = await aggregateGA4KPIs();
            return NextResponse.json({ success: true, data: kpis });
        }

        const data = await fetchGA4Data();
        return NextResponse.json({ success: true, data, count: data.length });
    } catch (error: any) {
        console.error('Error in GA4 API:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
