'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, SkipBack, SkipForward } from 'lucide-react'
import { VideoPlayerProps, PlayerEvent } from '@/types'

export function VideoPlayer({
    tmdbId,
    type,
    season,
    episode,
    primaryColor = '#3b82f6',
    secondaryColor = '#8b5cf6',
    autoplay = false,
    startAt = 0,
    lang = 'it',
    onPlay,
    onPause,
    onSeeked,
    onEnded,
    onTimeUpdate
}: VideoPlayerProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const [showControls, setShowControls] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Genera l'URL del player
    const generatePlayerUrl = useCallback(() => {
        let baseUrl = ''

        if (type === 'movie') {
            baseUrl = `https://vixsrc.to/movie/${tmdbId}`
        } else if (type === 'tv' && season && episode) {
            baseUrl = `https://vixsrc.to/tv/${tmdbId}/${season}/${episode}`
        } else {
            setError('Parametri mancanti per il tipo TV')
            return ''
        }

        const url = new URL(baseUrl)
        url.searchParams.set('primaryColor', primaryColor)
        url.searchParams.set('secondaryColor', secondaryColor)
        url.searchParams.set('lang', lang)

        if (autoplay) {
            url.searchParams.set('autoplay', 'true')
        }

        if (startAt > 0) {
            url.searchParams.set('startAt', startAt.toString())
        }

        return url.toString()
    }, [tmdbId, type, season, episode, primaryColor, secondaryColor, autoplay, startAt, lang])

    // Gestisce gli eventi del player
    const handlePlayerEvent = useCallback((event: MessageEvent) => {
        try {
            if (!event.data || typeof event.data !== 'object') {
                return
            }

            const { type: eventType, data } = event.data as PlayerEvent

            switch (eventType) {
                case 'play':
                    setIsPlaying(true)
                    onPlay?.()
                    break
                case 'pause':
                    setIsPlaying(false)
                    onPause?.()
                    break
                case 'seeked':
                    if (typeof data?.time === 'number') {
                        setCurrentTime(data.time)
                        onSeeked?.(data.time)
                    }
                    break
                case 'ended':
                    setIsPlaying(false)
                    onEnded?.()
                    break
                case 'timeupdate':
                    if (typeof data?.time === 'number') {
                        setCurrentTime(data.time)
                        onTimeUpdate?.(data.time)
                    }
                    if (typeof data?.duration === 'number') {
                        setDuration(data.duration)
                    }
                    break
                case 'loadeddata':
                    setIsLoading(false)
                    break
                case 'error':
                    setError('Errore nel caricamento del video')
                    setIsLoading(false)
                    break
            }
        } catch (error) {
            console.error('Errore nella gestione evento player:', error)
        }
    }, [onPlay, onPause, onSeeked, onEnded, onTimeUpdate])

    // Setup event listener per i messaggi
    useEffect(() => {
        window.addEventListener('message', handlePlayerEvent)
        return () => window.removeEventListener('message', handlePlayerEvent)
    }, [handlePlayerEvent])

    // Gestisce il click per mostrare/nascondere i controlli
    const handlePlayerClick = () => {
        setShowControls(prev => !prev)
    }

    // Gestisce il toggle play/pause
    const togglePlayPause = () => {
        if (iframeRef.current) {
            const message = {
                type: isPlaying ? 'pause' : 'play'
            }
            iframeRef.current.contentWindow?.postMessage(message, '*')
        }
    }

    // Gestisce il cambio volume
    const toggleMute = () => {
        if (iframeRef.current) {
            const message = {
                type: 'volume',
                data: { volume: isMuted ? volume : 0 }
            }
            iframeRef.current.contentWindow?.postMessage(message, '*')
            setIsMuted(!isMuted)
        }
    }

    // Gestisce il seek
    const handleSeek = (time: number) => {
        if (iframeRef.current) {
            const message = {
                type: 'seek',
                data: { time }
            }
            iframeRef.current.contentWindow?.postMessage(message, '*')
        }
    }

    // Gestisce il fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            iframeRef.current?.requestFullscreen()
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }

    // Formatta il tempo
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const playerUrl = generatePlayerUrl()

    if (error) {
        return (
            <div className="w-full h-96 bg-black flex items-center justify-center">
                <div className="text-center text-white">
                    <p className="text-lg mb-4">Errore nel caricamento del video</p>
                    <p className="text-gray-400">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative w-full bg-black rounded-lg overflow-hidden group">
            {/* Loading State */}
            {isLoading && (
                <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
                    <div className="text-center text-white">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-lg">Loading video...</p>
                    </div>
                </div>
            )}

            {/* Video Player */}
            <div className="relative w-full aspect-video">
                <iframe
                    ref={iframeRef}
                    src={playerUrl}
                    className="w-full h-full"
                    allow="autoplay; fullscreen; encrypted-media"
                    allowFullScreen
                    onLoad={() => setIsLoading(false)}
                />

                {/* Overlay Controls */}
                <div
                    className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'
                        } group-hover:opacity-100`}
                    onClick={handlePlayerClick}
                >
                    {/* Center Play Button */}
                    {!isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Button
                                size="lg"
                                className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30 w-20 h-20 rounded-full"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    togglePlayPause()
                                }}
                            >
                                <Play className="w-8 h-8 ml-1" />
                            </Button>
                        </div>
                    )}

                    {/* Bottom Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        {/* Progress Bar */}
                        <div className="mb-4">
                            <div
                                className="w-full h-1 bg-white/30 rounded-full cursor-pointer"
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    const clickX = e.clientX - rect.left
                                    const percentage = clickX / rect.width
                                    const newTime = percentage * duration
                                    handleSeek(newTime)
                                }}
                            >
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all duration-200"
                                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        togglePlayPause()
                                    }}
                                >
                                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleSeek(Math.max(0, currentTime - 10))
                                    }}
                                >
                                    <SkipBack className="w-5 h-5" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleSeek(Math.min(duration, currentTime + 10))
                                    }}
                                >
                                    <SkipForward className="w-5 h-5" />
                                </Button>

                                <div className="flex items-center space-x-2 text-white text-sm">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>/</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toggleMute()
                                    }}
                                >
                                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20"
                                >
                                    <Settings className="w-5 h-5" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toggleFullscreen()
                                    }}
                                >
                                    <Maximize className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
