import { describe, expect, it } from 'vitest'
import { getPosterTransitionName } from '@/lib/view-transitions'

describe('view-transitions', () => {
    it('genera nomi univoci per tipo e id', () => {
        expect(getPosterTransitionName('movie', 42)).toBe('poster-movie-42')
        expect(getPosterTransitionName('tv', 99)).toBe('poster-tv-99')
    })
})
