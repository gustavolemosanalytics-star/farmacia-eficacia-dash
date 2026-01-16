import { NextResponse } from 'next/server';
import { aggregateCatalogoKPIs } from '@/lib/sheets/client';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const data = await aggregateCatalogoKPIs();
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching Catalogo data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
