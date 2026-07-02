export type ContentType = 'movie' | 'tv'

export function getContentId(item: { id: number; tmdb_id?: number }): number {
    return item.tmdb_id ?? item.id
}

export function getPlayerPath(
    id: number,
    type: ContentType,
    options?: { season?: number; episode?: number }
): string {
    if (type === 'tv') {
        if (options?.season != null && options?.episode != null) {
            return `/player/tv/${id}?season=${options.season}&episode=${options.episode}`
        }
        return `/series/${id}`
    }
    return `/player/movie/${id}`
}

export function getDetailsPath(id: number, type: ContentType): string {
    return type === 'tv' ? `/series/${id}` : `/movie/${id}`
}
