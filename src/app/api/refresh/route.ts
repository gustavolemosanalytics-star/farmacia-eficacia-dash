import { NextResponse } from 'next/server';
import { refreshAllData } from '@/lib/data/sheets-store';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        const startTime = Date.now();
        console.log('[Refresh] Manual refresh triggered...');

        await refreshAllData();

        const elapsed = Date.now() - startTime;
        console.log(`[Refresh] Completed in ${elapsed}ms`);

        return NextResponse.json({
            success: true,
            message: 'Dados atualizados com sucesso',
            timeMs: elapsed,
        });
    } catch (error: any) {
        console.error('[Refresh] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
