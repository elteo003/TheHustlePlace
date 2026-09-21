import { describe, expect, it } from 'vitest'
import { Top10Content } from '@/types'
import {
    EDITORIAL_RAIL_TITLES,
    TMDB_GENRE,
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
    it('tiene guerra, epoca e intrighi su titoli distinti e le serie politiche dopo il period', () => {
        const war = [
            item({ id: 1, title: '1917', type: 'movie', popularity: 80, genre_ids: [TMDB_GENRE.movieWar] }),
            item({ id: 2, title: 'Band of Brothers', type: 'tv', popularity: 70 }),
            ...Array.from({ length: 8 }, (_, index) =>
                item({ id: 20 + index, title: `War ${index}`, type: 'movie', popularity: 40 - index })
            ),
        ]
        const period = [
            item({ id: 1, title: '1917', type: 'movie', popularity: 80, genre_ids: [TMDB_GENRE.movieHistory] }),
            item({ id: 3, title: 'The Crown', type: 'tv', popularity: 90 }),
            item({ id: 4, title: 'Gladiator', type: 'movie', popularity: 75 }),
            ...Array.from({ length: 8 }, (_, index) =>
                item({ id: 40 + index, title: `Period ${index}`, type: 'movie', popularity: 30 - index })
            ),
        ]
        const intrigue = [
            item({ id: 3, title: 'The Crown', type: 'tv', popularity: 90 }),
            item({ id: 5, title: 'House of Cards', type: 'tv', popularity: 88 }),
            item({ id: 6, title: 'The Diplomat', type: 'tv', popularity: 60 }),
            item({ id: 7, title: 'Borgen', type: 'tv', popularity: 50 }),
            item({ id: 8, title: 'Veep', type: 'tv', popularity: 48 }),
            item({ id: 9, title: 'Scandal', type: 'tv', popularity: 47 }),
            item({ id: 10, title: 'Succession', type: 'tv', popularity: 46 }),
            item({ id: 12, title: 'The West Wing', type: 'tv', popularity: 45 }),
            item({ id: 13, title: 'Madam Secretary', type: 'tv', popularity: 44 }),
            item({ id: 11, title: 'Occupato', type: 'movie', popularity: 99 }),
        ]

        const rails = composeEditorialRails(
            { warAndPolitics: war, periodStories: period, politicalIntrigue: intrigue },
            []
        )

        expect(rails.warAndPolitics[0].title).toBe('1917')
        expect(rails.warAndPolitics.map((entry) => entry.title)).toContain('Band of Brothers')
        expect(rails.periodStories.map((entry) => entry.title)).toContain('The Crown')
        expect(rails.periodStories.map((entry) => entry.title)).toContain('Gladiator')
        expect(rails.periodStories.map((entry) => entry.title)).not.toContain('1917')
        expect(rails.politicalIntrigue.map((entry) => entry.title)).toContain('House of Cards')
        expect(rails.politicalIntrigue.map((entry) => entry.title)).not.toContain('The Crown')
        expect(rails.politicalIntrigue.every((entry) => entry.type === 'tv')).toBe(true)
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
    })

    it("tiene lo scaffale d'epoca anche se Tesori ha gia mangiato qualche classico", () => {
        const occupied = ['movie:1', 'movie:3']
        const period = [
            item({ id: 1, title: '1917', type: 'movie', popularity: 80 }),
            item({ id: 3, title: 'The Crown', type: 'tv', popularity: 90 }),
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
})
