import NodeCache from 'node-cache';

// Cache for 5 minutes (300 seconds)
const cache = new NodeCache({ stdTTL: 300 });

export const getCachedData = <T>(key: string): T | undefined => {
    return cache.get<T>(key);
};

export const setCachedData = <T>(key: string, data: T): void => {
    cache.set(key, data);
};
