import { Top10Content } from '@/types'
import { isoDateOnly } from '@/lib/catalog-rails'
import { romeDayKey } from '@/lib/platform-top10'

export const PERSONAL_RAIL_SIZE = 24
export const PERSONAL_OVERFETCH = 50
export const AFFINITY_MIN_ITEMS = 8
export const TASTE_MIN_HISTORY = 3
export const TASTE_WINDOW = 8
export const TASTE_TAU_DAYS = 21
/** Quota del punteggio «scelti per te» decisa dal giorno di Roma. Il resto resta gusto. */
export const PICKS_DAILY_WEIGHT = 0.18

export type HistorySeed = {
    id: number
    type: 'movie' | 'tv'
    progress: number
    watchedAt: number
}

export type TitleFeatures = {
    id: number
    type: 'movie' | 'tv'
    genreIds: number[]
    keywordIds: number[]
    title?: string
}

export type AffinityFlags = {
    seed: number
    keyword: boolean
}

export type TasteProfile = {
    personalized: boolean
    topGenres: number[]
    topKeywords: number[]
    seeds: HistorySeed[]
    seedTitle?: string
    watched: Set<string>
    completed: Set<string>
}

export type PersonalRails = {
    personalized: boolean
    picks: Top10Content[]
    affinity: Top10Content[]
    treasures: Top10Content[]
    seedTitle?: string
    topGenres?: number[]
}

export type PersonalCandidatePools = {
    picks: Top10Content[]
    picksRelaxed?: Top10Content[]
    affinity: Top10Content[]
    affinityFlags?: Map<string, AffinityFlags>
    treasures: Top10Content[]
    treasuresRelaxed?: Top10Content[]
}

const MOVIE_TO_TV_GENRE: Record<number, number> = {
    28: 10759,
    12: 10759,
    16: 16,
    35: 35,
    80: 80,
    99: 99,
    18: 18,
    10751: 10751,
    14: 10765,
    878: 10765,
    53: 80,
    9648: 9648,
    10752: 10768,
    37: 37,
    10749: 35,
    10759: 10759,
    10765: 10765,
    10768: 10768,
}

const TV_TO_MOVIE_GENRE: Record<number, number> = {
    10759: 28,
    10765: 878,
    10768: 10752,
    10762: 10751,
    16: 16,
    35: 35,
    80: 80,
    99: 99,
    18: 18,
    10751: 10751,
    9648: 9648,
    37: 37,
    10766: 18,
    10767: 35,
    10763: 99,
    10764: 99,
}

export function railItemKey(type: string, id: number): string {
    return `${type}:${id}`
}

export function historyWeight(
    entry: { progress: number; watchedAt: number },
    now = Date.now(),
    tauDays = TASTE_TAU_DAYS
): number {
    const deltaDays = Math.max(0, (now - entry.watchedAt) / 86_400_000)
    const recency = Math.exp(-deltaDays / tauDays)
    const completion = 0.35 + 0.65 * Math.min(1, Math.max(0, entry.progress / 100))
    return recency * completion
}

function topKeys(scores: Map<number, number>, limit: number): number[] {
    return Array.from(scores.entries())
        .sort((left, right) => right[1] - left[1] || left[0] - right[0])
        .slice(0, limit)
        .map(([id]) => id)
}

export function buildTasteProfile(
    history: HistorySeed[],
    features: TitleFeatures[],
    now = Date.now()
): TasteProfile {
    const featureMap = new Map(features.map((item) => [railItemKey(item.type, item.id), item]))
    const recent = [...history]
        .filter((item) => Number.isFinite(item.id) && item.id > 0)
        .sort((left, right) => right.watchedAt - left.watchedAt)
        .slice(0, TASTE_WINDOW)

    const genreScores = new Map<number, number>()
    const keywordScores = new Map<number, number>()
    const seedCandidates: Array<{ seed: HistorySeed; weight: number }> = []
    const watched = new Set<string>()
    const completed = new Set<string>()

    for (const entry of recent) {
        const key = railItemKey(entry.type, entry.id)
        const weight = historyWeight(entry, now)
        watched.add(key)
        if (entry.progress >= 90) {
            completed.add(key)
        }
        seedCandidates.push({ seed: entry, weight })

        const feature = featureMap.get(key)
        if (!feature) {
            continue
        }
        for (const genreId of feature.genreIds) {
            genreScores.set(genreId, (genreScores.get(genreId) || 0) + weight)
        }
        for (const keywordId of feature.keywordIds) {
            keywordScores.set(keywordId, (keywordScores.get(keywordId) || 0) + weight)
        }
    }

    const topGenres = topKeys(genreScores, 2)
    const seeds = seedCandidates
        .sort((left, right) => right.weight - left.weight)
        .slice(0, 3)
        .map((item) => item.seed)
    const topSeed = seeds[0]
    const seedTitle = topSeed
        ? featureMap.get(railItemKey(topSeed.type, topSeed.id))?.title
        : undefined

    return {
        personalized: recent.length >= TASTE_MIN_HISTORY && topGenres.length > 0,
        topGenres,
        topKeywords: topKeys(keywordScores, 3),
        seeds,
        seedTitle,
        watched,
        completed,
    }
}

export function toDiscoverGenres(genreIds: number[], target: 'movie' | 'tv'): number[] {
    const mapped = new Set<number>()
    for (const id of genreIds) {
        const next = target === 'tv' ? MOVIE_TO_TV_GENRE[id] ?? id : TV_TO_MOVIE_GENRE[id] ?? id
        if (Number.isFinite(next) && next > 0) {
            mapped.add(next)
        }
    }
    return Array.from(mapped)
}

export function genrePipe(genreIds: number[]): string {
    return genreIds.join('|')
}

export function yearsAgoIso(years: number, now = new Date()): string {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    date.setUTCFullYear(date.getUTCFullYear() - years)
    return isoDateOnly(date)
}

export function monthsAgoIso(months: number, now = new Date()): string {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    date.setUTCMonth(date.getUTCMonth() - months)
    return isoDateOnly(date)
}

export function itemReleaseDate(item: Top10Content): string {
    return item.type === 'tv'
        ? item.first_air_date || item.release_date || ''
        : item.release_date || item.first_air_date || ''
}

export function simTaste(item: Top10Content, topGenres: number[]): number {
    if (topGenres.length === 0) {
        return 0
    }
    const genres = item.genre_ids || []
    if (genres.length === 0) {
        return 0
    }
    const overlap = genres.filter((id) => topGenres.includes(id)).length
    return overlap / genres.length
}

export function popNorm(item: Top10Content, maxPop: number): number {
    return Math.log(1 + (item.popularity || 0)) / Math.log(1 + Math.max(maxPop, 1))
}

export function qualityNorm(item: Top10Content, maxVotes: number): number {
    const votes = Math.log(1 + (item.vote_count || 0)) / Math.log(1 + Math.max(maxVotes, 1))
    return ((item.vote_average || 0) / 10) * votes
}

export function newness(item: Top10Content, now: Date, horizonYears = 5): number {
    const date = itemReleaseDate(item)
    if (!date) {
        return 0
    }
    const released = Date.parse(date)
    if (!Number.isFinite(released)) {
        return 0
    }
    const ageYears = Math.max(0, (now.getTime() - released) / (365.25 * 86_400_000))
    return Math.max(0, Math.min(1, 1 - ageYears / horizonYears))
}

export function genreJaccard(left: number[] = [], right: number[] = []): number {
    if (left.length === 0 && right.length === 0) {
        return 0
    }
    const rightSet = new Set(right)
    const intersection = left.filter((id) => rightSet.has(id)).length
    const union = new Set([...left, ...right]).size
    return union === 0 ? 0 : intersection / union
}

export function poolStats(items: Top10Content[]): { maxPop: number; maxVotes: number } {
    let maxPop = 1
    let maxVotes = 1
    for (const item of items) {
        maxPop = Math.max(maxPop, item.popularity || 0)
        maxVotes = Math.max(maxVotes, item.vote_count || 0)
    }
    return { maxPop, maxVotes }
}

export function scorePicks(item: Top10Content, topGenres: number[], maxPop: number, now: Date): number {
    return 0.35 * simTaste(item, topGenres) + 0.45 * popNorm(item, maxPop) + 0.2 * newness(item, now)
}

/** Unità stabile in [0, 1) per un titolo in un dato giorno. Stesso giorno, stesso valore. */
export function dailyRotationUnit(key: string, day: string): number {
    let hash = 2166136261
    const input = `${day}:${key}`
    for (let index = 0; index < input.length; index += 1) {
        hash ^= input.charCodeAt(index)
        hash = Math.imul(hash, 16777619)
    }
    return (hash >>> 0) / 4294967296
}

export function scorePicksForDay(
    item: Top10Content,
    topGenres: number[],
    maxPop: number,
    now: Date,
    day = romeDayKey(now)
): number {
    const taste = scorePicks(item, topGenres, maxPop, now)
    const spin = dailyRotationUnit(railItemKey(item.type, item.id), day)
    return (1 - PICKS_DAILY_WEIGHT) * taste + PICKS_DAILY_WEIGHT * spin
}

export function scoreAffinity(
    item: Top10Content,
    topGenres: number[],
    flags: AffinityFlags | undefined
): number {
    return 0.5 * (flags?.seed ?? 0) + 0.3 * (flags?.keyword ? 1 : 0) + 0.2 * simTaste(item, topGenres)
}

export function scoreTreasures(
    item: Top10Content,
    topGenres: number[],
    maxPop: number,
    maxVotes: number
): number {
    return 0.4 * qualityNorm(item, maxVotes) + 0.35 * (1 - popNorm(item, maxPop)) + 0.25 * simTaste(item, topGenres)
}

export function isRecentHit(item: Top10Content, now: Date, maxPop: number): boolean {
    const date = itemReleaseDate(item)
    if (!date) {
        return false
    }
    return date >= monthsAgoIso(18, now) && popNorm(item, maxPop) >= 0.65
}

export function rankWithDiversity(
    items: Top10Content[],
    scoreOf: (item: Top10Content) => number,
    limit: number
): Top10Content[] {
    const remaining = items.map((item) => ({ item, score: scoreOf(item) }))
    const picked: Top10Content[] = []

    while (picked.length < limit && remaining.length > 0) {
        let bestIndex = 0
        let bestValue = Number.NEGATIVE_INFINITY
        for (let index = 0; index < remaining.length; index += 1) {
            const overlap =
                picked.length === 0
                    ? 0
                    : Math.max(
                          ...picked.map((chosen) =>
                              genreJaccard(chosen.genre_ids, remaining[index].item.genre_ids)
                          )
                      )
            const value = 0.7 * remaining[index].score - 0.3 * overlap
            if (value > bestValue) {
                bestValue = value
                bestIndex = index
            }
        }
        picked.push(remaining[bestIndex].item)
        remaining.splice(bestIndex, 1)
    }

    return picked
}

export function takeUnseen(
    items: Top10Content[],
    seen: Set<string>,
    limit: number
): Top10Content[] {
    const result: Top10Content[] = []
    for (const item of items) {
        const key = railItemKey(item.type, item.id)
        if (seen.has(key)) {
            continue
        }
        seen.add(key)
        result.push(item)
        if (result.length >= limit) {
            break
        }
    }
    return result
}

function fillRail(
    primary: Top10Content[],
    fallback: Top10Content[] | undefined,
    scoreOf: (item: Top10Content) => number,
    seen: Set<string>,
    limit: number
): Top10Content[] {
    const ranked = rankWithDiversity(primary, scoreOf, PERSONAL_OVERFETCH)
    const taken = takeUnseen(ranked, seen, limit)
    if (taken.length >= Math.min(12, limit) || !fallback?.length) {
        return taken
    }
    const extra = takeUnseen(rankWithDiversity(fallback, scoreOf, PERSONAL_OVERFETCH), seen, limit - taken.length)
    return [...taken, ...extra]
}

export function composePersonalRails(
    pools: PersonalCandidatePools,
    taste: TasteProfile,
    occupied: Iterable<string>,
    now = new Date(),
    size = PERSONAL_RAIL_SIZE
): PersonalRails {
    const seen = new Set(occupied)
    for (const key of Array.from(taste.watched)) {
        seen.add(key)
    }

    const picksStats = poolStats(pools.picks)
    const picks = fillRail(
        pools.picks,
        pools.picksRelaxed,
        (item) => scorePicksForDay(item, taste.topGenres, picksStats.maxPop, now),
        seen,
        size
    )

    const affinitySeen = new Set(seen)
    const affinityCandidates =
        taste.personalized && pools.affinity.length > 0
            ? fillRail(
                  pools.affinity,
                  undefined,
                  (item) =>
                      scoreAffinity(
                          item,
                          taste.topGenres,
                          pools.affinityFlags?.get(railItemKey(item.type, item.id))
                      ),
                  affinitySeen,
                  size
              )
            : []
    const affinity = affinityCandidates.length >= AFFINITY_MIN_ITEMS ? affinityCandidates : []
    if (affinity.length > 0) {
        for (const item of affinity) {
            seen.add(railItemKey(item.type, item.id))
        }
    }

    const treasureStatsForHit = poolStats(pools.treasures)
    const treasurePool = pools.treasures.filter((item) => !isRecentHit(item, now, treasureStatsForHit.maxPop))
    const treasuresPrimary = treasurePool.length >= 8 ? treasurePool : pools.treasures
    const treasureStats = poolStats(treasuresPrimary)
    const treasures = fillRail(
        treasuresPrimary,
        pools.treasuresRelaxed,
        (item) => scoreTreasures(item, taste.topGenres, treasureStats.maxPop, treasureStats.maxVotes),
        seen,
        size
    )

    return {
        personalized: taste.personalized,
        picks,
        affinity: affinity.length >= AFFINITY_MIN_ITEMS ? affinity : [],
        treasures,
        seedTitle: taste.seedTitle,
        topGenres: taste.topGenres,
    }
}

export function occupiedKeys(items: Array<{ id: number; type?: 'movie' | 'tv' }>): string[] {
    return items.map((item) => railItemKey(item.type || 'movie', item.id))
}
