# Component — HeroSection

- Percorso: `components/hero-section.tsx`

## Scopo
Sezione hero interattiva con trailer e azioni.

## API/Props
- Props: featuredMovie, autoplay.

## Dipendenze interne
- `useMovieContext`, `useHeroControls`, player YouTube.

## Casi bordo
- Autoplay disabilitato; muto; visibilità.

## Anti-pattern
- Effetti senza cleanup; dipendenze non dichiarate.

## Esempi d’uso
- Homepage.

## Punti di estensione
- Varianti con HLS locale.

## Collegamenti
- Moduli: 06, 08, 12, 15