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

export async function getHomeRelayConfig(): Promise<HomeRelayConfig | null> {
    if (process.env.VIXSRC_RELAY_URL && process.env.VIXSRC_RELAY_TOKEN) {
        const url = process.env.VIXSRC_RELAY_URL.replace(/\/$/, '')
        if (isAllowedRelayPublicUrl(url)) {
            return { url, token: process.env.VIXSRC_RELAY_TOKEN }
        }
    }
    const sql = relaySql()
    if (!sql) return null
    await ensureTable(sql)
    const rows = await sql<{ url: string; token: string }[]>`
        select url, token from vixsrc_home_relay where id = 1
    `
    const row = rows[0]
    if (!row || !isAllowedRelayPublicUrl(row.url)) return null
    return { url: row.url.replace(/\/$/, ''), token: row.token }
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
