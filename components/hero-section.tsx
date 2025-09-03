'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Info, Plus, Heart, ChevronLeft, ChevronRight } from 'lucide-react'
import { Movie } from '@/types'
import { getImageUrl, getAvailabilityBadge, getAvailabilityColor } from '@/lib/utils'

interface HeroSectionProps {
    featuredContent: Movie[]
}

export function HeroSection({ featuredContent }: HeroSectionProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [wheelTimeout, setWheelTimeout] = useState<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const interval = setInterval(() => {
            if (!isTransitioning) {
                setCurrentIndex((prev) => (prev + 1) % featuredContent.length)
            }
        }, 8000) // Cambia ogni 8 secondi

        return () => clearInterval(interval)
    }, [featuredContent.length, isTransitioning])

    // Gestione scroll con mouse wheel (con throttling)
    const handleWheel = (e: React.WheelEvent) => {
        // Throttle per evitare scroll troppo veloce
        if (wheelTimeout) return

        const timeout = setTimeout(() => {
            setWheelTimeout(null)
        }, 800) // Aspetta 800ms tra un cambio e l'altro

        setWheelTimeout(timeout)
        setIsTransitioning(true)

        if (e.deltaY > 0) {
            // Scroll down - prossimo film
            setCurrentIndex((prev) => (prev + 1) % featuredContent.length)
        } else {
            // Scroll up - film precedente
            setCurrentIndex((prev) => (prev - 1 + featuredContent.length) % featuredContent.length)
        }

        // Reset transitioning dopo l'animazione
        setTimeout(() => setIsTransitioning(false), 1000)
    }

    // Gestione scroll intelligente - solo quando l'utente è nella hero section
    useEffect(() => {
        const handleWheelIntelligent = (e: WheelEvent) => {
            const container = document.getElementById('hero-container')
            if (!container) return

            // Controlla se il mouse è sopra la hero section
            const rect = container.getBoundingClientRect()
            const isInHeroSection = (
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom
            )

            // Solo se il mouse è nella hero section E c'è scroll orizzontale significativo
            if (isInHeroSection && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                e.preventDefault()
                
                // Throttle per evitare scroll troppo veloce
                if (wheelTimeout) return

                const timeout = setTimeout(() => {
                    setWheelTimeout(null)
                }, 800)

                setWheelTimeout(timeout)
                setIsTransitioning(true)

                if (e.deltaX > 0) {
                    // Scroll right - vai al prossimo
                    setCurrentIndex((prev) => (prev + 1) % featuredContent.length)
                } else {
                    // Scroll left - vai al precedente
                    setCurrentIndex((prev) => (prev - 1 + featuredContent.length) % featuredContent.length)
                }

                // Reset transitioning dopo l'animazione
                setTimeout(() => setIsTransitioning(false), 1000)
            }
        }

        document.addEventListener('wheel', handleWheelIntelligent, { passive: false })
        return () => {
            document.removeEventListener('wheel', handleWheelIntelligent)
        }
    }, [featuredContent.length, wheelTimeout])

    // Gestione touch per mobile (con throttling)
    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0]
        setTouchStart(touch.clientX)
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart || isTransitioning) return

        const touch = e.changedTouches[0]
        const diff = touchStart - touch.clientX

        if (Math.abs(diff) > 50) { // Soglia minima per swipe
            setIsTransitioning(true)

            if (diff > 0) {
                // Swipe left - prossimo film
                setCurrentIndex((prev) => (prev + 1) % featuredContent.length)
            } else {
                // Swipe right - film precedente
                setCurrentIndex((prev) => (prev - 1 + featuredContent.length) % featuredContent.length)
            }

            // Reset transitioning dopo l'animazione
            setTimeout(() => setIsTransitioning(false), 1000)
        }

        setTouchStart(null)
    }

    const [touchStart, setTouchStart] = useState<number | null>(null)

    // Funzione per cambiare slide con animazione smooth
    const goToSlide = (index: number) => {
        if (isTransitioning) return

        setIsTransitioning(true)
        setCurrentIndex(index)

        // Reset transitioning dopo l'animazione
        setTimeout(() => setIsTransitioning(false), 1000)
    }

    const currentMovie = featuredContent[currentIndex]

    if (!currentMovie) return null

    return (
        <section
            id="hero-container"
            className="relative h-screen overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Background Image con transizione smooth */}
            <div className="absolute inset-0">
                <img
                    src={getImageUrl(currentMovie.backdrop_path, 'w1280')}
                    alt={currentMovie.title}
                    className={`w-full h-full object-cover transition-all duration-1000 ease-in-out ${isTransitioning ? 'scale-105 opacity-90' : 'scale-100 opacity-100'
                        }`}
                />
                <div className="absolute inset-0 hero-gradient"></div>
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={() => goToSlide((currentIndex - 1 + featuredContent.length) % featuredContent.length)}
                disabled={isTransitioning}
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 ${isTransitioning ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                    }`}
            >
                <ChevronLeft className="w-6 h-6" />
            </button>

            <button
                onClick={() => goToSlide((currentIndex + 1) % featuredContent.length)}
                disabled={isTransitioning}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 ${isTransitioning ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                    }`}
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Content */}
            <div className="relative z-10 h-full flex items-center">
                <div className="max-w-7xl mx-auto px-4 w-full">
                    <div className="max-w-2xl">
                        <h1 className={`text-5xl md:text-7xl font-bold mb-6 leading-tight transition-all duration-1000 ease-in-out ${isTransitioning ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
                            }`}>
                            {currentMovie.title}
                        </h1>

                        <div className="flex items-center space-x-4 mb-6">
                            <div className="flex items-center space-x-2">
                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getAvailabilityColor(getAvailabilityBadge(currentMovie))}`}>
                                    {getAvailabilityBadge(currentMovie)}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-yellow-400">★</span>
                                <span className="text-sm">{currentMovie.vote_average ? currentMovie.vote_average.toFixed(1) : 'N/A'}</span>
                            </div>
                            <span className="text-sm text-gray-300">
                                {currentMovie.release_date ? new Date(currentMovie.release_date).getFullYear() : 'N/A'}
                            </span>
                        </div>

                        <p className={`text-lg text-gray-300 mb-8 leading-relaxed line-clamp-3 transition-all duration-1000 ease-in-out delay-200 ${isTransitioning ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
                            }`}>
                            {currentMovie.overview}
                        </p>

                        <div className={`flex items-center space-x-4 transition-all duration-1000 ease-in-out delay-300 ${isTransitioning ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
                            }`}>
                            <Button
                                size="lg"
                                className="premium-button flex items-center space-x-2"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    window.location.href = `/player/movie/${currentMovie.id}`
                                }}
                            >
                                <Play className="w-5 h-5" />
                                <span>Guarda ora</span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/10"
                            >
                                <Plus className="w-6 h-6" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/10"
                            >
                                <Heart className="w-6 h-6" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-10 w-32 h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                    className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
                    style={{
                        width: `${((currentIndex + 1) / featuredContent.length) * 100}%`
                    }}
                />
            </div>

            {/* Indicators */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
                <div className="flex flex-col items-center space-y-3">
                    {/* Navigation hint */}
                    <div className="flex items-center space-x-2 text-white/70 text-xs">
                        <ChevronLeft className="w-4 h-4" />
                        <span>Naviga</span>
                        <ChevronRight className="w-4 h-4" />
                    </div>
                    
                    {/* Dots */}
                    <div className="flex space-x-2">
                        {featuredContent.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                disabled={isTransitioning}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentIndex
                                    ? 'bg-white scale-125'
                                    : 'bg-white/50 hover:bg-white/75'
                                    } ${isTransitioning ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Gradient Overlay Bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10"></div>
        </section>
    )
}
