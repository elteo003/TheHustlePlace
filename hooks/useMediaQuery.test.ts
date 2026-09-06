import { describe, expect, it } from 'vitest'
import { resolveIsCoarsePointer } from '@/hooks/useMediaQuery'

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
