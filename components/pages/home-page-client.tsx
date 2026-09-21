'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { HeroSection } from '@/components/hero-section'
import MovieGridIntegrated from '@/components/movie-grid-integrated'
import { ApiKeyError } from '@/components/api-key-error'
import { MovieProvider } from '@/contexts/MovieContext'
import { ContinueWatchingRow } from '@/components/continue-watching-row'
import { useWatchHistory } from '@/hooks/useWatchHistory'
import { useContentNavigation } from '@/hooks/useContentNavigation'
import { occupiedFromRails, usePersonalRails } from '@/hooks/usePersonalRails'
import { HOME_RAIL_SIZE, TOP10_SIZE } from '@/lib/catalog-types'
import { EDITORIAL_RAIL_TITLES, EditorialRails } from '@/lib/editorial-rails'
import { PersonalRails } from '@/lib/personal-rails'
import { Movie, TVShow, Top10Content } from '@/types'

function HomeRail({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="content-gutter py-8">
            <h2 className="section-title">{title}</h2>
            {children}
        </section>
    )
}

interface HomePageClientProps {
    top10: Top10Content[]
    comingSoon?: Top10Content[]
    personal: PersonalRails
    editorial: EditorialRails
    popularMovies: Movie[]
    recentMovies: Movie[]
    popularTV: TVShow[]
    recentTV: TVShow[]
}

export function HomePageClient({
    top10,
    comingSoon = [],
    personal,
    editorial,
    popularMovies,
    recentMovies,
    popularTV,
    recentTV,
}: HomePageClientProps) {
    const { play, openDetails } = useContentNavigation()
    const { entries: watchHistory } = useWatchHistory()
    const occupied = useMemo(() => occupiedFromRails([...top10, ...comingSoon]), [top10, comingSoon])
    const rails = usePersonalRails({ initial: personal, occupied })
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
                        <HomeRail title="Continua a guardare">
                            <ContinueWatchingRow entries={watchHistory} />
                        </HomeRail>
                    )}

                    {rails.picks.length > 0 && (
                        <HomeRail title="Scelti per te oggi">
                            <MovieGridIntegrated
                                type="movie"
                                section="picks"
                                limit={HOME_RAIL_SIZE}
                                onPlay={play}
                                onDetails={openDetails}
                                initialData={rails.picks}
                            />
                        </HomeRail>
                    )}

                    <HomeRail title="Top 10 Titoli Oggi">
                        <MovieGridIntegrated
                            type="movie"
                            section="trending"
                            limit={TOP10_SIZE}
                            onPlay={play}
                            onDetails={openDetails}
                            initialData={top10}
                        />
                    </HomeRail>

                    {rails.affinity.length > 0 && (
                        <HomeRail title="Pensiamo ti appassioneranno">
                            <MovieGridIntegrated
                                type="movie"
                                section="affinity"
                                limit={HOME_RAIL_SIZE}
                                onPlay={play}
                                onDetails={openDetails}
                                initialData={rails.affinity}
                            />
                        </HomeRail>
                    )}

                    <HomeRail title="Film Popolari">
                        <MovieGridIntegrated
                            type="movie"
                            section="popular"
                            limit={HOME_RAIL_SIZE}
                            onPlay={play}
                            onDetails={openDetails}
                            initialData={popularMovies}
                        />
                    </HomeRail>

                    <HomeRail title="Serie TV Recenti">
                        <MovieGridIntegrated
                            type="tv"
                            section="recent"
                            limit={HOME_RAIL_SIZE}
                            onPlay={play}
                            onDetails={openDetails}
                            initialData={recentTV}
                        />
                    </HomeRail>

                    {rails.treasures.length > 0 && (
                        <HomeRail title="Tesori per te">
                            <MovieGridIntegrated
                                type="movie"
                                section="treasures"
                                limit={HOME_RAIL_SIZE}
                                onPlay={play}
                                onDetails={openDetails}
                                initialData={rails.treasures}
                            />
                        </HomeRail>
                    )}

                    {editorial.warAndPolitics.length > 0 && (
                        <HomeRail title={EDITORIAL_RAIL_TITLES.warAndPolitics}>
                            <MovieGridIntegrated
                                type="movie"
                                section="war-politics"
                                limit={HOME_RAIL_SIZE}
                                onPlay={play}
                                onDetails={openDetails}
                                initialData={editorial.warAndPolitics}
                            />
                        </HomeRail>
                    )}

                    {editorial.politicalIntrigue.length > 0 && (
                        <HomeRail title={EDITORIAL_RAIL_TITLES.politicalIntrigue}>
                            <MovieGridIntegrated
                                type="tv"
                                section="political-intrigue"
                                limit={HOME_RAIL_SIZE}
                                onPlay={play}
                                onDetails={openDetails}
                                initialData={editorial.politicalIntrigue}
                            />
                        </HomeRail>
                    )}

                    {editorial.periodStories.length > 0 && (
                        <HomeRail title={EDITORIAL_RAIL_TITLES.periodStories}>
                            <MovieGridIntegrated
                                type="movie"
                                section="period-stories"
                                limit={HOME_RAIL_SIZE}
                                onPlay={play}
                                onDetails={openDetails}
                                initialData={editorial.periodStories}
                            />
                        </HomeRail>
                    )}

                    {comingSoon.length > 0 && (
                        <HomeRail title="In arrivo">
                            <MovieGridIntegrated
                                type="movie"
                                section="upcoming"
                                limit={HOME_RAIL_SIZE}
                                onPlay={play}
                                onDetails={openDetails}
                                initialData={comingSoon}
                            />
                        </HomeRail>
                    )}

                    <HomeRail title="Film Recenti">
                        <MovieGridIntegrated
                            type="movie"
                            section="recent"
                            limit={HOME_RAIL_SIZE}
                            onPlay={play}
                            onDetails={openDetails}
                            initialData={recentMovies}
                        />
                    </HomeRail>

                    <HomeRail title="Serie TV Popolari">
                        <MovieGridIntegrated
                            type="tv"
                            section="popular"
                            limit={HOME_RAIL_SIZE}
                            onPlay={play}
                            onDetails={openDetails}
                            initialData={popularTV}
                        />
                    </HomeRail>
                </div>
            </main>
        </MovieProvider>
    )
}
