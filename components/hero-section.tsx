'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Info, Plus, Heart, Volume2, VolumeX } from 'lucide-react'
import { TMDBMovie, getTMDBImageUrl, getYouTubeEmbedUrl, findMainTrailer } from '@/lib/tmdb'

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
    const [featuredMovie, setFeaturedMovie] = useState<TMDBMovie | null>(null)
    const [trailer, setTrailer] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [isMuted, setIsMuted] = useState(true)
    const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
    const [isScrolled, setIsScrolled] = useState(false)
    const [showControls, setShowControls] = useState(true)
    const [initialLoad, setInitialLoad] = useState(true)
    const [isNavbarHovered, setIsNavbarHovered] = useState(false)
    const [currentMovieIndex, setCurrentMovieIndex] = useState(0)
    const [popularMovies, setPopularMovies] = useState<TMDBMovie[]>([])
    const [autoChangeTimer, setAutoChangeTimer] = useState<NodeJS.Timeout | null>(null)
    const [trailerEnded, setTrailerEnded] = useState(false)

    // Fallback movie
    const fallbackMovie: TMDBMovie = {
        id: 157336,
        title: 'Interstellar',
        original_title: 'Interstellar',
        overview: 'In seguito alla scoperta di un cunicolo spazio-temporale, un gruppo di esploratori si avventura in una eroica missione per tentare di superare i limiti della conquista spaziale.',
        poster_path: '/bMKiLh0mES4Uiococ240lbbTGXQ.jpg',
        backdrop_path: '/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg',
        release_date: '2014-11-05',
        vote_average: 8.46,
        vote_count: 37772,
        popularity: 46.5648,
        adult: false,
        video: false,
        genre_ids: [18, 878],
        original_language: 'en'
    }

    useEffect(() => {
        loadPopularMovies()
        // Imposta initialLoad a false dopo 2 secondi per permettere la scomparsa automatica
        const timer = setTimeout(() => {
            setInitialLoad(false)
        }, 2000)
        return () => clearTimeout(timer)
    }, [])

    // Notifica quando la Hero Section è caricata
    useEffect(() => {
        if (featuredMovie && onLoaded) {
            onLoaded()
        }
    }, [featuredMovie, onLoaded])

    // Gestisce la fine del trailer
    useEffect(() => {
        if (trailer && !trailerEnded) {
            // Simula la fine del trailer dopo 30 secondi (durata media di un trailer)
            const trailerTimer = setTimeout(() => {
                console.log('🎬 Trailer finito, mostrando prossimi film')
                setTrailerEnded(true)
                // Ferma il trailer attuale
                setTrailer(null)
                if (onTrailerEnded) {
                    onTrailerEnded()
                }
            }, 30000) // 30 secondi

            return () => clearTimeout(trailerTimer)
        }
    }, [trailer, trailerEnded, onTrailerEnded])

    // Mostra la sezione prossimi film anche se non c'è trailer (dopo 15 secondi)
    useEffect(() => {
        if (!trailer && !trailerEnded && popularMovies.length > 0) {
            const fallbackTimer = setTimeout(() => {
                console.log('🎬 Nessun trailer, mostrando prossimi film dopo timeout')
                setTrailerEnded(true)
                if (onTrailerEnded) {
                    onTrailerEnded()
                }
            }, 15000) // 15 secondi

            return () => clearTimeout(fallbackTimer)
        }
    }, [trailer, trailerEnded, popularMovies.length, onTrailerEnded])

    useEffect(() => {
        return () => {
            if (hoverTimeout) {
                clearTimeout(hoverTimeout)
            }
            if (autoChangeTimer) {
                clearTimeout(autoChangeTimer)
            }
        }
    }, [hoverTimeout, autoChangeTimer])

    // Funzioni per gestire l'hover
    const handleMouseEnter = useCallback(() => {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout)
            setHoverTimeout(null)
        }
        setIsHovered(true)
        setShowControls(true)
        onControlsVisibilityChange?.(true)
    }, [hoverTimeout, onControlsVisibilityChange])

    const handleMouseLeave = useCallback(() => {
        const timeout = setTimeout(() => {
            setIsHovered(false)
        }, 100) // Piccolo delay per evitare flickering
        setHoverTimeout(timeout)

        if (!isScrolled && !navbarHovered && !initialLoad) {
            const hideTimeout = setTimeout(() => {
                setShowControls(false)
                onControlsVisibilityChange?.(false)
            }, 3000)
            setHoverTimeout(hideTimeout)
        }
    }, [isScrolled, navbarHovered, initialLoad, onControlsVisibilityChange])

    // Scroll detection per nascondere/mostrare i controlli
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY
            const heroHeight = window.innerHeight

            // Se siamo nella hero section (primi 100vh)
            if (scrollY < heroHeight) {
                setIsScrolled(false)
                // Nascondi i controlli dopo 3 secondi se non c'è hover e non c'è hover sulla navbar
                // Ma solo se non è il caricamento iniziale
                if (!isHovered && !navbarHovered && !initialLoad) {
                    const timeout = setTimeout(() => {
                        setShowControls(false)
                        onControlsVisibilityChange?.(false)
                    }, 3000)
                    return () => clearTimeout(timeout)
                }
            } else {
                setIsScrolled(true)
                setShowControls(true)
                onControlsVisibilityChange?.(true)
            }
        }

        window.addEventListener('scroll', handleScroll)
        window.addEventListener('mouseenter', handleMouseEnter)
        window.addEventListener('mouseleave', handleMouseLeave)

        return () => {
            window.removeEventListener('scroll', handleScroll)
            window.removeEventListener('mouseenter', handleMouseEnter)
            window.removeEventListener('mouseleave', handleMouseLeave)
        }
    }, [isHovered, isScrolled, navbarHovered, initialLoad, onControlsVisibilityChange])

    // Logica unificata per visibilità navbar e dettagli
    const shouldShowControls = isHovered || isNavbarHovered || navbarHovered || isScrolled || initialLoad

    // Gestisce la visibilità unificata
    useEffect(() => {
        if (shouldShowControls) {
            setShowControls(true)
            onControlsVisibilityChange?.(true)
        } else {
            // Nascondi dopo 2 secondi se non c'è hover
            const timeout = setTimeout(() => {
                setShowControls(false)
                onControlsVisibilityChange?.(false)
            }, 2000)
            return () => clearTimeout(timeout)
        }
    }, [shouldShowControls, onControlsVisibilityChange])

    // Gestisce hover sulla navbar
    const handleNavbarHover = () => {
        setIsNavbarHovered(true)
    }

    const handleNavbarLeave = () => {
        setIsNavbarHovered(false)
    }

    // Carica il film featured al mount del componente
    useEffect(() => {
        loadFeaturedMovie()
    }, [])

    const loadFeaturedMovie = async () => {
        try {
            setError(null)

            // Carica solo film con trailer disponibili
            const response = await fetch('/api/catalog/popular/movies-with-trailers')
            const data = await response.json()

            console.log('Hero Section - Film con trailer ricevuti:', data)

            if (data.success && data.data?.length > 0) {
                // Salva i film popolari per il tasto "Prossimo Film" e sezione "prossimi da guardare"
                setPopularMovies(data.data)
                console.log(`Hero Section - Salvati ${data.data.length} film con trailer`)

                // Usa il primo film (che sicuramente ha trailer)
                const featuredMovie = data.data[0]
                setFeaturedMovie(featuredMovie)
                console.log('Hero Section - Film selezionato:', featuredMovie.title)

                // Carica il trailer del film selezionato
                try {
                    const trailerResponse = await fetch(`/api/tmdb/movies/${featuredMovie.id}`)
                    const trailerData = await trailerResponse.json()

                    if (trailerData.success && trailerData.data?.videos?.results?.length > 0) {
                        const mainTrailer = findMainTrailer(trailerData.data.videos.results)
                        if (mainTrailer) {
                            setTrailer(mainTrailer.key)
                            console.log('Hero Section - Trailer impostato:', mainTrailer.key)
                        }
                    }
                } catch (trailerErr) {
                    console.log('Hero Section - Errore caricamento trailer:', trailerErr)
                }
            } else {
                // Fallback con film hardcoded se l'API non funziona
                const fallbackMovie: TMDBMovie = {
                    id: 157336,
                    title: 'Interstellar',
                    original_title: 'Interstellar',
                    overview: 'In seguito alla scoperta di un cunicolo spazio-temporale, un gruppo di esploratori si avventura in una eroica missione per tentare di superare i limiti della conquista spaziale.',
                    poster_path: '/bMKiLh0mES4Uiococ240lbbTGXQ.jpg',
                    backdrop_path: '/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg',
                    release_date: '2014-11-05',
                    vote_average: 8.46,
                    vote_count: 37772,
                    popularity: 46.5648,
                    adult: false,
                    video: false,
                    genre_ids: [18, 878],
                    original_language: 'en'
                }
                setFeaturedMovie(fallbackMovie)
            }

        } catch (err) {
            console.error('Errore nel caricamento film hero:', err)
            // Fallback con film hardcoded anche in caso di errore
            const fallbackMovie: TMDBMovie = {
                id: 157336,
                title: 'Interstellar',
                original_title: 'Interstellar',
                overview: 'In seguito alla scoperta di un cunicolo spazio-temporale, un gruppo di esploratori si avventura in una eroica missione per tentare di superare i limiti della conquista spaziale.',
                poster_path: '/bMKiLh0mES4Uiococ240lbbTGXQ.jpg',
                backdrop_path: '/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg',
                release_date: '2014-11-05',
                vote_average: 8.46,
                vote_count: 37772,
                popularity: 46.5648,
                adult: false,
                video: false,
                genre_ids: [18, 878],
                original_language: 'en'
            }
            setFeaturedMovie(fallbackMovie)
        }
    }

    const loadPopularMovies = async () => {
        try {
            setError(null)
            console.log('🎬 Caricando film popolari...')
            const response = await fetch('/api/catalog/popular/movies')
            const data = await response.json()

            if (data.success && data.data?.length > 0) {
                console.log(`✅ Caricati ${data.data.length} film popolari`)
                setPopularMovies(data.data)
                setCurrentMovieIndex(0)
                loadMovieAtIndex(0, data.data)
            } else {
                console.log('❌ Nessun film popolare trovato, usando fallback')
                setFeaturedMovie(fallbackMovie)
            }
        } catch (err) {
            console.error('❌ Errore nel caricamento dei film popolari:', err)
            setFeaturedMovie(fallbackMovie)
        }
    }

    const loadMovieAtIndex = async (index: number, movies: TMDBMovie[]) => {
        if (index >= movies.length) {
            // Se arriviamo alla fine, ricomincia dall'inizio
            loadMovieAtIndex(0, movies)
            return
        }

        const movie = movies[index]
        try {
            const trailerResponse = await fetch(`/api/tmdb/movies/${movie.id}`)
            const trailerData = await trailerResponse.json()

            if (trailerData.success && trailerData.data?.videos?.results?.length > 0) {
                const mainTrailer = findMainTrailer(trailerData.data.videos.results)
                if (mainTrailer) {
                    console.log(`🎬 Film caricato: ${movie.title} con trailer: ${mainTrailer.key}`)
                    setFeaturedMovie(movie)
                    setTrailer(mainTrailer.key)
                    startAutoChangeTimer()
                    return
                } else {
                    console.log(`⚠️ Film ${movie.title} ha video ma nessun trailer valido`)
                }
            } else {
                console.log(`⚠️ Film ${movie.title} non ha video disponibili`)
            }

            // Se non trova trailer, prova il prossimo film
            loadMovieAtIndex(index + 1, movies)
        } catch (err) {
            console.error(`Errore per film ${movie.title}:`, err)
            loadMovieAtIndex(index + 1, movies)
        }
    }

    const startAutoChangeTimer = () => {
        // Pulisce timer esistenti
        if (autoChangeTimer) {
            clearTimeout(autoChangeTimer)
        }

        console.log('🎬 Avviando timer per cambio automatico film in 30 secondi...')

        // Imposta timer per cambio automatico (30 secondi per test)
        const timer = setTimeout(() => {
            console.log('⏰ Timer scaduto, cambiando film...')
            changeToNextMovie()
        }, 30000) // 30 secondi per test

        setAutoChangeTimer(timer)
    }

    const changeToNextMovie = () => {
        console.log('🎬 Click su Prossimo Film - popularMovies.length:', popularMovies.length)
        console.log('🎬 currentMovieIndex:', currentMovieIndex)

        if (popularMovies.length === 0) {
            console.log('❌ Nessun film popolare disponibile')
            return
        }

        const nextIndex = (currentMovieIndex + 1) % popularMovies.length
        console.log(`🔄 Cambiando da film ${currentMovieIndex} a ${nextIndex} (${popularMovies[nextIndex]?.title})`)
        setCurrentMovieIndex(nextIndex)
        setTrailerEnded(false) // Reset trailer ended state
        loadMovieAtIndex(nextIndex, popularMovies)

        // Notifica il componente padre del cambio film
        if (onMovieChange) {
            onMovieChange(nextIndex)
        }
    }

    // Funzione per cambiare film dall'esterno
    const changeToMovie = (index: number) => {
        if (popularMovies.length === 0 || index < 0 || index >= popularMovies.length) {
            return
        }

        console.log(`🔄 Cambiando a film ${index} (${popularMovies[index]?.title})`)
        setCurrentMovieIndex(index)
        setTrailerEnded(false) // Reset trailer ended state

        // Carica solo i dettagli del film, non il trailer
        const movie = popularMovies[index]
        setFeaturedMovie(movie)
        setTrailer(null) // Non carica il trailer automaticamente
        setError(null)

        console.log(`✅ Film cambiato: ${movie.title}`)
    }

    // Espone la funzione per il componente padre
    useEffect(() => {
        if (onMovieChange) {
            // Crea una funzione che il componente padre può chiamare
            (window as any).changeHeroMovie = changeToMovie
        }
    }, [popularMovies, onMovieChange])

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



    if (error || !featuredMovie) {
        return (
            <div className="relative h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Errore nel caricamento</h2>
                    <p className="text-gray-400 mb-4">{error || 'Film non trovato'}</p>
                    <Button onClick={loadFeaturedMovie} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                        Riprova
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="relative h-screen w-full overflow-hidden -mt-20">

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
            <div className={`absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent transition-opacity duration-500 ${shouldShowControls && !showUpcomingTrailers ? 'opacity-100' : 'opacity-20'}`} />

            {/* Content */}
            <div className={`relative z-10 h-full flex items-center transition-all duration-500 ${shouldShowControls && !showUpcomingTrailers ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="container mx-auto px-4">
                    <div
                        className="max-w-2xl"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
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
            <div className={`absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-20'}`} />

            {/* Upcoming Trailers Section - Mostra quando il trailer finisce */}
            {trailerEnded && popularMovies.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                    <div className="container mx-auto">
                        <div className="flex gap-3 overflow-x-auto scrollbar-horizontal" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {popularMovies.filter((_, index) => index !== currentMovieIndex).slice(0, 6).map((movie, index) => {
                                const title = movie.title || 'Titolo non disponibile'
                                const backdropPath = movie.backdrop_path || movie.poster_path

                                return (
                                    <div
                                        key={movie.id}
                                        className="flex-shrink-0 w-48 h-28 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105"
                                        onClick={() => {
                                            const originalIndex = popularMovies.findIndex(m => m.id === movie.id)
                                            if (originalIndex !== -1) {
                                                changeToMovie(originalIndex)
                                            }
                                        }}
                                    >
                                        <div className="relative w-full h-full group">
                                            {/* Backdrop Image */}
                                            <img
                                                src={backdropPath ? `https://image.tmdb.org/t/p/w500${backdropPath}` : '/placeholder-movie.svg'}
                                                alt={title}
                                                className="w-full h-full object-cover"
                                            />

                                            {/* Overlay */}
                                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300" />

                                            {/* Play Button */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="p-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/30 group-hover:bg-black/80 transition-all duration-300">
                                                    <svg className="w-4 h-4 text-white fill-white" viewBox="0 0 24 24">
                                                        <path d="M8 5v14l11-7z" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Title */}
                                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                                <h4 className="text-white text-xs font-semibold truncate">
                                                    {title}
                                                </h4>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}