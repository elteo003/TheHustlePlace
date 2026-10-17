import { describe, expect, it } from 'vitest'
import { detectScrollDeviceType } from './useScrollInputDevice'

describe('detectScrollDeviceType', () => {
    it('rileva mouse tradizionale su deltaMode 1 (lines)', () => {
        expect(detectScrollDeviceType({ deltaMode: 1, deltaX: 0, deltaY: 3 })).toBe('mouse')
    })

    it('rileva mouse con rotella su scatti isolati tradizionali di 100/120px su deltaMode 0', () => {
        expect(
            detectScrollDeviceType({
                deltaMode: 0,
                deltaX: 0,
                deltaY: 100,
                timeDiff: 90,
                recentCount: 1,
            })
        ).toBe('mouse')
        expect(
            detectScrollDeviceType({
                deltaMode: 0,
                deltaX: 0,
                deltaY: -120,
                timeDiff: 80,
                recentCount: 1,
            })
        ).toBe('mouse')
    })

    it('rileva touchpad su valori subpixel frazionari', () => {
        expect(detectScrollDeviceType({ deltaMode: 0, deltaX: 0, deltaY: 1.25 })).toBe('touchpad')
        expect(detectScrollDeviceType({ deltaMode: 0, deltaX: 0.5, deltaY: 10 })).toBe('touchpad')
    })

    it('rileva touchpad su flusso rapido ad alta frequenza (<30ms tra eventi)', () => {
        expect(
            detectScrollDeviceType({
                deltaMode: 0,
                deltaX: 0,
                deltaY: 100,
                timeDiff: 16,
                recentCount: 4,
            })
        ).toBe('touchpad')
    })

    it('rileva touchpad su componente orizzontale fluida o micro-delta continuo', () => {
        expect(detectScrollDeviceType({ deltaMode: 0, deltaX: 5, deltaY: 12 })).toBe('touchpad')
        expect(detectScrollDeviceType({ deltaMode: 0, deltaX: 0, deltaY: 15 })).toBe('touchpad')
    })
})
