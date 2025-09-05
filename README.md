# TheHustlePlace 🎬

Un sito di streaming moderno e elegante, sviluppato con Next.js, TypeScript e Tailwind CSS. Una piattaforma premium per la visione di film e serie TV con un design ispirato a Netflix.

## ✨ Caratteristiche

- **🎨 Design Premium**: Interfaccia elegante e minimalista con animazioni fluide
- **📱 Responsive**: Ottimizzato per desktop, tablet e mobile
- **⚡ Performance**: Caricamento veloce e esperienza utente fluida
- **🔗 API Integration**: Integrazione con TMDB e VixSrc per contenuti reali
- **🎥 Player Video**: Player integrato con supporto per film e serie TV
- **🏆 Top 10**: Sezione dedicata ai migliori film con ranking stile Netflix
- **🎭 Hero Section**: Carosello dinamico con film appena usciti al cinema
- **🛡️ Error Handling**: Gestione robusta degli errori con fallback intelligenti
- **🔄 ID Mapping**: Sistema corretto di mapping tra ID interni e TMDB ID
- **⏱️ Timeout Management**: Gestione intelligente dei timeout per iframe esterni
- **🎬 Sezioni Multiple**: Titoli del momento, Aggiunti di recente, Prossime uscite
- **🎮 Navigazione Touch**: Scorrimento laterale con touchpad e mouse
- **🎨 Design Netflix**: Colori rossi e stile Netflix autentico
- **🔧 Debug Tools**: Sistema di debug integrato per sviluppo

## 🛠️ Tecnologie

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **API**: TMDB API, VixSrc API
- **Animazioni**: tailwindcss-animate
- **Icons**: Lucide React
- **Video**: HLS.js per streaming video
- **Error Handling**: React Error Boundaries

## 🚀 Setup

1. **Clona il repository**
   ```bash
   git clone https://github.com/elteo003/TheHustlePlace.git
   cd TheHustlePlace
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Configura le variabili d'ambiente**
   ```bash
   cp env.example .env.local
   ```
   
   Aggiungi la tua chiave API TMDB in `.env.local`:
   ```env
   # TMDB API Configuration
   TMDB_API_KEY=your-tmdb-api-key-here
   NEXT_PUBLIC_TMDB_API_KEY=your-tmdb-api-key-here
   
   # VixSrc Configuration
   VIXSRC_BASE_URL=https://vixsrc.to
   VIXSRC_PRIMARY_COLOR=B20710
   VIXSRC_SECONDARY_COLOR=170000
   VIXSRC_AUTOPLAY=false
   VIXSRC_LANG=it
   
   # Environment
   NODE_ENV=development
   ```

4. **Avvia il server di sviluppo**
   ```bash
   npm run dev
   ```

5. **Apri il browser**
   ```
   http://localhost:3000
   ```

## 📁 Struttura del Progetto

```
├── app/                    # App Router di Next.js
│   ├── api/               # API Routes
│   │   ├── catalog/       # API per catalogo film/serie
│   │   ├── player/        # API per player video
│   │   ├── tmdb/          # API TMDB wrapper
│   │   └── health/        # Health check
│   ├── player/            # Pagine del player
│   │   ├── movie/[id]/    # Player film
│   │   └── tv/[id]/       # Player serie TV
│   ├── movies/            # Pagina film
│   ├── tv/                # Pagina serie TV
│   ├── catalog/           # Pagina catalogo
│   └── page.tsx           # Homepage
├── components/            # Componenti React
│   ├── ui/               # Componenti UI base (shadcn/ui)
│   ├── hero-section.tsx  # Sezione hero principale
│   ├── hero-film.tsx     # Componente film hero
│   ├── hero-trailer.tsx  # Modal trailer
│   ├── movie-card.tsx    # Card film generica
│   ├── top-10-movie-card.tsx # Card Top 10
│   ├── movies-section.tsx # Sezione film con carousel
│   ├── content-carousel.tsx # Carousel orizzontale
│   ├── video-player.tsx  # Player video integrato
│   ├── error-boundary.tsx # Gestione errori React
│   └── hls-config-provider.tsx # Configurazione HLS.js
├── services/             # Servizi per API esterne
│   ├── catalog.service.ts
│   ├── tmdb.service.ts
│   ├── tmdb-movies.service.ts
│   ├── tmdb-wrapper.service.ts
│   ├── video-player.service.ts
│   └── vixsrc-scraper.service.ts
├── controllers/          # Controller per API
│   ├── catalog.controller.ts
│   └── player.controller.ts
├── middlewares/          # Middleware
│   ├── rate-limit.middleware.ts
│   └── validation.middleware.ts
├── types/                # Definizioni TypeScript
├── utils/                # Utility functions
│   ├── cache.ts
│   ├── logger.ts
│   ├── redis-cache.ts
│   └── hls-config.ts
├── hooks/                # React hooks personalizzati
├── doc/                  # Documentazione completa
└── public/               # File statici
```

## 🔌 API Endpoints

### Catalog
- `GET /api/catalog/now-playing` - Film appena usciti al cinema
- `GET /api/catalog/top-10` - Top 10 film
- `GET /api/catalog/popular/movies` - Film popolari
- `GET /api/catalog/popular/tv` - Serie TV popolari
- `GET /api/catalog/latest/movies` - Ultimi film
- `GET /api/catalog/latest/tv` - Ultime serie TV
- `GET /api/catalog/top-rated/movies` - Film meglio votati
- `GET /api/catalog/top-rated/tv` - Serie TV meglio votate
- `GET /api/catalog/movies` - Catalogo completo film
- `GET /api/catalog/tv` - Catalogo completo serie TV
- `GET /api/catalog/search/movies` - Ricerca film
- `GET /api/catalog/search/tv` - Ricerca serie TV
- `GET /api/catalog/genres` - Lista generi

### Player
- `GET /api/player/movie/[id]` - Video source per film
- `GET /api/player/tv/[id]` - Video source per serie TV
- `GET /api/player/tv/[id]/[season]/[episode]` - Video source per episodio specifico
- `GET /api/player/check-availability` - Verifica disponibilità contenuti su VixSrc
- `POST /api/player/generate-url` - Genera URL player personalizzato

### TMDB
- `GET /api/tmdb/movies` - Lista film TMDB
- `GET /api/tmdb/movies/[id]` - Dettagli film specifico

### Health Check
- `GET /api/health` - Stato del sistema

## 🎯 Funzionalità Principali

### Homepage
- **Hero Section**: Film in evidenza con trailer integrato
- **Top 10 Movies**: Ranking dei migliori film
- **Titoli del Momento**: Film trending
- **Aggiunti di Recente**: Ultimi film aggiunti
- **Prossime Uscite**: Film in arrivo
- **Navigazione Touch**: Scorrimento laterale con mouse/touchpad

### Player Video
- **Integrazione VixSrc**: Streaming diretto da VixSrc
- **Supporto Completo**: Film e serie TV
- **Controlli Nativi**: Play, pause, volume, fullscreen
- **Gestione Errori**: Fallback intelligenti e timeout
- **Compatibilità**: Rimozione sandbox per VixSrc
- **Personalizzazione**: Colori, lingua, autoplay

### Design System
- **Colori Netflix**: Palette rossa autentica
- **Componenti UI**: shadcn/ui per consistenza
- **Animazioni**: Transizioni fluide e moderne
- **Responsive**: Ottimizzato per tutti i dispositivi
- **Accessibilità**: Supporto per screen reader

## 🔧 Configurazione Avanzata

### Variabili d'Ambiente
```env
# TMDB API (Obbligatorio)
TMDB_API_KEY=your-tmdb-api-key
NEXT_PUBLIC_TMDB_API_KEY=your-tmdb-api-key

# VixSrc Player (Opzionale)
VIXSRC_BASE_URL=https://vixsrc.to
VIXSRC_PRIMARY_COLOR=B20710
VIXSRC_SECONDARY_COLOR=170000
VIXSRC_AUTOPLAY=false
VIXSRC_LANG=it

# Environment
NODE_ENV=development
```

### TMDB API Setup
1. Vai su [TMDB](https://www.themoviedb.org/)
2. Crea un account gratuito
3. Vai su Settings > API
4. Richiedi una API Key
5. Aggiungi la chiave in `.env.local`

### VixSrc
- Non richiede configurazione aggiuntiva
- Utilizzato per streaming video e catalog
- Compatibile con iframe senza sandbox

## 🚀 Deploy

### Vercel (Raccomandato)
1. Connetti il repository a Vercel
2. Aggiungi le variabili d'ambiente
3. Deploy automatico

### Altri Provider
- Netlify
- Railway
- Render

## 🐛 Troubleshooting

### Problemi Comuni
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

## 📚 Documentazione

Consulta la cartella `doc/` per documentazione dettagliata:
- [README Generale](doc/README.md)
- [Sistema di Design](doc/design-system.md)
- [Animazioni](doc/animations.md)
- [Homepage](doc/homepage.md)
- [Player](doc/player.md)
- [Sistema Player](doc/player-system.md)
- [Catalog](doc/catalog.md)
- [Sistema API](doc/api-system.md)
- [Integrazione API](doc/api-integration.md)
- [Configurazione](doc/configuration.md)
- [Infrastruttura](doc/infrastructure.md)
- [Troubleshooting](doc/troubleshooting.md)

## 🤝 Contribuire

1. Fork del repository
2. Crea un branch per la tua feature (`git checkout -b feature/amazing-feature`)
3. Commit delle modifiche (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Apri una Pull Request

## 📄 Licenza

Distribuito sotto licenza MIT. Vedi `LICENSE` per maggiori informazioni.

## 🙏 Ringraziamenti

- [TMDB](https://www.themoviedb.org/) per l'API dei film
- [VixSrc](https://vixsrc.to/) per lo streaming video
- [shadcn/ui](https://ui.shadcn.com/) per i componenti UI
- [Tailwind CSS](https://tailwindcss.com/) per lo styling
- [Next.js](https://nextjs.org/) per il framework

---

**TheHustlePlace** - La tua piattaforma di streaming premium 🎬✨