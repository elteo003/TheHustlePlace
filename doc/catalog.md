# 📋 Catalogo - TheHustlePlace

## 🎯 **Panoramica**

Il sistema di catalogo di TheHustlePlace gestisce la visualizzazione e l'organizzazione di film e serie TV, integrando le API di VixSrc per gli ID reali e TMDB per i metadati completi. Offre filtri avanzati, paginazione e ricerca per un'esperienza utente ottimale.

## 🏗️ **Architettura del Catalogo**

```
Catalog System/
├── 📺 Movie Catalog          # Catalogo film
├── 🎬 TV Show Catalog        # Catalogo serie TV
├── 🔍 Search & Filters       # Ricerca e filtri
├── 📄 Pagination             # Paginazione
├── 🎨 Grid Layout            # Layout griglia
└── 📡 Data Management        # Gestione dati
```

## 📺 **Movie Catalog**

### **Caratteristiche Principali**
- ✅ **Dati reali**: Integrazione con VixSrc e TMDB
- ✅ **Filtri avanzati**: Genere, anno, valutazione
- ✅ **Paginazione**: Navigazione efficiente
- ✅ **Responsive**: Ottimizzato per tutti i dispositivi

### **Implementazione**
```typescript
// Movie Catalog Component
const MovieCatalog = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<CatalogFilters>({});

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          ...filters
        });

        const response = await fetch(`/api/catalog/movies?${queryParams}`);
        const data = await response.json();
        
        if (data.success) {
          setMovies(data.data.results);
          setTotalPages(data.data.total_pages);
        }
      } catch (error) {
        console.error('Errore nel caricamento film:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, [currentPage, filters]);

  const handleFilterChange = (newFilters: Partial<CatalogFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset alla prima pagina
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-white mb-4">Catalogo Film</h1>
          
          {/* Filtri */}
          <CatalogFilters
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>

      {/* Contenuto */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <MovieGridSkeleton />
        ) : (
          <>
            {/* Griglia film */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
              {movies.map((movie, index) => (
                <div
                  key={movie.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <MovieCard movie={movie} />
                </div>
              ))}
            </div>

            {/* Paginazione */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
};
```

## 🎬 **TV Show Catalog**

### **Caratteristiche Principali**
- ✅ **Gestione stagioni**: Visualizzazione episodi
- ✅ **Filtri specifici**: Anno, genere, stato
- ✅ **Layout ottimizzato**: Card dedicate per serie
- ✅ **Navigazione episodi**: Accesso diretto agli episodi

### **Implementazione**
```typescript
// TV Show Catalog Component
const TVShowCatalog = () => {
  const [tvShows, setTvShows] = useState<TVShow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<CatalogFilters>({});

  useEffect(() => {
    const fetchTVShows = async () => {
      try {
        setIsLoading(true);
        
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          ...filters
        });

        const response = await fetch(`/api/catalog/tv?${queryParams}`);
        const data = await response.json();
        
        if (data.success) {
          setTvShows(data.data.results);
          setTotalPages(data.data.total_pages);
        }
      } catch (error) {
        console.error('Errore nel caricamento serie TV:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTVShows();
  }, [currentPage, filters]);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-white mb-4">Catalogo Serie TV</h1>
          
          {/* Filtri */}
          <CatalogFilters
            filters={filters}
            onFilterChange={setFilters}
          />
        </div>
      </div>

      {/* Contenuto */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <TVShowGridSkeleton />
        ) : (
          <>
            {/* Griglia serie TV */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
              {tvShows.map((tvShow, index) => (
                <div
                  key={tvShow.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <TVShowCard tvShow={tvShow} />
                </div>
              ))}
            </div>

            {/* Paginazione */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
};
```

## 🔍 **Search & Filters**

### **Caratteristiche Principali**
- ✅ **Ricerca in tempo reale**: Filtri istantanei
- ✅ **Filtri multipli**: Combinazione di criteri
- ✅ **Persistenza**: Salvataggio preferenze
- ✅ **Reset facile**: Pulsante per azzerare

### **Implementazione**
```typescript
// Catalog Filters Component
const CatalogFilters = ({ filters, onFilterChange }) => {
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [selectedGenres, setSelectedGenres] = useState(filters.genres || []);
  const [yearRange, setYearRange] = useState({
    min: filters.year_min || 1900,
    max: filters.year_max || new Date().getFullYear()
  });
  const [ratingRange, setRatingRange] = useState({
    min: filters.rating_min || 0,
    max: filters.rating_max || 10
  });

  const genres = [
    { id: 28, name: 'Azione' },
    { id: 12, name: 'Avventura' },
    { id: 16, name: 'Animazione' },
    { id: 35, name: 'Commedia' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentario' },
    { id: 18, name: 'Dramma' },
    { id: 10751, name: 'Famiglia' },
    { id: 14, name: 'Fantasy' },
    { id: 36, name: 'Storia' },
    { id: 27, name: 'Horror' },
    { id: 10402, name: 'Musica' },
    { id: 9648, name: 'Mistero' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Fantascienza' },
    { id: 10770, name: 'TV Movie' },
    { id: 53, name: 'Thriller' },
    { id: 10752, name: 'Guerra' },
    { id: 37, name: 'Western' }
  ];

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onFilterChange({ search: value });
  };

  const handleGenreToggle = (genreId: number) => {
    const newGenres = selectedGenres.includes(genreId)
      ? selectedGenres.filter(id => id !== genreId)
      : [...selectedGenres, genreId];
    
    setSelectedGenres(newGenres);
    onFilterChange({ genres: newGenres });
  };

  const handleYearChange = (field: 'min' | 'max', value: number) => {
    const newYearRange = { ...yearRange, [field]: value };
    setYearRange(newYearRange);
    onFilterChange({
      year_min: newYearRange.min,
      year_max: newYearRange.max
    });
  };

  const handleRatingChange = (field: 'min' | 'max', value: number) => {
    const newRatingRange = { ...ratingRange, [field]: value };
    setRatingRange(newRatingRange);
    onFilterChange({
      rating_min: newRatingRange.min,
      rating_max: newRatingRange.max
    });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedGenres([]);
    setYearRange({ min: 1900, max: new Date().getFullYear() });
    setRatingRange({ min: 0, max: 10 });
    onFilterChange({});
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6">
      {/* Ricerca */}
      <div className="mb-6">
        <label className="block text-white font-semibold mb-2">Ricerca</label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Cerca film o serie TV..."
          className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
        />
      </div>

      {/* Genere */}
      <div className="mb-6">
        <label className="block text-white font-semibold mb-2">Genere</label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {genres.map(genre => (
            <button
              key={genre.id}
              onClick={() => handleGenreToggle(genre.id)}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                selectedGenres.includes(genre.id)
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {genre.name}
            </button>
          ))}
        </div>
      </div>

      {/* Anno */}
      <div className="mb-6">
        <label className="block text-white font-semibold mb-2">Anno</label>
        <div className="flex gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-1">Da</label>
            <input
              type="number"
              value={yearRange.min}
              onChange={(e) => handleYearChange('min', parseInt(e.target.value))}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-red-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">A</label>
            <input
              type="number"
              value={yearRange.max}
              onChange={(e) => handleYearChange('max', parseInt(e.target.value))}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Valutazione */}
      <div className="mb-6">
        <label className="block text-white font-semibold mb-2">Valutazione</label>
        <div className="flex gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-1">Min</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={ratingRange.min}
              onChange={(e) => handleRatingChange('min', parseFloat(e.target.value))}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-red-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">Max</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={ratingRange.max}
              onChange={(e) => handleRatingChange('max', parseFloat(e.target.value))}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={resetFilters}
        className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200"
      >
        Reset Filtri
      </button>
    </div>
  );
};
```

## 📄 **Pagination**

### **Caratteristiche Principali**
- ✅ **Navigazione intuitiva**: Pulsanti chiari
- ✅ **Info pagine**: Indicatore posizione
- ✅ **Jump to page**: Accesso diretto
- ✅ **Responsive**: Adattamento mobile

### **Implementazione**
```typescript
// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const [jumpToPage, setJumpToPage] = useState('');

  const handleJumpToPage = () => {
    const page = parseInt(jumpToPage);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      setJumpToPage('');
    }
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
      >
        ←
      </button>

      {/* Pages */}
      {getVisiblePages().map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={page === '...'}
          className={`px-3 py-2 rounded-lg transition-colors ${
            page === currentPage
              ? 'bg-red-600 text-white'
              : page === '...'
              ? 'text-gray-400 cursor-default'
              : 'bg-gray-800 text-white hover:bg-gray-700'
          }`}
        >
          {page}
        </button>
      ))}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
      >
        →
      </button>

      {/* Jump to page */}
      <div className="flex items-center gap-2 ml-4">
        <input
          type="number"
          value={jumpToPage}
          onChange={(e) => setJumpToPage(e.target.value)}
          placeholder="Vai a..."
          className="w-20 bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 focus:border-red-500 focus:outline-none"
        />
        <button
          onClick={handleJumpToPage}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
        >
          Vai
        </button>
      </div>
    </div>
  );
};
```

## 🎨 **Grid Layout**

### **Caratteristiche Principali**
- ✅ **Responsive**: Adattamento automatico
- ✅ **Lazy loading**: Caricamento on-demand
- ✅ **Animazioni**: Transizioni fluide
- ✅ **Accessibilità**: Navigazione da tastiera

### **Implementazione**
```typescript
// Movie Grid Component
const MovieGrid = ({ movies, isLoading }) => {
  const [visibleMovies, setVisibleMovies] = useState([]);
  const [loadedImages, setLoadedImages] = useState(new Set());

  useEffect(() => {
    if (movies.length > 0) {
      setVisibleMovies(movies.slice(0, 20)); // Carica prime 20
    }
  }, [movies]);

  const handleImageLoad = (movieId: number) => {
    setLoadedImages(prev => new Set([...prev, movieId]));
  };

  const loadMoreMovies = () => {
    const currentCount = visibleMovies.length;
    const nextBatch = movies.slice(currentCount, currentCount + 20);
    setVisibleMovies(prev => [...prev, ...nextBatch]);
  };

  if (isLoading) {
    return <MovieGridSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Griglia principale */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {visibleMovies.map((movie, index) => (
          <div
            key={movie.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <MovieCard
              movie={movie}
              onImageLoad={() => handleImageLoad(movie.id)}
              isLoaded={loadedImages.has(movie.id)}
            />
          </div>
        ))}
      </div>

      {/* Load more button */}
      {visibleMovies.length < movies.length && (
        <div className="text-center">
          <button
            onClick={loadMoreMovies}
            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            Carica Altri Film
          </button>
        </div>
      )}
    </div>
  );
};
```

## 📡 **Data Management**

### **Caratteristiche Principali**
- ✅ **Caching intelligente**: Riduzione chiamate API
- ✅ **Error handling**: Gestione errori robusta
- ✅ **Loading states**: Feedback utente
- ✅ **Data validation**: Controllo qualità dati

### **Implementazione**
```typescript
// Catalog Service
export class CatalogService {
  private readonly VIXSRC_BASE_URL = process.env.VIXSRC_BASE_URL || 'https://vixsrc.to';
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly vixsrcScraper: VixsrcScraperService;
  private readonly tmdbService: TMDBService;

  constructor() {
    this.vixsrcScraper = new VixsrcScraperService();
    this.tmdbService = new TMDBService();
  }

  async getMovies(filters: CatalogFilters = {}): Promise<PaginatedResponse<Movie>> {
    try {
      const cacheKey = this.generateCacheKey('movies', filters);
      const cached = await cache.get<PaginatedResponse<Movie>>(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch da VixSrc
      const response = await axios.get(`${this.VIXSRC_BASE_URL}/api/list/movie?lang=it`);

      if (response.status === 200 && Array.isArray(response.data)) {
        const tmdbIds = response.data.map((item: any) => item.tmdb_id);

        // Ottieni dettagli da TMDB
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

            // Fallback
            return this.createFallbackMovie(tmdbId);
          })
        );

        const result: PaginatedResponse<Movie> = {
          page: filters.page || 1,
          results: movies,
          total_pages: Math.ceil(tmdbIds.length / 20),
          total_results: tmdbIds.length
        };

        await cache.set(cacheKey, result, { ttl: this.CACHE_TTL });
        return result;
      }

      // Fallback a dati mock
      return this.getMockMoviesPaginated(filters.page);
    } catch (error) {
      logger.error('Errore nel recupero film', { error });
      return { page: 1, results: [], total_pages: 0, total_results: 0 };
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

  private generateCacheKey(type: string, filters: CatalogFilters): string {
    const filterString = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    
    return `catalog:${type}:${filterString}`;
  }
}
```

## 🎨 **Styling e Layout**

### **1. Grid System**
```css
/* Sistema griglia responsive */
.movie-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (min-width: 768px) {
  .movie-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 1024px) {
  .movie-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (min-width: 1280px) {
  .movie-grid { grid-template-columns: repeat(5, 1fr); }
}
```

### **2. Card Styling**
```css
/* Styling delle card */
.movie-card {
  background: #1a1a1a;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.movie-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.movie-card-image {
  aspect-ratio: 2/3;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.movie-card:hover .movie-card-image {
  transform: scale(1.05);
}
```

### **3. Filter Styling**
```css
/* Styling dei filtri */
.filter-container {
  background: rgba(17, 24, 39, 0.5);
  backdrop-filter: blur(8px);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.filter-input {
  background: #1f2937;
  color: white;
  border: 1px solid #374151;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  transition: border-color 0.2s ease;
}

.filter-input:focus {
  border-color: #B20710;
  outline: none;
}

.filter-button {
  background: #374151;
  color: #d1d5db;
  border: none;
  border-radius: 0.25rem;
  padding: 0.5rem 0.75rem;
  transition: all 0.2s ease;
}

.filter-button:hover {
  background: #4b5563;
}

.filter-button.active {
  background: #B20710;
  color: white;
}
```

## 🚀 **Performance e Ottimizzazioni**

### **1. Virtual Scrolling**
```typescript
// Virtual scrolling per grandi liste
const VirtualizedGrid = ({ items, itemHeight = 300 }) => {
  const [visibleItems, setVisibleItems] = useState([]);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(
        startIndex + Math.ceil(containerHeight / itemHeight) + 1,
        items.length
      );

      setVisibleItems(items.slice(startIndex, endIndex));
      setScrollTop(scrollTop);
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial load

    return () => container.removeEventListener('scroll', handleScroll);
  }, [items, itemHeight]);

  return (
    <div
      ref={containerRef}
      className="h-96 overflow-auto"
      style={{ height: items.length * itemHeight }}
    >
      <div style={{ height: scrollTop }} />
      {visibleItems.map((item, index) => (
        <div key={item.id} style={{ height: itemHeight }}>
          <MovieCard movie={item} />
        </div>
      ))}
    </div>
  );
};
```

### **2. Image Lazy Loading**
```typescript
// Lazy loading per immagini
const LazyImage = ({ src, alt, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className="relative">
      {isInView && (
        <Image
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      )}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-700 animate-pulse" />
      )}
    </div>
  );
};
```

---

**Il sistema di catalogo di TheHustlePlace è progettato per offrire un'esperienza di navigazione fluida e intuitiva, con filtri avanzati, paginazione efficiente e gestione intelligente dei dati per un'esperienza utente ottimale.** 📋✨
