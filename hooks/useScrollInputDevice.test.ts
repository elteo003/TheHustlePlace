import { describe, expect, it } from 'vitest'
import { classifyWheelEvent } from './useScrollInputDevice'

describe('classifyWheelEvent', () => {
    it('rileva mouse con rotella quando deltaMode è per linee (DOM_DELTA_LINE = 1)', () => {
        expect(classifyWheelEvent({ deltaMode: 1, deltaX: 0, deltaY: 3 })).toBe('mouse')
    })

    it('rileva mouse con rotella su scatti interi tradizionali di 100/120px su deltaMode 0', () => {
        expect(classifyWheelEvent({ deltaMode: 0, deltaX: 0, deltaY: 100 })).toBe('mouse')
        expect(classifyWheelEvent({ deltaMode: 0, deltaX: 0, deltaY: -120 })).toBe('mouse')
    })

    it('rileva touchpad su valori subpixel frazionari', () => {
        expect(classifyWheelEvent({ deltaMode: 0, deltaX: 0, deltaY: 1.25 })).toBe('touchpad')
        expect(classifyWheelEvent({ deltaMode: 0, deltaX: 0.5, deltaY: 10 })).toBe('touchpad')
    })

    it('rileva touchpad su scorrimento continuo a bassa intensità o con componente orizzontale', () => {
        expect(classifyWheelEvent({ deltaMode: 0, deltaX: 4, deltaY: 12 })).toBe('touchpad')
        expect(classifyWheelEvent({ deltaMode: 0, deltaX: 0, deltaY: 15 })).toBe('touchpad')
    })
})
