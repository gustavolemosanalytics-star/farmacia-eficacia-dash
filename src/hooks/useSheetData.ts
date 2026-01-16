import { useState, useEffect, useCallback } from 'react';

import { useFilterStore } from '@/stores/filterStore';

// Generic hook for fetching sheet data
export function useSheetData<T>(endpoint: string, aggregated: boolean = false) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { periodoInicio, periodoFim } = useFilterStore();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (aggregated) params.append('aggregated', 'true');
            if (periodoInicio) params.append('startDate', periodoInicio.toISOString());
            if (periodoFim) params.append('endDate', periodoFim.toISOString());

            const url = `${endpoint}?${params.toString()}`;
            const response = await fetch(url);
            const result = await response.json();

            if (result.success) {
                setData(result.data);
            } else {
                setError(result.error || 'Failed to fetch data');
            }
        } catch (err: any) {
            setError(err.message || 'Network error');
        } finally {
            setLoading(false);
        }
    }, [endpoint, aggregated, periodoInicio, periodoFim]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
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
    const { data, loading, error, refetch } = useGoogleAdsData(true);

    return {
        kpis: data,
        loading,
        error,
        refetch
    };
}

// Hook for GA4 KPIs
export function useGA4KPIs() {
    const { data, loading, error, refetch } = useGA4Data(true);

    return {
        kpis: data,
        loading,
        error,
        refetch
    };
}

// Hook for Catalogo Data
export function useCatalogoData() {
    return useSheetData<any>('/api/sheets/catalogo');
}

// Hook for CRM Data
export function useCRMData() {
    return useSheetData<any>('/api/sheets/crm');
}
