import postgres from 'postgres'
import { isAllowedRelayPublicUrl } from '@/lib/vixsrc-hls'

export interface HomeRelayConfig {
    url: string
    token: string
}

const globalForRelay = globalThis as unknown as {
    relaySql: ReturnType<typeof postgres> | undefined
}

function relaySql() {
    const url = process.env.DATABASE_URL
    if (!url) return null
    if (!globalForRelay.relaySql) {
        globalForRelay.relaySql = postgres(url, { prepare: false, max: 1, ssl: 'require' })
    }
    return globalForRelay.relaySql
}

async function ensureTable(sql: ReturnType<typeof postgres>) {
    await sql`
        create table if not exists vixsrc_home_relay (
            id integer primary key,
            url text not null,
            token text not null,
            updated_at timestamptz not null default now()
        )
    `
}

async function probeAndRenewRelay(
    sql: ReturnType<typeof postgres>,
    url: string,
    token: string
): Promise<boolean> {
    try {
        const response = await fetch(`${url}/health`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(1200),
        })
        if (!response.ok) return false
        const json = (await response.json().catch(() => null)) as { ok?: boolean } | null
        if (json && json.ok) {
            await sql`
                update vixsrc_home_relay
                set updated_at = now()
                where id = 1 and token = ${token}
            `
            return true
        }
        return false
    } catch {
        return false
    }
}

export async function getHomeRelayConfig(): Promise<HomeRelayConfig | null> {
    const sql = relaySql()
    if (sql) {
        await ensureTable(sql)
        // 1. Cerca un record recente (< 4 ore)
        const freshRows = await sql<{ url: string; token: string }[]>`
            select url, token from vixsrc_home_relay where id = 1 and updated_at > (now() - interval '4 hours')
        `
        const fresh = freshRows[0]
        if (fresh?.url && fresh?.token && isAllowedRelayPublicUrl(fresh.url.replace(/\/$/, ''))) {
            return { url: fresh.url.replace(/\/$/, ''), token: fresh.token }
        }

        // 2. Se scaduto (> 4 ore ma entro 7 giorni), esegui un Active Probe di auto-guarigione
        const candidateRows = await sql<{ url: string; token: string }[]>`
            select url, token from vixsrc_home_relay where id = 1 and updated_at > (now() - interval '7 days')
        `
        const candidate = candidateRows[0]
        if (candidate?.url && candidate?.token && isAllowedRelayPublicUrl(candidate.url.replace(/\/$/, ''))) {
            const normalizedUrl = candidate.url.replace(/\/$/, '')
            const isAlive = await probeAndRenewRelay(sql, normalizedUrl, candidate.token)
            if (isAlive) {
                return { url: normalizedUrl, token: candidate.token }
            }
        }
    }

    if (process.env.VIXSRC_RELAY_URL && process.env.VIXSRC_RELAY_TOKEN) {
        const url = process.env.VIXSRC_RELAY_URL.replace(/\/$/, '')
        if (url.includes('trycloudflare.com')) return null
        if (isAllowedRelayPublicUrl(url)) {
            return { url, token: process.env.VIXSRC_RELAY_TOKEN }
        }
    }
    return null
}

export async function getAnnouncedRelayUrl(): Promise<string | null> {
    const config = await getHomeRelayConfig()
    return config?.url ?? null
}

export async function saveHomeRelayUrl(url: string, token: string): Promise<boolean> {
    const normalized = url.replace(/\/$/, '')
    if (!isAllowedRelayPublicUrl(normalized) || !token) return false
    const sql = relaySql()
    if (!sql) return false
    await ensureTable(sql)
    const current = await sql<{ token: string }[]>`
        select token from vixsrc_home_relay where id = 1
    `
    if (current[0] && current[0].token !== token) return false
    await sql`
        insert into vixsrc_home_relay (id, url, token, updated_at)
        values (1, ${normalized}, ${token}, now())
        on conflict (id) do update set url = excluded.url, updated_at = now()
        where vixsrc_home_relay.token = ${token}
    `
    return true
}
