# Services Directory

## 📋 Panoramica

Questa directory contiene tutti i servizi di integrazione con API esterne e servizi di terze parti utilizzati dalla piattaforma di streaming TheHustlePlace. I servizi sono progettati per essere modulari, riutilizzabili e robusti.

## 📁 Struttura

```
services/
├── README.md                     # Questa documentazione
├── catalog.service.ts            # Servizio catalogo principale
├── tmdb.service.ts               # Servizio TMDB base
├── tmdb-movies.service.ts        # Servizio TMDB per film
├── tmdb-wrapper.service.ts       # Wrapper TMDB con gestione errori
├── video-player.service.ts       # Servizio video player
├── vixsrc-scraper.service.ts     # Servizio scraping VixSrc
└── player.service.ts             # Servizio player (deprecato)
```

## 🔧 Servizi Disponibili

### 1. TMDB Movies Service (`tmdb-movies.service.ts`)

**Scopo**: Integrazione completa con The Movie Database API per film e serie TV

**Funzionalità**:
- Recupero film popolari, top-rated, now-playing, upcoming
- Dettagli completi film con runtime e generi
- Ricerca film e serie TV
- Recupero trailer e video
- Gestione errori robusta con fallback
- Cache intelligente per performance

**Utilizzo**:
```typescript
import { TMDBMoviesService } from '@/services/tmdb-movies.service'

const tmdbService = new TMDBMoviesService()
const movies = await tmdbService.getPopularMovies(1)
const movieDetails = await tmdbService.getMovieDetails(12345)
const trailers = await tmdbService.getMovieTrailers(12345)
```

**Configurazione**:
```env
TMDB_API_KEY=your-tmdb-api-key
NEXT_PUBLIC_TMDB_API_KEY=your-tmdb-api-key
```

### 2. TMDB Wrapper Service (`tmdb-wrapper.service.ts`)

**Scopo**: Wrapper singleton per TMDBMoviesService con gestione errori avanzata

**Funzionalità**:
- Singleton pattern per istanza unica
- Gestione errori centralizzata
- Fallback automatici
- Logging dettagliato
- Metodi di convenienza

**Utilizzo**:
```typescript
import { tmdbWrapperService } from '@/services/tmdb-wrapper.service'

const movies = await tmdbWrapperService.getPopularMovies(1)
const top10 = await tmdbWrapperService.getTop10Movies()
const upcoming = await tmdbWrapperService.getUpcomingMovies(1)
```

### 3. Video Player Service (`video-player.service.ts`)

**Scopo**: Gestione del player video e integrazione con VixSrc

**Funzionalità**:
- Controllo disponibilità contenuti su VixSrc
- Generazione URL player personalizzati
- Gestione parametri player (colori, lingua, autoplay)
- Fallback per contenuti non disponibili
- Timeout management

**Utilizzo**:
```typescript
import { VideoPlayerService } from '@/services/video-player.service'

const playerService = new VideoPlayerService()
const isAvailable = await playerService.checkMovieAvailability(12345)
const videoSource = await playerService.getMovieVideoSource(12345)
```

**Configurazione**:
```env
VIXSRC_BASE_URL=https://vixsrc.to
VIXSRC_PRIMARY_COLOR=B20710
VIXSRC_SECONDARY_COLOR=170000
VIXSRC_AUTOPLAY=false
VIXSRC_LANG=it
```

### 4. VixSrc Scraper Service (`vixsrc-scraper.service.ts`)

**Scopo**: Scraping e parsing di dati da VixSrc

**Funzionalità**:
- Scraping HTML da VixSrc
- Parsing metadati film e serie TV
- Estrazione titoli, overview, poster
- Gestione errori di scraping
- User-Agent personalizzato

**Utilizzo**:
```typescript
import { VixsrcScraperService } from '@/services/vixsrc-scraper.service'

const scraper = new VixsrcScraperService()
const movieDetails = await scraper.getMovieDetails(12345)
const tvDetails = await scraper.getTVShowDetails(12345, 1, 1)
```

### 5. Catalog Service (`catalog.service.ts`)

**Scopo**: Gestione del catalogo di contenuti aggregato

**Funzionalità**:
- Aggregazione dati da multiple fonti
- Filtri e ricerca avanzata
- Paginazione intelligente
- Cache Redis per performance
- Gestione generi e categorie

**Utilizzo**:
```typescript
import { CatalogService } from '@/services/catalog.service'

const catalogService = new CatalogService()
const popularMovies = await catalogService.getPopularMovies()
const searchResults = await catalogService.searchMovies('query')
```

## 🏗️ Architettura

### Pattern di Design

Tutti i servizi seguono pattern comuni:

1. **Singleton Pattern**: Istanza unica per servizio
2. **Factory Pattern**: Creazione client HTTP
3. **Cache Pattern**: Redis per performance
4. **Error Handling**: Fallback graceful
5. **Logging**: Monitoraggio completo
6. **TypeScript**: Tipizzazione forte

### Struttura Standard

```typescript
class ServiceName {
    private readonly apiKey: string
    private readonly baseUrl: string
    private readonly timeout: number

    constructor() {
        // Inizializzazione con fallback
        this.apiKey = process.env.API_KEY || 
                     process.env.NEXT_PUBLIC_API_KEY || 
                     'fallback-key'
    }

    private checkApiKey(): void {
        if (!this.apiKey) {
            throw new Error('API key non configurata')
        }
    }

    private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
        this.checkApiKey()
        // Implementazione richiesta
    }

    async getData(): Promise<DataType[]> {
        try {
            // Business logic
        } catch (error) {
            console.error('Errore servizio:', error)
            return []
        }
    }
}
```

## 🔧 Configurazione

### Variabili d'Ambiente

```env
# TMDB API (Obbligatorio)
TMDB_API_KEY=your_tmdb_api_key
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key

# VixSrc Configuration
VIXSRC_BASE_URL=https://vixsrc.to
VIXSRC_PRIMARY_COLOR=B20710
VIXSRC_SECONDARY_COLOR=170000
VIXSRC_AUTOPLAY=false
VIXSRC_LANG=it

# Redis (Opzionale)
REDIS_URL=redis://localhost:6379

# Environment
NODE_ENV=development
```

### Dipendenze

```json
{
    "dependencies": {
        "axios": "^1.6.0",
        "redis": "^4.6.0"
    },
    "devDependencies": {
        "@types/redis": "^4.0.0"
    }
}
```

## 🚀 Utilizzo

### Importazione

```typescript
// Import singolo
import { TMDBMoviesService } from '@/services/tmdb-movies.service'

// Import wrapper
import { tmdbWrapperService } from '@/services/tmdb-wrapper.service'

// Import video player
import { VideoPlayerService } from '@/services/video-player.service'
```

### Utilizzo in API Routes

```typescript
// app/api/tmdb/movies/route.ts
import { tmdbWrapperService } from '@/services/tmdb-wrapper.service'

export async function GET(request: NextRequest) {
    try {
        const movies = await tmdbWrapperService.getPopularMovies(1)
        return NextResponse.json({ success: true, data: movies })
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message })
    }
}
```

### Utilizzo in Componenti

```typescript
// components/movie-list.tsx
import { useEffect, useState } from 'react'

export function MovieList() {
    const [movies, setMovies] = useState([])

    useEffect(() => {
        fetch('/api/tmdb/movies?type=popular')
            .then(res => res.json())
            .then(data => setMovies(data.data))
    }, [])

    return (
        <div>
            {movies.map(movie => (
                <div key={movie.id}>
                    <h3>{movie.title}</h3>
                    <p>{movie.overview}</p>
                </div>
            ))}
        </div>
    )
}
```

## 🗄️ Cache Strategy

### Cache In-Memory

Per default, i servizi utilizzano cache in-memory:

```typescript
// Cache keys standardizzate
'service:endpoint:params'  // Formato chiave
'ttl:3600'                // TTL in secondi
```

### Cache Keys

```typescript
// TMDB
'tmdb:popular:movies:1'
'tmdb:movie:12345'
'tmdb:trailers:12345'

// VixSrc
'vixsrc:movie:12345'
'vixsrc:availability:12345'

// Catalog
'catalog:top10:movies'
'catalog:upcoming:movies'
```

### Redis Cache (Opzionale)

```typescript
// utils/redis-cache.ts
import { Redis } from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export const cache = {
    async get<T>(key: string): Promise<T | null> {
        const data = await redis.get(key)
        return data ? JSON.parse(data) : null
    },
    
    async set<T>(key: string, data: T, ttl: number = 3600): Promise<void> {
        await redis.setex(key, ttl, JSON.stringify(data))
    }
}
```

## 🚨 Error Handling

### Strategia Standard

1. **API Key Check**: Verifica chiavi API
2. **Timeout Management**: 10 secondi per evitare blocchi
3. **Retry Logic**: Tentativi automatici per errori temporanei
4. **Graceful Degradation**: Restituisce array vuoto
5. **Logging**: Registra errori per debugging

### Esempio

```typescript
async getData(): Promise<DataType[]> {
    try {
        this.checkApiKey()
        
        const response = await this.makeRequest<ApiResponse>(endpoint)
        return this.formatData(response.results)
        
    } catch (error) {
        console.error('Errore servizio:', error)
        
        // Fallback graceful
        return []
    }
}
```

## 📊 Monitoring

### Logging

Tutti i servizi includono logging dettagliato:

```typescript
// Log di successo
console.log('✅ Dati recuperati con successo', { count: data.length })

// Log di errore
console.error('❌ Errore recupero dati:', error)

// Log di configurazione
console.log('✅ API Key configurata correttamente')
```

### Metriche

- **Response Time**: Tempo di risposta API
- **Cache Hit Rate**: Percentuale cache hits
- **Error Rate**: Percentuale errori
- **Data Volume**: Quantità dati recuperati
- **API Key Status**: Stato configurazione

## 🧪 Testing

### Test Unitari

```typescript
// test/services/tmdb-movies.service.test.ts
import { TMDBMoviesService } from '@/services/tmdb-movies.service'

describe('TMDBMoviesService', () => {
    let service: TMDBMoviesService

    beforeEach(() => {
        service = new TMDBMoviesService()
    })

    it('should return movies array', async () => {
        const movies = await service.getPopularMovies(1)
        expect(Array.isArray(movies)).toBe(true)
        expect(movies.length).toBeGreaterThan(0)
    })

    it('should handle API key errors', async () => {
        process.env.TMDB_API_KEY = ''
        const service = new TMDBMoviesService()
        
        await expect(service.getPopularMovies(1))
            .rejects.toThrow('API key non configurata')
    })
})
```

### Test di Integrazione

```typescript
// test/integration/services.test.ts
import { tmdbWrapperService } from '@/services/tmdb-wrapper.service'

describe('Services Integration', () => {
    it('should connect to TMDB API', async () => {
        const movies = await tmdbWrapperService.getPopularMovies(1)
        expect(movies).toBeDefined()
        expect(Array.isArray(movies)).toBe(true)
    })
})
```

## 🚀 Performance

### Ottimizzazioni

- **Parallel Requests**: `Promise.all()` per chiamate multiple
- **Cache Strategy**: Cache per ridurre chiamate API
- **Timeout**: 10 secondi per evitare blocchi
- **Retry Logic**: Tentativi automatici per errori temporanei
- **Fallback Keys**: Multiple chiavi API per ridondanza

### Best Practices

1. **Cache First**: Sempre controlla cache prima
2. **Error Handling**: Gestisci errori senza bloccare
3. **Logging**: Registra operazioni importanti
4. **TypeScript**: Usa tipizzazione forte
5. **Testing**: Testa tutti i servizi
6. **Fallback**: Chiavi API multiple per ridondanza

## 🔄 Aggiornamenti Recenti

### v2.0.0 - Major Update
- ✅ Aggiunto TMDB Wrapper Service con gestione errori
- ✅ Implementato fallback per chiavi API multiple
- ✅ Migliorata gestione errori con logging dettagliato
- ✅ Aggiunto supporto per runtime e generi nei film
- ✅ Ottimizzato sistema di cache

### v1.5.0 - Player Improvements
- ✅ Integrazione completa con VixSrc
- ✅ Controllo disponibilità contenuti
- ✅ Gestione parametri player personalizzati
- ✅ Timeout management per iframe

### v1.0.0 - Initial Release
- ✅ Base TMDB Movies Service
- ✅ Video Player Service
- ✅ VixSrc Scraper Service
- ✅ Catalog Service

## 🤝 Contributi

Per contribuire ai servizi:

1. **Fork** del repository
2. **Crea** feature branch
3. **Implementa** modifiche
4. **Aggiungi** test
5. **Aggiorna** documentazione
6. **Crea** pull request

### Guidelines

- Segui pattern esistenti
- Aggiungi test per nuove funzionalità
- Documenta modifiche importanti
- Usa TypeScript per tipizzazione
- Mantieni backward compatibility
- Implementa fallback per robustezza

## 📚 Risorse

- [API Documentation](../doc/)
- [TMDB API Docs](https://developers.themoviedb.org/)
- [VixSrc Integration](../doc/api-integration.md)
- [Troubleshooting](../doc/troubleshooting.md)

## 📄 Licenza

Questi servizi sono parte della piattaforma di streaming TheHustlePlace e seguono la stessa licenza del progetto principale.

---

**TheHustlePlace Services** - *Servizi di integrazione robusti e performanti* 🔧✨