'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Filter, Grid, List } from 'lucide-react'
import { MovieCard } from '@/components/movie-card'
import { Top10MovieCard } from '@/components/top-10-movie-card'
import { Movie, TVShow } from '@/types'
import Link from 'next/link'

interface SearchResults {
    movies: Movie[]
    tvShows: TVShow[]
    totalMovies: number
    totalTVShows: number
}

function SearchContent() {
    const searchParams = useSearchParams()
    const query = searchParams.get('q') || ''

    const [results, setResults] = useState<SearchResults>({
        movies: [],
        tvShows: [],
        totalMovies: 0,
        totalTVShows: 0
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'tv'>('all')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    useEffect(() => {
        if (query) {
            searchContent(query)
        }
    }, [query])

    const searchContent = async (searchQuery: string) => {
        setLoading(true)
        setError(null)

        try {
            // Cerca sia film che serie TV
            const [moviesRes, tvRes] = await Promise.all([
                fetch(`/api/catalog/search/movies?query=${encodeURIComponent(searchQuery)}`),
                fetch(`/api/catalog/search/tv?query=${encodeURIComponent(searchQuery)}`)
            ])

            const moviesData = await moviesRes.json()
            const tvData = await tvRes.json()

            setResults({
                movies: moviesData.success ? moviesData.data.results : [],
                tvShows: tvData.success ? tvData.data.results : [],
                totalMovies: moviesData.success ? moviesData.data.total_results : 0,
                totalTVShows: tvData.success ? tvData.data.total_results : 0
            })
        } catch (err) {
            setError('Errore nel caricamento dei risultati')
            console.error('Errore nella ricerca:', err)
        } finally {
            setLoading(false)
        }
    }

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

    if (loading) {
        return (
            <main className="min-h-screen bg-black pt-20">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-3 text-gray-400">Ricerca in corso...</span>
                    </div>
                </div>
            </main>
        )
    }

    if (error) {
        return (
            <main className="min-h-screen bg-black pt-20">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-white mb-4">Errore nella ricerca</h1>
                        <p className="text-gray-400 mb-6">{error}</p>
                        <button
                            onClick={() => searchContent(query)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors"
                        >
                            Riprova
                        </button>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-black pt-20">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Risultati per "{query}"
                    </h1>
                    <p className="text-gray-400">
                        {totalResults > 0
                            ? `${totalResults} risultati trovati`
                            : 'Nessun risultato trovato'
                        }
                    </p>
                </div>

                {/* Filtri e controlli */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
                    {/* Tab di filtro */}
                    <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'all'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                : 'text-gray-300 hover:text-white'
                                }`}
                        >
                            Tutto ({totalResults})
                        </button>
                        <button
                            onClick={() => setActiveTab('movies')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'movies'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                : 'text-gray-300 hover:text-white'
                                }`}
                        >
                            Film ({results.totalMovies})
                        </button>
                        <button
                            onClick={() => setActiveTab('tv')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'tv'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                : 'text-gray-300 hover:text-white'
                                }`}
                        >
                            Serie TV ({results.totalTVShows})
                        </button>
                    </div>

                    {/* Controlli vista */}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'grid'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                : 'text-gray-300 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'list'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                : 'text-gray-300 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Risultati */}
                {totalResults === 0 ? (
                    <div className="text-center py-16">
                        <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-white mb-2">
                            Nessun risultato trovato
                        </h2>
                        <p className="text-gray-400 mb-6">
                            Prova a modificare i termini di ricerca o esplora i contenuti popolari
                        </p>
                        <Link
                            href="/"
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors"
                        >
                            Torna alla Home
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Film */}
                        {filteredResults.movies.length > 0 && (
                            <section>
                                <h2 className="text-xl font-semibold text-white mb-4">
                                    Film ({filteredResults.movies.length})
                                </h2>
                                <div className={`${viewMode === 'grid'
                                    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
                                    : 'space-y-4'
                                    }`}>
                                    {filteredResults.movies.map((movie) => (
                                        <div key={movie.id} className={viewMode === 'list' ? 'flex items-center space-x-4 p-4 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 transition-colors' : ''}>
                                            {viewMode === 'list' ? (
                                                <div className="flex items-center space-x-4 w-full">
                                                    <div className="flex-shrink-0 w-16 h-24 bg-gray-700 rounded overflow-hidden">
                                                        <img
                                                            src={movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : '/placeholder-movie.svg'}
                                                            alt={movie.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-white font-semibold text-lg mb-1 truncate">
                                                            {movie.title}
                                                        </h3>
                                                        <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                                                            {movie.overview}
                                                        </p>
                                                        <div className="flex items-center space-x-4 text-sm text-gray-300">
                                                            <span>⭐ {movie.vote_average.toFixed(1)}</span>
                                                            <span>📅 {new Date(movie.release_date).getFullYear()}</span>
                                                            <span>🎬 Film</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => window.location.href = `/player/movie/${movie.id}`}
                                                        className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors"
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

                        {/* Serie TV */}
                        {filteredResults.tvShows.length > 0 && (
                            <section>
                                <h2 className="text-xl font-semibold text-white mb-4">
                                    Serie TV ({filteredResults.tvShows.length})
                                </h2>
                                <div className={`${viewMode === 'grid'
                                    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
                                    : 'space-y-4'
                                    }`}>
                                    {filteredResults.tvShows.map((tvShow) => (
                                        <div key={tvShow.id} className={viewMode === 'list' ? 'flex items-center space-x-4 p-4 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 transition-colors' : ''}>
                                            {viewMode === 'list' ? (
                                                <div className="flex items-center space-x-4 w-full">
                                                    <div className="flex-shrink-0 w-16 h-24 bg-gray-700 rounded overflow-hidden">
                                                        <img
                                                            src={tvShow.poster_path ? `https://image.tmdb.org/t/p/w200${tvShow.poster_path}` : '/placeholder-movie.svg'}
                                                            alt={tvShow.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-white font-semibold text-lg mb-1 truncate">
                                                            {tvShow.name}
                                                        </h3>
                                                        <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                                                            {tvShow.overview}
                                                        </p>
                                                        <div className="flex items-center space-x-4 text-sm text-gray-300">
                                                            <span>⭐ {tvShow.vote_average.toFixed(1)}</span>
                                                            <span>📅 {new Date(tvShow.first_air_date).getFullYear()}</span>
                                                            <span>📺 Serie TV</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => window.location.href = `/player/tv/${tvShow.id}`}
                                                        className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors"
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
                                                        original_language: tvShow.original_language,
                                                        original_title: tvShow.original_name,
                                                        vote_count: tvShow.vote_count
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
            </div>
        </main>
    )
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-black pt-20">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-3 text-gray-400">Caricamento...</span>
                    </div>
                </div>
            </main>
        }>
            <SearchContent />
        </Suspense>
    )
}
