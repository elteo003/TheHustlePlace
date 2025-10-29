# Middleware — rate-limit.middleware.ts

## Scopo
Applicare rate limiting alle richieste sensibili.

## API
- Intercetta request; aggiorna contatori; decide allow/deny.

## Dipendenze
- Store in-memory/Redis; logger.

## Casi bordo
- IP condivisi; burst; clock skew.

## Anti-pattern
- Limiti identici per tutte le route.

## Esempi
- `app/api/player/*` endpoints.

## Collegamenti
- Moduli: 10, 14