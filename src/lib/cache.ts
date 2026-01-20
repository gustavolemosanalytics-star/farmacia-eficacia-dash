// Cache utility library

import NodeCache from 'node-cache';
import Redis from 'ioredis';

// ===========================================
// MULTI-LAYER CACHE SYSTEM
// ===========================================
// Layer 1: In-Memory (fastest, smallest, short TTL)
// Layer 2: Redis (fast, shared across instances, medium TTL)
// ===========================================

// In-memory cache (60 seconds for hot data)
const memoryCache = new NodeCache({
    stdTTL: 60,
    checkperiod: 30,
    useClones: false // Better performance
});

// Redis client singleton
let redis: Redis | null = null;
let redisReady = false;

const initRedis = () => {
    if (redis) return redis;

    if (process.env.REDIS_URL) {
        console.log('[Cache] Initializing Redis...');
        redis = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                if (times > 3) return null; // Stop retrying after 3 attempts
                return Math.min(times * 100, 3000);
            },
            connectTimeout: 5000,
            lazyConnect: true,
        });

        redis.on('error', (err) => {
            console.error('[Cache] Redis Error:', err.message);
            redisReady = false;
        });

        redis.on('connect', () => {
            console.log('[Cache] Redis Connected');
            redisReady = true;
        });

        redis.on('ready', () => {
            console.log('[Cache] Redis Ready');
            redisReady = true;
        });

        // Connect lazily
        redis.connect().catch(() => {
            console.warn('[Cache] Redis connection failed, using memory only');
        });
    }

    return redis;
};

// Initialize on module load
initRedis();

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
// MULTI-LAYER GET
// ===========================================

export const getCachedData = async <T>(
    key: string,
    options: CacheOptions = {}
): Promise<{ data: T | undefined; source: 'memory' | 'redis' | 'miss'; stale?: boolean }> => {

    // Layer 1: Check memory cache first (fastest)
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

    // Layer 2: Check Redis
    if (redis && redisReady) {
        try {
            const redisData = await redis.get(key);
            if (redisData) {
                const parsed = JSON.parse(redisData) as { data: T; timestamp: number };

                // Store in memory cache for faster subsequent access
                memoryCache.set(key, parsed, 60);

                const age = Date.now() - parsed.timestamp;
                const ttl = (options.ttlSeconds || DEFAULT_TTL) * 1000;

                if (age < ttl) {
                    return { data: parsed.data, source: 'redis' };
                }

                if (options.staleWhileRevalidate && age < ttl * 2) {
                    return { data: parsed.data, source: 'redis', stale: true };
                }
            }
        } catch (e) {
            console.error('[Cache] Redis get error:', e);
        }
    }

    return { data: undefined, source: 'miss' };
};

// ===========================================
// MULTI-LAYER SET
// ===========================================

export const setCachedData = async <T>(
    key: string,
    data: T,
    options: CacheOptions = {}
): Promise<void> => {
    const ttl = options.ttlSeconds || DEFAULT_TTL;
    const wrapper = { data, timestamp: Date.now() };

    // Layer 1: Always set in memory (fast access)
    const memoryTtl = Math.min(ttl, 120); // Max 2 minutes in memory
    memoryCache.set(key, wrapper, memoryTtl);

    // Layer 2: Set in Redis for shared/persistent cache
    if (redis && redisReady) {
        try {
            await redis.set(key, JSON.stringify(wrapper), 'EX', ttl);
        } catch (e) {
            console.error('[Cache] Redis set error:', e);
        }
    }
};

// ===========================================
// CACHE INVALIDATION
// ===========================================

export const invalidateCache = async (pattern: string): Promise<number> => {
    let count = 0;

    // Clear memory cache
    const memKeys = memoryCache.keys().filter(k => k.includes(pattern));
    memKeys.forEach(k => memoryCache.del(k));
    count += memKeys.length;

    // Clear Redis cache
    if (redis && redisReady) {
        try {
            const keys = await redis.keys(`farm:*${pattern}*`);
            if (keys.length > 0) {
                await redis.del(...keys);
                count += keys.length;
            }
        } catch (e) {
            console.error('[Cache] Redis invalidation error:', e);
        }
    }

    console.log(`[Cache] Invalidated ${count} keys matching "${pattern}"`);
    return count;
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
    redis: { connected: boolean; keys?: number };
}> => {
    const memStats = memoryCache.getStats();

    let redisKeys = 0;
    if (redis && redisReady) {
        try {
            const keys = await redis.keys('farm:*');
            redisKeys = keys.length;
        } catch (e) {
            // Ignore
        }
    }

    return {
        memory: {
            keys: memoryCache.keys().length,
            hits: memStats.hits,
            misses: memStats.misses,
        },
        redis: {
            connected: redisReady,
            keys: redisKeys,
        },
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
