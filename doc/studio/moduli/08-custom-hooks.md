# 08 — Custom Hooks

## Obiettivi
- Definire contratti chiari per hooks riusabili
- Gestire effetti, cleanup e performance
- Isolare logica di interazione dai componenti UI

## Teoria
- Idempotenza degli effetti, dipendenze, cancellazione
- Evitare derive di stato e race conditions
- API ergonomiche: input, output, error handling

## Esempi dal progetto
- `hooks/useAutoplay.ts`, `useMoviesWithTrailers.ts`, `useHeroControls.ts`, `useSmartHover.ts`

## Domande guida
- Quali parti vanno memorizzate con `useMemo` vs `useRef`?
- Come prevenire memory leak in listeners e timers?

## Esercizi
- Estendi `useAutoplay` con una soglia di visibilità e throttling configurabile.

## Collegamenti
- reference/hooks/*, moduli 06, 12, 15