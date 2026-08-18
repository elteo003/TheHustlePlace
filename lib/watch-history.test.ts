import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getWatchHistory, trackWatchEntry, removeWatchEntry } from '@/lib/watch-history'
import { nextWatchProgress } from '@/lib/watch-progress'

describe('watch-history', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', {
            store: {} as Record<string, string>,
            getItem(key: string) {
                return this.store[key] ?? null
            },
            setItem(key: string, value: string) {
                this.store[key] = value
            },
            removeItem(key: string) {
                delete this.store[key]
            },
        })
        vi.stubGlobal('window', {
            dispatchEvent: vi.fn(),
        })
    })

    it('salva e ordina per data', () => {
        trackWatchEntry({ id: 1, type: 'movie', title: 'Film A' })
        trackWatchEntry({ id: 2, type: 'tv', title: 'Serie B', season: 1, episode: 2 })

        const history = getWatchHistory()
        expect(history).toHaveLength(2)
        expect(history[0].title).toBe('Serie B')
    })

    it('incrementa il progresso su riapertura', () => {
        trackWatchEntry({ id: 5, type: 'movie', title: 'Film' })
        const first = getWatchHistory()[0].progress
        trackWatchEntry({ id: 5, type: 'movie', title: 'Film' })
        const second = getWatchHistory()[0].progress
        expect(second).toBeGreaterThan(first)
    })

    it('rimuove una voce', () => {
        trackWatchEntry({ id: 9, type: 'movie', title: 'X' })
        removeWatchEntry(9, 'movie')
        expect(getWatchHistory()).toHaveLength(0)
    })
})

describe('nextWatchProgress', () => {
    it('parte da 18 e sale di 12 fino a 95', () => {
        expect(nextWatchProgress()).toBe(18)
        expect(nextWatchProgress(18)).toBe(30)
        expect(nextWatchProgress(90)).toBe(95)
        expect(nextWatchProgress(95)).toBe(95)
    })
})
