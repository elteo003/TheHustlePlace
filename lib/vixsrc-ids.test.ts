import { describe, expect, it } from 'vitest'
import { contentTmdbId, collectVixsrcTmdbIds, filterByVixsrcIds } from './vixsrc-ids'

describe('vixsrc-ids', () => {
    it('usa tmdb_id quando presente', () => {
        expect(contentTmdbId({ id: 1, tmdb_id: 99 })).toBe(99)
        expect(contentTmdbId({ id: 7 })).toBe(7)
    })

    it('tiene solo i titoli presenti nel set vixsrc', () => {
        const ids = new Set([10, 20])
        const items = [
            { id: 10, title: 'a' },
            { id: 11, tmdb_id: 20, title: 'b' },
            { id: 30, title: 'c' },
        ]
        expect(filterByVixsrcIds(items, ids).map((item) => item.title)).toEqual(['a', 'b'])
    })

    it('scarta tmdb_id null o invalidi dalla lista vixsrc', () => {
        expect(
            collectVixsrcTmdbIds(
                [{ tmdb_id: null }, { tmdb_id: 1399 }, { tmdb_id: 0 }, { tmdb_id: 1396 }, { tmdb_id: 1399 }],
                20
            )
        ).toEqual([1399, 1396])
    })
})
