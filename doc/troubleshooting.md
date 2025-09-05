# 🔧 Troubleshooting Guide

Questa guida ti aiuterà a risolvere i problemi più comuni che potresti incontrare durante lo sviluppo e l'uso di TheHustlePlace.

## 🚨 Errori Comuni

### 1. "TMDB_API_KEY non configurata"

**Problema**: L'applicazione mostra errori di API key non configurata.

**Sintomi**:
```
❌ TMDB_API_KEY non configurata!
📝 Segui le istruzioni in SETUP.md per configurare la API key
```

**Soluzioni**:
1. **Verifica il file .env.local**:
   ```bash
   cat .env.local | grep TMDB_API_KEY
   ```

2. **Aggiungi entrambe le chiavi**:
   ```env
   TMDB_API_KEY=your-tmdb-api-key-here
   NEXT_PUBLIC_TMDB_API_KEY=your-tmdb-api-key-here
   ```

3. **Riavvia il server**:
   ```bash
   npm run dev
   ```

4. **Verifica la configurazione**:
   ```bash
   curl http://localhost:3000/api/tmdb/movies?type=popular
   ```

### 2. "Please disable sandbox"

**Problema**: VixSrc mostra il messaggio "Please disable sandbox".

**Sintomi**:
```
Please disable sandbox
```

**Soluzione**: ✅ **RISOLTO**
- Sandbox rimosso da tutti gli iframe
- VixSrc ora funziona correttamente
- Nessuna configurazione aggiuntiva richiesta

### 3. "Film non disponibile"

**Problema**: Il player mostra "Film non disponibile" anche se il film esiste.

**Sintomi**:
```
❌ Film non disponibile su VixSrc
```

**Soluzioni**:
1. **Verifica disponibilità**:
   ```bash
   curl "http://localhost:3000/api/player/check-availability?tmdbId=755898&type=movie"
   ```

2. **Controlla i log del server** per dettagli

3. **Prova con un film diverso** (popolare e recente)

4. **Verifica che il film esista su VixSrc**:
   ```bash
   curl -I "https://vixsrc.to/movie/755898"
   ```

### 4. Film non si vedono nella homepage

**Problema**: La homepage è vuota o non mostra i film.

**Sintomi**:
- Homepage vuota
- Sezioni senza contenuto
- Loading infinito

**Soluzioni**:
1. **Pulisci la cache Next.js**:
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Reinstalla le dipendenze**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Verifica le API**:
   ```bash
   curl http://localhost:3000/api/tmdb/movies?type=popular
   ```

4. **Controlla la console del browser** per errori JavaScript

### 5. Errori di Build

**Problema**: `npm run build` fallisce con errori.

**Sintomi**:
```
Error: Cannot find module './vendor-chunks/next.js'
Dynamic server usage: Route couldn't be rendered statically
```

**Soluzioni**:
1. **Pulisci tutto**:
   ```bash
   rm -rf .next node_modules package-lock.json
   ```

2. **Reinstalla**:
   ```bash
   npm install
   ```

3. **Pulisci cache npm**:
   ```bash
   npm cache clean --force
   ```

4. **Riavvia**:
   ```bash
   npm run dev
   ```

### 6. Errori Redis durante il Build

**Problema**: Errori di connessione Redis durante `npm run build`.

**Sintomi**:
```
[ERROR] Redis connection error
[INFO] Redis reconnecting...
```

**Soluzione**: ✅ **RISOLTO**
- Redis è disabilitato automaticamente durante il build
- Viene usata la cache in-memory come fallback
- Nessuna configurazione Redis richiesta per lo sviluppo locale

### 7. Errori Dynamic Server Usage

**Problema**: Errori durante il build per route che usano `request.url`.

**Sintomi**:
```
Route /api/catalog/movies couldn't be rendered statically because it used `request.url`
```

**Soluzione**: ✅ **RISOLTO**
- Tutte le route API sono marcate come dinamiche
- Aggiunto `export const dynamic = 'force-dynamic'`
- Build ora funziona correttamente

### 8. Iframe non si carica

**Problema**: L'iframe del player non si carica o mostra errori.

**Sintomi**:
- Iframe vuoto
- Timeout di caricamento
- Errori di cross-origin

**Soluzioni**:
1. **Verifica l'URL VixSrc**:
   ```bash
   curl -I "https://vixsrc.to/movie/755898"
   ```

2. **Controlla i log del server** per dettagli

3. **Prova con un film diverso**

4. **Verifica la connessione internet**

### 9. Errori di Navigazione

**Problema**: I pulsanti play non navigano correttamente.

**Sintomi**:
- Click su play non funziona
- Navigazione a pagina sbagliata
- Errori di routing

**Soluzioni**:
1. **Verifica i componenti**:
   - `MovieCard` usa `window.location.href`
   - `HeroFilm` naviga correttamente

2. **Controlla i log** per errori JavaScript

3. **Verifica che le route esistano**:
   - `/player/movie/[id]`
   - `/player/tv/[id]`

### 10. Errori di Stile/CSS

**Problema**: Gli stili non si applicano correttamente.

**Sintomi**:
- Componenti senza stile
- Layout rotto
- Colori sbagliati

**Soluzioni**:
1. **Verifica Tailwind CSS**:
   ```bash
   npm run build
   ```

2. **Controlla i file CSS**:
   - `app/globals.css`
   - `tailwind.config.js`

3. **Riavvia il server**:
   ```bash
   npm run dev
   ```

## 🔍 Debug e Diagnostica

### 1. Log del Server

I log mostrano informazioni dettagliate:
```
✅ TMDB_API_KEY configurata correttamente
🎬 Recupero dettagli film TMDB per ID: 755898
✅ Film trovato: La guerra dei mondi
GET /api/tmdb/movies/755898 200 in 209ms
```

### 2. Console del Browser

Apri F12 → Console per vedere:
- Errori JavaScript
- Log di debug
- Chiamate API

### 3. Network Tab

F12 → Network per vedere:
- Chiamate API
- Tempi di risposta
- Errori HTTP

### 4. Test API

```bash
# Test TMDB
curl http://localhost:3000/api/tmdb/movies?type=popular

# Test VixSrc
curl "http://localhost:3000/api/player/check-availability?tmdbId=755898&type=movie"

# Test Player
curl http://localhost:3000/api/player/movie/755898
```

## 🛠️ Soluzioni Rapide

### Reset Completo

```bash
# 1. Ferma il server
Ctrl+C

# 2. Pulisci tutto
rm -rf .next node_modules package-lock.json

# 3. Pulisci cache
npm cache clean --force

# 4. Reinstalla
npm install

# 5. Riavvia
npm run dev
```

### Verifica Configurazione

```bash
# 1. Verifica variabili d'ambiente
cat .env.local

# 2. Testa API TMDB
curl http://localhost:3000/api/tmdb/movies?type=popular

# 3. Testa VixSrc
curl "http://localhost:3000/api/player/check-availability?tmdbId=755898&type=movie"
```

### Debug Mode

```bash
# Server con debug
npm run dev -- --debug

# Build con debug
npm run build -- --debug
```

## 📊 Monitoraggio

### Metriche Importanti

- **API Response Time**: < 2 secondi
- **Cache Hit Rate**: > 80%
- **Error Rate**: < 5%
- **Build Time**: < 30 secondi

### Log da Monitorare

```
✅ TMDB_API_KEY configurata correttamente
🎬 Film trovati: 20
✅ Film disponibile su VixSrc
✅ Iframe caricato con successo
```

## 🚨 Errori Critici

### 1. Server non si avvia

**Cause**:
- Porta 3000 occupata
- Dipendenze mancanti
- Errori di configurazione

**Soluzioni**:
```bash
# Cambia porta
npm run dev -- --port 3001

# Reinstalla dipendenze
rm -rf node_modules package-lock.json
npm install
```

### 2. Build fallisce completamente

**Cause**:
- Errori TypeScript
- Dipendenze mancanti
- Configurazione errata

**Soluzioni**:
```bash
# Pulisci tutto
rm -rf .next node_modules package-lock.json

# Reinstalla
npm install

# Verifica configurazione
npm run build
```

### 3. API non risponde

**Cause**:
- Chiavi API mancanti
- Connessione internet
- Rate limiting

**Soluzioni**:
1. Verifica `.env.local`
2. Controlla connessione internet
3. Aspetta e riprova

## 📞 Supporto

### Prima di Chiedere Aiuto

1. **Leggi questa guida** completamente
2. **Prova le soluzioni** suggerite
3. **Controlla i log** del server
4. **Verifica la configurazione**

### Informazioni da Fornire

Quando chiedi aiuto, includi:
- **Sistema operativo**
- **Versione Node.js**: `node --version`
- **Log del server** completi
- **Messaggi di errore** esatti
- **Passi per riprodurre** il problema

### Risorse Utili

- [README Principale](../README.md)
- [Setup Guide](../SETUP.md)
- [API Documentation](./api-integration.md)
- [Player System](./player-system.md)

---

**TheHustlePlace Troubleshooting** - *Risoluzione problemi completa* 🔧✨