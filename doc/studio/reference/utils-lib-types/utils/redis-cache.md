# Util — utils/redis-cache.ts

## Scopo
Wrapper Redis per cache distribuita con TTL e namespaces.

## API
- get, set, del, metrics

## Dipendenze
- Client Redis, logger.

## Casi bordo
- Connessioni instabili; timeouts.

## Anti-pattern
- Chiavi non normalizzate.

## Esempi
- Cache per TMDB e catalog.

## Collegamenti
- moduli 13