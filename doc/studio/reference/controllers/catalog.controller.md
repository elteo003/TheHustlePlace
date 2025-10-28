# Controller — catalog.controller.ts

## Scopo
Orchestrare richieste di catalogo, validare input e mappare risposte.

## API
- Funzioni: getPopular, getTopRated, search, ecc.

## Dipendenze
- `services/catalog.service.ts`, logger.

## Casi bordo
- Parametri incoerenti; paginazione; error mapping.

## Anti-pattern
- Business logic duplicata con services; side-effect non tracciati.

## Esempi d’uso
- API catalog.

## Punti di estensione
- Filtri avanzati e sorting.

## Collegamenti
- moduli 09, 10