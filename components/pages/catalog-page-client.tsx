'use client'

import { useState, useCallback } from 'react'
import { MovieCard } from '@/components/movie-card'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { Movie, TVShow } from '@/types'
import { cn } from '@/lib/utils'

interface CatalogPageClientProps {
    initialMovies: Movie[]
    initialMoviesPage: number
    initialMoviesTotalPages: number
    initialTVShows: TVShow[]
    initialTVPage: number
    initialTVTotalPages: number
}

export function CatalogPageClient({
    initialMovies,
    initialMoviesPage,
    initialMoviesTotalPages,
    initialTVShows,
    initialTVPage,
    initialTVTotalPages,
}: CatalogPageClientProps) {
    const [activeTab, setActiveTab] = useState<'movies' | 'tv'>('movies')
    const [movies, setMovies] = useState(initialMovies)
    const [tvShows, setTVShows] = useState(initialTVShows)
    const [moviesPage, setMoviesPage] = useState(initialMoviesPage)
    const [tvPage, setTVPage] = useState(initialTVPage)
    const [moviesTotalPages, setMoviesTotalPages] = useState(initialMoviesTotalPages)
    const [tvTotalPages, setTVTotalPages] = useState(initialTVTotalPages)
    const [loading, setLoading] = useState(false)

    const fetchPage = useCallback(
        async (tab: 'movies' | 'tv', page: number) => {
            setLoading(true)
            try {
                const endpoint = tab === 'movies' ? '/api/catalog/movies' : '/api/catalog/tv'
                const res = await fetch(`${endpoint}?page=${page}`)
                const data = await res.json()
                if (data.success && data.data) {
                    if (tab === 'movies') {
                        setMovies(data.data.results ?? [])
                        setMoviesPage(data.data.page ?? page)
                        setMoviesTotalPages(data.data.total_pages ?? 1)
                    } else {
                        setTVShows(data.data.results ?? [])
                        setTVPage(data.data.page ?? page)
                        setTVTotalPages(data.data.total_pages ?? 1)
                    }
                }
            } finally {
                setLoading(false)
            }
        },
        []
    )

    const handleTabChange = (tab: 'movies' | 'tv') => {
        setActiveTab(tab)
    }

    const handlePageChange = (page: number) => {
        fetchPage(activeTab, page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const currentPage = activeTab === 'movies' ? moviesPage : tvPage
    const totalPages = activeTab === 'movies' ? moviesTotalPages : tvTotalPages

    return (
        <div className="min-h-screen bg-black">
            <main className="pt-8 pb-16">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-8">Catalogo</h1>

                    <div className="tab-pill-group mb-8 w-fit">
                        <button
                            type="button"
                            onClick={() => handleTabChange('movies')}
                            className={cn('tab-pill', activeTab === 'movies' && 'tab-pill-active')}
                        >
                            Film
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange('tv')}
                            className={cn('tab-pill', activeTab === 'tv' && 'tab-pill-active')}
                        >
                            Serie TV
                        </button>
                    </div>

                    <div
                        className={cn(
                            'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 transition-opacity duration-200',
                            loading && 'opacity-50 pointer-events-none'
                        )}
                    >
                        {activeTab === 'movies'
                            ? movies.map((movie) => (
                                  <MovieCard
                                      key={movie.id}
                                      movie={{
                                          ...movie,
                                          title: movie.title,
                                          poster_path: movie.poster_path ?? null,
                                          backdrop_path: movie.backdrop_path ?? null,
                                      }}
                                      type="movie"
                                  />
                              ))
                            : tvShows.map((show) => (
                                  <MovieCard
                                      key={show.id}
                                      movie={{
                                          id: show.id,
                                          title: show.name,
                                          overview: show.overview,
                                          poster_path: show.poster_path ?? null,
                                          backdrop_path: show.backdrop_path ?? null,
                                          release_date: show.first_air_date,
                                          vote_average: show.vote_average,
                                          vote_count: show.vote_count,
                                          popularity: show.popularity,
                                          adult: show.adult,
                                          video: false,
                                          genre_ids: show.genre_ids,
                                          original_language: show.original_language,
                                          original_title: show.original_name,
                                          tmdb_id: show.tmdb_id ?? show.id,
                                      }}
                                      type="tv"
                                  />
                              ))}
                    </div>

                    <PaginationBar
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        loading={loading}
                    />
                </div>
            </main>
        </div>
    )
}
