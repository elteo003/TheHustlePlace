/**
 * Helper per chiamate API TMDB
 * Centralizza la configurazione e gestione delle richieste
 */

export interface TMDBResponse<T> {
    page: number
    results: T[]
    total_pages: number
    total_results: number
}

export interface TMDBMovie {
    id: number
    title: string
    original_title: string
    overview: string
    poster_path: string | null
    backdrop_path: string | null
    release_date: string
    vote_average: number
    vote_count: number
    popularity: number
    adult: boolean
    video: boolean
    genre_ids: number[]
    original_language: string
}

export interface TMDBTVShow {
    id: number
    name: string
    original_name: string
    overview: string
    poster_path: string | null
    backdrop_path: string | null
    first_air_date: string
    vote_average: number
    vote_count: number
    popularity: number
    adult: boolean
    video: boolean
    genre_ids: number[]
    original_language: string
    origin_country: string[]
}

export interface TMDBVideo {
    id: string
    iso_639_1: string
    iso_3166_1: string
    key: string
    name: string
    official: boolean
    published_at: string
    site: string
    size: number
    type: string
}

export interface TMDBVideosResponse {
    id: number
    results: TMDBVideo[]
}

/**
 * Funzione helper per chiamate API TMDB
 * @param endpoint - Endpoint TMDB (es. 'trending/movie/day')
 * @returns Promise con i dati della risposta
 */
export async function fetchFromTMDB<T>(endpoint: string): Promise<T> {
    const apiKey = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY

    if (!apiKey) {
        throw new Error('TMDB_API_KEY non configurata')
    }

    const baseUrl = 'https://api.themoviedb.org/3'
    const url = `${baseUrl}/${endpoint}?api_key=${apiKey}&language=it-IT&region=IT`

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            next: { revalidate: 3600 } // Cache per 1 ora
        })

        if (!response.ok) {
            throw new Error(`TMDB API Error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        return data as T
    } catch (error) {
        console.error('Errore chiamata TMDB:', error)
        throw error
    }
}

/**
 * Recupera film trending del giorno
 */
export async function getTrendingMoviesDay(): Promise<TMDBResponse<TMDBMovie>> {
    return fetchFromTMDB<TMDBResponse<TMDBMovie>>('trending/movie/day')
}

/**
 * Recupera contenuti trending della settimana
 */
export async function getTrendingAllWeek(): Promise<TMDBResponse<TMDBMovie | TMDBTVShow>> {
    return fetchFromTMDB<TMDBResponse<TMDBMovie | TMDBTVShow>>('trending/all/week')
}

/**
 * Recupera film ora in programmazione
 */
export async function getNowPlayingMovies(): Promise<TMDBResponse<TMDBMovie>> {
    return fetchFromTMDB<TMDBResponse<TMDBMovie>>('movie/now_playing')
}

/**
 * Recupera film in arrivo
 */
export async function getUpcomingMovies(): Promise<TMDBResponse<TMDBMovie>> {
    return fetchFromTMDB<TMDBResponse<TMDBMovie>>('movie/upcoming')
}

/**
 * Recupera trailer di un film
 */
export async function getMovieVideos(movieId: number): Promise<TMDBVideosResponse> {
    return fetchFromTMDB<TMDBVideosResponse>(`movie/${movieId}/videos`)
}

/**
 * Recupera dettagli di un film
 */
export async function getMovieDetails(movieId: number): Promise<TMDBMovie> {
    return fetchFromTMDB<TMDBMovie>(`movie/${movieId}`)
}

/**
 * Trova il trailer YouTube principale
 */
export function findMainTrailer(videos: TMDBVideo[]): TMDBVideo | null {
    // Cerca trailer ufficiale in italiano
    let trailer = videos.find(video =>
        (video.type === 'Trailer' || video.type === 'Teaser') &&
        video.official &&
        video.site === 'YouTube' &&
        video.iso_639_1 === 'it'
    )

    // Se non trova in italiano, cerca in inglese
    if (!trailer) {
        trailer = videos.find(video =>
            (video.type === 'Trailer' || video.type === 'Teaser') &&
            video.official &&
            video.site === 'YouTube' &&
            video.iso_639_1 === 'en'
        )
    }

    // Se non trova ufficiale, cerca qualsiasi trailer/teaser YouTube
    if (!trailer) {
        trailer = videos.find(video =>
            (video.type === 'Trailer' || video.type === 'Teaser') &&
            video.site === 'YouTube'
        )
    }

    return trailer || null
}

/**
 * Genera URL immagine TMDB
 */
export function getTMDBImageUrl(path: string | null, size: 'w500' | 'w780' | 'original' = 'w500'): string {
    if (!path) return '/placeholder-movie.svg'
    return `https://image.tmdb.org/t/p/${size}${path}`
}

/**
 * Genera URL YouTube embed
 */
export function getYouTubeEmbedUrl(videoKey: string, autoplay: boolean = true, mute: boolean = true): string {
    const params = new URLSearchParams({
        autoplay: autoplay ? '1' : '0',
        mute: mute ? '1' : '0',
        controls: '0',
        showinfo: '0',
        rel: '0',
        modestbranding: '1',
        loop: '1',
        playlist: videoKey
    })

    return `https://www.youtube.com/embed/${videoKey}?${params.toString()}`
}



