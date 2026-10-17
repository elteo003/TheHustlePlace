import { describe, expect, it } from 'vitest'
import {
    computeDaysUntil,
    formatCountdownBadge,
    formatItalianAirDate,
} from './tv-upcoming'

describe('tv-upcoming helpers', () => {
    it('computes days until future target date correctly', () => {
        expect(computeDaysUntil('2026-10-25', '2026-10-20')).toBe(5)
        expect(computeDaysUntil('2026-10-21', '2026-10-20')).toBe(1)
        expect(computeDaysUntil('2026-10-20', '2026-10-20')).toBe(0)
        expect(computeDaysUntil('2026-10-15', '2026-10-20')).toBe(-5)
    })

    it('formats Italian air dates properly', () => {
        expect(formatItalianAirDate('2026-10-24')).toBe('24 Ottobre')
        expect(formatItalianAirDate('2026-11-05')).toBe('5 Novembre')
        expect(formatItalianAirDate('2026-12-25')).toBe('25 Dicembre')
    })

    it('formats countdown badge text accurately', () => {
        expect(formatCountdownBadge(0, '20 Ottobre')).toBe('In onda oggi')
        expect(formatCountdownBadge(1, '21 Ottobre')).toBe('In onda domani')
        expect(formatCountdownBadge(4, '24 Ottobre')).toBe('Tra 4 giorni')
        expect(formatCountdownBadge(12, '1 Novembre')).toBe('In arrivo il 1 Novembre')
        expect(formatCountdownBadge(-2, '18 Ottobre')).toBe('Disponibile ora')
    })
})
