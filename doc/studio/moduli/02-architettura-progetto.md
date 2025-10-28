# 02 — Architettura del Progetto

## Obiettivi
- Leggere la mappa delle directory come mappa dei ruoli
- Capire i flussi dati end-to-end
- Riconoscere punti di estensione e confini

## Mappa architetturale (Mermaid)
```mermaid
flowchart TB
  UI[App/Pages & Components] --> Ctx[Contexts]
  UI --> Hooks
  Hooks --> Services
  Ctx --> Services
  UI --> API[Route Handlers]
  API --> Ctrls[Controllers]
  Ctrls --> Services
  Services --> Ext[TMDB/Trakt/VixSRC]
  Services --> Cache[Redis]
  Services --> Log[Logger]
  API --> Middle[Middlewares]
  subgraph Config
    Tailwind
    TSConfig
    NextConfig
    RenderYaml
  end
  Config --> UI
  Config --> API
```

## Teoria
- Separazione delle responsabilità: UI (presentazione), Hooks/Contexts (stato/riuso), Controller (orchestrazione), Services (accesso dati), Middlewares (policy trasversali).
- Dipendenze direzionali: UI → Hooks/Services; API → Controllers → Services; Services → Utils/Lib.

## Domande guida
- Se dovessi sostituire TMDB, quali moduli toccheresti minimizzando l’impatto?
- Dove implementeresti la deduplicazione delle richieste: hook, servizio o middleware?

## Esercizio
- Disegna una variante dell’architettura includendo un nuovo provider esterno e definisci i confini.
