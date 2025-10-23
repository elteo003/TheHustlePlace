import { TMDBMoviesService, TMDBMovie, TMDBTrailer } from './tmdb-movies.service'

class TMDBWrapperService {
    private service: TMDBMoviesService | null = null
    private isInitialized = false

    private initializeService(): void {
        if (!this.isInitialized) {
            try {
                this.service = new TMDBMoviesService()
                this.isInitialized = true
            } catch (error) {
                // Servizio non inizializzato, gestito nei metodi
                this.service = null
                this.isInitialized = true
            }
        }
    }

    private async safeCall<T>(method: () => Promise<T>): Promise<T | null> {
        this.initializeService()

        if (!this.service) {
            return null
        }

        try {
            return await method()
        } catch (error) {
            console.error('Errore TMDB service:', error)
            return null
        }
    }

    async getPopularMovies(page: number = 1) {
        return this.safeCall(() => this.service!.getPopularMovies(page))
    }

    async getTopRatedMovies(page: number = 1) {
        return this.safeCall(() => this.service!.getTopRatedMovies(page))
    }

    async getNowPlayingMovies(page: number = 1) {
        return this.safeCall(() => this.service!.getNowPlayingMovies(page))
    }

    async getUpcomingMovies(page: number = 1) {
        return this.safeCall(() => this.service!.getUpcomingMovies(page))
    }

    async getMovieDetails(movieId: number) {
        return this.safeCall(() => this.service!.getMovieDetails(movieId))
    }

    async getMovieTrailers(movieId: number) {
        return this.safeCall(() => this.service!.getMovieTrailers(movieId))
    }

    async searchMovies(query: string, page: number = 1) {
        return this.safeCall(() => this.service!.searchMovies(query, page))
    }

    async getMovieGenres() {
        return this.safeCall(() => this.service!.getMovieGenres())
    }

    async getTVShowDetails(tvShowId: number) {
        return this.safeCall(() => this.service!.getTVShowDetails(tvShowId))
    }

    async getTopRatedTVShows(limit: number = 10) {
        return this.safeCall(() => this.service!.getTopRatedTVShows(limit))
    }

    async searchTVShows(query: string, page: number = 1) {
        return this.safeCall(() => this.service!.searchTVShows(query, page))
    }

    getImageUrl(path: string | null | undefined, size: 'w200' | 'w300' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500'): string {
        this.initializeService()

        if (!this.service) {
            return '/placeholder-movie.svg'
        }

        return this.service.getImageUrl(path, size)
    }

    async getMainTrailer(movieId: number): Promise<TMDBTrailer | null> {
        return this.safeCall(() => this.service!.getMainTrailer(movieId))
    }

    async getMovieVideos(movieId: number) {
        return this.safeCall(() => this.service!.getMovieVideos(movieId))
    }

    async getTVShowVideos(tvShowId: number) {
        return this.safeCall(() => this.service!.getTVShowVideos(tvShowId))
    }

    getVixSrcUrl(movieId: number): string {
        this.initializeService()

        if (!this.service) {
            return `https://vixsrc.to/movie/${movieId}?primaryColor=B20710&secondaryColor=170000&autoplay=false&lang=it`
        }

        return this.service.getVixSrcUrl(movieId)
    }

    async getTop10Movies(): Promise<TMDBMovie[]> {
        const result = await this.safeCall(() => this.service!.getTop10Movies())
        return result || []
    }

    async getThisWeekMovies(): Promise<TMDBMovie[]> {
        const result = await this.safeCall(() => this.service!.getThisWeekMovies())
        return result || []
    }

    isApiKeyConfigured(): boolean {
        this.initializeService()
        return this.service !== null
    }
}

// Istanza singleton
export const tmdbWrapperService = new TMDBWrapperService()
