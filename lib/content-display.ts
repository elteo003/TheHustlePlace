import { ContentType } from '@/lib/content-navigation'
import { Movie, TVShow } from '@/types'
import { getTMDBImageUrl } from '@/lib/tmdb'

export type ContentItem = (Movie | TVShow) & {
    contentType?: ContentType
    tmdb_id?: number
}

export function getContentTitle(item: ContentItem, type: ContentType = 'movie'): string {
    const movieTitle = (item as Movie).title?.trim()
    const showName = (item as TVShow).name?.trim()
    const title = type === 'tv' ? showName || movieTitle : movieTitle || showName
    return title || 'Titolo non disponibile'
}

export function resolveContentType(
    item: { contentType?: ContentType; type?: ContentType },
    fallback: ContentType = 'movie'
): ContentType {
    return item.contentType ?? item.type ?? fallback
}

export function getContentPosterUrl(path?: string | null, size: 'w500' | 'w780' | 'original' = 'w500') {
    if (!path || path === '/placeholder-movie.svg') {
        return '/placeholder-movie.svg'
    }
    return getTMDBImageUrl(path, size)
}
