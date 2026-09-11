export const TV_AVATARS = [
    { bg: '#2563eb', label: 'Blu' },
    { bg: '#db2777', label: 'Rosa' },
    { bg: '#16a34a', label: 'Verde' },
    { bg: '#ca8a04', label: 'Giallo' },
    { bg: '#7c3aed', label: 'Viola' },
    { bg: '#ea580c', label: 'Arancio' },
    { bg: '#0d9488', label: 'Teal' },
    { bg: '#e11d48', label: 'Rosso' },
] as const

export const TV_AVATAR_ART = [
    { file: 'avatar-howard.png', name: 'Howard Ratner' },
    { file: 'avatar-vader.png', name: 'Darth Vader' },
    { file: 'avatar-strange.png', name: 'Doctor Strange' },
    { file: 'avatar-paul-chani.png', name: 'Paul e Chani' },
    { file: 'avatar-fremen.png', name: 'Fremen' },
    { file: 'avatar-paul-walk.png', name: "Muad'Dib" },
] as const

export const AVATAR_COLOR_COUNT = TV_AVATARS.length

/** packed = color + art * 8. art 0 = iniziale, 1..n = personaggio */
export const MAX_PACKED_AVATAR = AVATAR_COLOR_COUNT * (TV_AVATAR_ART.length + 1) - 1

export function unpackAvatar(packed: number): { color: number; art: number } {
    const n = Number.isFinite(packed) ? Math.floor(packed) : 0
    const color = ((n % AVATAR_COLOR_COUNT) + AVATAR_COLOR_COUNT) % AVATAR_COLOR_COUNT
    const art = Math.max(0, Math.floor(n / AVATAR_COLOR_COUNT))
    return { color, art: Math.min(art, TV_AVATAR_ART.length) }
}

export function packAvatar(color: number, art: number): number {
    const safeColor = Math.max(0, Math.min(AVATAR_COLOR_COUNT - 1, Math.floor(color) || 0))
    const safeArt = Math.max(0, Math.min(TV_AVATAR_ART.length, Math.floor(art) || 0))
    return safeColor + safeArt * AVATAR_COLOR_COUNT
}

export function avatarColor(index: number): string {
    const { color } = unpackAvatar(index)
    return TV_AVATARS[color]?.bg ?? TV_AVATARS[0].bg
}

export function avatarArtSrc(index: number): string | null {
    const { art } = unpackAvatar(index)
    if (art <= 0) return null
    const item = TV_AVATAR_ART[art - 1]
    return item ? `/avatars/${item.file}` : null
}

export function avatarInitial(name: string): string {
    const trimmed = name.trim()
    return trimmed ? trimmed[0]!.toUpperCase() : '?'
}
