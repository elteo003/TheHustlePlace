# 09 — Servizi e Controller

## Obiettivi
- Separare orchestrazione (controller) da accesso dati (servizi)
- Definire interfacce e contratti tra layer
- Gestire errori, logging e resilienza

## Teoria
- Controller: validazione input, orchestrazione, mapping risposta
- Servizi: integrazioni, caching, fallback
- Gestione errori: classi di errori, retry/backoff, circuit breaker (concetti)

## Esempi dal progetto
- `controllers/*`, `services/*` con TMDB e VixSRC

## Domande guida
- Dove validare input e dove tradurre errori di integrazione?
- Quando introdurre un adapter per disaccoppiare provider esterni?

## Esercizi
- Aggiungi un metodo al `tmdb.service` con deduplicazione e logging coerente.

## Collegamenti
- reference/controllers/*, reference/services/*, moduli 10, 11, 13