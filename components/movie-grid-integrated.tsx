'use client'

import { useState, useEffect } from 'react'
import { Movie, TVShow } from '@/types'
import MovieGrid from './movie-grid'

interface MovieGridIntegratedProps {
  type: 'movie' | 'tv'
  section: 'popular' | 'recent' | 'top-rated' | 'trending' | 'now-playing'
  onPlay: (id: number, type?: 'movie' | 'tv') => void
  onDetails: (id: number, type?: 'movie' | 'tv') => void
  limit?: number
}

export default function MovieGridIntegrated({ 
  type, 
  section, 
  onPlay, 
  onDetails, 
  limit = 10 
}: MovieGridIntegratedProps) {
  const [movies, setMovies] = useState<(Movie | TVShow)[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true)
        setError(null)

        let endpoint = ''
        if (section === 'trending') {
          endpoint = `/api/catalog/top-10`
        } else if (section === 'now-playing') {
          endpoint = `/api/catalog/now-playing`
        } else {
          endpoint = `/api/catalog/${section}/${type}`
        }

        const response = await fetch(endpoint)
        const data = await response.json()

        if (data.success && data.data?.results) {
          const results = data.data.results.slice(0, limit)
          setMovies(results)
        } else {
          setError('Errore nel caricamento dei contenuti')
        }
      } catch (err) {
        console.error('Errore nel fetch dei film:', err)
        setError('Errore di connessione')
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [type, section, limit])

  const handlePlay = (id: number) => {
    onPlay(id, type)
  }

  const handleDetails = (id: number) => {
    onDetails(id, type)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  if (movies.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-500">Nessun contenuto disponibile</p>
      </div>
    )
  }

  return (
    <MovieGrid
      movies={movies}
      type={type}
      onPlay={handlePlay}
      onDetails={handleDetails}
    />
  )
}
