# Services Directory

## 📋 Panoramica

Questa directory contiene tutti i servizi di integrazione con API esterne e servizi di terze parti utilizzati dalla piattaforma di streaming.

## 📁 Struttura

```
services/
├── README.md                 # Questa documentazione
├── trakt.service.ts          # Servizio Trakt.tv
├── tmdb.service.ts           # Servizio TMDB
├── catalog.service.ts        # Servizio catalogo
├── player.service.ts         # Servizio player
└── video-player.service.ts   # Servizio video player
```

## 🔧 Servizi Disponibili

### 1. Trakt.tv Service (`trakt.service.ts`)

**Scopo**: Integrazione con Trakt.tv API per dati aggiornati su film e serie TV

**Funzionalità**:
- Top 10 film popolari
- Top 10 serie TV popolari  
- Nuove uscite cinema
- Cache Redis con TTL 1 ora
- Gestione errori robusta

**Utilizzo**:
```typescript
import { getTop10Movies, getTop10Shows, getUpcomingMovies } from '@/services/trakt.service'

const movies = await getTop10Movies()
const shows = await getTop10Shows()
const upcoming = await getUpcomingMovies()
```

**Documentazione**: [Trakt.tv Integration](doc/trakt-integration.md)

### 2. TMDB Service (`tmdb.service.ts`)

**Scopo**: Integrazione con The Movie Database API

**Funzionalità**:
- Ricerca film e serie TV
- Dettagli completi
- Immagini e poster
- Cast e crew
- Recensioni e rating

### 3. Catalog Service (`catalog.service.ts`)

**Scopo**: Gestione del catalogo di contenuti

**Funzionalità**:
- Aggregazione dati da multiple fonti
- Filtri e ricerca
- Paginazione
- Cache intelligente

### 4. Player Service (`player.service.ts`)

**Scopo**: Gestione del player video

**Funzionalità**:
- Generazione URL player
- Controllo disponibilità
- Gestione stream
- Fallback automatici

### 5. Video Player Service (`video-player.service.ts`)

**Scopo**: Integrazione con servizi di streaming

**Funzionalità**:
- VixSrc integration
- URL generation
- Stream validation
- Error handling

## 🏗️ Architettura

### Pattern di Design

Tutti i servizi seguono pattern comuni:

1. **Singleton Pattern**: Istanza unica per servizio
2. **Factory Pattern**: Creazione client HTTP
3. **Cache Pattern**: Redis per performance
4. **Error Handling**: Fallback graceful
5. **Logging**: Monitoraggio completo

### Struttura Standard

```typescript
class ServiceName {
    private client: AxiosInstance
    private redis: RedisClientType
    private config: ServiceConfig

    constructor() {
        // Inizializzazione
    }

    private async getFromCache<T>(key: string): Promise<T | null> {
        // Cache logic
    }

    private async setCache<T>(key: string, data: T, ttl: number): Promise<void> {
        // Cache logic
    }

    async getData(): Promise<DataType[]> {
        // Business logic
    }
}
```

## 🔧 Configurazione

### Variabili d'Ambiente

```env
# TMDB
TMDB_API_KEY="your_tmdb_api_key"

# Trakt.tv
TRAKT_CLIENT_ID="your_trakt_client_id"
TRAKT_CLIENT_SECRET="your_trakt_client_secret"

# Redis
REDIS_URL="redis://localhost:6379"

# VixSrc
VIXSRC_BASE_URL="https://vixsrc.to"
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
import { getTop10Movies } from '@/services/trakt.service'

// Import multiplo
import { 
    getTop10Movies, 
    getTop10Shows, 
    getUpcomingMovies 
} from '@/services/trakt.service'

// Import servizio completo
import { traktService } from '@/services/trakt.service'
```

### Utilizzo in API Routes

```typescript
// app/api/movies/route.ts
import { getTop10Movies } from '@/services/trakt.service'

export async function GET() {
    const movies = await getTop10Movies()
    return NextResponse.json({ movies })
}
```

### Utilizzo in Componenti

```typescript
// components/movie-list.tsx
import { useEffect, useState } from 'react'

export function MovieList() {
    const [movies, setMovies] = useState([])

    useEffect(() => {
        fetch('/api/movies')
            .then(res => res.json())
            .then(data => setMovies(data.movies))
    }, [])

    return (
        <div>
            {movies.map(movie => (
                <div key={movie.ids.trakt}>
                    <h3>{movie.title}</h3>
                </div>
            ))}
        </div>
    )
}
```

## 🗄️ Cache Strategy

### Redis Cache

Tutti i servizi utilizzano Redis per cache:

```typescript
// Chiavi cache standardizzate
'service:endpoint:params'  // Formato chiave
'ttl:3600'                // TTL in secondi
```

### Cache Keys

```typescript
// Trakt.tv
'trakt:top10:movies'
'trakt:top10:shows'
'trakt:upcoming:movies'

// TMDB
'tmdb:movie:12345'
'tmdb:search:query'

// Catalog
'catalog:popular:movies'
'catalog:recent:shows'
```

## 🚨 Error Handling

### Strategia Standard

1. **Cache First**: Controlla Redis
2. **API Fallback**: Chiama API esterna
3. **Graceful Degradation**: Restituisce array vuoto
4. **Logging**: Registra errori per debugging

### Esempio

```typescript
async getData(): Promise<DataType[]> {
    try {
        // 1. Controlla cache
        const cached = await this.getFromCache<DataType[]>(cacheKey)
        if (cached) return cached

        // 2. Chiama API
        const response = await this.client.get(endpoint)
        const data = this.formatData(response.data)

        // 3. Salva in cache
        await this.setCache(cacheKey, data)

        return data
    } catch (error) {
        logger.error('Errore servizio:', error)
        return [] // Fallback
    }
}
```

## 📊 Monitoring

### Logging

Tutti i servizi includono logging dettagliato:

```typescript
// Log di successo
logger.info('Dati recuperati con successo', { count: data.length })

// Log di errore
logger.error('Errore recupero dati:', error)

// Log di cache
logger.info('Cache hit', { key: cacheKey })
```

### Metriche

- **Response Time**: Tempo di risposta API
- **Cache Hit Rate**: Percentuale cache hits
- **Error Rate**: Percentuale errori
- **Data Volume**: Quantità dati recuperati

## 🧪 Testing

### Test Unitari

```typescript
// test/services/trakt.service.test.ts
import { getTop10Movies } from '@/services/trakt.service'

describe('TraktService', () => {
    it('should return movies array', async () => {
        const movies = await getTop10Movies()
        expect(Array.isArray(movies)).toBe(true)
        expect(movies.length).toBeGreaterThan(0)
    })
})
```

### Test di Integrazione

```typescript
// test/integration/services.test.ts
import { traktService } from '@/services/trakt.service'

describe('Services Integration', () => {
    it('should connect to external APIs', async () => {
        const movies = await traktService.getTop10Movies()
        expect(movies).toBeDefined()
    })
})
```

## 🚀 Performance

### Ottimizzazioni

- **Parallel Requests**: `Promise.all()` per chiamate multiple
- **Cache Strategy**: Redis per ridurre chiamate API
- **Timeout**: 10 secondi per evitare blocchi
- **Retry Logic**: Tentativi automatici per errori temporanei

### Best Practices

1. **Cache First**: Sempre controlla cache prima
2. **Error Handling**: Gestisci errori senza bloccare
3. **Logging**: Registra operazioni importanti
4. **TypeScript**: Usa tipizzazione forte
5. **Testing**: Testa tutti i servizi

## 🔄 Aggiornamenti

### Versioning

I servizi seguono semantic versioning:

- **Major**: Breaking changes
- **Minor**: Nuove funzionalità
- **Patch**: Bug fixes

### Changelog

Mantieni un changelog per ogni servizio:

```markdown
## [1.2.0] - 2024-01-15
### Added
- Nuova funzione getUpcomingMovies()
- Supporto cache Redis

### Changed
- Migliorata gestione errori
- Ottimizzate performance

### Fixed
- Bug fix per timeout API
```

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

## 📚 Risorse

- [API Documentation](doc/)
- [Testing Guide](doc/testing.md)
- [Deployment Guide](doc/deployment.md)
- [Performance Guide](doc/performance.md)

## 📄 Licenza

Questi servizi sono parte della piattaforma di streaming e seguono la stessa licenza del progetto principale.
