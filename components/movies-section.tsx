'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { MovieCard } from './movie-card'
import { Top10MovieCard } from './top-10-movie-card'
import { TMDBMovie, TMDBTVShow, fetchFromTMDB, getTMDBImageUrl } from '@/lib/tmdb'
import { Top10Content } from '@/types'

interface MoviesSectionProps {
    title: string
    type: 'top10' | 'recent' | 'trending' | 'upcoming'
    className?: string
}

export function MoviesSection({
    title,
    type,
    className = ''
}: MoviesSectionProps) {
    const [movies, setMovies] = useState<TMDBMovie[]>([])
    const [top10Content, setTop10Content] = useState<Top10Content[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        fetchMovies()
    }, [type])

    const fetchMovies = async () => {
        try {
            setLoading(true)
            setError(null)

            if (type === 'top10') {
                // Top 10 mista (film e serie TV) - usa l'API interna
                const response = await fetch('/api/catalog/top-10')
                if (!response.ok) {
                    throw new Error('Errore nel recupero della top 10')
                }
                const data = await response.json()
                if (data.success) {
                    setTop10Content(data.data)
                } else {
                    throw new Error(data.error || 'Errore nel recupero della top 10')
                }
            } else {
                let moviesData: TMDBMovie[] = []

                switch (type) {
                    case 'recent':
                        // Aggiunti di recente - movie/now_playing ordinato per release_date
                        const nowPlayingResponse = await fetchFromTMDB('movie/now_playing')
                        moviesData = (nowPlayingResponse as any).results
                            .sort((a: any, b: any) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime())
                        break

                    case 'trending':
                        // Titoli del momento - trending/all/week
                        const trendingWeekResponse = await fetchFromTMDB('trending/all/week')
                        // Filtra solo i film (escludi serie TV per questa sezione)
                        moviesData = (trendingWeekResponse as any).results
                            .filter((item: any): item is TMDBMovie => 'title' in item)
                            .slice(0, 20)
                        break

                    case 'upcoming':
                        // In arrivo - movie/upcoming ordinato per release_date crescente
                        const upcomingResponse = await fetchFromTMDB('movie/upcoming')
                        moviesData = (upcomingResponse as any).results
                            .sort((a: any, b: any) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime())
                            .slice(0, 20)
                        break
                }

                setMovies(moviesData)
            }
        } catch (err) {
            setError('Errore nel caricamento dei contenuti')
            console.error('Errore nel caricamento contenuti:', err)
        } finally {
            setLoading(false)
        }
    }

    if (!isMounted) {
        return (
            <div className={`${className}`}>
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-700 rounded w-48 mb-6"></div>
                    <div className="flex space-x-4">
                        {Array.from({ length: 5 }, (_, i) => (
                            <div key={i} className="w-48 h-72 bg-gray-800 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className={`${className}`}>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-400">Caricamento {title.toLowerCase()}...</span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={`${className}`}>
                <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
                <div className="flex items-center justify-center h-64 bg-gray-800 rounded-lg">
                    <div className="text-center">
                        <p className="text-blue-400 mb-2">Errore nel caricamento</p>
                        <p className="text-gray-400 text-sm">{error}</p>
                        <button
                            onClick={fetchMovies}
                            className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded hover:from-blue-600 hover:to-purple-700 transition-colors"
                        >
                            Riprova
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (type === 'top10' ? top10Content.length === 0 : movies.length === 0) {
        return (
            <div className={`${className}`}>
                <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
                <div className="flex items-center justify-center h-64 bg-gray-800 rounded-lg">
                    <p className="text-gray-400">Nessun contenuto disponibile</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{title}</h2>
            </div>

            {/* Movies Grid */}
            <div className="flex space-x-4 overflow-x-auto scrollbar-thin pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {type === 'top10' ? (
                    top10Content.map((content, index) => (
                        <div key={`${content.type}-${content.id}`} className="flex-shrink-0 w-48">
                            <Top10MovieCard
                                movie={{
                                    id: content.id,
                                    title: content.title,
                                    overview: content.overview,
                                    poster_path: content.poster_path || null,
                                    backdrop_path: content.backdrop_path || null,
                                    release_date: content.release_date,
                                    vote_average: content.vote_average,
                                    popularity: content.popularity,
                                    adult: content.adult,
                                    video: content.video || false,
                                    genre_ids: content.genre_ids,
                                    original_language: content.original_language,
                                    original_title: content.original_title || content.title,
                                    vote_count: content.vote_count
                                }}
                                rank={index + 1}
                                showRank={true}
                            />
                        </div>
                    ))
                ) : (
                    movies.map((movie, index) => (
                        <div key={movie.id} className="flex-shrink-0 w-48">
                            <MovieCard
                                movie={{
                                    id: movie.id,
                                    title: movie.title,
                                    overview: movie.overview,
                                    poster_path: movie.poster_path,
                                    backdrop_path: movie.backdrop_path,
                                    release_date: movie.release_date,
                                    vote_average: movie.vote_average,
                                    popularity: movie.popularity,
                                    adult: movie.adult,
                                    video: movie.video,
                                    genre_ids: movie.genre_ids,
                                    original_language: movie.original_language,
                                    original_title: movie.original_title,
                                    vote_count: movie.vote_count
                                }}
                                showReleaseDate={type === 'upcoming'}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}