'use client'

import { useCallback, useRef, useState } from 'react'
import { ContentType } from '@/lib/content-navigation'
import { findMainTrailer, getYouTubeEmbedUrl, type TMDBVideo } from '@/lib/tmdb'

const trailerCache = new Map<string, string>()

function cacheKey(id: number, type: ContentType) {
    return `${type}-${id}`
}

export function buildTrailerEmbedUrl(videoKey: string, muted: boolean): string {
    return `${getYouTubeEmbedUrl(videoKey, true, muted, true)}&iv_load_policy=3&playsinline=1&fs=0`
}

export async function prefetchTrailerKey(id: number, type: ContentType): Promise<string | null> {
    const key = cacheKey(id, type)
    const cached = trailerCache.get(key)
    if (cached) return cached

    const apiType = type === 'movie' ? 'movies' : 'tv'
    const response = await fetch(`/api/tmdb/${apiType}/${id}/videos`)
    const data = await response.json()

    if (!data.success || !data.data?.results?.length) {
        return null
    }

    const selected = findMainTrailer(data.data.results as TMDBVideo[])

    if (!selected?.key) {
        return null
    }

    trailerCache.set(key, selected.key)
    return selected.key
}

export function useTrailerPreview(id: number, type: ContentType, delayMs = 700) {
    const [trailerKey, setTrailerKey] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const clearScheduledLoad = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
    }, [])

    const resetPreview = useCallback(() => {
        clearScheduledLoad()
        setTrailerKey(null)
        setIsLoading(false)
    }, [clearScheduledLoad])

    const scheduleTrailerLoad = useCallback(() => {
        clearScheduledLoad()
        const run = async () => {
            setIsLoading(true)
            try {
                const key = await prefetchTrailerKey(id, type)
                setTrailerKey(key)
            } catch {
                setTrailerKey(null)
            } finally {
                setIsLoading(false)
            }
        }
        if (delayMs <= 0) {
            void run()
            return
        }
        timeoutRef.current = setTimeout(run, delayMs)
    }, [clearScheduledLoad, delayMs, id, type])

    const trailerUrl = trailerKey ? buildTrailerEmbedUrl(trailerKey, true) : null

    return {
        trailerKey,
        trailerUrl,
        isLoading,
        scheduleTrailerLoad,
        resetPreview,
        clearScheduledLoad,
    }
}
