# 🔧 Troubleshooting Guide

Questa guida ti aiuterà a risolvere i problemi più comuni che potresti incontrare durante lo sviluppo e l'uso di TheHustlePlace.

## 🚨 Errori Comuni

### 1. Errori 404 nel Player

**Problema**: Il player mostra errore 404 quando si tenta di riprodurre un film.

**Cause Possibili**:
- L'ID del film non è valido su vixsrc.to
- Il film non è disponibile nella piattaforma
- Problemi di connessione con vixsrc.to

**Soluzioni**:
1. **Verifica l'ID del film**: Assicurati che l'ID sia un TMDB ID valido
2. **Controlla la disponibilità**: Non tutti i film sono disponibili su vixsrc.to
3. **Usa un film diverso**: Prova con un film popolare e recente
4. **Controlla la console**: Verifica eventuali errori JavaScript

**Codice di Debug**:
```javascript
// Nel browser console, verifica l'URL dell'iframe
console.log(document.querySelector('iframe').src);
```

### 2. Errori Redis durante il Build

**Problema**: Errori di connessione Redis durante `npm run build`.

**Sintomi**:
```
[ERROR] Redis connection error
[INFO] Redis reconnecting...
```

**Soluzione**: ✅ **RISOLTO**
- Redis è ora disabilitato automaticamente durante il build
- Viene usata la cache in-memory come fallback
- Nessuna configurazione Redis richiesta per lo sviluppo locale

### 3. Errori Dynamic Server Usage

**Problema**: Errori durante il build per route che usano `request.url`.

**Sintomi**:
```
Route /api/catalog/movies couldn't be rendered statically because it used `request.url`
```

**Soluzione**: ✅ **RISOLTO**
- Tutte le API routes ora usano `export const dynamic = 'force-dynamic'`
- Sostituito `new URL(request.url)` con `request.nextUrl`
- Build ora funziona senza errori

### 4. Errori di Moduli Mancanti

**Problema**: Errori "Cannot find module" durante lo sviluppo.

**Sintomi**:
```
Error: Cannot find module './vendor-chunks/next.js'
```

**Soluzioni**:
1. **Pulisci la cache**:
   ```bash
   rm -rf .next
   rm -rf node_modules
   npm install
   ```

2. **Riavvia il server**:
   ```bash
   npm run dev
   ```

### 5. Problemi di Performance

**Problema**: Caricamento lento delle pagine o delle immagini.

**Soluzioni Implementate**:
- ✅ **Lazy Loading**: Immagini caricate solo quando visibili
- ✅ **Skeleton Loading**: Placeholder durante il caricamento
- ✅ **API Parallelization**: Chiamate API in batch per migliori performance
- ✅ **Rate Limiting**: Controllo delle chiamate API esterne
- ✅ **Caching**: Cache in-memory e Redis (opzionale)

### 6. Problemi di CORS

**Problema**: Errori CORS quando si fanno chiamate API dirette dal browser.

**Soluzione**: ✅ **RISOLTO**
- Tutte le chiamate API esterne sono fatte dal server
- Endpoint proxy per evitare problemi CORS
- Client fa chiamate solo ai nostri endpoint interni

## 🔍 Debug e Logging

### Abilitare Log Dettagliati

Il sistema usa un logger strutturato. Per abilitare log dettagliati:

```javascript
// In utils/logger.ts
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
```

### Log Disponibili

- **INFO**: Operazioni normali (caricamento film, API calls)
- **WARN**: Situazioni anomale ma gestibili
- **ERROR**: Errori che richiedono attenzione

### Esempi di Log

```javascript
// Log di successo
logger.info('Film popolari recuperati con successo', { count: 20 });

// Log di errore
logger.error('Errore nel recupero film', { error: error.message });

// Log di warning
logger.warn('Redis not available, using in-memory cache', { error });
```

## 🛠️ Strumenti di Debug

### 1. Browser DevTools

**Console**: Controlla errori JavaScript
**Network**: Verifica chiamate API e tempi di risposta
**Performance**: Analizza performance del sito

### 2. Next.js DevTools

```bash
# Avvia con debug mode
npm run dev -- --debug
```

### 3. API Testing

```bash
# Test endpoint API
curl http://localhost:3000/api/health
curl http://localhost:3000/api/catalog/popular/movies
```

## 📊 Monitoraggio

### Health Check

Endpoint per verificare lo stato del sistema:
```
GET /api/health
```

Risposta:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-03T15:00:00.000Z",
  "services": {
    "tmdb": "connected",
    "vixsrc": "connected",
    "redis": "disabled"
  }
}
```

### Metriche Performance

- **Build Time**: Tempo di build di produzione
- **API Response Time**: Tempo di risposta delle API
- **Cache Hit Rate**: Percentuale di hit della cache

## 🚀 Ottimizzazioni

### 1. Build Optimization

```bash
# Build di produzione ottimizzato
npm run build

# Analizza bundle size
npm run build -- --analyze
```

### 2. Runtime Optimization

- **Image Optimization**: Usa `next/image` per immagini ottimizzate
- **Code Splitting**: Caricamento lazy dei componenti
- **Memoization**: `useMemo` e `useCallback` per componenti pesanti

### 3. API Optimization

- **Batch Processing**: Chiamate API in gruppi
- **Rate Limiting**: Controllo frequenza chiamate
- **Caching**: Cache intelligente per ridurre chiamate

## 📞 Supporto

### Prima di Chiedere Aiuto

1. ✅ Controlla questa guida
2. ✅ Verifica i log nella console
3. ✅ Testa con un film diverso
4. ✅ Riavvia il server di sviluppo
5. ✅ Pulisci cache e node_modules

### Informazioni Utili da Fornire

- **Versione Node.js**: `node --version`
- **Versione npm**: `npm --version`
- **Sistema Operativo**: Windows/Mac/Linux
- **Messaggi di errore completi**
- **Passi per riprodurre il problema**

### Risorse Utili

- [Next.js Documentation](https://nextjs.org/docs)
- [TMDB API Documentation](https://developers.themoviedb.org/)
- [VixSrc Documentation](https://vixsrc.to/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Nota**: La maggior parte dei problemi comuni sono già stati risolti nelle ultime versioni. Se incontri un problema non documentato, apri una issue su GitHub con tutti i dettagli necessari.
