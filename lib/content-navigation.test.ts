import { describe, expect, it } from 'vitest'
import { getContentId, getDetailsPath, getPlayerPath, getSeriesPath } from '@/lib/content-navigation'

describe('content-navigation', () => {
    it('risolve il TMDB id con fallback su id', () => {
        expect(getContentId({ id: 10, tmdb_id: 99 })).toBe(99)
        expect(getContentId({ id: 10 })).toBe(10)
    })

    it('genera il path corretto per film e serie', () => {
        expect(getPlayerPath(42, 'movie')).toBe('/player/movie/42')
        expect(getPlayerPath(42, 'tv')).toBe('/series/42')
        expect(getPlayerPath(42, 'tv', { season: 2, episode: 3 })).toBe(
            '/player/tv/42?season=2&episode=3'
        )
    })

    it('genera il path dettagli coerente col tipo', () => {
        expect(getDetailsPath(7, 'movie')).toBe('/movie/7')
        expect(getDetailsPath(7, 'tv')).toBe('/series/7')
    })

    it('genera il path serie con puntata opzionale', () => {
        expect(getSeriesPath(42)).toBe('/series/42')
        expect(getSeriesPath(42, { season: 3, episode: 8 })).toBe('/series/42?season=3&episode=8')
    })
})
