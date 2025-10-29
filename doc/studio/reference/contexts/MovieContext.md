# Context — MovieContext

- Percorso: `contexts/MovieContext.tsx`

## Scopo
Fornire stato e azioni sul film corrente (featured, selezione, ecc.).

## API
- Value: { featuredMovie, setFeaturedMovie, ... }

## Dipendenze
- Servizi TMDB opzionali via consumer.

## Casi bordo
- Stato null; aggiormenti frequenti e re-render.

## Anti-pattern
- Collocazione troppo alta nel tree che causa re-render globali.

## Esempi
- `HeroSection`, caroselli.

## Collegamenti
- Moduli: 07, 06, 15