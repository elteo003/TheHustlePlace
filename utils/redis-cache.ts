import { logger } from './logger'

interface CacheOptions {
    ttl?: number // Time to live in seconds, default 1 hour
}

interface RedisConfig {
    host: string
    port: number
    password?: string
    db?: number
}

class RedisCacheService {
    private redis: any = null
    private readonly DEFAULT_TTL = 3600 // 1 hour
    private readonly fallbackCache = new Map<string, { value: any; expires: number }>()
    private isRedisAvailable = false

    constructor() {
        this.initializeRedis()
    }

    private async initializeRedis(): Promise<void> {
        try {
            // Try to import redis (optional dependency)
            const redis = await import('redis')
            
            const config: RedisConfig = {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD,
                db: parseInt(process.env.REDIS_DB || '0')
            }

            this.redis = redis.createClient({
                socket: {
                    host: config.host,
                    port: config.port
                },
                password: config.password,
                database: config.db
            })

            this.redis.on('error', (err: Error) => {
                logger.error('Redis connection error', { error: err.message })
                this.isRedisAvailable = false
            })

            this.redis.on('connect', () => {
                logger.info('Redis connected successfully')
                this.isRedisAvailable = true
            })

            await this.redis.connect()
        } catch (error) {
            logger.warn('Redis not available, using in-memory cache', { error })
            this.isRedisAvailable = false
        }
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            if (this.isRedisAvailable && this.redis) {
                const value = await this.redis.get(key)
                return value ? JSON.parse(value) : null
            } else {
                // Fallback to in-memory cache
                const memoryItem = this.fallbackCache.get(key)
                if (memoryItem && memoryItem.expires > Date.now()) {
                    return memoryItem.value
                }

                // Remove expired item
                if (memoryItem && memoryItem.expires <= Date.now()) {
                    this.fallbackCache.delete(key)
                }

                return null
            }
        } catch (error) {
            logger.error('Cache get error', { key, error })
            return null
        }
    }

    async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
        try {
            const ttl = options.ttl || this.DEFAULT_TTL

            if (this.isRedisAvailable && this.redis) {
                await this.redis.setEx(key, ttl, JSON.stringify(value))
            } else {
                // Fallback to in-memory cache
                const expiresAt = Date.now() + ttl * 1000
                this.fallbackCache.set(key, {
                    value,
                    expires: expiresAt
                })
            }
        } catch (error) {
            logger.error('Cache set error', { key, error })
        }
    }

    async delete(key: string): Promise<void> {
        try {
            if (this.isRedisAvailable && this.redis) {
                await this.redis.del(key)
            } else {
                this.fallbackCache.delete(key)
            }
        } catch (error) {
            logger.error('Cache delete error', { key, error })
        }
    }

    async clear(): Promise<void> {
        try {
            if (this.isRedisAvailable && this.redis) {
                await this.redis.flushDb()
            } else {
                this.fallbackCache.clear()
            }
        } catch (error) {
            logger.error('Cache clear error', { error })
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

    // Health check
    async isHealthy(): Promise<boolean> {
        try {
            if (this.isRedisAvailable && this.redis) {
                await this.redis.ping()
                return true
            }
            return false
        } catch (error) {
            return false
        }
    }

    // Get cache statistics
    async getStats(): Promise<{ type: 'redis' | 'memory'; size: number }> {
        try {
            if (this.isRedisAvailable && this.redis) {
                const info = await this.redis.info('memory')
                return { type: 'redis', size: this.fallbackCache.size }
            } else {
                return { type: 'memory', size: this.fallbackCache.size }
            }
        } catch (error) {
            return { type: 'memory', size: this.fallbackCache.size }
        }
    }
}

export const redisCache = new RedisCacheService()

// Cleanup expired cache entries every hour (for fallback cache)
if (typeof window === 'undefined') {
    setInterval(() => {
        const now = Date.now()
        const keysToDelete: string[] = []
        
        redisCache['fallbackCache'].forEach((item, key) => {
            if (item.expires <= now) {
                keysToDelete.push(key)
            }
        })
        
        keysToDelete.forEach(key => {
            redisCache['fallbackCache'].delete(key)
        })
    }, 3600000) // 1 hour
}
