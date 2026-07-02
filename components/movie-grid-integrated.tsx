'use client'

import { useEffect, useState } from 'react'
import { Movie, TVShow, Top10Content } from '@/types'
import MovieGrid from './movie-grid'
import { Top10Row } from './top-10-row'
import { CatalogSection } from '@/lib/catalog-types'

interface MovieGridIntegratedProps {
    type: 'movie' | 'tv'
    section: CatalogSection
    onPlay: (id: number, type?: 'movie' | 'tv') => void
    onDetails: (id: number, type?: 'movie' | 'tv') => void
    limit?: number
    initialData?: (Movie | TVShow | Top10Content)[]
}

function normalizeResults(
    data: unknown,
    section: CatalogSection,
    type: 'movie' | 'tv'
): (Movie | TVShow)[] {
    let results: (Movie | TVShow | Top10Content)[] = []

    if (Array.isArray(data)) {
        results = data
    } else if (data && typeof data === 'object' && 'results' in data) {
        results = (data as { results: (Movie | TVShow)[] }).results
    } else if (data) {
        results = [data as Movie | TVShow]
    }

    if (section === 'trending') {
        return (results as Top10Content[]).map((item) => ({
            ...item,
            contentType: item.type ?? type,
            tmdb_id: item.tmdb_id ?? item.id,
        })) as Movie[]
    }

    return results as (Movie | TVShow)[]
}

export default function MovieGridIntegrated({
    type,
    section,
    onPlay,
    onDetails,
    limit = 10,
    initialData,
}: MovieGridIntegratedProps) {
    const [movies, setMovies] = useState<(Movie | TVShow)[]>(
        initialData ? normalizeResults(initialData, section, type).slice(0, limit) : []
    )
    const [loading, setLoading] = useState(!initialData?.length)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (initialData?.length) {
            return
        }

        const fetchMovies = async () => {
            try {
                setLoading(true)
                setError(null)

                let endpoint = ''
                if (section === 'trending') {
                    endpoint = `/api/catalog/top-10`
                } else if (section === 'now-playing') {
                    endpoint = `/api/catalog/now-playing`
                } else if (section === 'popular') {
                    endpoint = type === 'movie' ? `/api/catalog/popular/movies` : `/api/catalog/popular/tv`
                } else if (section === 'recent') {
                    endpoint = type === 'movie' ? `/api/catalog/latest/movies` : `/api/catalog/latest/tv`
                } else if (section === 'top-rated') {
                    endpoint = type === 'movie' ? `/api/catalog/top-rated/movies` : `/api/catalog/top-rated/tv`
                } else {
                    endpoint = `/api/catalog/${section}/${type}`
                }

                const response = await fetch(endpoint)
                const data = await response.json()

                if (data.success) {
                    const results = normalizeResults(data.data, section, type)
                    if (results.length > 0) {
                        setMovies(results.slice(0, limit))
                    } else {
                        setError('Nessun contenuto disponibile')
                    }
                } else {
                    setError(data.error || 'Errore nel caricamento dei contenuti')
                }
            } catch {
                setError('Errore di connessione')
            } finally {
                setLoading(false)
            }
        }

        fetchMovies()
    }, [type, section, limit, initialData])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-8">
                <p className="text-gray-400 text-sm">Contenuto temporaneamente non disponibile</p>
            </div>
        )
    }

    if (movies.length === 0) {
        return (
            <div className="flex items-center justify-center py-8">
                <p className="text-gray-400 text-sm">Nessun contenuto disponibile</p>
            </div>
        )
    }

    if (section === 'trending') {
        return <Top10Row items={movies} type={type} onPlay={onPlay} onDetails={onDetails} />
    }

    return (
        <MovieGrid movies={movies} type={type} onPlay={onPlay} onDetails={onDetails} />
    )
}
