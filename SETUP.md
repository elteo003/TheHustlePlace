# 🚀 Setup del Progetto TheHustlePlace

## 📋 Prerequisiti

- **Node.js 18+** (raccomandato 20+)
- **npm** o **yarn**
- **Account TMDB** (gratuito)
- **Connessione internet** per API esterne

## 🔑 Configurazione API Keys

### 1. Ottieni la TMDB API Key

1. Vai su [TMDB](https://www.themoviedb.org/settings/api)
2. Crea un account gratuito
3. Richiedi una API key (gratuita)
4. Copia la tua API key

### 2. Configura le variabili d'ambiente

1. Copia il file `.env.example` in `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Modifica `.env.local` e configura tutte le variabili:
   ```env
   # TMDB API Configuration (Obbligatorio)
   TMDB_API_KEY=your-tmdb-api-key-here
   NEXT_PUBLIC_TMDB_API_KEY=your-tmdb-api-key-here
   
   # VixSrc Configuration (Opzionale)
   VIXSRC_BASE_URL=https://vixsrc.to
   VIXSRC_PRIMARY_COLOR=B20710
   VIXSRC_SECONDARY_COLOR=170000
   VIXSRC_AUTOPLAY=false
   VIXSRC_LANG=it
   
   # Environment
   NODE_ENV=development
   ```

## 🚀 Avvio del progetto

### 1. Installa le dipendenze
```bash
npm install
```

### 2. Avvia il server di sviluppo
```bash
npm run dev
```

### 3. Apri il browser
```
http://localhost:3000
```

## 🎬 Funzionalità Principali

### Homepage
- **Hero Section** con film in evidenza e trailer
- **Top 10 Movies** con ranking numerico stile Netflix
- **Titoli del Momento** (trending)
- **Aggiunti di Recente** (latest)
- **Prossime Uscite** (upcoming)
- **Navigazione Touch** con scorrimento laterale

### Player Video
- **Integrazione VixSrc** per streaming diretto
- **Controlli Nativi** (play, pause, volume, fullscreen)
- **Gestione Errori** con fallback intelligenti
- **Compatibilità** senza sandbox per VixSrc
- **Personalizzazione** colori e lingua

### Design
- **Stile Netflix** con colori rossi autentici
- **Responsive** per tutti i dispositivi
- **Animazioni Fluide** e transizioni moderne
- **Componenti UI** shadcn/ui per consistenza

## 🔧 Configurazione Avanzata

### VixSrc Player

Il player VixSrc è configurato con:
- **Colori personalizzati**: Rosso Netflix (#B20710)
- **Lingua italiana**: Sottotitoli e interfaccia
- **Autoplay disabilitato**: Controllo manuale
- **URL personalizzati**: Per ogni film specifico

### Cache e Performance

- **Cache In-Memory**: Per dati TMDB
- **Redis Cache**: Opzionale per produzione
- **Timeout Management**: 10 secondi per API
- **Fallback**: Chiavi API multiple per ridondanza

### Error Handling

- **React Error Boundaries**: Gestione errori UI
- **Try-Catch**: Gestione errori asincroni
- **Fallback UI**: Interfaccia di fallback
- **Logging**: Monitoraggio completo

## 📱 Pagine Disponibili

- **`/`** - Homepage con sezioni multiple
- **`/movies`** - Pagina dedicata ai film
- **`/tv`** - Pagina dedicata alle serie TV
- **`/catalog`** - Catalogo completo
- **`/player/movie/[id]`** - Player film specifico
- **`/player/tv/[id]`** - Player serie TV specifica

## 🛠️ Comandi Disponibili

```bash
# Sviluppo
npm run dev          # Avvia server di sviluppo
npm run build        # Build per produzione
npm run start        # Avvia server di produzione
npm run lint         # Linting del codice

# Debug
npm run dev -- --debug    # Modalità debug
npm run build -- --debug  # Build con debug
```

## 🐛 Troubleshooting

### Problemi Comuni

#### 1. "TMDB_API_KEY non configurata"
```bash
# Verifica che la chiave sia in .env.local
cat .env.local | grep TMDB_API_KEY

# Riavvia il server dopo modifiche
npm run dev
```

#### 2. "Please disable sandbox"
- **Risolto**: Sandbox rimosso dagli iframe per compatibilità VixSrc

#### 3. "Film non disponibile"
- Verifica che il film esista su VixSrc
- Controlla i log del server per dettagli

#### 4. Film non si vedono
```bash
# Pulisci cache Next.js
rm -rf .next

# Reinstalla dipendenze
npm install

# Riavvia server
npm run dev
```

#### 5. Errori di build
```bash
# Pulisci tutto
rm -rf .next node_modules package-lock.json

# Reinstalla
npm install

# Riavvia
npm run dev
```

### Debug Mode

Per abilitare il debug:
```bash
# Server con debug
npm run dev -- --debug

# Build con debug
npm run build -- --debug
```

## 🔍 Verifica Configurazione

### Test API TMDB
```bash
# Testa l'endpoint TMDB
curl http://localhost:3000/api/tmdb/movies?type=popular
```

### Test VixSrc
```bash
# Testa disponibilità film
curl "http://localhost:3000/api/player/check-availability?tmdbId=755898&type=movie"
```

### Test Player
```bash
# Testa player specifico
curl http://localhost:3000/api/player/movie/755898
```

## 📊 Monitoraggio

### Log del Server
I log mostrano:
- ✅ **API Key Status**: Configurazione corretta
- 📊 **API Calls**: Chiamate a TMDB e VixSrc
- 🎬 **Film Data**: Dati recuperati
- ⚠️ **Errori**: Problemi e fallback

### Console Browser
- **Network Tab**: Chiamate API
- **Console**: Log JavaScript
- **Elements**: Struttura DOM

## 🚀 Deploy

### Vercel (Raccomandato)
1. Connetti repository a Vercel
2. Aggiungi variabili d'ambiente
3. Deploy automatico

### Altri Provider
- **Netlify**: Supporto Next.js
- **Railway**: Deploy semplice
- **Render**: Opzione gratuita

### Variabili Produzione
```env
TMDB_API_KEY=your-production-key
NEXT_PUBLIC_TMDB_API_KEY=your-production-key
NODE_ENV=production
```

## 📚 Documentazione

- [README Principale](../README.md)
- [Documentazione Completa](doc/README.md)
- [Troubleshooting](doc/troubleshooting.md)
- [API Integration](doc/api-integration.md)
- [Player System](doc/player-system.md)

## 🤝 Supporto

Per problemi o domande:
1. Consulta la documentazione
2. Verifica la configurazione
3. Controlla i log del server
4. Consulta la sezione troubleshooting

## 🎯 Note Importanti

- **Connessione Internet**: Richiesta per API TMDB e VixSrc
- **TMDB ID**: Il player funziona solo con ID TMDB validi
- **Immagini**: Caricate da TMDB CDN
- **VixSrc**: Non richiede configurazione aggiuntiva
- **Cache**: I dati vengono cachati per performance
- **Error Handling**: Fallback automatici per robustezza

---

**TheHustlePlace** - *Setup completo e funzionale* 🚀✨