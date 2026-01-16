import axios from 'axios';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import { MagentoOrder, MagentoOrderResponse, DashboardOrder } from './types';

const MAGENTO_CONSUMER_KEY = process.env.MAGENTO_CONSUMER_KEY!;
const MAGENTO_CONSUMER_SECRET = process.env.MAGENTO_CONSUMER_SECRET!;
const MAGENTO_ACCESS_TOKEN = process.env.MAGENTO_ACCESS_TOKEN!;
const MAGENTO_ACCESS_TOKEN_SECRET = process.env.MAGENTO_ACCESS_TOKEN_SECRET!;
const MAGENTO_BASE_URL = process.env.MAGENTO_BASE_URL;

// Day names in Portuguese
const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const oauth = new OAuth({
    consumer: {
        key: MAGENTO_CONSUMER_KEY,
        secret: MAGENTO_CONSUMER_SECRET,
    },
    signature_method: 'HMAC-SHA256',
    hash_function(base_string, key) {
        return crypto
            .createHmac('sha256', key)
            .update(base_string)
            .digest('base64');
    },
});

export const magentoClient = axios.create({
    baseURL: MAGENTO_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to sign requests
magentoClient.interceptors.request.use((config) => {
    if (!MAGENTO_BASE_URL) {
        throw new Error('MAGENTO_BASE_URL is not defined in environment variables');
    }

    const requestData = {
        url: config.baseURL + config.url!,
        method: config.method?.toUpperCase() || 'GET',
        data: config.params || {},
    };

    const token = {
        key: MAGENTO_ACCESS_TOKEN,
        secret: MAGENTO_ACCESS_TOKEN_SECRET,
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData, token));
    config.headers.Authorization = authHeader.Authorization;

    return config;
});

// Get week number of year
const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// Transform Magento order to Dashboard format
export const transformOrder = (order: MagentoOrder): DashboardOrder => {
    const createdDate = new Date(order.created_at);
    const items = order.items || [];
    const shippingAddress = order.shipping_address || order.billing_address;

    return {
        pedido: order.increment_id,
        dataTransacao: order.created_at,
        status: order.status,
        nomeProduto: items[0]?.name || '',
        receitaProduto: items[0]?.row_total || 0,
        cidade: shippingAddress?.city || '',
        estado: shippingAddress?.region || '',
        valorTotalSemFrete: order.subtotal || (order.grand_total - (order.shipping_amount || 0)),
        valorTotalComFrete: order.grand_total,
        emailCliente: order.customer_email || '',
        cpfCliente: order.customer_taxvat || (order.billing_address as any)?.vat_id || '',
        nomeProduto2: items[1]?.name || '',
        data: createdDate.toISOString().split('T')[0],
        hora: createdDate.getHours().toString().padStart(2, '0'),
        horaMinSeg: `${createdDate.getHours().toString().padStart(2, '0')}:${createdDate.getMinutes().toString().padStart(2, '0')}:${createdDate.getSeconds().toString().padStart(2, '0')}`,
        cupom: order.coupon_code || '',
        qdeTotal: order.total_qty_ordered || items.reduce((sum, item) => sum + item.qty_ordered, 0),
        diaSemana: DIAS_SEMANA[createdDate.getDay()],
        mes: MESES[createdDate.getMonth()],
        semana: `${getWeekNumber(createdDate)} Semana`,
        // These fields would require custom attributes or UTM parsing
        origem: order.extension_attributes?.utm_source || '',
        midia: order.extension_attributes?.utm_medium || '',
        campanha: order.extension_attributes?.utm_campaign || '',
        vendedor: order.extension_attributes?.seller || '',
        atribuicao: order.extension_attributes?.attribution || '',
    };
};

// Fetch orders with filters
export const getOrders = async (
    startDate?: string, // YYYY-MM-DD
    endDate?: string,   // YYYY-MM-DD
    status?: string[],
    page: number = 1,
    pageSize: number = 300
): Promise<MagentoOrderResponse> => {
    const params: any = {
        'searchCriteria[currentPage]': page,
        'searchCriteria[pageSize]': pageSize,
    };

    let filterGroupIndex = 0;

    // Date Filter (created_at)
    if (startDate) {
        params[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][field]`] = 'created_at';
        params[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][value]`] = `${startDate} 00:00:00`;
        params[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][condition_type]`] = 'gte';

        if (endDate) {
            filterGroupIndex++;
            params[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][field]`] = 'created_at';
            params[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][value]`] = `${endDate} 23:59:59`;
            params[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][condition_type]`] = 'lte';
        }
        filterGroupIndex++;
    }

    // Status Filter (IN)
    if (status && status.length > 0) {
        params[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][field]`] = 'status';
        params[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][value]`] = status.join(',');
        params[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][condition_type]`] = 'in';
        filterGroupIndex++;
    }

    // Sort by created_at DESC
    params['searchCriteria[sortOrders][0][field]'] = 'created_at';
    params['searchCriteria[sortOrders][0][direction]'] = 'DESC';

    try {
        const response = await magentoClient.get<MagentoOrderResponse>('/orders', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching Magento orders:', error);
        throw error;
    }
};

// Get today's orders
export const getTodayOrders = async (): Promise<DashboardOrder[]> => {
    const today = new Date().toISOString().split('T')[0];
    const response = await getOrders(today, today);
    return response.items.map(transformOrder);
};

// Get orders for a date range
export const getOrdersForPeriod = async (startDate: string, endDate: string): Promise<DashboardOrder[]> => {
    const response = await getOrders(startDate, endDate);
    return response.items.map(transformOrder);
};

// Get orders for last N days
export const getOrdersLastDays = async (days: number = 7): Promise<DashboardOrder[]> => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return getOrdersForPeriod(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
    );
};
