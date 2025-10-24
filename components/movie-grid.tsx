'use client'

import { useState, useRef, useEffect } from 'react'
import { Movie, TVShow } from '@/types'

interface MovieGridProps {
  movies: (Movie | TVShow)[]
  type?: 'movie' | 'tv'
  onPlay?: (id: number) => void
  onDetails?: (id: number) => void
}

interface MovieCardProps {
  movie: Movie | TVShow
  type?: 'movie' | 'tv'
  isExpanded: boolean
  onExpand: (id: number) => void
  onPlay?: (id: number) => void
  onDetails?: (id: number) => void
}

function MovieCard({ movie, type = 'movie', isExpanded, onExpand, onPlay, onDetails }: MovieCardProps) {
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return '/placeholder-movie.svg'
    return `https://image.tmdb.org/t/p/w500${path}`
  }

  const getTitle = () => {
    return (movie as any).title || (movie as any).name || 'Titolo non disponibile'
  }

  const loadTrailer = async () => {
    if (trailerUrl) return

    setIsLoading(true)
    try {
      const itemId = (movie as any).tmdb_id || movie.id
      const apiType = type === 'movie' ? 'movies' : 'tv'
      const response = await fetch(`/api/tmdb/${apiType}/${itemId}/videos`)
      const data = await response.json()

      if (data.success && data.data?.results?.length > 0) {
        // Cerca trailer ufficiale su YouTube
        const officialTrailer = data.data.results.find((video: any) => 
          video.type === 'Trailer' && 
          video.site === 'YouTube' && 
          video.official === true
        )

        if (officialTrailer) {
          setTrailerUrl(`https://www.youtube.com/embed/${officialTrailer.key}?autoplay=1&mute=1&loop=1&playlist=${officialTrailer.key}&controls=0&showinfo=0&rel=0&modestbranding=1`)
        } else {
          // Fallback al primo video YouTube disponibile
          const youtubeVideo = data.data.results.find((video: any) => video.site === 'YouTube')
          if (youtubeVideo) {
            setTrailerUrl(`https://www.youtube.com/embed/${youtubeVideo.key}?autoplay=1&mute=1&loop=1&playlist=${youtubeVideo.key}&controls=0&showinfo=0&rel=0&modestbranding=1`)
          }
        }
      }
    } catch (error) {
      console.error('Errore nel caricamento del trailer:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMouseEnter = () => {
    // Espansione immediata al hover
    onExpand(movie.id)

    // Carica trailer dopo 2 secondi
    timeoutRef.current = setTimeout(() => {
      loadTrailer()
    }, 2000)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setTrailerUrl(null)
    setIsLoading(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      className={`
        relative flex-shrink-0 transition-all duration-500 ease-out cursor-pointer
        ${isExpanded ? 'w-[500px]' : 'w-[200px]'}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative h-[300px] bg-gray-800 rounded-lg overflow-hidden group">
        {/* Immagine di base */}
        <img
          src={getImageUrl(movie.poster_path)}
          alt={getTitle()}
          className="w-full h-full object-cover transition-opacity duration-300"
          style={{ opacity: isExpanded && trailerUrl ? 0 : 1 }}
        />

        {/* Trailer video */}
        {isExpanded && trailerUrl && (
          <div className="absolute inset-0 w-full h-[200px]">
            <iframe
              src={trailerUrl}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            />
          </div>
        )}

        {/* Loading indicator */}
        {isExpanded && isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Overlay con informazioni */}
        {isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
              {getTitle()}
            </h3>
            <p className="text-gray-300 text-sm line-clamp-3 mb-4">
              {(movie as any).overview || 'Descrizione non disponibile'}
            </p>
            
            {/* Bottoni azione */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              {onPlay && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onPlay(movie.id)
                  }}
                  className="group relative bg-black/40 backdrop-blur-sm border border-white/30 text-white hover:bg-black/60 hover:border-white/50 font-semibold px-8 py-4 text-lg rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                >
                  {/* Play Logo SVG */}
                  <svg 
                    className="w-6 h-6 transition-transform duration-200 group-hover:scale-110 ml-1" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
              )}
              {onDetails && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDetails(movie.id)
                  }}
                  className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg rounded-lg flex items-center justify-center backdrop-blur-sm w-full sm:w-auto"
                >
                  Dettagli
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MovieGrid({ movies, type = 'movie', onPlay, onDetails }: MovieGridProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleExpand = (id: number) => {
    setExpandedId(id)
  }

  const handlePlay = (id: number) => {
    onPlay?.(id)
  }

  const handleDetails = (id: number) => {
    onDetails?.(id)
  }

  return (
    <div className="w-full">
      <div 
        ref={scrollRef}
        className="flex space-x-4 overflow-x-auto pb-4 scrollbar-horizontal"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollBehavior: 'smooth',
          willChange: 'transform'
        }}
      >
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            type={type}
            isExpanded={expandedId === movie.id}
            onExpand={handleExpand}
            onPlay={handlePlay}
            onDetails={handleDetails}
          />
        ))}
      </div>
    </div>
  )
}
