import { describe, expect, it } from 'vitest'
import { Top10Content } from '@/types'
import { composeMomentTop10, isMomentEligible, isTooFarInTheFuture } from './top10-moment'

function item(
    partial: Partial<Top10Content> & Pick<Top10Content, 'id' | 'title' | 'type'>
): Top10Content {
    return {
        overview: '',
        poster_path: '/x.jpg',
        release_date: '2026-01-01',
        vote_average: 7,
        vote_count: 800,
        genre_ids: [],
        adult: false,
        original_language: 'en',
        popularity: 40,
        tmdb_id: partial.id,
        ...partial,
    }
}

const now = new Date('2026-09-21T12:00:00.000Z')

describe('top10-moment', () => {
    it('esclude i classici e i titoli troppo in là nel futuro', () => {
        expect(
            isMomentEligible(item({ id: 1, title: 'Persona', type: 'movie', release_date: '1966-10-18' }), now)
        ).toBe(false)
        expect(
            isMomentEligible(item({ id: 2, title: 'Wall-E', type: 'movie', release_date: '2008-06-27' }), now)
        ).toBe(false)
        expect(
            isMomentEligible(item({ id: 3, title: 'Breaking Bad', type: 'tv', first_air_date: '2008-01-20' }), now)
        ).toBe(false)
        expect(
            isTooFarInTheFuture(
                item({ id: 4, title: 'Film del 2028', type: 'movie', release_date: '2028-05-01' }),
                now
            )
        ).toBe(true)
        expect(
            isMomentEligible(
                item({ id: 5, title: 'Reacher', type: 'tv', first_air_date: '2022-02-03', popularity: 200 }),
                now
            )
        ).toBe(true)
    })

    it('preferisce streaming e cinema recenti rispetto a un classico finito nel trending settimanale', () => {
        const top = composeMomentTop10(
            {
                trendingDay: [
                    item({
                        id: 10,
                        title: 'The Diplomat',
                        type: 'tv',
                        first_air_date: '2024-04-20',
                        popularity: 90,
                    }),
                ],
                trendingWeek: [
                    item({
                        id: 11,
                        title: 'Taxi Driver',
                        type: 'movie',
                        release_date: '1976-02-08',
                        popularity: 400,
                    }),
                    item({
                        id: 10,
                        title: 'The Diplomat',
                        type: 'tv',
                        first_air_date: '2024-04-20',
                        popularity: 90,
                    }),
                ],
                streaming: [
                    item({
                        id: 12,
                        title: 'Fallout',
                        type: 'tv',
                        first_air_date: '2024-04-10',
                        popularity: 120,
                    }),
                ],
                cinema: [
                    item({
                        id: 13,
                        title: 'Un film al cinema',
                        type: 'movie',
                        release_date: '2026-09-10',
                        popularity: 80,
                    }),
                ],
            },
            now
        )

        expect(top.map((entry) => entry.title)).not.toContain('Taxi Driver')
        expect(top.map((entry) => entry.title)).toEqual(
            expect.arrayContaining(['The Diplomat', 'Fallout', 'Un film al cinema'])
        )
        expect(top).toHaveLength(3)
    })
})
