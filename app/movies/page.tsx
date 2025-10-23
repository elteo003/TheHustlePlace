'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { MoviePreview } from '@/components/movie-preview'
import { Movie } from '@/types'
import { filterAvailableMovies } from '@/lib/utils'

export default function MoviesPage() {
    const [movies, setMovies] = useState<Movie[]>([])
    const [loading, setLoading] = useState(true)
    const [hoveredItem, setHoveredItem] = useState<number | null>(null)
    const router = useRouter()

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

    const handlePlay = (id: number) => {
        router.push(`/player/movie/${id}`)
    }

    const handleDetails = (id: number) => {
        // Per i film, potremmo creare una pagina dettagli o usare un modal
        // Per ora naviga direttamente al player
        router.push(`/player/movie/${id}`)
    }

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
                                <MoviePreview
                                    key={movie.id}
                                    movie={movie}
                                    type="movie"
                                    onPlay={handlePlay}
                                    onDetails={handleDetails}
                                    isHovered={hoveredItem === movie.id}
                                    onHover={(hovered) => setHoveredItem(hovered ? movie.id : null)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
