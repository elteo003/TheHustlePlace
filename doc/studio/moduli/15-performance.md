# 15 — Performance

## Obiettivi
- Ottimizzare rendering (RSC, streaming, memoization)
- Ridurre costo JS client e immagini
- Progettare code-splitting e dati efficienti

## Teoria
- RSC e streaming: quando e come
- Memoization selettiva, React Profiler
- Code-splitting: segmentazione e latenze

## Esempi dal progetto
- `components/content-carousel.tsx`, `components/hero-section.tsx`, uso memoization e lazy

## Domande guida
- Come misurare regressioni? Quali KPI?
- Quali call-site beneficiano di cache/memo in sicurezza?

## Esercizi
- Introdurre lazy-loading per una sezione e misurare impatto TTI.

## Collegamenti
- reference/components/*, moduli 05, 06, 13