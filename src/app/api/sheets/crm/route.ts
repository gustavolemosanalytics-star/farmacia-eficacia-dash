import { NextResponse } from 'next/server';
import { aggregateCRMKPIs } from '@/lib/sheets/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
        const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

        const data = await aggregateCRMKPIs(startDate, endDate);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching CRM data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
