import { useState, useEffect, useCallback } from 'react';

import { useFilterStore } from '@/stores/filterStore';

// Generic hook for fetching sheet data
export function useSheetData<T>(
    endpoint: string,
    aggregated: boolean = false,
    skipFilters: boolean = false,
    customStart?: Date,
    customEnd?: Date
) {
    const [data, setData] = useState<T | null>(null);
    const [comparisonData, setComparisonData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { periodoInicio, periodoFim, isComparing, compareStart, compareEnd } = useFilterStore();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const start = customStart || periodoInicio;
            const end = customEnd || periodoFim;

            // Main Period Fetch
            const params = new URLSearchParams();
            if (aggregated) params.append('aggregated', 'true');
            if (!skipFilters && start) params.append('startDate', start.toISOString());
            if (!skipFilters && end) params.append('endDate', end.toISOString());

            const url = `${endpoint}?${params.toString()}`;
            const response = await fetch(url);
            const result = await response.json();

            if (result.success) {
                setData(result.data);
            } else {
                setError(result.error || 'Failed to fetch data');
            }

            // Comparison Period Fetch (Skip if skipFilters is true or custom range is used)
            if (!skipFilters && !customStart && isComparing && compareStart && compareEnd) {
                const compareParams = new URLSearchParams();
                if (aggregated) compareParams.append('aggregated', 'true');
                compareParams.append('startDate', compareStart.toISOString());
                compareParams.append('endDate', compareEnd.toISOString());

                const compareUrl = `${endpoint}?${compareParams.toString()}`;
                const compareResponse = await fetch(compareUrl);
                const compareResult = await compareResponse.json();

                if (compareResult.success) {
                    setComparisonData(compareResult.data);
                }
            } else {
                setComparisonData(null);
            }

        } catch (err: any) {
            setError(err.message || 'Network error');
        } finally {
            setLoading(false);
        }
    }, [endpoint, aggregated, skipFilters, periodoInicio, periodoFim, isComparing, compareStart, compareEnd, customStart, customEnd]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, comparisonData, loading, error, refetch: fetchData };
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

// Hook for Google Ads KPIs
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

// Hook for GA4 KPIs
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

// Hook for Catalogo Data
export function useCatalogoData(customStart?: Date, customEnd?: Date) {
    return useSheetData<any>('/api/sheets/catalogo', false, false, customStart, customEnd);
}

// Hook for YoY Analysis (ignores global date filters to get historical context)
export function useCatalogoYoYData() {
    return useSheetData<any>('/api/sheets/catalogo', false, true);
}

// Hook for CRM Data
export function useCRMData(customStart?: Date, customEnd?: Date) {
    return useSheetData<any>('/api/sheets/crm', false, false, customStart, customEnd);
}
