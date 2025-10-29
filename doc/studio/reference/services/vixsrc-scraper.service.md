# Service — vixsrc-scraper.service.ts

## Scopo
Interfacciare provider VixSRC per ottenere sorgenti.

## API
- Funzioni: scrapeMovie, scrapeEpisode.

## Dipendenze
- HTTP client, logger, cache breve.

## Casi bordo
- Cambi API; blocchi di rete.

## Anti-pattern
- Parsing fragile; hard-coded selectors.

## Esempi d’uso
- Player service.

## Punti di estensione
- Retry con backoff, verifica checksum.

## Collegamenti
- moduli 11, 12