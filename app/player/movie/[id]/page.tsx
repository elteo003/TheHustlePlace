'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ErrorBoundary } from '@/components/error-boundary'
import { PlayerShell } from '@/components/player-shell'
import { VixsrcEmbedPlayer } from '@/components/vixsrc-embed-player'
import { useTrackWatch } from '@/hooks/useTrackWatch'
import { Movie } from '@/types'

interface MovieDetails extends Movie {
    runtime?: number
    genres?: Array<{ id: number; name: string }>
}

function createFallbackMovie(movieId: string): MovieDetails {
    const id = parseInt(movieId, 10)
    return {
        id,
        tmdb_id: id,
        title: `Film ${movieId}`,
        overview: `Film disponibile su vixsrc.to con TMDB ID ${movieId}.`,
        poster_path: '/placeholder-movie.svg',
        backdrop_path: '/placeholder-movie.svg',
        release_date: '',
        vote_average: 0,
        vote_count: 0,
        genre_ids: [],
        adult: false,
        original_language: 'it',
        original_title: `Film ${movieId}`,
        popularity: 0,
        video: false,
        runtime: 0,
        genres: [],
    }
}

export default function MoviePlayerPage() {
    const params = useParams()
    const router = useRouter()
    const movieId = params.id as string
    const [movie, setMovie] = useState<MovieDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const fetchedId = useRef<string | null>(null)

    useEffect(() => {
        if (fetchedId.current === movieId) return
        fetchedId.current = movieId

        const fetchMovieDetails = async () => {
            try {
                setLoading(true)
                const response = await fetch(`/api/tmdb/movies/${movieId}`)
                const data = await response.json()

                if (data.success && data.data) {
                    const tmdbMovie = data.data
                    setMovie({
                        id: tmdbMovie.id,
                        tmdb_id: tmdbMovie.id,
                        title: tmdbMovie.title,
                        overview: tmdbMovie.overview,
                        poster_path: tmdbMovie.poster_path,
                        backdrop_path: tmdbMovie.backdrop_path,
                        release_date: tmdbMovie.release_date,
                        vote_average: tmdbMovie.vote_average,
                        vote_count: tmdbMovie.vote_count ?? 0,
                        genre_ids: tmdbMovie.genre_ids ?? [],
                        adult: tmdbMovie.adult ?? false,
                        original_language: tmdbMovie.original_language ?? 'en',
                        original_title: tmdbMovie.original_title ?? tmdbMovie.title,
                        popularity: tmdbMovie.popularity ?? 0,
                        video: tmdbMovie.video ?? false,
                        runtime: tmdbMovie.runtime || 0,
                        genres: tmdbMovie.genres || [],
                    })
                } else {
                    setMovie(createFallbackMovie(movieId))
                }
            } catch {
                setMovie(createFallbackMovie(movieId))
            } finally {
                setLoading(false)
            }
        }

        fetchMovieDetails()
    }, [movieId])

    const tmdbId = movie?.tmdb_id || movie?.id

    useTrackWatch(
        movie && tmdbId
            ? {
                  id: tmdbId,
                  type: 'movie',
                  title: movie.title,
                  poster_path: movie.poster_path,
                  backdrop_path: movie.backdrop_path,
              }
            : null
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Caricamento...</div>
            </div>
        )
    }

    if (!movie) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Film non trovato</div>
            </div>
        )
    }

    return (
        <ErrorBoundary>
            <PlayerShell
                backdropPath={movie.backdrop_path}
                onBack={() => router.back()}
                footer={
                    <div className="p-8 bg-black">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-2xl font-bold mb-4">Informazioni</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Trama</h3>
                                    <p className="text-gray-300 leading-relaxed">{movie.overview}</p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Dettagli</h3>
                                    <div className="space-y-2 text-gray-300">
                                        <p>
                                            <span className="font-medium">Data di uscita:</span>{' '}
                                            {movie.release_date || 'N/D'}
                                        </p>
                                        <p>
                                            <span className="font-medium">Durata:</span> {movie.runtime || 0} minuti
                                        </p>
                                        <p>
                                            <span className="font-medium">Valutazione:</span> ⭐ {movie.vote_average}/10
                                        </p>
                                        {movie.genres && movie.genres.length > 0 && (
                                            <p>
                                                <span className="font-medium">Generi:</span>{' '}
                                                {movie.genres.map((g) => g.name).join(', ')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                }
            >
                <VixsrcEmbedPlayer
                    tmdbId={movie.tmdb_id || movie.id}
                    type="movie"
                    title={movie.title}
                    onBack={() => router.back()}
                    unavailableDescription="Questo film non è attualmente disponibile per lo streaming su vixsrc.to"
                />
            </PlayerShell>
        </ErrorBoundary>
    )
}
