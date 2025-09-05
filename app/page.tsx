'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { HeroSection } from '@/components/hero-section'
import { MoviesSection } from '@/components/movies-section'
import { ApiKeyError } from '@/components/api-key-error'

export default function HomePage() {
    const [hasApiKey, setHasApiKey] = useState(true)

    useEffect(() => {
        // Verifica se l'API key è configurata
        const checkApiKey = async () => {
            try {
                const response = await fetch('/api/test-api-key')
                const data = await response.json()
                setHasApiKey(data.hasApiKey || false)
            } catch (error) {
                console.error('Errore verifica API key:', error)
                setHasApiKey(false)
            }
        }

        checkApiKey()
    }, [])

    if (!hasApiKey) {
        return <ApiKeyError />
    }

    return (
        <main className="min-h-screen bg-black">
            {/* Navbar */}
            <Navbar />

            {/* Hero Section */}
            <HeroSection />

            {/* Content Sections */}
            <div className="container mx-auto px-4 py-8 space-y-12">
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