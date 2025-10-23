'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { MoviePreview } from '@/components/movie-preview'
import { TVShow } from '@/types'

export default function TVPage() {
    const [tvShows, setTVShows] = useState<TVShow[]>([])
    const [loading, setLoading] = useState(true)
    const [hoveredItem, setHoveredItem] = useState<number | null>(null)
    const router = useRouter()

    useEffect(() => {
        const fetchTVShows = async () => {
            try {
                setLoading(true)
                const response = await fetch('/api/catalog/tv?page=1')
                const data = await response.json()
                if (data.success && data.data?.results) {
                    setTVShows(data.data.results)
                }
            } catch (error) {
                console.error('Errore nel caricamento delle serie TV:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchTVShows()
    }, [])

    const handlePlay = (id: number) => {
        router.push(`/player/tv/${id}`)
    }

    const handleDetails = (id: number) => {
        router.push(`/series/${id}`)
    }

    return (
        <div className="min-h-screen bg-black">
            <Navbar />

            <main className="pt-8 pb-16">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-3xl font-bold text-white mb-8">Serie TV</h1>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                            {tvShows.map((show) => (
                                <MoviePreview
                                    key={show.id}
                                    movie={show}
                                    type="tv"
                                    onPlay={handlePlay}
                                    onDetails={handleDetails}
                                    isHovered={hoveredItem === show.id}
                                    onHover={(hovered) => setHoveredItem(hovered ? show.id : null)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
