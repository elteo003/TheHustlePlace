# 03 — Routing e Layouts (Next.js App Router)

## Obiettivi
- Comprendere segmenti, layout annidati e pagine
- Gestire route dinamiche e loading/error boundaries
- Integrare RSC e client components

## Concetti chiave
- Directory `app/` come router file-system.
- `layout.tsx` come shell condivisa, boundary e provider lato server.
- Segmenti dinamici `[id]` e segmenti paralleli opzionali.
- File speciali: `loading.tsx`, `error.tsx`, `not-found.tsx`.

## Diagramma segmenti (Mermaid)
```mermaid
graph TD
  A[app/] --> B[home/page.tsx]
  A --> C[catalog/page.tsx]
  A --> D[movies/page.tsx]
  A --> E[tv/page.tsx]
  A --> F[search/page.tsx]
  A --> G[player/]
  G --> H[movie/page.tsx]
  G --> I[tv/page.tsx]
  G --> J[[id]/page.tsx]
  A --> K[series/[id]/page.tsx]
```

## Best practice
- Usare RSC per fetch e composizione di UI non interattiva.
- Promuovere a client-only solo ciò che richiede stato/effetti.
- Collocare i provider al livello minimo necessario nel layout.

## Domande guida
- Come propaghi dati cross-page senza forzare client components globali?
- Quando conviene un route handler rispetto ad una fetch direttamente da RSC?

## Esercizio
- Aggiungi una sottosezione di pagina con `loading.tsx` dedicato e verifica UX.
