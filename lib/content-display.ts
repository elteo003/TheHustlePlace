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
    item: {
        contentType?: ContentType
        type?: ContentType
        media_type?: string
        first_air_date?: string
        name?: string
        title?: string
    },
    fallback: ContentType = 'movie'
): ContentType {
    if (item.contentType === 'movie' || item.contentType === 'tv') {
        return item.contentType
    }
    if (item.type === 'movie' || item.type === 'tv') {
        return item.type
    }
    if (item.media_type === 'movie' || item.media_type === 'tv') {
        return item.media_type
    }
    if (item.first_air_date !== undefined || (item.name !== undefined && !item.title)) {
        return 'tv'
    }
    return fallback
}

export function getContentPosterUrl(path?: string | null, size: 'w500' | 'w780' | 'w1280' | 'original' = 'w500') {
    if (!path || path === '/placeholder-movie.svg') {
        return '/placeholder-movie.svg'
    }
    return getTMDBImageUrl(path, size)
}

export interface UpcomingReleaseInfo {
    day: number
    monthName: string
    year: number
    isCurrentYear: boolean
}

export function formatUpcomingReleaseDate(
    rawDate?: string | null,
    currentYear: number = new Date().getFullYear()
): UpcomingReleaseInfo | null {
    if (!rawDate) return null
    const cleanDate = rawDate.slice(0, 10)
    const parts = cleanDate.split('-')
    if (parts.length < 3) return null
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    const day = parseInt(parts[2], 10)
    if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) return null

    const months = [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ]
    const monthName = months[month - 1] || ''

    return {
        day,
        monthName,
        year,
        isCurrentYear: year === currentYear,
    }
}
