# 11 — Integrazioni TMDB, Trakt, VixSRC

## Obiettivi
- Comprendere i flussi dati esterni e le dipendenze
- Progettare adattatori e fallback resilienti
- Gestire quote, errori e incoerenze dati

## Teoria
- Adapter anti-corruzione, mapping modelli, normalizzazione
- Limiti di rate e strategie di retry
- Osservabilità: logging, metriche d'integrazione

## Esempi dal progetto
- `services/tmdb.service.ts`, `tmdb-movies.service.ts`, `tmdb-wrapper.service.ts`, `vixsrc-scraper.service.ts`

## Domande guida
- Come isolare le API esterne per facilitarne la sostituzione?
- Che differenze tra errore recuperabile vs irreversibile ai fini UX?

## Esercizi
- Implementa un fallback secondario per ricerca film quando TMDB fallisce.

## Collegamenti
- reference/services/*, moduli 09, 12, 13