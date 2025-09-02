# 🔧 API Integration - TheHustlePlace

## 🎯 **Panoramica**

TheHustlePlace integra due API principali per offrire un'esperienza di streaming completa:
- **VixSrc API**: Per la riproduzione video e il catalogo
- **TMDB API**: Per i metadati dei contenuti (titoli, descrizioni, immagini)

## 🎬 **VixSrc API Integration**

### **Caratteristiche Principali**
- ✅ **Streaming video**: Riproduzione diretta e embed
- ✅ **Catalogo dinamico**: Lista aggiornata di contenuti
- ✅ **Parametri personalizzati**: Lingua, colori, autoplay
- ✅ **Eventi del player**: Tracking e analytics

### **Endpoints Disponibili**

#### **1. Lista Catalogo**
```typescript
// Endpoint per ottenere lista film
GET https://vixsrc.to/api/list/movie?lang=it

// Risposta
[
  { "tmdb_id": 550 },
  { "tmdb_id": 13 },
  { "tmdb_id": 680 },
  // ...
]
```

#### **2. Lista Serie TV**
```typescript
// Endpoint per ottenere lista serie TV
GET https://vixsrc.to/api/list/tv?lang=it

// Risposta
[
  { "tmdb_id": 1399 },
  { "tmdb_id": 1396 },
  { "tmdb_id": 1399 },
  // ...
]
```

#### **3. Player Embed**
```typescript
// URL per embed film
https://vixsrc.to/movie/{tmdbId}?lang=it&autoplay=false&primaryColor=B20710&secondaryColor=170000

// URL per embed serie TV
https://vixsrc.to/tv/{tmdbId}/{season}/{episode}?lang=it&autoplay=false&primaryColor=B20710&secondaryColor=170000
```

### **Parametri di Personalizzazione**

| Parametro | Descrizione | Valori | Default |
|-----------|-------------|---------|---------|
| `lang` | Lingua per audio | `it`, `en`, `es`, `fr` | `en` |
| `autoplay` | Riproduzione automatica | `true`, `false` | `false` |
| `primaryColor` | Colore primario player | Hex code (senza #) | `B20710` |
| `secondaryColor` | Colore secondario player | Hex code (senza #) | `170000` |
| `startAt` | Inizio video (secondi) | Numero | `0` |

### **Eventi del Player**

VixSrc invia eventi via `postMessage` al parent window:

```typescript
// Struttura evento
{
  type: "PLAYER_EVENT",
  data: {
    event: "play" | "pause" | "seeked" | "ended" | "timeupdate",
    currentTime: number,
    duration: number,
    video_id: number
  }
}
```

### **Implementazione VixSrc Service**

```typescript
// VixSrc Service
export class VixsrcService {
  private readonly VIXSRC_BASE_URL = process.env.VIXSRC_BASE_URL || 'https://vixsrc.to';

  // Ottieni lista film
  async getMovieList(): Promise<number[]> {
    try {
      const response = await axios.get(`${this.VIXSRC_BASE_URL}/api/list/movie?lang=it`);
      
      if (response.status === 200 && Array.isArray(response.data)) {
        return response.data.map((item: any) => item.tmdb_id);
      }
      
      return [];
    } catch (error) {
      logger.error('Errore nel recupero lista film VixSrc', { error });
      return [];
    }
  }

  // Ottieni lista serie TV
  async getTVShowList(): Promise<number[]> {
    try {
      const response = await axios.get(`${this.VIXSRC_BASE_URL}/api/list/tv?lang=it`);
      
      if (response.status === 200 && Array.isArray(response.data)) {
        return response.data.map((item: any) => item.tmdb_id);
      }
      
      return [];
    } catch (error) {
      logger.error('Errore nel recupero lista serie TV VixSrc', { error });
      return [];
    }
  }

  // Genera URL player personalizzato
  getPlayerUrl(tmdbId: number, type: 'movie' | 'tv', season?: number, episode?: number): string {
    const baseUrl = type === 'movie'
      ? `${this.VIXSRC_BASE_URL}/movie/${tmdbId}`
      : `${this.VIXSRC_BASE_URL}/tv/${tmdbId}/${season}/${episode}`;

    const params = new URLSearchParams({
      lang: 'it',
      autoplay: 'false',
      primaryColor: 'B20710',
      secondaryColor: '170000'
    });

    return `${baseUrl}?${params.toString()}`;
  }

  // Gestione eventi player
  setupPlayerEvents(callback: (event: any) => void): () => void {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'PLAYER_EVENT') {
        callback(event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Return cleanup function
    return () => window.removeEventListener('message', handleMessage);
  }
}
```

## 🎭 **TMDB API Integration**

### **Caratteristiche Principali**
- ✅ **Metadati completi**: Titoli, descrizioni, immagini
- ✅ **Multilingua**: Supporto per diverse lingue
- ✅ **Immagini HD**: Poster e backdrop ad alta risoluzione
- ✅ **Informazioni dettagliate**: Cast, crew, generi, valutazioni

### **Configurazione**

#### **1. Ottenere API Key**
1. Registrati su [TMDB](https://www.themoviedb.org/settings/api)
2. Richiedi una chiave API (gratuita)
3. Configura la chiave nel file `.env.local`:

```bash
# .env.local
TMDB_API_KEY=your-actual-tmdb-api-key-here
```

#### **2. Endpoints Principali**

```typescript
// Base URL
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Dettagli film
GET https://api.themoviedb.org/3/movie/{movie_id}?api_key={api_key}&language=it-IT

// Dettagli serie TV
GET https://api.themoviedb.org/3/tv/{tv_id}?api_key={api_key}&language=it-IT

// Immagini
GET https://image.tmdb.org/t/p/{size}{path}
```

### **Implementazione TMDB Service**

```typescript
// TMDB Service
export class TMDBService {
  private readonly TMDB_BASE_URL = 'https://api.themoviedb.org/3';
  private readonly TMDB_API_KEY = process.env.TMDB_API_KEY || 'demo';
  private readonly TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

  // Ottieni dettagli film
  async getMovieDetails(tmdbId: number): Promise<Movie | null> {
    try {
      const response = await axios.get(`${this.TMDB_BASE_URL}/movie/${tmdbId}`, {
        params: {
          api_key: this.TMDB_API_KEY,
          language: 'it-IT'
        }
      });

      if (response.status === 200) {
        const data = response.data;
        
        return {
          id: tmdbId,
          title: data.title || `Film ${tmdbId}`,
          overview: data.overview || 'Descrizione non disponibile',
          release_date: data.release_date || '',
          vote_average: data.vote_average || 0,
          vote_count: data.vote_count || 0,
          genre_ids: data.genres?.map((g: any) => g.id) || [],
          adult: data.adult || false,
          backdrop_path: data.backdrop_path || '/placeholder-movie.svg',
          original_language: data.original_language || 'en',
          original_title: data.original_title || data.title,
          popularity: data.popularity || 0,
          poster_path: data.poster_path || '/placeholder-movie.svg',
          video: data.video || false,
          tmdb_id: tmdbId
        };
      }

      return null;
    } catch (error) {
      logger.warn('Errore nel recupero dettagli TMDB per film', { tmdbId, error });
      return null;
    }
  }

  // Ottieni dettagli serie TV
  async getTVShowDetails(tmdbId: number): Promise<TVShow | null> {
    try {
      const response = await axios.get(`${this.TMDB_BASE_URL}/tv/${tmdbId}`, {
        params: {
          api_key: this.TMDB_API_KEY,
          language: 'it-IT'
        }
      });

      if (response.status === 200) {
        const data = response.data;
        
        return {
          id: tmdbId,
          name: data.name || `Serie TV ${tmdbId}`,
          overview: data.overview || 'Descrizione non disponibile',
          first_air_date: data.first_air_date || '',
          vote_average: data.vote_average || 0,
          vote_count: data.vote_count || 0,
          genre_ids: data.genres?.map((g: any) => g.id) || [],
          adult: data.adult || false,
          backdrop_path: data.backdrop_path || '/placeholder-movie.svg',
          origin_country: data.origin_country || [],
          original_language: data.original_language || 'en',
          original_name: data.original_name || data.name,
          popularity: data.popularity || 0,
          poster_path: data.poster_path || '/placeholder-movie.svg',
          tmdb_id: tmdbId
        };
      }

      return null;
    } catch (error) {
      logger.warn('Errore nel recupero dettagli TMDB per serie TV', { tmdbId, error });
      return null;
    }
  }

  // Genera URL immagine
  getImageUrl(path: string | null | undefined, size: 'w200' | 'w300' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500'): string {
    if (!path) return '/placeholder-movie.svg';
    return `${this.TMDB_IMAGE_BASE_URL}/${size}${path}`;
  }

  // Testa la chiave API
  async testAPIKey(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.TMDB_BASE_URL}/movie/550`, {
        params: {
          api_key: this.TMDB_API_KEY
        }
      });
      return response.status === 200;
    } catch (error) {
      logger.error('Chiave API TMDB non valida', { error });
      return false;
    }
  }
}
```

## 🔄 **Integrazione Completa**

### **Catalog Service Ibrido**

```typescript
// Catalog Service che combina VixSrc e TMDB
export class CatalogService {
  private readonly vixsrcService: VixsrcService;
  private readonly tmdbService: TMDBService;

  constructor() {
    this.vixsrcService = new VixsrcService();
    this.tmdbService = new TMDBService();
  }

  async getMovies(filters: CatalogFilters = {}): Promise<PaginatedResponse<Movie>> {
    try {
      // 1. Ottieni ID reali da VixSrc
      const tmdbIds = await this.vixsrcService.getMovieList();
      
      if (tmdbIds.length === 0) {
        return this.getFallbackMovies();
      }

      // 2. Ottieni dettagli da TMDB
      const movies: Movie[] = await Promise.all(
        tmdbIds.slice(0, 20).map(async (tmdbId: number) => {
          try {
            const tmdbDetails = await this.tmdbService.getMovieDetails(tmdbId);
            if (tmdbDetails) {
              return tmdbDetails;
            }
          } catch (error) {
            logger.warn('Errore nel recupero dettagli TMDB per film', { tmdbId, error });
          }

          // Fallback con ID reale
          return this.createFallbackMovie(tmdbId);
        })
      );

      return {
        page: filters.page || 1,
        results: movies,
        total_pages: Math.ceil(tmdbIds.length / 20),
        total_results: tmdbIds.length
      };
    } catch (error) {
      logger.error('Errore nel recupero film', { error });
      return this.getFallbackMovies();
    }
  }

  private createFallbackMovie(tmdbId: number): Movie {
    return {
      id: tmdbId,
      title: `Film ${tmdbId}`,
      overview: `Film disponibile su vixsrc.to con ID ${tmdbId}. Per ottenere i dettagli completi, configura una chiave TMDB API valida.`,
      release_date: '',
      vote_average: 0,
      vote_count: 0,
      genre_ids: [],
      adult: false,
      original_language: 'en',
      original_title: `Film ${tmdbId}`,
      popularity: 0,
      video: false,
      tmdb_id: tmdbId,
      poster_path: '/placeholder-movie.svg',
      backdrop_path: '/placeholder-movie.svg'
    };
  }
}
```

## 🎬 **Video Player Integration**

### **Player Service**

```typescript
// Video Player Service
export class VideoPlayerService {
  private readonly VIXSRC_BASE_URL = process.env.VIXSRC_BASE_URL || 'https://vixsrc.to';

  // Ottieni video source per film
  async getMovieVideoSource(tmdbId: number): Promise<VideoSource | null> {
    try {
      const response = await axios.get(`/api/player/movie/${tmdbId}`);

      if (response.status === 200 && response.data.success) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      logger.error('Errore nel recupero video source per film', { error, tmdbId });
      return null;
    }
  }

  // Ottieni video source per serie TV
  async getTVShowVideoSource(tmdbId: number, season: number, episode: number): Promise<VideoSource | null> {
    try {
      const response = await axios.get(`/api/player/tv/${tmdbId}?season=${season}&episode=${episode}`);

      if (response.status === 200 && response.data.success) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      logger.error('Errore nel recupero video source per serie TV', { error, tmdbId, season, episode });
      return null;
    }
  }

  // Genera URL player personalizzato
  getPlayerUrl(tmdbId: number, type: 'movie' | 'tv', season?: number, episode?: number): string {
    const baseUrl = type === 'movie'
      ? `${this.VIXSRC_BASE_URL}/movie/${tmdbId}`
      : `${this.VIXSRC_BASE_URL}/tv/${tmdbId}/${season}/${episode}`;

    const params = new URLSearchParams({
      lang: 'it',
      autoplay: 'false',
      primaryColor: 'B20710',
      secondaryColor: '170000'
    });

    return `${baseUrl}?${params.toString()}`;
  }
}
```

## 🛡️ **Error Handling e Fallback**

### **Strategia di Fallback**

```typescript
// Gestione errori e fallback
export class APIManager {
  private readonly vixsrcService: VixsrcService;
  private readonly tmdbService: TMDBService;

  async getMovieWithFallback(tmdbId: number): Promise<Movie> {
    try {
      // 1. Prova TMDB API
      const tmdbMovie = await this.tmdbService.getMovieDetails(tmdbId);
      if (tmdbMovie) {
        return tmdbMovie;
      }
    } catch (error) {
      logger.warn('TMDB API fallita, tentativo fallback', { tmdbId, error });
    }

    try {
      // 2. Prova scraping VixSrc
      const vixsrcMovie = await this.vixsrcScraper.getMovieDetails(tmdbId);
      if (vixsrcMovie) {
        return vixsrcMovie;
      }
    } catch (error) {
      logger.warn('VixSrc scraping fallito, usando fallback finale', { tmdbId, error });
    }

    // 3. Fallback finale
    return this.createBasicMovie(tmdbId);
  }

  private createBasicMovie(tmdbId: number): Movie {
    return {
      id: tmdbId,
      title: `Film ${tmdbId}`,
      overview: `Film disponibile su vixsrc.to con ID ${tmdbId}`,
      release_date: '',
      vote_average: 0,
      vote_count: 0,
      genre_ids: [],
      adult: false,
      original_language: 'en',
      original_title: `Film ${tmdbId}`,
      popularity: 0,
      video: false,
      tmdb_id: tmdbId,
      poster_path: '/placeholder-movie.svg',
      backdrop_path: '/placeholder-movie.svg'
    };
  }
}
```

## 📊 **Monitoring e Analytics**

### **API Health Check**

```typescript
// Health check per le API
export class APIHealthChecker {
  async checkVixSrcHealth(): Promise<boolean> {
    try {
      const response = await axios.get('https://vixsrc.to/api/list/movie?lang=it', {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      logger.error('VixSrc API non disponibile', { error });
      return false;
    }
  }

  async checkTMDBHealth(): Promise<boolean> {
    try {
      const response = await axios.get('https://api.themoviedb.org/3/movie/550', {
        params: { api_key: process.env.TMDB_API_KEY },
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      logger.error('TMDB API non disponibile', { error });
      return false;
    }
  }

  async checkAllAPIs(): Promise<{ vixsrc: boolean; tmdb: boolean }> {
    const [vixsrc, tmdb] = await Promise.all([
      this.checkVixSrcHealth(),
      this.checkTMDBHealth()
    ]);

    return { vixsrc, tmdb };
  }
}
```

## 🔧 **Configurazione e Setup**

### **Variabili Ambiente**

```bash
# .env.local
# VixSrc Configuration
VIXSRC_BASE_URL=https://vixsrc.to

# TMDB Configuration
TMDB_API_KEY=your-actual-tmdb-api-key-here

# Cache Configuration
CACHE_TTL=3600
CACHE_MAX_SIZE=1000
```

### **Setup Iniziale**

```typescript
// Setup delle API
export class APISetup {
  static async initialize(): Promise<void> {
    const healthChecker = new APIHealthChecker();
    const { vixsrc, tmdb } = await healthChecker.checkAllAPIs();

    if (!vixsrc) {
      logger.warn('VixSrc API non disponibile, usando fallback');
    }

    if (!tmdb) {
      logger.warn('TMDB API non disponibile, usando fallback');
    }

    logger.info('API Setup completato', { vixsrc, tmdb });
  }
}
```

## 🎯 **Best Practices**

### **1. Rate Limiting**
- ✅ **TMDB**: 40 richieste ogni 10 secondi
- ✅ **VixSrc**: Rispetta i limiti del servizio
- ✅ **Caching**: Riduci le chiamate API

### **2. Error Handling**
- ✅ **Retry logic**: Riprova su errori temporanei
- ✅ **Fallback**: Usa dati alternativi
- ✅ **Logging**: Traccia tutti gli errori

### **3. Performance**
- ✅ **Caching**: Cache intelligente
- ✅ **Lazy loading**: Carica on-demand
- ✅ **Batch requests**: Raggruppa le chiamate

### **4. Security**
- ✅ **API keys**: Non esporre chiavi
- ✅ **CORS**: Gestisci correttamente
- ✅ **Validation**: Valida tutti i dati

---

**L'integrazione delle API di TheHustlePlace è progettata per offrire un'esperienza di streaming robusta e affidabile, con fallback intelligenti e gestione avanzata degli errori per garantire sempre la disponibilità del servizio.** 🔧✨
