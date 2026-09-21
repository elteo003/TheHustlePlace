import { describe, expect, it } from 'vitest'
import { Top10Content } from '@/types'
import {
    EDITORIAL_RAIL_TITLES,
    HISTORICAL_WAR_KEYWORDS,
    MODERN_WAR_KEYWORDS,
    PERIOD_KEYWORDS,
    PERIOD_EXCLUDE_KEYWORDS,
    TMDB_GENRE,
    TMDB_KEYWORD,
    composeEditorialRails,
    keywordPipe,
} from './editorial-rails'

function item(partial: Partial<Top10Content> & Pick<Top10Content, 'id' | 'title' | 'type'>): Top10Content {
    return {
        overview: '',
        poster_path: '/x.jpg',
        release_date: '2020-01-01',
        vote_average: 7.5,
        vote_count: 800,
        genre_ids: [],
        adult: false,
        original_language: 'en',
        popularity: 40,
        tmdb_id: partial.id,
        ...partial,
    }
}

describe('editorial-rails', () => {
    it('separa guerre storiche, costume/western e guerre di oggi', () => {
        const war = [
            item({ id: 1, title: '1917', type: 'movie', popularity: 80, genre_ids: [TMDB_GENRE.movieWar] }),
            item({ id: 2, title: 'Oppenheimer', type: 'movie', popularity: 95 }),
            item({ id: 14, title: 'Dunkirk', type: 'movie', popularity: 72 }),
            item({ id: 15, title: 'The Imitation Game', type: 'movie', popularity: 68 }),
            ...Array.from({ length: 6 }, (_, index) =>
                item({ id: 20 + index, title: `War ${index}`, type: 'movie', popularity: 40 - index })
            ),
        ]
        const period = [
            item({ id: 1, title: '1917', type: 'movie', popularity: 80, genre_ids: [TMDB_GENRE.movieHistory] }),
            item({ id: 3, title: 'Bridgerton', type: 'tv', popularity: 90 }),
            item({ id: 4, title: 'Downton Abbey', type: 'tv', popularity: 75 }),
            item({ id: 16, title: 'The Gilded Age', type: 'tv', popularity: 70 }),
            item({ id: 17, title: 'Tombstone', type: 'movie', popularity: 60, genre_ids: [TMDB_GENRE.movieWestern] }),
            ...Array.from({ length: 6 }, (_, index) =>
                item({ id: 40 + index, title: `Period ${index}`, type: 'movie', popularity: 30 - index })
            ),
        ]
        const modern = [
            item({ id: 3, title: 'Bridgerton', type: 'tv', popularity: 90 }),
            item({ id: 5, title: 'The Hurt Locker', type: 'movie', popularity: 88 }),
            item({ id: 6, title: 'The Diplomat', type: 'tv', popularity: 60 }),
            item({ id: 7, title: 'American Sniper', type: 'movie', popularity: 50 }),
            item({ id: 8, title: 'Civil War', type: 'movie', popularity: 48 }),
            item({ id: 9, title: 'Zero Dark Thirty', type: 'movie', popularity: 47 }),
            item({ id: 10, title: 'Generation Kill', type: 'tv', popularity: 46 }),
            item({ id: 12, title: 'The Outpost', type: 'movie', popularity: 45 }),
            item({ id: 11, title: 'Occupato', type: 'movie', popularity: 99 }),
        ]

        const rails = composeEditorialRails(
            { warAndPolitics: war, periodStories: period, politicalIntrigue: modern },
            []
        )

        expect(rails.warAndPolitics[0].title).toBe('Oppenheimer')
        expect(rails.warAndPolitics.map((entry) => entry.title)).toContain('1917')
        expect(rails.warAndPolitics.map((entry) => entry.title)).toContain('Dunkirk')
        expect(rails.periodStories.map((entry) => entry.title)).toContain('Bridgerton')
        expect(rails.periodStories.map((entry) => entry.title)).toContain('Downton Abbey')
        expect(rails.periodStories.map((entry) => entry.title)).toContain('Tombstone')
        expect(rails.periodStories.map((entry) => entry.title)).not.toContain('1917')
        expect(rails.politicalIntrigue.map((entry) => entry.title)).toContain('The Hurt Locker')
        expect(rails.politicalIntrigue.map((entry) => entry.title)).toContain('The Diplomat')
        expect(rails.politicalIntrigue.map((entry) => entry.title)).not.toContain('Bridgerton')
        expect(rails.politicalIntrigue.some((entry) => entry.type === 'movie')).toBe(true)
    })

    it('nasconde una riga se dopo il dedup resta troppo corta', () => {
        const rails = composeEditorialRails(
            {
                warAndPolitics: [item({ id: 1, title: 'Dunkirk', type: 'movie', popularity: 50 })],
                politicalIntrigue: [],
                periodStories: [],
            },
            []
        )
        expect(rails.warAndPolitics).toEqual([])
        expect(EDITORIAL_RAIL_TITLES.periodStories).toBe("Storie di un'epoca passata")
        expect(EDITORIAL_RAIL_TITLES.politicalIntrigue).toBe('Le guerre di oggi')
        expect(EDITORIAL_RAIL_TITLES.warAndPolitics).toBe('Guerra e politica')
    })

    it("tiene lo scaffale d'epoca anche se Tesori ha gia mangiato qualche classico", () => {
        const occupied = ['movie:1', 'movie:3']
        const period = [
            item({ id: 1, title: '1917', type: 'movie', popularity: 80 }),
            item({ id: 3, title: 'Bridgerton', type: 'tv', popularity: 90 }),
            ...Array.from({ length: 8 }, (_, index) =>
                item({ id: 80 + index, title: `Epoca ${index}`, type: 'movie', popularity: 30 - index })
            ),
        ]
        const rails = composeEditorialRails(
            { warAndPolitics: [], politicalIntrigue: [], periodStories: period },
            occupied
        )
        expect(rails.periodStories.length).toBeGreaterThanOrEqual(6)
        expect(rails.periodStories.map((entry) => entry.title)).not.toContain('1917')
        expect(rails.periodStories.map((entry) => entry.title)).toContain('Epoca 0')
    })

    it('unisce le keyword in OR per TMDB', () => {
        expect(keywordPipe([6078, 209817])).toBe('6078|209817')
    })

    it('separa guerre storiche e guerre di oggi senza mischiare politica da salotto', () => {
        const historical = keywordPipe(HISTORICAL_WAR_KEYWORDS)
        const modern = keywordPipe(MODERN_WAR_KEYWORDS)
        const period = keywordPipe(PERIOD_KEYWORDS)

        expect(historical).toContain(String(TMDB_KEYWORD.worldWarI))
        expect(historical).toContain(String(TMDB_KEYWORD.worldWarII))
        expect(historical).toContain(String(TMDB_KEYWORD.napoleonicWars))
        expect(historical).not.toContain(String(TMDB_KEYWORD.iraqWar))
        expect(modern).toContain(String(TMDB_KEYWORD.iraqWar))
        expect(modern).toContain(String(TMDB_KEYWORD.geopolitics))
        expect(modern).not.toContain(String(TMDB_KEYWORD.worldWarII))
        expect(period).toContain(String(TMDB_KEYWORD.periodDrama))
        expect(period).not.toContain(String(TMDB_KEYWORD.historicalFiction))
        expect(keywordPipe(PERIOD_EXCLUDE_KEYWORDS)).toContain(String(TMDB_KEYWORD.sixties))
        expect(TMDB_GENRE.movieWestern).toBe(37)
        expect(TMDB_GENRE.tvWarPolitics).toBe(10768)
    })
})
