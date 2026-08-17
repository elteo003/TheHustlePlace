'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import { toast } from 'sonner'
import { VideoPlayerService } from '@/services/video-player.service'
import { ContentType } from '@/lib/content-navigation'

const LOAD_TIMEOUT_MS = 30000

interface VixsrcEmbedPlayerProps {
    tmdbId: number
    type: ContentType
    season?: number
    episode?: number
    title: string
    onEnded?: () => void
    onBack?: () => void
    unavailableTitle?: string
    unavailableDescription?: string
}

export function VixsrcEmbedPlayer({
    tmdbId,
    type,
    season,
    episode,
    title,
    onEnded,
    onBack,
    unavailableTitle = 'Contenuto non disponibile',
    unavailableDescription = 'Questo titolo non è attualmente disponibile su vixsrc.to',
}: VixsrcEmbedPlayerProps) {
    const playerService = useMemo(() => new VideoPlayerService(), [])
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [iframeError, setIframeError] = useState(false)
    const [iframeLoaded, setIframeLoaded] = useState(false)

    const playerUrl = playerService.getPlayerUrl(
        tmdbId,
        type,
        season,
        episode
    )

    useEffect(() => {
        setIframeError(false)
        setIframeLoaded(false)

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
            setIframeError(true)
            toast.error('Il player non si è caricato in tempo')
        }, LOAD_TIMEOUT_MS)

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [playerUrl])

    useEffect(() => {
        if (!onEnded) return

        const handleMessage = (event: MessageEvent) => {
            if (!event.origin?.includes('vixsrc.to')) return
            if (!event.data || typeof event.data !== 'object') return
            if (event.data.type === 'ended') {
                onEnded()
            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [onEnded])

    const clearLoadTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
    }

    const handleLoad = () => {
        clearLoadTimeout()
        setIframeLoaded(true)
        setIframeError(false)
    }

    const handleError = () => {
        clearLoadTimeout()
        setIframeError(true)
        toast.error('Impossibile caricare il player')
    }

    if (iframeError) {
        return (
            <div className="relative z-10 flex items-center justify-center h-full">
                <div className="text-center max-w-2xl mx-auto px-8">
                    <h1 className="text-4xl font-bold mb-4 text-white">{title}</h1>
                    <p className="text-xl text-gray-300 mb-2">{unavailableTitle}</p>
                    <p className="text-lg text-gray-400 mb-8">{unavailableDescription}</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            onClick={() =>
                                window.open(
                                    playerUrl.split('?')[0],
                                    '_blank',
                                    'noopener,noreferrer'
                                )
                            }
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            <Play className="w-5 h-5 mr-2" />
                            Prova su vixsrc.to
                        </Button>
                        {onBack && (
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={onBack}
                                className="border-white/30 text-white hover:bg-white/10"
                            >
                                Torna indietro
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="relative z-10 w-full h-full">
            {!iframeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white" />
                </div>
            )}
            <iframe
                src={playerUrl}
                className="w-full h-full border-0"
                allowFullScreen
                title={title}
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media; web-share"
                referrerPolicy="no-referrer"
                loading="eager"
                onLoad={handleLoad}
                onError={handleError}
            />
        </div>
    )
}
