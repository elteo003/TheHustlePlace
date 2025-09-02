# Gestione della Concorrenza e Scaling

## 🔄 Architettura Attuale

### Gestione delle Richieste Multiple

Il sito **TheHustlePlace** è progettato per gestire utenti multipli simultanei attraverso:

#### 1. **Next.js Built-in Concurrency**
- **Server-Side Rendering (SSR)**: Ogni richiesta viene gestita in modo isolato
- **API Routes**: Endpoint asincroni che non bloccano il server
- **Node.js Event Loop**: Gestione non-blocking delle operazioni I/O

#### 2. **Sistema di Cache Multi-Livello**

```typescript
// Cache in-memory (attuale)
utils/cache.ts - Cache locale per 1 ora

// Cache Redis (opzionale)
utils/redis-cache.ts - Cache distribuita e persistente
```

**Vantaggi del Cache:**
- Riduce le chiamate alle API esterne (TMDB, VixSrc)
- Risposta più veloce per utenti multipli
- Meno carico sui server esterni

#### 3. **Rate Limiting**

```typescript
middlewares/rate-limit.middleware.ts
```

**Protezioni implementate:**
- **50 richieste per 15 minuti** per endpoint API
- **Protezione IP**: Limite per indirizzo IP
- **Headers informativi**: X-RateLimit-* per il client
- **Cleanup automatico**: Rimozione richieste scadute

## 📊 Capacità Attuali

### Scenario: 100 Utenti Simultanei

| Componente | Capacità | Note |
|------------|----------|------|
| **Next.js Server** | 1000+ req/min | Dipende dal piano hosting |
| **Cache In-Memory** | 100% hit rate | Per dati già caricati |
| **API TMDB** | 1000 req/day | Limite API gratuito |
| **Rate Limiting** | 50 req/15min | Per IP |

### Performance Tipiche

- **Homepage**: ~200ms (con cache)
- **Catalogo**: ~500ms (prima richiesta)
- **Player**: ~100ms (iframe embed)
- **API Calls**: ~300ms (TMDB)

## 🚀 Scaling e Ottimizzazioni

### 1. **Cache Distribuita (Redis)**

```bash
# Variabili d'ambiente per Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
```

**Vantaggi:**
- Cache condivisa tra istanze multiple
- Persistenza dopo riavvii
- Miglior performance per utenti multipli

### 2. **Load Balancing**

Per **Render.com**:
- **Auto-scaling**: Aumenta istanze automaticamente
- **Health checks**: Monitoraggio continuo
- **CDN**: Distribuzione globale dei contenuti

### 3. **Database Caching**

```typescript
// Esempio di cache intelligente
const cacheKey = `movies:now-playing:${date}`
const cached = await redisCache.get(cacheKey)
if (cached) return cached

const movies = await tmdbService.getNowPlayingMovies()
await redisCache.set(cacheKey, movies, { ttl: 3600 })
```

## 🔧 Configurazione per Produzione

### Render.com Setup

```yaml
# render.yaml
services:
  - type: web
    name: thehustleplace
    plan: starter # o professional per più traffico
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: TMDB_API_KEY
        value: your-api-key
      - key: REDIS_HOST
        value: redis
```

### Variabili d'Ambiente

```bash
# Produzione
NODE_ENV=production
TMDB_API_KEY=your-tmdb-key
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

## 📈 Monitoraggio e Metriche

### 1. **Logs Automatici**

```typescript
// utils/logger.ts
logger.info('API request', { 
    endpoint: '/api/catalog/now-playing',
    responseTime: '200ms',
    cacheHit: true 
})
```

### 2. **Health Checks**

```typescript
// app/api/health/route.ts
export async function GET() {
    const cacheHealth = await redisCache.isHealthy()
    const stats = await redisCache.getStats()
    
    return NextResponse.json({
        status: 'healthy',
        cache: cacheHealth,
        stats
    })
}
```

### 3. **Rate Limit Headers**

```http
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 2025-01-27T10:30:00Z
```

## 🎯 Raccomandazioni per il Scaling

### Fase 1: **Fino a 1000 utenti/giorno**
- ✅ Cache in-memory (attuale)
- ✅ Rate limiting
- ✅ Next.js ottimizzato

### Fase 2: **1000-10000 utenti/giorno**
- 🔄 Redis cache
- 🔄 CDN per immagini
- 🔄 Database per analytics

### Fase 3: **10000+ utenti/giorno**
- 🔄 Load balancer
- 🔄 Microservizi
- 🔄 Database dedicato
- 🔄 Monitoring avanzato

## 🛡️ Sicurezza e Protezione

### Rate Limiting per Endpoint

```typescript
// Protezione API
export const GET = withRateLimit(handler, {
    windowMs: 15 * 60 * 1000, // 15 minuti
    maxRequests: 50,           // 50 richieste
    message: 'Troppe richieste, riprova più tardi'
})
```

### Protezione DDoS

- **Rate limiting per IP**
- **Cleanup automatico cache**
- **Timeout per richieste lunghe**
- **Fallback graceful per errori**

## 📊 Test di Carico

### Scenario di Test

```bash
# Test con 100 utenti simultanei
npm install -g artillery
artillery quick --count 100 --num 10 http://localhost:3000
```

### Metriche da Monitorare

- **Response time**: < 500ms
- **Error rate**: < 1%
- **Cache hit rate**: > 80%
- **Memory usage**: < 512MB

## 🔄 Conclusioni

Il sito **TheHustlePlace** è progettato per gestire **centinaia di utenti simultanei** con:

1. **Architettura scalabile** (Next.js + Cache)
2. **Protezioni integrate** (Rate limiting)
3. **Fallback robusti** (Cache in-memory)
4. **Monitoring automatico** (Logs + Health checks)

Per **migliaia di utenti**, si raccomanda l'upgrade a Redis e un piano hosting più potente.
