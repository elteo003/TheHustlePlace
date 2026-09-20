import { describe, expect, it } from 'vitest'
import {
    canAddHouseholdProfile,
    canDeleteHouseholdProfile,
    clampAvatar,
    isPlaceholderProfile,
    sanitizeProfileName,
    decideAdoptStrategy,
    shouldJoinCanonicalHousehold,
    visibleHouseholdProfiles,
} from '@/tv/lib/household-rules'
import { MAX_PACKED_AVATAR, packAvatar, unpackAvatar } from '@/tv/lib/avatars'

describe('household-rules', () => {
    it('limita a 5 profili', () => {
        expect(canAddHouseholdProfile(4)).toBe(true)
        expect(canAddHouseholdProfile(5)).toBe(false)
    })

    it('non cancella l’unico profilo rimasto', () => {
        expect(canDeleteHouseholdProfile(1)).toBe(false)
        expect(canDeleteHouseholdProfile(2)).toBe(true)
    })

    it('riconosce il placeholder vuoto', () => {
        expect(isPlaceholderProfile({ name: 'Profilo 1', historyCount: 0 })).toBe(true)
        expect(isPlaceholderProfile({ name: 'Mattia', historyCount: 0 })).toBe(false)
        expect(isPlaceholderProfile({ name: 'Profilo 1', historyCount: 2 })).toBe(false)
    })

    it('nasconde solo l’ospite finto quando ci sono profili veri', () => {
        expect(
            visibleHouseholdProfiles([
                { id: 'local', name: 'Ospite' },
                { id: 'a', name: 'Mattia' },
            ]).map((item) => item.name)
        ).toEqual(['Mattia'])
        expect(visibleHouseholdProfiles([{ id: 'local', name: 'Ospite' }])).toEqual([
            { id: 'local', name: 'Ospite' },
        ])
        expect(
            visibleHouseholdProfiles([
                { id: 'p1', name: 'Profilo 1' },
                { id: 'a', name: 'Papà' },
            ]).map((item) => item.name)
        ).toEqual(['Profilo 1', 'Papà'])
        expect(
            visibleHouseholdProfiles([
                { id: 'p1', name: 'Profilo 1', historyCount: 0 },
                { id: 'a', name: 'Papà' },
            ]).map((item) => item.name)
        ).toEqual(['Papà'])
    })

    it('attacca un device orfano alla casa con i profili veri', () => {
        expect(shouldJoinCanonicalHousehold(0, 4)).toBe(true)
        expect(shouldJoinCanonicalHousehold(4, 4)).toBe(false)
        expect(shouldJoinCanonicalHousehold(0, 0)).toBe(false)
    })

    it('Unisci entra nella casa più ricca o aggiunge il profilo', () => {
        expect(
            decideAdoptStrategy({
                alreadyInHousehold: false,
                currentNamed: 0,
                currentCount: 1,
                targetNamed: 4,
                targetIsPlaceholder: false,
                canReplacePlaceholder: true,
            })
        ).toBe('join-target')
        expect(
            decideAdoptStrategy({
                alreadyInHousehold: false,
                currentNamed: 4,
                currentCount: 4,
                targetNamed: 1,
                targetIsPlaceholder: false,
                canReplacePlaceholder: false,
            })
        ).toBe('add-profile')
        expect(
            decideAdoptStrategy({
                alreadyInHousehold: false,
                currentNamed: 4,
                currentCount: 4,
                targetNamed: 0,
                targetIsPlaceholder: true,
                canReplacePlaceholder: false,
            })
        ).toBe('pair-device')
        expect(
            decideAdoptStrategy({
                alreadyInHousehold: true,
                currentNamed: 4,
                currentCount: 4,
                targetNamed: 4,
                targetIsPlaceholder: false,
                canReplacePlaceholder: false,
            })
        ).toBe('switch')
        expect(
            decideAdoptStrategy({
                alreadyInHousehold: false,
                currentNamed: 5,
                currentCount: 5,
                targetNamed: 1,
                targetIsPlaceholder: false,
                canReplacePlaceholder: false,
            })
        ).toBe('full')
    })

    it('pulisce il nome', () => {
        expect(sanitizeProfileName('  Anna  Maria  ')).toBe('Anna Maria')
        expect(sanitizeProfileName('x'.repeat(30))).toHaveLength(16)
    })

    it('blocca l’avatar nel range colore + personaggio', () => {
        expect(clampAvatar(3)).toBe(3)
        expect(clampAvatar(-1)).toBe(0)
        expect(clampAvatar(99)).toBe(MAX_PACKED_AVATAR)
        expect(unpackAvatar(packAvatar(2, 1))).toEqual({ color: 2, art: 1 })
        expect(packAvatar(3, 0)).toBe(3)
    })
})
