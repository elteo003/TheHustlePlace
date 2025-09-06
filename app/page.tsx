'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { HeroSection } from '@/components/hero-section'
import { MoviesSection } from '@/components/movies-section'
import { ApiKeyError } from '@/components/api-key-error'

export default function HomePage() {
    const [hasApiKey, setHasApiKey] = useState(true)
    const [isCheckingApi, setIsCheckingApi] = useState(false)
    const [navbarVisible, setNavbarVisible] = useState(true)
    const [initialLoad, setInitialLoad] = useState(true)
    const [navbarHovered, setNavbarHovered] = useState(false)

    // La navbar è visibile se è esplicitamente visibile OPPURE se c'è hover
    const shouldShowNavbar = navbarVisible || navbarHovered

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
            // Nascondi la navbar dopo 2 secondi se non c'è hover
            if (!navbarHovered) {
                setNavbarVisible(false)
            }
        }, 2000)
        return () => clearTimeout(timer)
    }, [navbarHovered])


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
                <MoviesSection
                    title="Top 10 Titoli Oggi"
                    type="top10"
                />

                {/* Aggiunti di recente */}
                <MoviesSection
                    title="Aggiunti di Recente"
                    type="recent"
                />

                {/* Titoli del momento */}
                <MoviesSection
                    title="Titoli del Momento"
                    type="trending"
                />

                {/* In arrivo */}
                <MoviesSection
                    title="In Arrivo"
                    type="upcoming"
                />
            </div>
        </main>
    )
}