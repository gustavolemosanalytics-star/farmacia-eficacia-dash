import { NextResponse } from 'next/server';
import { fetchGA4Data, aggregateGA4KPIs } from '@/lib/sheets/client';
import { getCachedData, setCachedData } from '@/lib/cache';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const aggregated = searchParams.get('aggregated') === 'true';
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');

        const cacheKey = `ga4_${aggregated ? 'agg' : 'raw'}_${startDateStr || 'all'}_${endDateStr || 'all'}`;
        const cached = getCachedData(cacheKey);

        if (cached) {
            return NextResponse.json({ success: true, data: cached, count: Array.isArray(cached) ? cached.length : undefined, source: 'cache' });
        }

        const startDate = startDateStr ? new Date(startDateStr) : undefined;
        const endDate = endDateStr ? new Date(endDateStr) : undefined;

        let data;
        if (aggregated) {
            data = await aggregateGA4KPIs(startDate, endDate);
        } else {
            data = await fetchGA4Data();
        }

        setCachedData(cacheKey, data);

        return NextResponse.json({ success: true, data, count: Array.isArray(data) ? data.length : undefined, source: 'api' });
    } catch (error: any) {
        console.error('Error in GA4 API:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
