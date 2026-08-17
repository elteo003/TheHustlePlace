'use client'

import { useState, useEffect } from 'react'
import { HeroSection } from '@/components/hero-section'
import MovieGridIntegrated from '@/components/movie-grid-integrated'
import { ApiKeyError } from '@/components/api-key-error'
import { MovieProvider } from '@/contexts/MovieContext'
import { ContinueWatchingRow } from '@/components/continue-watching-row'
import { useWatchHistory } from '@/hooks/useWatchHistory'
import { useContentNavigation } from '@/hooks/useContentNavigation'
import { Movie, TVShow, Top10Content } from '@/types'

interface HomePageClientProps {
    top10: Top10Content[]
    popularMovies: Movie[]
    recentMovies: Movie[]
    popularTV: TVShow[]
    recentTV: TVShow[]
}

export function HomePageClient({
    top10,
    popularMovies,
    recentMovies,
    popularTV,
    recentTV,
}: HomePageClientProps) {
    const { play, openDetails } = useContentNavigation()
    const { entries: watchHistory } = useWatchHistory()
    const [hasApiKey, setHasApiKey] = useState(true)
    const [isCheckingApi, setIsCheckingApi] = useState(false)
    const [showUpcomingTrailers, setShowUpcomingTrailers] = useState(false)
    const [currentHeroMovieIndex, setCurrentHeroMovieIndex] = useState(0)

    useEffect(() => {
        setIsCheckingApi(true)
        fetch('/api/test-api-key')
            .then((res) => res.json())
            .then((data) => setHasApiKey(data.hasApiKey))
            .catch(() => setHasApiKey(false))
            .finally(() => setIsCheckingApi(false))
    }, [])

    if (!hasApiKey && !isCheckingApi) {
        return <ApiKeyError />
    }

    return (
        <MovieProvider>
            <main className="min-h-screen bg-black">
                <HeroSection
                    onTrailerEnded={() => setShowUpcomingTrailers(true)}
                    onMovieChange={setCurrentHeroMovieIndex}
                    showUpcomingTrailers={showUpcomingTrailers}
                    onLoaded={() => undefined}
                    currentHeroMovieIndex={currentHeroMovieIndex}
                    onUpcomingMovieSelect={() => setShowUpcomingTrailers(false)}
                />

                <div className="relative z-10">
                    {watchHistory.length > 0 && (
                        <section className="py-8">
                            <div className="container mx-auto px-4">
                                <h2 className="section-title">Continua a guardare</h2>
                                <ContinueWatchingRow entries={watchHistory} />
                            </div>
                        </section>
                    )}

                    <section className="py-8">
                        <div className="container mx-auto px-4">
                            <h2 className="section-title">Top 10 Titoli Oggi</h2>
                            <MovieGridIntegrated
                                type="movie"
                                section="trending"
                                onPlay={play}
                                onDetails={openDetails}
                                initialData={top10}
                            />
                        </div>
                    </section>

                    <section className="py-8">
                        <div className="container mx-auto px-4">
                            <h2 className="section-title">Film Popolari</h2>
                            <MovieGridIntegrated
                                type="movie"
                                section="popular"
                                onPlay={play}
                                onDetails={openDetails}
                                initialData={popularMovies}
                            />
                        </div>
                    </section>

                    <section className="py-8">
                        <div className="container mx-auto px-4">
                            <h2 className="section-title">Film Recenti</h2>
                            <MovieGridIntegrated
                                type="movie"
                                section="recent"
                                onPlay={play}
                                onDetails={openDetails}
                                initialData={recentMovies}
                            />
                        </div>
                    </section>

                    <section className="py-8">
                        <div className="container mx-auto px-4">
                            <h2 className="section-title">Serie TV Popolari</h2>
                            <MovieGridIntegrated
                                type="tv"
                                section="popular"
                                onPlay={play}
                                onDetails={openDetails}
                                initialData={popularTV}
                            />
                        </div>
                    </section>

                    <section className="py-8">
                        <div className="container mx-auto px-4">
                            <h2 className="section-title">Serie TV Recenti</h2>
                            <MovieGridIntegrated
                                type="tv"
                                section="recent"
                                onPlay={play}
                                onDetails={openDetails}
                                initialData={recentTV}
                            />
                        </div>
                    </section>
                </div>
            </main>
        </MovieProvider>
    )
}
