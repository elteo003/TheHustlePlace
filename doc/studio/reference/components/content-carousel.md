# Component — ContentCarousel

- Percorso: `components/content-carousel.tsx`

## Scopo
Carosello orizzontale con scroll controllato e card figlie.

## API/Props
- Props: items, renderItem, onScroll.

## Dipendenze interne
- `MovieCard`, hooks di interazione.

## Casi bordo
- Infinite width; scroll snapping; accessibilità tastiera.

## Anti-pattern
- Stato interno non controllato; re-render non necessari.

## Esempi d’uso
- Homepage sezioni film.

## Punti di estensione
- Paginazione, virtualizzazione.

## Collegamenti
- Moduli: 06, 08, 15