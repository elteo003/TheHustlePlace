import { NextResponse } from 'next/server'
import { redisCache } from '@/utils/redis-cache'
import { cache } from '@/utils/cache'

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), ms)
        promise.then(
            (value) => {
                clearTimeout(timer)
                resolve(value)
            },
            (error) => {
                clearTimeout(timer)
                reject(error)
            }
        )
    })
}

export async function GET() {
    try {
        const startTime = Date.now()
        
        // Check cache health
        const redisHealth = await withTimeout(redisCache.isHealthy(), 1500).catch(() => false)
        const cacheStats = await withTimeout(redisCache.getStats(), 1500).catch(() => ({
            type: 'memory' as const,
            size: 0,
        }))
        
        // Check memory cache stats
        const memoryCacheSize = cache['memoryCache']?.size || 0
        
        const responseTime = Date.now() - startTime
        
        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            responseTime: `${responseTime}ms`,
            cache: {
                redis: {
                    available: redisHealth,
                    type: cacheStats.type,
                    size: cacheStats.size,
                    disabledReason: redisCache.getDisabledReason()
                },
                memory: {
                    size: memoryCacheSize
                }
            },
            environment: {
                nodeEnv: process.env.NODE_ENV,
                hasTmdbKey: !!process.env.TMDB_API_KEY,
                hasRedisConfig: !!(process.env.REDIS_HOST || process.env.REDIS_URL)
            }
        })
    } catch (error) {
        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
