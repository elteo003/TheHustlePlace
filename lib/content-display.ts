import { ContentType } from '@/lib/content-navigation'
import { Movie, TVShow } from '@/types'
import { getTMDBImageUrl } from '@/lib/tmdb'

export type ContentItem = (Movie | TVShow) & {
    contentType?: ContentType
    tmdb_id?: number
}

export function getContentTitle(item: ContentItem, type: ContentType = 'movie'): string {
    if (type === 'tv') {
        return (item as TVShow).name || 'Titolo non disponibile'
    }
    return (item as Movie).title || 'Titolo non disponibile'
}

export function resolveContentType(
    item: ContentItem,
    fallback: ContentType = 'movie'
): ContentType {
    return item.contentType ?? fallback
}

export function getContentPosterUrl(path?: string | null, size: 'w500' | 'w780' | 'original' = 'w500') {
    if (!path || path === '/placeholder-movie.svg') {
        return '/placeholder-movie.svg'
    }
    return getTMDBImageUrl(path, size)
}
