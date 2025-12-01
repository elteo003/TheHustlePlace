import { NextResponse } from 'next/server'
import { redisCache } from '@/utils/redis-cache'
import { cache } from '@/utils/cache'

export async function GET() {
    try {
        const startTime = Date.now()
        
        // Check cache health
        const redisHealth = await redisCache.isHealthy()
        const cacheStats = await redisCache.getStats()
        
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
