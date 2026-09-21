import { describe, expect, it } from 'vitest'
import {
    PLATFORM_CHARTS,
    moviesTitleFor,
    platformOn,
    seriesTitleFor,
    weavePlatformTop10s,
} from './platform-top10'

describe('platform-top10', () => {
    it('ruota la piattaforma ogni giorno e resta stabile nello stesso giorno', () => {
        const monday = new Date('2026-09-21T10:00:00.000Z')
        const tuesday = new Date('2026-09-22T10:00:00.000Z')
        const sameMonday = new Date('2026-09-21T18:00:00.000Z')

        expect(platformOn(monday)).toEqual(platformOn(sameMonday))
        expect(platformOn(tuesday).slug).not.toBe(platformOn(monday).slug)
        expect(PLATFORM_CHARTS).toHaveLength(7)
        expect(new Set(PLATFORM_CHARTS.map((platform) => platform.tmdbProviderId)).size).toBe(7)
        expect(seriesTitleFor(platformOn(monday))).toMatch(/^Top 10 serie TV da /)
        expect(moviesTitleFor(platformOn(monday))).toMatch(/^Top 10 film da /)
    })

    it('inserisce le top 10 di piattaforma dopo 4 scaffali visibili, poi dopo altri 4, con In arrivo in coda', () => {
        const rails = [
            { id: 'picks', title: 'Scelti per te oggi', items: [1] },
            { id: 'top', title: 'Top 10 Titoli Oggi', items: [1] },
            { id: 'aff', title: 'Pensiamo ti appassioneranno', items: [1] },
            { id: 'mov', title: 'Film Popolari', items: [1] },
            { id: 'trec', title: 'Serie TV Recenti', items: [1] },
            { id: 'tre', title: 'Tesori per te', items: [1] },
            { id: 'war', title: 'Guerra e politica', items: [1] },
            { id: 'med', title: 'Il medio evo che ti appassiona', items: [1] },
            { id: 'puz', title: 'Indagini rompicapo', items: [1] },
            { id: 'mys', title: 'I capolavori del mistero', items: [1] },
            { id: 'cine', title: 'Presto al cinema', items: [1] },
            { id: 'soon', title: 'In arrivo', items: [1] },
        ]
        const weaved = weavePlatformTop10s(rails, [
            { id: 'platform-top10-tv', title: 'Top 10 serie TV da Netflix', items: [1, 2] },
            { id: 'platform-top10-movie', title: 'Top 10 film da Netflix', items: [1, 2] },
        ])

        expect(weaved.map((rail) => rail.id)).toEqual([
            'picks',
            'top',
            'aff',
            'mov',
            'trec',
            'tre',
            'platform-top10-tv',
            'war',
            'med',
            'puz',
            'mys',
            'platform-top10-movie',
            'cine',
            'soon',
        ])
    })

    it('salta gli inserti vuoti e non conta gli scaffali senza titoli', () => {
        const rails = [
            { id: 'top', title: 'Top 10', items: [1] },
            { id: 'a', title: 'A', items: [1] },
            { id: 'b', title: 'B', items: [1] },
            { id: 'cine', title: 'Presto al cinema', items: [1] },
            { id: 'soon', title: 'In arrivo', items: [1] },
        ]
        const weaved = weavePlatformTop10s(rails, [
            { id: 'platform-top10-tv', title: 'Top 10 serie TV da Max', items: [] },
            { id: 'platform-top10-movie', title: 'Top 10 film da Max', items: [1] },
        ])
        expect(weaved.map((rail) => rail.id)).toEqual([
            'top',
            'a',
            'b',
            'platform-top10-movie',
            'cine',
            'soon',
        ])
    })
})
