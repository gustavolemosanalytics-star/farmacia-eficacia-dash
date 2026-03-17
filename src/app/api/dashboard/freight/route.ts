import { NextResponse } from 'next/server';
import { aggregateFreightData } from '@/lib/dashboard/client';
import { getCachedAggregation, setCachedAggregation } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');

        const startDate = startDateStr ? new Date(startDateStr) : undefined;
        const endDate = endDateStr ? new Date(endDateStr) : undefined;

        const cacheType = 'freight';
        const cached = await getCachedAggregation<any>(cacheType, startDate, endDate);

        if (cached.data) {
            return NextResponse.json({ success: true, data: cached.data, source: cached.source });
        }

        const data = await aggregateFreightData(startDate, endDate);
        await setCachedAggregation(cacheType, data, startDate, endDate);

        return NextResponse.json({ success: true, data, source: 'api' });
    } catch (error) {
        console.error('[API] Error fetching Freight data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
