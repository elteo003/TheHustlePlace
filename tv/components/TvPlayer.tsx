'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ContentType } from '@/lib/content-navigation'
import { livingDetailsPath } from '@/tv/lib/paths'
import { VixsrcEmbedPlayer } from '@/components/vixsrc-embed-player'
import { TastePrompt, useTastePrompt } from '@/components/taste-prompt'
import { useTrackWatch } from '@/hooks/useTrackWatch'
import { resolvePlayerStartAt } from '@/lib/watch-history'
import { parseStartAtParam } from '@/lib/watch-progress'

interface TvPlayerProps {
    id: number
    type: ContentType
}

export function TvPlayer({ id, type }: TvPlayerProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [title, setTitle] = useState(type === 'tv' ? 'Serie' : 'Film')
    const [episodeCount, setEpisodeCount] = useState(0)
    const [ended, setEnded] = useState(false)
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
        setEnded(false)
    }, [id, season, episode, type])

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

    useEffect(() => {
        if (type !== 'tv' || !season) {
            setEpisodeCount(0)
            return
        }
        let cancelled = false
        void fetch(`/api/tmdb/tv/${id}/seasons`)
            .then((response) => response.json())
            .then((data) => {
                if (cancelled || !data.success || !Array.isArray(data.data)) return
                const current = data.data.find(
                    (entry: { season_number?: number }) => entry.season_number === season
                )
                setEpisodeCount(Array.isArray(current?.episodes) ? current.episodes.length : 0)
            })
            .catch(() => {
                if (!cancelled) setEpisodeCount(0)
            })
        return () => {
            cancelled = true
        }
    }, [id, season, type])

    const taste = useTastePrompt({
        tmdbId: id,
        type,
        title,
        season,
        episode,
        episodeCount,
        ended,
    })

    const handleEnded = useCallback(() => setEnded(true), [])

    function back() {
        router.push(livingDetailsPath(id, type))
    }

    return (
        <div className="relative h-screen w-screen bg-black">
            <div className="absolute left-8 top-8 z-20">
                <button
                    type="button"
                    onClick={back}
                    className="rounded-lg bg-black/55 px-5 py-3 text-lg text-white"
                >
                    Indietro
                </button>
            </div>
            <VixsrcEmbedPlayer
                tmdbId={id}
                type={type}
                season={season}
                episode={episode}
                title={title}
                startAt={startAt}
                onPlayback={onPlayback}
                onEnded={handleEnded}
                onBack={back}
                nativeControls
            />
            {taste.moment && (
                <TastePrompt
                    title={taste.title}
                    moment={taste.moment}
                    onSubmit={taste.submit}
                    onSkip={taste.skip}
                />
            )}
        </div>
    )
}
