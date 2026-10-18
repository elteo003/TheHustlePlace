import { describe, expect, it } from 'vitest'
import {
    computeDaysUntil,
    formatCountdownBadge,
    formatItalianAirDate,
    mapDetailsToUpcomingItem,
} from './tv-upcoming'

describe('tv-upcoming helpers', () => {
    it('computes days until future target date correctly', () => {
        expect(computeDaysUntil('2026-10-25', '2026-10-20')).toBe(5)
        expect(computeDaysUntil('2026-10-21', '2026-10-20')).toBe(1)
        expect(computeDaysUntil('2026-10-20', '2026-10-20')).toBe(0)
        expect(computeDaysUntil('2026-10-15', '2026-10-20')).toBe(-5)
    })

    it('formats Italian air dates properly', () => {
        expect(formatItalianAirDate('2026-10-24')).toBe('24 Ottobre')
        expect(formatItalianAirDate('2026-11-05')).toBe('5 Novembre')
        expect(formatItalianAirDate('2026-12-25')).toBe('25 Dicembre')
    })

    it('formats countdown badge text accurately', () => {
        expect(formatCountdownBadge(0, '20 Ottobre')).toBe('In onda oggi')
        expect(formatCountdownBadge(1, '21 Ottobre')).toBe('In onda domani')
        expect(formatCountdownBadge(4, '24 Ottobre')).toBe('Tra 4 giorni')
        expect(formatCountdownBadge(12, '1 Novembre')).toBe('In arrivo il 1 Novembre')
        expect(formatCountdownBadge(-2, '18 Ottobre')).toBe('Disponibile ora')
        expect(formatCountdownBadge(999, 'Data da annunciare')).toBe('Nuova stagione confermata')
    })

    it('returns 999 for pending air date in computeDaysUntil', () => {
        expect(computeDaysUntil('', '2026-10-20')).toBe(999)
    })
})

describe('mapDetailsToUpcomingItem', () => {
    const baseDetails = {
        id: 101,
        name: 'Test Show',
        original_name: 'Test Show',
        overview: 'Overview test',
        poster_path: '/poster.jpg',
        backdrop_path: '/backdrop.jpg',
        first_air_date: '2024-01-01',
        vote_average: 8.5,
        vote_count: 500,
        popularity: 120,
        adult: false,
        video: false,
        genre_ids: [18],
        original_language: 'en',
        origin_country: ['US'],
        status: 'Returning Series',
        number_of_seasons: 2,
        number_of_episodes: 20,
        genres: [{ id: 18, name: 'Drama' }],
    }

    it('rejects series that are only "Returning Series" or "In Production" without a scheduled air date', () => {
        const detailsWithoutAirDate = {
            ...baseDetails,
            status: 'Returning Series',
            next_episode_to_air: null,
            seasons: [
                { id: 1, name: 'Season 1', air_date: '2023-01-01', episode_count: 10, season_number: 1 },
                { id: 2, name: 'Season 2', air_date: '2024-01-01', episode_count: 10, season_number: 2 },
            ],
        }

        // Even if followed, without a future air date it MUST return null (no dummy "Nuova stagione confermata")
        const result = mapDetailsToUpcomingItem(detailsWithoutAirDate, true, { season: 2, episode: 10 }, '2026-10-20')
        expect(result).toBeNull()
    })

    it('accepts series with next_episode_to_air on or after today', () => {
        const detailsWithUpcomingEp = {
            ...baseDetails,
            next_episode_to_air: {
                id: 501,
                name: 'The Next Battle',
                overview: 'Things get intense.',
                vote_average: 0,
                vote_count: 0,
                air_date: '2026-10-25',
                episode_number: 5,
                season_number: 3,
                show_id: 101,
                still_path: '/ep5.jpg',
            },
        }

        const result = mapDetailsToUpcomingItem(detailsWithUpcomingEp, true, { season: 3, episode: 4 }, '2026-10-20')
        expect(result).not.toBeNull()
        expect(result?.nextEpisode.season).toBe(3)
        expect(result?.nextEpisode.episode).toBe(5)
        expect(result?.nextEpisode.airDate).toBe('2026-10-25')
        expect(result?.nextEpisode.daysUntil).toBe(5)
        expect(result?.nextEpisode.countdownBadge).toBe('Tra 5 giorni')
        expect(result?.nextEpisode.isAvailable).toBe(false)
    })

    it('accepts series with a future season air date', () => {
        const detailsWithUpcomingSeason = {
            ...baseDetails,
            next_episode_to_air: null,
            seasons: [
                { id: 1, name: 'Stagione 1', air_date: '2024-01-01', episode_count: 10, season_number: 1 },
                { id: 2, name: 'Stagione 2', air_date: '2026-11-15', episode_count: 8, season_number: 2 },
            ],
        }

        const result = mapDetailsToUpcomingItem(detailsWithUpcomingSeason, false, undefined, '2026-10-20')
        expect(result).not.toBeNull()
        expect(result?.nextEpisode.season).toBe(2)
        expect(result?.nextEpisode.episode).toBe(1)
        expect(result?.nextEpisode.airDate).toBe('2026-11-15')
        expect(result?.nextEpisode.countdownBadge).toBe('In arrivo il 15 Novembre')
    })

    it('accepts brand new unreleased series with first_air_date in the future', () => {
        const brandNewShow = {
            ...baseDetails,
            first_air_date: '2026-11-01',
            status: 'In Production',
            next_episode_to_air: null,
            seasons: [],
        }

        const result = mapDetailsToUpcomingItem(brandNewShow, false, undefined, '2026-10-20')
        expect(result).not.toBeNull()
        expect(result?.nextEpisode.season).toBe(1)
        expect(result?.nextEpisode.episode).toBe(1)
        expect(result?.nextEpisode.airDate).toBe('2026-11-01')
        expect(result?.nextEpisode.countdownBadge).toBe('In arrivo il 1 Novembre')
    })

    it('rejects excluded genres like Talk, News, Reality, or Soap', () => {
        const talkShow = {
            ...baseDetails,
            genres: [{ id: 10767, name: 'Talk' }],
            next_episode_to_air: {
                id: 999,
                name: 'Tonight',
                overview: '',
                vote_average: 0,
                vote_count: 0,
                air_date: '2026-10-21',
                episode_number: 10,
                season_number: 1,
                show_id: 101,
                still_path: null,
            },
        }

        const result = mapDetailsToUpcomingItem(talkShow, false, undefined, '2026-10-20')
        expect(result).toBeNull()
    })
})
