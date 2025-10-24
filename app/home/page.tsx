'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { HeroSection } from '@/components/hero-section'
import MovieGridIntegrated from '@/components/movie-grid-integrated'
import { UpcomingTrailers } from '@/components/upcoming-trailers'
import { ApiKeyError } from '@/components/api-key-error'
import { TMDBMovie } from '@/lib/tmdb'

export default function HomePage() {
    const router = useRouter()
    const [hasApiKey, setHasApiKey] = useState(true)
    const [isCheckingApi, setIsCheckingApi] = useState(false)
    const [navbarVisible, setNavbarVisible] = useState(true)
    const [initialLoad, setInitialLoad] = useState(true)
    const [navbarHovered, setNavbarHovered] = useState(false)
    const [heroSectionLoaded, setHeroSectionLoaded] = useState(false)
    const [showUpcomingTrailers, setShowUpcomingTrailers] = useState(false)
    const [popularMovies, setPopularMovies] = useState<TMDBMovie[]>([])
    const [currentHeroMovieIndex, setCurrentHeroMovieIndex] = useState(0)
    const [pageLoaded, setPageLoaded] = useState(false)

    // La navbar è visibile se è esplicitamente visibile OPPURE se c'è hover
    const shouldShowNavbar = navbarVisible || navbarHovered

    // Carica i film popolari con trailer per la Hero Section
    const loadPopularMovies = async () => {
        try {
            console.log('🎬 Caricando film popolari con trailer...')
            const response = await fetch('/api/catalog/popular/movies-with-trailers')
            const data = await response.json()
            
            if (data.success && data.data) {
                console.log(`✅ Caricati ${data.count} film con trailer`)
                setPopularMovies(data.data)
            } else {
                console.error('❌ Nessun film con trailer disponibile')
            }
        } catch (error) {
            console.error('Errore nel fetch dei film con trailer:', error)
        }
    }

    useEffect(() => {
        // Pre-carica i dati immediatamente
        loadPopularMovies()

        // Pre-carica anche altri dati in background
        const preloadData = async () => {
            try {
                // Pre-carica dati per le sezioni
                await Promise.all([
                    fetch('/api/catalog/popular/movies'),
                    fetch('/api/catalog/latest/movies'),
                    fetch('/api/catalog/popular/tv'),
                    fetch('/api/catalog/latest/tv'),
                    fetch('/api/catalog/top-10')
                ])
            } catch (error) {
                console.log('Pre-caricamento dati in background:', error)
            }
        }

        preloadData()
    }, [])

    // Gestisce la scomparsa della navbar dopo il caricamento iniziale
    useEffect(() => {
        const timer = setTimeout(() => {
            setInitialLoad(false)
            // Nascondi la navbar dopo 2 secondi se non c'è hover
            if (!navbarHovered) {
                setNavbarVisible(false)
            }
        }, 2000)
        return () => clearTimeout(timer)
    }, [navbarHovered])

    // Gestisce l'hover della navbar con timeout più breve
    useEffect(() => {
        let hoverTimeout: NodeJS.Timeout | null = null

        const handleNavbarHover = () => {
            setNavbarHovered(true)
            if (hoverTimeout) {
                clearTimeout(hoverTimeout)
                hoverTimeout = null
            }
        }
        
        const handleNavbarLeave = () => {
            // Nascondi dopo 2 secondi
            hoverTimeout = setTimeout(() => {
                setNavbarHovered(false)
            }, 2000)
        }

        // Aggiungi event listeners per l'hover della navbar
        document.addEventListener('mouseenter', handleNavbarHover, true)
        document.addEventListener('mouseleave', handleNavbarLeave, true)

        return () => {
            document.removeEventListener('mouseenter', handleNavbarHover, true)
            document.removeEventListener('mouseleave', handleNavbarLeave, true)
            if (hoverTimeout) {
                clearTimeout(hoverTimeout)
            }
        }
    }, [])

    // Gestisce il caricamento della Hero Section
    const handleHeroSectionLoaded = () => {
        setHeroSectionLoaded(true)
    }

    useEffect(() => {
        // Controllo API key in background, non blocca il rendering
        setIsCheckingApi(true)
        fetch('/api/test-api-key')
            .then(res => res.json())
            .then(data => setHasApiKey(data.hasApiKey))
            .catch(() => setHasApiKey(false))
            .finally(() => setIsCheckingApi(false))
    }, [])


    // Gestisce la fine del trailer nella Hero Section
    const handleTrailerEnded = () => {
        console.log('🎬 Trailer finito, mostrando prossimi trailer')
        setShowUpcomingTrailers(true)
    }

    // Gestisce il cambio di film nella Hero Section
    const handleHeroMovieChange = (index: number) => {
        setCurrentHeroMovieIndex(index)
    }

    // Gestisce la selezione di un film dai prossimi trailer
    const handleUpcomingMovieSelect = (index: number) => {
        console.log('🎬 Film selezionato dai prossimi trailer:', index)
        if ((window as any).changeHeroMovie) {
            (window as any).changeHeroMovie(index)
        }
        setShowUpcomingTrailers(false)
    }

    // Gestisce l'autoplay dei prossimi trailer
    const handleUpcomingAutoplay = () => {
        console.log('🎬 Autoplay prossimo film')
        const nextIndex = (currentHeroMovieIndex + 1) % popularMovies.length
        handleUpcomingMovieSelect(nextIndex)
    }

    // Animazione di entrata della pagina
    useEffect(() => {
        const timer = setTimeout(() => {
            setPageLoaded(true)
        }, 100)
        return () => clearTimeout(timer)
    }, [])

    const handlePlay = (id: number, type?: 'movie' | 'tv') => {
        if (type === 'tv') {
            router.push(`/series/${id}`)
        } else {
            router.push(`/player/movie/${id}`)
        }
    }

    const handleDetails = (id: number, type?: 'movie' | 'tv') => {
        if (type === 'tv') {
            router.push(`/series/${id}`)
        } else {
            router.push(`/player/movie/${id}`)
        }
    }

    // Mostra errore solo se API key mancante e controllo completato
    if (!hasApiKey && !isCheckingApi) {
        return <ApiKeyError />
    }

    return (
        <main className="min-h-screen bg-black">
            {/* Navbar */}
            <Navbar
                isVisible={shouldShowNavbar}
                onHoverChange={setNavbarHovered}
            />

            {/* Hero Section */}
            <HeroSection
                onControlsVisibilityChange={setNavbarVisible}
                navbarHovered={navbarHovered}
                onTrailerEnded={handleTrailerEnded}
                onMovieChange={handleHeroMovieChange}
                showUpcomingTrailers={showUpcomingTrailers}
                onLoaded={handleHeroSectionLoaded}
                currentHeroMovieIndex={currentHeroMovieIndex}
            />

            {/* Upcoming Trailers Section - Bottom Hero Section */}
            {showUpcomingTrailers && popularMovies.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/95 via-black/80 to-transparent" style={{ marginTop: '-80px' }}>
                    <div className="container mx-auto px-4 py-6">
                        <UpcomingTrailers
                            movies={popularMovies}
                            currentMovieIndex={currentHeroMovieIndex}
                            onMovieSelect={handleUpcomingMovieSelect}
                            onAutoplay={handleUpcomingAutoplay}
                            autoplayDelay={10}
                            isVisible={true}
                        />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className={`relative z-10 transition-all duration-1000 delay-300 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {/* Top 10 Movies Section */}
                <section className={`py-8 transition-all duration-1000 delay-500 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="container mx-auto px-4">
                        <h2 className="text-2xl font-bold text-white mb-6">Top 10 Titoli Oggi</h2>
                        <MovieGridIntegrated
                            type="movie"
                            section="trending"
                            onPlay={handlePlay}
                            onDetails={handleDetails}
                        />
                    </div>
                </section>

                {/* Popular Movies Section */}
                <section className={`py-8 transition-all duration-1000 delay-700 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="container mx-auto px-4">
                        <h2 className="text-2xl font-bold text-white mb-6">Film Popolari</h2>
                        <MovieGridIntegrated
                            type="movie"
                            section="popular"
                            onPlay={handlePlay}
                            onDetails={handleDetails}
                        />
                    </div>
                </section>

                {/* Recent Movies Section */}
                <section className={`py-8 transition-all duration-1000 delay-900 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="container mx-auto px-4">
                        <h2 className="text-2xl font-bold text-white mb-6">Film Recenti</h2>
                        <MovieGridIntegrated
                            type="movie"
                            section="recent"
                            onPlay={handlePlay}
                            onDetails={handleDetails}
                        />
                    </div>
                </section>

                {/* Popular TV Shows Section */}
                <section className={`py-8 transition-all duration-1000 delay-1100 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="container mx-auto px-4">
                        <h2 className="text-2xl font-bold text-white mb-6">Serie TV Popolari</h2>
                        <MovieGridIntegrated
                            type="tv"
                            section="popular"
                            onPlay={handlePlay}
                            onDetails={handleDetails}
                        />
                    </div>
                </section>

                {/* Recent TV Shows Section */}
                <section className={`py-8 transition-all duration-1000 delay-1300 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="container mx-auto px-4">
                        <h2 className="text-2xl font-bold text-white mb-6">Serie TV Recenti</h2>
                        <MovieGridIntegrated
                            type="tv"
                            section="recent"
                            onPlay={handlePlay}
                            onDetails={handleDetails}
                        />
                    </div>
                </section>
            </div>
        </main>
    )

}
