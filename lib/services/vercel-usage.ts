import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { systemDomainRouting } from '@/lib/db/schema'

export interface VercelUsageMetrics {
    bandwidth?: { value: number; limit: number }
    serverlessFunctionExecution?: { value: number; limit: number }
    edgeMiddlewareInvocations?: { value: number; limit: number }
}

export interface UsageCheckResult {
    success: boolean
    maxUsagePercent: number
    activeDomain: string
    fplaceUsage: {
        bandwidthPercent: number
        serverlessPercent: number
        edgePercent: number
    }
    switched: boolean
    error?: string
}

export const PRIMARY_DOMAIN = 'the-fplace.vercel.app'
export const SECONDARY_DOMAIN = 'the-hustle-place.vercel.app'
export const DEFAULT_THRESHOLD_PERCENT = 75.0

// In-memory cache for Edge Middleware & API lookups (TTL 60s)
let memoryActiveDomain = PRIMARY_DOMAIN
let lastDomainFetch = 0
const CACHE_TTL_MS = 60_000

export function calculateMaxUsagePercent(metrics: VercelUsageMetrics): {
    maxPercent: number
    bandwidthPct: number
    serverlessPct: number
    edgePct: number
} {
    const bandwidthPct =
        metrics.bandwidth && metrics.bandwidth.limit > 0
            ? (metrics.bandwidth.value / metrics.bandwidth.limit) * 100
            : 0

    const serverlessPct =
        metrics.serverlessFunctionExecution && metrics.serverlessFunctionExecution.limit > 0
            ? (metrics.serverlessFunctionExecution.value / metrics.serverlessFunctionExecution.limit) * 100
            : 0

    const edgePct =
        metrics.edgeMiddlewareInvocations && metrics.edgeMiddlewareInvocations.limit > 0
            ? (metrics.edgeMiddlewareInvocations.value / metrics.edgeMiddlewareInvocations.limit) * 100
            : 0

    const maxPercent = Math.max(bandwidthPct, serverlessPct, edgePct)
    return { maxPercent, bandwidthPct, serverlessPct, edgePct }
}

export async function fetchVercelUsage(options?: {
    token?: string
    projectId?: string
    teamId?: string
}): Promise<VercelUsageMetrics> {
    const token = options?.token || process.env.VERCEL_API_TOKEN
    const projectId = options?.projectId || process.env.VERCEL_FPLACE_PROJECT_ID
    const teamId = options?.teamId || process.env.VERCEL_TEAM_ID

    if (!token || !projectId) {
        throw new Error('Credenziali Vercel non configurate (VERCEL_API_TOKEN o VERCEL_FPLACE_PROJECT_ID assente)')
    }

    const now = new Date()
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
    const to = now.toISOString()

    const url = new URL('https://api.vercel.com/v2/usage')
    url.searchParams.set('projectId', projectId)
    url.searchParams.set('from', from)
    url.searchParams.set('to', to)
    if (teamId) {
        url.searchParams.set('teamId', teamId)
    }

    const response = await fetch(url.toString(), {
        headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': 'TheHustlePlace-DomainWatcher/1.0',
        },
    })

    if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Errore API Vercel HTTP ${response.status}: ${errText}`)
    }

    const json = await response.json()
    return json as VercelUsageMetrics
}

export async function getActiveDomain(): Promise<string> {
    const now = Date.now()
    if (now - lastDomainFetch < CACHE_TTL_MS) {
        return memoryActiveDomain
    }

    try {
        const db = getDb()
        if (db) {
            const [record] = await db
                .select()
                .from(systemDomainRouting)
                .where(eq(systemDomainRouting.id, 'production'))
                .limit(1)

            if (record && record.activeDomain) {
                memoryActiveDomain = record.activeDomain
                lastDomainFetch = now
                return memoryActiveDomain
            }
        }
    } catch (err) {
        console.warn('[domain-routing] Fallback cache errore lettura db:', err)
    }

    return memoryActiveDomain
}

export async function checkAndUpdateVercelUsage(): Promise<UsageCheckResult> {
    const db = getDb()
    let autoFailoverEnabled = true
    let threshold = DEFAULT_THRESHOLD_PERCENT
    let previousActiveDomain = PRIMARY_DOMAIN

    if (db) {
        try {
            const [record] = await db
                .select()
                .from(systemDomainRouting)
                .where(eq(systemDomainRouting.id, 'production'))
                .limit(1)

            if (record) {
                autoFailoverEnabled = record.autoFailoverEnabled
                threshold = Number(record.thresholdPercent) || DEFAULT_THRESHOLD_PERCENT
                previousActiveDomain = record.activeDomain || PRIMARY_DOMAIN
            }
        } catch (dbErr) {
            console.warn('[domain-routing] Impossibile recuperare record iniziale:', dbErr)
        }
    }

    const metrics = await fetchVercelUsage()
    const { maxPercent, bandwidthPct, serverlessPct, edgePct } = calculateMaxUsagePercent(metrics)

    let nextActiveDomain = previousActiveDomain
    if (autoFailoverEnabled) {
        if (maxPercent >= threshold) {
            nextActiveDomain = SECONDARY_DOMAIN
        } else {
            nextActiveDomain = PRIMARY_DOMAIN
        }
    }

    const switched = nextActiveDomain !== previousActiveDomain

    if (db) {
        try {
            await db
                .insert(systemDomainRouting)
                .values({
                    id: 'production',
                    primaryDomain: PRIMARY_DOMAIN,
                    secondaryDomain: SECONDARY_DOMAIN,
                    activeDomain: nextActiveDomain,
                    fplaceUsagePercent: maxPercent.toFixed(2),
                    thresholdPercent: threshold.toFixed(2),
                    autoFailoverEnabled,
                    lastCheckedAt: new Date(),
                    updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                    target: systemDomainRouting.id,
                    set: {
                        activeDomain: nextActiveDomain,
                        fplaceUsagePercent: maxPercent.toFixed(2),
                        lastCheckedAt: new Date(),
                        updatedAt: new Date(),
                    },
                })
        } catch (updateErr) {
            console.error('[domain-routing] Errore salvataggio routing su DB:', updateErr)
        }
    }

    memoryActiveDomain = nextActiveDomain
    lastDomainFetch = Date.now()

    return {
        success: true,
        maxUsagePercent: Number(maxPercent.toFixed(2)),
        activeDomain: nextActiveDomain,
        fplaceUsage: {
            bandwidthPercent: Number(bandwidthPct.toFixed(2)),
            serverlessPercent: Number(serverlessPct.toFixed(2)),
            edgePercent: Number(edgePct.toFixed(2)),
        },
        switched,
    }
}
