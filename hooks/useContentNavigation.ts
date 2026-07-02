'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import {
    ContentType,
    getContentId,
    getDetailsPath,
    getPlayerPath,
} from '@/lib/content-navigation'

export function useContentNavigation() {
    const router = useRouter()

    const play = useCallback(
        (id: number, type: ContentType = 'movie', options?: { season?: number; episode?: number }) => {
            router.push(getPlayerPath(id, type, options))
        },
        [router]
    )

    const openDetails = useCallback(
        (id: number, type: ContentType = 'movie') => {
            router.push(getDetailsPath(id, type))
        },
        [router]
    )

    const playItem = useCallback(
        (
            item: { id: number; tmdb_id?: number; contentType?: ContentType },
            type: ContentType = 'movie',
            options?: { season?: number; episode?: number }
        ) => {
            const itemType = item.contentType ?? type
            play(getContentId(item), itemType, options)
        },
        [play]
    )

    const openItemDetails = useCallback(
        (
            item: { id: number; tmdb_id?: number; contentType?: ContentType },
            type: ContentType = 'movie'
        ) => {
            const itemType = item.contentType ?? type
            openDetails(getContentId(item), itemType)
        },
        [openDetails]
    )

    return { play, openDetails, playItem, openItemDetails, getPlayerPath, getDetailsPath }
}
