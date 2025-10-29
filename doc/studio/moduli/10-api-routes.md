# 10 — API Routes (app/api)

## Obiettivi
- Progettare route handler robusti (input, output, errori)
- Applicare caching lato server e rate limiting
- Integrare con controller e servizi

## Teoria
- Request/Response in App Router, streaming e RSC
- Validazione input (middleware/handler), status code e semantica HTTP
- Cache-Control, ISR, deduplicazione fetch

## Esempi dal progetto
- `app/api/*` (catalog, tmdb, player), middleware di rate limit e validazione

## Domande guida
- Quando usare un middleware vs validare nell'handler?
- Quali risorse vanno cacheate e con quale TTL?

## Esercizi
- Aggiungi un endpoint read-only con caching e rate limit, loggando hit/miss.

## Collegamenti
- reference/api/*, reference/middlewares/*, moduli 09, 13, 14