'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Grid, List, Star, Calendar, Film, Tv } from 'lucide-react'
import { MovieCard } from '@/components/movie-card'
import { Movie, TVShow } from '@/types'
import Link from 'next/link'
import { getContentId, getPlayerPath } from '@/lib/content-navigation'
import { getContentPosterUrl } from '@/lib/content-display'
import { cn } from '@/lib/utils'

interface SearchPageClientProps {
    query: string
    initialMovies: Movie[]
    initialTVShows: TVShow[]
    initialTotalMovies: number
    initialTotalTVShows: number
}

export function SearchPageClient({
    query: serverQuery,
    initialMovies,
    initialTVShows,
    initialTotalMovies,
    initialTotalTVShows,
}: SearchPageClientProps) {
    const searchParams = useSearchParams()
    const urlQuery = searchParams.get('q')?.trim() || ''

    const [results, setResults] = useState({
        movies: initialMovies,
        tvShows: initialTVShows,
        totalMovies: initialTotalMovies,
        totalTVShows: initialTotalTVShows,
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'tv'>('all')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [isTransitioning, setIsTransitioning] = useState(false)

    const query = urlQuery || serverQuery

    const searchContent = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults({ movies: [], tvShows: [], totalMovies: 0, totalTVShows: 0 })
            return
        }

        setLoading(true)
        setError(null)

        try {
            const [moviesRes, tvRes] = await Promise.all([
                fetch(`/api/catalog/search/movies?query=${encodeURIComponent(searchQuery)}`),
                fetch(`/api/catalog/search/tv?query=${encodeURIComponent(searchQuery)}`),
            ])

            const moviesData = await moviesRes.json()
            const tvData = await tvRes.json()

            setResults({
                movies: moviesData.success ? (moviesData.data?.results ?? []) : [],
                tvShows: tvData.success ? (tvData.data?.results ?? []) : [],
                totalMovies: moviesData.success ? (moviesData.data?.total_results ?? 0) : 0,
                totalTVShows: tvData.success ? (tvData.data?.total_results ?? 0) : 0,
            })
        } catch {
            setError('Errore nel caricamento dei risultati')
        } finally {
            setLoading(false)
        }
    }, [])

    // Dati SSR quando la query coincide con il server
    useEffect(() => {
        if (urlQuery === serverQuery) {
            setResults({
                movies: initialMovies,
                tvShows: initialTVShows,
                totalMovies: initialTotalMovies,
                totalTVShows: initialTotalTVShows,
            })
            setLoading(false)
            setError(null)
        }
    }, [
        urlQuery,
        serverQuery,
        initialMovies,
        initialTVShows,
        initialTotalMovies,
        initialTotalTVShows,
    ])

    // Navigazione client-side tra query diverse
    useEffect(() => {
        if (urlQuery && urlQuery !== serverQuery) {
            searchContent(urlQuery)
        }
    }, [urlQuery, serverQuery, searchContent])

    const getFilteredResults = () => {
        switch (activeTab) {
            case 'movies':
                return { movies: results.movies, tvShows: [] }
            case 'tv':
                return { movies: [], tvShows: results.tvShows }
            default:
                return { movies: results.movies, tvShows: results.tvShows }
        }
    }

    const filteredResults = getFilteredResults()
    const totalResults = results.totalMovies + results.totalTVShows

    const handleViewModeChange = (newViewMode: 'grid' | 'list') => {
        if (newViewMode === viewMode) return
        setIsTransitioning(true)
        setTimeout(() => {
            setViewMode(newViewMode)
            setTimeout(() => setIsTransitioning(false), 50)
        }, 300)
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-black">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="ml-3 text-white/50">Ricerca in corso...</span>
                    </div>
                </div>
            </main>
        )
    }

    if (error) {
        return (
            <main className="min-h-screen bg-black">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-semibold text-white mb-4">Errore nella ricerca</h1>
                        <p className="text-white/50 mb-6">{error}</p>
                        <button type="button" onClick={() => searchContent(query)} className="btn-play">
                            Riprova
                        </button>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-black">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-2">
                        {query ? (
                            <>Risultati per &ldquo;{query}&rdquo;</>
                        ) : (
                            'Cerca film e serie TV'
                        )}
                    </h1>
                    <p className="text-white/50 text-sm">
                        {query
                            ? totalResults > 0
                                ? `${totalResults} risultati trovati`
                                : 'Nessun risultato trovato'
                            : 'Inserisci un termine nella barra di ricerca'}
                    </p>
                </div>

                {query && (
                    <>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                            <div className="tab-pill-group">
                                {(
                                    [
                                        ['all', `Tutto (${totalResults})`],
                                        ['movies', `Film (${results.totalMovies})`],
                                        ['tv', `Serie TV (${results.totalTVShows})`],
                                    ] as const
                                ).map(([tab, label]) => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setActiveTab(tab)}
                                        className={cn('tab-pill', activeTab === tab && 'tab-pill-active')}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => handleViewModeChange('grid')}
                                    disabled={isTransitioning}
                                    className={cn(
                                        'icon-btn',
                                        viewMode === 'grid' && 'icon-btn-active',
                                        isTransitioning && 'opacity-50 cursor-not-allowed'
                                    )}
                                    aria-label="Vista griglia"
                                >
                                    <Grid className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleViewModeChange('list')}
                                    disabled={isTransitioning}
                                    className={cn(
                                        'icon-btn',
                                        viewMode === 'list' && 'icon-btn-active',
                                        isTransitioning && 'opacity-50 cursor-not-allowed'
                                    )}
                                    aria-label="Vista lista"
                                >
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {totalResults === 0 ? (
                            <div className="text-center py-16">
                                <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold text-white mb-2">
                                    Nessun risultato trovato
                                </h2>
                                <p className="text-white/50 mb-6 text-sm">
                                    Prova con altri termini o esplora il catalogo
                                </p>
                                <Link href="/home" className="btn-play inline-flex">
                                    Torna alla Home
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {filteredResults.movies.length > 0 && (
                                    <section>
                                        <h2 className="section-title !mb-4">
                                            Film ({filteredResults.movies.length})
                                        </h2>
                                        <div
                                            className={cn(
                                                'transition-opacity duration-300',
                                                isTransitioning && 'opacity-0',
                                                viewMode === 'grid'
                                                    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
                                                    : 'space-y-3'
                                            )}
                                        >
                                            {filteredResults.movies.map((movie) => (
                                                <div
                                                    key={movie.id}
                                                    className={
                                                        viewMode === 'list' ? 'animate-fade-in-up' : ''
                                                    }
                                                >
                                                    {viewMode === 'list' ? (
                                                        <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors">
                                                            <div className="flex-shrink-0 w-14 h-20 rounded overflow-hidden bg-zinc-800">
                                                                <img
                                                                    src={getContentPosterUrl(
                                                                        movie.poster_path,
                                                                        'w500'
                                                                    )}
                                                                    alt={movie.title}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="text-white font-medium truncate">
                                                                    {movie.title}
                                                                </h3>
                                                                <p className="text-white/50 text-sm line-clamp-2 mt-1">
                                                                    {movie.overview}
                                                                </p>
                                                                <div className="flex items-center gap-3 text-xs text-white/40 mt-2">
                                                                    <span className="flex items-center gap-1">
                                                                        <Star className="w-3 h-3" />
                                                                        {movie.vote_average.toFixed(1)}
                                                                    </span>
                                                                    {movie.release_date && (
                                                                        <span className="flex items-center gap-1">
                                                                            <Calendar className="w-3 h-3" />
                                                                            {new Date(
                                                                                movie.release_date
                                                                            ).getFullYear()}
                                                                        </span>
                                                                    )}
                                                                    <span className="flex items-center gap-1">
                                                                        <Film className="w-3 h-3" />
                                                                        Film
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const itemId = getContentId(
                                                                        movie as Movie
                                                                    )
                                                                    window.location.href = getPlayerPath(
                                                                        itemId,
                                                                        'movie'
                                                                    )
                                                                }}
                                                                className="btn-play text-sm py-2 flex-shrink-0"
                                                            >
                                                                Guarda
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <MovieCard
                                                            movie={movie}
                                                            showReleaseDate={true}
                                                            type="movie"
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {filteredResults.tvShows.length > 0 && (
                                    <section>
                                        <h2 className="section-title !mb-4">
                                            Serie TV ({filteredResults.tvShows.length})
                                        </h2>
                                        <div
                                            className={cn(
                                                'transition-opacity duration-300',
                                                isTransitioning && 'opacity-0',
                                                viewMode === 'grid'
                                                    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
                                                    : 'space-y-3'
                                            )}
                                        >
                                            {filteredResults.tvShows.map((tvShow) => (
                                                <div
                                                    key={tvShow.id}
                                                    className={
                                                        viewMode === 'list' ? 'animate-fade-in-up' : ''
                                                    }
                                                >
                                                    {viewMode === 'list' ? (
                                                        <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors">
                                                            <div className="flex-shrink-0 w-14 h-20 rounded overflow-hidden bg-zinc-800">
                                                                <img
                                                                    src={getContentPosterUrl(
                                                                        tvShow.poster_path,
                                                                        'w500'
                                                                    )}
                                                                    alt={tvShow.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="text-white font-medium truncate">
                                                                    {tvShow.name}
                                                                </h3>
                                                                <p className="text-white/50 text-sm line-clamp-2 mt-1">
                                                                    {tvShow.overview}
                                                                </p>
                                                                <div className="flex items-center gap-3 text-xs text-white/40 mt-2">
                                                                    <span className="flex items-center gap-1">
                                                                        <Star className="w-3 h-3" />
                                                                        {tvShow.vote_average.toFixed(1)}
                                                                    </span>
                                                                    {tvShow.first_air_date && (
                                                                        <span className="flex items-center gap-1">
                                                                            <Calendar className="w-3 h-3" />
                                                                            {new Date(
                                                                                tvShow.first_air_date
                                                                            ).getFullYear()}
                                                                        </span>
                                                                    )}
                                                                    <span className="flex items-center gap-1">
                                                                        <Tv className="w-3 h-3" />
                                                                        Serie TV
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const itemId = getContentId(
                                                                        tvShow as TVShow
                                                                    )
                                                                    window.location.href = getPlayerPath(
                                                                        itemId,
                                                                        'tv'
                                                                    )
                                                                }}
                                                                className="btn-play text-sm py-2 flex-shrink-0"
                                                            >
                                                                Guarda
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <MovieCard
                                                            movie={{
                                                                id: tvShow.id,
                                                                title: tvShow.name,
                                                                overview: tvShow.overview,
                                                                poster_path: tvShow.poster_path,
                                                                backdrop_path: tvShow.backdrop_path,
                                                                release_date: tvShow.first_air_date,
                                                                vote_average: tvShow.vote_average,
                                                                popularity: tvShow.popularity,
                                                                adult: tvShow.adult,
                                                                video: false,
                                                                genre_ids: tvShow.genre_ids,
                                                                original_language:
                                                                    tvShow.original_language,
                                                                original_title: tvShow.original_name,
                                                                vote_count: tvShow.vote_count,
                                                            }}
                                                            showReleaseDate={true}
                                                            type="tv"
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    )
}
