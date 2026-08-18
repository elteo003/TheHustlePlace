'use client'

import { useCallback, useRef, useState } from 'react'
import { ContentType } from '@/lib/content-navigation'
import { getYouTubeEmbedUrl } from '@/lib/tmdb'

const trailerCache = new Map<string, string>()

function cacheKey(id: number, type: ContentType) {
    return `${type}-${id}`
}

async function fetchTrailerEmbedUrl(id: number, type: ContentType): Promise<string | null> {
    const key = cacheKey(id, type)
    const cached = trailerCache.get(key)
    if (cached) return cached

    const apiType = type === 'movie' ? 'movies' : 'tv'
    const response = await fetch(`/api/tmdb/${apiType}/${id}/videos`)
    const data = await response.json()

    if (!data.success || !data.data?.results?.length) {
        return null
    }

    const videos = data.data.results
    const selected =
        videos.find(
            (video: { type: string; site: string; official?: boolean; key: string }) =>
                (video.type === 'Trailer' || video.type === 'Teaser') &&
                video.site === 'YouTube' &&
                video.official === true
        ) ||
        videos.find(
            (video: { type: string; site: string; key: string }) =>
                (video.type === 'Trailer' || video.type === 'Teaser') && video.site === 'YouTube'
        )

    if (!selected?.key) {
        return null
    }

    const embedUrl = `${getYouTubeEmbedUrl(selected.key, true, true, true)}&iv_load_policy=3&playsinline=1&fs=0`
    trailerCache.set(key, embedUrl)
    return embedUrl
}

export function useTrailerPreview(id: number, type: ContentType, delayMs = 700) {
    const [trailerUrl, setTrailerUrl] = useState<string | null>(null)
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
        setTrailerUrl(null)
        setIsLoading(false)
    }, [clearScheduledLoad])

    const scheduleTrailerLoad = useCallback(() => {
        clearScheduledLoad()
        timeoutRef.current = setTimeout(async () => {
            setIsLoading(true)
            try {
                const embedUrl = await fetchTrailerEmbedUrl(id, type)
                setTrailerUrl(embedUrl)
            } catch {
                setTrailerUrl(null)
            } finally {
                setIsLoading(false)
            }
        }, delayMs)
    }, [clearScheduledLoad, delayMs, id, type])

    return {
        trailerUrl,
        isLoading,
        scheduleTrailerLoad,
        resetPreview,
        clearScheduledLoad,
    }
}
