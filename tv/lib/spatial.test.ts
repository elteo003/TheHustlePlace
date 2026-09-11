import { describe, expect, it } from 'vitest'
import { keyToSpatialDir, pickSpatialTarget } from '@/tv/lib/spatial'

describe('spatial nav', () => {
    const origin = { x: 100, y: 100, w: 80, h: 80 }
    const right = { id: 'right', rect: { x: 220, y: 100, w: 80, h: 80 } }
    const down = { id: 'down', rect: { x: 100, y: 220, w: 80, h: 80 } }
    const farDownRight = { id: 'far', rect: { x: 400, y: 300, w: 80, h: 80 } }

    it('sceglie il vicino nella direzione', () => {
        expect(pickSpatialTarget(origin, [right, down, farDownRight], 'right')).toBe('right')
        expect(pickSpatialTarget(origin, [right, down, farDownRight], 'down')).toBe('down')
    })

    it('non torna indietro', () => {
        expect(pickSpatialTarget(origin, [right], 'left')).toBeNull()
    })

    it('mappa i tasti freccia', () => {
        expect(keyToSpatialDir('ArrowRight')).toBe('right')
        expect(keyToSpatialDir('Enter')).toBeNull()
    })
})
