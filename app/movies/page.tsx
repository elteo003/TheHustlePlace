'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { MoviePreview } from '@/components/movie-preview'
import { LoadingScreen } from '@/components/loading-screen'
import MovieGridIntegrated from '@/components/movie-grid-integrated'
import { Movie } from '@/types'
import { filterAvailableMovies } from '@/lib/utils'

export default function MoviesPage() {
    const router = useRouter()
    const [showLoadingScreen, setShowLoadingScreen] = useState(true)

    const handlePlay = (id: number, type?: 'movie' | 'tv') => {
        if (type === 'tv') {
            router.push(`/series/${id}`)
        } else {
            router.push(`/player/movie/${id}`)
        }
    }

    const handleDetails = (id: number, type?: 'movie' | 'tv') => {
        if (type === 'tv') {
            router.push(`/series/${id}`)
        } else {
            router.push(`/player/movie/${id}`)
        }
    }

    if (showLoadingScreen) {
        return (
            <LoadingScreen
                onComplete={() => setShowLoadingScreen(false)}
                duration={3500} // 3.5 seconds
            />
        )
    }

    return (
        <div className="min-h-screen bg-black">
            <Navbar />

            <main className="pt-8 pb-16">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-3xl font-bold text-white mb-8">Film</h1>

                    {/* Sezione con MovieGrid integrato */}
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-white mb-6">Film Popolari</h2>
                        <MovieGridIntegrated
                            type="movie"
                            section="popular"
                            onPlay={handlePlay}
                            onDetails={handleDetails}
                            limit={10}
                        />
                    </div>

                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-white mb-6">Film Recenti</h2>
                        <MovieGridIntegrated
                            type="movie"
                            section="recent"
                            onPlay={handlePlay}
                            onDetails={handleDetails}
                            limit={10}
                        />
                    </div>

                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-white mb-6">Film Migliori</h2>
                        <MovieGridIntegrated
                            type="movie"
                            section="top-rated"
                            onPlay={handlePlay}
                            onDetails={handleDetails}
                            limit={10}
                        />
                    </div>
                </div>
            </main>
        </div>
    )
}
