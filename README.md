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

## 🛠️ Tecnologie

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **API**: TMDB API, VixSrc API
- **Animazioni**: tailwindcss-animate
- **Icons**: Lucide React

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
   TMDB_API_KEY=your-tmdb-api-key-here
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
│   ├── player/            # Pagine del player
│   └── page.tsx           # Homepage
├── components/            # Componenti React
│   ├── ui/               # Componenti UI base
│   ├── hero-section.tsx  # Sezione hero
│   ├── movie-card.tsx    # Card film
│   └── top-10-movie-card.tsx # Card Top 10
├── services/             # Servizi per API esterne
│   ├── catalog.service.ts
│   ├── tmdb.service.ts
│   └── video-player.service.ts
├── types/                # Definizioni TypeScript
├── utils/                # Utility functions
├── doc/                  # Documentazione
└── public/               # File statici
```

## 🔌 API Endpoints

### Catalog (Tutte le route sono dinamiche per evitare errori di build)
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

### Health Check
- `GET /api/health` - Stato del sistema

## 🎯 Funzionalità Principali

### Hero Section
- Carosello dinamico con film appena usciti al cinema
- Navigazione con mouse wheel, touch swipe e frecce
- Transizioni fluide e animazioni eleganti

### Top 10 Film
- Sezione dedicata ai migliori film
- Ranking numerico in stile Netflix
- Design premium con overlay e effetti

### Player Video
- Integrazione con VixSrc per streaming
- Supporto per film e serie TV
- Parametri di personalizzazione (lingua, colori)
- Gestione errori intelligente con fallback
- Timeout management per iframe esterni
- Controlli nativi di VixSrc (senza duplicazioni)

## 📚 Documentazione

Consulta la cartella `doc/` per documentazione dettagliata:
- [README Generale](doc/README.md)
- [Sistema di Design](doc/design-system.md)
- [Animazioni](doc/animations.md)
- [Homepage](doc/homepage.md)
- [Player](doc/player.md)
- [Sistema Player](doc/player-system.md) - **NUOVO**
- [Catalog](doc/catalog.md)
- [Sistema API](doc/api-system.md) - **NUOVO**
- [Integrazione API](doc/api-integration.md)
- [Configurazione](doc/configuration.md)
- [Infrastruttura](doc/infrastructure.md)
- [Troubleshooting](doc/troubleshooting.md)

## 🔧 Configurazione

### TMDB API
1. Vai su [TMDB](https://www.themoviedb.org/)
2. Crea un account gratuito
3. Vai su Settings > API
4. Richiedi una API Key
5. Aggiungi la chiave in `.env.local`

### VixSrc
- Non richiede configurazione aggiuntiva
- Utilizzato per streaming video e catalog

## 🚀 Deploy

### Vercel (Raccomandato)
1. Connetti il repository a Vercel
2. Aggiungi le variabili d'ambiente
3. Deploy automatico

### Altri Provider
- Netlify
- Railway
- Render

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

---

**TheHustlePlace** - La tua piattaforma di streaming premium 🎬✨