import { MAX_PACKED_AVATAR } from '@/tv/lib/avatars'

export const MAX_HOUSEHOLD_PROFILES = 5
export const PLACEHOLDER_PROFILE_NAME = 'Profilo 1'
export const PROFILE_NAME_MAX = 16

export function isPlaceholderProfile(profile: { name: string; historyCount?: number }): boolean {
    return profile.name.trim() === PLACEHOLDER_PROFILE_NAME && (profile.historyCount ?? 0) === 0
}

export function visibleHouseholdProfiles<T extends { id?: string; name: string; historyCount?: number }>(
    profiles: T[]
): T[] {
    const withoutGuest = profiles.filter((profile) => profile.id !== 'local')
    if (withoutGuest.length === 0) return profiles
    const named = withoutGuest.filter((profile) => {
        if (profile.historyCount == null) return true
        return !isPlaceholderProfile(profile)
    })
    return named.length > 0 ? named : withoutGuest
}

export function shouldJoinCanonicalHousehold(currentNamed: number, canonicalNamed: number): boolean {
    return currentNamed === 0 && canonicalNamed > 0
}

export function canAddHouseholdProfile(count: number): boolean {
    return count < MAX_HOUSEHOLD_PROFILES
}

export function canDeleteHouseholdProfile(count: number): boolean {
    return count > 1
}

export type AdoptStrategy = 'switch' | 'join-target' | 'pair-device' | 'add-profile' | 'full'

export function decideAdoptStrategy(input: {
    alreadyInHousehold: boolean
    currentNamed: number
    currentCount: number
    targetNamed: number
    targetIsPlaceholder: boolean
    canReplacePlaceholder: boolean
}): AdoptStrategy {
    if (input.alreadyInHousehold) return 'switch'
    if (input.targetNamed > input.currentNamed) return 'join-target'
    if (input.targetIsPlaceholder) return 'pair-device'
    if (input.canReplacePlaceholder || canAddHouseholdProfile(input.currentCount)) return 'add-profile'
    return 'full'
}

export function sanitizeProfileName(input: string): string {
    return input.replace(/\s+/g, ' ').trim().slice(0, PROFILE_NAME_MAX)
}

export function clampAvatar(value: number): number {
    if (!Number.isFinite(value)) return 0
    return Math.max(0, Math.min(MAX_PACKED_AVATAR, Math.floor(value)))
}
