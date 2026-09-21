import { TOP10_SIZE } from '@/lib/catalog-types'
import { isoDateOnly, mapTmdbItemToTop10, type TmdbRailItem } from '@/lib/catalog-rails'
import { itemReleaseDate, popNorm, railItemKey } from '@/lib/personal-rails'
export const STREAMING_PROVIDERS_IT = [8, 119, 337, 350, 531, 39, 384]

export type MomentSource = 'trendingDay' | 'trendingWeek' | 'streaming' | 'cinema'

export type MomentCandidate = Top10Content & {
    sources: Set<MomentSource>
}

export function streamingProviderPipe(): string {
    return STREAMING_PROVIDERS_IT.join('|')
}

export function addDaysIso(now: Date, days: number): string {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    date.setUTCDate(date.getUTCDate() + days)
    return isoDateOnly(date)
}

export function yearsAgoFrom(now: Date, years: number): string {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    date.setUTCFullYear(date.getUTCFullYear() - years)
    return isoDateOnly(date)
}

export function isTooFarInTheFuture(item: Top10Content, now: Date, graceDays = 7): boolean {
    const date = itemReleaseDate(item)
    return Boolean(date) && date > addDaysIso(now, graceDays)
}

export function isMomentEligible(item: Top10Content, now: Date, cinema = false): boolean {
    const date = itemReleaseDate(item)
    if (!date || isTooFarInTheFuture(item, now)) {
        return false
    }
    if (cinema && item.type === 'movie') {
        return date >= yearsAgoFrom(now, 1)
    }
    const cutoff = item.type === 'tv' ? yearsAgoFrom(now, 10) : yearsAgoFrom(now, 3)
    return date >= cutoff
}

export function mergeMomentPools(pools: Record<MomentSource, Top10Content[]>): MomentCandidate[] {
    const merged = new Map<string, MomentCandidate>()
    for (const source of Object.keys(pools) as MomentSource[]) {
        for (const item of pools[source]) {
            const key = railItemKey(item.type, item.id)
            const existing = merged.get(key)
            if (existing) {
                existing.sources.add(source)
                continue
            }
            merged.set(key, { ...item, sources: new Set([source]) })
        }
    }
    return Array.from(merged.values())
}

export function scoreMoment(item: MomentCandidate, maxPop: number, now: Date): number {
    const date = itemReleaseDate(item)
    const ageYears = date ? Math.max(0, (now.getTime() - Date.parse(date)) / (365.25 * 86_400_000)) : 5
    const recency = Math.max(0, Math.min(1, 1 - ageYears / 4))
    return (
        0.28 * popNorm(item, maxPop) +
        0.24 * (item.sources.has('trendingDay') ? 1 : 0) +
        0.14 * (item.sources.has('trendingWeek') ? 1 : 0) +
        0.18 * (item.sources.has('streaming') ? 1 : 0) +
        0.16 * (item.sources.has('cinema') ? 1 : 0) +
        0.12 * recency
    )
}

export function composeMomentTop10(
    pools: Record<MomentSource, Top10Content[]>,
    now = new Date(),
    limit = TOP10_SIZE
): Top10Content[] {
    const eligible = mergeMomentPools(pools).filter((item) =>
        isMomentEligible(item, now, item.sources.has('cinema'))
    )
    const maxPop = Math.max(1, ...eligible.map((item) => item.popularity || 0))
    const ranked = [...eligible].sort(
        (left, right) => scoreMoment(right, maxPop, now) - scoreMoment(left, maxPop, now)
    )

    const picked: Top10Content[] = []
    let movies = 0
    let shows = 0

    for (const item of ranked) {
        if (picked.length >= limit) {
            break
        }
        if (item.type === 'movie' && movies >= 7) {
            continue
        }
        if (item.type === 'tv' && shows >= 7) {
            continue
        }
        picked.push(item)
        if (item.type === 'tv') {
            shows += 1
        } else {
            movies += 1
        }
    }

    if (picked.length < limit) {
        for (const item of ranked) {
            if (picked.length >= limit) {
                break
            }
            if (picked.some((entry) => railItemKey(entry.type, entry.id) === railItemKey(item.type, item.id))) {
                continue
            }
            picked.push(item)
        }
    }

    return picked.slice(0, limit).map(({ sources: _sources, ...item }) => item as Top10Content)
}

export function mapTrendingList(items: TmdbRailItem[] | undefined): Top10Content[] {
    const result: Top10Content[] = []
    const seen = new Set<string>()
    for (const raw of items || []) {
        if (raw.media_type !== 'movie' && raw.media_type !== 'tv') {
            continue
        }
        const mapped = mapTmdbItemToTop10(raw)
        if (!mapped) {
            continue
        }
        const key = railItemKey(mapped.type, mapped.id)
        if (seen.has(key)) {
            continue
        }
        seen.add(key)
        result.push(mapped)
    }
    return result
}
