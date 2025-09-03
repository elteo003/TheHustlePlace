'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { TVShow } from '@/types'

export default function TVPage() {
    const [tvShows, setTVShows] = useState<TVShow[]>([])
    const [loading, setLoading] = useState(true)

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
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
