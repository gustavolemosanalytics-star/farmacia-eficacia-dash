// TV/Televendas Data (bd tv) - Estrutura extraída da planilha
// Colunas: N_Pedido, Data, Televendas, Mês

export interface TVSalesEntry {
    orderNumber: string;
    orderDate: string;
    televendas: string; // 'TV' indicates televendas order
    month: string;
}

// Dados reais extraídos da planilha (amostra)
export const tvSalesData: TVSalesEntry[] = [
    { orderNumber: '36368', orderDate: '07/04/2025 16:42', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36410', orderDate: '07/04/2025 18:47', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36422', orderDate: '01/04/2025 20:19', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36451', orderDate: '01/04/2025 22:06', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36479', orderDate: '02/06/2025 09:58', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36480', orderDate: '02/06/2025 08:18', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36485', orderDate: '02/06/2025 09:24', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36507', orderDate: '02/06/2025 10:10', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36510', orderDate: '02/06/2025 10:21', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36517', orderDate: '02/06/2025 10:21', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36524', orderDate: '02/06/2025 10:46', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36527', orderDate: '02/06/2025 10:47', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36529', orderDate: '02/06/2025 10:51', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36530', orderDate: '02/06/2025 10:52', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36532', orderDate: '02/06/2025 10:53', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36533', orderDate: '02/06/2025 10:53', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36534', orderDate: '02/06/2025 10:54', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36536', orderDate: '02/06/2025 10:55', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36537', orderDate: '02/06/2025 11:00', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36558', orderDate: '02/06/2025 11:18', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36562', orderDate: '02/06/2025 11:22', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36563', orderDate: '02/06/2025 11:22', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36565', orderDate: '02/06/2025 11:23', televendas: 'TV', month: 'Junho' },
    { orderNumber: '36566', orderDate: '02/06/2025 11:24', televendas: 'TV', month: 'Junho' },
];

// Função para agregar KPIs de Televendas
export const getTVSalesKPIs = (data: TVSalesEntry[] = tvSalesData) => {
    const totalOrders = data.length;

    // Agrupar por mês
    const byMonth = data.reduce((acc, entry) => {
        const month = entry.month || 'Unknown';
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Agrupar por data
    const byDate = data.reduce((acc, entry) => {
        // Parse date to get just the date part
        const datePart = entry.orderDate.split(' ')[0];
        acc[datePart] = (acc[datePart] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Pedidos por dia (média)
    const uniqueDates = Object.keys(byDate).length;
    const avgOrdersPerDay = uniqueDates > 0 ? totalOrders / uniqueDates : 0;

    return {
        totalOrders,
        byMonth,
        byDate,
        avgOrdersPerDay: Math.round(avgOrdersPerDay * 10) / 10,
        // Para calcular valor, precisaríamos cruzar com dados de vendas do Magento
        // Por enquanto, apenas contagem de pedidos
    };
};

// Função para agrupar pedidos de TV por período
export const getTVSalesByPeriod = (data: TVSalesEntry[] = tvSalesData, period: 'day' | 'month' = 'day') => {
    if (period === 'month') {
        return data.reduce((acc, entry) => {
            const month = entry.month;
            if (!acc[month]) {
                acc[month] = { month, orders: 0 };
            }
            acc[month].orders++;
            return acc;
        }, {} as Record<string, any>);
    }

    return data.reduce((acc, entry) => {
        const date = entry.orderDate.split(' ')[0];
        if (!acc[date]) {
            acc[date] = { date, orders: 0 };
        }
        acc[date].orders++;
        return acc;
    }, {} as Record<string, any>);
};
