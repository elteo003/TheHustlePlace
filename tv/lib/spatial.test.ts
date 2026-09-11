import { describe, expect, it } from 'vitest'
import { isActivateKey, keyToSpatialDir, pickSpatialTarget } from '@/tv/lib/spatial'

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

    it('mappa i tasti webOS (nomi vecchi e keyCode)', () => {
        expect(keyToSpatialDir('Right')).toBe('right')
        expect(keyToSpatialDir('Left')).toBe('left')
        expect(keyToSpatialDir('Up')).toBe('up')
        expect(keyToSpatialDir('Down')).toBe('down')
        expect(keyToSpatialDir('Unidentified', 39)).toBe('right')
        expect(keyToSpatialDir('', 37)).toBe('left')
        expect(keyToSpatialDir('', 13)).toBeNull()
        expect(isActivateKey('Enter')).toBe(true)
        expect(isActivateKey('Unidentified', 13)).toBe(true)
        expect(isActivateKey('Select')).toBe(true)
        expect(isActivateKey('Unidentified', 23)).toBe(true)
        expect(isActivateKey('ArrowRight')).toBe(false)
    })
})
