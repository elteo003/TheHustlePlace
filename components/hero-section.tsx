'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Info, Plus, Heart, Volume2, VolumeX } from 'lucide-react'
import { TMDBMovie, getTMDBImageUrl, getYouTubeEmbedUrl, findMainTrailer } from '@/lib/tmdb'
import { UpcomingTrailersSection } from '@/components/upcoming-trailers-section'
import { useMovieContext } from '@/contexts/MovieContext'
import { useTrailerTimer } from '@/hooks/useTrailerTimer'
import { useCleanup } from '@/hooks/useCleanup'
import { useParallax } from '@/hooks/useParallax'
import { useSmartHover } from '@/hooks/useSmartHover'
import { useHeroControls } from '@/hooks/useHeroControls'
import { Navbar } from '@/components/navbar'

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
    // Usa il context per stato globale
    const { movies, currentIndex, featuredMovie, loading, error, changeToNextMovie, changeToMovie } = useMovieContext()

    // Hook personalizzati
    const { parallaxRef, scrollY } = useParallax()
    const { showControls, setShowControls, isHovered, setIsHovered, isScrolled, initialLoad, shouldShowControls } = useHeroControls()

    const { isHovered: smartHovered, hoverRef, handleMouseEnter, handleMouseLeave } = useSmartHover({
        delay: 1000, // Aumento il delay per dare più tempo
        onEnter: () => {
            setShowControls(true)
            setIsHovered(true)
        },
        onLeave: () => {
            setIsHovered(false)
            // La logica di nascondimento è gestita da useHeroControls
        }
    })

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
            // Usa tmdb_id se disponibile, altrimenti id
            const itemId = (featuredMovie as any).tmdb_id || featuredMovie.id
            window.location.href = `/player/movie/${itemId}`
        }
    }

    const handleMoreInfo = () => {
        // Implementa modal con dettagli del film
        console.log('More info per:', featuredMovie?.title)
    }



    const navbarShouldBeVisible = showControls || loading || error || !featuredMovie

    const renderNavbarOverlay = (forceVisible: boolean) => (
        <div 
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-out ${
                forceVisible ? 'opacity-100 translate-y-0' : navbarShouldBeVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6 pointer-events-none'
            }`}
            style={{
                transform: (forceVisible || navbarShouldBeVisible)
                    ? 'translateY(0) scale(1)'
                    : 'translateY(-10px) scale(0.98)'
            }}
        >
            <Navbar isVisible={true} />
        </div>
    )

    // Mostra loading durante verifica trailer
    if (loading) {
        return (
            <div className="relative h-screen bg-black flex items-center justify-center">
                {renderNavbarOverlay(true)}
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
                {renderNavbarOverlay(true)}
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
        <>
            <style jsx>{`
                @keyframes slideInUp {
                    0% {
                        opacity: 0;
                        transform: translateY(40px) scale(0.95);
                    }
                    50% {
                        opacity: 0.8;
                        transform: translateY(20px) scale(0.98);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                @keyframes slideOutDown {
                    0% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                    50% {
                        opacity: 0.8;
                        transform: translateY(20px) scale(0.98);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(40px) scale(0.95);
                    }
                }
                
                @keyframes fadeIn {
                    0% {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                @keyframes fadeOut {
                    0% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                }
                
                @keyframes slideInFromTop {
                    0% {
                        opacity: 0;
                        transform: translateY(-100%);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes slideOutToTop {
                    0% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-100%);
                    }
                }
            `}</style>
            {renderNavbarOverlay(false)}
            <div
                ref={hoverRef}
                className="relative h-screen w-full overflow-hidden -mt-20"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Background Video/Image */}
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                    {trailer ? (
                        <iframe
                            ref={iframeRef}
                            src={getYouTubeEmbedUrl(trailer, true, isMuted)}
                            className="w-full h-full object-cover transition-all duration-700 ease-out"
                            allow="autoplay; encrypted-media; fullscreen"
                            allowFullScreen
                            style={{
                                filter: isHovered ? 'brightness(0.9) saturate(1.1)' : 'brightness(0.5) saturate(0.8)',
                                width: '100vw',
                                height: '100vh',
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: isHovered 
                                    ? 'translate(-50%, -50%) scale(1.05) rotate(0.5deg)' 
                                    : 'translate(-50%, -50%) scale(1.1) rotate(0deg)',
                                transition: 'all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                            }}
                        />
                    ) : (
                        <div
                            className="w-full h-full bg-cover bg-center transition-all duration-700 ease-out"
                            style={{
                                backgroundImage: `url(${getTMDBImageUrl(featuredMovie.backdrop_path, 'original')})`,
                                filter: isHovered ? 'brightness(0.8) saturate(1.1) contrast(1.1)' : 'brightness(0.4) saturate(0.8) contrast(0.9)',
                                width: '100vw',
                                height: '100vh',
                                backgroundSize: isHovered ? '105%' : '110%',
                                backgroundPosition: isHovered ? 'center 45%' : 'center 50%',
                                transform: isHovered ? 'scale(1.02) rotate(0.3deg)' : 'scale(1) rotate(0deg)',
                                transition: 'all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                            }}
                        />
                    )}
                </div>

                {/* Overlay Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent transition-all duration-700 ease-out ${showControls && !showUpcomingTrailers ? 'opacity-100' : 'opacity-10'}`} />


                {/* Content */}
                <div className={`relative z-10 h-full flex items-end transition-all duration-500 ${!showUpcomingTrailers ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    {showControls && (
                        <div
                            className="absolute bottom-16 left-4 px-4 transition-all duration-700 ease-out"
                            style={{
                                animation: 'slideInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                transform: isHovered ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)'
                            }}
                        >
                            <div className="max-w-2xl">
                                {/* Title */}
                                <h1
                                    className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
                                    style={{
                                        animation: 'fadeIn 0.6s ease-out 0.2s both',
                                        transform: isHovered ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.98)',
                                        transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                                    }}
                                >
                                    {featuredMovie.title}
                                </h1>

                                {/* Overview */}
                                <p
                                    className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed line-clamp-3"
                                    style={{
                                        animation: 'fadeIn 0.6s ease-out 0.4s both',
                                        transform: isHovered ? 'translateY(0) scale(1)' : 'translateY(15px) scale(0.98)',
                                        transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s'
                                    }}
                                >
                                    {featuredMovie.overview}
                                </p>

                                {/* Rating */}
                                <div
                                    className="flex items-center mb-8"
                                    style={{
                                        animation: 'fadeIn 0.6s ease-out 0.6s both',
                                        transform: isHovered ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)',
                                        transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s'
                                    }}
                                >
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
                                <div
                                    className="flex flex-col sm:flex-row gap-4"
                                    style={{
                                        animation: 'fadeIn 0.6s ease-out 0.8s both',
                                        transform: isHovered ? 'translateY(0) scale(1)' : 'translateY(25px) scale(0.98)',
                                        transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s'
                                    }}
                                >
                                    <Button
                                        onClick={handleWatchNow}
                                        size="lg"
                                        className="bg-black/40 backdrop-blur-sm border border-white/30 text-white hover:bg-black/60 hover:border-white/50 font-semibold px-8 py-4 text-lg rounded-lg flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 hover:rotate-1"
                                        style={{
                                            transform: isHovered ? 'translateY(0) scale(1) rotate(0deg)' : 'translateY(5px) scale(0.95) rotate(0.5deg)',
                                            transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                                        }}
                                    >
                                        <Play className="w-6 h-6" />
                                        Play
                                    </Button>

                                    <Button
                                        onClick={handleMoreInfo}
                                        variant="outline"
                                        size="lg"
                                        className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg rounded-lg flex items-center gap-3 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:-rotate-1"
                                        style={{
                                            transform: isHovered ? 'translateY(0) scale(1) rotate(0deg)' : 'translateY(5px) scale(0.95) rotate(-0.5deg)',
                                            transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.05s'
                                        }}
                                    >
                                        <Info className="w-6 h-6" />
                                        Altre Info
                                    </Button>

                                    {/* Mute/Unmute Button */}
                                    {trailer && (
                                        <Button
                                            onClick={toggleAudio}
                                            variant="ghost"
                                            size="lg"
                                            className="text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg rounded-lg flex items-center gap-3 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:rotate-1"
                                            style={{
                                                transform: isHovered ? 'translateY(0) scale(1) rotate(0deg)' : 'translateY(5px) scale(0.95) rotate(0.5deg)',
                                                transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s'
                                            }}
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
                                        className="border-gray-400/50 text-gray-300 hover:bg-gray-400/20 font-semibold px-6 py-4 text-lg rounded-lg flex items-center gap-3 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:-rotate-1"
                                        style={{
                                            transform: isHovered ? 'translateY(0) scale(1) rotate(0deg)' : 'translateY(5px) scale(0.95) rotate(-0.5deg)',
                                            transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.15s'
                                        }}
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
                                        className="text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg rounded-lg flex items-center gap-3 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:rotate-1"
                                        style={{
                                            transform: isHovered ? 'translateY(0) scale(1) rotate(0deg)' : 'translateY(5px) scale(0.95) rotate(0.5deg)',
                                            transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s'
                                        }}
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
                    )}
                </div>

                {/* Bottom Gradient */}
                <div className={`absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent transition-all duration-700 ease-out ${showControls ? 'opacity-100' : 'opacity-20'}`} style={{ zIndex: 1 }} />

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
                                // Mostra i controlli per il nuovo film
                                setShowControls(true)
                                // Reset del timer per il nuovo film
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