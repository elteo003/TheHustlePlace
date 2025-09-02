# 🏠 Homepage - TheHustlePlace

## 🎯 **Panoramica**

La homepage di TheHustlePlace è il cuore dell'esperienza utente, progettata per offrire un'immediata immersione nel mondo dello streaming premium. Combina design elegante, performance ottimizzate e funzionalità avanzate.

## 🏗️ **Struttura della Homepage**

```
Homepage/
├── 🎬 Hero Section          # Film in evidenza
├── 📺 Popular Movies        # Film popolari
├── 🆕 Latest Releases       # Ultime uscite
├── ⭐ Top Rated             # Film meglio valutati
├── 📱 Popular TV Shows      # Serie TV popolari
└── 🎭 Footer                # Informazioni e link
```

## 🎬 **Hero Section**

### **Caratteristiche Principali**
- ✅ **Film in evidenza**: Contenuto principale sempre visibile
- ✅ **Background dinamico**: Immagine di sfondo del film
- ✅ **Overlay elegante**: Gradiente per migliorare la leggibilità
- ✅ **Call-to-action**: Pulsante "Guarda Ora" prominente

### **Implementazione**
```typescript
// Hero Section Component
const HeroSection = () => {
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedMovie = async () => {
      try {
        const response = await fetch('/api/catalog/popular/movies');
        const data = await response.json();
        if (data.success && data.data.results.length > 0) {
          setCurrentMovie(data.data.results[0]);
        }
      } catch (error) {
        console.error('Errore nel caricamento film in evidenza:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedMovie();
  }, []);

  if (isLoading) {
    return <HeroSkeleton />;
  }

  return (
    <section className="relative h-screen bg-gradient-to-r from-black via-gray-900 to-black">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={getImageUrl(currentMovie?.backdrop_path, 'w1280')}
          alt={currentMovie?.title || 'Film in evidenza'}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center h-full">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              {currentMovie?.title}
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-6 line-clamp-3">
              {currentMovie?.overview}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => window.location.href = `/player/movie/${currentMovie?.id}`}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Guarda Ora
              </button>
              <button className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-black transition-all duration-200">
                Aggiungi alla Lista
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
```

### **Animazioni Hero**
```css
/* Animazioni per la hero section */
.hero-title {
  animation: fadeInUp 0.8s ease forwards;
}

.hero-description {
  animation: fadeInUp 0.8s ease 0.2s forwards;
  opacity: 0;
}

.hero-buttons {
  animation: fadeInUp 0.8s ease 0.4s forwards;
  opacity: 0;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## 📺 **Sezioni di Contenuto**

### **1. Popular Movies**
```typescript
// Sezione film popolari
const PopularMovies = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPopularMovies = async () => {
      try {
        const response = await fetch('/api/catalog/popular/movies');
        const data = await response.json();
        if (data.success) {
          setMovies(data.data.results.slice(0, 10));
        }
      } catch (error) {
        console.error('Errore nel caricamento film popolari:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopularMovies();
  }, []);

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-white mb-8">Film Popolari</h2>
        {isLoading ? (
          <MovieGridSkeleton />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
        )}
      </div>
    </section>
  );
};
```

### **2. Latest Releases**
```typescript
// Sezione ultime uscite
const LatestReleases = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLatestMovies = async () => {
      try {
        const response = await fetch('/api/catalog/latest/movies');
        const data = await response.json();
        if (data.success) {
          setMovies(data.data.results.slice(0, 10));
        }
      } catch (error) {
        console.error('Errore nel caricamento ultime uscite:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestMovies();
  }, []);

  return (
    <section className="py-16 bg-gray-900/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-white mb-8">Ultime Uscite</h2>
        {isLoading ? (
          <MovieGridSkeleton />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
        )}
      </div>
    </section>
  );
};
```

### **3. Top Rated**
```typescript
// Sezione film meglio valutati
const TopRated = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTopRated = async () => {
      try {
        const response = await fetch('/api/catalog/top-rated/movies');
        const data = await response.json();
        if (data.success) {
          setMovies(data.data.results.slice(0, 10));
        }
      } catch (error) {
        console.error('Errore nel caricamento top rated:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopRated();
  }, []);

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-white mb-8">Migliori Valutati</h2>
        {isLoading ? (
          <MovieGridSkeleton />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
        )}
      </div>
    </section>
  );
};
```

## 🎭 **Componenti di Supporto**

### **1. Movie Card**
```typescript
// Card per film
const MovieCard = ({ movie }: { movie: Movie }) => {
  const handlePlay = () => {
    window.location.href = `/player/movie/${movie.id}`;
  };

  return (
    <div className="group relative bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
      <div className="aspect-[2/3] relative">
        <Image
          src={getImageUrl(movie.poster_path, 'w500')}
          alt={movie.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          priority={false}
          unoptimized={true}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
      </div>
      
      <div className="p-4">
        <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
          {movie.title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-yellow-400 text-sm">
            ⭐ {movie.vote_average.toFixed(1)}
          </span>
          <button
            onClick={handlePlay}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors duration-200"
          >
            Guarda
          </button>
        </div>
      </div>
    </div>
  );
};
```

### **2. Loading Skeletons**
```typescript
// Skeleton per caricamento
const MovieGridSkeleton = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="aspect-[2/3] bg-gray-700 animate-pulse" />
          <div className="p-4">
            <div className="h-4 bg-gray-700 rounded mb-2 animate-pulse" />
            <div className="h-3 bg-gray-700 rounded w-2/3 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};
```

## 🎨 **Styling e Layout**

### **1. Container Responsive**
```css
/* Container principale */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 640px) {
  .container { padding: 0 1.5rem; }
}

@media (min-width: 1024px) {
  .container { padding: 0 2rem; }
}
```

### **2. Grid System**
```css
/* Grid per film */
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

### **3. Typography**
```css
/* Tipografia homepage */
.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
  color: white;
}

@media (min-width: 768px) {
  .hero-title { font-size: 3rem; }
}

@media (min-width: 1024px) {
  .hero-title { font-size: 3.5rem; }
}

.section-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: white;
  margin-bottom: 2rem;
}
```

## 🚀 **Performance e Ottimizzazioni**

### **1. Lazy Loading**
```typescript
// Lazy loading per sezioni
const LazySection = ({ children, threshold = 0.1 }) => {
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
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref}>
      {isVisible ? children : <div className="h-96 bg-gray-800 animate-pulse" />}
    </div>
  );
};
```

### **2. Image Optimization**
```typescript
// Ottimizzazione immagini
const OptimizedImage = ({ src, alt, ...props }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-700 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        {...props}
      />
    </div>
  );
};
```

### **3. Caching Strategy**
```typescript
// Caching per API calls
const useCachedData = (key, fetcher, ttl = 300000) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem(key);
    const cachedTime = localStorage.getItem(`${key}_time`);

    if (cached && cachedTime && Date.now() - parseInt(cachedTime) < ttl) {
      setData(JSON.parse(cached));
      setIsLoading(false);
      return;
    }

    fetcher().then(result => {
      setData(result);
      setIsLoading(false);
      localStorage.setItem(key, JSON.stringify(result));
      localStorage.setItem(`${key}_time`, Date.now().toString());
    });
  }, [key, fetcher, ttl]);

  return { data, isLoading };
};
```

## 📱 **Responsive Design**

### **1. Mobile First**
```css
/* Mobile first approach */
.hero-section {
  height: 100vh;
  padding: 1rem;
}

@media (min-width: 768px) {
  .hero-section {
    padding: 2rem;
  }
}

@media (min-width: 1024px) {
  .hero-section {
    padding: 3rem;
  }
}
```

### **2. Touch Interactions**
```css
/* Touch interactions */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

.touch-feedback:active {
  transform: scale(0.95);
  transition: transform 0.1s ease;
}
```

## 🎯 **SEO e Meta Tags**

### **1. Meta Tags Dinamici**
```typescript
// Meta tags per homepage
export const metadata: Metadata = {
  title: 'TheHustlePlace - Streaming Premium',
  description: 'Scopri i migliori film e serie TV su TheHustlePlace. Streaming di qualità premium con contenuti sempre aggiornati.',
  keywords: 'streaming, film, serie tv, thehustleplace, premium',
  openGraph: {
    title: 'TheHustlePlace - Streaming Premium',
    description: 'Scopri i migliori film e serie TV su TheHustlePlace.',
    type: 'website',
    url: 'https://thehustleplace.com',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TheHustlePlace'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TheHustlePlace - Streaming Premium',
    description: 'Scopri i migliori film e serie TV su TheHustlePlace.',
    images: ['/twitter-image.jpg']
  }
};
```

---

**La homepage di TheHustlePlace è progettata per offrire un'esperienza di streaming premium, combinando design elegante, performance ottimizzate e funzionalità avanzate per un'esperienza utente di alto livello.** 🏠✨
