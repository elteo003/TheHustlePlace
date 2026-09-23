import { newness, popNorm, railItemKey, simTaste, type HistorySeed } from '@/lib/personal-rails'
import { Top10Content } from '@/types'

export const RANKER_VERSION = 'v1'

export type Liking = 'yes' | 'a_lot' | 'thrilled' | 'skipped'
export type FeedbackMoment = 'mid_season' | 'end_season' | 'end_movie'
export type WouldContinue = 'yes' | 'no'

export type TitleFeedback = {
    tmdbId: number
    type: 'movie' | 'tv'
    season: number
    moment: FeedbackMoment
    liking: Liking
    wouldContinue: WouldContinue | null
    updatedAt: number
}

export type RankerWeights = {
    version: string
    simTaste: number
    newness: number
    popularity: number
    explicit: number
    neighbor: number
    abandon: number
    continueNo: number
    alreadySeen: number
}

export const RANKER_WEIGHTS_V1: RankerWeights = {
    version: RANKER_VERSION,
    simTaste: 0.26,
    newness: 0.1,
    popularity: 0.08,
    explicit: 0.28,
    neighbor: 0.12,
    abandon: 0.08,
    continueNo: 0.05,
    alreadySeen: 0.03,
}

export function likingValue(liking: Liking): number {
    if (liking === 'thrilled') return 1
    if (liking === 'a_lot') return 0.72
    if (liking === 'yes') return 0.42
    return 0
}

export function promptForSeasonEpisode(episode: number, episodeCount: number): FeedbackMoment | null {
    if (!Number.isFinite(episode) || !Number.isFinite(episodeCount) || episodeCount < 1 || episode < 1) {
        return null
    }
    if (episode === episodeCount) return 'end_season'
    if (episodeCount >= 4 && episode === Math.ceil(episodeCount / 2)) return 'mid_season'
    return null
}

export function promptForPlayback(input: {
    type: 'movie' | 'tv'
    episode?: number
    episodeCount?: number
}): FeedbackMoment | null {
    if (input.type === 'movie') return 'end_movie'
    return promptForSeasonEpisode(input.episode || 0, input.episodeCount || 0)
}

export function isAbandoned(entry: HistorySeed, now = Date.now(), staleMs = 21 * 86_400_000): boolean {
    if (entry.progress >= 90) return false
    if (entry.progress < 15) return false
    return now - entry.watchedAt >= staleMs
}

export type RankerContext = {
    topGenres: number[]
    thrilledGenres: number[]
    lovedKeys: Set<string>
    rejectedKeys: Set<string>
    rewatchNoKeys: Set<string>
    abandonedKeys: Set<string>
    watchedKeys: Set<string>
    completedKeys: Set<string>
    weights: RankerWeights
    now: Date
}

export function buildRankerContext(
    history: HistorySeed[],
    feedbacks: TitleFeedback[],
    topGenres: number[],
    weights: RankerWeights = RANKER_WEIGHTS_V1,
    now = new Date()
): RankerContext {
    const lovedKeys = new Set<string>()
    const rejectedKeys = new Set<string>()
    const rewatchNoKeys = new Set<string>()
    const nowMs = now.getTime()

    for (const row of feedbacks) {
        const key = railItemKey(row.type, row.tmdbId)
        if (row.liking === 'skipped') {
            rejectedKeys.add(key)
        }
        if (row.wouldContinue === 'no') {
            rewatchNoKeys.add(key)
        }
        if (row.liking === 'thrilled' || row.liking === 'a_lot') {
            lovedKeys.add(key)
        }
    }

    const watchedKeys = new Set<string>()
    const completedKeys = new Set<string>()
    const abandonedKeys = new Set<string>()
    for (const entry of history) {
        const key = railItemKey(entry.type, entry.id)
        watchedKeys.add(key)
        if (entry.progress >= 90) completedKeys.add(key)
        if (isAbandoned(entry, nowMs)) abandonedKeys.add(key)
    }

    return {
        topGenres,
        thrilledGenres: [],
        lovedKeys,
        rejectedKeys,
        rewatchNoKeys,
        abandonedKeys,
        watchedKeys,
        completedKeys,
        weights,
        now,
    }
}

export function attachThrilledGenres(context: RankerContext, items: Array<{ id: number; type?: 'movie' | 'tv'; genre_ids?: number[] }>) {
    const genres = new Set(context.thrilledGenres)
    for (const item of items) {
        const key = railItemKey(item.type || 'movie', item.id)
        if (!context.lovedKeys.has(key)) continue
        for (const genreId of item.genre_ids || []) genres.add(genreId)
    }
    context.thrilledGenres = Array.from(genres)
}

export function explicitScore(item: Top10Content, context: RankerContext): number {
    const key = railItemKey(item.type, item.id)
    if (context.lovedKeys.has(key)) return 1
    if (context.rejectedKeys.has(key)) return -1
    return 0
}

export function neighborScore(item: Top10Content, context: RankerContext): number {
    const key = railItemKey(item.type, item.id)
    if (context.rejectedKeys.has(key) || context.thrilledGenres.length === 0) return 0
    return simTaste(item, context.thrilledGenres)
}

export function scoreWithRanker(item: Top10Content, context: RankerContext, maxPop: number): number {
    const key = railItemKey(item.type, item.id)
    const weights = context.weights
    if (context.rejectedKeys.has(key)) {
        return -weights.explicit - weights.continueNo
    }
    return (
        weights.simTaste * simTaste(item, context.topGenres) +
        weights.newness * newness(item, context.now) +
        weights.popularity * popNorm(item, maxPop) +
        weights.explicit * explicitScore(item, context) +
        weights.neighbor * neighborScore(item, context) -
        weights.continueNo * (context.rewatchNoKeys.has(key) ? 1 : 0) -
        weights.abandon * (context.abandonedKeys.has(key) ? 1 : 0) -
        weights.alreadySeen * (context.completedKeys.has(key) ? 1 : 0)
    )
}

export function rerankWithTaste<T extends Top10Content>(items: T[], context: RankerContext): T[] {
    if (items.length < 2) return items
    attachThrilledGenres(context, items)
    let maxPop = 1
    for (const item of items) {
        maxPop = Math.max(maxPop, item.popularity || 0)
    }
    return [...items].sort((left, right) => scoreWithRanker(right, context, maxPop) - scoreWithRanker(left, context, maxPop))
}
