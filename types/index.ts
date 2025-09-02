// Tipi comuni per l'applicazione

export interface Movie {
    id: number;
    title: string;
    overview: string;
    poster_path?: string;
    backdrop_path?: string;
    release_date: string;
    vote_average: number;
    vote_count: number;
    genre_ids: number[];
    adult: boolean;
    original_language: string;
    original_title: string;
    popularity: number;
    video: boolean;
    tmdb_id?: number;
}

export interface TVShow {
    id: number;
    name: string;
    overview: string;
    poster_path?: string;
    backdrop_path?: string;
    first_air_date: string;
    vote_average: number;
    vote_count: number;
    genre_ids: number[];
    adult: boolean;
    original_language: string;
    original_name: string;
    popularity: number;
    origin_country: string[];
    tmdb_id?: number;
}

export interface Genre {
    id: number;
    name: string;
}

export interface VideoPlayerProps {
    tmdbId: number;
    type: 'movie' | 'tv';
    season?: number;
    episode?: number;
    primaryColor?: string;
    secondaryColor?: string;
    autoplay?: boolean;
    startAt?: number;
    lang?: string;
    onPlay?: () => void;
    onPause?: () => void;
    onSeeked?: (time: number) => void;
    onEnded?: () => void;
    onTimeUpdate?: (time: number) => void;
}

export interface CatalogFilters {
    genre?: number;
    year?: number;
    language?: string;
    sortBy?: 'popularity' | 'vote_average' | 'release_date' | 'title';
    sortOrder?: 'asc' | 'desc';
    page?: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    results: T[];
    page: number;
    total_pages: number;
    total_results: number;
}

export interface WatchlistItem {
    id: string;
    userId: string;
    tmdbId: number;
    type: 'movie' | 'tv';
    title: string;
    poster?: string;
    addedAt: Date;
}

export interface Favorite {
    id: string;
    userId: string;
    tmdbId: number;
    type: 'movie' | 'tv';
    title: string;
    poster?: string;
    addedAt: Date;
}

export interface WatchHistory {
    id: string;
    userId: string;
    tmdbId: number;
    type: 'movie' | 'tv';
    season?: number;
    episode?: number;
    title: string;
    poster?: string;
    watchedAt: Date;
    duration?: number;
    progress?: number;
}



export interface PlayerEvent {
    type: 'play' | 'pause' | 'seeked' | 'ended' | 'timeupdate';
    data?: any;
}
