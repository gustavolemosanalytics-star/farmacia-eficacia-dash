// Cache utility library

import NodeCache from 'node-cache';
import Redis from 'ioredis';

// ===========================================
// CACHE L1: IN-MEMORY (FASTEST)
// ===========================================

const memoryCache = new NodeCache({
    stdTTL: 600,
    checkperiod: 120,
    useClones: false
});

// ===========================================
// CACHE L2: REDIS (DISTRIBUTED)
// ===========================================

const redisUrl = process.env.REDIS_URL;
let redis: Redis | null = null;

if (redisUrl) {
    try {
        redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => Math.min(times * 50, 2000),
        });

        redis.on('error', (err) => {
            console.error('[Redis] Connection Error:', err.message);
        });

        redis.on('connect', () => {
            console.log('[Redis] Connected successfully');
        });
    } catch (err) {
        console.error('[Redis] Initialization Error:', err);
    }
} else {
    console.warn('[Redis] No REDIS_URL provided. Operating in memory-only mode.');
}

// ===========================================
// CACHE CONFIGURATION
// ===========================================

export interface CacheOptions {
    ttlSeconds?: number;
    staleWhileRevalidate?: boolean;
    priority?: 'high' | 'normal' | 'low';
}

const DEFAULT_TTL = 600; // 10 minutes (updated per user request)
const HISTORICAL_TTL = 3600; // 1 hour for historical data
const RAW_DATA_TTL = 600; // 10 minutes for raw sheet data
const AGGREGATED_TTL = 600; // 10 minutes for aggregated data

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
): Promise<{ data: T | undefined; source: 'memory' | 'redis' | 'miss'; stale?: boolean }> => {

    // 1. Check memory cache (L1)
    const memoryData = memoryCache.get<{ data: T; timestamp: number }>(key);
    if (memoryData) {
        const age = Date.now() - memoryData.timestamp;
        const ttl = (options.ttlSeconds || DEFAULT_TTL) * 1000;

        if (age < ttl) {
            return { data: memoryData.data, source: 'memory' };
        }

        if (options.staleWhileRevalidate && age < ttl * 2) {
            return { data: memoryData.data, source: 'memory', stale: true };
        }
    }

    // 2. Check Redis (L2)
    if (redis) {
        try {
            const redisData = await redis.get(key);
            if (redisData) {
                const parsed = JSON.parse(redisData) as { data: T; timestamp: number };

                // Backfill memory cache
                memoryCache.set(key, parsed, options.ttlSeconds || DEFAULT_TTL);

                return { data: parsed.data, source: 'redis' };
            }
        } catch (err) {
            console.error('[Redis] Get Error:', err);
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

    // Set L1
    memoryCache.set(key, wrapper, ttl);

    // Set L2
    if (redis) {
        try {
            await redis.set(key, JSON.stringify(wrapper), 'EX', ttl);
        } catch (err) {
            console.error('[Redis] Set Error:', err);
        }
    }
};

// ===========================================
// CACHE INVALIDATION
// ===========================================

export const invalidateCache = async (pattern: string): Promise<number> => {
    // 1. Clear memory cache
    const memKeys = memoryCache.keys().filter(k => k.includes(pattern));
    memKeys.forEach(k => memoryCache.del(k));

    // 2. Clear Redis
    let redisDeleted = 0;
    if (redis) {
        try {
            const keys = await redis.keys(`*${pattern}*`);
            if (keys.length > 0) {
                redisDeleted = await redis.del(...keys);
            }
        } catch (err) {
            console.error('[Redis] Invalidation Error:', err);
        }
    }

    console.log(`[Cache] Invalidated ${memKeys.length} (memory) and ${redisDeleted} (redis) keys matching "${pattern}"`);
    return memKeys.length + redisDeleted;
};

// ===========================================
// RAW SHEET DATA CACHE
// ===========================================

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
// AGGREGATED DATA CACHE
// ===========================================

export const getCachedAggregation = async <T>(
    type: string,
    startDate?: Date,
    endDate?: Date
): Promise<{ data: T | undefined; source: string; stale?: boolean }> => {
    const isHistorical = isHistoricalRequest(startDate, endDate);
    const ttl = isHistorical ? HISTORICAL_TTL : AGGREGATED_TTL;

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
    const ttl = isHistorical ? HISTORICAL_TTL : AGGREGATED_TTL;

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
    redis: { connected: boolean; keys?: number };
}> => {
    const memStats = memoryCache.getStats();
    let redisKeys = 0;
    if (redis) {
        try {
            redisKeys = (await redis.keys('farm:*')).length;
        } catch (err) { }
    }

    return {
        memory: {
            keys: memoryCache.keys().length,
            hits: memStats.hits,
            misses: memStats.misses,
        },
        redis: {
            connected: !!redis,
            keys: redisKeys
        }
    };
};

// ===========================================
// LEGACY EXPORTS
// ===========================================

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
