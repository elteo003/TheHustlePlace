'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Info, Plus, Heart, Volume2, VolumeX } from 'lucide-react'
import { TMDBMovie, getTMDBImageUrl, getYouTubeEmbedUrl, findMainTrailer } from '@/lib/tmdb'
import { UpcomingTrailersSection } from '@/components/upcoming-trailers-section'
import { useMovieContext } from '@/contexts/MovieContext'
import { useTrailerTimer } from '@/hooks/useTrailerTimer'
import { useSmartHover } from '@/hooks/useSmartHover'
import { useCleanup } from '@/hooks/useCleanup'

interface HeroSectionProps {
    onControlsVisibilityChange?: (visible: boolean) => void
    navbarHovered?: boolean
    onTrailerEnded?: () => void
    onMovieChange?: (index: number) => void
    showUpcomingTrailers?: boolean
    onLoaded?: () => void
    currentHeroMovieIndex?: number
    // Rimuoviamo la dipendenza da popularMovies esterni
}

export function HeroSection({ onControlsVisibilityChange, navbarHovered = false, onTrailerEnded, onMovieChange, showUpcomingTrailers = false, onLoaded, currentHeroMovieIndex = 0 }: HeroSectionProps) {
    // Usa il context per stato globale
    const { movies, currentIndex, featuredMovie, loading, error, changeToNextMovie, changeToMovie } = useMovieContext()

    // Stati locali
    const [trailer, setTrailer] = useState<string | null>(null)
    const [isMuted, setIsMuted] = useState(true)
    const [isScrolled, setIsScrolled] = useState(false)
    const [showControls, setShowControls] = useState(true)
    const [initialLoad, setInitialLoad] = useState(true)
    const [isNavbarHovered, setIsNavbarHovered] = useState(false)

    // Hooks personalizzati
    const { addTimeout } = useCleanup()
    const { isHovered, handleMouseEnter, handleMouseLeave } = useSmartHover({
        onHoverStart: () => {
            setShowControls(true)
            onControlsVisibilityChange?.(true)
        },
        onHoverEnd: () => {
            // Solo se non siamo in scroll, navbar non è hovered, e non è il caricamento iniziale
            if (!isScrolled && !navbarHovered && !initialLoad) {
                // Delay più lungo per zone neutre
                const timeout = addTimeout(setTimeout(() => {
                    setShowControls(false)
                    onControlsVisibilityChange?.(false)
                }, 4000))
                return () => clearTimeout(timeout)
            }
        }
    })

    const { trailerEnded, setTrailerEnded, resetTimer } = useTrailerTimer({
        trailer,
        onTrailerEnded: () => {
            setTrailer(null)
            onTrailerEnded?.()
        }
    })

    // Inizializzazione
    useEffect(() => {
        const timer = addTimeout(setTimeout(() => {
            setInitialLoad(false)
        }, 2000))
        return () => clearTimeout(timer)
    }, [addTimeout])

    // Notifica quando la Hero Section è caricata
    useEffect(() => {
        if (featuredMovie && onLoaded) {
            onLoaded()
        }
    }, [featuredMovie, onLoaded])

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

    // Scroll detection semplificato
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY
            const heroHeight = window.innerHeight

            if (scrollY < heroHeight) {
                setIsScrolled(false)
            } else {
                setIsScrolled(true)
                setShowControls(true)
                onControlsVisibilityChange?.(true)
            }
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [onControlsVisibilityChange])

    // Logica unificata per visibilità controlli
    const shouldShowControls = isHovered || isNavbarHovered || navbarHovered || isScrolled || initialLoad

    // Gestisce la visibilità unificata con delay per zone neutre
    useEffect(() => {
        if (shouldShowControls) {
            setShowControls(true)
            onControlsVisibilityChange?.(true)
        } else {
            // Delay più lungo per zone neutre (5 secondi)
            const timeout = addTimeout(setTimeout(() => {
                setShowControls(false)
                onControlsVisibilityChange?.(false)
            }, 5000))
            return () => clearTimeout(timeout)
        }
    }, [shouldShowControls, onControlsVisibilityChange, addTimeout])

    // Gestisce il cambio film dall'esterno
    useEffect(() => {
        if (onMovieChange) {
            onMovieChange(currentIndex)
        }
    }, [currentIndex, onMovieChange])

    const handleWatchNow = () => {
        if (featuredMovie) {
            // Usa tmdb_id se disponibile, altrimenti id
            const itemId = (featuredMovie as any).tmdb_id || featuredMovie.id
            window.location.href = `/player/movie/${itemId}`
        }
    }

    const handleMoreInfo = () => {
        // Implementa modal con dettagli del film
        console.log('More info per:', featuredMovie?.title)
    }



    // Mostra loading durante verifica trailer
    if (loading) {
        return (
            <div className="relative h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <h2 className="text-3xl font-bold text-white mb-4">Caricamento film con trailer...</h2>
                    <p className="text-gray-400 text-lg">Verifico disponibilità trailer YouTube</p>
                    <div className="mt-4 flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !featuredMovie) {
        return (
            <div className="relative h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Errore nel caricamento</h2>
                    <p className="text-gray-400 mb-4">{error || 'Film non trovato'}</p>
                    <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                        Riprova
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div 
            className="relative h-screen w-full overflow-hidden -mt-20"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >

            {/* Background Video/Image */}
            <div className="absolute inset-0 w-full h-full">
                {trailer ? (
                    <iframe
                        src={getYouTubeEmbedUrl(trailer, true, isMuted)}
                        className="w-full h-full object-cover transition-all duration-500"
                        allow="autoplay; encrypted-media; fullscreen"
                        allowFullScreen
                        style={{
                            filter: isHovered ? 'brightness(0.9)' : 'brightness(0.5)',
                            width: '100vw',
                            height: '100vh',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%) scale(1.1)'
                        }}
                    />
                ) : (
                    <div
                        className="w-full h-full bg-cover bg-center transition-all duration-500"
                        style={{
                            backgroundImage: `url(${getTMDBImageUrl(featuredMovie.backdrop_path, 'original')})`,
                            filter: isHovered ? 'brightness(0.8)' : 'brightness(0.4)',
                            width: '100vw',
                            height: '100vh',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center'
                        }}
                    />
                )}
            </div>

            {/* Overlay Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent transition-opacity duration-500 ${showControls && !showUpcomingTrailers ? 'opacity-100' : 'opacity-10'}`} />

            {/* Content */}
            <div className={`relative z-10 h-full flex items-end transition-all duration-500 ${showControls && !showUpcomingTrailers ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="container mx-auto px-4 pb-16">
                    <div className="max-w-2xl">
                        {/* Title */}
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                            {featuredMovie.title}
                        </h1>

                        {/* Overview */}
                        <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed line-clamp-3">
                            {featuredMovie.overview}
                        </p>

                        {/* Rating */}
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

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                onClick={handleWatchNow}
                                size="lg"
                                className="bg-black/40 backdrop-blur-sm border border-white/30 text-white hover:bg-black/60 hover:border-white/50 font-semibold px-8 py-4 text-lg rounded-lg flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                <Play className="w-6 h-6" />
                                Play
                            </Button>

                            <Button
                                onClick={handleMoreInfo}
                                variant="outline"
                                size="lg"
                                className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg rounded-lg flex items-center gap-3 backdrop-blur-sm"
                            >
                                <Info className="w-6 h-6" />
                                Altre Info
                            </Button>

                            {/* Mute/Unmute Button */}
                            {trailer && (
                                <Button
                                    onClick={() => setIsMuted(!isMuted)}
                                    variant="ghost"
                                    size="lg"
                                    className="text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg rounded-lg flex items-center gap-3 backdrop-blur-sm"
                                >
                                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                                    {isMuted ? 'Attiva Audio' : 'Disattiva Audio'}
                                </Button>
                            )}

                            {/* Next Movie Button */}
                            <Button
                                onClick={changeToNextMovie}
                                variant="outline"
                                size="lg"
                                className="border-gray-400/50 text-gray-300 hover:bg-gray-400/20 font-semibold px-6 py-4 text-lg rounded-lg flex items-center gap-3 backdrop-blur-sm"
                            >
                                Prossimo Film
                            </Button>

                            <Button
                                variant="ghost"
                                size="lg"
                                className="text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg rounded-lg flex items-center gap-3 backdrop-blur-sm"
                            >
                                <Plus className="w-6 h-6" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="lg"
                                className="text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg rounded-lg flex items-center gap-3 backdrop-blur-sm"
                            >
                                <Heart className="w-6 h-6" />
                            </Button>
                        </div>

                        {/* Release Date */}
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


            {/* Bottom Gradient */}
            <div className={`absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-30'}`} />

            {/* Upcoming Trailers Section - Mostra solo quando il trailer finisce */}
            {trailerEnded && movies.length > 0 && (
                <UpcomingTrailersSection
                    movies={movies}
                    currentMovieIndex={currentIndex}
                    onMovieSelect={changeToMovie}
                />
            )}
        </div>
    )
}