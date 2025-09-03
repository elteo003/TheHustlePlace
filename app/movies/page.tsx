'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { Movie } from '@/types'
import { filterAvailableMovies } from '@/lib/utils'

export default function MoviesPage() {
    const [movies, setMovies] = useState<Movie[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                setLoading(true)
                const response = await fetch('/api/catalog/movies?page=1')
                const data = await response.json()
                if (data.success && data.data?.results) {
                    // Filtra solo film disponibili per streaming
                    const availableMovies = filterAvailableMovies(data.data.results)
                    setMovies(availableMovies)
                }
            } catch (error) {
                console.error('Errore nel caricamento dei film:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchMovies()
    }, [])

    return (
        <div className="min-h-screen bg-black">
            <Navbar />

            <main className="pt-8 pb-16">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-3xl font-bold text-white mb-8">Film</h1>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                            {movies.map((movie) => (
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
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
