# 🎨 Design System - TheHustlePlace

## 🎯 **Filosofia del Design**

TheHustlePlace segue i principi di design di **Apple** e **Ferrari**:
- **Minimalismo elegante**: Interfaccia pulita e focalizzata
- **Premium feel**: Qualità visiva di alto livello
- **User-centric**: Esperienza utente ottimizzata
- **Performance**: Caricamento veloce e fluido

## 🎨 **Palette Colori**

### **Colori Primari**
```css
/* Rosso Netflix-style */
--primary-red: #B20710
--primary-red-dark: #8B0000
--primary-red-light: #E50914

/* Nero elegante */
--black: #000000
--black-soft: #141414
--black-medium: #1A1A1A

/* Grigio sofisticato */
--gray-dark: #2F2F2F
--gray-medium: #4A4A4A
--gray-light: #8A8A8A
```

### **Colori di Accento**
```css
/* Bianco puro */
--white: #FFFFFF
--white-soft: #F5F5F5

/* Trasparenze */
--glass-bg: rgba(0, 0, 0, 0.8)
--overlay-bg: rgba(0, 0, 0, 0.6)
```

## 🏗️ **Componenti UI**

### **1. Navbar**
```typescript
// Componente principale di navigazione
<nav className="bg-black/90 backdrop-blur-md border-b border-gray-800">
  <div className="container mx-auto px-4">
    <div className="flex items-center justify-between h-16">
      {/* Logo e navigazione */}
    </div>
  </div>
</nav>
```

**Caratteristiche:**
- ✅ **Glass morphism**: Sfondo trasparente con blur
- ✅ **Border sottile**: Separazione elegante
- ✅ **Responsive**: Adattamento mobile

### **2. Hero Section**
```typescript
// Sezione hero con film in evidenza
<section className="relative h-screen bg-gradient-to-r from-black via-gray-900 to-black">
  <div className="absolute inset-0 bg-black/50" />
  <div className="relative z-10 flex items-center h-full">
    {/* Contenuto hero */}
  </div>
</section>
```

**Caratteristiche:**
- ✅ **Gradient background**: Transizione elegante
- ✅ **Overlay scuro**: Migliora la leggibilità
- ✅ **Full height**: Impatto visivo massimo

### **3. Movie Cards**
```typescript
// Card per film e serie TV
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
- ✅ **Hover effects**: Scale e shadow
- ✅ **Aspect ratio**: Proporzioni corrette
- ✅ **Smooth transitions**: Animazioni fluide

### **4. Buttons**
```typescript
// Pulsanti principali
<button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200">
  Guarda Ora
</button>
```

**Caratteristiche:**
- ✅ **Colori consistenti**: Rosso primario
- ✅ **Hover states**: Feedback visivo
- ✅ **Typography**: Font semibold

## 🎭 **Animazioni e Transizioni**

### **1. Hover Effects**
```css
/* Scale su hover */
.hover-scale {
  transition: transform 0.3s ease;
}
.hover-scale:hover {
  transform: scale(1.05);
}

/* Shadow su hover */
.hover-shadow {
  transition: box-shadow 0.3s ease;
}
.hover-shadow:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

### **2. Page Transitions**
```css
/* Transizioni di pagina */
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
```

### **3. Loading States**
```css
/* Skeleton loading */
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

## 📱 **Responsive Design**

### **Breakpoints**
```css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

### **Grid System**
```typescript
// Grid responsive per film
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
  {movies.map(movie => (
    <MovieCard key={movie.id} movie={movie} />
  ))}
</div>
```

## 🎨 **Typography**

### **Font Stack**
```css
/* Font principale */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font per titoli */
font-family: 'Playfair Display', serif;
```

### **Scale Tipografica**
```css
/* Heading 1 */
.text-4xl md:text-5xl lg:text-6xl font-bold

/* Heading 2 */
.text-2xl md:text-3xl lg:text-4xl font-semibold

/* Body text */
.text-base md:text-lg

/* Small text */
.text-sm text-gray-400
```

## 🌟 **Effetti Speciali**

### **1. Glass Morphism**
```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### **2. Gradient Overlays**
```css
.gradient-overlay {
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(0, 0, 0, 0.3) 50%,
    rgba(0, 0, 0, 0.8) 100%
  );
}
```

### **3. Parallax Effects**
```css
.parallax {
  transform: translateZ(0);
  will-change: transform;
}
```

## 🎯 **Best Practices**

### **1. Performance**
- ✅ **Lazy loading**: Immagini caricate on-demand
- ✅ **Image optimization**: Next.js Image component
- ✅ **CSS purging**: Tailwind CSS ottimizzato

### **2. Accessibility**
- ✅ **Contrast ratio**: Minimo 4.5:1
- ✅ **Focus states**: Navigazione da tastiera
- ✅ **Alt text**: Descrizioni per immagini

### **3. SEO**
- ✅ **Meta tags**: Ottimizzati per ogni pagina
- ✅ **Structured data**: Schema markup
- ✅ **Open Graph**: Condivisione social

## 🔧 **Personalizzazione**

### **Variabili CSS**
```css
:root {
  --primary-color: #B20710;
  --secondary-color: #170000;
  --accent-color: #E50914;
  --text-color: #FFFFFF;
  --bg-color: #000000;
}
```

### **Tailwind Config**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          500: '#B20710',
          600: '#8B0000',
          700: '#E50914',
        }
      }
    }
  }
}
```

---

**Il design system di TheHustlePlace è progettato per offrire un'esperienza visiva premium e moderna, mantenendo la semplicità e l'eleganza che caratterizzano i brand di lusso.** 🎨✨
