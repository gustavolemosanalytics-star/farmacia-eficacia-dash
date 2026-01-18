import NodeCache from 'node-cache';
import Redis from 'ioredis';

// Fallback memory cache (5 minutes)
const memoryCache = new NodeCache({ stdTTL: 300 });

// Redis client - Singleton in memory
let redis: Redis | null = null;

if (process.env.REDIS_URL) {
    console.log('Initializing Redis connection...');
    redis = new Redis(process.env.REDIS_URL);

    redis.on('error', (err) => {
        console.error('Redis Client Error', err);
    });

    redis.on('connect', () => {
        console.log('Redis Client Connected');
    });
}

export const getCachedData = async <T>(key: string): Promise<T | undefined> => {
    if (redis) {
        try {
            const data = await redis.get(key);
            if (data) {
                // Try parse JSON, if fails return string (unlikely for our use case but safe)
                try {
                    return JSON.parse(data) as T;
                } catch {
                    return data as unknown as T;
                }
            }
            return undefined;
        } catch (e) {
            console.error('Redis get error, falling back to memory:', e);
            // Optional: fallback to memory cache if Redis fails?
            // For now, let's just return undefined so we fetch fresh data
            return undefined;
        }
    }
    // Synchronous memory cache treated as async for consistency
    return memoryCache.get<T>(key);
};

export const setCachedData = async <T>(key: string, data: T, ttlSeconds: number = 300): Promise<void> => {
    if (redis) {
        try {
            const stringValue = JSON.stringify(data);
            await redis.set(key, stringValue, 'EX', ttlSeconds);
            return;
        } catch (e) {
            console.error('Redis set error, using memory:', e);
        }
    }
    memoryCache.set(key, data, ttlSeconds);
};
