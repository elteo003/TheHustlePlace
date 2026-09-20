export const TV_HIDDEN_PROFILES_KEY = 'thp_tv_hidden_profiles'

export function readHiddenTvProfileIds(raw: string | null | undefined): string[] {
    if (!raw) return []
    try {
        const parsed = JSON.parse(raw) as unknown
        if (!Array.isArray(parsed)) return []
        return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0 && id !== 'local')
    } catch {
        return []
    }
}

export function hideTvProfileId(hidden: string[], profileId: string): string[] {
    if (!profileId || profileId === 'local') return hidden
    if (hidden.indexOf(profileId) >= 0) return hidden
    return hidden.concat(profileId)
}

export function withoutHiddenTvProfiles<T extends { id?: string }>(profiles: T[], hidden: string[]): T[] {
    if (!hidden.length) return profiles
    const blocked: Record<string, true> = {}
    hidden.forEach((id) => {
        blocked[id] = true
    })
    return profiles.filter((profile) => !profile.id || !blocked[profile.id])
}
