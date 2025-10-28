# API — TMDB

## Scope
Endpoint sotto `app/api/tmdb/*` per dettaglio e video associati.

## Input/Output
- GET con param `id` e sottorisorse `videos`.

## Validazione
- Validazione id e tipi.

## Caching
- Cache per dettagli e liste; invalidazione on-demand non prevista.

## Rate Limiting
- Allineato a quote TMDB; preferire cache.

## Dipendenze
- `services/tmdb.service.ts`, `tmdb-movies.service.ts`.

## Casi bordo
- Video non disponibili; id inesistente.

## Collegamenti
- moduli 10, 11, 13