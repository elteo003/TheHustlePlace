# API Film e Serie TV - Documentazione Tecnica

## Indice
1. [Panoramica del Sistema](#panoramica-del-sistema)
2. [Architettura delle API](#architettura-delle-api)
3. [Diagrammi ER](#diagrammi-er)
4. [Class Diagram](#class-diagram)
5. [Flowchart delle API](#flowchart-delle-api)
6. [Sequence Diagram](#sequence-diagram)
7. [API Endpoints](#api-endpoints)
8. [Gestione degli Errori](#gestione-degli-errori)
9. [Configurazione](#configurazione)

## Panoramica del Sistema

Il sistema di gestione film e serie TV di TheHustlePlace è basato su un'architettura Next.js con integrazione di multiple API esterne:

- **TMDB (The Movie Database)**: Per metadati e informazioni sui contenuti
- **VixSrc**: Per lo streaming dei contenuti
- **Redis**: Per la cache (opzionale)
- **Next.js API Routes**: Per l'astrazione e la gestione delle chiamate

## Architettura delle API

```mermaid
graph TB
    subgraph "Frontend"
        A[Componenti React]
        B[Pagine Next.js]
    end
    
    subgraph "API Layer"
        C[Next.js API Routes]
        D[Controllers]
        E[Services]
    end
    
    subgraph "External APIs"
        F[TMDB API]
        G[VixSrc API]
    end
    
    subgraph "Cache Layer"
        H[Redis Cache]
        I[In-Memory Cache]
    end
    
    A --> C
    B --> C
    C --> D
    D --> E
    E --> F
    E --> G
    E --> H
    E --> I
```

## Diagrammi ER

### Entità Principali

```mermaid
erDiagram
    MOVIE {
        int id PK
        int tmdb_id UK
        string title
        text overview
        string poster_path
        string backdrop_path
        date release_date
        float vote_average
        int vote_count
        array genre_ids
        boolean adult
        string original_language
        string original_title
        float popularity
        boolean video
    }
    
    TVSHOW {
        int id PK
        int tmdb_id UK
        string name
        text overview
        string poster_path
        string backdrop_path
        date first_air_date
        float vote_average
        int vote_count
        array genre_ids
        boolean adult
        string original_language
        string original_name
        float popularity
        array origin_country
        int number_of_seasons
        int number_of_episodes
    }
    
    GENRE {
        int id PK
        string name
        string type
    }
    
    VIDEO_SOURCE {
        int id PK
        string url
        string quality
        string type
        int tmdb_id FK
        int season
        int episode
    }
    
    CACHE_ENTRY {
        string key PK
        text value
        datetime expires_at
        string type
    }
    
    MOVIE ||--o{ VIDEO_SOURCE : "has"
    TVSHOW ||--o{ VIDEO_SOURCE : "has"
    MOVIE }o--o{ GENRE : "belongs_to"
    TVSHOW }o--o{ GENRE : "belongs_to"
```

## Class Diagram

### Struttura delle Classi Principali

```mermaid
classDiagram
    class CatalogService {
        -VIXSRC_BASE_URL: string
        -CACHE_TTL: number
        -vixsrcScraper: VixsrcScraperService
        +getMovies(filters): PaginatedResponse~Movie~
        +getTVShows(filters): PaginatedResponse~TVShow~
        +getPopularMovies(): Movie[]
        +getTop10Movies(): Movie[]
        +searchMovies(query, page): PaginatedResponse~Movie~
        +searchTVShows(query, page): PaginatedResponse~TVShow~
        -convertTMDBMovieToMovie(tmdbMovie): Movie
        -convertTMDBTVShowToTVShow(tmdbTVShow): TVShow
    }
    
    class VideoPlayerService {
        -VIXSRC_BASE_URL: string
        +checkMovieAvailability(tmdbId): boolean
        +getMovieVideoSource(tmdbId): VideoSource
        +checkTVShowAvailability(tmdbId, season, episode): boolean
        +getTVShowVideoSource(tmdbId, season, episode): VideoSource
        +getPlayerUrl(tmdbId, type, season?, episode?): string
        +validatePlayerUrl(url): boolean
    }
    
    class TMDBMoviesService {
        -TMDB_BASE_URL: string
        -TMDB_API_KEY: string
        +getMovieDetails(tmdbId): Movie
        +getTVShowDetails(tvShowId): TVShow
        +searchMovies(query, page): SearchResponse
        +searchTVShows(query, page): SearchResponse
        +getPopularMovies(): Movie[]
        +getTopRatedMovies(limit): Movie[]
        -makeRequest(endpoint): any
    }
    
    class CatalogController {
        -catalogService: CatalogService
        +getMovies(request): NextResponse
        +getTVShows(request): NextResponse
        +getPopularMovies(request): NextResponse
        +searchMovies(request): NextResponse
        +searchTVShows(request): NextResponse
    }
    
    class PlayerController {
        -playerService: PlayerService
        +getMovieEmbed(request): NextResponse
        +getTVShowEmbed(request): NextResponse
        +generatePlayerUrl(request): NextResponse
    }
    
    class Movie {
        +id: number
        +tmdb_id: number
        +title: string
        +overview: string
        +poster_path: string
        +backdrop_path: string
        +release_date: string
        +vote_average: number
        +genre_ids: number[]
    }
    
    class TVShow {
        +id: number
        +tmdb_id: number
        +name: string
        +overview: string
        +first_air_date: string
        +number_of_seasons: number
        +number_of_episodes: number
    }
    
    class VideoSource {
        +url: string
        +quality: string
        +type: string
        +tmdbId: number
        +season?: number
        +episode?: number
    }
    
    CatalogService --> TMDBMoviesService : uses
    CatalogService --> VixsrcScraperService : uses
    VideoPlayerService --> TMDBMoviesService : uses
    CatalogController --> CatalogService : uses
    PlayerController --> VideoPlayerService : uses
    CatalogService --> Movie : creates
    CatalogService --> TVShow : creates
    VideoPlayerService --> VideoSource : creates
```

## Flowchart delle API

### Flusso di Ricerca e Riproduzione Film

```mermaid
flowchart TD
    A[Utente clicca su film] --> B{ID disponibile?}
    B -->|Sì| C[Usa tmdb_id]
    B -->|No| D[Usa id]
    C --> E[Naviga a /player/movie/{id}]
    D --> E
    
    E --> F[Carica dettagli da TMDB API]
    F --> G{TMDB risponde?}
    G -->|Sì| H[Mostra dettagli film]
    G -->|No| I[Usa dati fallback]
    
    H --> J[Controlla disponibilità VixSrc]
    I --> J
    J --> K{Disponibile su VixSrc?}
    K -->|Sì| L[Carica iframe player]
    K -->|No| M[Mostra errore con ID]
    
    L --> N[Player pronto]
    M --> O[Opzioni alternative]
```

### Flusso di Gestione Cache

```mermaid
flowchart TD
    A[Richiesta API] --> B{Cache hit?}
    B -->|Sì| C[Restituisci dati cached]
    B -->|No| D[Chiama API esterna]
    
    D --> E{API risponde?}
    E -->|Sì| F[Processa dati]
    E -->|No| G[Usa dati mock]
    
    F --> H[Salva in cache]
    G --> H
    H --> I[Restituisci dati]
    C --> I
```

## Sequence Diagram

### Sequenza di Caricamento Film

```mermaid
sequenceDiagram
    participant U as Utente
    participant C as Componente
    participant API as API Route
    participant CS as CatalogService
    participant TMDB as TMDB API
    participant VS as VixSrc
    participant P as Player
    
    U->>C: Clicca su film
    C->>C: Determina ID (tmdb_id || id)
    C->>API: GET /player/movie/{id}
    API->>TMDB: GET /movie/{id}
    TMDB-->>API: Dettagli film
    API->>P: Carica player
    P->>VS: Controlla disponibilità
    VS-->>P: Disponibile/Non disponibile
    P->>U: Mostra player o errore
```

### Sequenza di Ricerca Contenuti

```mermaid
sequenceDiagram
    participant U as Utente
    participant S as SearchBar
    participant API as Search API
    participant CS as CatalogService
    participant TMDB as TMDB API
    participant C as Cache
    
    U->>S: Inserisce query
    S->>API: GET /search?q={query}
    API->>C: Controlla cache
    C-->>API: Cache miss
    API->>CS: searchMovies(query)
    CS->>TMDB: search/movie?query={query}
    TMDB-->>CS: Risultati ricerca
    CS->>C: Salva in cache
    CS-->>API: Risultati processati
    API-->>S: JSON response
    S->>U: Mostra risultati
```

## API Endpoints

### Catalogo Film

| Endpoint | Metodo | Descrizione | Parametri |
|----------|--------|-------------|-----------|
| `/api/catalog/movies` | GET | Lista film con filtri | `genre`, `year`, `language`, `sortBy`, `page` |
| `/api/catalog/popular/movies` | GET | Film popolari | `page` |
| `/api/catalog/latest/movies` | GET | Ultimi film | `page` |
| `/api/catalog/top-rated/movies` | GET | Film meglio valutati | `page` |
| `/api/catalog/now-playing` | GET | Film al cinema | - |
| `/api/catalog/top-10` | GET | Top 10 mista | - |

### Catalogo Serie TV

| Endpoint | Metodo | Descrizione | Parametri |
|----------|--------|-------------|-----------|
| `/api/catalog/tv` | GET | Lista serie TV | `genre`, `year`, `language`, `sortBy`, `page` |
| `/api/catalog/popular/tv` | GET | Serie TV popolari | `page` |
| `/api/catalog/latest/tv` | GET | Ultime serie TV | `page` |
| `/api/catalog/top-rated/tv` | GET | Serie TV meglio valutate | `page` |

### Ricerca

| Endpoint | Metodo | Descrizione | Parametri |
|----------|--------|-------------|-----------|
| `/api/catalog/search/movies` | GET | Ricerca film | `query`, `page` |
| `/api/catalog/search/tv` | GET | Ricerca serie TV | `query`, `page` |

### Player

| Endpoint | Metodo | Descrizione | Parametri |
|----------|--------|-------------|-----------|
| `/api/player/movie/{id}` | GET | Video source film | `id` (TMDB ID) |
| `/api/player/tv/{id}` | GET | Video source serie TV | `id`, `season`, `episode` |
| `/api/player/check-availability` | GET | Controlla disponibilità | `tmdbId`, `type` |

### TMDB

| Endpoint | Metodo | Descrizione | Parametri |
|----------|--------|-------------|-----------|
| `/api/tmdb/movies/{id}` | GET | Dettagli film TMDB | `id` |
| `/api/tmdb/tv/{id}` | GET | Dettagli serie TV TMDB | `id` |

## Gestione degli Errori

### Codici di Errore

| Codice | Messaggio | Descrizione |
|--------|-----------|-------------|
| 400 | ID non valido | L'ID fornito non è un numero valido |
| 404 | Contenuto non trovato | Il film/serie TV non esiste su TMDB |
| 500 | Errore interno | Errore del server o API esterna |

### Fallback Strategy

```mermaid
flowchart TD
    A[Richiesta API] --> B{TMDB disponibile?}
    B -->|Sì| C[Usa dati TMDB]
    B -->|No| D[Usa dati mock]
    
    C --> E{VixSrc disponibile?}
    E -->|Sì| F[Mostra player]
    E -->|No| G[Mostra errore con link diretto]
    
    D --> H[Mostra dati limitati]
    G --> I[Opzioni alternative]
```

## Configurazione

### Variabili d'Ambiente

```env
# TMDB Configuration
TMDB_API_KEY=your_tmdb_api_key_here

# VixSrc Configuration  
VIXSRC_BASE_URL=https://vixsrc.to

# Cache Configuration
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Rate Limiting

- **TMDB API**: 40 richieste ogni 10 secondi
- **VixSrc**: 100 richieste ogni minuto
- **Cache**: 1000 richieste ogni secondo

### Cache Strategy

```mermaid
graph LR
    A[Richiesta] --> B{Cache hit?}
    B -->|Sì| C[Restituisci cached]
    B -->|No| D[Chiama API]
    D --> E[Salva in cache]
    E --> F[Restituisci dati]
    C --> F
```

## Monitoraggio e Logging

### Metriche Chiave

- **Tempo di risposta API**: < 500ms per cache hit, < 2s per API call
- **Tasso di successo**: > 95% per richieste valide
- **Utilizzo cache**: > 80% hit rate

### Log Levels

- **INFO**: Operazioni normali (caricamento film, cache hit)
- **WARN**: Situazioni anomale (API timeout, dati mancanti)
- **ERROR**: Errori critici (API down, configurazione errata)

## Conclusioni

Il sistema API per film e serie TV di TheHustlePlace è progettato per essere:

- **Scalabile**: Architettura modulare con cache intelligente
- **Resiliente**: Fallback multipli e gestione errori robusta
- **Performante**: Cache Redis e ottimizzazioni Next.js
- **Manutenibile**: Separazione delle responsabilità e logging dettagliato

La documentazione completa con diagrammi Mermaid fornisce una visione chiara dell'architettura e del flusso dei dati, facilitando la manutenzione e l'estensione del sistema.
