# Configurazione del Progetto

## Panoramica

Questo documento descrive come configurare e personalizzare TheHustlePlace per il tuo ambiente di sviluppo e produzione.

## Variabili d'Ambiente

### File di Configurazione

Il progetto utilizza due file per le variabili d'ambiente:

- **`.env`** - Configurazione generale (usato da Prisma se presente)
- **`.env.local`** - Configurazione locale (priorità più alta, non committato)

### Variabili Richieste

#### TMDB API Key
```bash
TMDB_API_KEY=your-tmdb-api-key-here
```

**Come ottenere la chiave TMDB:**
1. Vai su [TMDB](https://www.themoviedb.org/)
2. Crea un account gratuito
3. Vai su Settings > API
4. Richiedi una API Key
5. Copia la chiave e sostituisci `your-tmdb-api-key-here`

#### VixSrc Configuration
```bash
VIXSRC_BASE_URL=https://vixsrc.to
```

**Nota:** Questa è l'URL base per l'API VixSrc. Non richiede autenticazione.

### Variabili Opzionali

#### Cache Configuration
```bash
CACHE_TTL=3600
CACHE_MAX_SIZE=1000
```

- `CACHE_TTL`: Durata della cache in secondi (default: 3600 = 1 ora)
- `CACHE_MAX_SIZE`: Numero massimo di elementi in cache (default: 1000)

## Configurazione del Server

### Porta di Sviluppo

Il server di sviluppo Next.js utilizza la porta 3000 di default. Se occupata, Next.js proverà automaticamente la porta 3001.

Per forzare una porta specifica:
```bash
npm run dev -- -p 3002
```

### Configurazione Next.js

Il file `next.config.js` contiene le configurazioni principali:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurazioni personalizzate
}

module.exports = nextConfig
```

## Configurazione Tailwind CSS

### File di Configurazione

Il file `tailwind.config.js` definisce:
- Colori personalizzati
- Font families
- Breakpoints
- Animazioni

### Personalizzazione Colori

Per modificare la palette colori, aggiorna il file `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          // I tuoi colori personalizzati
        }
      }
    }
  }
}
```

## Configurazione delle API

### VixSrc API

L'integrazione con VixSrc non richiede configurazione aggiuntiva oltre all'URL base.

**Endpoint utilizzati:**
- `/api/list/movie?lang=it` - Lista film
- `/api/list/tv?lang=it` - Lista serie TV
- `/movie/{id}` - Player film
- `/tv/{id}/{season}/{episode}` - Player serie TV

### TMDB API

Richiede una chiave API valida per funzionare correttamente.

**Endpoint utilizzati:**
- `/movie/{id}?api_key={key}&language=it` - Dettagli film
- `/tv/{id}?api_key={key}&language=it` - Dettagli serie TV

## Configurazione del Player

### Parametri VixSrc

Il player VixSrc supporta diversi parametri di personalizzazione:

```typescript
const params = new URLSearchParams({
  lang: 'it',                    // Lingua italiana
  autoplay: 'false',            // Autoplay disabilitato
  primaryColor: 'B20710',       // Colore primario (rosso)
  secondaryColor: '170000'      // Colore secondario (rosso scuro)
})
```

### Personalizzazione Colori Player

Per modificare i colori del player, aggiorna il file `services/video-player.service.ts`:

```typescript
const params = new URLSearchParams({
  lang: 'it',
  autoplay: 'false',
  primaryColor: 'YOUR_COLOR',      // Sostituisci con il tuo colore
  secondaryColor: 'YOUR_COLOR'     // Sostituisci con il tuo colore
})
```

## Configurazione Cache

### Cache in Memoria

Il sistema utilizza una cache in memoria per ottimizzare le performance:

```typescript
// Configurazione cache
const CACHE_TTL = 3600 // 1 ora
const CACHE_MAX_SIZE = 1000 // 1000 elementi
```

### Gestione Cache

La cache viene gestita automaticamente dal sistema, ma puoi:

1. **Pulire la cache:** Riavvia il server di sviluppo
2. **Modificare TTL:** Aggiorna la variabile `CACHE_TTL`
3. **Monitorare la cache:** Controlla i log del server

## Configurazione di Produzione

### Build di Produzione

```bash
npm run build
npm start
```

### Variabili di Produzione

Assicurati di configurare le variabili d'ambiente nel tuo servizio di hosting:

- `TMDB_API_KEY` - Chiave API TMDB
- `VIXSRC_BASE_URL` - URL base VixSrc
- `CACHE_TTL` - Durata cache (opzionale)

### Hosting Consigliato

Il progetto è ottimizzato per:
- **Vercel** (raccomandato per Next.js)
- **Netlify**
- **Render**
- **Railway**

## Troubleshooting

### Problemi Comuni

#### 1. TMDB API Key Non Valida
```
Errore: 401 Unauthorized
```
**Soluzione:** Verifica che la chiave API TMDB sia corretta e attiva.

#### 2. VixSrc Non Raggiungibile
```
Errore: Network Error
```
**Soluzione:** Verifica la connessione internet e l'URL di VixSrc.

#### 3. Cache Piena
```
Errore: Cache overflow
```
**Soluzione:** Riavvia il server o riduci `CACHE_MAX_SIZE`.

#### 4. Porta Occupata
```
Error: Port 3000 is in use
```
**Soluzione:** Usa una porta diversa o termina il processo che occupa la porta.

### Log di Debug

Per abilitare i log dettagliati, controlla la console del browser e i log del server.

I log includono:
- Richieste API
- Errori di cache
- Problemi di caricamento
- Performance metrics

## Personalizzazione Avanzata

### Modifica del Branding

Per personalizzare il branding:

1. **Logo:** Sostituisci il file in `public/`
2. **Colori:** Modifica `tailwind.config.js`
3. **Testi:** Aggiorna i componenti React
4. **Favicon:** Sostituisci `public/favicon.ico`

### Aggiunta di Nuove Funzionalità

Per aggiungere nuove funzionalità:

1. **API Routes:** Crea nuovi file in `app/api/`
2. **Servizi:** Aggiungi servizi in `services/`
3. **Componenti:** Crea componenti in `components/`
4. **Pagine:** Aggiungi pagine in `app/`

### Integrazione con Altri Servizi

Il progetto è progettato per essere facilmente estendibile:

- **Database:** Aggiungi Prisma per persistenza dati
- **Autenticazione:** Integra provider OAuth
- **Analytics:** Aggiungi Google Analytics o similari
- **CDN:** Configura un CDN per le immagini

## Supporto

Per problemi o domande:

1. Controlla questo documento
2. Verifica i log di errore
3. Consulta la documentazione delle API esterne
4. Controlla i file di configurazione

---

**Nota:** Questo documento viene aggiornato regolarmente. Assicurati di avere la versione più recente.
