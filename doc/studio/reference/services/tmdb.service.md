# Service — tmdb.service.ts

## Scopo
Accesso a TMDB con gestione chiavi, mapping e caching.

## API
- Funzioni: getMovie, getTv, getVideos, getPopular, ecc.

## Dipendenze
- `lib/tmdb.ts`, Redis cache, logger.

## Casi bordo
- 404, limiti di quota, inconsistenze dati.

## Anti-pattern
- Coupling alle risposte TMDB nei consumer.

## Esempi d’uso
- API tmdb e pagine.

## Punti di estensione
- Backoff e circuit breaker.

## Collegamenti
- moduli 10, 11, 13