'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Grid, List } from 'lucide-react'
import { Movie, TVShow } from '@/types'
import Link from 'next/link'
import Image from 'next/image'
import { ContentType, getContentId, getPlayerPath } from '@/lib/content-navigation'
import { ContentItem, getContentPosterUrl } from '@/lib/content-display'
import { ContentHoverCard } from '@/components/content-hover-card'
import { TrailerDock } from '@/components/trailer-dock'
import { useRowPeek } from '@/contexts/trailer-peek-context'
import { useContentNavigation } from '@/hooks/useContentNavigation'
import { useIsCoarsePointer, useReducedMotion } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import { TabPillGroup } from '@/components/ui/tab-pill-group'
import { motion } from 'framer-motion'

const EMPTY_RESULTS = {
    movies: [] as Movie[],
    tvShows: [] as TVShow[],
    totalMovies: 0,
    totalTVShows: 0,
}

function matchesQuery(title: string, query: string) {
    return title.toLowerCase().includes(query.toLowerCase())
}

function SearchListRow({
    title,
    overview,
    posterPath,
    onPlay,
}: {
    title: string
    overview: string
    posterPath: string | null | undefined
    onPlay: () => void
}) {
    return (
        <div className="flex items-start gap-4 py-5">
            <div className="relative aspect-[2/3] w-[5.5rem] shrink-0 overflow-hidden rounded-md bg-zinc-900 sm:w-24">
                <Image
                    src={getContentPosterUrl(posterPath, 'w500')}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="96px"
                />
            </div>
            <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold leading-snug text-white">{title}</h3>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/60">
                    {overview || 'Nessuna descrizione disponibile'}
                </p>
                <button type="button" onClick={onPlay} className="btn-play mt-3 h-9 px-4 text-sm">
                    Guarda
                </button>
            </div>
        </div>
    )
}

function SearchResultsFade({
    children,
}: {
    children: ReactNode
}) {
    const reduceMotion = useReducedMotion()

    return (
        <motion.div
            className="space-y-8"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
            {children}
        </motion.div>
    )
}

function SearchPosterGrid({
    items,
    type,
    className,
}: {
    items: ContentItem[]
    type: ContentType
    className?: string
}) {
    const isTouch = useIsCoarsePointer()
    const { play, openDetails } = useContentNavigation()
    const [expandedId, setExpandedId] = useState<number | null>(null)
    const { peekId, isPosterHidden, onPeek, onClose, onExited } = useRowPeek()
    const peekItem = items.find((item) => getContentId(item) === peekId) ?? null

    return (
        <div>
            <div className={className}>
                {items.map((item) => {
                    const id = getContentId(item)
                    return (
                        <ContentHoverCard
                            key={`${type}-${id}`}
                            item={item}
                            type={type}
                            variant="grid"
                            isExpanded={!isTouch && expandedId === id}
                            onExpand={() => setExpandedId(id)}
                            onCollapse={() => setExpandedId(null)}
                            onPeek={() => onPeek(id)}
                            isPeeking={isPosterHidden(id)}
                            onPlay={play}
                            onDetails={openDetails}
                        />
                    )
                })}
            </div>
            <TrailerDock
                item={isTouch ? peekItem : null}
                type={type}
                onClose={onClose}
                onExited={onExited}
                onPlay={play}
                onDetails={openDetails}
            />
        </div>
    )
}

export function SearchPageClient() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const query = searchParams.get('q') ?? ''
    const trimmedQuery = query.trim()

    const [results, setResults] = useState(EMPTY_RESULTS)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'tv'>('all')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [isTransitioning, setIsTransitioning] = useState(false)
    const requestId = useRef(0)

    const searchContent = useCallback(async (searchQuery: string, signal: AbortSignal) => {
        const [moviesRes, tvRes] = await Promise.all([
            fetch(`/api/catalog/search/movies?query=${encodeURIComponent(searchQuery)}`, { signal }),
            fetch(`/api/catalog/search/tv?query=${encodeURIComponent(searchQuery)}`, { signal }),
        ])

        const moviesData = await moviesRes.json()
        const tvData = await tvRes.json()

        return {
            movies: moviesData.success ? (moviesData.data?.results ?? []) : [],
            tvShows: tvData.success ? (tvData.data?.results ?? []) : [],
            totalMovies: moviesData.success ? (moviesData.data?.total_results ?? 0) : 0,
            totalTVShows: tvData.success ? (tvData.data?.total_results ?? 0) : 0,
        }
    }, [])

    useEffect(() => {
        if (!trimmedQuery) {
            requestId.current += 1
            setResults(EMPTY_RESULTS)
            setLoading(false)
            setError(null)
            router.replace('/home')
            return
        }

        setResults((current) => ({
            movies: current.movies.filter((movie) => matchesQuery(movie.title, trimmedQuery)),
            tvShows: current.tvShows.filter((show) => matchesQuery(show.name, trimmedQuery)),
            totalMovies: current.totalMovies,
            totalTVShows: current.totalTVShows,
        }))

        const controller = new AbortController()
        const currentRequest = ++requestId.current
        setLoading(true)
        setError(null)

        searchContent(trimmedQuery, controller.signal)
            .then((next) => {
                if (currentRequest !== requestId.current) return
                setResults(next)
                setLoading(false)
            })
            .catch((err: unknown) => {
                if (controller.signal.aborted || currentRequest !== requestId.current) return
                setError(err instanceof Error ? err.message : 'Errore nel caricamento dei risultati')
                setLoading(false)
            })

        return () => {
            controller.abort()
        }
    }, [router, searchContent, trimmedQuery])

    const getFilteredResults = () => {
        switch (activeTab) {
            case 'movies':
                return { movies: results.movies, tvShows: [] }
            case 'tv':
                return { movies: [], tvShows: results.tvShows }
            default:
                return { movies: results.movies, tvShows: results.tvShows }
        }
    }

    const filteredResults = getFilteredResults()
    const totalResults = results.totalMovies + results.totalTVShows

    const handleViewModeChange = (newViewMode: 'grid' | 'list') => {
        if (newViewMode === viewMode) return
        setIsTransitioning(true)
        setTimeout(() => {
            setViewMode(newViewMode)
            setTimeout(() => setIsTransitioning(false), 50)
        }, 300)
    }

    if (!trimmedQuery) {
        return <main className="min-h-screen bg-black" />
    }

    const isFreshSearch = loading && results.movies.length === 0 && results.tvShows.length === 0

    if (error && isFreshSearch) {
        return (
            <main className="min-h-screen bg-black">
                <div className="content-gutter pt-12 pb-8">
                    <div className="text-center">
                        <h1 className="mb-4 text-2xl font-semibold text-white">Errore nella ricerca</h1>
                        <p className="mb-6 text-white/50">{error}</p>
                        <button
                            type="button"
                            onClick={() => {
                                const controller = new AbortController()
                                setLoading(true)
                                setError(null)
                                searchContent(trimmedQuery, controller.signal)
                                    .then((next) => {
                                        setResults(next)
                                        setLoading(false)
                                    })
                                    .catch(() => {
                                        setError('Errore nel caricamento dei risultati')
                                        setLoading(false)
                                    })
                            }}
                            className="btn-play"
                        >
                            Riprova
                        </button>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-black">
            <div className="content-gutter pt-12 pb-8">
                {trimmedQuery && (
                    <>
                        <div className="mb-10 grid grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                            <div className="min-w-0">
                                <h1 className="flex items-baseline gap-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                                    <span className="truncate">Risultati per &ldquo;{query}&rdquo;</span>
                                    {loading && <Spinner size="sm" />}
                                    <span className="text-sm font-normal text-white/50">
                                        {loading && isFreshSearch
                                            ? 'Cerco i titoli…'
                                            : totalResults > 0
                                              ? `${totalResults} risultati`
                                              : 'Nessun risultato'}
                                    </span>
                                </h1>
                            </div>

                            <TabPillGroup
                                className="justify-self-start md:justify-self-center"
                                layoutId="search-filter-pill"
                                value={activeTab}
                                onChange={setActiveTab}
                                items={[
                                    { id: 'all', label: `Tutto (${totalResults})` },
                                    { id: 'movies', label: `Film (${results.totalMovies})` },
                                    { id: 'tv', label: `Serie TV (${results.totalTVShows})` },
                                ]}
                            />

                            <div className="flex items-center gap-1 justify-self-start md:justify-self-end">
                                <button
                                    type="button"
                                    onClick={() => handleViewModeChange('grid')}
                                    disabled={isTransitioning}
                                    className={cn(
                                        'icon-btn',
                                        viewMode === 'grid' && 'icon-btn-active',
                                        isTransitioning && 'opacity-50 cursor-not-allowed'
                                    )}
                                    aria-label="Vista griglia"
                                >
                                    <Grid className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleViewModeChange('list')}
                                    disabled={isTransitioning}
                                    className={cn(
                                        'icon-btn',
                                        viewMode === 'list' && 'icon-btn-active',
                                        isTransitioning && 'opacity-50 cursor-not-allowed'
                                    )}
                                    aria-label="Vista lista"
                                >
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {isFreshSearch ? (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                {Array.from({ length: 12 }).map((_, index) => (
                                    <div key={index} className="poster-tile aspect-[2/3] rounded-lg shimmer" />
                                ))}
                            </div>
                        ) : totalResults === 0 ? (
                            <div className="text-center py-16">
                                <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold text-white mb-2">
                                    Nessun risultato trovato
                                </h2>
                                <p className="text-white/50 mb-6 text-sm">
                                    Prova con altri termini o esplora il catalogo
                                </p>
                                <Link href="/home" className="btn-play inline-flex">
                                    Torna alla Home
                                </Link>
                            </div>
                        ) : (
                            <SearchResultsFade key={activeTab}>
                                {filteredResults.movies.length > 0 && (
                                    <section>
                                        <h2 className="section-title !mb-4">
                                            Film ({filteredResults.movies.length})
                                        </h2>
                                        {viewMode === 'grid' ? (
                                            <SearchPosterGrid
                                                items={filteredResults.movies}
                                                type="movie"
                                                className={cn(
                                                    'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
                                                    isTransitioning && 'opacity-0'
                                                )}
                                            />
                                        ) : (
                                        <div className="divide-y divide-white/15">
                                            {filteredResults.movies.map((movie) => (
                                                <SearchListRow
                                                    key={movie.id}
                                                    title={movie.title}
                                                    overview={movie.overview}
                                                    posterPath={movie.poster_path}
                                                    onPlay={() => {
                                                        router.push(
                                                            getPlayerPath(getContentId(movie), 'movie')
                                                        )
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        )}
                                    </section>
                                )}

                                {filteredResults.tvShows.length > 0 && (
                                    <section>
                                        <h2 className="section-title !mb-4">
                                            Serie TV ({filteredResults.tvShows.length})
                                        </h2>
                                        {viewMode === 'grid' ? (
                                            <SearchPosterGrid
                                                items={filteredResults.tvShows}
                                                type="tv"
                                                className={cn(
                                                    'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
                                                    isTransitioning && 'opacity-0'
                                                )}
                                            />
                                        ) : (
                                        <div className="divide-y divide-white/15">
                                            {filteredResults.tvShows.map((tvShow) => (
                                                <SearchListRow
                                                    key={tvShow.id}
                                                    title={tvShow.name}
                                                    overview={tvShow.overview}
                                                    posterPath={tvShow.poster_path}
                                                    onPlay={() => {
                                                        router.push(
                                                            getPlayerPath(getContentId(tvShow), 'tv')
                                                        )
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        )}
                                    </section>
                                )}
                            </SearchResultsFade>
                        )}
                    </>
                )}
            </div>
        </main>
    )
}
