'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { HeroSection } from '@/components/hero-section'
import MovieGridIntegrated from '@/components/movie-grid-integrated'
import { ApiKeyError } from '@/components/api-key-error'
import { MovieProvider } from '@/contexts/MovieContext'
import { ContinueWatchingRow } from '@/components/continue-watching-row'
import { UpcomingTVSection } from '@/components/upcoming-tv-section'
import { UpcomingTVShowItem } from '@/lib/tv-upcoming'
import { useWatchHistory } from '@/hooks/useWatchHistory'
import { useContentNavigation } from '@/hooks/useContentNavigation'
import { occupiedFromRails, usePersonalRails } from '@/hooks/usePersonalRails'
import { CINEMA_RAIL_SIZE, HOME_RAIL_SIZE, TOP10_SIZE, CatalogSection } from '@/lib/catalog-types'
import { EDITORIAL_HOME_RAILS, EDITORIAL_RAIL_SIZE, EDITORIAL_RAIL_TITLES, EditorialRails } from '@/lib/editorial-rails'
import { PersonalRails } from '@/lib/personal-rails'
import { weavePlatformTop10s, type PlatformTop10 } from '@/lib/platform-top10'
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
    comingToCinema?: Top10Content[]
    personal: PersonalRails
    editorial: EditorialRails
    popularMovies: Movie[]
    recentMovies: Movie[]
    popularTV: TVShow[]
    recentTV: TVShow[]
    platformTop10: PlatformTop10
    initialUpcomingTV?: UpcomingTVShowItem[]
}

type HomeShelf = {
    id: string
    title: string
    type: 'movie' | 'tv'
    section: CatalogSection
    items: (Movie | TVShow | Top10Content)[]
    limit: number
    playable?: boolean
}

export function HomePageClient({
    top10,
    comingSoon = [],
    comingToCinema = [],
    personal,
    editorial,
    popularMovies,
    recentMovies,
    popularTV,
    recentTV,
    platformTop10,
    initialUpcomingTV = [],
}: HomePageClientProps) {
    const { play, openDetails } = useContentNavigation()
    const { entries: watchHistory } = useWatchHistory()
    const continueWatching = watchHistory.filter((entry) => !entry.continueHidden)
    const occupied = useMemo(
        () => occupiedFromRails([...top10, ...comingToCinema, ...comingSoon]),
        [top10, comingToCinema, comingSoon]
    )
    const rails = usePersonalRails({ initial: personal, occupied })
    const [hasApiKey, setHasApiKey] = useState(true)
    const [isCheckingApi, setIsCheckingApi] = useState(false)
    const [showUpcomingTrailers, setShowUpcomingTrailers] = useState(false)
    const [currentHeroMovieIndex, setCurrentHeroMovieIndex] = useState(0)

    const [upcomingTV, setUpcomingTV] = useState<UpcomingTVShowItem[]>(initialUpcomingTV)
    const [protectedSeriesIds, setProtectedSeriesIds] = useState<number[]>(() =>
        initialUpcomingTV.filter((item) => item.isFollowed).map((item) => item.id)
    )

    const followedTvIds = useMemo(() => {
        return watchHistory
            .filter((entry) => entry.type === 'tv')
            .filter((entry) => {
                if (entry.continueHidden) {
                    return (entry.progress ?? 0) < 90
                }
                return true
            })
            .map((entry) => entry.id)
    }, [watchHistory])

    useEffect(() => {
        let cancelled = false
        const params = new URLSearchParams()
        if (followedTvIds.length > 0) {
            params.set('followed', followedTvIds.join(','))
        }
        if (personal?.topGenres?.length) {
            params.set('topGenres', personal.topGenres.join(','))
        }
        const query = params.toString()
        if (!query) return

        fetch(`/api/catalog/tv-upcoming?${query}`)
            .then((res) => res.json())
            .then((data: { items?: UpcomingTVShowItem[]; protectedIds?: number[] }) => {
                if (cancelled) return
                if (data.items && data.items.length > 0) {
                    setUpcomingTV(data.items)
                }
                if (data.protectedIds) {
                    setProtectedSeriesIds(data.protectedIds)
                }
            })
            .catch(() => undefined)
        return () => {
            cancelled = true
        }
    }, [followedTvIds, personal?.topGenres])

    const shelves = useMemo(() => {
        const next: HomeShelf[] = []
        const push = (shelf: HomeShelf) => {
            if (shelf.items.length) next.push(shelf)
        }

        push({
            id: 'picks',
            title: 'Scelti per te oggi',
            type: 'movie',
            section: 'picks',
            items: rails.picks,
            limit: HOME_RAIL_SIZE,
        })
        push({
            id: 'top',
            title: 'Top 10 Titoli Oggi',
            type: 'movie',
            section: 'trending',
            items: top10,
            limit: TOP10_SIZE,
        })
        push({
            id: 'affinity',
            title: 'Pensiamo ti appassioneranno',
            type: 'movie',
            section: 'affinity',
            items: rails.affinity,
            limit: HOME_RAIL_SIZE,
        })
        push({
            id: 'popular-movies',
            title: 'Film Popolari',
            type: 'movie',
            section: 'popular',
            items: popularMovies,
            limit: HOME_RAIL_SIZE,
        })
        push({
            id: 'recent-tv',
            title: 'Serie TV Recenti',
            type: 'tv',
            section: 'recent',
            items: recentTV,
            limit: HOME_RAIL_SIZE,
        })
        push({
            id: 'treasures',
            title: 'Tesori per te',
            type: 'movie',
            section: 'treasures',
            items: rails.treasures,
            limit: HOME_RAIL_SIZE,
        })
        for (const { id, section } of EDITORIAL_HOME_RAILS) {
            push({
                id,
                title: EDITORIAL_RAIL_TITLES[id],
                type: 'movie',
                section,
                items: editorial[id],
                limit: EDITORIAL_RAIL_SIZE,
            })
        }
        push({
            id: 'recent-movies',
            title: 'Film Recenti',
            type: 'movie',
            section: 'recent',
            items: recentMovies,
            limit: HOME_RAIL_SIZE,
        })
        push({
            id: 'popular-tv',
            title: 'Serie TV Popolari',
            type: 'tv',
            section: 'popular',
            items: popularTV,
            limit: HOME_RAIL_SIZE,
        })
        push({
            id: 'coming-to-cinema',
            title: 'Presto al cinema',
            type: 'movie',
            section: 'coming-to-cinema',
            items: comingToCinema,
            limit: CINEMA_RAIL_SIZE,
            playable: false,
        })
        push({
            id: 'coming-soon',
            title: 'In arrivo',
            type: 'movie',
            section: 'upcoming',
            items: comingSoon,
            limit: HOME_RAIL_SIZE,
            playable: false,
        })

        return weavePlatformTop10s(next, [
            {
                id: 'platform-top10-tv',
                title: platformTop10.seriesTitle,
                type: 'tv',
                section: 'platform-top10-tv',
                items: platformTop10.series,
                limit: TOP10_SIZE,
            },
            {
                id: 'platform-top10-movie',
                title: platformTop10.moviesTitle,
                type: 'movie',
                section: 'platform-top10-movie',
                items: platformTop10.movies,
                limit: TOP10_SIZE,
            },
        ])
    }, [
        comingSoon,
        comingToCinema,
        editorial,
        platformTop10,
        popularMovies,
        popularTV,
        rails.affinity,
        rails.picks,
        rails.treasures,
        recentMovies,
        recentTV,
        top10,
    ])

    useEffect(() => {
        setIsCheckingApi(true)
        fetch('/api/test-api-key')
            .then((res) => res.json())
            .then((data) => setHasApiKey(data.hasApiKey))
            .catch(() => setHasApiKey(false))
            .finally(() => setIsCheckingApi(false))
    }, [])

    const showApiError = !hasApiKey && !isCheckingApi

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
                    {continueWatching.length > 0 && (
                        <section className="content-gutter pb-8 pt-5">
                            <h2 className="section-title">Continua a guardare</h2>
                            <ContinueWatchingRow
                                entries={continueWatching}
                                upcomingSeriesIds={protectedSeriesIds}
                            />
                        </section>
                    )}

                    {shelves.map((shelf, index) => {
                        const hasAffinity = shelves.some((s) => s.id === 'affinity')
                        const shouldShowUpcomingHere =
                            (shelf.id === 'affinity' || (!hasAffinity && index === Math.min(2, shelves.length - 1))) &&
                            upcomingTV.length > 0

                        return (
                            <div key={shelf.id}>
                                <HomeRail title={shelf.title}>
                                    <MovieGridIntegrated
                                        type={shelf.type}
                                        section={shelf.section}
                                        limit={shelf.limit}
                                        onPlay={shelf.playable === false ? undefined : play}
                                        onDetails={(id, type) =>
                                            openDetails(id, type, {
                                                watchable: shelf.playable !== false,
                                            })
                                        }
                                        initialData={shelf.items}
                                    />
                                </HomeRail>

                                {shouldShowUpcomingHere && (
                                    <UpcomingTVSection
                                        items={upcomingTV}
                                        onPlay={play}
                                        onDetails={(id, type) => openDetails(id, type)}
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>
            </main>
            <ApiKeyError open={showApiError} />
        </MovieProvider>
    )
}
