import { type PlatformChart } from '@/lib/platform-top10'

export const FLIXPATROL_API = 'https://api.flixpatrol.com/v2'
export const FLIXPATROL_MOVIES = 2
export const FLIXPATROL_TV = 3

export type FlixPatrolChartEntry = {
    rank: number
    titleId: string
    name: string
    originalName?: string
    year?: number
}

type FetchLike = typeof fetch

function asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function asList(value: unknown): unknown[] {
    if (Array.isArray(value)) return value
    const rec = asRecord(value)
    if (!rec) return []
    for (const key of ['data', 'items', 'results', 'top10s', 'companies', 'titles']) {
        if (Array.isArray(rec[key])) return rec[key] as unknown[]
    }
    return []
}

function asNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
    return null
}

function asString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function flixpatrolAuthHeader(apiKey: string): string {
    return `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`
}

export function parseTitleName(payload: unknown): { name: string; originalName?: string; year?: number } | null {
    const rec = asRecord(payload)
    const nested = rec ? asRecord(rec.data) || rec : null
    if (!nested) return null
    const name = asString(nested.name) || asString(nested.title) || asString(nested.originalName)
    if (!name) return null
    const year = asNumber(nested.year) ?? asNumber(nested.premiere)
    return {
        name,
        originalName: asString(nested.originalName) || asString(nested.original_name) || undefined,
        year: year ?? undefined,
    }
}

export function parseCompanyId(payload: unknown, names: string[]): string | null {
    const needle = names.map((name) => name.toLowerCase())
    const rows = asList(payload)
    for (const row of rows) {
        const rec = asRecord(row)
        if (!rec) continue
        const label = (asString(rec.name) || asString(rec.title) || asString(rec.slug) || '').toLowerCase()
        if (!label) continue
        if (needle.some((name) => label === name.toLowerCase() || label.includes(name.toLowerCase()))) {
            return asString(rec.id) || asString(rec.slug)
        }
    }
    return null
}

export function parseChartEntries(payload: unknown): FlixPatrolChartEntry[] {
    const rows = asList(payload)
    const entries: FlixPatrolChartEntry[] = []
    for (const row of rows) {
        const rec = asRecord(row)
        if (!rec) continue
        const movieRec = asRecord(rec.movie) || asRecord(rec.title)
        const titleId =
            asString(rec.movie) ||
            asString(movieRec?.id) ||
            asString(rec.titleId) ||
            asString(rec.id)
        const parsedTitle = parseTitleName(movieRec) || parseTitleName(rec)
        const name = parsedTitle?.name || asString(rec.name) || asString(rec.title)
        if (!titleId && !name) continue
        entries.push({
            rank: asNumber(rec.ranking) ?? asNumber(rec.rank) ?? asNumber(rec.position) ?? entries.length + 1,
            titleId: titleId || name || '',
            name: name || '',
            originalName: parsedTitle?.originalName,
            year: parsedTitle?.year,
        })
    }
    return entries.sort((left, right) => left.rank - right.rank).slice(0, 10)
}

export function chartDates(now = new Date()): string[] {
    const key = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Rome',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(now)
    const [year, month, day] = key.split('-').map(Number)
    const dates: string[] = []
    for (const offset of [1, 2, 3, 0]) {
        const date = new Date(Date.UTC(year, month - 1, day - offset))
        dates.push(date.toISOString().slice(0, 10))
    }
    return dates
}

async function flixpatrolGet(
    path: string,
    apiKey: string,
    fetchImpl: FetchLike = fetch
): Promise<unknown | null> {
    const response = await fetchImpl(`${FLIXPATROL_API}${path}`, {
        headers: {
            Accept: 'application/json',
            Authorization: flixpatrolAuthHeader(apiKey),
        },
        cache: 'no-store',
    })
    if (!response.ok) {
        return null
    }
    try {
        return await response.json()
    } catch {
        return null
    }
}

const companyCache = new Map<string, string>()

export async function resolveCompanyId(
    platform: PlatformChart,
    apiKey: string,
    fetchImpl: FetchLike = fetch
): Promise<string | null> {
    const cached = companyCache.get(platform.slug)
    if (cached) return cached

    for (const name of platform.names) {
        const payload = await flixpatrolGet(
            `/companies?name[contains]=${encodeURIComponent(name)}`,
            apiKey,
            fetchImpl
        )
        const id = parseCompanyId(payload, platform.names)
        if (id) {
            companyCache.set(platform.slug, id)
            return id
        }
    }

    companyCache.set(platform.slug, platform.slug)
    return platform.slug
}

async function hydrateEntry(
    entry: FlixPatrolChartEntry,
    apiKey: string,
    fetchImpl: FetchLike
): Promise<FlixPatrolChartEntry> {
    if (entry.name || !entry.titleId) return entry
    const payload = await flixpatrolGet(`/titles/${encodeURIComponent(entry.titleId)}`, apiKey, fetchImpl)
    const title = parseTitleName(payload)
    if (!title) return entry
    return {
        ...entry,
        name: title.name,
        originalName: title.originalName || entry.originalName,
        year: title.year ?? entry.year,
    }
}

export async function fetchPlatformChart(
    platform: PlatformChart,
    kind: 'movie' | 'tv',
    apiKey: string,
    now = new Date(),
    fetchImpl: FetchLike = fetch
): Promise<{ date: string | null; entries: FlixPatrolChartEntry[] }> {
    const company = (await resolveCompanyId(platform, apiKey, fetchImpl)) || platform.slug
    const type = kind === 'movie' ? FLIXPATROL_MOVIES : FLIXPATROL_TV
    const countries = ['it', 'italy']

    for (const date of chartDates(now)) {
        for (const country of countries) {
            const params = new URLSearchParams()
            params.set('company', company)
            params.set('type', String(type))
            params.set('country', country)
            params.set('date[from]', date)
            params.set('date[to]', date)
            params.set('perPage', '10')
            const payload = await flixpatrolGet(`/top10s?${params.toString()}`, apiKey, fetchImpl)
            const parsed = parseChartEntries(payload)
            if (!parsed.length) continue
            const entries = await Promise.all(parsed.map((entry) => hydrateEntry(entry, apiKey, fetchImpl)))
            return { date, entries: entries.filter((entry) => entry.name) }
        }
    }

    return { date: null, entries: [] }
}
