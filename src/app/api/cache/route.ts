import { NextResponse } from 'next/server';
import { getCacheStats, invalidateCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET - Get cache statistics
export async function GET() {
    try {
        const stats = await getCacheStats();

        return NextResponse.json({
            success: true,
            stats,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('[Cache API] Error getting stats:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Invalidate cache by pattern
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const pattern = searchParams.get('pattern') || '';

        if (!pattern) {
            return NextResponse.json(
                { success: false, error: 'Pattern parameter required' },
                { status: 400 }
            );
        }

        const count = await invalidateCache(pattern);

        return NextResponse.json({
            success: true,
            message: `Invalidated ${count} cache entries matching "${pattern}"`,
            invalidatedCount: count,
        });
    } catch (error: any) {
        console.error('[Cache API] Error invalidating cache:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
