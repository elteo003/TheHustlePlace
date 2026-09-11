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

export function avatarColor(index: number): string {
    return TV_AVATARS[index]?.bg ?? TV_AVATARS[0].bg
}

export function avatarInitial(name: string): string {
    const trimmed = name.trim()
    return trimmed ? trimmed[0]!.toUpperCase() : '?'
}
