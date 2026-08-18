'use client'

import { Play, Plus, Star, Clock } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { getTMDBImageUrl } from '@/lib/tmdb'
import { getContentPosterUrl } from '@/lib/content-display'
import { PosterTransition } from '@/components/ui/poster-transition'
import { Movie } from '@/types'

export interface MovieDetails extends Movie {
    runtime?: number
    genres?: Array<{ id: number; name: string }>
}

interface MovieDetailViewProps {
    movie: MovieDetails
    onPlay: () => void
}

export function MovieDetailView({ movie, onPlay }: MovieDetailViewProps) {
    const backdropUrl =
        movie.backdrop_path && movie.backdrop_path !== '/placeholder-movie.svg'
            ? getTMDBImageUrl(movie.backdrop_path, 'original')
            : null

    const formatRuntime = (minutes?: number) => {
        if (!minutes) return null
        const h = Math.floor(minutes / 60)
        const m = minutes % 60
        return h > 0 ? `${h}h ${m}m` : `${m}m`
    }

    return (
        <div className="min-h-screen bg-black text-white animate-fade-in-up">
            <div className="relative min-h-[70vh]">
                {backdropUrl && (
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${backdropUrl})` }}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />

                <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-16">
                    <div className="flex flex-col sm:flex-row gap-8 items-start">
                        <PosterTransition
                            type="movie"
                            id={movie.tmdb_id ?? movie.id}
                            className="relative flex-shrink-0 w-40 sm:w-48 aspect-[2/3]"
                        >
                            <Image
                                src={getContentPosterUrl(movie.poster_path)}
                                alt={movie.title}
                                fill
                                className="object-cover rounded-lg shadow-2xl"
                                sizes="(max-width: 640px) 160px, 192px"
                            />
                        </PosterTransition>

                        <div className="flex-1">
                            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
                                {movie.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-3 text-sm text-white/70 mb-5">
                                <span className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    {movie.vote_average.toFixed(1)}
                                </span>
                                {movie.release_date && (
                                    <span>{new Date(movie.release_date).getFullYear()}</span>
                                )}
                                {formatRuntime(movie.runtime) && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {formatRuntime(movie.runtime)}
                                    </span>
                                )}
                                {movie.genres?.map((g) => (
                                    <span
                                        key={g.id}
                                        className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-xs"
                                    >
                                        {g.name}
                                    </span>
                                ))}
                            </div>

                            <p className="text-base sm:text-lg text-white/75 leading-relaxed max-w-2xl mb-8">
                                {movie.overview || 'Descrizione non disponibile.'}
                            </p>

                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={onPlay}
                                    className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
                                    aria-label={`Guarda ${movie.title}`}
                                >
                                    <Play className="w-5 h-5 fill-current ml-0.5" />
                                </button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="border-white/25 text-white hover:bg-white/10 rounded-md"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    La mia lista
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
