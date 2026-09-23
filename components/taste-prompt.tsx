'use client'

import { useCallback, useEffect, useState } from 'react'
import {
    promptForPlayback,
    type FeedbackMoment,
    type Liking,
    type WouldContinue,
} from '@/lib/taste-ranker'

interface TastePromptProps {
    title: string
    moment: FeedbackMoment
    onSubmit: (liking: Liking, wouldContinue?: WouldContinue | null) => void
    onSkip: () => void
}

const MID_LIKING_OPTIONS: Array<{ id: Liking; label: string }> = [
    { id: 'yes', label: 'Sì' },
    { id: 'a_lot', label: 'Parecchio' },
    { id: 'thrilled', label: 'Mi sta entusiasmando' },
]

const END_LIKING_OPTIONS: Array<{ id: Liking; label: string }> = [
    { id: 'yes', label: 'Sì' },
    { id: 'a_lot', label: 'Parecchio' },
    { id: 'thrilled', label: 'Mi ha entusiasmato' },
]

function isClosingMoment(moment: FeedbackMoment) {
    return moment === 'end_movie' || moment === 'end_season'
}

export function TastePrompt({ title, moment, onSubmit, onSkip }: TastePromptProps) {
    const [liking, setLiking] = useState<Liking | null>(null)
    const closing = isClosingMoment(moment)
    const likingOptions = closing ? END_LIKING_OPTIONS : MID_LIKING_OPTIONS

    function askCopy() {
        if (moment === 'end_movie') return `Ti è piaciuto ${title}?`
        if (moment === 'end_season') return `Ti è piaciuta questa stagione di ${title}?`
        return `Ti sta piacendo ${title}?`
    }

    function rewatchCopy() {
        if (moment === 'end_season') return 'La riguarderesti?'
        return 'Lo riguarderesti?'
    }

    function choose(next: Liking) {
        if (!closing) {
            onSubmit(next, null)
            return
        }
        setLiking(next)
    }

    return (
        <div className="absolute inset-0 z-40 flex items-end justify-center bg-gradient-to-t from-black via-black/70 to-transparent p-8 md:p-12">
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-black/80 p-6 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-white/45 mb-3">Un attimo</p>
                <h3 className="text-2xl font-semibold text-white leading-snug mb-6">{askCopy()}</h3>
                {!liking && (
                    <div className="flex flex-col gap-2">
                        {likingOptions.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => choose(option.id)}
                                className="h-12 rounded-md bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
                {closing && liking && (
                    <div>
                        <p className="text-white mb-4">{rewatchCopy()}</p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => onSubmit(liking, 'yes')}
                                className="flex-1 h-12 rounded-md bg-white text-black font-semibold"
                            >
                                Sì
                            </button>
                            <button
                                type="button"
                                onClick={() => onSubmit(liking, 'no')}
                                className="flex-1 h-12 rounded-md bg-white/10 text-white font-semibold"
                            >
                                No
                            </button>
                        </div>
                    </div>
                )}
                <button
                    type="button"
                    onClick={() => (liking ? onSubmit(liking, null) : onSkip())}
                    className="mt-4 w-full text-sm text-white/45 hover:text-white py-1"
                >
                    Salta
                </button>
            </div>
        </div>
    )
}

export type TastePromptStatus = 'idle' | 'checking' | 'prompt' | 'done'

export function useTastePrompt(input: {
    tmdbId?: number
    type: 'movie' | 'tv'
    title: string
    season?: number
    episode?: number
    episodeCount?: number
    ended: boolean
}) {
    const [moment, setMoment] = useState<FeedbackMoment | null>(null)
    const [inner, setInner] = useState<TastePromptStatus>('idle')

    const status: TastePromptStatus = !input.ended ? 'idle' : inner === 'idle' ? 'checking' : inner
    const pending = status === 'checking' || status === 'prompt'

    const close = useCallback(() => {
        setMoment(null)
        setInner('done')
    }, [])

    useEffect(() => {
        if (!input.ended) {
            setMoment(null)
            setInner('idle')
            return
        }
        if (!input.tmdbId) {
            setInner('done')
            return
        }

        const nextMoment = promptForPlayback({
            type: input.type,
            episode: input.episode,
            episodeCount: input.episodeCount,
        })
        if (!nextMoment) {
            setInner('done')
            return
        }

        setInner('checking')
        let cancelled = false
        void fetch(
            `/api/taste/feedback?tmdbId=${input.tmdbId}&type=${input.type}&season=${input.season || 0}&moment=${nextMoment}`
        )
            .then((response) => response.json())
            .then((data) => {
                if (cancelled) return
                if (data.answered) {
                    setInner('done')
                    return
                }
                setMoment(nextMoment)
                setInner('prompt')
            })
            .catch(() => {
                if (!cancelled) setInner('done')
            })

        return () => {
            cancelled = true
        }
    }, [input.ended, input.episode, input.episodeCount, input.season, input.tmdbId, input.type])

    const submit = useCallback(
        async (liking: Liking, wouldContinue?: WouldContinue | null) => {
            if (!input.tmdbId || !moment) {
                close()
                return
            }
            await fetch('/api/taste/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tmdbId: input.tmdbId,
                    type: input.type,
                    season: input.season || 0,
                    moment,
                    liking,
                    wouldContinue: wouldContinue ?? null,
                }),
            }).catch(() => undefined)
            close()
        },
        [close, input.season, input.tmdbId, input.type, moment]
    )

    const skip = useCallback(async () => {
        if (!input.tmdbId || !moment) {
            close()
            return
        }
        await fetch('/api/taste/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tmdbId: input.tmdbId,
                type: input.type,
                season: input.season || 0,
                moment,
                liking: 'skipped',
            }),
        }).catch(() => undefined)
        close()
    }, [close, input.season, input.tmdbId, input.type, moment])

    return { moment, title: input.title, status, pending, submit, skip }
}
