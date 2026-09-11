import { ContentType } from '@/lib/content-navigation'
import { TvRailItem } from '@/tv/lib/types'

export function tvItemTitle(item: TvRailItem, type: ContentType = 'movie'): string {
    const movieTitle = item.title?.trim()
    const showName = item.name?.trim()
    const title = type === 'tv' ? showName || movieTitle : movieTitle || showName
    return title || 'Titolo non disponibile'
}
