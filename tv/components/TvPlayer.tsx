'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ContentType } from '@/lib/content-navigation'
import { livingDetailsPath } from '@/tv/lib/paths'
import { VixsrcEmbedPlayer } from '@/components/vixsrc-embed-player'
import { useTrackWatch } from '@/hooks/useTrackWatch'
import { resolvePlayerStartAt } from '@/lib/watch-history'
import { parseStartAtParam } from '@/lib/watch-progress'
import { TvFocus } from '@/tv/components/TvFocus'

interface TvPlayerProps {
    id: number
    type: ContentType
}

export function TvPlayer({ id, type }: TvPlayerProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [title, setTitle] = useState(type === 'tv' ? 'Serie' : 'Film')
    const season = Number(searchParams.get('season') ?? '') || undefined
    const episode = Number(searchParams.get('episode') ?? '') || undefined
    const startAt = useMemo(
        () =>
            resolvePlayerStartAt({
                id,
                type,
                season,
                episode,
                urlStartAt: parseStartAtParam(searchParams.get('startAt')),
            }),
        [episode, id, searchParams, season, type]
    )
    const onPlayback = useTrackWatch({
        id,
        type,
        title,
        season,
        episode,
    })

    useEffect(() => {
        let cancelled = false
        const path = type === 'tv' ? `/api/tmdb/tv/${id}` : `/api/tmdb/movies/${id}`
        void fetch(path)
            .then((response) => response.json())
            .then((data) => {
                if (cancelled || !data.success || !data.data) return
                setTitle(data.data.title || data.data.name || title)
            })
        return () => {
            cancelled = true
        }
    }, [id, title, type])

    function back() {
        router.push(livingDetailsPath(id, type))
    }

    return (
        <div className="relative h-screen w-screen bg-black">
            <div className="absolute left-8 top-8 z-20">
                <TvFocus autoFocusItem onClick={back} className="rounded-lg bg-black/55 px-5 py-3 text-lg text-white">
                    Indietro
                </TvFocus>
            </div>
            <VixsrcEmbedPlayer
                tmdbId={id}
                type={type}
                season={season}
                episode={episode}
                title={title}
                startAt={startAt}
                onPlayback={onPlayback}
                onBack={back}
            />
        </div>
    )
}
