import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
    getLastBrowsePath,
    isBrowsePath,
    rememberBrowsePath,
    resolvePlayerExit,
} from '@/lib/player-exit'

describe('player-exit', () => {
    beforeEach(() => {
        const store: Record<string, string> = {}
        vi.stubGlobal('window', {})
        vi.stubGlobal('sessionStorage', {
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
    })

    it('accetta solo superfici di browse', () => {
        expect(isBrowsePath('/home')).toBe(true)
        expect(isBrowsePath('/search?q=dark')).toBe(true)
        expect(isBrowsePath('/catalog')).toBe(true)
        expect(isBrowsePath('/')).toBe(false)
        expect(isBrowsePath('/player/tv/1?season=1&episode=1')).toBe(false)
        expect(isBrowsePath('/series/42')).toBe(false)
    })

    it('memorizza il browse e ignora player e serie', () => {
        rememberBrowsePath('/home')
        rememberBrowsePath('/series/99')
        rememberBrowsePath('/player/tv/99?season=1&episode=2')
        expect(getLastBrowsePath()).toBe('/home')
    })

    it('esce sul browse salvato, altrimenti sulla home', () => {
        expect(resolvePlayerExit('/search?q=lost')).toBe('/search?q=lost')
        expect(resolvePlayerExit('/series/1')).toBe('/home')
        expect(resolvePlayerExit(null)).toBe('/home')
    })
})
