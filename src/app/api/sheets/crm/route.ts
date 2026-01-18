import { NextResponse } from 'next/server';
import { aggregateCRMKPIs } from '@/lib/sheets/client';
import { getCachedData, setCachedData } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');

        const cacheKey = `crm_${startDateStr || 'all'}_${endDateStr || 'all'}`;
        const cached = await getCachedData(cacheKey);

        if (cached) {
            return NextResponse.json({ success: true, data: cached, source: 'cache' });
        }

        const startDate = startDateStr ? new Date(startDateStr) : undefined;
        const endDate = endDateStr ? new Date(endDateStr) : undefined;

        const data = await aggregateCRMKPIs(startDate, endDate);

        await setCachedData(cacheKey, data);

        return NextResponse.json({ success: true, data, source: 'api' });
    } catch (error) {
        console.error('Error fetching CRM data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
