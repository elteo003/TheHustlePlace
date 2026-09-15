import { describe, expect, it } from 'vitest'
import { formatMediaTime } from '@/components/cinema-overlay'

describe('formatMediaTime', () => {
    it('formatta i secondi sotto l’ora', () => {
        expect(formatMediaTime(0)).toBe('0:00')
        expect(formatMediaTime(65)).toBe('1:05')
    })

    it('formatta le ore', () => {
        expect(formatMediaTime(3723)).toBe('1:02:03')
    })
})
