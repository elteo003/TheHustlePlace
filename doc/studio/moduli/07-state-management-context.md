# 07 — State Management con React Context

## Obiettivi
- Delimitare i confini di stato per ridurre il re-rendering
- Progettare provider e consumer con contratti chiari
- Integrare Context con RSC e componenti client

## Teoria
- Quando usare Context vs props drilling vs librerie esterne
- Collocazione del provider: layout vs pagina vs componente radice
- Stabilità delle reference e memoization dei value

## Esempi dal progetto
- `contexts/MovieContext.tsx`, `contexts/NavbarContext.tsx`: struttura, provider, value, performance

## Domande guida
- Dove posizioneresti un provider per minimizzare l'area di re-render?
- Come tipizzare in TS il value del Context in modo sicuro?

## Esercizi
- Introduci un nuovo Context per preferenze utente (tema/autoplay) e misura l'impatto sui re-render.

## Collegamenti
- reference/contexts/*, moduli 05, 08, 15