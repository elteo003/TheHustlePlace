'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { TMDBMovie } from '@/lib/tmdb'
import { useMoviesWithTrailers } from '@/hooks/useMoviesWithTrailers'

interface MovieContextType {
    movies: TMDBMovie[]
    currentIndex: number
    setCurrentIndex: (index: number) => void
    loading: boolean
    error: string | null
    changeToNextMovie: () => void
    changeToMovie: (index: number) => void
    featuredMovie: TMDBMovie | null
}

const MovieContext = createContext<MovieContextType | undefined>(undefined)

interface MovieProviderProps {
    children: ReactNode
}

export const MovieProvider: React.FC<MovieProviderProps> = ({ children }) => {
    const {
        movies,
        currentIndex,
        setCurrentIndex,
        loading,
        error,
        changeToNextMovie,
        changeToMovie
    } = useMoviesWithTrailers()

    const featuredMovie = movies[currentIndex] || null

    const value: MovieContextType = {
        movies,
        currentIndex,
        setCurrentIndex,
        loading,
        error,
        changeToNextMovie,
        changeToMovie,
        featuredMovie
    }

    return (
        <MovieContext.Provider value={value}>
            {children}
        </MovieContext.Provider>
    )
}

export const useMovieContext = (): MovieContextType => {
    const context = useContext(MovieContext)
    if (context === undefined) {
        throw new Error('useMovieContext must be used within a MovieProvider')
    }
    return context
}
