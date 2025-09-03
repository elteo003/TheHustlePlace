'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { HeroSection } from '@/components/hero-section'
import { ContentCarousel } from '@/components/content-carousel'
import { Top10MovieCard } from '@/components/top-10-movie-card'
import { SkeletonLoader } from '@/components/skeleton-loader'
import { Movie, TVShow } from '@/types'
import { filterAvailableMovies } from '@/lib/utils'

export default function HomePage() {
    const [nowPlayingMovies, setNowPlayingMovies] = useState<Movie[]>([])
    const [latestMovies, setLatestMovies] = useState<Movie[]>([])
    const [top10Movies, setTop10Movies] = useState<Movie[]>([])
    const [popularTVShows, setPopularTVShows] = useState<TVShow[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                // Fetch now playing movies (per hero section)
                const nowPlayingRes = await fetch('/api/catalog/now-playing')
                const nowPlayingData = await nowPlayingRes.json()
                if (nowPlayingData.success && nowPlayingData.data) {
                    setNowPlayingMovies(nowPlayingData.data.slice(0, 5))
                }

                // Fetch recent movies (ultimi 2 anni)
                const recentMoviesRes = await fetch('/api/catalog/recent')
                const recentMoviesData = await recentMoviesRes.json()
                if (recentMoviesData.success && recentMoviesData.data) {
                    // Filtra solo film disponibili per streaming
                    const availableMovies = filterAvailableMovies(recentMoviesData.data)
                    setLatestMovies(availableMovies.slice(0, 20))
                }

                // Fetch top 10 movies
                const top10Res = await fetch('/api/catalog/top-10')
                const top10Data = await top10Res.json()
                if (top10Data.success && top10Data.data) {
                    // Filtra solo film disponibili per streaming
                    const availableTop10 = filterAvailableMovies(top10Data.data)
                    setTop10Movies(availableTop10)
                }

                // Fetch popular TV shows
                const popularTVRes = await fetch('/api/catalog/popular/tv?page=1')
                const popularTVData = await popularTVRes.json()
                if (popularTVData.success && popularTVData.data?.results) {
                    setPopularTVShows(popularTVData.data.results.slice(0, 20))
                }

            } catch (error) {
                console.error('Errore nel caricamento dei dati:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    // Featured content per l'hero section (film appena usciti al cinema)
    const featuredContent = nowPlayingMovies.slice(0, 5)

    if (loading) {
        return (
            <div className="min-h-screen bg-black">
                <Navbar />
                <SkeletonLoader type="hero" />
                <div className="px-4 py-8 space-y-12">
                    <section className="space-y-6">
                        <div className="h-8 w-48 bg-gray-700 rounded animate-pulse mx-4"></div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 px-4">
                            <SkeletonLoader count={5} type="movie" />
                        </div>
                    </section>
                    <section className="space-y-6">
                        <div className="h-8 w-48 bg-gray-700 rounded animate-pulse mx-4"></div>
                        <div className="flex space-x-4 px-4 overflow-x-auto">
                            <SkeletonLoader count={10} type="movie" />
                        </div>
                    </section>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black">
            <Navbar />
            
            {/* Hero Section con film appena usciti al cinema */}
            {featuredContent.length > 0 && (
                <HeroSection featuredContent={featuredContent} />
            )}

            <div className="px-4 py-8 space-y-12">
                {/* Sezione Top 10 Film - come StreamingCommunity */}
                {top10Movies.length > 0 && (
                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold text-white px-4">
                            Top 10 Titoli Oggi
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 px-4">
                            {top10Movies.map((movie, index) => (
                                <Top10MovieCard 
                                    key={movie.id}
                                    movie={movie} 
                                    rank={index + 1} 
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Sezione Film Appena Usciti al Cinema */}
                {nowPlayingMovies.length > 0 && (
                    <ContentCarousel
                        title="Appena Usciti al Cinema"
                        items={nowPlayingMovies}
                        type="movie"
                    />
                )}

                {/* Sezione Film Recenti */}
                {latestMovies.length > 0 && (
                    <ContentCarousel
                        title="Aggiunti di Recente"
                        items={latestMovies}
                        type="movie"
                    />
                )}

                {/* Sezione Serie TV Popolari */}
                {popularTVShows.length > 0 && (
                    <ContentCarousel
                        title="Serie TV Popolari"
                        items={popularTVShows}
                        type="tv"
                    />
                )}
            </div>
        </div>
    )
}