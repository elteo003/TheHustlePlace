const BROWSE_KEY = 'thp_last_browse'

function pathnameOf(path: string): string {
    return path.split('?')[0] || '/'
}

export function isBrowsePath(path: string): boolean {
    const pathname = pathnameOf(path)
    if (pathname === '/' || pathname === '') return false
    if (pathname.startsWith('/player/')) return false
    if (pathname.startsWith('/series/')) return false
    return true
}

export function rememberBrowsePath(path: string): void {
    if (typeof window === 'undefined') return
    if (!isBrowsePath(path)) return
    try {
        sessionStorage.setItem(BROWSE_KEY, path)
    } catch {
        // quota / privacy mode
    }
}

export function getLastBrowsePath(): string | null {
    if (typeof window === 'undefined') return null
    try {
        const value = sessionStorage.getItem(BROWSE_KEY)
        return value && isBrowsePath(value) ? value : null
    } catch {
        return null
    }
}

export function resolvePlayerExit(lastBrowse: string | null, fallback = '/home'): string {
    return lastBrowse && isBrowsePath(lastBrowse) ? lastBrowse : fallback
}
