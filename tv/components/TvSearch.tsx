'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Movie, TVShow } from '@/types'
import { livingDetailsPath } from '@/tv/lib/paths'
import { TvKeyboard } from '@/tv/components/TvKeyboard'
import { TvNav } from '@/tv/components/TvNav'
import { TvRow } from '@/tv/components/TvRow'
import { TvRailItem } from '@/tv/lib/types'

export function TvSearch() {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [movies, setMovies] = useState<Movie[]>([])
    const [shows, setShows] = useState<TVShow[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const trimmed = query.trim()
        if (!trimmed) {
            setMovies([])
            setShows([])
            return
        }

        const handle = window.setTimeout(async () => {
            setLoading(true)
            try {
                const [moviesRes, tvRes] = await Promise.all([
                    fetch(`/api/catalog/search/movies?query=${encodeURIComponent(trimmed)}`),
                    fetch(`/api/catalog/search/tv?query=${encodeURIComponent(trimmed)}`),
                ])
                const moviesData = await moviesRes.json()
                const tvData = await tvRes.json()
                setMovies(moviesData.success ? (moviesData.data?.results ?? []) : [])
                setShows(tvData.success ? (tvData.data?.results ?? []) : [])
            } catch {
                setMovies([])
                setShows([])
            } finally {
                setLoading(false)
            }
        }, 280)

        return () => window.clearTimeout(handle)
    }, [query])

    return (
        <div className="flex min-h-screen flex-col gap-8">
            <TvNav />
            <div className="grid grid-cols-[28rem_minmax(0,1fr)] gap-10">
                <div>
                    <p className="mb-6 min-h-[3.5rem] text-4xl font-medium text-white">
                        {query || <span className="text-white/25">Cerca</span>}
                    </p>
                    <TvKeyboard
                        onChar={(char) => setQuery((current) => `${current}${char}`.slice(0, 40))}
                        onDelete={() => setQuery((current) => current.slice(0, -1))}
                    />
                </div>
                <div className="flex flex-col gap-8">
                    {loading && <p className="text-xl text-white/45">Cerco…</p>}
                    {!loading && query && movies.length === 0 && shows.length === 0 && (
                        <p className="text-xl text-white/45">Nessun risultato</p>
                    )}
                    <TvRow
                        title="Film"
                        items={movies as TvRailItem[]}
                        type="movie"
                        onSelect={(id, type) => router.push(livingDetailsPath(id, type))}
                    />
                    <TvRow
                        title="Serie"
                        items={shows as TvRailItem[]}
                        type="tv"
                        onSelect={(id, type) => router.push(livingDetailsPath(id, type))}
                    />
                </div>
            </div>
        </div>
    )
}
