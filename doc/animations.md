# 🎭 Animazioni e Transizioni - TheHustlePlace

## 🎯 **Filosofia delle Animazioni**

Le animazioni in TheHustlePlace sono progettate per:
- ✅ **Migliorare l'UX**: Feedback visivo immediato
- ✅ **Creare fluidità**: Transizioni naturali e piacevoli
- ✅ **Guidare l'attenzione**: Evidenziare elementi importanti
- ✅ **Mantenere l'eleganza**: Semplicità e raffinatezza

## 🎨 **Tipologie di Animazioni**

### **1. Hover Effects**

#### **Movie Cards**
```typescript
// Hover con scale e shadow
<div className="group relative bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
  <div className="aspect-[2/3] relative">
    <Image
      src={posterPath}
      alt={title}
      fill
      className="object-cover group-hover:scale-105 transition-transform duration-300"
    />
  </div>
</div>
```

**Caratteristiche:**
- ✅ **Scale**: 1.05x su hover
- ✅ **Shadow**: Aumento dell'ombra
- ✅ **Duration**: 300ms per fluidità

#### **Buttons**
```typescript
// Hover con cambio colore
<button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200">
  Guarda Ora
</button>
```

**Caratteristiche:**
- ✅ **Color transition**: Rosso 600 → 700
- ✅ **Duration**: 200ms per reattività
- ✅ **Smooth**: Easing naturale

### **2. Page Transitions**

#### **Fade In/Out**
```css
/* Transizione di pagina */
.page-transition {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-enter {
  opacity: 0;
  transform: translateY(20px);
}

.page-enter-active {
  opacity: 1;
  transform: translateY(0);
}

.page-exit {
  opacity: 1;
  transform: translateY(0);
}

.page-exit-active {
  opacity: 0;
  transform: translateY(-20px);
}
```

#### **Slide Transitions**
```css
/* Slide da destra */
.slide-right-enter {
  transform: translateX(100%);
  opacity: 0;
}

.slide-right-enter-active {
  transform: translateX(0);
  opacity: 1;
  transition: transform 0.3s ease, opacity 0.3s ease;
}
```

### **3. Loading Animations**

#### **Skeleton Loading**
```css
/* Skeleton per immagini */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

#### **Spinner Loading**
```css
/* Spinner rotante */
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #B20710;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### **4. Micro-interactions**

#### **Button Press**
```css
/* Effetto press */
.button-press {
  transition: transform 0.1s ease;
}

.button-press:active {
  transform: scale(0.95);
}
```

#### **Input Focus**
```css
/* Focus su input */
.input-focus {
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input-focus:focus {
  border-color: #B20710;
  box-shadow: 0 0 0 3px rgba(178, 7, 16, 0.1);
}
```

## 🎬 **Animazioni Specifiche per Componenti**

### **1. Hero Section**

#### **Parallax Effect**
```typescript
// Effetto parallax per background
useEffect(() => {
  const handleScroll = () => {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.parallax-bg');
    if (parallax) {
      parallax.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

#### **Text Reveal**
```css
/* Rivelazione testo */
.text-reveal {
  opacity: 0;
  transform: translateY(30px);
  animation: reveal 0.8s ease forwards;
}

@keyframes reveal {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### **2. Movie Grid**

#### **Staggered Animation**
```typescript
// Animazione a scaglioni per le card
const MovieGrid = ({ movies }) => {
  return (
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
  );
};
```

```css
/* Animazione fade in up */
.animate-fade-in-up {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.6s ease forwards;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### **3. Video Player**

#### **Player Controls**
```css
/* Controlli player */
.player-controls {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.player:hover .player-controls {
  opacity: 1;
  transform: translateY(0);
}
```

#### **Progress Bar**
```css
/* Barra di progresso */
.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #B20710;
  transition: width 0.1s ease;
}
```

## 🎯 **Performance e Ottimizzazioni**

### **1. GPU Acceleration**
```css
/* Forza accelerazione GPU */
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform;
}
```

### **2. Reduced Motion**
```css
/* Rispetta preferenze utente */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### **3. Intersection Observer**
```typescript
// Animazioni solo quando visibili
const useIntersectionObserver = (ref, options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [ref, options]);

  return isIntersecting;
};
```

## 🎨 **Easing Functions**

### **1. Standard Easing**
```css
/* Easing personalizzati */
.ease-in-out-cubic {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.ease-out-back {
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}

.ease-in-out-expo {
  transition-timing-function: cubic-bezier(0.87, 0, 0.13, 1);
}
```

### **2. Custom Easing**
```css
/* Easing per specifici componenti */
.movie-card-ease {
  transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.button-ease {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

## 🎭 **Animazioni Avanzate**

### **1. Morphing**
```css
/* Morphing tra stati */
.morph-button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.morph-button:hover {
  border-radius: 50px;
  padding: 12px 24px;
}
```

### **2. Particle Effects**
```typescript
// Effetti particelle per background
const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const particles: Particle[] = [];

    // Logica particelle...
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0" />;
};
```

### **3. 3D Transforms**
```css
/* Trasformazioni 3D */
.card-3d {
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
}

.card-3d:hover {
  transform: rotateY(10deg) rotateX(5deg);
}
```

## 📱 **Animazioni Mobile**

### **1. Touch Feedback**
```css
/* Feedback touch */
.touch-feedback {
  transition: transform 0.1s ease;
}

.touch-feedback:active {
  transform: scale(0.95);
}
```

### **2. Swipe Gestures**
```typescript
// Gesture di swipe
const useSwipe = (onSwipeLeft, onSwipeRight) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) onSwipeLeft();
    if (isRightSwipe) onSwipeRight();
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
};
```

## 🎯 **Best Practices**

### **1. Performance**
- ✅ **Usa transform e opacity**: Più performanti di width/height
- ✅ **Evita layout thrashing**: Non animare proprietà che causano reflow
- ✅ **Usa will-change**: Solo quando necessario
- ✅ **Debounce scroll events**: Per evitare troppe chiamate

### **2. Accessibility**
- ✅ **Rispetta prefers-reduced-motion**: Per utenti sensibili
- ✅ **Mantieni focus states**: Per navigazione da tastiera
- ✅ **Evita animazioni eccessive**: Che possono causare vertigini

### **3. UX**
- ✅ **Durata appropriata**: 200-300ms per micro-interactions
- ✅ **Easing naturale**: Usa curve di Bézier appropriate
- ✅ **Feedback immediato**: Per azioni dell'utente
- ✅ **Consistenza**: Stesso stile in tutta l'app

---

**Le animazioni di TheHustlePlace sono progettate per creare un'esperienza fluida e piacevole, mantenendo sempre la performance e l'accessibilità come priorità.** 🎭✨
