import { NextRequest, NextResponse } from 'next/server'
import { tmdbWrapperService } from '@/services/tmdb-wrapper.service'
import { CatalogService } from '@/services/catalog.service'
import { TMDBMovie } from '@/lib/tmdb'

const catalogService = new CatalogService()

export const dynamic = 'force-dynamic'

function hasYouTubePreview(videos: { site?: string; type?: string }[] | undefined): boolean {
    return Boolean(
        videos?.some(
            (video) =>
                video.site === 'YouTube' &&
                (video.type === 'Trailer' || video.type === 'Teaser')
        )
    )
}

function toHeroMovie(item: {
    id: number
    title?: string
    name?: string
    overview?: string
    poster_path?: string
    backdrop_path?: string
    release_date?: string
    first_air_date?: string
    vote_average?: number
    vote_count?: number
    popularity?: number
    adult?: boolean
    video?: boolean
    genre_ids?: number[]
    original_language?: string
    original_title?: string
    original_name?: string
    type: 'movie' | 'tv'
}): TMDBMovie {
    const title = item.title || item.name || 'Titolo non disponibile'
    return {
        id: item.id,
        title,
        original_title: item.original_title || item.original_name || title,
        overview: item.overview || '',
        poster_path: item.poster_path || null,
        backdrop_path: item.backdrop_path || null,
        release_date: item.release_date || item.first_air_date || '',
        vote_average: item.vote_average ?? 0,
        vote_count: item.vote_count ?? 0,
        popularity: item.popularity ?? 0,
        adult: item.adult ?? false,
        video: item.video ?? false,
        genre_ids: item.genre_ids ?? [],
        original_language: item.original_language || '',
        media_type: item.type,
        name: item.name || title,
        first_air_date: item.first_air_date,
    }
}

export async function GET(_request: NextRequest) {
    try {
        const trending = await catalogService.getGlobalTrending(20)

        if (!trending.length) {
            return NextResponse.json({
                success: false,
                error: 'Nessun titolo trending disponibile',
            }, { status: 404 })
        }

        const moviesWithTrailers: TMDBMovie[] = []

        for (const item of trending) {
            try {
                const videos =
                    item.type === 'tv'
                        ? await tmdbWrapperService.getTVShowVideos(item.id)
                        : await tmdbWrapperService.getMovieVideos(item.id)

                if (hasYouTubePreview(videos?.results)) {
                    moviesWithTrailers.push(toHeroMovie(item))
                    if (moviesWithTrailers.length >= 8) {
                        break
                    }
                }
            } catch {
                // passa al titolo successivo
            }
        }

        if (moviesWithTrailers.length === 0) {
            return NextResponse.json({
                success: true,
                data: trending.slice(0, 5).map(toHeroMovie),
                count: Math.min(5, trending.length),
            })
        }

        return NextResponse.json({
            success: true,
            data: moviesWithTrailers,
            count: moviesWithTrailers.length,
        })
    } catch (error) {
        console.error('Errore nel recupero trending con trailer:', error)

        return NextResponse.json({
            success: false,
            error: 'Errore interno del server',
        }, { status: 500 })
    }
}
