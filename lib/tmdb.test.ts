import { describe, expect, it } from 'vitest'
import { findMainTrailer, type TMDBVideo } from '@/lib/tmdb'

function video(partial: Partial<TMDBVideo> & Pick<TMDBVideo, 'key' | 'iso_639_1'>): TMDBVideo {
    return {
        id: partial.key,
        iso_3166_1: 'US',
        name: partial.key,
        official: true,
        published_at: '2024-01-01',
        site: 'YouTube',
        size: 1080,
        type: 'Trailer',
        ...partial,
    }
}

describe('findMainTrailer', () => {
    it('preferisce il trailer ufficiale italiano al primo ufficiale inglese', () => {
        const selected = findMainTrailer([
            video({ key: 'en-official', iso_639_1: 'en' }),
            video({ key: 'it-official', iso_639_1: 'it' }),
        ])

        expect(selected?.key).toBe('it-official')
    })

    it('prende l\'italiano non ufficiale prima dell\'inglese ufficiale', () => {
        const selected = findMainTrailer([
            video({ key: 'en-official', iso_639_1: 'en', official: true }),
            video({ key: 'it-unofficial', iso_639_1: 'it', official: false }),
        ])

        expect(selected?.key).toBe('it-unofficial')
    })

    it('riconosce l\'italiano dal titolo anche se iso_639_1 è inglese', () => {
        const selected = findMainTrailer([
            video({ key: 'en-official', iso_639_1: 'en', name: 'Official Trailer' }),
            video({ key: 'it-named', iso_639_1: 'en', name: 'Trailer Ufficiale Italiano' }),
        ])

        expect(selected?.key).toBe('it-named')
    })

    it('ignora i clip non YouTube e i tipi diversi da trailer/teaser', () => {
        const selected = findMainTrailer([
            video({ key: 'clip', iso_639_1: 'it', type: 'Clip' }),
            video({ key: 'vimeo', iso_639_1: 'it', site: 'Vimeo' }),
            video({ key: 'en-fallback', iso_639_1: 'en' }),
        ])

        expect(selected?.key).toBe('en-fallback')
    })
})
