# 🔌 Sistema API - TheHustlePlace

## 📋 Panoramica

Il sistema API di TheHustlePlace fornisce un'interfaccia robusta per l'accesso ai contenuti multimediali, integrando TMDB per i metadati e VixSrc per lo streaming. Tutte le API sono progettate per essere performanti, affidabili e user-friendly.

## 🏗️ Architettura API

```
API System/
├── 📺 Catalog APIs          # API per catalogo contenuti
├── 🎥 Player APIs           # API per player video
├── 🔍 Search APIs           # API per ricerca
├── 🏥 Health APIs           # API per monitoraggio
├── 🛡️ Error Handling        # Gestione errori
└── ⚡ Performance           # Ottimizzazioni performance
```

## 📺 Catalog APIs

### **Film APIs**
- `GET /api/catalog/popular/movies` - Film popolari
- `GET /api/catalog/now-playing` - Film al cinema
- `GET /api/catalog/latest/movies` - Ultimi film
- `GET /api/catalog/top-rated/movies` - Film meglio votati
- `GET /api/catalog/top-10` - Top 10 film
- `GET /api/catalog/movies` - Catalogo completo film

### **Serie TV APIs**
- `GET /api/catalog/popular/tv` - Serie TV popolari
- `GET /api/catalog/latest/tv` - Ultime serie TV
- `GET /api/catalog/top-rated/tv` - Serie TV meglio votate
- `GET /api/catalog/tv` - Catalogo completo serie TV

### **Utility APIs**
- `GET /api/catalog/genres` - Lista generi
- `GET /api/catalog/recent` - Contenuti recenti

### **Implementazione**
```typescript
// Esempio: Film popolari
export async function GET(request: NextRequest) {
    try {
        const catalogService = new CatalogService()
        const movies = await catalogService.getPopularMovies()
        
        return NextResponse.json({
            success: true,
            data: movies
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'Errore nel recupero film popolari'
        }, { status: 500 })
    }
}
```

## 🎥 Player APIs

### **Video Source APIs**
- `GET /api/player/movie/[id]` - Video source per film
- `GET /api/player/tv/[id]` - Video source per serie TV
- `GET /api/player/tv/[id]/[season]/[episode]` - Video source per episodio

### **Availability Check API**
- `GET /api/player/check-availability` - Verifica disponibilità contenuti

### **URL Generation API**
- `POST /api/player/generate-url` - Genera URL player personalizzato

### **Implementazione**
```typescript
// Esempio: Video source per film
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const movieId = params.id
        const vixsrcUrl = `https://vixsrc.to/movie/${movieId}`
        
        // Scraping del video source
        const response = await fetch(vixsrcUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0...'
            }
        })
        
        if (response.ok) {
            const html = await response.text()
            const videoUrlMatch = html.match(/src="([^"]*\.m3u8[^"]*)"/)
            
            if (videoUrlMatch) {
                return NextResponse.json({
                    success: true,
                    data: {
                        url: videoUrlMatch[1],
                        quality: 'HD',
                        type: 'movie',
                        tmdbId: parseInt(movieId)
                    }
                })
            }
        }
        
        return NextResponse.json({
            success: false,
            error: 'Video source non trovato',
            fallbackUrl: vixsrcUrl
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'Errore nel recupero del video'
        }, { status: 500 })
    }
}
```

## 🔍 Search APIs

### **Search Endpoints**
- `GET /api/catalog/search/movies` - Ricerca film
- `GET /api/catalog/search/tv` - Ricerca serie TV

### **Parametri di Ricerca**
```typescript
interface SearchParams {
    q: string              // Query di ricerca
    page?: number          // Pagina (default: 1)
    year?: number          // Anno di uscita
    genre?: string         // Genere
    language?: string      // Lingua
    sort_by?: string       // Ordinamento
}
```

### **Implementazione**
```typescript
// Esempio: Ricerca film
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')
        const page = parseInt(searchParams.get('page') || '1')
        
        if (!query) {
            return NextResponse.json({
                success: false,
                error: 'Query di ricerca mancante'
            }, { status: 400 })
        }
        
        const catalogService = new CatalogService()
        const results = await catalogService.searchMovies(query, { page })
        
        return NextResponse.json({
            success: true,
            data: results
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'Errore nella ricerca'
        }, { status: 500 })
    }
}
```

## 🏥 Health APIs

### **Health Check**
- `GET /api/health` - Stato del sistema

### **Implementazione**
```typescript
export async function GET() {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                tmdb: await checkTMDBHealth(),
                vixsrc: await checkVixSrcHealth(),
                database: await checkDatabaseHealth()
            }
        }
        
        return NextResponse.json(health)
    } catch (error) {
        return NextResponse.json({
            status: 'unhealthy',
            error: error.message
        }, { status: 500 })
    }
}
```

## 🛡️ Error Handling

### **Standard Error Response**
```typescript
interface ErrorResponse {
    success: false
    error: string
    code?: string
    details?: any
    timestamp: string
}
```

### **Error Codes**
- `400` - Bad Request (parametri mancanti/invalidi)
- `404` - Not Found (risorsa non trovata)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error (errore server)
- `503` - Service Unavailable (servizio non disponibile)

### **Implementazione**
```typescript
// Middleware di gestione errori
export function handleApiError(error: any, context: string) {
    logger.error(`API Error in ${context}:`, error)
    
    if (error instanceof ValidationError) {
        return NextResponse.json({
            success: false,
            error: 'Parametri non validi',
            details: error.details
        }, { status: 400 })
    }
    
    if (error instanceof NotFoundError) {
        return NextResponse.json({
            success: false,
            error: 'Risorsa non trovata'
        }, { status: 404 })
    }
    
    return NextResponse.json({
        success: false,
        error: 'Errore interno del server'
    }, { status: 500 })
}
```

## ⚡ Performance

### **Caching Strategy**
```typescript
// Cache in-memory per API frequenti
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minuti

export function getCachedData(key: string) {
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data
    }
    return null
}

export function setCachedData(key: string, data: any) {
    cache.set(key, { data, timestamp: Date.now() })
}
```

### **Rate Limiting**
```typescript
// Rate limiting per API
const rateLimit = new Map<string, { count: number, resetTime: number }>()

export function checkRateLimit(ip: string, limit: number = 100) {
    const now = Date.now()
    const windowMs = 15 * 60 * 1000 // 15 minuti
    
    const current = rateLimit.get(ip)
    if (!current || now > current.resetTime) {
        rateLimit.set(ip, { count: 1, resetTime: now + windowMs })
        return true
    }
    
    if (current.count >= limit) {
        return false
    }
    
    current.count++
    return true
}
```

### **Response Optimization**
- ✅ **Compression**: Gzip compression per risposte grandi
- ✅ **Pagination**: Paginazione per dataset grandi
- ✅ **Field Selection**: Selezione campi specifici
- ✅ **Lazy Loading**: Caricamento lazy per dati non critici

## 🔄 Data Flow

### **Request Flow**
```
Client Request
    ↓
Rate Limiting Check
    ↓
Authentication (se necessario)
    ↓
Validation
    ↓
Business Logic
    ↓
External API Calls (TMDB/VixSrc)
    ↓
Data Processing
    ↓
Caching
    ↓
Response
```

### **Error Flow**
```
Error Occurred
    ↓
Error Classification
    ↓
Logging
    ↓
Error Response Generation
    ↓
Client Response
```

## 📊 Monitoring

### **Metrics Tracked**
- 📈 **Request Count**: Numero richieste per endpoint
- ⏱️ **Response Time**: Tempo di risposta medio
- ❌ **Error Rate**: Percentuale errori
- 🚦 **Status Codes**: Distribuzione codici di stato

### **Logging**
```typescript
// Structured logging
logger.info('API Request', {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    ip: request.ip,
    timestamp: new Date().toISOString()
})

logger.error('API Error', {
    error: error.message,
    stack: error.stack,
    context: 'catalog-service',
    timestamp: new Date().toISOString()
})
```

## 🔧 Configuration

### **Environment Variables**
```env
# TMDB Configuration
TMDB_API_KEY=your-tmdb-api-key
TMDB_BASE_URL=https://api.themoviedb.org/3

# VixSrc Configuration
VIXSRC_BASE_URL=https://vixsrc.to

# Cache Configuration
CACHE_TTL=300000
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

### **API Configuration**
```typescript
// API Configuration
export const API_CONFIG = {
    tmdb: {
        baseUrl: process.env.TMDB_BASE_URL,
        apiKey: process.env.TMDB_API_KEY,
        timeout: 10000
    },
    vixsrc: {
        baseUrl: process.env.VIXSRC_BASE_URL,
        timeout: 15000
    },
    cache: {
        ttl: parseInt(process.env.CACHE_TTL || '300000'),
        maxSize: 1000
    }
}
```

## 🚀 Future Enhancements

### **Pianificati**
- 🔐 **Authentication**: Sistema di autenticazione
- 📊 **Analytics**: Tracking dettagliato utilizzo API
- 🔄 **Webhooks**: Notifiche real-time
- 📱 **GraphQL**: Supporto GraphQL

### **Considerazioni**
- 🌐 **CDN**: Distribuzione globale API
- 🔒 **Security**: Rate limiting avanzato
- 📈 **Scaling**: Auto-scaling basato su load

---

**Sistema API** - Interfaccia robusta e performante per contenuti multimediali 🔌✨
