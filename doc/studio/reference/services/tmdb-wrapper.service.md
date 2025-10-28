# Service — tmdb-wrapper.service.ts

## Scopo
Wrapper di alto livello per comporre più chiamate TMDB.

## API
- Funzioni: orchestrazioni composte (es. dettaglio + video).

## Dipendenze
- `tmdb.service`, `tmdb-movies.service`.

## Casi bordo
- Coerenza tra chiamate; errori parziali.

## Anti-pattern
- Sovrapposizione col controller.

## Esempi d’uso
- Endpoint che espongono viste aggregate.

## Punti di estensione
- Parallelizzazione e caching aggregato.

## Collegamenti
- moduli 09, 11, 13