'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseYouTubePlayerProps {
    videoId: string | null
    onReady?: () => void
    onStateChange?: (event: any) => void
}

interface UseYouTubePlayerReturn {
    player: any
    isReady: boolean
    isPlaying: boolean
    isMuted: boolean
    mute: () => void
    unMute: () => void
    play: () => void
    pause: () => void
    setVolume: (volume: number) => void
}

declare global {
    interface Window {
        YT: any
        onYouTubeIframeAPIReady: () => void
    }
}

export const useYouTubePlayer = ({ 
    videoId, 
    onReady, 
    onStateChange 
}: UseYouTubePlayerProps): UseYouTubePlayerReturn => {
    const [player, setPlayer] = useState<any>(null)
    const [isReady, setIsReady] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(true)
    const playerInstanceRef = useRef<any>(null)
    const isInitializingRef = useRef<boolean>(false)

    // Inizializza il player quando l'API è pronta
    useEffect(() => {
        const initializePlayer = () => {
            if (!videoId || playerInstanceRef.current || isInitializingRef.current) return

            isInitializingRef.current = true

            const playerElement = document.getElementById('youtube-player')
            if (!playerElement) {
                console.log('⚠️ Elemento youtube-player non trovato, riprovo tra 100ms')
                isInitializingRef.current = false
                setTimeout(initializePlayer, 100)
                return
            }

            try {
                // Distruggi player esistente se c'è
                if (playerInstanceRef.current) {
                    playerInstanceRef.current.destroy()
                    playerInstanceRef.current = null
                }

                const newPlayer = new window.YT.Player(playerElement, {
                    videoId: videoId,
                    playerVars: {
                        autoplay: 1,
                        mute: 1,
                        controls: 0,
                        showinfo: 0,
                        rel: 0,
                        modestbranding: 1,
                        iv_load_policy: 3,
                        fs: 0,
                        disablekb: 1,
                        loop: 1,
                        playlist: videoId
                    },
                    events: {
                        onReady: (event: any) => {
                            console.log('🎬 YouTube Player pronto:', videoId)
                            setPlayer(event.target)
                            playerInstanceRef.current = event.target
                            setIsReady(true)
                            setIsMuted(true)
                            isInitializingRef.current = false
                            onReady?.()
                        },
                        onStateChange: (event: any) => {
                            console.log('🎬 YouTube Player state change:', event.data)
                            setIsPlaying(event.data === window.YT.PlayerState.PLAYING)
                            onStateChange?.(event)
                        }
                    }
                })
            } catch (error) {
                console.error('❌ Errore inizializzazione YouTube Player:', error)
                isInitializingRef.current = false
            }
        }

        // Se l'API è già caricata
        if (window.YT && window.YT.Player) {
            initializePlayer()
        } else {
            // Aspetta che l'API sia caricata
            window.onYouTubeIframeAPIReady = () => {
                console.log('🎬 YouTube API pronta')
                initializePlayer()
            }
        }

        return () => {
            if (playerInstanceRef.current) {
                try {
                    playerInstanceRef.current.destroy()
                    playerInstanceRef.current = null
                } catch (error) {
                    console.error('❌ Errore distruzione player:', error)
                }
            }
        }
    }, [videoId, onReady, onStateChange])

    // Reset stato quando cambia videoId (ma non distruggere il player qui)
    useEffect(() => {
        if (videoId) {
            setPlayer(null)
            setIsReady(false)
            setIsPlaying(false)
            setIsMuted(true)
        }
    }, [videoId])

    const mute = useCallback(() => {
        if (playerInstanceRef.current && isReady) {
            try {
                playerInstanceRef.current.mute()
                setIsMuted(true)
                console.log('🔇 Audio disattivato')
            } catch (error) {
                console.error('❌ Errore mute:', error)
            }
        }
    }, [isReady])

    const unMute = useCallback(() => {
        if (playerInstanceRef.current && isReady) {
            try {
                playerInstanceRef.current.unMute()
                setIsMuted(false)
                console.log('🔊 Audio attivato')
            } catch (error) {
                console.error('❌ Errore unMute:', error)
            }
        }
    }, [isReady])

    const play = useCallback(() => {
        if (playerInstanceRef.current && isReady) {
            try {
                playerInstanceRef.current.playVideo()
                console.log('▶️ Riproduzione avviata')
            } catch (error) {
                console.error('❌ Errore play:', error)
            }
        }
    }, [isReady])

    const pause = useCallback(() => {
        if (playerInstanceRef.current && isReady) {
            try {
                playerInstanceRef.current.pauseVideo()
                console.log('⏸️ Riproduzione in pausa')
            } catch (error) {
                console.error('❌ Errore pause:', error)
            }
        }
    }, [isReady])

    const setVolume = useCallback((volume: number) => {
        if (playerInstanceRef.current && isReady) {
            try {
                playerInstanceRef.current.setVolume(volume)
                console.log(`🔊 Volume impostato a: ${volume}`)
            } catch (error) {
                console.error('❌ Errore setVolume:', error)
            }
        }
    }, [isReady])

    return {
        player,
        isReady,
        isPlaying,
        isMuted,
        mute,
        unMute,
        play,
        pause,
        setVolume
    }
}
