'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { Movie, TVShow } from '@/types'

export default function CatalogPage() {
    const [movies, setMovies] = useState<Movie[]>([])
    const [tvShows, setTVShows] = useState<TVShow[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'movies' | 'tv'>('movies')

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                if (activeTab === 'movies') {
                    const response = await fetch('/api/catalog/movies?page=1')
                    const data = await response.json()
                    if (data.success && data.data?.results) {
                        setMovies(data.data.results)
                    }
                } else {
                    const response = await fetch('/api/catalog/tv?page=1')
                    const data = await response.json()
                    if (data.success && data.data?.results) {
                        setTVShows(data.data.results)
                    }
                }
            } catch (error) {
                console.error('Errore nel caricamento dei dati:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [activeTab])

    return (
        <div className="min-h-screen bg-black">
            <Navbar />

            <main className="pt-8 pb-16">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-3xl font-bold text-white mb-8">Catalogo</h1>

                    {/* Tabs */}
                    <div className="flex space-x-4 mb-8">
                        <button
                            onClick={() => setActiveTab('movies')}
                            className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'movies'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                        >
                            Film
                        </button>
                        <button
                            onClick={() => setActiveTab('tv')}
                            className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'tv'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                        >
                            Serie TV
                        </button>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                            {activeTab === 'movies' ? (
                                movies.map((movie) => (
                                    <div key={movie.id} className="group cursor-pointer">
                                        <div className="aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden mb-2">
                                            {movie.poster_path ? (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                                                    alt={movie.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <span>Nessuna immagine</span>
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-white text-sm font-medium truncate">
                                            {movie.title}
                                        </h3>
                                        <p className="text-gray-400 text-xs">
                                            {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                tvShows.map((show) => (
                                    <div key={show.id} className="group cursor-pointer">
                                        <div className="aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden mb-2">
                                            {show.poster_path ? (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
                                                    alt={show.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <span>Nessuna immagine</span>
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-white text-sm font-medium truncate">
                                            {show.name}
                                        </h3>
                                        <p className="text-gray-400 text-xs">
                                            {show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'N/A'}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
