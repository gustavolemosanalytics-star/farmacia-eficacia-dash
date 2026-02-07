import useSWR from 'swr';
import { useFilterStore } from '@/stores/filterStore';

// SWR fetcher with error handling
const fetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch data');
    }
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
    }
    return result.data;
};

// SWR configuration for optimal performance
const swrConfig = {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1 minute deduplication
    refreshInterval: 0, // No auto-refresh
    errorRetryCount: 2,
    keepPreviousData: true,
};

// Build URL with date params
function buildUrl(endpoint: string, aggregated: boolean, startDate?: Date | string, endDate?: Date | string, extraParams?: Record<string, string>) {
    const params = new URLSearchParams();
    if (aggregated) params.append('aggregated', 'true');
    if (startDate) {
        const dateStr = startDate instanceof Date ? startDate.toISOString() : new Date(startDate).toISOString();
        params.append('startDate', dateStr);
    }
    if (endDate) {
        const dateStr = endDate instanceof Date ? endDate.toISOString() : new Date(endDate).toISOString();
        params.append('endDate', dateStr);
    }
    if (extraParams) {
        Object.entries(extraParams).forEach(([k, v]) => {
            if (v) params.append(k, v);
        });
    }
    return `${endpoint}?${params.toString()}`;
}

// Generic hook using SWR
export function useSheetData<T>(
    endpoint: string,
    aggregated: boolean = false,
    skipFilters: boolean = false,
    customStart?: Date,
    customEnd?: Date,
    extraParams?: Record<string, string>
) {
    const { periodoInicio, periodoFim, isComparing, compareStart, compareEnd } = useFilterStore();

    const start = customStart || (skipFilters ? undefined : periodoInicio);
    const end = customEnd || (skipFilters ? undefined : periodoFim);

    // Main data URL
    const mainUrl = buildUrl(endpoint, aggregated, start, end, extraParams);

    // Comparison URL (only if comparing and not skipping filters)
    const comparisonUrl = !skipFilters && !customStart && isComparing && compareStart && compareEnd
        ? buildUrl(endpoint, aggregated, compareStart, compareEnd, extraParams)
        : null;

    // Main data fetch with SWR
    const { data, error, isLoading, mutate } = useSWR<T>(
        mainUrl,
        fetcher,
        swrConfig
    );

    // Comparison data fetch with SWR
    const { data: comparisonData } = useSWR<T>(
        comparisonUrl,
        fetcher,
        swrConfig
    );

    return {
        data: data || null,
        comparisonData: comparisonData || null,
        loading: isLoading,
        error: error?.message || null,
        refetch: mutate
    };
}

// Specific hooks for each data source
export function useGoogleAdsData(aggregated: boolean = false) {
    return useSheetData<any>('/api/sheets/gads', aggregated);
}

export function useGA4Data(aggregated: boolean = false) {
    return useSheetData<any>('/api/sheets/ga4', aggregated);
}

export function useTVSalesData() {
    return useSheetData<any>('/api/sheets/tv', false);
}

// Hook for Google Ads KPIs (aggregated)
export function useGoogleAdsKPIs() {
    const { data, comparisonData, loading, error, refetch } = useGoogleAdsData(true);

    return {
        kpis: data,
        comparisonKpis: comparisonData,
        loading,
        error,
        refetch
    };
}

// Hook for GA4 KPIs (aggregated)
export function useGA4KPIs() {
    const { data, comparisonData, loading, error, refetch } = useGA4Data(true);

    return {
        kpis: data,
        comparisonKpis: comparisonData,
        loading,
        error,
        refetch
    };
}

// Hook for Catalogo Data with server-side filtering
export function useCatalogoData(customStart?: Date, customEnd?: Date, status?: string, atribuicao?: string) {
    const extraParams: Record<string, string> = {};
    if (status) extraParams.status = status;
    if (atribuicao) extraParams.atribuicao = atribuicao;

    return useSheetData<any>('/api/sheets/catalogo', false, false, customStart, customEnd, Object.keys(extraParams).length > 0 ? extraParams : undefined);
}

// Hook for YoY Analysis - lightweight SQL aggregation
export function useCatalogoYoYData() {
    const { data, error, isLoading } = useSWR<any>(
        '/api/sheets/yoy',
        fetcher,
        { ...swrConfig, dedupingInterval: 300000 } // 5 min dedup for YoY (rarely changes)
    );

    return {
        data: data || null,
        comparisonData: null,
        loading: isLoading,
        error: error?.message || null,
    };
}

// Hook for CRM Data
export function useCRMData(customStart?: Date, customEnd?: Date) {
    return useSheetData<any>('/api/sheets/crm', false, false, customStart, customEnd);
}

// =====================================================
// COMBINED DATA HOOK - For consistent data across pages
// =====================================================
export interface DashboardData {
    gadsKpis: any;
    ga4Kpis: any;
    catalogoData: any;
    loading: boolean;
    error: string | null;
    computed: {
        receitaGoogleAds: number;
        roas: number;
        totalSessions: number;
        totalClicks: number;
        totalConversions: number;
        ctr: number;
        cpc: number;
        googleAdsOrdersCount: number;
    } | null;
}

export function useDashboardData(): DashboardData {
    const { kpis: gadsKpis, loading: loadingGads, error: errorGads } = useGoogleAdsKPIs();
    const { kpis: ga4Kpis, loading: loadingGA4, error: errorGA4 } = useGA4KPIs();
    const { data: catalogoData, loading: loadingCatalogo, error: errorCatalogo } = useCatalogoData();

    const loading = loadingGads || loadingGA4 || loadingCatalogo;
    const error = errorGads || errorGA4 || errorCatalogo;

    // Compute consistent metrics from pre-aggregated server data
    let computed = null;
    if (gadsKpis && catalogoData) {
        const receitaGoogleAds = catalogoData.receitaGoogleAds || 0;
        const roas = receitaGoogleAds > 0 && gadsKpis.spend > 0 ? receitaGoogleAds / gadsKpis.spend : 0;

        computed = {
            receitaGoogleAds,
            roas,
            totalSessions: ga4Kpis?.googleSessions || 0,
            totalClicks: gadsKpis.clicks || 0,
            totalConversions: gadsKpis.conversions || 0,
            ctr: gadsKpis.ctr || 0,
            cpc: gadsKpis.cpc || 0,
            googleAdsOrdersCount: 0, // Not available without rawData
        };
    }

    return {
        gadsKpis,
        ga4Kpis,
        catalogoData,
        loading,
        error,
        computed,
    };
}
