'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { HeroSection } from '@/components/hero-section'
import { MoviesSection } from '@/components/movies-section'
import { ApiKeyError } from '@/components/api-key-error'
import { LoadingScreen } from '@/components/loading-screen'
import MovieGridIntegrated from '@/components/movie-grid-integrated'
import { UpcomingTrailers } from '@/components/upcoming-trailers'
import { TMDBMovie } from '@/lib/tmdb'

export default function HomePage() {
    const router = useRouter()
    const [hasApiKey, setHasApiKey] = useState(true)
    const [isCheckingApi, setIsCheckingApi] = useState(false)
    const [navbarVisible, setNavbarVisible] = useState(true)
    const [initialLoad, setInitialLoad] = useState(true)
    const [navbarHovered, setNavbarHovered] = useState(false)
    const [showLoadingScreen, setShowLoadingScreen] = useState(false)
    const [showUpcomingTrailers, setShowUpcomingTrailers] = useState(false)
    const [popularMovies, setPopularMovies] = useState<TMDBMovie[]>([])
    const [currentHeroMovieIndex, setCurrentHeroMovieIndex] = useState(0)

    // La navbar è visibile se è esplicitamente visibile OPPURE se c'è hover
    const shouldShowNavbar = navbarVisible || navbarHovered

    // Carica i film popolari per i prossimi trailer
    useEffect(() => {
        const loadPopularMovies = async () => {
            try {
                const response = await fetch('/api/catalog/popular/movies')
                const data = await response.json()

                if (data.success && data.data) {
                    setPopularMovies(data.data)
                    console.log('✅ Film popolari caricati per prossimi trailer:', data.data.length)
                }
            } catch (error) {
                console.error('❌ Errore nel caricamento film popolari:', error)
            }
        }

        loadPopularMovies()
    }, [])

    useEffect(() => {
        // Mostra loading screen solo al primo accesso o al refresh
        const hasSeenLoading = sessionStorage.getItem('hasSeenLoading')

        if (!hasSeenLoading) {
            setShowLoadingScreen(true)
            sessionStorage.setItem('hasSeenLoading', 'true')
        }

        // Listener per il refresh della pagina
        const handleBeforeUnload = () => {
            // Rimuove il flag quando la pagina viene ricaricata
            sessionStorage.removeItem('hasSeenLoading')
        }

        window.addEventListener('beforeunload', handleBeforeUnload)

        // Controllo API key in background, non blocca il rendering
        setIsCheckingApi(true)
        fetch('/api/test-api-key')
            .then(res => res.json())
            .then(data => setHasApiKey(data.hasApiKey))
            .catch(() => setHasApiKey(false))
            .finally(() => setIsCheckingApi(false))

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
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

    // Gestisce quando il trailer della Hero Section finisce
    const handleTrailerEnded = () => {
        console.log('🎬 Trailer finito, mostrando prossimi film')
        setShowUpcomingTrailers(true)
    }

    // Gestisce il cambio di film nella Hero Section
    const handleHeroMovieChange = (index: number) => {
        setCurrentHeroMovieIndex(index)
    }

    // Gestisce la selezione di un film dai prossimi trailer
    const handleUpcomingMovieSelect = (index: number) => {
        console.log('🎬 Film selezionato dai prossimi:', index)
        // Usa la funzione globale esposta dalla Hero Section
        if ((window as any).changeHeroMovie) {
            (window as any).changeHeroMovie(index)
        }
        setShowUpcomingTrailers(false) // Nasconde la sezione dopo la selezione
    }

    // Gestisce l'autoplay del prossimo film
    const handleUpcomingAutoplay = () => {
        console.log('🎬 Autoplay prossimo film')
        const nextIndex = (currentHeroMovieIndex + 1) % popularMovies.length
        handleUpcomingMovieSelect(nextIndex)
    }

    // Mostra loading screen per il caricamento iniziale
    if (showLoadingScreen) {
        return (
            <LoadingScreen
                onComplete={() => setShowLoadingScreen(false)}
                duration={5000} // 5 seconds
            />
        )
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

            {/* Upcoming Trailers Section - Sopra Hero Section */}
            {showUpcomingTrailers && popularMovies.length > 0 && (
                <div className="absolute top-0 left-0 right-0 z-20 bg-black/50 backdrop-blur-sm">
                    <div className="container mx-auto px-4 py-8">
                        <UpcomingTrailers
                            movies={popularMovies}
                            currentMovieIndex={currentHeroMovieIndex}
                            onMovieSelect={handleUpcomingMovieSelect}
                            isVisible={showUpcomingTrailers}
                            onAutoplay={handleUpcomingAutoplay}
                            autoplayDelay={10}
                        />
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <HeroSection
                onControlsVisibilityChange={setNavbarVisible}
                navbarHovered={navbarHovered}
                onTrailerEnded={handleTrailerEnded}
                onMovieChange={handleHeroMovieChange}
                showUpcomingTrailers={showUpcomingTrailers}
            />

            {/* Content Sections */}
            <div className="container mx-auto px-4 py-12 space-y-16">
                {/* Top 10 titoli oggi */}
                <section>
                    <h2 className="text-2xl font-bold text-white mb-6">Top 10 Titoli Oggi</h2>
                    <MovieGridIntegrated
                        type="movie"
                        section="trending"
                        onPlay={handlePlay}
                        onDetails={handleDetails}
                        limit={10}
                    />
                </section>

                {/* Film Popolari */}
                <section>
                    <h2 className="text-2xl font-bold text-white mb-6">Film Popolari</h2>
                    <MovieGridIntegrated
                        type="movie"
                        section="popular"
                        onPlay={handlePlay}
                        onDetails={handleDetails}
                        limit={10}
                    />
                </section>

                {/* Serie TV Popolari */}
                <section>
                    <h2 className="text-2xl font-bold text-white mb-6">Serie TV Popolari</h2>
                    <MovieGridIntegrated
                        type="tv"
                        section="popular"
                        onPlay={handlePlay}
                        onDetails={handleDetails}
                        limit={10}
                    />
                </section>

                {/* Aggiunti di recente */}
                <section>
                    <h2 className="text-2xl font-bold text-white mb-6">Aggiunti di Recente</h2>
                    <MovieGridIntegrated
                        type="movie"
                        section="recent"
                        onPlay={handlePlay}
                        onDetails={handleDetails}
                        limit={10}
                    />
                </section>

                {/* Titoli del momento */}
                <section>
                    <h2 className="text-2xl font-bold text-white mb-6">Titoli del Momento</h2>
                    <MovieGridIntegrated
                        type="movie"
                        section="trending"
                        onPlay={handlePlay}
                        onDetails={handleDetails}
                        limit={10}
                    />
                </section>

                {/* In arrivo */}
                <section>
                    <h2 className="text-2xl font-bold text-white mb-6">In Arrivo</h2>
                    <MovieGridIntegrated
                        type="movie"
                        section="now-playing"
                        onPlay={handlePlay}
                        onDetails={handleDetails}
                        limit={10}
                    />
                </section>
            </div>
        </main>
    )
}