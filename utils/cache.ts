import { logger } from './logger'

interface CacheOptions {
    ttl?: number // Time to live in seconds, default 1 hour
}

class CacheService {
    private memoryCache = new Map<string, { value: any; expires: number }>()
    private readonly DEFAULT_TTL = 3600 // 1 hour

    // Memory cache only (no database)
    async get<T>(key: string): Promise<T | null> {
        try {
            const memoryItem = this.memoryCache.get(key)
            if (memoryItem && memoryItem.expires > Date.now()) {
                return memoryItem.value
            }

            // Remove expired item
            if (memoryItem && memoryItem.expires <= Date.now()) {
                this.memoryCache.delete(key)
            }

            return null
        } catch (error) {
            logger.error('Cache get error', { key, error })
            return null
        }
    }

    async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
        try {
            const ttl = options.ttl || this.DEFAULT_TTL
            const expiresAt = Date.now() + ttl * 1000

            // Store in memory cache only
            this.memoryCache.set(key, {
                value,
                expires: expiresAt
            })
        } catch (error) {
            logger.error('Cache set error', { key, error })
        }
    }

    async delete(key: string): Promise<void> {
        try {
            this.memoryCache.delete(key)
        } catch (error) {
            logger.error('Cache delete error', { key, error })
        }
    }

    async clear(): Promise<void> {
        try {
            this.memoryCache.clear()
        } catch (error) {
            logger.error('Cache clear error', { error })
        }
    }

    // Clean expired entries
    async cleanup(): Promise<void> {
        try {
            const now = Date.now()
            for (const [key, item] of this.memoryCache.entries()) {
                if (item.expires <= now) {
                    this.memoryCache.delete(key)
                }
            }
        } catch (error) {
            logger.error('Cache cleanup error', { error })
        }
    }

    // Generate cache key for API responses
    generateKey(prefix: string, params: Record<string, any>): string {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}:${params[key]}`)
            .join('|')

        return `${prefix}:${sortedParams}`
    }
}

export const cache = new CacheService()

// Cleanup expired cache entries every hour
if (typeof window === 'undefined') {
    setInterval(() => {
        cache.cleanup()
    }, 3600000) // 1 hour
}
