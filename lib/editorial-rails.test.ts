import { describe, expect, it } from 'vitest'
import { Top10Content } from '@/types'
import {
    EDITORIAL_HOME_RAILS,
    EDITORIAL_RAIL_TITLES,
    HISTORICAL_WAR_KEYWORDS,
    MEDIEVAL_PASSION_KEYWORDS,
    MODERN_WAR_KEYWORDS,
    PERIOD_KEYWORDS,
    PERIOD_EXCLUDE_KEYWORDS,
    PUZZLE_KEYWORDS,
    TMDB_GENRE,
    TMDB_KEYWORD,
    boostEditorialSeeds,
    composeEditorialRails,
    emptyEditorialRails,
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

function pools(overrides: Partial<ReturnType<typeof emptyEditorialRails>>) {
    return { ...emptyEditorialRails(), ...overrides }
}

function many(prefix: string, start: number, count = 8, popularity = 30): Top10Content[] {
    return Array.from({ length: count }, (_, index) =>
        item({
            id: start + index,
            title: `${prefix} ${index}`,
            type: 'movie',
            popularity: popularity - index,
        })
    )
}

describe('editorial-rails', () => {
    it('separa guerre storiche, costume/western e guerre di oggi', () => {
        const war = [
            item({ id: 1, title: '1917', type: 'movie', popularity: 80, genre_ids: [TMDB_GENRE.movieWar] }),
            item({ id: 2, title: 'Oppenheimer', type: 'movie', popularity: 95 }),
            item({ id: 14, title: 'Dunkirk', type: 'movie', popularity: 72 }),
            item({ id: 15, title: 'The Imitation Game', type: 'movie', popularity: 68 }),
            ...many('War', 20, 6, 40),
        ]
        const period = [
            item({ id: 1, title: '1917', type: 'movie', popularity: 80, genre_ids: [TMDB_GENRE.movieHistory] }),
            item({ id: 3, title: 'Bridgerton', type: 'tv', popularity: 90 }),
            item({ id: 4, title: 'Downton Abbey', type: 'tv', popularity: 75 }),
            item({ id: 16, title: 'The Gilded Age', type: 'tv', popularity: 70 }),
            item({ id: 17, title: 'Tombstone', type: 'movie', popularity: 60, genre_ids: [TMDB_GENRE.movieWestern] }),
            ...many('Period', 40, 6, 30),
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
            pools({ warAndPolitics: war, periodStories: period, politicalIntrigue: modern }),
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
            pools({
                warAndPolitics: [item({ id: 1, title: 'Dunkirk', type: 'movie', popularity: 50 })],
            }),
            []
        )
        expect(rails.warAndPolitics).toEqual([])
        expect(EDITORIAL_RAIL_TITLES.periodStories).toBe("Storie di un'epoca passata")
        expect(EDITORIAL_RAIL_TITLES.politicalIntrigue).toBe('Le guerre di oggi')
        expect(EDITORIAL_RAIL_TITLES.warAndPolitics).toBe('Guerra e politica')
        expect(EDITORIAL_RAIL_TITLES.medievalPassion).toBe('Il medio evo che ti appassiona')
        expect(EDITORIAL_RAIL_TITLES.puzzleInvestigations).toBe('Indagini rompicapo')
        expect(EDITORIAL_RAIL_TITLES.mysteryMasterpieces).toBe('I capolavori del mistero')
        expect(EDITORIAL_RAIL_TITLES.darkestHorror).toBe('Quelli più cupi')
        expect(EDITORIAL_RAIL_TITLES.jukeboxPopStars).toBe(
            'Viaggio nel tempo: tra jukebox, lustrini e pop star'
        )
        expect(EDITORIAL_RAIL_TITLES.vintageStories).toBe(
            'Storie vintage: eleganza, vizi e cambiamenti sociali'
        )
        expect(EDITORIAL_RAIL_TITLES.drugEmpires).toBe('Imperi della droga oltre il confine')
        expect(EDITORIAL_RAIL_TITLES.crimeLords).toBe('I signori del crimine')
    })

    it("tiene lo scaffale d'epoca anche se Tesori ha gia mangiato qualche classico", () => {
        const occupied = ['movie:1', 'movie:3']
        const period = [
            item({ id: 1, title: '1917', type: 'movie', popularity: 80 }),
            item({ id: 3, title: 'Bridgerton', type: 'tv', popularity: 90 }),
            ...many('Epoca', 80, 8, 30),
        ]
        const rails = composeEditorialRails(pools({ periodStories: period }), occupied)
        expect(rails.periodStories.length).toBeGreaterThanOrEqual(6)
        expect(rails.periodStories.map((entry) => entry.title)).not.toContain('1917')
        expect(rails.periodStories.map((entry) => entry.title)).toContain('Epoca 0')
    })

    it('lascia al medioevo i costume giapponesi e medievali che guerra non ha preso', () => {
        const war = [
            item({ id: 1, title: '1917', type: 'movie', popularity: 90 }),
            ...many('WarFill', 200, 8, 40),
        ]
        const medieval = [
            item({ id: 1, title: '1917', type: 'movie', popularity: 90 }),
            item({ id: 50, title: 'Shogun', type: 'tv', popularity: 88 }),
            item({ id: 51, title: 'The King', type: 'movie', popularity: 70 }),
            ...many('Medieval', 300, 8, 50),
        ]
        const rails = composeEditorialRails(pools({ warAndPolitics: war, medievalPassion: medieval }), [])
        expect(rails.medievalPassion.map((entry) => entry.title)).toContain('Shogun')
        expect(rails.medievalPassion.map((entry) => entry.title)).toContain('The King')
        expect(rails.medievalPassion.map((entry) => entry.title)).not.toContain('1917')
    })

    it('mette i gialli moderni in Indagini rompicapo e i classici nei capolavori', () => {
        const puzzle = [
            item({ id: 60, title: 'The Usual Suspects', type: 'movie', popularity: 90 }),
            item({ id: 61, title: 'Memento', type: 'movie', popularity: 85 }),
            item({ id: 62, title: 'Knives Out', type: 'movie', popularity: 80 }),
            ...many('Puzzle', 400, 8, 55),
        ]
        const masterpieces = [
            item({ id: 60, title: 'The Usual Suspects', type: 'movie', popularity: 90 }),
            item({ id: 70, title: 'Chinatown', type: 'movie', popularity: 70 }),
            item({ id: 71, title: 'The Conversation', type: 'movie', popularity: 65 }),
            ...many('ClassicMystery', 500, 8, 40),
        ]
        const rails = composeEditorialRails(
            pools({ puzzleInvestigations: puzzle, mysteryMasterpieces: masterpieces }),
            []
        )
        expect(rails.puzzleInvestigations.map((entry) => entry.title)).toContain('The Usual Suspects')
        expect(rails.puzzleInvestigations.map((entry) => entry.title)).toContain('Knives Out')
        expect(rails.mysteryMasterpieces.map((entry) => entry.title)).toContain('Chinatown')
        expect(rails.mysteryMasterpieces.map((entry) => entry.title)).not.toContain('The Usual Suspects')
    })

    it('tiene Stranger Things nel jukebox e non nelle storie vintage', () => {
        const jukebox = [
            item({ id: 80, title: 'Stranger Things', type: 'tv', popularity: 99 }),
            item({ id: 81, title: 'Bohemian Rhapsody', type: 'movie', popularity: 90 }),
            ...many('Jukebox', 600, 8, 50),
        ]
        const vintage = [
            item({ id: 80, title: 'Stranger Things', type: 'tv', popularity: 99 }),
            item({ id: 90, title: "La regina degli scacchi", type: 'tv', popularity: 80 }),
            item({ id: 91, title: 'American Hustle', type: 'movie', popularity: 75 }),
            ...many('Vintage', 700, 8, 45),
        ]
        const rails = composeEditorialRails(pools({ jukeboxPopStars: jukebox, vintageStories: vintage }), [])
        expect(rails.jukeboxPopStars.map((entry) => entry.title)).toContain('Stranger Things')
        expect(rails.jukeboxPopStars.map((entry) => entry.title)).toContain('Bohemian Rhapsody')
        expect(rails.vintageStories.map((entry) => entry.title)).toContain("La regina degli scacchi")
        expect(rails.vintageStories.map((entry) => entry.title)).not.toContain('Stranger Things')
    })

    it('tiene Scarface e il Padrino tra i signori del crimine, non tra i cartelli', () => {
        const crime = [
            item({ id: 100, title: 'Il Padrino', type: 'movie', popularity: 99 }),
            item({ id: 101, title: 'Scarface', type: 'movie', popularity: 90 }),
            ...many('Crime', 800, 40, 40),
        ]
        const drug = [
            item({ id: 110, title: 'Narcos', type: 'tv', popularity: 95 }),
            item({ id: 111, title: 'Sicario', type: 'movie', popularity: 88 }),
            item({ id: 112, title: 'City of God', type: 'movie', popularity: 92 }),
            ...many('Drug', 900, 40, 35),
        ]
        const rails = composeEditorialRails(pools({ crimeLords: crime, drugEmpires: drug }), [])
        expect(rails.crimeLords.map((entry) => entry.title)).toContain('Il Padrino')
        expect(rails.crimeLords.map((entry) => entry.title)).toContain('Scarface')
        expect(rails.drugEmpires.map((entry) => entry.title)).toContain('Narcos')
        expect(rails.drugEmpires.map((entry) => entry.title)).toContain('Sicario')
        expect(rails.drugEmpires.map((entry) => entry.title)).toContain('City of God')
        expect(rails.crimeLords.map((entry) => entry.title)).not.toContain('City of God')
    })

    it('riempie uno scaffale fino a 40 titoli', () => {
        const rails = composeEditorialRails(pools({ warAndPolitics: many('War', 1, 50, 80) }), [])
        expect(rails.warAndPolitics).toHaveLength(40)
    })

    it('mantiene i titoli seme in testa allo scaffale', () => {
        const seeds = [item({ id: 900, title: 'Knives Out', type: 'movie', popularity: 10 })]
        const pool = [
            item({ id: 901, title: 'Blockbuster', type: 'movie', popularity: 99 }),
            item({ id: 900, title: 'Knives Out', type: 'movie', popularity: 10 }),
        ]
        const merged = boostEditorialSeeds(seeds, pool)
        expect(merged[0].title).toBe('Knives Out')
        expect(merged[0].popularity).toBeGreaterThan(99)
        expect(merged.filter((entry) => entry.title === 'Knives Out')).toHaveLength(1)
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
        expect(keywordPipe(MEDIEVAL_PASSION_KEYWORDS)).toContain(String(TMDB_KEYWORD.samurai))
        expect(keywordPipe(MEDIEVAL_PASSION_KEYWORDS)).toContain(String(TMDB_KEYWORD.medieval))
        expect(keywordPipe(PUZZLE_KEYWORDS)).toContain(String(TMDB_KEYWORD.whodunit))
        expect(TMDB_GENRE.movieWestern).toBe(37)
        expect(TMDB_GENRE.tvWarPolitics).toBe(10768)
        expect(TMDB_GENRE.movieHorror).toBe(27)
        expect(TMDB_GENRE.movieMusic).toBe(10402)
        expect(EDITORIAL_HOME_RAILS[0].id).toBe('warAndPolitics')
        expect(EDITORIAL_HOME_RAILS.map((rail) => rail.id)).toContain('medievalPassion')
        expect(EDITORIAL_HOME_RAILS.map((rail) => rail.id)).toContain('drugEmpires')
        expect(EDITORIAL_HOME_RAILS.map((rail) => rail.id)).toContain('crimeLords')
        expect(EDITORIAL_HOME_RAILS.at(-1)?.id).toBe('politicalIntrigue')
    })
})
