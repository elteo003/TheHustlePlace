'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { MovieCard } from '@/components/movie-card'
import { Movie, TVShow } from '@/types'

function SearchContent() {
    const searchParams = useSearchParams()
    const query = searchParams.get('q') || ''
    
    const [movies, setMovies] = useState<Movie[]>([])
    const [tvShows, setTVShows] = useState<TVShow[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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

            if (moviesData.success && moviesData.data?.results) {
                setMovies(moviesData.data.results)
            } else {
                setMovies([])
            }

            if (tvData.success && tvData.data?.results) {
                setTVShows(tvData.data.results)
            } else {
                setTVShows([])
            }

        } catch (error) {
            console.error('Errore nella ricerca:', error)
            setError('Errore durante la ricerca. Riprova.')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black">
                <Navbar />
                <div className="pt-20 px-4 py-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-white text-lg">Ricerca in corso...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const totalResults = movies.length + tvShows.length

    return (
        <div className="min-h-screen bg-black">
            <Navbar />
            
            <div className="pt-20 px-4 py-8">
                <div className="max-w-7xl mx-auto">
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

                    {error && (
                        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-8">
                            <p className="text-red-400">{error}</p>
                        </div>
                    )}

                    {totalResults === 0 && !error ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-lg mb-4">
                                Nessun risultato trovato per "{query}"
                            </div>
                            <p className="text-gray-500">
                                Prova con termini diversi o controlla l'ortografia
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {/* Film */}
                            {movies.length > 0 && (
                                <section>
                                    <h2 className="text-2xl font-bold text-white mb-6">
                                        Film ({movies.length})
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                        {movies.map((movie) => (
                                            <MovieCard
                                                key={movie.id}
                                                item={movie}
                                                type="movie"
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Serie TV */}
                            {tvShows.length > 0 && (
                                <section>
                                    <h2 className="text-2xl font-bold text-white mb-6">
                                        Serie TV ({tvShows.length})
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                        {tvShows.map((tvShow) => (
                                            <MovieCard
                                                key={tvShow.id}
                                                item={tvShow}
                                                type="tv"
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black">
                <Navbar />
                <div className="pt-20 px-4 py-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-white text-lg">Caricamento...</p>
                        </div>
                    </div>
                </div>
            </div>
        }>
            <SearchContent />
        </Suspense>
    )
}
