import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

export function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

export function formatVoteAverage(vote: number | undefined | null): string {
    if (vote === undefined || vote === null || isNaN(vote)) {
        return 'N/A'
    }
    return vote.toFixed(1)
}

export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
}

export function getImageUrl(path: string | null | undefined, size: 'w200' | 'w300' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500'): string {
    if (!path) return '/placeholder-movie.svg'

    // Prova prima con TMDB, se non funziona usa placeholder
    try {
        return `https://image.tmdb.org/t/p/${size}${path}`
    } catch (error) {
        return '/placeholder-movie.svg'
    }
}

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}

export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args)
            inThrottle = true
            setTimeout(() => (inThrottle = false), limit)
        }
    }
}

// Funzioni per il filtro intelligente del catalogo
export interface MovieAvailability {
    isAvailable: boolean
    badge?: string
    reason?: string
}

// Cache per le verifiche di disponibilità
const availabilityCache = new Map<string, { result: MovieAvailability, timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minuti

export function checkMovieAvailability(movie: any): MovieAvailability {
    const releaseDate = new Date(movie.releaseDate || movie.firstAirDate || movie.release_date)
    const today = new Date()
    const threeMonthsAgo = new Date(today.getTime() - (90 * 24 * 60 * 60 * 1000))
    
    // Se il film è uscito da meno di 3 mesi, è molto probabilmente "Al Cinema"
    if (releaseDate > threeMonthsAgo) {
        return {
            isAvailable: false,
            badge: "Al Cinema",
            reason: "Film recente, non ancora disponibile per streaming"
        }
    }
    
    // Per film più vecchi, assumiamo che siano disponibili
    // Il controllo reale viene fatto nel player
    return {
        isAvailable: true,
        badge: "Disponibile",
        reason: "Film disponibile per streaming"
    }
}

// Funzione per verificare disponibilità reale su VixSrc
export async function checkRealAvailability(tmdbId: number, type: 'movie' | 'tv'): Promise<MovieAvailability> {
    const cacheKey = `${type}-${tmdbId}`
    const cached = availabilityCache.get(cacheKey)
    
    // Controlla se abbiamo una cache valida
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.result
    }
    
    try {
        const response = await fetch(`/api/player/check-availability?tmdbId=${tmdbId}&type=${type}`)
        const data = await response.json()
        
        const result: MovieAvailability = {
            isAvailable: data.success && data.data?.isAvailable,
            badge: data.success && data.data?.isAvailable ? "Disponibile" : "Non Disponibile",
            reason: data.success && data.data?.isAvailable 
                ? "Verificato disponibile su VixSrc" 
                : "Non disponibile su VixSrc"
        }
        
        // Salva in cache
        availabilityCache.set(cacheKey, { result, timestamp: Date.now() })
        
        return result
    } catch (error) {
        // In caso di errore, usa il sistema basato sulla data
        return checkMovieAvailability({ tmdbId, releaseDate: new Date() })
    }
}

export function filterAvailableMovies(movies: any[]): any[] {
    return movies.filter(movie => {
        const availability = checkMovieAvailability(movie)
        return availability.isAvailable
    })
}

export function getAvailabilityBadge(movie: any): string {
    const availability = checkMovieAvailability(movie)
    return availability.badge || "Disponibile"
}

export function getAvailabilityColor(badge: string): string {
    switch (badge) {
        case "Al Cinema":
            return "bg-yellow-500 text-yellow-900"
        case "Prossimamente":
            return "bg-blue-500 text-blue-900"
        case "Disponibile":
            return "bg-green-500 text-green-900"
        case "Non Disponibile":
            return "bg-red-500 text-red-900"
        default:
            return "bg-gray-500 text-gray-900"
    }
}
