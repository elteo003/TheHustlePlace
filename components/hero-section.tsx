'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Info, Volume2, VolumeX, SkipForward } from 'lucide-react'
import { TMDBMovie, getTMDBImageUrl, findMainTrailer } from '@/lib/tmdb'
import { UpcomingTrailersSection } from '@/components/upcoming-trailers-section'
import { useMovieContext } from '@/contexts/MovieContext'
import { getContentId, getPlayerPath } from '@/lib/content-navigation'
import { useTrailerTimer } from '@/hooks/useTrailerTimer'
import { useNavbarContext } from '@/contexts/NavbarContext'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'
import { useIsCoarsePointer, useIsPhoneLandscape } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { buildTrailerEmbedUrl } from '@/hooks/useTrailerPreview'
import { listenToYouTubePlayer, readYouTubePlayerState, YOUTUBE_ENDED, YOUTUBE_PLAYING } from '@/lib/youtube-command'

interface HeroSectionProps {
    onTrailerEnded?: () => void
    onMovieChange?: (index: number) => void
    showUpcomingTrailers?: boolean
    onLoaded?: () => void
    currentHeroMovieIndex?: number
    onUpcomingMovieSelect?: (index: number) => void
    // Rimuoviamo la dipendenza da popularMovies esterni
}

export function HeroSection({ onTrailerEnded, onMovieChange, showUpcomingTrailers = false, onLoaded, currentHeroMovieIndex = 0, onUpcomingMovieSelect }: HeroSectionProps) {
    const router = useRouter()
    const { setIsVisible: setNavbarVisible } = useNavbarContext()
    // Usa il context per stato globale
    const { movies, currentIndex, featuredMovie, loading, error, changeToNextMovie, changeToMovie } = useMovieContext()
    const isTouch = useIsCoarsePointer()
    const isPhoneLandscape = useIsPhoneLandscape()
    const [metaHovered, setMetaHovered] = useState(false)
    const [introVisible, setIntroVisible] = useState(true)
    const showMeta = isTouch || metaHovered || introVisible

    useEffect(() => {
        setNavbarVisible(true)
        return () => setNavbarVisible(true)
    }, [setNavbarVisible])

    useEffect(() => {
        setIntroVisible(true)
        if (isTouch) return
        const timer = setTimeout(() => setIntroVisible(false), 1800)
        return () => clearTimeout(timer)
    }, [featuredMovie?.id, isTouch])

    // Stati locali semplificati
    const [trailer, setTrailer] = useState<string | null>(null)
    const [isMuted, setIsMuted] = useState(true)
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const trailerPlayedRef = useRef(false)

    const sendYoutube = (func: string) => {
        iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func, args: [] }),
            'https://www.youtube.com'
        )
    }

    const kickPlayback = () => {
        sendYoutube('mute')
        sendYoutube('playVideo')
        listenToYouTubePlayer(iframeRef.current?.contentWindow)
    }

    const toggleAudio = () => {
        const nextMuted = !isMuted
        setIsMuted(nextMuted)
        sendYoutube(nextMuted ? 'mute' : 'unMute')
    }

    const onTrailerEndedRef = useRef(onTrailerEnded)
    onTrailerEndedRef.current = onTrailerEnded

    const hideEndedTrailer = useCallback(() => {
        setTrailer(null)
        onTrailerEndedRef.current?.()
    }, [])

    const { trailerEnded, setTrailerEnded, resetTimer } = useTrailerTimer({
        trailer,
        onTrailerEnded: hideEndedTrailer,
    })

    const finishTrailer = useCallback(() => {
        setTrailerEnded(true)
        hideEndedTrailer()
    }, [hideEndedTrailer, setTrailerEnded])

    useEffect(() => {
        trailerPlayedRef.current = false
    }, [trailer])

    useEffect(() => {
        const onMessage = (event: MessageEvent) => {
            const state = readYouTubePlayerState(event.origin, event.data)
            if (state == null) return
            if (state === YOUTUBE_PLAYING) {
                trailerPlayedRef.current = true
                return
            }
            if (state === YOUTUBE_ENDED && trailerPlayedRef.current) {
                finishTrailer()
            }
        }
        window.addEventListener('message', onMessage)
        return () => window.removeEventListener('message', onMessage)
    }, [finishTrailer])

    // Notifica quando la Hero Section è caricata
    useEffect(() => {
        if (featuredMovie && onLoaded) {
            onLoaded()
        }
    }, [featuredMovie, onLoaded])

    // Reset trailerEnded quando cambia il film per far riapparire la sezione prossimi
    useEffect(() => {
        if (featuredMovie) {
            setTrailerEnded(false)
            setIsMuted(true)
        }
    }, [featuredMovie, setTrailerEnded])

    // Carica trailer quando cambia il film
    useEffect(() => {
        if (featuredMovie) {
            loadTrailerForMovie(featuredMovie)
            resetTimer() // Reset timer quando cambia film
        }
    }, [featuredMovie, resetTimer])

    // Funzione per caricare trailer
    const loadTrailerForMovie = useCallback(async (movie: TMDBMovie) => {
        try {
            console.log(`🎬 Caricamento trailer per: ${movie.title}`)
            const response = await fetch(`/api/tmdb/movies/${movie.id}/videos`)
            const data = await response.json()

            if (data.success && data.data?.results?.length > 0) {
                const mainTrailer = findMainTrailer(data.data.results)
                if (mainTrailer) {
                    setTrailer(mainTrailer.key)
                    console.log(`✅ Trailer trovato: ${mainTrailer.key}`)
                } else {
                    console.log(`⚠️ Nessun trailer valido per ${movie.title}`)
                    setTrailer(null)
                }
            } else {
                console.log(`⚠️ Nessun video disponibile per ${movie.title}`)
                setTrailer(null)
            }
        } catch (error) {
            console.error(`❌ Errore caricamento trailer per ${movie.title}:`, error)
            setTrailer(null)
        }
    }, [])



    // Gestisce il cambio film dall'esterno
    useEffect(() => {
        if (onMovieChange) {
            onMovieChange(currentIndex)
        }
    }, [currentIndex, onMovieChange])

    const handleWatchNow = () => {
        if (featuredMovie) {
            const itemId = getContentId(featuredMovie as { id: number; tmdb_id?: number })
            router.push(getPlayerPath(itemId, 'movie'))
        }
    }

    const handleMoreInfo = () => {
        if (featuredMovie) {
            const itemId = getContentId(featuredMovie as { id: number; tmdb_id?: number })
            router.push(`/movie/${itemId}`)
        }
    }

    const releaseYear = featuredMovie?.release_date
        ? new Date(featuredMovie.release_date).getFullYear()
        : null
    const rating =
        featuredMovie && featuredMovie.vote_average > 0
            ? featuredMovie.vote_average.toFixed(1)
            : null

    const renderIconControls = () => (
        <>
            {trailer && (
                <button
                    type="button"
                    onClick={toggleAudio}
                    className={cn(
                        'icon-btn inline-flex items-center justify-center',
                        isPhoneLandscape ? 'h-9 w-9' : 'h-11 w-11'
                    )}
                    aria-label={isMuted ? 'Attiva audio' : 'Disattiva audio'}
                >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
            )}
            <button
                type="button"
                onClick={changeToNextMovie}
                className={cn(
                    'icon-btn inline-flex items-center justify-center',
                    isPhoneLandscape ? 'h-9 w-9' : 'h-11 w-11'
                )}
                aria-label="Prossimo titolo"
            >
                <SkipForward className="w-5 h-5" />
            </button>
        </>
    )


    // Mostra loading durante verifica trailer
    if (loading) {
        return (
            <div className="relative h-dvh bg-black flex items-center justify-center">
                <Spinner />
            </div>
        )
    }

    if (error || !featuredMovie) {
        return (
            <div className="relative h-dvh bg-black flex items-center justify-center px-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Errore nel caricamento</h2>
                    <p className="text-gray-400 mb-4">{error || 'Film non trovato'}</p>
                    <button type="button" onClick={() => window.location.reload()} className="btn-play">
                        Riprova
                    </button>
                </div>
            </div>
        )
    }

    const showUpcoming = trailerEnded || showUpcomingTrailers
    const metaVisible = showMeta && !showUpcoming

    return (
        <>
            <div
                className="relative h-dvh w-full overflow-hidden"
            >
                {/* Background Video/Image */}
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                    <div
                        className="h-full w-full bg-cover bg-center"
                        style={{
                            backgroundImage: `url(${getTMDBImageUrl(featuredMovie.backdrop_path, 'original')})`,
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'cover',
                            filter: showMeta ? 'brightness(0.8) saturate(1.1) contrast(1.1)' : 'brightness(0.55) saturate(0.95) contrast(1)',
                            backgroundPosition: showMeta ? 'center 45%' : 'center 50%',
                            transform: showMeta ? 'scale(1.02)' : 'scale(1)',
                            transition: 'transform 0.7s cubic-bezier(0.32, 0.72, 0, 1), filter 0.7s cubic-bezier(0.32, 0.72, 0, 1)'
                        }}
                    />
                    {trailer && !showUpcoming && (
                        <iframe
                            ref={iframeRef}
                            key={trailer}
                            src={buildTrailerEmbedUrl(trailer, true)}
                            title={`Trailer ${featuredMovie.title}`}
                            className="pointer-events-none border-0"
                            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                            onLoad={kickPlayback}
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                width: 'max(100vw, 177.78dvh)',
                                height: 'max(100dvh, 56.25vw)',
                                transform: 'translate(-50%, -50%) scale(1.08)',
                            }}
                        />
                    )}
                </div>

                <div
                    className={`absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent md:bg-gradient-to-r md:from-black/70 md:via-black/45 md:to-transparent transition-opacity duration-200 ease-out ${
                        metaVisible ? 'opacity-100' : 'opacity-10'
                    }`}
                />
                <div
                    className={`absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent md:h-32 transition-opacity duration-200 ease-out ${
                        showMeta ? 'opacity-100' : 'opacity-20'
                    }`}
                />

                {isTouch && metaVisible && (
                    <div
                        className={cn(
                            'absolute z-20 flex items-center gap-1',
                            isPhoneLandscape
                                ? 'top-[max(3.25rem,calc(env(safe-area-inset-top)+2.75rem))] right-[max(1rem,env(safe-area-inset-right))]'
                                : 'top-[max(4.25rem,calc(env(safe-area-inset-top)+3.5rem))] right-4'
                        )}
                    >
                        {renderIconControls()}
                    </div>
                )}

                <div className={`relative z-10 h-full ${showUpcomingTrailers ? 'pointer-events-none' : ''}`}>
                    <div
                        className={cn(
                            'hero-meta-hit absolute inset-x-0 bottom-0 transition-[opacity,transform] duration-200 ease-out-expo',
                            isPhoneLandscape
                                ? 'pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-6 pb-[max(0.6rem,env(safe-area-inset-bottom))]'
                                : 'px-4 pt-16 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:inset-x-auto md:bottom-16 md:left-4 md:max-w-2xl md:px-4 md:pb-0',
                            metaVisible
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 motion-safe:translate-y-2 pointer-events-none'
                        )}
                        onMouseEnter={() => setMetaHovered(true)}
                        onMouseLeave={() => setMetaHovered(false)}
                    >
                        <h1
                            className={cn(
                                'font-bold leading-[1.1] tracking-tight text-white',
                                isPhoneLandscape
                                    ? 'line-clamp-1 text-2xl'
                                    : 'line-clamp-2 text-3xl sm:text-5xl lg:text-7xl'
                            )}
                        >
                            {featuredMovie.title}
                        </h1>

                        {(releaseYear || rating) && (
                            <p className={cn('flex items-center gap-2 text-white/70', isPhoneLandscape ? 'mt-1 text-xs' : 'mt-2 text-sm')}>
                                {releaseYear && <span>{releaseYear}</span>}
                                {releaseYear && rating && <span className="text-white/25">·</span>}
                                {rating && (
                                    <span className="inline-flex items-center gap-1">
                                        <span className="text-amber-400">★</span>
                                        {rating}
                                    </span>
                                )}
                            </p>
                        )}

                        {featuredMovie.overview && !isPhoneLandscape && (
                            <p className="mt-3 hidden text-base leading-relaxed text-white/75 line-clamp-2 md:block lg:mt-4 lg:text-xl lg:line-clamp-3">
                                {featuredMovie.overview}
                            </p>
                        )}

                        <div
                            className={cn(
                                'flex items-center',
                                isPhoneLandscape
                                    ? 'mt-2 flex-row gap-2'
                                    : 'mt-4 flex-col gap-2 sm:mt-6 sm:flex-row sm:gap-3'
                            )}
                        >
                            <button
                                type="button"
                                onClick={handleWatchNow}
                                className={cn(
                                    'btn-play inline-flex items-center justify-center gap-2',
                                    isPhoneLandscape ? 'h-10 w-auto px-4 text-sm' : 'h-12 w-full px-6 sm:w-auto'
                                )}
                            >
                                <Play className="w-5 h-5 fill-current play-mark-pulse" />
                                Guarda
                            </button>

                            <button
                                type="button"
                                onClick={handleMoreInfo}
                                className={cn(
                                    'btn-ghost-outline inline-flex items-center justify-center gap-2',
                                    isPhoneLandscape ? 'h-10 w-auto px-4 text-sm' : 'h-12 w-full px-6 sm:w-auto'
                                )}
                            >
                                <Info className="w-5 h-5" />
                                Dettagli
                            </button>

                            {!isTouch && (
                                <div className="hidden items-center gap-1 sm:flex">
                                    {renderIconControls()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Upcoming Trailers Section - Mostra solo quando il trailer finisce */}
                {showUpcoming && movies.length > 0 && (
                    <>
                        <UpcomingTrailersSection
                            movies={movies}
                            currentMovieIndex={currentIndex}
                            compact={isPhoneLandscape}
                            onMovieSelect={(index) => {
                                changeToMovie(index)
                                // Nasconde la sezione prossimi film quando si seleziona un film
                                setTrailerEnded(false)
                                setIntroVisible(true)
                                resetTimer()
                                // Notifica al parent di nascondere la sezione prossimi
                                onUpcomingMovieSelect?.(index)
                            }}
                        />
                    </>
                )}
            </div>
        </>
    )
}