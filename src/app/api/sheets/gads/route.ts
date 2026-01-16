import { NextResponse } from 'next/server';
import { fetchGoogleAdsData, aggregateGoogleAdsKPIs } from '@/lib/sheets/client';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const aggregated = searchParams.get('aggregated') === 'true';

        if (aggregated) {
            const kpis = await aggregateGoogleAdsKPIs();
            return NextResponse.json({ success: true, data: kpis });
        }

        const data = await fetchGoogleAdsData();
        return NextResponse.json({ success: true, data, count: data.length });
    } catch (error: any) {
        console.error('Error in Google Ads API:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
