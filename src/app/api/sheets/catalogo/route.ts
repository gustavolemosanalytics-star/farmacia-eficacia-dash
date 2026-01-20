import { NextResponse } from 'next/server';
import { aggregateCatalogoKPIs } from '@/lib/sheets/client';
import { getCachedAggregation, setCachedAggregation } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');

        const startDate = startDateStr ? new Date(startDateStr) : undefined;
        const endDate = endDateStr ? new Date(endDateStr) : undefined;

        // Check cache with smart TTL (longer for historical data)
        const cached = await getCachedAggregation<any>('catalogo', startDate, endDate);

        if (cached.data) {
            console.log(`[API] catalogo: Cache ${cached.source.toUpperCase()}${cached.stale ? ' (stale)' : ''}`);

            // If stale, trigger background refresh
            if (cached.stale) {
                // Fire and forget - don't await
                refreshCatalogoData(startDate, endDate).catch(console.error);
            }

            return NextResponse.json({
                success: true,
                data: cached.data,
                source: cached.source,
                stale: cached.stale
            });
        }

        console.log('[API] catalogo: Fetching fresh data...');
        const data = await aggregateCatalogoKPIs(startDate, endDate);

        // Cache with smart TTL
        await setCachedAggregation('catalogo', data, startDate, endDate);

        return NextResponse.json({ success: true, data, source: 'api' });
    } catch (error) {
        console.error('[API] Error fetching Catalogo data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

// Background refresh function
async function refreshCatalogoData(startDate?: Date, endDate?: Date) {
    console.log('[API] catalogo: Background refresh starting...');
    const data = await aggregateCatalogoKPIs(startDate, endDate);
    await setCachedAggregation('catalogo', data, startDate, endDate);
    console.log('[API] catalogo: Background refresh complete');
}
