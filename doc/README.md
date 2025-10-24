# 🎬 TheHustlePlace - Documentazione Completa

## 📋 **Panoramica del Progetto**

TheHustlePlace è una piattaforma di streaming premium sviluppata con Next.js 14, TypeScript e Tailwind CSS. Il progetto integra le API di VixSrc per la riproduzione video e TMDB per i metadati dei contenuti, offrendo un'esperienza di streaming completa e moderna.

## 🏗️ **Architettura del Sistema**

```
TheHustlePlace/
├── 📁 app/                    # App Router di Next.js 14
│   ├── 📁 api/               # API Routes (catalog, player, tmdb)
│   ├── 📁 player/            # Pagine player (movie, tv)
│   ├── 📁 movies/            # Pagina film
│   ├── 📁 tv/                # Pagina serie TV
│   ├── 📁 catalog/           # Pagina catalogo
│   └── 📄 page.tsx           # Homepage principale
├── 📁 components/             # Componenti React riutilizzabili
│   ├── 📁 ui/                # Componenti UI base (shadcn/ui)
│   ├── 📄 hero-section.tsx   # Sezione hero principale
│   ├── 📄 hero-film.tsx      # Componente film hero
│   ├── 📄 hero-trailer.tsx   # Modal trailer
│   ├── 📄 movie-card.tsx     # Card film generica
│   ├── 📄 top-10-movie-card.tsx # Card Top 10
│   ├── 📄 movies-section.tsx # Sezione film con carousel
│   ├── 📄 content-carousel.tsx # Carousel orizzontale
│   ├── 📄 video-player.tsx   # Player video integrato
│   ├── 📄 error-boundary.tsx # Gestione errori React
│   └── 📄 hls-config-provider.tsx # Configurazione HLS.js
├── 📁 services/               # Logica di business e integrazioni API
│   ├── 📄 catalog.service.ts
│   ├── 📄 tmdb.service.ts
│   ├── 📄 tmdb-movies.service.ts
│   ├── 📄 tmdb-wrapper.service.ts
│   ├── 📄 video-player.service.ts
│   └── 📄 vixsrc-scraper.service.ts
├── 📁 controllers/            # Gestori delle richieste API
│   ├── 📄 catalog.controller.ts
│   └── 📄 player.controller.ts
├── 📁 middlewares/            # Middleware per validazione e rate limiting
├── 📁 utils/                  # Utility e helper
│   ├── 📄 cache.ts
│   ├── 📄 logger.ts
│   ├── 📄 redis-cache.ts
│   └── 📄 hls-config.ts
├── 📁 types/                  # Definizioni TypeScript
├── 📁 hooks/                  # React hooks personalizzati
├── 📁 public/                 # Asset statici
└── 📁 doc/                    # Documentazione completa
```

## 🎯 **Caratteristiche Principali**

- ✅ **Streaming Video**: Integrazione completa con VixSrc
- ✅ **Catalogo Dinamico**: Film e serie TV aggiornati automaticamente
- ✅ **Design Premium**: UI elegante e minimalista in stile Netflix
- ✅ **Responsive**: Ottimizzato per tutti i dispositivi
- ✅ **Performance**: Caching intelligente e ottimizzazioni
- ✅ **SEO Friendly**: Meta tag e routing ottimizzati
- ✅ **Error Handling**: Gestione robusta degli errori con fallback
- ✅ **Touch Navigation**: Scorrimento laterale con mouse/touchpad
- ✅ **Multiple Sections**: Titoli del momento, Aggiunti di recente, Prossime uscite
- ✅ **Debug Tools**: Sistema di debug integrato per sviluppo

## 🚀 **Tecnologie Utilizzate**

### **Frontend**
- **Next.js 14.2.32** - Framework React con App Router
- **TypeScript** - Tipizzazione statica
- **Tailwind CSS** - Framework CSS utility-first
- **shadcn/ui** - Componenti UI pre-costruiti
- **Lucide React** - Icone moderne
- **HLS.js** - Streaming video adattivo

### **Backend**
- **Next.js API Routes** - Endpoint server-side
- **Axios** - Client HTTP per chiamate API
- **Zod** - Validazione dei dati
- **Redis** - Caching (opzionale)

### **Integrazioni Esterne**
- **VixSrc API** - Streaming video e catalogo
- **TMDB API** - Metadati film e serie TV

### **Error Handling**
- **React Error Boundaries** - Gestione errori UI
- **Try-Catch** - Gestione errori asincroni
- **Fallback UI** - Interfaccia di fallback

## 📚 **Documentazione Disponibile**

### 🎯 **Guide Principali**
- [🎨 **Design System**](./design-system.md) - Stili, colori e componenti UI
- [🎭 **Animazioni**](./animations.md) - Transizioni e effetti visivi
- [🏠 **Homepage**](./homepage.md) - Struttura e funzionalità della home
- [📺 **Player**](./player.md) - Sistema di riproduzione video
- [📋 **Catalogo**](./catalog.md) - Gestione film e serie TV
- [🔧 **API Integration**](./api-integration.md) - VixSrc e TMDB APIs

### 🔧 **Guide Tecniche**
- [⚙️ **Configurazione**](./configuration.md) - Setup e variabili ambiente
- [🏗️ **Infrastruttura**](./infrastructure.md) - Architettura del sistema
- [🎬 **Player System**](./player-system.md) - Sistema player avanzato
- [📊 **API System**](./api-system.md) - Sistema API completo
- [🏗️ **Architecture Diagrams**](./architecture-diagrams.md) - Diagrammi Mermaid completi

### 🐛 **Debug e Troubleshooting**
- [🐛 **Troubleshooting**](./troubleshooting.md) - Risoluzione problemi
- [📝 **Recent Updates**](./recent-updates.md) - Ultimi aggiornamenti e miglioramenti

### 📚 **Navigazione e Indici**
- [📋 **INDEX**](./INDEX.md) - Indice completo di tutta la documentazione
- [📊 **Documentation Summary**](./DOCUMENTATION_SUMMARY.md) - Riepilogo completo della documentazione

## 🛠️ **Setup Rapido**

1. **Clona il repository**
   ```bash
   git clone https://github.com/elteo003/TheHustlePlace.git
   cd TheHustlePlace
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Configura le variabili ambiente**
   ```bash
   cp env.example .env.local
   ```
   
   Aggiungi la tua chiave API TMDB:
   ```env
   TMDB_API_KEY=your-tmdb-api-key-here
   NEXT_PUBLIC_TMDB_API_KEY=your-tmdb-api-key-here
   ```

4. **Avvia il server**
   ```bash
   npm run dev
   ```

5. **Apri il browser**
   ```
   http://localhost:3000
   ```

## 📖 **Come Usare**

### **Per Sviluppatori**
- Leggi la [documentazione delle API](./api-integration.md)
- Consulta il [design system](./design-system.md)
- Studia gli [esempi di animazioni](./animations.md)
- Esplora il [sistema player](./player-system.md)

### **Per Configurazione**
- Segui la [guida di configurazione](./configuration.md)
- Configura le chiavi API necessarie
- Personalizza i colori e le impostazioni
- Consulta il [troubleshooting](./troubleshooting.md) per problemi comuni

### **Per Deploy**
- Leggi la [documentazione infrastruttura](./infrastructure.md)
- Configura le variabili d'ambiente per produzione
- Segui le best practice per il deploy

## 🎨 **Design Philosophy**

TheHustlePlace segue i principi di design di Netflix e piattaforme premium:
- **Minimalismo**: Interfaccia pulita e focalizzata
- **Eleganza**: Transizioni fluide e dettagli curati
- **Performance**: Caricamento veloce e esperienza fluida
- **Accessibilità**: Compatibile con tutti i dispositivi
- **Consistenza**: Design system unificato
- **Usabilità**: Navigazione intuitiva e touch-friendly

## 🔄 **Aggiornamenti Recenti**

### **v2.0.0 - Major Update**
- ✅ Aggiunta sezioni multiple (Titoli del momento, Aggiunti di recente)
- ✅ Implementata navigazione touch per carousel
- ✅ Riorganizzato design system con colori Netflix
- ✅ Migliorato sistema di gestione errori
- ✅ Ottimizzato player video per VixSrc
- ✅ Aggiunto sistema di debug integrato
- ✅ Risolti problemi di compatibilità iframe

### **v1.5.0 - Player Improvements**
- ✅ Integrazione completa con VixSrc
- ✅ Rimozione sandbox per compatibilità
- ✅ Gestione errori migliorata
- ✅ Timeout management per iframe

### **v1.0.0 - Initial Release**
- ✅ Base Next.js 14 con TypeScript
- ✅ Integrazione TMDB API
- ✅ Design system base
- ✅ Player video funzionale

## 🐛 **Troubleshooting**

### **Problemi Comuni**
1. **"TMDB_API_KEY non configurata"**
   - Verifica che la chiave sia in `.env.local`
   - Riavvia il server dopo le modifiche

2. **"Please disable sandbox"**
   - Risolto: sandbox rimosso dagli iframe

3. **"Film non disponibile"**
   - Verifica che il film esista su VixSrc
   - Controlla i log del server

4. **Film non si vedono**
   - Pulisci la cache: `rm -rf .next`
   - Reinstalla: `npm install`
   - Riavvia: `npm run dev`

Per maggiori dettagli, consulta [Troubleshooting](./troubleshooting.md).

## 📞 **Supporto**

Per domande o problemi:
1. Consulta la documentazione specifica
2. Verifica la configurazione
3. Controlla i log del server
4. Consulta la sezione troubleshooting

## 🤝 **Contribuire**

1. Fork del repository
2. Crea un branch per la tua feature
3. Implementa le modifiche
4. Testa le funzionalità
5. Apri una Pull Request

---

**TheHustlePlace** - *Streaming di qualità premium* 🎬✨