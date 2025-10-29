# Component — MovieCard

- Percorso: `components/movie-card.tsx`

## Scopo
Card UI per mostrare un film con poster, titolo e azioni.

## API/Props
- Props tipiche: movie, onClick, className.

## Dipendenze interne
- Usa primitive UI e stili Tailwind.

## Casi bordo
- Poster mancante; titoli lunghi; stato hover/focus.

## Anti-pattern
- Logica di fetch interna; stato globale nel componente.

## Esempi d’uso
- Sezioni catalogo e caroselli.

## Punti di estensione
- Supporto badge (Top10, nuovo), varianti layout.

## Collegamenti
- Moduli: 04, 05, 06, 15
- Reference: `reference/components/ui/*`