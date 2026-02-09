import { NextResponse } from 'next/server';
import { aggregateCatalogoKPIs } from '@/lib/dashboard/client';
import { getCachedAggregation, setCachedAggregation } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');
        const status = searchParams.get('status') || undefined;
        const atribuicao = searchParams.get('atribuicao') || undefined;

        const isAggregatedOnly = searchParams.get('aggregated') === 'true';
        const startDate = startDateStr ? new Date(startDateStr) : undefined;
        const endDate = endDateStr ? new Date(endDateStr) : undefined;

        // Include filters in cache key
        const cacheType = `catalogo${status ? `_s:${status}` : ''}${atribuicao ? `_a:${atribuicao}` : ''}${isAggregatedOnly ? '_agg' : '_full'}`;

        // Check cache with smart TTL (longer for historical data)
        const cached = await getCachedAggregation<any>(cacheType, startDate, endDate);

        if (cached.data) {
            console.log(`[API] ${cacheType}: Cache ${cached.source.toUpperCase()}${cached.stale ? ' (stale)' : ''}`);

            // If stale, trigger background refresh
            if (cached.stale) {
                refreshCatalogoData(startDate, endDate, status, atribuicao, cacheType, isAggregatedOnly).catch(console.error);
            }

            return NextResponse.json({
                success: true,
                data: cached.data,
                source: cached.source,
                stale: cached.stale
            });
        }

        console.log(`[API] ${cacheType}: Fetching fresh data...`);
        const data = await aggregateCatalogoKPIs(startDate, endDate, status, atribuicao, !isAggregatedOnly);

        // Cache with smart TTL
        await setCachedAggregation(cacheType, data, startDate, endDate);

        return NextResponse.json({ success: true, data, source: 'api' });
    } catch (error) {
        console.error('[API] Error fetching Catalogo data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

// Background refresh function
async function refreshCatalogoData(startDate?: Date, endDate?: Date, status?: string, atribuicao?: string, cacheType?: string, includeRaw: boolean = true) {
    console.log(`[API] ${cacheType}: Background refresh starting...`);
    const data = await aggregateCatalogoKPIs(startDate, endDate, status, atribuicao, includeRaw);
    await setCachedAggregation(cacheType || 'catalogo', data, startDate, endDate);
    console.log(`[API] ${cacheType}: Background refresh complete`);
}
