import { ContentType } from '@/lib/content-navigation'
import { progressPercent, resumeStartAt } from '@/lib/watch-progress'

export interface EpisodeProgress {
    season: number
    episode: number
    /** 0–100 */
    progress: number
    currentTime?: number
    duration?: number
}

export interface WatchHistoryEntry {
    id: number
    type: ContentType
    title: string
    poster_path?: string | null
    backdrop_path?: string | null
    season?: number
    episode?: number
    /** 0–100 */
    progress: number
    currentTime?: number
    duration?: number
    /** Progresso per puntata; la riga principale resta l'ultima vista. */
    episodes?: EpisodeProgress[]
    watchedAt: number
}

function sameEpisode(a: { season?: number; episode?: number }, season?: number, episode?: number) {
    return a.season === season && a.episode === episode
}

function findEpisodeProgress(
    entry: WatchHistoryEntry | undefined,
    season?: number,
    episode?: number
): EpisodeProgress | undefined {
    if (!entry || season == null || episode == null) return undefined
    const stored = entry.episodes?.find((item) => sameEpisode(item, season, episode))
    if (stored) return stored
    if (sameEpisode(entry, season, episode)) {
        return {
            season,
            episode,
            progress: entry.progress ?? 0,
            currentTime: entry.currentTime,
            duration: entry.duration,
        }
    }
    return undefined
}

function upsertEpisodeProgress(
    existing: EpisodeProgress[] | undefined,
    next: EpisodeProgress
): EpisodeProgress[] {
    const list = existing ? [...existing] : []
    const index = list.findIndex((item) => sameEpisode(item, next.season, next.episode))
    if (index >= 0) {
        list[index] = next
    } else {
        list.push(next)
    }
    return list
}

const STORAGE_KEY = 'thp_watch_history'
const MAX_ENTRIES = 12

function isBrowser(): boolean {
    return typeof window !== 'undefined'
}

function readAll(): WatchHistoryEntry[] {
    if (!isBrowser()) return []
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw) as WatchHistoryEntry[]
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

function writeAll(entries: WatchHistoryEntry[]): void {
    if (!isBrowser()) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function getWatchHistory(): WatchHistoryEntry[] {
    return readAll().sort((a, b) => b.watchedAt - a.watchedAt)
}

export function getLastWatchedEpisode(
    id: number
): { season: number; episode: number; progress: number; currentTime?: number } | null {
    const entry = getWatchHistory().find((item) => item.type === 'tv' && item.id === id)
    if (!entry || entry.season == null || entry.episode == null) return null
    return {
        season: entry.season,
        episode: entry.episode,
        progress: entry.progress ?? 0,
        currentTime: entry.currentTime,
    }
}

export function getSeriesEpisodeProgress(id: number): EpisodeProgress[] {
    const entry = getWatchHistory().find((item) => item.type === 'tv' && item.id === id)
    if (!entry) return []
    const list = entry.episodes ? [...entry.episodes] : []
    if (
        entry.season != null &&
        entry.episode != null &&
        !list.some((item) => sameEpisode(item, entry.season, entry.episode))
    ) {
        list.push({
            season: entry.season,
            episode: entry.episode,
            progress: entry.progress ?? 0,
            currentTime: entry.currentTime,
            duration: entry.duration,
        })
    }
    return list
}

export function getResumeStartAt(
    id: number,
    type: ContentType,
    season?: number,
    episode?: number,
    runtimeSeconds?: number
): number | undefined {
    const entry = getWatchHistory().find((item) => item.type === type && item.id === id)
    if (!entry) return undefined
    if (type === 'tv') {
        const slot = findEpisodeProgress(entry, season, episode)
        if (!slot) return undefined
        const duration = slot.duration && slot.duration > 0 ? slot.duration : runtimeSeconds
        return resumeStartAt({
            currentTime: slot.currentTime,
            duration,
            progress: slot.progress,
        })
    }
    const duration = entry.duration && entry.duration > 0 ? entry.duration : runtimeSeconds
    return resumeStartAt({
        currentTime: entry.currentTime,
        duration,
        progress: entry.progress,
    })
}

export function resolvePlayerStartAt(input: {
    id: number
    type: ContentType
    season?: number
    episode?: number
    urlStartAt?: number
    runtimeSeconds?: number
}): number | undefined {
    if (input.urlStartAt != null) {
        return resumeStartAt({
            currentTime: input.urlStartAt,
            duration: input.runtimeSeconds,
        })
    }
    return getResumeStartAt(
        input.id,
        input.type,
        input.season,
        input.episode,
        input.runtimeSeconds
    )
}

export function syncWatchHistoryFromRemote(remote: WatchHistoryEntry[]): WatchHistoryEntry[] {
    const local = readAll()
    const map = new Map(local.map((entry) => [`${entry.type}-${entry.id}`, entry]))

    for (const row of remote) {
        const key = `${row.type}-${row.id}`
        const prev = map.get(key)
        if (!prev) {
            map.set(key, row)
            continue
        }

        const newer = (row.watchedAt ?? 0) >= (prev.watchedAt ?? 0) ? row : prev
        const currentTime = Math.max(prev.currentTime ?? 0, row.currentTime ?? 0)
        const episodes = prev.episodes ?? row.episodes
        map.set(key, {
            ...newer,
            currentTime: currentTime > 0 ? currentTime : newer.currentTime,
            duration: row.duration && row.duration > 0 ? row.duration : prev.duration,
            progress: Math.max(prev.progress ?? 0, row.progress ?? 0),
            episodes,
        })
    }

    const merged = [...map.values()].sort((a, b) => b.watchedAt - a.watchedAt).slice(0, MAX_ENTRIES)
    writeAll(merged)
    return merged
}

export interface TrackWatchInput {
    id: number
    type: ContentType
    title: string
    poster_path?: string | null
    backdrop_path?: string | null
    season?: number
    episode?: number
    currentTime?: number
    duration?: number
    progress?: number
}

export function trackWatchEntry(input: TrackWatchInput): void {
    const entries = readAll()
    const key = `${input.type}-${input.id}`
    const existing = entries.find((e) => `${e.type}-${e.id}` === key)

    const priorEpisode =
        input.type === 'tv' ? findEpisodeProgress(existing, input.season, input.episode) : undefined
    const reuseRoot = input.type !== 'tv' || sameEpisode(existing ?? {}, input.season, input.episode)
    const currentTime =
        input.currentTime ?? priorEpisode?.currentTime ?? (reuseRoot ? existing?.currentTime : undefined)
    const duration =
        input.duration ?? priorEpisode?.duration ?? (reuseRoot ? existing?.duration : undefined)
    const progress =
        input.progress ??
        (currentTime != null && duration != null && duration > 0
            ? progressPercent(currentTime, duration)
            : priorEpisode?.progress ?? (reuseRoot ? existing?.progress : 0) ?? 0)

    const episodes =
        input.type === 'tv' && input.season != null && input.episode != null
            ? upsertEpisodeProgress(existing?.episodes, {
                  season: input.season,
                  episode: input.episode,
                  progress,
                  currentTime,
                  duration,
              })
            : existing?.episodes

    const entry: WatchHistoryEntry = {
        ...input,
        currentTime,
        duration,
        progress,
        episodes,
        watchedAt: Date.now(),
    }

    const filtered = entries.filter((e) => `${e.type}-${e.id}` !== key)
    writeAll([entry, ...filtered].slice(0, MAX_ENTRIES))

    if (isBrowser()) {
        window.dispatchEvent(new CustomEvent('watch-history-updated'))
        void fetch('/api/watch-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: input.id,
                type: input.type,
                title: input.title,
                poster_path: input.poster_path,
                backdrop_path: input.backdrop_path,
                season: input.season,
                episode: input.episode,
                position_seconds: Math.max(0, Math.floor(currentTime ?? 0)),
                progress,
            }),
        }).catch(() => undefined)
    }
}

export function removeWatchEntry(id: number, type: ContentType): void {
    const key = `${type}-${id}`
    writeAll(readAll().filter((e) => `${e.type}-${e.id}` !== key))
    if (isBrowser()) {
        window.dispatchEvent(new CustomEvent('watch-history-updated'))
        void fetch(`/api/watch-history?id=${id}&type=${type}`, {
            method: 'DELETE',
        }).catch(() => undefined)
    }
}
