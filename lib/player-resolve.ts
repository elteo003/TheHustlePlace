export const PLAYER_RESOLVE_ATTEMPTS = 3
export const PLAYER_RESOLVE_RETRY_MS = 600

export type ResolvedPlayback = {
    master: string
    parts: Record<string, string>
    videoId?: number
}

export type PlayerResolveResult = {
    data?: ResolvedPlayback
    error: string
    missing: boolean
}

type ResolveJson = {
    success?: boolean
    error?: string
    data?: ResolvedPlayback
}

export function isRetryablePlayerResolveStatus(status: number): boolean {
    return status === 408 || status === 425 || status === 429 || status >= 500
}

export function isMissingVixsrcStreamError(error?: string): boolean {
    if (!error) return false
    const text = error.toLowerCase()
    return (
        text.includes('senza embed') ||
        text.includes("non trovata nell'embed") ||
        text.includes('tmdb id non valido') ||
        text.includes('stagione o episodio')
    )
}

function defaultWait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchResolvedPlayback(
    query: URLSearchParams,
    options?: {
        fetch?: typeof fetch
        wait?: (ms: number) => Promise<void>
        attempts?: number
    }
): Promise<PlayerResolveResult> {
    const fetchImpl = options?.fetch ?? fetch
    const wait = options?.wait ?? defaultWait
    const attempts = options?.attempts ?? PLAYER_RESOLVE_ATTEMPTS
    let error = 'Stream non disponibile'
    let missing = false

    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const response = await fetchImpl(`/api/player/resolve?${query.toString()}`)
            const json = (await response.json()) as ResolveJson
            if (response.ok && json.success && json.data?.master) {
                return { data: json.data, error: '', missing: false }
            }

            error = json.error || 'Stream non disponibile'
            missing = isMissingVixsrcStreamError(error)
            if (!isRetryablePlayerResolveStatus(response.status) || attempt === attempts) {
                return { error, missing }
            }
        } catch (caught) {
            error = caught instanceof Error ? caught.message : 'Stream non disponibile'
            missing = false
            if (attempt === attempts) {
                return { error, missing }
            }
        }

        await wait(PLAYER_RESOLVE_RETRY_MS * attempt)
    }

    return { error, missing }
}
