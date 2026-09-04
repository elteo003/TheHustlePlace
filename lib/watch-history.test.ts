import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
    getWatchHistory,
    getLastWatchedEpisode,
    getResumeStartAt,
    trackWatchEntry,
    removeWatchEntry,
} from '@/lib/watch-history'
import { isNearEnd, nextWatchProgress, progressPercent, resumeStartAt } from '@/lib/watch-progress'

describe('watch-history', () => {
    beforeEach(() => {
        const store: Record<string, string> = {}
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
        vi.stubGlobal('localStorage', {
            getItem(key: string) {
                return store[key] ?? null
            },
            setItem(key: string, value: string) {
                store[key] = value
            },
            removeItem(key: string) {
                delete store[key]
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

    it('salva il progresso reale da currentTime/duration', () => {
        trackWatchEntry({
            id: 5,
            type: 'movie',
            title: 'Film',
            currentTime: 900,
            duration: 1800,
        })
        expect(getWatchHistory()[0].progress).toBe(50)
        expect(getWatchHistory()[0].currentTime).toBe(900)
    })

    it('in riapertura senza secondi conserva il progresso', () => {
        trackWatchEntry({
            id: 5,
            type: 'movie',
            title: 'Film',
            currentTime: 900,
            duration: 1800,
        })
        trackWatchEntry({ id: 5, type: 'movie', title: 'Film' })
        expect(getWatchHistory()[0].progress).toBe(50)
        expect(getWatchHistory()[0].currentTime).toBe(900)
    })

    it('rimuove una voce', () => {
        trackWatchEntry({ id: 9, type: 'movie', title: 'X' })
        removeWatchEntry(9, 'movie')
        expect(getWatchHistory()).toHaveLength(0)
    })

    it('restituisce la puntata TV più recente per id', () => {
        trackWatchEntry({ id: 11, type: 'tv', title: 'Serie', season: 3, episode: 4 })
        expect(getLastWatchedEpisode(11)).toEqual(expect.objectContaining({ season: 3, episode: 4 }))
        expect(getLastWatchedEpisode(99)).toBeNull()
    })

    it('calcola startAt solo per la stessa puntata', () => {
        trackWatchEntry({
            id: 11,
            type: 'tv',
            title: 'Serie',
            season: 1,
            episode: 2,
            currentTime: 80,
            duration: 1400,
        })
        expect(getResumeStartAt(11, 'tv', 1, 2)).toBe(80)
        expect(getResumeStartAt(11, 'tv', 1, 3)).toBeUndefined()
    })
})

describe('watch-progress', () => {
    it('converte secondi in percentuale', () => {
        expect(progressPercent(90, 180)).toBe(50)
        expect(progressPercent(0, 0)).toBe(0)
    })

    it('mostra Prossima dagli ultimi 5 minuti', () => {
        expect(isNearEnd(900, 1200)).toBe(true)
        expect(isNearEnd(899, 1200)).toBe(false)
        expect(isNearEnd(1185, 1200)).toBe(true)
        expect(isNearEnd(100, 1200)).toBe(false)
    })

    it('resume solo a metà visione', () => {
        expect(resumeStartAt({ currentTime: 80, duration: 1400 })).toBe(80)
        expect(resumeStartAt({ currentTime: 3, duration: 1400 })).toBeUndefined()
        expect(resumeStartAt({ currentTime: 1390, duration: 1400 })).toBeUndefined()
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
