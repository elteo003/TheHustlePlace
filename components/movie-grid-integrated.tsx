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
        } else if (section === 'popular') {
          endpoint = type === 'movie' ? `/api/catalog/popular/movies` : `/api/catalog/popular/tv`
        } else if (section === 'recent') {
          endpoint = type === 'movie' ? `/api/catalog/latest/movies` : `/api/catalog/latest/tv`
        } else if (section === 'top-rated') {
          endpoint = type === 'movie' ? `/api/catalog/top-rated/movies` : `/api/catalog/top-rated/tv`
        } else {
          endpoint = `/api/catalog/${section}/${type}`
        }

        const response = await fetch(endpoint)
        const data = await response.json()

        if (data.success) {
          // Gestisce diversi formati di risposta
          let results = []
          if (data.data?.results) {
            results = data.data.results
          } else if (Array.isArray(data.data)) {
            results = data.data
          } else if (data.data) {
            results = [data.data]
          }
          
          if (results.length > 0) {
            setMovies(results.slice(0, limit))
          } else {
            setError('Nessun contenuto disponibile')
          }
        } else {
          setError(data.error || 'Errore nel caricamento dei contenuti')
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
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Riprova
        </button>
      </div>
    )
  }

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-gray-500 mb-4">Nessun contenuto disponibile</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Riprova
        </button>
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
