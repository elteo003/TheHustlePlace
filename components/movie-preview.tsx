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
            const itemId = (movie as any).tmdb_id || movie.id
            console.log(`🎬 Caricamento trailer per ${type} ID: ${itemId}`)

            // Carica i trailer reali dall'API TMDB
            const apiType = type === 'movie' ? 'movies' : 'tv'
            const response = await fetch(`/api/tmdb/${apiType}/${itemId}/videos`)
            const data = await response.json()

            console.log(`📊 Risposta API video per ${itemId}:`, data)

            if (data.success && data.data?.results && data.data.results.length > 0) {
                console.log(`📹 Trovati ${data.data.results.length} video per ${itemId}`)
                
                // Cerca il primo trailer/teaser disponibile
                const trailer = data.data.results.find((video: any) =>
                    (video.type === 'Trailer' || video.type === 'Teaser') &&
                    video.site === 'YouTube' &&
                    video.official === true
                )

                if (trailer) {
                    console.log(`✅ Trailer ufficiale trovato: ${trailer.name} (${trailer.key})`)
                    setTrailerUrl(`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&loop=1&playlist=${trailer.key}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&fs=0&disablekb=1`)
                } else {
                    console.log(`⚠️ Nessun trailer/teaser ufficiale, cerco altri video YouTube...`)
                    // Se non c'è un trailer/teaser ufficiale, prova con il primo trailer/teaser disponibile
                    const firstVideo = data.data.results.find((video: any) => 
                        (video.type === 'Trailer' || video.type === 'Teaser') && 
                        video.site === 'YouTube'
                    )
                    if (firstVideo) {
                        console.log(`✅ Video YouTube trovato: ${firstVideo.name} (${firstVideo.key})`)
                        setTrailerUrl(`https://www.youtube.com/embed/${firstVideo.key}?autoplay=1&mute=1&loop=1&playlist=${firstVideo.key}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&fs=0&disablekb=1`)
                    } else {
                        console.log(`❌ Nessun trailer/teaser YouTube disponibile per ${itemId}`)
                        console.log(`📋 Video disponibili:`, data.data.results.map((v: any) => ({ type: v.type, site: v.site, name: v.name })))
                    }
                }
            } else {
                console.log(`❌ Nessun video disponibile per ${itemId}`)
                if (!data.success) {
                    console.log(`❌ Errore API: ${data.error}`)
                }
            }
        } catch (error) {
            console.error('❌ Errore nel caricamento del trailer:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handlePlay = () => {
        const itemId = (movie as any).tmdb_id || movie.id
        console.log(`🎬 Play button clicked - Movie ID: ${movie.id}, TMDB ID: ${(movie as any).tmdb_id}, Using: ${itemId}`)
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
                            <iframe
                                src={trailerUrl}
                                className="w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
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
                                <div className="flex flex-col sm:flex-row gap-4 w-full">
                                    <Button
                                        size="sm"
                                        onClick={handlePlay}
                                        className="bg-black/40 backdrop-blur-sm border border-white/30 text-white hover:bg-black/60 hover:border-white/50 font-semibold px-8 py-4 text-lg rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                                    >
                                        <Play className="w-4 h-4 mr-2" />
                                        <span>Play</span>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleDetails}
                                        className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg rounded-lg flex items-center justify-center backdrop-blur-sm w-full sm:w-auto"
                                    >
                                        <Info className="w-4 h-4 mr-2" />
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
