import { NextResponse } from 'next/server';
import { fetchGoogleAdsData, aggregateGoogleAdsKPIs } from '@/lib/dashboard/client';
import { getCachedAggregation, setCachedAggregation } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const aggregated = searchParams.get('aggregated') === 'true';
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');

        const startDate = startDateStr ? new Date(startDateStr) : undefined;
        const endDate = endDateStr ? new Date(endDateStr) : undefined;

        const cacheType = aggregated ? 'gads_agg' : 'gads_raw';

        // Check cache with smart TTL
        const cached = await getCachedAggregation<any>(cacheType, startDate, endDate);

        if (cached.data) {
            console.log(`[API] ${cacheType}: Cache ${cached.source.toUpperCase()}${cached.stale ? ' (stale)' : ''}`);

            if (cached.stale) {
                refreshGAdsData(aggregated, startDate, endDate).catch(console.error);
            }

            return NextResponse.json({
                success: true,
                data: cached.data,
                count: Array.isArray(cached.data) ? cached.data.length : undefined,
                source: cached.source,
                stale: cached.stale
            });
        }

        console.log(`[API] ${cacheType}: Fetching fresh data...`);

        let data;
        if (aggregated) {
            data = await aggregateGoogleAdsKPIs(startDate, endDate);
        } else {
            data = await fetchGoogleAdsData();
        }

        await setCachedAggregation(cacheType, data, startDate, endDate);

        return NextResponse.json({
            success: true,
            data,
            count: Array.isArray(data) ? data.length : undefined,
            source: 'api'
        });
    } catch (error: any) {
        console.error('[API] Error in Google Ads API:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

async function refreshGAdsData(aggregated: boolean, startDate?: Date, endDate?: Date) {
    const cacheType = aggregated ? 'gads_agg' : 'gads_raw';
    console.log(`[API] ${cacheType}: Background refresh starting...`);

    const data = aggregated
        ? await aggregateGoogleAdsKPIs(startDate, endDate)
        : await fetchGoogleAdsData();

    await setCachedAggregation(cacheType, data, startDate, endDate);
    console.log(`[API] ${cacheType}: Background refresh complete`);
}
