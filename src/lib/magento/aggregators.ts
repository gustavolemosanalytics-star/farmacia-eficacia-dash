import { getOrders, transformOrder } from './client';
import { MagentoOrder, DashboardOrder, DashboardSalesStats } from './types';

// Status mapping for Brazilian e-commerce
const STATUS_PAID = ['complete', 'processing', 'shipped', 'delivered'];
const STATUS_PROCESSING = ['pending', 'pending_payment', 'payment_review', 'holded'];
const STATUS_CANCELLED = ['canceled', 'closed', 'refunded'];

// Get aggregated sales statistics
export const getSalesStats = async (startDate: string, endDate: string): Promise<DashboardSalesStats> => {
    const response = await getOrders(startDate, endDate, undefined, 1, 500);
    const orders = response.items || [];

    const stats: DashboardSalesStats = {
        vendasTotais: 0,
        vendasPagas: 0,
        vendasProcessando: 0,
        vendasCanceladas: 0,
        ticketMedio: 0,
        totalPedidos: 0,
        receitaPorCidade: {},
        receitaPorEstado: {},
        receitaPorDia: {},
        pedidosPorStatus: {},
    };

    orders.forEach((order: MagentoOrder) => {
        const total = order.grand_total || 0;
        const transformed = transformOrder(order);

        // Total sales
        stats.vendasTotais += total;
        stats.totalPedidos++;

        // By status
        const status = order.status.toLowerCase();
        stats.pedidosPorStatus[order.status] = (stats.pedidosPorStatus[order.status] || 0) + 1;

        if (STATUS_PAID.includes(status)) {
            stats.vendasPagas += total;
        } else if (STATUS_PROCESSING.includes(status)) {
            stats.vendasProcessando += total;
        } else if (STATUS_CANCELLED.includes(status)) {
            stats.vendasCanceladas += total;
        }

        // By city
        if (transformed.cidade) {
            stats.receitaPorCidade[transformed.cidade] =
                (stats.receitaPorCidade[transformed.cidade] || 0) + total;
        }

        // By state
        if (transformed.estado) {
            stats.receitaPorEstado[transformed.estado] =
                (stats.receitaPorEstado[transformed.estado] || 0) + total;
        }

        // By day
        if (transformed.data) {
            stats.receitaPorDia[transformed.data] =
                (stats.receitaPorDia[transformed.data] || 0) + total;
        }
    });

    // Calculate average ticket
    stats.ticketMedio = stats.totalPedidos > 0 ? stats.vendasTotais / stats.totalPedidos : 0;

    return stats;
};

// Get top cities by revenue
export const getTopCities = async (startDate: string, endDate: string, limit: number = 10) => {
    const stats = await getSalesStats(startDate, endDate);
    return Object.entries(stats.receitaPorCidade)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([cidade, receita]) => ({ cidade, receita }));
};

// Get top states by revenue
export const getTopStates = async (startDate: string, endDate: string, limit: number = 10) => {
    const stats = await getSalesStats(startDate, endDate);
    return Object.entries(stats.receitaPorEstado)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([estado, receita]) => ({ estado, receita }));
};

// Get daily revenue trend
export const getDailyTrend = async (startDate: string, endDate: string) => {
    const stats = await getSalesStats(startDate, endDate);
    return Object.entries(stats.receitaPorDia)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([data, receita]) => ({ data, receita }));
};

// Get orders grouped by status
export const getOrdersByStatus = async (startDate: string, endDate: string) => {
    const stats = await getSalesStats(startDate, endDate);
    return Object.entries(stats.pedidosPorStatus)
        .sort((a, b) => b[1] - a[1])
        .map(([status, count]) => ({ status, count }));
};
