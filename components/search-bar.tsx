'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { Movie, TVShow } from '@/types'

interface SearchResult {
    id: number
    title: string
    type: 'movie' | 'tv'
    poster_path: string
    release_date?: string
    first_air_date?: string
}

export function SearchBar() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Chiudi dropdown quando clicchi fuori
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Ricerca con debounce
    useEffect(() => {
        if (query.length < 2) {
            setResults([])
            setIsOpen(false)
            return
        }

        const timeoutId = setTimeout(async () => {
            await searchContent(query)
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [query])

    const searchContent = async (searchQuery: string) => {
        setIsLoading(true)
        try {
            // Cerca sia film che serie TV
            const [moviesRes, tvRes] = await Promise.all([
                fetch(`/api/catalog/search/movies?query=${encodeURIComponent(searchQuery)}`),
                fetch(`/api/catalog/search/tv?query=${encodeURIComponent(searchQuery)}`)
            ])

            const moviesData = await moviesRes.json()
            const tvData = await tvRes.json()

            const searchResults: SearchResult[] = []

            // Aggiungi film
            if (moviesData.success && moviesData.data?.results) {
                moviesData.data.results.slice(0, 5).forEach((movie: Movie) => {
                    searchResults.push({
                        id: movie.id,
                        title: movie.title,
                        type: 'movie',
                        poster_path: movie.poster_path || '/placeholder-movie.svg',
                        release_date: movie.release_date
                    })
                })
            }

            // Aggiungi serie TV
            if (tvData.success && tvData.data?.results) {
                tvData.data.results.slice(0, 5).forEach((tv: TVShow) => {
                    searchResults.push({
                        id: tv.id,
                        title: tv.name,
                        type: 'tv',
                        poster_path: tv.poster_path || '/placeholder-movie.svg',
                        first_air_date: tv.first_air_date
                    })
                })
            }

            setResults(searchResults)
            setIsOpen(searchResults.length > 0)
        } catch (error) {
            console.error('Errore nella ricerca:', error)
            setResults([])
            setIsOpen(false)
        } finally {
            setIsLoading(false)
        }
    }

    const handleResultClick = (result: SearchResult) => {
        const url = result.type === 'movie' 
            ? `/player/movie/${result.id}` 
            : `/player/tv/${result.id}`
        
        window.location.href = url
        setIsOpen(false)
        setQuery('')
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && query.trim()) {
            // Naviga alla pagina di risultati di ricerca
            window.location.href = `/search?q=${encodeURIComponent(query.trim())}`
            setIsOpen(false)
        }
    }

    const clearSearch = () => {
        setQuery('')
        setResults([])
        setIsOpen(false)
        inputRef.current?.focus()
    }

    return (
        <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
            {/* Barra di ricerca */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
                    onKeyPress={handleKeyPress}
                    placeholder="Cerca film e serie TV..."
                    className="w-full pl-12 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {query && (
                    <button
                        onClick={clearSearch}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    >
                        <X className="h-5 w-5 text-gray-400 hover:text-white" />
                    </button>
                )}
            </div>

            {/* Dropdown risultati */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-gray-400">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            Ricerca in corso...
                        </div>
                    ) : results.length > 0 ? (
                        <div className="py-2">
                            {results.map((result) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleResultClick(result)}
                                    className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-800 transition-colors"
                                >
                                    <div className="flex-shrink-0 w-12 h-16 bg-gray-700 rounded overflow-hidden">
                                        {result.poster_path && result.poster_path !== '/placeholder-movie.svg' ? (
                                            <img
                                                src={result.poster_path}
                                                alt={result.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="text-white font-medium">{result.title}</div>
                                        <div className="text-sm text-gray-400">
                                            {result.type === 'movie' ? 'Film' : 'Serie TV'}
                                            {result.release_date && ` • ${new Date(result.release_date).getFullYear()}`}
                                            {result.first_air_date && ` • ${new Date(result.first_air_date).getFullYear()}`}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : query.length >= 2 ? (
                        <div className="p-4 text-center text-gray-400">
                            Nessun risultato trovato per "{query}"
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    )
}
