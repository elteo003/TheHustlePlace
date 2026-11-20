import { describe, expect, it } from 'vitest'
import { getContentTitle, resolveContentType, formatUpcomingReleaseDate } from '@/lib/content-display'
import { Movie, TVShow } from '@/types'

describe('content-display', () => {
    it('risolve il titolo per film e serie', () => {
        const movie: Movie = {
            id: 1,
            title: 'Inception',
            overview: '',
            release_date: '2010',
            vote_average: 8,
            vote_count: 100,
            genre_ids: [],
            adult: false,
            original_language: 'en',
            original_title: 'Inception',
            popularity: 1,
            video: false,
        }

        const show: TVShow = {
            id: 2,
            name: 'Breaking Bad',
            overview: '',
            first_air_date: '2008',
            vote_average: 9,
            vote_count: 200,
            genre_ids: [],
            adult: false,
            original_language: 'en',
            original_name: 'Breaking Bad',
            popularity: 2,
            origin_country: ['US'],
        }

        expect(getContentTitle(movie, 'movie')).toBe('Inception')
        expect(getContentTitle(show, 'tv')).toBe('Breaking Bad')
        expect(getContentTitle({ id: 3, title: 'The Office' } as Movie, 'tv')).toBe('The Office')
    })

    it('preferisce contentType sull item', () => {
        expect(resolveContentType({ contentType: 'tv' }, 'movie')).toBe('tv')
        expect(resolveContentType({ type: 'tv' }, 'movie')).toBe('tv')
        expect(resolveContentType({ media_type: 'tv' }, 'movie')).toBe('tv')
        expect(resolveContentType({ first_air_date: '2023-04-20', name: 'The Diplomat' }, 'movie')).toBe('tv')
        expect(resolveContentType({}, 'movie')).toBe('movie')
    })

    it('formatta correttamente le date di uscita per sezioni in arrivo', () => {
        const thisYear = formatUpcomingReleaseDate('2026-11-28', 2026)
        expect(thisYear).toEqual({
            day: 28,
            monthName: 'Novembre',
            year: 2026,
            isCurrentYear: true,
        })

        const nextYear = formatUpcomingReleaseDate('2027-05-04', 2026)
        expect(nextYear).toEqual({
            day: 4,
            monthName: 'Maggio',
            year: 2027,
            isCurrentYear: false,
        })

        const withTimestamp = formatUpcomingReleaseDate('2026-08-15T00:00:00.000Z', 2026)
        expect(withTimestamp).toEqual({
            day: 15,
            monthName: 'Agosto',
            year: 2026,
            isCurrentYear: true,
        })

        expect(formatUpcomingReleaseDate(null)).toBeNull()
        expect(formatUpcomingReleaseDate(undefined)).toBeNull()
        expect(formatUpcomingReleaseDate('invalid-date')).toBeNull()
        expect(formatUpcomingReleaseDate('2026-13-01')).toBeNull()
        expect(formatUpcomingReleaseDate('2026-00-10')).toBeNull()
        expect(formatUpcomingReleaseDate('2026-05-35')).toBeNull()
    })
})
