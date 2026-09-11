import { describe, expect, it } from 'vitest'
import {
    canAddHouseholdProfile,
    clampAvatar,
    isPlaceholderProfile,
    sanitizeProfileName,
} from '@/tv/lib/household-rules'

describe('household-rules', () => {
    it('limita a 5 profili', () => {
        expect(canAddHouseholdProfile(4)).toBe(true)
        expect(canAddHouseholdProfile(5)).toBe(false)
    })

    it('riconosce il placeholder vuoto', () => {
        expect(isPlaceholderProfile({ name: 'Profilo 1', historyCount: 0 })).toBe(true)
        expect(isPlaceholderProfile({ name: 'Mattia', historyCount: 0 })).toBe(false)
        expect(isPlaceholderProfile({ name: 'Profilo 1', historyCount: 2 })).toBe(false)
    })

    it('pulisce il nome', () => {
        expect(sanitizeProfileName('  Anna  Maria  ')).toBe('Anna Maria')
        expect(sanitizeProfileName('x'.repeat(30))).toHaveLength(16)
    })

    it('blocca l’avatar tra 0 e 7', () => {
        expect(clampAvatar(3)).toBe(3)
        expect(clampAvatar(-1)).toBe(0)
        expect(clampAvatar(99)).toBe(7)
    })
})
