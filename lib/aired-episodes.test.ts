import { describe, expect, it } from 'vitest'
import { romeToday, selectAiredEpisodes, shiftIsoDate } from './aired-episodes'

const today = '2026-09-25'

function episode(episodeNumber: number, airDate: string) {
    return { episode_number: episodeNumber, air_date: airDate }
}

describe('selectAiredEpisodes', () => {
    it('toglie gli episodi con data futura e marca la coda recente', () => {
        const selected = selectAiredEpisodes(
            [
                episode(1, '2026-09-11'),
                episode(2, '2026-09-18'),
                episode(3, '2026-09-25'),
                episode(4, '2026-10-02'),
                episode(5, '2026-09-10'),
            ],
            today
        )

        expect(selected.map((item) => item.episode_number)).toEqual([1, 2, 3, 5])
        expect(selected.map((item) => item.needsProbe)).toEqual([true, true, true, false])
    })

    it('scarta gli slot senza data se la stagione ne ha ancora nel futuro', () => {
        const selected = selectAiredEpisodes(
            [episode(1, '2026-09-18'), episode(2, ''), episode(3, '2026-10-02')],
            today
        )

        expect(selected.map((item) => item.episode_number)).toEqual([1])
    })

    it('tiene gli episodi senza data su una stagione già conclusa', () => {
        const selected = selectAiredEpisodes(
            [episode(1, '2020-01-01'), episode(2, '')],
            today
        )

        expect(selected.map((item) => [item.episode_number, item.needsProbe])).toEqual([
            [1, false],
            [2, false],
        ])
    })
})

describe('romeToday', () => {
    it('usa il calendario di Roma', () => {
        expect(romeToday(new Date('2026-09-25T22:30:00Z'))).toBe('2026-09-26')
        expect(shiftIsoDate('2026-03-01', -14)).toBe('2026-02-15')
    })
})
