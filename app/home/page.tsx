'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HeroSection } from '@/components/hero-section'
import MovieGridIntegrated from '@/components/movie-grid-integrated'
import { UpcomingTrailers } from '@/components/upcoming-trailers'
import { ApiKeyError } from '@/components/api-key-error'
import { TMDBMovie } from '@/lib/tmdb'

export default function HomePage() {
    const router = useRouter()
    const [hasApiKey, setHasApiKey] = useState(true)
    const [isCheckingApi, setIsCheckingApi] = useState(false)
    const [navbarVisible, setNavbarVisible] = useState(false)
    const [initialLoad, setInitialLoad] = useState(true)
    const [navbarHovered, setNavbarHovered] = useState(false)
    const [heroSectionLoaded, setHeroSectionLoaded] = useState(false)
    const [showUpcomingTrailers, setShowUpcomingTrailers] = useState(false)
    const [popularMovies, setPopularMovies] = useState<TMDBMovie[]>([])
    const [currentHeroMovieIndex, setCurrentHeroMovieIndex] = useState(0)
    const [pageLoaded, setPageLoaded] = useState(false)


    // Carica i film popolari per la Hero Section
    const loadPopularMovies = async () => {
        try {
            console.log('🎬 Caricando film popolari...')
            const response = await fetch('/api/catalog/popular/movies')
            const data = await response.json()
            
            if (data.success && data.data) {
                console.log('✅ Caricati 20 film popolari')
                setPopularMovies(data.data)
            } else {
                console.error('❌ Nessun film popolare disponibile')
            }
        } catch (error) {
            console.error('Errore nel fetch dei film:', error)
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

    // Gestisce la scomparsa della navbar dopo il caricamento iniziale
    useEffect(() => {
        const timer = setTimeout(() => {
            setInitialLoad(false)
        }, 2000)
        return () => clearTimeout(timer)
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

    // Mostra errore solo se API key mancante e controllo completato
    if (!hasApiKey && !isCheckingApi) {
        return <ApiKeyError />
    }

    return (
        <div className={`min-h-screen bg-black transition-all duration-1500 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Navbar Dinamica */}
            <div 
                className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${(navbarVisible || navbarHovered) ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}`}
                onMouseEnter={() => setNavbarHovered(true)}
                onMouseLeave={() => setNavbarHovered(false)}
            >
                <div className="bg-black/80 backdrop-blur-md border-b border-white/10">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            {/* Logo */}
                            <div className="flex items-center space-x-3 group">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                                    <span className="text-white font-bold text-xl">H</span>
                                </div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-purple-500 transition-all duration-300">
                                    TheHustlePlace
                                </span>
                            </div>

                            {/* Navigation Links */}
                            <div className="hidden md:flex items-center space-x-8">
                                <a href="/home" className="text-gray-300 hover:text-white transition-colors">
                                    Home
                                </a>
                                <a href="/movies" className="text-gray-300 hover:text-white transition-colors">
                                    Film
                                </a>
                                <a href="/tv" className="text-gray-300 hover:text-white transition-colors">
                                    Serie TV
                                </a>
                                <a href="/anime" className="text-gray-300 hover:text-white transition-colors">
                                    Anime
                                </a>
                                <a href="/request" className="text-gray-300 hover:text-white transition-colors">
                                    Richiedi un titolo
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <HeroSection
                onControlsVisibilityChange={setNavbarVisible}
                navbarHovered={navbarHovered}
                onTrailerEnded={handleTrailerEnded}
                onMovieChange={handleHeroMovieChange}
                showUpcomingTrailers={showUpcomingTrailers}
                onLoaded={handleHeroSectionLoaded}
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
        </div>
    )

    function handlePlay(id: number, type?: 'movie' | 'tv') {
        if (type === 'tv') {
            router.push(`/series/${id}`)
        } else {
            router.push(`/player/movie/${id}`)
        }
    }

    function handleDetails(id: number, type?: 'movie' | 'tv') {
        if (type === 'tv') {
            router.push(`/series/${id}`)
        } else {
            router.push(`/player/movie/${id}`)
        }
    }
}
