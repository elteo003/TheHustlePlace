import { describe, expect, it } from 'vitest'
import { Top10Content } from '@/types'
import {
    AFFINITY_MIN_ITEMS,
    buildTasteProfile,
    composePersonalRails,
    genrePipe,
    historyWeight,
    monthsAgoIso,
    occupiedKeys,
    railItemKey,
    scorePicks,
    scorePicksForDay,
    scoreTreasures,
    takeUnseen,
    toDiscoverGenres,
    yearsAgoIso,
} from './personal-rails'

function item(partial: Partial<Top10Content> & Pick<Top10Content, 'id' | 'title' | 'type'>): Top10Content {
    return {
        overview: '',
        poster_path: '/x.jpg',
        release_date: '2024-01-01',
        vote_average: 7.5,
        vote_count: 800,
        genre_ids: [28],
        adult: false,
        original_language: 'en',
        popularity: 40,
        tmdb_id: partial.id,
        ...partial,
    }
}

describe('personal-rails', () => {
    it('pesa di più un titolo finito di recente rispetto a un click vecchio', () => {
        const now = Date.parse('2026-09-21T00:00:00.000Z')
        const fresh = historyWeight({ progress: 100, watchedAt: now }, now)
        const bounce = historyWeight({ progress: 3, watchedAt: now - 20 * 86_400_000 }, now)
        expect(fresh).toBeGreaterThan(bounce * 3)
    })

    it('costruisce il gusto in OR sui generi e tiene i semi più pesanti', () => {
        const now = Date.parse('2026-09-21T00:00:00.000Z')
        const taste = buildTasteProfile(
            [
                { id: 1, type: 'movie', progress: 100, watchedAt: now },
                { id: 2, type: 'movie', progress: 80, watchedAt: now - 86_400_000 },
                { id: 3, type: 'tv', progress: 90, watchedAt: now - 2 * 86_400_000 },
            ],
            [
                { id: 1, type: 'movie', genreIds: [28, 878], keywordIds: [1701], title: 'Dune' },
                { id: 2, type: 'movie', genreIds: [28], keywordIds: [1701, 9663], title: 'Heat' },
                { id: 3, type: 'tv', genreIds: [18, 80], keywordIds: [], title: 'Dark' },
            ],
            now
        )

        expect(taste.personalized).toBe(true)
        expect(taste.topGenres[0]).toBe(28)
        expect(taste.topKeywords[0]).toBe(1701)
        expect(taste.seeds[0].id).toBe(1)
        expect(taste.seedTitle).toBe('Dune')
        expect(genrePipe(taste.topGenres)).toContain('|')
    })

    it('sotto i 3 titoli non è personalizzato', () => {
        const taste = buildTasteProfile(
            [{ id: 1, type: 'movie', progress: 100, watchedAt: Date.now() }],
            [{ id: 1, type: 'movie', genreIds: [28], keywordIds: [] }]
        )
        expect(taste.personalized).toBe(false)
    })

    it('mappa i generi film → serie con OR, non AND', () => {
        expect(toDiscoverGenres([28, 878], 'tv')).toEqual([10759, 10765])
        expect(toDiscoverGenres([10765], 'movie')).toEqual([878])
    })

    it('calcola finestre ISO stabili', () => {
        const now = new Date('2026-09-21T12:00:00.000Z')
        expect(yearsAgoIso(5, now)).toBe('2021-09-21')
        expect(monthsAgoIso(18, now)).toBe('2025-03-21')
    })

    it('nei tesori penalizza la popolarità che negli scelti viene premiata', () => {
        const hit = item({ id: 1, title: 'Hit', type: 'movie', popularity: 200, vote_average: 7.2, vote_count: 8000 })
        const gem = item({ id: 2, title: 'Gem', type: 'movie', popularity: 8, vote_average: 8.4, vote_count: 900 })
        const picksHit = scorePicks(hit, [28], 200, new Date('2026-09-21'))
        const picksGem = scorePicks(gem, [28], 200, new Date('2026-09-21'))
        const treasuresHit = scoreTreasures(hit, [28], 200, 8000)
        const treasuresGem = scoreTreasures(gem, [28], 200, 8000)
        expect(picksHit).toBeGreaterThan(picksGem)
        expect(treasuresGem).toBeGreaterThan(treasuresHit)
    })

    it('deduplica in cascata e nasconde il ponte se restano pochi titoli', () => {
        const occupied = occupiedKeys([item({ id: 1, title: 'Top', type: 'movie' })])
        const taste = buildTasteProfile(
            [
                { id: 10, type: 'movie', progress: 100, watchedAt: Date.now() },
                { id: 11, type: 'movie', progress: 90, watchedAt: Date.now() },
                { id: 12, type: 'tv', progress: 80, watchedAt: Date.now() },
            ],
            [
                { id: 10, type: 'movie', genreIds: [28], keywordIds: [1], title: 'Seed' },
                { id: 11, type: 'movie', genreIds: [28], keywordIds: [1] },
                { id: 12, type: 'tv', genreIds: [80], keywordIds: [] },
            ]
        )

        const rails = composePersonalRails(
            {
                picks: [
                    item({ id: 1, title: 'Top', type: 'movie', popularity: 90 }),
                    item({ id: 2, title: 'Pick A', type: 'movie', popularity: 80 }),
                    item({ id: 3, title: 'Pick B', type: 'tv', popularity: 70 }),
                ],
                affinity: Array.from({ length: AFFINITY_MIN_ITEMS - 1 }, (_, index) =>
                    item({ id: 100 + index, title: `Aff ${index}`, type: 'movie', popularity: 20 })
                ),
                treasures: [
                    item({
                        id: 2,
                        title: 'Pick A',
                        type: 'movie',
                        popularity: 5,
                        vote_average: 8.2,
                        release_date: '2018-01-01',
                    }),
                    item({
                        id: 4,
                        title: 'Treasure',
                        type: 'movie',
                        popularity: 6,
                        vote_average: 8.1,
                        vote_count: 400,
                        release_date: '2016-01-01',
                    }),
                ],
            },
            taste,
            occupied
        )

        expect(rails.picks.map((entry) => entry.title).sort()).toEqual(['Pick A', 'Pick B'])
        expect(rails.affinity).toEqual([])
        expect(rails.treasures.map((entry) => entry.title)).toEqual(['Treasure'])
        expect(rails.topGenres?.[0]).toBe(28)
        expect(new Set([...rails.picks, ...rails.treasures].map((entry) => railItemKey(entry.type, entry.id))).size).toBe(
            rails.picks.length + rails.treasures.length
        )
    })

    it('ruota gli scelti per te a mezzanotte di Roma e li tiene fermi nello stesso giorno', () => {
        const pool = Array.from({ length: 16 }, (_, index) =>
            item({
                id: index + 1,
                title: `T${index}`,
                type: 'movie',
                popularity: 50,
                genre_ids: [28],
                release_date: '2024-06-01',
            })
        )
        const taste = buildTasteProfile(
            [
                { id: 90, type: 'movie', progress: 100, watchedAt: Date.parse('2026-09-21T12:00:00.000Z') },
                { id: 91, type: 'movie', progress: 90, watchedAt: Date.parse('2026-09-20T12:00:00.000Z') },
                { id: 92, type: 'movie', progress: 80, watchedAt: Date.parse('2026-09-19T12:00:00.000Z') },
            ],
            [
                { id: 90, type: 'movie', genreIds: [28], keywordIds: [] },
                { id: 91, type: 'movie', genreIds: [28], keywordIds: [] },
                { id: 92, type: 'movie', genreIds: [28], keywordIds: [] },
            ],
            Date.parse('2026-09-21T12:00:00.000Z')
        )
        const pools = { picks: pool, affinity: [], treasures: [] }
        const evening = new Date('2026-09-21T21:30:00.000Z')
        const stillEvening = new Date('2026-09-21T21:45:00.000Z')
        const afterMidnight = new Date('2026-09-21T22:30:00.000Z')

        const first = composePersonalRails(pools, taste, [], evening, 8)
        const again = composePersonalRails(pools, taste, [], stillEvening, 8)
        const nextDay = composePersonalRails(pools, taste, [], afterMidnight, 8)

        expect(first.picks.map((entry) => entry.id)).toEqual(again.picks.map((entry) => entry.id))
        expect(first.picks.map((entry) => entry.id).join(',')).not.toBe(
            nextDay.picks.map((entry) => entry.id).join(',')
        )
    })

    it('un match netto di gusto resta davanti alla rotazione del giorno', () => {
        const champion = item({
            id: 1,
            title: 'Champ',
            type: 'movie',
            popularity: 400,
            genre_ids: [28],
            release_date: '2026-08-01',
            vote_count: 5000,
        })
        const weak = Array.from({ length: 10 }, (_, index) =>
            item({
                id: 10 + index,
                title: `W${index}`,
                type: 'movie',
                popularity: 4,
                genre_ids: [99],
                release_date: '2010-01-01',
                vote_count: 50,
            })
        )
        const taste = buildTasteProfile(
            [
                { id: 90, type: 'movie', progress: 100, watchedAt: Date.parse('2026-09-21T12:00:00.000Z') },
                { id: 91, type: 'movie', progress: 90, watchedAt: Date.parse('2026-09-20T12:00:00.000Z') },
                { id: 92, type: 'movie', progress: 80, watchedAt: Date.parse('2026-09-19T12:00:00.000Z') },
            ],
            [
                { id: 90, type: 'movie', genreIds: [28], keywordIds: [] },
                { id: 91, type: 'movie', genreIds: [28], keywordIds: [] },
                { id: 92, type: 'movie', genreIds: [28], keywordIds: [] },
            ]
        )

        for (const day of ['2026-01-15', '2026-06-15', '2026-12-15']) {
            const rails = composePersonalRails(
                { picks: [champion, ...weak], affinity: [], treasures: [] },
                taste,
                [],
                new Date(`${day}T12:00:00.000Z`),
                6
            )
            expect(rails.picks[0]?.id).toBe(1)
            const lead = scorePicksForDay(champion, [28], 400, new Date(`${day}T12:00:00.000Z`))
            const trail = scorePicksForDay(weak[0], [28], 400, new Date(`${day}T12:00:00.000Z`))
            expect(lead).toBeGreaterThan(trail)
        }
    })

    it('takeUnseen marca gli id visti', () => {
        const seen = new Set(['movie:1'])
        const taken = takeUnseen(
            [
                item({ id: 1, title: 'A', type: 'movie' }),
                item({ id: 2, title: 'B', type: 'movie' }),
            ],
            seen,
            24
        )
        expect(taken.map((entry) => entry.id)).toEqual([2])
        expect(seen.has('movie:2')).toBe(true)
    })
})
