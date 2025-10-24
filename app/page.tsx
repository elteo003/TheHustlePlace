'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { HeroSection } from '@/components/hero-section'
import { MoviesSection } from '@/components/movies-section'
import { ApiKeyError } from '@/components/api-key-error'
import { LoadingScreen } from '@/components/loading-screen'
import MovieGridIntegrated from '@/components/movie-grid-integrated'

export default function HomePage() {
    const router = useRouter()
    const [hasApiKey, setHasApiKey] = useState(true)
    const [isCheckingApi, setIsCheckingApi] = useState(false)
    const [navbarVisible, setNavbarVisible] = useState(true)
    const [initialLoad, setInitialLoad] = useState(true)
    const [navbarHovered, setNavbarHovered] = useState(false)
    const [showLoadingScreen, setShowLoadingScreen] = useState(false)

    // La navbar è visibile se è esplicitamente visibile OPPURE se c'è hover
    const shouldShowNavbar = navbarVisible || navbarHovered

    useEffect(() => {
        // Mostra loading screen solo al primo accesso o dopo riavvio server
        const lastSeenLoading = localStorage.getItem('lastSeenLoading')
        const now = Date.now()
        const oneHour = 60 * 60 * 1000 // 1 ora in millisecondi
        
        // Se non c'è timestamp o è passata più di un'ora, mostra l'animazione
        if (!lastSeenLoading || (now - parseInt(lastSeenLoading)) > oneHour) {
            setShowLoadingScreen(true)
            localStorage.setItem('lastSeenLoading', now.toString())
        }

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

            {/* Hero Section */}
            <HeroSection
                onControlsVisibilityChange={setNavbarVisible}
                navbarHovered={navbarHovered}
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