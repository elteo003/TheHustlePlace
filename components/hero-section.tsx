'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Info, Volume2, VolumeX, SkipForward } from 'lucide-react'
import { TMDBMovie, getTMDBImageUrl, getYouTubeEmbedUrl, findMainTrailer } from '@/lib/tmdb'
import { UpcomingTrailersSection } from '@/components/upcoming-trailers-section'
import { useMovieContext } from '@/contexts/MovieContext'
import { getContentId, getPlayerPath } from '@/lib/content-navigation'
import { useTrailerTimer } from '@/hooks/useTrailerTimer'
import { useCleanup } from '@/hooks/useCleanup'
import { useParallax } from '@/hooks/useParallax'
import { useNavbarContext } from '@/contexts/NavbarContext'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'

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

    const { parallaxRef, scrollY } = useParallax()
    const [metaHovered, setMetaHovered] = useState(false)
    const [introVisible, setIntroVisible] = useState(true)
    const showMeta = metaHovered || introVisible

    useEffect(() => {
        setNavbarVisible(true)
        return () => setNavbarVisible(true)
    }, [setNavbarVisible])

    useEffect(() => {
        setIntroVisible(true)
        const timer = setTimeout(() => setIntroVisible(false), 1800)
        return () => clearTimeout(timer)
    }, [featuredMovie?.id])

    // Stati locali semplificati
    const [trailer, setTrailer] = useState<string | null>(null)
    const [isMuted, setIsMuted] = useState(true)
    const iframeRef = useRef<HTMLIFrameElement>(null)

    // Funzione per controllare l'audio senza riavviare il video
    const toggleAudio = () => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            try {
                const command = isMuted ? 'unMute' : 'mute'
                
                // Prova diversi formati di comando
                const commands = [
                    JSON.stringify({ event: 'command', func: command }),
                    JSON.stringify({ event: 'command', func: command, args: '' }),
                    `{"event":"command","func":"${command}"}`,
                    `{"event":"command","func":"${command}","args":""}`
                ]
                
                commands.forEach(cmd => {
                    iframeRef.current?.contentWindow?.postMessage(cmd, 'https://www.youtube.com')
                })
                
                // Fallback: aggiorna l'URL dell'iframe
                setTimeout(() => {
                    if (iframeRef.current) {
                        const currentSrc = iframeRef.current.src
                        const newMuted = !isMuted
                        const newSrc = getYouTubeEmbedUrl(trailer!, true, newMuted)
                        if (currentSrc !== newSrc) {
                            iframeRef.current.src = newSrc
                        }
                    }
                }, 100)
                
            } catch (error) {
                console.error('❌ Errore PostMessage:', error)
            }
        }
        
        setIsMuted(!isMuted)
    }

    const { trailerEnded, setTrailerEnded, resetTimer } = useTrailerTimer({
        trailer,
        onTrailerEnded: () => {
            setTrailer(null)
            onTrailerEnded?.()
        }
    })

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
            console.log('🎬 Film cambiato, reset trailerEnded per far riapparire sezione prossimi')
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
                    className="icon-btn h-11 w-11 inline-flex items-center justify-center"
                    aria-label={isMuted ? 'Attiva audio' : 'Disattiva audio'}
                >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
            )}
            <button
                type="button"
                onClick={changeToNextMovie}
                className="icon-btn h-11 w-11 inline-flex items-center justify-center"
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

    const metaVisible = showMeta && !showUpcomingTrailers

    return (
        <>
            <div
                className="relative h-dvh w-full overflow-hidden"
            >
                {/* Background Video/Image */}
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                    {trailer ? (
                        <iframe
                            ref={iframeRef}
                            src={getYouTubeEmbedUrl(trailer, true, isMuted)}
                            className="absolute inset-0 h-full w-full object-cover"
                            allow="autoplay; encrypted-media; fullscreen"
                            allowFullScreen
                            style={{
                                filter: showMeta ? 'brightness(0.9) saturate(1.1)' : 'brightness(0.7) saturate(0.95)',
                                top: '50%',
                                left: '50%',
                                width: '100%',
                                height: '100%',
                                transform: showMeta
                                    ? 'translate(-50%, -50%) scale(1.05)'
                                    : 'translate(-50%, -50%) scale(1.08)',
                                transition: 'transform 0.7s cubic-bezier(0.32, 0.72, 0, 1), filter 0.7s cubic-bezier(0.32, 0.72, 0, 1)'
                            }}
                        />
                    ) : (
                        <div
                            className="h-full w-full bg-cover bg-center"
                            style={{
                                backgroundImage: `url(${getTMDBImageUrl(featuredMovie.backdrop_path, 'original')})`,
                                filter: showMeta ? 'brightness(0.8) saturate(1.1) contrast(1.1)' : 'brightness(0.55) saturate(0.95) contrast(1)',
                                backgroundSize: showMeta ? '105%' : '108%',
                                backgroundPosition: showMeta ? 'center 45%' : 'center 50%',
                                transform: showMeta ? 'scale(1.02)' : 'scale(1)',
                                transition: 'transform 0.7s cubic-bezier(0.32, 0.72, 0, 1), filter 0.7s cubic-bezier(0.32, 0.72, 0, 1)'
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

                <div className={`relative z-10 h-full ${showUpcomingTrailers ? 'pointer-events-none' : ''}`}>
                    <div
                        className={`hero-meta-hit absolute inset-x-0 bottom-0 px-4 pt-16 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:inset-x-auto md:bottom-16 md:left-4 md:max-w-2xl md:px-4 md:pb-0 transition-[opacity,transform] duration-200 ease-out-expo ${
                            metaVisible
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 motion-safe:translate-y-2 pointer-events-none'
                        }`}
                        onMouseEnter={() => setMetaHovered(true)}
                        onMouseLeave={() => setMetaHovered(false)}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <h1 className="text-3xl font-bold leading-[1.1] tracking-tight text-white line-clamp-2 sm:text-5xl lg:text-7xl">
                                {featuredMovie.title}
                            </h1>
                            <div className="flex shrink-0 items-center gap-1 sm:hidden">
                                {renderIconControls()}
                            </div>
                        </div>

                        {(releaseYear || rating) && (
                            <p className="mt-2 flex items-center gap-2 text-sm text-white/70">
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

                        {featuredMovie.overview && (
                            <p className="mt-3 hidden text-base leading-relaxed text-white/75 line-clamp-2 md:block lg:mt-4 lg:text-xl lg:line-clamp-3">
                                {featuredMovie.overview}
                            </p>
                        )}

                        <div className="mt-4 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:items-center sm:gap-3">
                            <button
                                type="button"
                                onClick={handleWatchNow}
                                className="btn-play h-12 w-full sm:w-auto px-6 inline-flex items-center justify-center gap-2"
                            >
                                <Play className="w-5 h-5 fill-current" />
                                Guarda
                            </button>

                            <button
                                type="button"
                                onClick={handleMoreInfo}
                                className="btn-ghost-outline h-12 w-full sm:w-auto px-6 inline-flex items-center justify-center gap-2"
                            >
                                <Info className="w-5 h-5" />
                                Dettagli
                            </button>

                            <div className="hidden items-center gap-1 sm:flex">
                                {renderIconControls()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upcoming Trailers Section - Mostra solo quando il trailer finisce */}
                {(trailerEnded || showUpcomingTrailers) && movies.length > 0 && (
                    <>
                        <UpcomingTrailersSection
                            movies={movies}
                            currentMovieIndex={currentIndex}
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