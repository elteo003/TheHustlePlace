# 🎬 Video Player - TheHustlePlace

## 🎯 **Panoramica**

Il sistema di riproduzione video di TheHustlePlace è progettato per offrire un'esperienza di streaming premium, integrando le API di VixSrc per la riproduzione e TMDB per i metadati. Supporta sia film che serie TV con controlli avanzati e personalizzazione.

## 🏗️ **Architettura del Player**

```
Player System/
├── 🎬 Movie Player          # Player per film
├── 📺 TV Player             # Player per serie TV
├── 🔧 Video Player Service  # Servizio di gestione video
├── 🎨 Player UI             # Interfaccia utente
├── 📡 API Integration       # Integrazione VixSrc
└── 🎭 Event Handling        # Gestione eventi
```

## 🎬 **Movie Player**

### **Caratteristiche Principali**
- ✅ **Riproduzione diretta**: Integrazione con VixSrc
- ✅ **Controlli personalizzati**: UI elegante e intuitiva
- ✅ **Responsive design**: Ottimizzato per tutti i dispositivi
- ✅ **Eventi avanzati**: Tracking e analytics

### **Implementazione**
```typescript
// Movie Player Component
const MoviePlayer = ({ params }: { params: { id: string } }) => {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useEmbed, setUseEmbed] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoPlayerService = new VideoPlayerService();

  useEffect(() => {
    const loadMovieData = async () => {
      try {
        setIsLoading(true);
        
        // Carica dettagli del film
        const movieResponse = await fetch(`/api/catalog/movie/${params.id}`);
        const movieData = await movieResponse.json();
        
        if (movieData.success) {
          setMovie(movieData.data);
        }

        // Prova a caricare video source diretto
        const videoSource = await videoPlayerService.getMovieVideoSource(parseInt(params.id));
        
        if (videoSource) {
          setVideoUrl(videoSource.url);
          setUseEmbed(false);
        } else {
          // Fallback a embed
          setUseEmbed(true);
        }
      } catch (err) {
        console.error('Errore nel caricamento film:', err);
        setError('Errore nel caricamento del film');
      } finally {
        setIsLoading(false);
      }
    };

    loadMovieData();
  }, [params.id]);

  if (isLoading) {
    return <PlayerSkeleton />;
  }

  if (error) {
    return <PlayerError error={error} />;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header con info film */}
      <div className="bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {movie?.title}
          </h1>
          <p className="text-gray-300 mt-2">
            {movie?.overview}
          </p>
        </div>
      </div>

      {/* Player */}
      <div className="relative w-full h-screen">
        {useEmbed ? (
          <iframe
            src={videoPlayerService.getPlayerUrl(parseInt(params.id), 'movie')}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; encrypted-media; web-share"
            loading="lazy"
            onLoad={() => console.log('Player caricato')}
            onError={() => setError('Errore nel caricamento del player')}
          />
        ) : (
          <video
            src={videoUrl || undefined}
            controls
            className="w-full h-full"
            onError={() => {
              setUseEmbed(true);
              setError('Errore nella riproduzione, passaggio a embed');
            }}
          />
        )}
      </div>
    </div>
  );
};
```

## 📺 **TV Player**

### **Caratteristiche Principali**
- ✅ **Gestione stagioni/episodi**: Navigazione completa
- ✅ **Controlli avanzati**: Play, pause, seek
- ✅ **Auto-play**: Riproduzione automatica episodi
- ✅ **Progress tracking**: Salvataggio progresso

### **Implementazione**
```typescript
// TV Player Component
const TVPlayer = ({ params }: { params: { id: string } }) => {
  const [tvShow, setTvShow] = useState<TVShow | null>(null);
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [useEmbed, setUseEmbed] = useState(true);

  const videoPlayerService = new VideoPlayerService();

  useEffect(() => {
    const loadTVShowData = async () => {
      try {
        setIsLoading(true);
        
        // Carica dettagli della serie
        const tvResponse = await fetch(`/api/catalog/tv/${params.id}`);
        const tvData = await tvResponse.json();
        
        if (tvData.success) {
          setTvShow(tvData.data);
        }

        // Prova a caricare video source diretto
        const videoSource = await videoPlayerService.getTVShowVideoSource(
          parseInt(params.id),
          currentSeason,
          currentEpisode
        );
        
        if (videoSource) {
          setUseEmbed(false);
        } else {
          setUseEmbed(true);
        }
      } catch (err) {
        console.error('Errore nel caricamento serie TV:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTVShowData();
  }, [params.id, currentSeason, currentEpisode]);

  const handleEpisodeChange = (season: number, episode: number) => {
    setCurrentSeason(season);
    setCurrentEpisode(episode);
  };

  if (isLoading) {
    return <PlayerSkeleton />;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header con info serie */}
      <div className="bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {tvShow?.name}
          </h1>
          <p className="text-gray-300 mt-2">
            Stagione {currentSeason} - Episodio {currentEpisode}
          </p>
        </div>
      </div>

      {/* Player */}
      <div className="relative w-full h-screen">
        <iframe
          src={videoPlayerService.getPlayerUrl(
            parseInt(params.id),
            'tv',
            currentSeason,
            currentEpisode
          )}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; encrypted-media; web-share"
          loading="lazy"
        />
      </div>

      {/* Controlli episodi */}
      <EpisodeControls
        tvShow={tvShow}
        currentSeason={currentSeason}
        currentEpisode={currentEpisode}
        onEpisodeChange={handleEpisodeChange}
      />
    </div>
  );
};
```

## 🔧 **Video Player Service**

### **Caratteristiche Principali**
- ✅ **Gestione video sources**: Recupero URL diretti
- ✅ **Fallback intelligente**: Embed se video diretto fallisce
- ✅ **Caching**: Ottimizzazione performance
- ✅ **Parametri personalizzati**: Lingua, colori, autoplay

### **Implementazione**
```typescript
// Video Player Service
export class VideoPlayerService {
  private readonly VIXSRC_BASE_URL = process.env.VIXSRC_BASE_URL || 'https://vixsrc.to';

  async getMovieVideoSource(tmdbId: number): Promise<VideoSource | null> {
    try {
      // Usa il nostro endpoint API per evitare problemi CORS
      const response = await axios.get(`/api/player/movie/${tmdbId}`);

      if (response.status === 200 && response.data.success) {
        logger.info('Video source trovato per film', { tmdbId, videoUrl: response.data.data.url });
        return response.data.data;
      }

      logger.warn('Nessun video source trovato per film', { tmdbId });
      return null;
    } catch (error) {
      logger.error('Errore nel recupero video source per film', { error, tmdbId });
      return null;
    }
  }

  async getTVShowVideoSource(tmdbId: number, season: number, episode: number): Promise<VideoSource | null> {
    try {
      // Usa il nostro endpoint API per evitare problemi CORS
      const response = await axios.get(`/api/player/tv/${tmdbId}?season=${season}&episode=${episode}`);

      if (response.status === 200 && response.data.success) {
        logger.info('Video source trovato per serie TV', { tmdbId, season, episode, videoUrl: response.data.data.url });
        return response.data.data;
      }

      logger.warn('Nessun video source trovato per serie TV', { tmdbId, season, episode });
      return null;
    } catch (error) {
      logger.error('Errore nel recupero video source per serie TV', { error, tmdbId, season, episode });
      return null;
    }
  }

  // Metodo per ottenere l'URL diretto del player di vixsrc.to
  getPlayerUrl(tmdbId: number, type: 'movie' | 'tv', season?: number, episode?: number): string {
    const baseUrl = type === 'movie'
      ? `${this.VIXSRC_BASE_URL}/movie/${tmdbId}`
      : `${this.VIXSRC_BASE_URL}/tv/${tmdbId}/${season}/${episode}`;

    // Aggiungi parametri di personalizzazione secondo la documentazione VixSrc
    const params = new URLSearchParams({
      lang: 'it',                    // Lingua italiana per audio
      autoplay: 'false',            // Non autoplay per migliore UX
      primaryColor: 'B20710',       // Colore primario (rosso Netflix-style)
      secondaryColor: '170000'      // Colore secondario (rosso scuro)
    });

    return `${baseUrl}?${params.toString()}`;
  }
}
```

## 🎨 **Player UI Components**

### **1. Player Controls**
```typescript
// Controlli del player
const PlayerControls = ({ isPlaying, onPlay, onPause, onSeek, currentTime, duration }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isPlaying]);

  return (
    <div 
      className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onMouseMove={() => setIsVisible(true)}
    >
      <div className="container mx-auto">
        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={(e) => onSeek(parseInt(e.target.value))}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={isPlaying ? onPause : onPlay}
              className="text-white hover:text-red-500 transition-colors"
            >
              {isPlaying ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
            </button>
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-white hover:text-red-500 transition-colors">
              <VolumeIcon size={20} />
            </button>
            <button className="text-white hover:text-red-500 transition-colors">
              <FullscreenIcon size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### **2. Episode Controls**
```typescript
// Controlli episodi per serie TV
const EpisodeControls = ({ tvShow, currentSeason, currentEpisode, onEpisodeChange }) => {
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState([]);

  useEffect(() => {
    // Carica stagioni ed episodi
    const loadSeasonsAndEpisodes = async () => {
      try {
        const response = await fetch(`/api/catalog/tv/${tvShow.id}/seasons`);
        const data = await response.json();
        
        if (data.success) {
          setSeasons(data.data.seasons);
          setEpisodes(data.data.episodes);
        }
      } catch (error) {
        console.error('Errore nel caricamento stagioni/episodi:', error);
      }
    };

    if (tvShow) {
      loadSeasonsAndEpisodes();
    }
  }, [tvShow]);

  return (
    <div className="bg-gray-900 p-4">
      <div className="container mx-auto">
        <h3 className="text-white font-semibold mb-4">Episodi</h3>
        
        {/* Selezione stagione */}
        <div className="mb-4">
          <select
            value={currentSeason}
            onChange={(e) => onEpisodeChange(parseInt(e.target.value), 1)}
            className="bg-gray-800 text-white px-3 py-2 rounded"
          >
            {seasons.map(season => (
              <option key={season.season_number} value={season.season_number}>
                Stagione {season.season_number}
              </option>
            ))}
          </select>
        </div>

        {/* Lista episodi */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {episodes.map(episode => (
            <button
              key={episode.episode_number}
              onClick={() => onEpisodeChange(currentSeason, episode.episode_number)}
              className={`p-3 rounded text-left transition-colors ${
                episode.episode_number === currentEpisode
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="font-semibold">Episodio {episode.episode_number}</div>
              <div className="text-sm opacity-75">{episode.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
```

## 📡 **API Integration**

### **1. Movie Player API**
```typescript
// API endpoint per video source film
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const movieId = params.id;
    const vixsrcUrl = `https://vixsrc.to/movie/${movieId}`;

    // Fetch HTML content from vixsrc.to
    const response = await fetch(vixsrcUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Film non trovato' }, { status: 404 });
    }

    const html = await response.text();
    
    // Extract video URL using regex
    const videoUrlMatch = html.match(/https:\/\/[^"'\s]+\.m3u8/);
    
    if (videoUrlMatch) {
      return NextResponse.json({
        success: true,
        data: {
          url: videoUrlMatch[0],
          quality: 'HD',
          type: 'movie',
          tmdbId: parseInt(movieId)
        }
      });
    }

    return NextResponse.json({ success: false, error: 'Video source non trovato' }, { status: 404 });
  } catch (error) {
    console.error('Errore nel recupero video source:', error);
    return NextResponse.json({ success: false, error: 'Errore interno del server' }, { status: 500 });
  }
}
```

### **2. TV Player API**
```typescript
// API endpoint per video source serie TV
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tvId = params.id;
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season') || '1';
    const episode = searchParams.get('episode') || '1';
    
    const vixsrcUrl = `https://vixsrc.to/tv/${tvId}/${season}/${episode}`;

    // Fetch HTML content from vixsrc.to
    const response = await fetch(vixsrcUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Episodio non trovato' }, { status: 404 });
    }

    const html = await response.text();
    
    // Extract video URL using regex
    const videoUrlMatch = html.match(/https:\/\/[^"'\s]+\.m3u8/);
    
    if (videoUrlMatch) {
      return NextResponse.json({
        success: true,
        data: {
          url: videoUrlMatch[0],
          quality: 'HD',
          type: 'tv',
          tmdbId: parseInt(tvId),
          season: parseInt(season),
          episode: parseInt(episode)
        }
      });
    }

    return NextResponse.json({ success: false, error: 'Video source non trovato' }, { status: 404 });
  } catch (error) {
    console.error('Errore nel recupero video source:', error);
    return NextResponse.json({ success: false, error: 'Errore interno del server' }, { status: 500 });
  }
}
```

## 🎭 **Event Handling**

### **1. Player Events**
```typescript
// Gestione eventi del player
const usePlayerEvents = () => {
  const [playerState, setPlayerState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'PLAYER_EVENT') {
        const { event: eventType, currentTime, duration } = event.data;
        
        switch (eventType) {
          case 'play':
            setPlayerState(prev => ({ ...prev, isPlaying: true }));
            break;
          case 'pause':
            setPlayerState(prev => ({ ...prev, isPlaying: false }));
            break;
          case 'timeupdate':
            setPlayerState(prev => ({ ...prev, currentTime, duration }));
            break;
          case 'ended':
            setPlayerState(prev => ({ ...prev, isPlaying: false }));
            break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return playerState;
};
```

### **2. Progress Tracking**
```typescript
// Tracking del progresso di visualizzazione
const useProgressTracking = (tmdbId: number, type: 'movie' | 'tv') => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Carica progresso salvato
    const savedProgress = localStorage.getItem(`${type}_${tmdbId}_progress`);
    if (savedProgress) {
      setProgress(parseInt(savedProgress));
    }
  }, [tmdbId, type]);

  const saveProgress = (currentTime: number, duration: number) => {
    const progressPercentage = Math.round((currentTime / duration) * 100);
    setProgress(progressPercentage);
    localStorage.setItem(`${type}_${tmdbId}_progress`, progressPercentage.toString());
  };

  return { progress, saveProgress };
};
```

## 🎨 **Styling e Layout**

### **1. Player Container**
```css
/* Container principale del player */
.player-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #000;
  overflow: hidden;
}

.player-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #000;
}

.player-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
```

### **2. Controls Styling**
```css
/* Styling dei controlli */
.player-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: 1rem;
  transition: opacity 0.3s ease;
}

.player-controls.hidden {
  opacity: 0;
  pointer-events: none;
}

.control-button {
  color: white;
  background: transparent;
  border: none;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
}

.control-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #B20710;
}
```

## 🚀 **Performance e Ottimizzazioni**

### **1. Lazy Loading**
```typescript
// Lazy loading per il player
const LazyPlayer = ({ src, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full h-full">
      {isVisible && (
        <iframe
          src={src}
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-full transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      )}
    </div>
  );
};
```

### **2. Error Handling**
```typescript
// Gestione errori del player
const PlayerErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Errore nel Player</h2>
          <p className="text-gray-300 mb-4">
            Si è verificato un errore durante la riproduzione
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            Ricarica Pagina
          </button>
        </div>
      </div>
    );
  }

  return children;
};
```

---

**Il sistema di riproduzione video di TheHustlePlace è progettato per offrire un'esperienza di streaming premium, con controlli avanzati, gestione intelligente degli errori e integrazione completa con le API di VixSrc.** 🎬✨
