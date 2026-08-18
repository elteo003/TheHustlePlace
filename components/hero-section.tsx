'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Info, Volume2, VolumeX } from 'lucide-react'
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


    // Mostra loading durante verifica trailer
    if (loading) {
        return (
            <div className="relative h-screen bg-black flex items-center justify-center">
                <Spinner />
            </div>
        )
    }

    if (error || !featuredMovie) {
        return (
            <div className="relative h-screen bg-black flex items-center justify-center">
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


    return (
        <>
            <div
                className="relative h-screen w-full overflow-hidden"
            >
                {/* Background Video/Image */}
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                    {trailer ? (
                        <iframe
                            ref={iframeRef}
                            src={getYouTubeEmbedUrl(trailer, true, isMuted)}
                            className="w-full h-full object-cover"
                            allow="autoplay; encrypted-media; fullscreen"
                            allowFullScreen
                            style={{
                                filter: showMeta ? 'brightness(0.9) saturate(1.1)' : 'brightness(0.7) saturate(0.95)',
                                width: '100vw',
                                height: '100vh',
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: showMeta
                                    ? 'translate(-50%, -50%) scale(1.05)'
                                    : 'translate(-50%, -50%) scale(1.08)',
                                transition: 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                            }}
                        />
                    ) : (
                        <div
                            className="w-full h-full bg-cover bg-center"
                            style={{
                                backgroundImage: `url(${getTMDBImageUrl(featuredMovie.backdrop_path, 'original')})`,
                                filter: showMeta ? 'brightness(0.8) saturate(1.1) contrast(1.1)' : 'brightness(0.55) saturate(0.95) contrast(1)',
                                width: '100vw',
                                height: '100vh',
                                backgroundSize: showMeta ? '105%' : '108%',
                                backgroundPosition: showMeta ? 'center 45%' : 'center 50%',
                                transform: showMeta ? 'scale(1.02)' : 'scale(1)',
                                transition: 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                            }}
                        />
                    )}
                </div>

                {/* Overlay Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent transition-opacity duration-300 ease-out ${showMeta && !showUpcomingTrailers ? 'opacity-100' : 'opacity-10'}`} />


                {/* Content */}
                <div className={`relative z-10 h-full flex items-end ${showUpcomingTrailers ? 'pointer-events-none' : ''}`}>
                    <div
                        className={`absolute bottom-16 left-4 px-4 transition-[opacity,transform] duration-300 ease-out ${
                            showMeta && !showUpcomingTrailers
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 translate-y-3'
                        }`}
                        onMouseEnter={() => setMetaHovered(true)}
                        onMouseLeave={() => setMetaHovered(false)}
                    >
                            <div className="max-w-2xl">
                                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                                    {featuredMovie.title}
                                </h1>

                                <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed line-clamp-3">
                                    {featuredMovie.overview}
                                </p>

                                <div className="flex items-center mb-8">
                                    <div className="flex items-center">
                                        <div className="text-yellow-400 text-2xl mr-2">★</div>
                                        <span className="text-white text-xl font-semibold">
                                            {featuredMovie.vote_average.toFixed(1)}
                                        </span>
                                        <span className="text-gray-400 ml-2">
                                            ({featuredMovie.vote_count.toLocaleString()} voti)
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        type="button"
                                        onClick={handleWatchNow}
                                        className="btn-play text-base px-8 py-6 h-auto inline-flex items-center justify-center gap-2"
                                    >
                                        <Play className="w-5 h-5 fill-current" />
                                        Guarda
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleMoreInfo}
                                        className="btn-ghost-outline text-base px-8 py-6 h-auto inline-flex items-center justify-center gap-2"
                                    >
                                        <Info className="w-5 h-5" />
                                        Dettagli
                                    </button>

                                    {trailer && (
                                        <button
                                            type="button"
                                            onClick={toggleAudio}
                                            className="icon-btn h-auto px-4 py-3 inline-flex items-center justify-center"
                                        >
                                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                            <span className="sr-only">{isMuted ? 'Attiva audio' : 'Disattiva audio'}</span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={changeToNextMovie}
                                        className="btn-ghost-outline text-base px-6 py-6 h-auto"
                                    >
                                        Prossimo
                                    </button>
                                </div>

                                {featuredMovie.release_date && (
                                    <div className="mt-6">
                                        <span className="text-gray-300 text-lg">
                                            Uscito il {new Date(featuredMovie.release_date).toLocaleDateString('it-IT')}
                                        </span>
                                    </div>
                                )}
                            </div>
                    </div>
                </div>

                <div className={`absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent transition-opacity duration-300 ease-out ${showMeta ? 'opacity-100' : 'opacity-20'}`} style={{ zIndex: 1 }} />

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