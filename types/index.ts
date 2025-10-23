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
    page: number;
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
    type: 'play' | 'pause' | 'seeked' | 'ended' | 'timeupdate' | 'loadeddata' | 'error';
    data?: any;
}

// Tipo unificato per contenuti nella top 10 (film e serie TV)
export interface Top10Content {
    id: number;
    title: string;
    overview: string;
    poster_path?: string;
    backdrop_path?: string;
    release_date: string; // Per film
    first_air_date?: string; // Per serie TV
    vote_average: number;
    vote_count: number;
    genre_ids: number[];
    adult: boolean;
    original_language: string;
    original_title?: string; // Per film
    original_name?: string; // Per serie TV
    popularity: number;
    video?: boolean; // Solo per film
    origin_country?: string[]; // Solo per serie TV
    tmdb_id?: number;
    type: 'movie' | 'tv'; // Campo per distinguere il tipo
}

// Nuovi tipi per le funzionalità Netflix-style
export interface Episode {
    id: number;
    episode_number: number;
    name: string;
    overview: string;
    air_date: string;
    still_path?: string;
    runtime?: number;
    vote_average: number;
    season_number: number;
}

export interface Season {
    id: number;
    season_number: number;
    name: string;
    overview: string;
    air_date: string;
    poster_path?: string;
    episode_count: number;
    episodes: Episode[];
}

export interface TVShowDetails extends TVShow {
    number_of_seasons: number;
    number_of_episodes: number;
    seasons: Season[];
    genres: Genre[];
    created_by?: Array<{
        id: number;
        name: string;
        profile_path?: string;
    }>;
    networks?: Array<{
        id: number;
        name: string;
        logo_path?: string;
    }>;
}

export interface MoviePreviewProps {
    movie: Movie | TVShow;
    type: 'movie' | 'tv';
    onPlay: (id: number) => void;
    onDetails: (id: number) => void;
    isHovered: boolean;
    onHover: (hovered: boolean) => void;
}

export interface SeriesPlayerProps {
    tvShow: TVShowDetails;
    currentSeason: number;
    currentEpisode: number;
    onSeasonChange: (season: number) => void;
    onEpisodeChange: (episode: number) => void;
    onPlay: (season: number, episode: number) => void;
    onAutoplayNext: (season: number, episode: number) => void;
}