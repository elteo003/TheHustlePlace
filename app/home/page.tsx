'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { HeroSection } from '@/components/hero-section'
import MovieGridIntegrated from '@/components/movie-grid-integrated'
import { ApiKeyError } from '@/components/api-key-error'
import { MovieProvider } from '@/contexts/MovieContext'

export default function HomePage() {
    const router = useRouter()
    const [hasApiKey, setHasApiKey] = useState(true)
    const [isCheckingApi, setIsCheckingApi] = useState(false)
    const [heroSectionLoaded, setHeroSectionLoaded] = useState(false)
    const [showUpcomingTrailers, setShowUpcomingTrailers] = useState(false)
    const [currentHeroMovieIndex, setCurrentHeroMovieIndex] = useState(0)
    const [pageLoaded, setPageLoaded] = useState(false)

    // La Hero Section ora gestisce internamente il caricamento dei film con trailer

    useEffect(() => {
        // Pre-carica altri dati in background (la Hero Section gestisce i suoi film internamente)
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
        setShowUpcomingTrailers(false)
    }

    // Gestisce l'autoplay dei prossimi trailer
    const handleUpcomingAutoplay = () => {
        console.log('🎬 Autoplay prossimo film')
        // La Hero Section gestisce internamente l'indice del prossimo film
        if ((window as any).changeHeroMovie) {
            (window as any).changeHeroMovie(currentHeroMovieIndex + 1)
        }
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
        <MovieProvider>
            <main className="min-h-screen bg-black">
                {/* Hero Section */}
                <HeroSection
                    onTrailerEnded={handleTrailerEnded}
                    onMovieChange={handleHeroMovieChange}
                    showUpcomingTrailers={showUpcomingTrailers}
                    onLoaded={handleHeroSectionLoaded}
                    currentHeroMovieIndex={currentHeroMovieIndex}
                    onUpcomingMovieSelect={handleUpcomingMovieSelect}
                />

                {/* La sezione Upcoming Trailers è ora gestita internamente dalla Hero Section */}

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
        </MovieProvider>
    )

}
