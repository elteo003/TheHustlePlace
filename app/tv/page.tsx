'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { MoviePreview } from '@/components/movie-preview'
import { LoadingScreen } from '@/components/loading-screen'
import MovieGridIntegrated from '@/components/movie-grid-integrated'
import { TVShow } from '@/types'

export default function TVPage() {
    const router = useRouter()

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


    return (
        <div className="min-h-screen bg-black">
            <Navbar />

            <main className="pt-8 pb-16">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-3xl font-bold text-white mb-8">Serie TV</h1>

                    {/* Sezione con MovieGrid integrato */}
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-white mb-6">Serie TV Popolari</h2>
                        <MovieGridIntegrated
                            type="tv"
                            section="popular"
                            onPlay={handlePlay}
                            onDetails={handleDetails}
                            limit={10}
                        />
                    </div>

                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-white mb-6">Serie TV Recenti</h2>
                        <MovieGridIntegrated
                            type="tv"
                            section="recent"
                            onPlay={handlePlay}
                            onDetails={handleDetails}
                            limit={10}
                        />
                    </div>

                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-white mb-6">Serie TV Migliori</h2>
                        <MovieGridIntegrated
                            type="tv"
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
