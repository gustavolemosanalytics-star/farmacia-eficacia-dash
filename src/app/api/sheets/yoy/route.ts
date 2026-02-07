import { NextResponse } from 'next/server';
import { aggregateYoYKPIs } from '@/lib/sheets/client';
import { getCachedData, setCachedData } from '@/lib/cache';

export const dynamic = 'force-dynamic';

const CACHE_KEY = 'farm:yoy:all';
const YOY_TTL = 3600; // 1 hour - historical data changes infrequently

export async function GET() {
    try {
        const cached = await getCachedData<any>(CACHE_KEY, { ttlSeconds: YOY_TTL, staleWhileRevalidate: true });

        if (cached.data) {
            console.log(`[API] yoy: Cache ${cached.source.toUpperCase()}${cached.stale ? ' (stale)' : ''}`);

            if (cached.stale) {
                refreshYoYData().catch(console.error);
            }

            return NextResponse.json({ success: true, data: cached.data, source: cached.source });
        }

        console.log('[API] yoy: Computing fresh data...');
        const data = await aggregateYoYKPIs();
        await setCachedData(CACHE_KEY, data, { ttlSeconds: YOY_TTL });

        return NextResponse.json({ success: true, data, source: 'api' });
    } catch (error) {
        console.error('[API] Error in YoY API:', error);
        return NextResponse.json({ success: false, error: 'Failed to compute YoY data' }, { status: 500 });
    }
}

async function refreshYoYData() {
    console.log('[API] yoy: Background refresh starting...');
    const data = await aggregateYoYKPIs();
    await setCachedData(CACHE_KEY, data, { ttlSeconds: YOY_TTL });
    console.log('[API] yoy: Background refresh complete');
}
