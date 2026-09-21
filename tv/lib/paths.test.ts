import { describe, expect, it } from 'vitest'
import {
    isLivingPath,
    isLivingPlayerPath,
    isWebosUserAgent,
    livingDetailsPath,
    livingHomePath,
    livingPlayerPath,
} from '@/tv/lib/paths'

describe('living paths', () => {
    it('costruisce le route TV', () => {
        expect(livingHomePath()).toBe('/living/home')
        expect(livingDetailsPath(12, 'tv')).toBe('/living/series/12')
        expect(livingDetailsPath(12, 'movie', { watchable: false })).toBe('/living/movie/12?watch=0')
        expect(livingPlayerPath(9, 'movie', { startAt: 40 })).toBe('/living/player/movie/9?startAt=40')
    })

    it('riconosce living e webOS', () => {
        expect(isLivingPath('/living/home')).toBe(true)
        expect(isLivingPlayerPath('/living/player/tv/1399')).toBe(true)
        expect(isLivingPlayerPath('/living/home')).toBe(false)
        expect(isLivingPath('/home')).toBe(false)
        expect(isWebosUserAgent('Mozilla/5.0 (Web0S; Linux/SmartTV)')).toBe(true)
        expect(isWebosUserAgent('Chrome')).toBe(false)
    })
})
