'use client'

import { useState, useEffect, useCallback } from 'react'
import { MovieCard } from './movie-card'
import { Top10MovieCard } from './top-10-movie-card'
import { TMDBMovie, getTMDBImageUrl } from '@/lib/tmdb'
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

    const fetchMovies = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            let apiUrl = ''

            // Mappa i tipi di sezione con le API corrette
            switch (type) {
                case 'top10':
                    apiUrl = '/api/catalog/top-10'
                    break
                case 'recent':
                    apiUrl = '/api/catalog/recent'
                    break
                case 'trending':
                    apiUrl = '/api/catalog/popular/movies' // Usa popular come trending
                    break
                case 'upcoming':
                    apiUrl = '/api/catalog/now-playing' // Usa now-playing come upcoming
                    break
                default:
                    throw new Error(`Tipo di sezione non supportato: ${type}`)
            }

            const response = await fetch(apiUrl)
            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Errore nel caricamento dei dati')
            }

            if (type === 'top10') {
                setTop10Content(data.data || [])
            } else {
                setMovies(data.data?.results || data.data || [])
            }
        } catch (err) {
            setError('Errore nel caricamento dei contenuti')
            console.error('Errore nel caricamento contenuti:', err)
        } finally {
            setLoading(false)
        }
    }, [type])

    useEffect(() => {
        fetchMovies()
    }, [fetchMovies])

    // Renderizza le card direttamente per permettere le animazioni hover
    const renderTop10Cards = () => {
        return top10Content.map((content, index) => (
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
    }

    const renderMovieCards = () => {
        return movies.map((movie) => (
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
    }

    if (loading) {
        return (
            <div className={`${className}`}>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
        <div className={`py-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{title}</h2>
            </div>

            {/* Movies Grid */}
            <div className="flex space-x-6 overflow-x-auto scrollbar-thin py-8 px-2"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    scrollBehavior: 'smooth',
                    willChange: 'transform'
                }}>
                {type === 'top10' ? renderTop10Cards() : renderMovieCards()}
            </div>
        </div>
    )
}