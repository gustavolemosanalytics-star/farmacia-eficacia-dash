// Cache utility library

import NodeCache from 'node-cache';

// ===========================================
// IN-MEMORY CACHE SYSTEM
// ===========================================

// In-memory cache (60 seconds for hot data)
const memoryCache = new NodeCache({
    stdTTL: 60,
    checkperiod: 30,
    useClones: false // Better performance
});

// ===========================================
// CACHE CONFIGURATION
// ===========================================

export interface CacheOptions {
    ttlSeconds?: number;
    staleWhileRevalidate?: boolean;
    priority?: 'high' | 'normal' | 'low'; // Affects memory cache behavior
}

const DEFAULT_TTL = 300; // 5 minutes
const HISTORICAL_TTL = 3600; // 1 hour for historical data (doesn't change often)
const RAW_DATA_TTL = 600; // 10 minutes for raw sheet data

// ===========================================
// SMART CACHE KEY GENERATION (internal helper)
// ===========================================

const generateCacheKey = (
    type: string,
    params: Record<string, string | undefined>
): string => {
    const sortedParams = Object.entries(params)
        .filter(([_, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join('_');

    return `farm:${type}:${sortedParams || 'all'}`;
};

// Check if request is for historical data (older than 30 days) - internal helper
const isHistoricalRequest = (startDate?: Date, endDate?: Date): boolean => {
    if (!endDate) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return endDate < thirtyDaysAgo;
};

// ===========================================
// CACHE GET
// ===========================================

export const getCachedData = async <T>(
    key: string,
    options: CacheOptions = {}
): Promise<{ data: T | undefined; source: 'memory' | 'miss'; stale?: boolean }> => {

    // Check memory cache
    const memoryData = memoryCache.get<{ data: T; timestamp: number }>(key);
    if (memoryData) {
        const age = Date.now() - memoryData.timestamp;
        const ttl = (options.ttlSeconds || DEFAULT_TTL) * 1000;

        // If fresh, return immediately
        if (age < ttl) {
            return { data: memoryData.data, source: 'memory' };
        }

        // If stale but within 2x TTL and staleWhileRevalidate is enabled
        if (options.staleWhileRevalidate && age < ttl * 2) {
            return { data: memoryData.data, source: 'memory', stale: true };
        }
    }

    return { data: undefined, source: 'miss' };
};

// ===========================================
// CACHE SET
// ===========================================

export const setCachedData = async <T>(
    key: string,
    data: T,
    options: CacheOptions = {}
): Promise<void> => {
    const ttl = options.ttlSeconds || DEFAULT_TTL;
    const wrapper = { data, timestamp: Date.now() };

    // Always set in memory with full TTL since Redis is gone
    memoryCache.set(key, wrapper, ttl);
};

// ===========================================
// CACHE INVALIDATION
// ===========================================

export const invalidateCache = async (pattern: string): Promise<number> => {
    // Clear memory cache
    const memKeys = memoryCache.keys().filter(k => k.includes(pattern));
    memKeys.forEach(k => memoryCache.del(k));

    console.log(`[Cache] Invalidated ${memKeys.length} keys matching "${pattern}"`);
    return memKeys.length;
};

// ===========================================
// RAW SHEET DATA CACHE (Special handling)
// ===========================================

// Cache raw sheet data to avoid repeated Google API calls
export const getCachedSheetData = async (
    sheetName: string
): Promise<any[][] | undefined> => {
    const key = `farm:raw:${sheetName}`;
    const result = await getCachedData<any[][]>(key, {
        ttlSeconds: RAW_DATA_TTL,
        staleWhileRevalidate: true
    });
    return result.data;
};

export const setCachedSheetData = async (
    sheetName: string,
    data: any[][]
): Promise<void> => {
    const key = `farm:raw:${sheetName}`;
    await setCachedData(key, data, { ttlSeconds: RAW_DATA_TTL });
};

// ===========================================
// AGGREGATED DATA CACHE (with smart TTL)
// ===========================================

export const getCachedAggregation = async <T>(
    type: string,
    startDate?: Date,
    endDate?: Date
): Promise<{ data: T | undefined; source: string; stale?: boolean }> => {
    const isHistorical = isHistoricalRequest(startDate, endDate);
    const ttl = isHistorical ? HISTORICAL_TTL : DEFAULT_TTL;

    const key = generateCacheKey(type, {
        start: startDate?.toISOString().split('T')[0],
        end: endDate?.toISOString().split('T')[0],
    });

    return getCachedData<T>(key, {
        ttlSeconds: ttl,
        staleWhileRevalidate: true
    });
};

export const setCachedAggregation = async <T>(
    type: string,
    data: T,
    startDate?: Date,
    endDate?: Date
): Promise<void> => {
    const isHistorical = isHistoricalRequest(startDate, endDate);
    const ttl = isHistorical ? HISTORICAL_TTL : DEFAULT_TTL;

    const key = generateCacheKey(type, {
        start: startDate?.toISOString().split('T')[0],
        end: endDate?.toISOString().split('T')[0],
    });

    await setCachedData(key, data, { ttlSeconds: ttl });
};

// ===========================================
// CACHE STATISTICS
// ===========================================

export const getCacheStats = async (): Promise<{
    memory: { keys: number; hits: number; misses: number };
}> => {
    const memStats = memoryCache.getStats();

    return {
        memory: {
            keys: memoryCache.keys().length,
            hits: memStats.hits,
            misses: memStats.misses,
        }
    };
};

// ===========================================
// LEGACY EXPORTS (Backward compatibility)
// ===========================================

// Keep old function signatures working
export const getCachedDataLegacy = async <T>(key: string): Promise<T | undefined> => {
    const result = await getCachedData<T>(key);
    return result.data;
};

export const setCachedDataLegacy = async <T>(
    key: string,
    data: T,
    ttlSeconds: number = DEFAULT_TTL
): Promise<void> => {
    await setCachedData(key, data, { ttlSeconds });
};
