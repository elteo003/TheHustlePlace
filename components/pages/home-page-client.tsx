'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
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
import { weavePlatformTop10s, pinTailRails, type PlatformTop10, type PlatformChart, type PlatformHubData } from '@/lib/platform-top10'
import { StudiosAndPlatformsRow } from '@/components/studios-and-platforms-row'
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
    const occupied = useMemo(
        () => occupiedFromRails([...top10, ...comingToCinema, ...comingSoon]),
        [top10, comingToCinema, comingSoon]
    )
    const rails = usePersonalRails({ initial: personal, occupied })
    const [hasApiKey, setHasApiKey] = useState(true)
    const [isCheckingApi, setIsCheckingApi] = useState(false)
    const [showUpcomingTrailers, setShowUpcomingTrailers] = useState(false)
    const [currentHeroMovieIndex, setCurrentHeroMovieIndex] = useState(0)

    const isFree = platformTop10.isFreeDay || !platformTop10.platform
    const [activePlatformTop10, setActivePlatformTop10] = useState<PlatformTop10>(platformTop10)
    const [selectedPlatformSlug, setSelectedPlatformSlug] = useState<string | null>(null)
    const [platformHubData, setPlatformHubData] = useState<PlatformHubData | null>(null)
    const [isLoadingPlatform, setIsLoadingPlatform] = useState(false)

    const continueWatching = useMemo(() => {
        const unhidden = watchHistory.filter((entry) => !entry.continueHidden)
        if (!selectedPlatformSlug) {
            return unhidden
        }
        if (!platformHubData) {
            return []
        }
        const matchingSet = new Set(platformHubData.matchingHistoryIds)
        return unhidden.filter((entry) => matchingSet.has(entry.id))
    }, [watchHistory, selectedPlatformSlug, platformHubData])

    const handleSelectPlatform = useCallback(
        async (platform: PlatformChart) => {
            if (platform.slug === selectedPlatformSlug) return
            setSelectedPlatformSlug(platform.slug)
            setPlatformHubData(null)
            setIsLoadingPlatform(true)
            try {
                const historyParam = watchHistory
                    .map((entry) => `${entry.id}:${entry.type}`)
                    .join(',')
                const query = historyParam
                    ? `?platform=${encodeURIComponent(platform.slug)}&history=${encodeURIComponent(historyParam)}`
                    : `?platform=${encodeURIComponent(platform.slug)}`

                const res = await fetch(`/api/catalog/platform-hub${query}`)
                const json = await res.json()
                if (json?.data) {
                    setPlatformHubData(json.data)
                }
            } catch (error) {
                console.error('Errore nel recupero della piattaforma', error)
            } finally {
                setIsLoadingPlatform(false)
            }
        },
        [selectedPlatformSlug, watchHistory]
    )

    const handleResetToHome = useCallback(() => {
        setSelectedPlatformSlug(null)
        setPlatformHubData(null)
        setActivePlatformTop10(platformTop10)
    }, [platformTop10])

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

        if (selectedPlatformSlug) {
            if (!platformHubData) return []

            push({
                id: 'platform-top10-tv',
                title: `Top 10 serie TV da ${platformHubData.platform.label}`,
                type: 'tv',
                section: 'platform-top10-tv',
                items: platformHubData.seriesTop10,
                limit: TOP10_SIZE,
            })
            push({
                id: 'platform-popular-tv',
                title: `Serie TV popolari su ${platformHubData.platform.label}`,
                type: 'tv',
                section: 'popular',
                items: platformHubData.popularSeries,
                limit: HOME_RAIL_SIZE,
            })
            push({
                id: 'platform-popular-movies',
                title: `Film popolari su ${platformHubData.platform.label}`,
                type: 'movie',
                section: 'popular',
                items: platformHubData.popularMovies,
                limit: HOME_RAIL_SIZE,
            })
            push({
                id: 'platform-recent',
                title: `Nuove uscite su ${platformHubData.platform.label}`,
                type: 'movie',
                section: 'recent',
                items: platformHubData.recentTitles,
                limit: HOME_RAIL_SIZE,
            })
            push({
                id: 'platform-top10-movie',
                title: `Top 10 film da ${platformHubData.platform.label}`,
                type: 'movie',
                section: 'platform-top10-movie',
                items: platformHubData.moviesTop10,
                limit: TOP10_SIZE,
            })
            return next
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
                title: activePlatformTop10.seriesTitle,
                type: 'tv',
                section: 'platform-top10-tv',
                items: activePlatformTop10.series,
                limit: TOP10_SIZE,
            },
            {
                id: 'platform-top10-movie',
                title: activePlatformTop10.moviesTitle,
                type: 'movie',
                section: 'platform-top10-movie',
                items: activePlatformTop10.movies,
                limit: TOP10_SIZE,
            },
        ])
    }, [
        activePlatformTop10,
        comingSoon,
        comingToCinema,
        editorial,
        platformHubData,
        popularMovies,
        popularTV,
        rails.affinity,
        rails.picks,
        rails.treasures,
        recentMovies,
        recentTV,
        selectedPlatformSlug,
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

                    {(isFree || Boolean(selectedPlatformSlug)) && (
                        <StudiosAndPlatformsRow
                            selectedSlug={selectedPlatformSlug}
                            onSelectPlatform={handleSelectPlatform}
                            onResetToHome={handleResetToHome}
                            isLoading={isLoadingPlatform}
                        />
                    )}

                    {isLoadingPlatform && !platformHubData && (
                        <div className="content-gutter py-8 space-y-8 animate-pulse">
                            <div>
                                <div className="h-6 w-48 bg-white/10 rounded-md mb-4" />
                                <div className="flex gap-4 overflow-hidden">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-[160px] md:w-[190px] aspect-[2/3] rounded-xl bg-white/5 shrink-0"
                                        />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="h-6 w-40 bg-white/10 rounded-md mb-4" />
                                <div className="flex gap-4 overflow-hidden">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-[160px] md:w-[190px] aspect-[2/3] rounded-xl bg-white/5 shrink-0"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {shelves.map((shelf, index) => {
                        const hasAffinity = shelves.some((s) => s.id === 'affinity')
                        const shouldShowUpcomingHere =
                            !selectedPlatformSlug &&
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
