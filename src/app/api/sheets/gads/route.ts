import { NextResponse } from 'next/server';
import { fetchGoogleAdsData, aggregateGoogleAdsKPIs } from '@/lib/sheets/client';
import { getCachedData, setCachedData } from '@/lib/cache';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const aggregated = searchParams.get('aggregated') === 'true';
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');

        const cacheKey = `gads_${aggregated ? 'agg' : 'raw'}_${startDateStr || 'all'}_${endDateStr || 'all'}`;
        const cached = await getCachedData(cacheKey);

        if (cached) {
            return NextResponse.json({ success: true, data: cached, count: Array.isArray(cached) ? cached.length : undefined, source: 'cache' });
        }

        const startDate = startDateStr ? new Date(startDateStr) : undefined;
        const endDate = endDateStr ? new Date(endDateStr) : undefined;

        let data;
        if (aggregated) {
            data = await aggregateGoogleAdsKPIs(startDate, endDate);
        } else {
            data = await fetchGoogleAdsData();
        }

        await setCachedData(cacheKey, data);

        return NextResponse.json({ success: true, data, source: 'api' });
    } catch (error: any) {
        console.error('Error in Google Ads API:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
