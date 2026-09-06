import { describe, expect, it } from 'vitest'
import { resolveIsCoarsePointer, resolveIsPhoneLandscape } from '@/hooks/useMediaQuery'

describe('resolveIsCoarsePointer', () => {
    it('e telefono se il pointer e coarse', () => {
        expect(resolveIsCoarsePointer(true, false)).toBe(true)
    })

    it('e telefono se non c e hover', () => {
        expect(resolveIsCoarsePointer(false, true)).toBe(true)
    })

    it('e desktop solo con hover fine e pointer fine', () => {
        expect(resolveIsCoarsePointer(false, false)).toBe(false)
    })
})

describe('resolveIsPhoneLandscape', () => {
    it('e landscape telefono solo se dito e altezza bassa', () => {
        expect(resolveIsPhoneLandscape(true, true)).toBe(true)
        expect(resolveIsPhoneLandscape(true, false)).toBe(false)
        expect(resolveIsPhoneLandscape(false, true)).toBe(false)
    })
})
