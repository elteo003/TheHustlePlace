# API — Catalog

## Scope
Endpoint sotto `app/api/catalog/*` per elenchi e ricerche.

## Input/Output
- GET con query param (pagine, filtri).

## Validazione
- Middleware di validazione per parametri; fallback su default.

## Caching
- Redis + Cache-Control per elenchi stabili; TTL differenziati.

## Rate Limiting
- Limiti moderati; burst controllato.

## Dipendenze
- `services/catalog.service.ts`, TMDB services.

## Casi bordo
- Liste vuote; errori upstream.

## Collegamenti
- moduli 10, 11, 13, 14