import { NextResponse } from 'next/server';
import { refreshAllData, getCacheStatus } from '@/lib/data/sheets-store';

export const dynamic = 'force-dynamic';

// GET - Force refresh all sheet data (bypasses 6h cache)
export async function GET() {
    try {
        console.log('[Sync] Force refreshing all Google Sheets data...');
        const startTime = Date.now();
        await refreshAllData();
        const elapsed = Date.now() - startTime;
        const status = getCacheStatus();

        return NextResponse.json({
            success: true,
            message: `All data refreshed in ${elapsed}ms`,
            elapsed,
            status,
        });
    } catch (error: any) {
        console.error('[Sync] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
