import { NextResponse } from 'next/server';
import { aggregateCatalogoKPIs, aggregateCRMKPIs, aggregateGoogleAdsKPIs, aggregateGA4KPIs } from '@/lib/sheets/client';
import { setCachedAggregation } from '@/lib/cache';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export const dynamic = 'force-dynamic';

// POST - Warm up cache with commonly used data
export async function POST() {
    const startTime = Date.now();
    const results: { endpoint: string; status: string; time: number }[] = [];

    console.log('[Cache Warmup] Starting cache warm-up...');

    // Define common date ranges to pre-cache
    const today = new Date();
    const thisMonth = { start: startOfMonth(today), end: endOfMonth(today) };
    const lastMonth = {
        start: startOfMonth(subMonths(today, 1)),
        end: endOfMonth(subMonths(today, 1))
    };

    const dateRanges = [
        { name: 'this_month', ...thisMonth },
        { name: 'last_month', ...lastMonth },
    ];

    // Warm up each endpoint for each date range
    for (const range of dateRanges) {
        // Catalogo
        try {
            const t0 = Date.now();
            const data = await aggregateCatalogoKPIs(range.start, range.end);
            await setCachedAggregation('catalogo', data, range.start, range.end);
            results.push({
                endpoint: `catalogo_${range.name}`,
                status: 'success',
                time: Date.now() - t0
            });
        } catch (e: any) {
            results.push({ endpoint: `catalogo_${range.name}`, status: `error: ${e.message}`, time: 0 });
        }

        // CRM
        try {
            const t0 = Date.now();
            const data = await aggregateCRMKPIs(range.start, range.end);
            await setCachedAggregation('crm', data, range.start, range.end);
            results.push({
                endpoint: `crm_${range.name}`,
                status: 'success',
                time: Date.now() - t0
            });
        } catch (e: any) {
            results.push({ endpoint: `crm_${range.name}`, status: `error: ${e.message}`, time: 0 });
        }

        // Google Ads
        try {
            const t0 = Date.now();
            const data = await aggregateGoogleAdsKPIs(range.start, range.end);
            await setCachedAggregation('gads_agg', data, range.start, range.end);
            results.push({
                endpoint: `gads_${range.name}`,
                status: 'success',
                time: Date.now() - t0
            });
        } catch (e: any) {
            results.push({ endpoint: `gads_${range.name}`, status: `error: ${e.message}`, time: 0 });
        }

        // GA4
        try {
            const t0 = Date.now();
            const data = await aggregateGA4KPIs(range.start, range.end);
            await setCachedAggregation('ga4_agg', data, range.start, range.end);
            results.push({
                endpoint: `ga4_${range.name}`,
                status: 'success',
                time: Date.now() - t0
            });
        } catch (e: any) {
            results.push({ endpoint: `ga4_${range.name}`, status: `error: ${e.message}`, time: 0 });
        }
    }

    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.status === 'success').length;

    console.log(`[Cache Warmup] Completed in ${totalTime}ms. ${successCount}/${results.length} successful.`);

    return NextResponse.json({
        success: true,
        message: `Cache warm-up completed`,
        totalTimeMs: totalTime,
        successCount,
        totalEndpoints: results.length,
        results,
    });
}
