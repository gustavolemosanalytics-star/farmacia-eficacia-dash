// Magento Order Types - Extended for dashboard requirements

export interface MagentoOrderAddress {
    city: string;
    region: string;
    region_code: string;
    postcode: string;
    street: string[];
    telephone: string;
}

export interface MagentoOrderItem {
    item_id: number;
    sku: string;
    name: string;
    qty_ordered: number;
    price: number;
    row_total: number;
    product_type: string;
    product_id: number;
}

export interface MagentoPayment {
    method: string;
    amount_ordered: number;
    additional_information?: string[];
}

export interface MagentoOrder {
    entity_id: number;
    increment_id: string;              // Número do pedido
    status: string;                     // Status
    state: string;
    grand_total: number;                // Valor total com frete
    base_grand_total: number;
    subtotal: number;                   // Valor total sem frete
    shipping_amount: number;            // Valor do frete
    tax_amount: number;
    discount_amount: number;
    coupon_code?: string;               // Cupom
    created_at: string;                 // Data Transação
    updated_at: string;
    customer_email: string;             // E-mail cliente
    customer_firstname: string;
    customer_lastname: string;
    customer_taxvat?: string;           // CPF Cliente (custom attribute)
    remote_ip?: string;
    store_id: number;
    store_name?: string;
    total_qty_ordered: number;          // Qde Total Pedidos
    payment: MagentoPayment;
    billing_address: MagentoOrderAddress;
    shipping_address?: MagentoOrderAddress;  // Cidade, Estado
    items: MagentoOrderItem[];          // Produtos
    extension_attributes?: {
        shipping_assignments?: any[];
        // Custom attributes for seller, attribution, etc.
        [key: string]: any;
    };
}

// Transformed order for dashboard
export interface DashboardOrder {
    mpn?: string;                       // Custom ID if exists
    pedido: string;                     // increment_id
    dataTransacao: string;              // created_at formatted
    status: string;                     // status
    nomeProduto: string;                // First item name
    receitaProduto: number;             // First item row_total
    cidade: string;                     // shipping_address.city
    estado: string;                     // shipping_address.region
    valorTotalSemFrete: number;         // subtotal
    valorTotalComFrete: number;         // grand_total
    emailCliente: string;               // customer_email
    cpfCliente: string;                 // customer_taxvat or billing taxvat
    categoria?: string;                 // Product category (needs additional API call)
    vendedor?: string;                  // Custom attribute
    nomeProduto2?: string;              // Second item name
    data: string;                       // Date part
    hora: string;                       // Time part
    horaMinSeg: string;                 // Full time
    origem?: string;                    // Source (custom attribute or UTM)
    midia?: string;                     // Medium (custom attribute or UTM)
    campanha?: string;                  // Campaign (custom attribute or UTM)
    campanha2?: string;
    especialmente?: string;
    cupom?: string;                     // coupon_code
    atribuicao?: string;                // Attribution (custom attribute)
    qdeTotal: number;                   // total_qty_ordered
    pertenceA?: string;
    diaSemana: string;                  // Day of week
    mes: string;                        // Month name
    semana: string;                     // Week number
}

export interface MagentoSearchCriteria {
    filter_groups: FilterGroup[];
    sort_orders?: SortOrder[];
    pageSize?: number;
    currentPage?: number;
}

export interface FilterGroup {
    filters: Filter[];
}

export interface Filter {
    field: string;
    value: string | number | undefined;
    condition_type?: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'nin' | 'like' | 'null' | 'notnull';
}

export interface SortOrder {
    field: string;
    direction: 'ASC' | 'DESC';
}

export interface MagentoOrderResponse {
    items: MagentoOrder[];
    search_criteria: MagentoSearchCriteria;
    total_count: number;
}

// Dashboard aggregated stats
export interface DashboardSalesStats {
    vendasTotais: number;
    vendasPagas: number;
    vendasProcessando: number;
    vendasCanceladas: number;
    ticketMedio: number;
    totalPedidos: number;
    receitaPorCidade: Record<string, number>;
    receitaPorEstado: Record<string, number>;
    receitaPorDia: Record<string, number>;
    pedidosPorStatus: Record<string, number>;
}
