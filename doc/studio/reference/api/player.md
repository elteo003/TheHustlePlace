# API — Player

## Scope
Endpoint sotto `app/api/player/*` per generare URL e verificare disponibilità.

## Input/Output
- GET/POST a seconda dell'azione; path params (id, season, episode).

## Validazione
- Schema param obbligatori; mapping errori chiari.

## Caching
- Cache breve per disponibilità; nessuna per URL firmati.

## Rate Limiting
- Più severo per generazione URL.

## Dipendenze
- `services/player.service.ts`, `video-player.service.ts`, `vixsrc-scraper.service.ts`.

## Casi bordo
- Fonte non raggiungibile; timeouts.

## Collegamenti
- moduli 10, 12, 14