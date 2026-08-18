import { ContentType } from '@/lib/content-navigation'
import { nextWatchProgress } from '@/lib/watch-progress'

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
    watchedAt: number
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

export interface TrackWatchInput {
    id: number
    type: ContentType
    title: string
    poster_path?: string | null
    backdrop_path?: string | null
    season?: number
    episode?: number
}

export function trackWatchEntry(input: TrackWatchInput): void {
    const entries = readAll()
    const key = `${input.type}-${input.id}`
    const existing = entries.find((e) => `${e.type}-${e.id}` === key)

    const progress = nextWatchProgress(existing?.progress)

    const entry: WatchHistoryEntry = {
        ...input,
        progress,
        watchedAt: Date.now(),
    }

    const filtered = entries.filter((e) => `${e.type}-${e.id}` !== key)
    writeAll([entry, ...filtered].slice(0, MAX_ENTRIES))

    if (isBrowser()) {
        window.dispatchEvent(new CustomEvent('watch-history-updated'))
        void fetch('/api/watch-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
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
