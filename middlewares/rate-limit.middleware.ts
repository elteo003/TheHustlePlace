import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/utils/logger'

interface RateLimitConfig {
    windowMs: number // Time window in milliseconds
    maxRequests: number // Max requests per window
    message: string
}

class RateLimitService {
    private requests = new Map<string, { count: number; resetTime: number }>()
    private readonly DEFAULT_CONFIG: RateLimitConfig = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100, // 100 requests per 15 minutes
        message: 'Troppe richieste, riprova più tardi'
    }

    private getClientIP(request: NextRequest): string {
        const forwarded = request.headers.get('x-forwarded-for')
        const realIP = request.headers.get('x-real-ip')
        const remoteAddr = request.headers.get('x-vercel-forwarded-for')
        
        return forwarded?.split(',')[0] || realIP || remoteAddr || 'unknown'
    }

    private cleanup(): void {
        const now = Date.now()
        const keysToDelete: string[] = []
        
        this.requests.forEach((data, key) => {
            if (data.resetTime <= now) {
                keysToDelete.push(key)
            }
        })
        
        keysToDelete.forEach(key => {
            this.requests.delete(key)
        })
    }

    checkLimit(request: NextRequest, config: Partial<RateLimitConfig> = {}): {
        allowed: boolean
        remaining: number
        resetTime: number
    } {
        const finalConfig = { ...this.DEFAULT_CONFIG, ...config }
        const clientIP = this.getClientIP(request)
        const now = Date.now()
        
        // Cleanup expired entries
        this.cleanup()

        const clientData = this.requests.get(clientIP)
        
        if (!clientData || clientData.resetTime <= now) {
            // New window or expired
            this.requests.set(clientIP, {
                count: 1,
                resetTime: now + finalConfig.windowMs
            })
            
            return {
                allowed: true,
                remaining: finalConfig.maxRequests - 1,
                resetTime: now + finalConfig.windowMs
            }
        }

        if (clientData.count >= finalConfig.maxRequests) {
            logger.warn('Rate limit exceeded', { 
                clientIP, 
                count: clientData.count,
                maxRequests: finalConfig.maxRequests 
            })
            
            return {
                allowed: false,
                remaining: 0,
                resetTime: clientData.resetTime
            }
        }

        // Increment counter
        clientData.count++
        this.requests.set(clientIP, clientData)

        return {
            allowed: true,
            remaining: finalConfig.maxRequests - clientData.count,
            resetTime: clientData.resetTime
        }
    }
}

const rateLimitService = new RateLimitService()

export function withRateLimit(
    handler: (req: NextRequest) => Promise<NextResponse>,
    config?: Partial<RateLimitConfig>
) {
    return async (req: NextRequest): Promise<NextResponse> => {
        const limitCheck = rateLimitService.checkLimit(req, config)
        
        if (!limitCheck.allowed) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: config?.message || 'Troppe richieste, riprova più tardi',
                    retryAfter: Math.ceil((limitCheck.resetTime - Date.now()) / 1000)
                },
                { 
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': config?.maxRequests?.toString() || '100',
                        'X-RateLimit-Remaining': limitCheck.remaining.toString(),
                        'X-RateLimit-Reset': new Date(limitCheck.resetTime).toISOString(),
                        'Retry-After': Math.ceil((limitCheck.resetTime - Date.now()) / 1000).toString()
                    }
                }
            )
        }

        const response = await handler(req)
        
        // Add rate limit headers to successful responses
        response.headers.set('X-RateLimit-Limit', config?.maxRequests?.toString() || '100')
        response.headers.set('X-RateLimit-Remaining', limitCheck.remaining.toString())
        response.headers.set('X-RateLimit-Reset', new Date(limitCheck.resetTime).toISOString())
        
        return response
    }
}

// Cleanup every 5 minutes
if (typeof window === 'undefined') {
    setInterval(() => {
        rateLimitService['cleanup']()
    }, 5 * 60 * 1000)
}
