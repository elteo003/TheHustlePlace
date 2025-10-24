'use client'

import { useState, useEffect, useCallback } from 'react'
import { TMDBMovie } from '@/lib/tmdb'

interface UseMoviesWithTrailersReturn {
    movies: TMDBMovie[]
    currentIndex: number
    setCurrentIndex: (index: number) => void
    loading: boolean
    error: string | null
    changeToNextMovie: () => void
    changeToMovie: (index: number) => void
}

export const useMoviesWithTrailers = (): UseMoviesWithTrailersReturn => {
    const [movies, setMovies] = useState<TMDBMovie[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadMovies = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            
            console.log('🎬 Caricamento film con trailer...')
            const response = await fetch('/api/catalog/popular/movies-with-trailers')
            const data = await response.json()
            
            if (data.success && data.data?.length > 0) {
                console.log(`📊 Ricevuti ${data.data.length} film con trailer dall'API`)
                
                // Verifica che il primo film abbia effettivamente un trailer
                const firstMovie = data.data[0]
                console.log(`🔍 Verifico trailer per: ${firstMovie.title}`)
                
                const trailerResponse = await fetch(`/api/tmdb/movies/${firstMovie.id}/videos`)
                const trailerData = await trailerResponse.json()
                
                if (trailerData.success && trailerData.data?.results?.length > 0) {
                    // Verifica che ci sia un trailer YouTube ufficiale
                    const hasYouTubeTrailer = trailerData.data.results.some((video: any) => 
                        video.site === 'YouTube' && 
                        (video.type === 'Trailer' || video.type === 'Teaser') &&
                        video.official === true
                    )
                    
                    if (hasYouTubeTrailer) {
                        console.log(`✅ ${firstMovie.title} ha trailer YouTube ufficiale`)
                        setMovies(data.data)
                        setCurrentIndex(0)
                    } else {
                        console.log(`⚠️ ${firstMovie.title} non ha trailer YouTube ufficiale, cerco il prossimo...`)
                        await loadNextMovieWithTrailer(data.data, 1)
                    }
                } else {
                    console.log(`⚠️ ${firstMovie.title} non ha video disponibili, cerco il prossimo...`)
                    await loadNextMovieWithTrailer(data.data, 1)
                }
            } else {
                throw new Error('Nessun film con trailer disponibile')
            }
        } catch (err) {
            console.error('❌ Errore caricamento film:', err)
            setError(err instanceof Error ? err.message : 'Errore sconosciuto')
            
            // Fallback con film hardcoded solo se API completamente fallisce
            const fallbackMovies: TMDBMovie[] = [
                {
                    id: 157336,
                    title: 'Interstellar',
                    original_title: 'Interstellar',
                    overview: 'In seguito alla scoperta di un cunicolo spazio-temporale, un gruppo di esploratori si avventura in una eroica missione per tentare di superare i limiti della conquista spaziale.',
                    poster_path: '/bMKiLh0mES4Uiococ240lbbTGXQ.jpg',
                    backdrop_path: '/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg',
                    release_date: '2014-11-05',
                    vote_average: 8.46,
                    vote_count: 37772,
                    popularity: 46.5648,
                    adult: false,
                    video: false,
                    genre_ids: [18, 878],
                    original_language: 'en'
                }
            ]
            setMovies(fallbackMovies)
            setCurrentIndex(0)
        } finally {
            setLoading(false)
        }
    }, [])

    // Funzione per cercare il prossimo film con trailer
    const loadNextMovieWithTrailer = useCallback(async (movies: TMDBMovie[], startIndex: number) => {
        for (let i = startIndex; i < Math.min(movies.length, startIndex + 5); i++) {
            const movie = movies[i]
            console.log(`🔍 Verifico trailer per: ${movie.title} (${i + 1}/${movies.length})`)
            
            try {
                const trailerResponse = await fetch(`/api/tmdb/movies/${movie.id}/videos`)
                const trailerData = await trailerResponse.json()
                
                if (trailerData.success && trailerData.data?.results?.length > 0) {
                    const hasYouTubeTrailer = trailerData.data.results.some((video: any) => 
                        video.site === 'YouTube' && 
                        (video.type === 'Trailer' || video.type === 'Teaser') &&
                        video.official === true
                    )
                    
                    if (hasYouTubeTrailer) {
                        console.log(`✅ ${movie.title} ha trailer YouTube ufficiale - IMPOSTATO COME FEATURED`)
                        setMovies(movies)
                        setCurrentIndex(i)
                        return
                    } else {
                        console.log(`⚠️ ${movie.title} non ha trailer YouTube ufficiale`)
                    }
                } else {
                    console.log(`⚠️ ${movie.title} non ha video disponibili`)
                }
            } catch (error) {
                console.log(`❌ Errore verifica trailer per ${movie.title}:`, error)
            }
        }
        
        // Se nessun film ha trailer, usa il primo disponibile
        console.log(`⚠️ Nessun film con trailer trovato, uso il primo disponibile`)
        setMovies(movies)
        setCurrentIndex(0)
    }, [])

    const changeToNextMovie = useCallback(() => {
        if (movies.length === 0) return

        const nextIndex = (currentIndex + 1) % movies.length
        setCurrentIndex(nextIndex)
        console.log(`🔄 Cambiato a film ${nextIndex}: ${movies[nextIndex]?.title}`)
    }, [movies, currentIndex])

    const changeToMovie = useCallback((index: number) => {
        if (movies.length === 0 || index < 0 || index >= movies.length) {
            console.warn(`⚠️ Indice ${index} non valido per ${movies.length} film`)
            return
        }

        setCurrentIndex(index)
        console.log(`🔄 Cambiato a film ${index}: ${movies[index]?.title}`)
    }, [movies])

    useEffect(() => {
        loadMovies()
    }, [loadMovies])

    return {
        movies,
        currentIndex,
        setCurrentIndex,
        loading,
        error,
        changeToNextMovie,
        changeToMovie
    }
}
