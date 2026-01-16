import { NextResponse } from 'next/server';
import { getOrders, getTodayOrders, getOrdersLastDays, transformOrder } from '@/lib/magento/client';
import { getSalesStats, getTopCities, getTopStates, getDailyTrend } from '@/lib/magento/aggregators';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || 'stats';
        const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
        const endDate = searchParams.get('endDate') || startDate;
        const days = parseInt(searchParams.get('days') || '7');

        switch (action) {
            case 'today':
                const todayOrders = await getTodayOrders();
                return NextResponse.json({
                    success: true,
                    data: todayOrders,
                    count: todayOrders.length
                });

            case 'last_days':
                const recentOrders = await getOrdersLastDays(days);
                return NextResponse.json({
                    success: true,
                    data: recentOrders,
                    count: recentOrders.length
                });

            case 'orders':
                const ordersResponse = await getOrders(startDate, endDate);
                const orders = ordersResponse.items.map(transformOrder);
                return NextResponse.json({
                    success: true,
                    data: orders,
                    count: ordersResponse.total_count
                });

            case 'stats':
                const stats = await getSalesStats(startDate, endDate);
                return NextResponse.json({ success: true, data: stats });

            case 'cities':
                const cities = await getTopCities(startDate, endDate);
                return NextResponse.json({ success: true, data: cities });

            case 'states':
                const states = await getTopStates(startDate, endDate);
                return NextResponse.json({ success: true, data: states });

            case 'trend':
                const trend = await getDailyTrend(startDate, endDate);
                return NextResponse.json({ success: true, data: trend });

            default:
                return NextResponse.json(
                    { success: false, error: 'Invalid action' },
                    { status: 400 }
                );
        }
    } catch (error: any) {
        console.error('Magento API Error:', error);

        // Check for specific error types
        if (error.message?.includes('MAGENTO_BASE_URL')) {
            return NextResponse.json(
                { success: false, error: 'Magento not configured. Please set MAGENTO_BASE_URL.' },
                { status: 500 }
            );
        }

        if (error.response?.status === 401) {
            return NextResponse.json(
                { success: false, error: 'Magento authentication failed. Check credentials.' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch Magento data' },
            { status: 500 }
        );
    }
}
