import { describe, expect, it } from 'vitest'
import {
    comingSoonWindow,
    excludeAvailableOnVixsrc,
    keepFutureReleases,
    keepNotableComingSoon,
    mergeComingSoon,
    sortComingSoonByDate,
    takeGlobalTrending,
} from './catalog-rails'

describe('catalog-rails', () => {
    it('prende i trending globali nell’ordine TMDB e ignora le persone', () => {
        const top = takeGlobalTrending(
            [
                { id: 1, media_type: 'person', name: 'Attore' },
                { id: 1396, media_type: 'tv', name: 'Breaking Bad' },
                { id: 550, media_type: 'movie', title: 'Fight Club' },
                { id: 1396, media_type: 'tv', name: 'Breaking Bad' },
                { id: 2, media_type: 'movie' },
            ],
            10
        )

        expect(top.map((item) => item.title)).toEqual(['Breaking Bad', 'Fight Club'])
        expect(top[0].type).toBe('tv')
        expect(top[1].type).toBe('movie')
    })

    it('toglie da In arrivo i titoli già su VixSrc', () => {
        const items = [
            { id: 10, title: 'Cinema', type: 'movie' as const },
            { id: 20, title: 'Serie', type: 'tv' as const },
            { id: 30, title: 'Futuro', type: 'movie' as const },
        ]

        expect(
            excludeAvailableOnVixsrc(items, new Set([10]), new Set([20])).map((item) => item.title)
        ).toEqual(['Futuro'])
    })

    it('non filtra In arrivo se la lista VixSrc è vuota', () => {
        const items = [{ id: 1, title: 'A', type: 'movie' as const }]
        expect(excludeAvailableOnVixsrc(items, new Set(), new Set())).toEqual(items)
    })

    it('unisce cinema e serie e ordina per data di uscita', () => {
        const merged = mergeComingSoon([
            {
                type: 'movie',
                items: [{ id: 1, title: 'Film dopo', release_date: '2026-11-01' }],
            },
            {
                type: 'tv',
                items: [{ id: 2, name: 'Serie prima', first_air_date: '2026-10-01' }],
            },
        ])

        expect(sortComingSoonByDate(merged).map((item) => item.title)).toEqual([
            'Serie prima',
            'Film dopo',
        ])
    })

    it('tiene solo le uscite dalla data odierna in poi', () => {
        const kept = keepFutureReleases(
            mergeComingSoon([
                { type: 'tv', items: [{ id: 1, name: 'Vecchia soap', first_air_date: '1960-12-09' }] },
                { type: 'movie', items: [{ id: 2, title: 'Film futuro', release_date: '2026-11-01' }] },
            ]),
            '2026-09-20'
        )
        expect(kept.map((item) => item.title)).toEqual(['Film futuro'])
    })

    it('scarta i micro-titoli senza popolarità', () => {
        const kept = keepNotableComingSoon(
            mergeComingSoon([
                { type: 'movie', items: [{ id: 1, title: 'Oscuro', popularity: 1.2, release_date: '2026-10-01' }] },
                { type: 'movie', items: [{ id: 2, title: 'Atteso', popularity: 40, release_date: '2026-10-02' }] },
            ]),
            10
        )
        expect(kept.map((item) => item.title)).toEqual(['Atteso'])
    })

    it('calcola una finestra di 90 giorni', () => {
        expect(comingSoonWindow(new Date('2026-09-20T12:00:00.000Z'))).toEqual({
            from: '2026-09-20',
            to: '2026-12-19',
        })
    })
})
