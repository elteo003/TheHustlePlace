export type ContentType = 'movie' | 'tv'

export function getContentId(item: { id: number; tmdb_id?: number }): number {
    return item.tmdb_id ?? item.id
}

export function getPlayerPath(
    id: number,
    type: ContentType,
    options?: { season?: number; episode?: number; startAt?: number }
): string {
    const params = new URLSearchParams()
    if (options?.startAt != null && options.startAt > 0) {
        params.set('startAt', String(Math.floor(options.startAt)))
    }

    if (type === 'tv') {
        if (options?.season != null && options?.episode != null) {
            params.set('season', String(options.season))
            params.set('episode', String(options.episode))
            const query = params.toString()
            return query ? `/player/tv/${id}?${query}` : `/player/tv/${id}`
        }
        return `/series/${id}`
    }

    const query = params.toString()
    return query ? `/player/movie/${id}?${query}` : `/player/movie/${id}`
}

export function getDetailsPath(id: number, type: ContentType): string {
    return type === 'tv' ? `/series/${id}` : `/movie/${id}`
}

export function getSeriesPath(
    id: number | string,
    options?: { season?: number; episode?: number }
): string {
    if (options?.season != null && options?.episode != null) {
        return `/series/${id}?season=${options.season}&episode=${options.episode}`
    }
    return `/series/${id}`
}
