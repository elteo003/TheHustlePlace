export const MAX_HOUSEHOLD_PROFILES = 5
export const PLACEHOLDER_PROFILE_NAME = 'Profilo 1'
export const PROFILE_NAME_MAX = 16

export function isPlaceholderProfile(profile: { name: string; historyCount?: number }): boolean {
    return profile.name.trim() === PLACEHOLDER_PROFILE_NAME && (profile.historyCount ?? 0) === 0
}

export function canAddHouseholdProfile(count: number): boolean {
    return count < MAX_HOUSEHOLD_PROFILES
}

export function sanitizeProfileName(input: string): string {
    return input.replace(/\s+/g, ' ').trim().slice(0, PROFILE_NAME_MAX)
}

export function clampAvatar(value: number): number {
    if (!Number.isFinite(value)) return 0
    return Math.max(0, Math.min(7, Math.floor(value)))
}
