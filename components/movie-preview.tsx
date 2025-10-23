'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MoviePreviewProps } from '@/types'
import { getTMDBImageUrl } from '@/lib/tmdb'

export function MoviePreview({ 
    movie, 
    type, 
    onPlay, 
    onDetails, 
    isHovered, 
    onHover 
}: MoviePreviewProps) {
    const [showPreview, setShowPreview] = useState(false)
    const [trailerUrl, setTrailerUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const trailerTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Gestisce l'hover con delay
    useEffect(() => {
        if (isHovered) {
            // Mostra preview dopo 1 secondo
            timeoutRef.current = setTimeout(() => {
                setShowPreview(true)
            }, 1000)

            // Carica trailer dopo 2.5 secondi
            trailerTimeoutRef.current = setTimeout(() => {
                loadTrailer()
            }, 2500)
        } else {
            // Pulisce i timeout quando l'hover finisce
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }
            if (trailerTimeoutRef.current) {
                clearTimeout(trailerTimeoutRef.current)
                trailerTimeoutRef.current = null
            }
            setShowPreview(false)
            setTrailerUrl(null)
            setIsLoading(false)
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            if (trailerTimeoutRef.current) clearTimeout(trailerTimeoutRef.current)
        }
    }, [isHovered])

    const loadTrailer = async () => {
        if (trailerUrl) return // Già caricato

        setIsLoading(true)
        try {
            // Simula il caricamento di un trailer (in un'app reale, faresti una chiamata API)
            // Per ora usiamo un video di esempio o un placeholder
            const mockTrailerUrl = `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`
            setTrailerUrl(mockTrailerUrl)
        } catch (error) {
            console.error('Errore nel caricamento del trailer:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handlePlay = () => {
        const itemId = (movie as any).tmdb_id || movie.id
        onPlay(itemId)
    }

    const handleDetails = () => {
        const itemId = (movie as any).tmdb_id || movie.id
        onDetails(itemId)
    }

    const getTitle = () => {
        return type === 'movie' ? (movie as any).title : (movie as any).name
    }

    const getImageUrl = (posterPath: string | null | undefined) => {
        if (!posterPath || posterPath === '/placeholder-movie.svg') {
            return '/placeholder-movie.svg'
        }
        return getTMDBImageUrl(posterPath, 'w500')
    }

    const getBackdropUrl = (backdropPath: string | null | undefined) => {
        if (!backdropPath || backdropPath === '/placeholder-movie.svg') {
            return '/placeholder-movie.svg'
        }
        return getTMDBImageUrl(backdropPath, 'original')
    }

    return (
        <div 
            className="relative group cursor-pointer"
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
        >
            {/* Card normale */}
            <div className="aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden mb-2 transition-all duration-300 group-hover:scale-105">
                <img
                    src={getImageUrl(movie.poster_path)}
                    alt={getTitle()}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Preview espanso (Netflix-style) */}
            {showPreview && (
                <div className="absolute top-0 left-0 z-50 bg-gray-900 rounded-lg shadow-2xl overflow-hidden min-w-[300px] max-w-[400px] transform -translate-y-2 transition-all duration-300">
                    {/* Backdrop con trailer */}
                    <div className="relative aspect-video bg-gray-800">
                        {trailerUrl && !isLoading ? (
                            <video
                                src={trailerUrl}
                                autoPlay
                                muted
                                loop
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img
                                src={getBackdropUrl(movie.backdrop_path)}
                                alt={getTitle()}
                                className="w-full h-full object-cover"
                            />
                        )}
                        
                        {/* Overlay con controlli */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                            <div className="absolute bottom-4 left-4 right-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Button
                                        size="sm"
                                        onClick={handlePlay}
                                        className="bg-white text-black hover:bg-gray-200 flex items-center space-x-1"
                                    >
                                        <Play className="w-4 h-4" />
                                        <span>Guarda ora</span>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleDetails}
                                        className="border-white/30 text-white hover:bg-white/10 flex items-center space-x-1"
                                    >
                                        <Info className="w-4 h-4" />
                                        <span>Dettagli</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Informazioni del contenuto */}
                    <div className="p-4">
                        <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                            {getTitle()}
                        </h3>
                        <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                            {movie.overview}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-400">
                            <span>
                                {type === 'movie' 
                                    ? (movie as any).release_date ? new Date((movie as any).release_date).getFullYear() : 'N/A'
                                    : (movie as any).first_air_date ? new Date((movie as any).first_air_date).getFullYear() : 'N/A'
                                }
                            </span>
                            <span className="flex items-center">
                                ⭐ {movie.vote_average.toFixed(1)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
