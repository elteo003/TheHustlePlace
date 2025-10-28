# 13 — Caching, Redis e Logger

## Obiettivi
- Definire strategie di caching multilivello
- Integrare Redis e invalidazione coerente
- Strutturare logging utile per debug e osservabilità

## Teoria
- Tipi di cache: in-memory, Redis, HTTP cache
- Strategie: TTL, SWR, cache stampede, chiavi e namespaces
- Logging: livelli, correlazione, structured logs

## Esempi dal progetto
- `utils/redis-cache.ts`, `utils/cache.ts`, `utils/logger.ts`

## Domande guida
- Quali dati vanno esclusi dal caching? Come invalidare in sicurezza?
- Come tracciare hit/miss e correlare richieste in log?

## Esercizi
- Introduci metriche di hit/miss nel wrapper Redis e un TTL differenziato.

## Collegamenti
- reference/utils-lib-types/*, reference/api/*, moduli 10, 15