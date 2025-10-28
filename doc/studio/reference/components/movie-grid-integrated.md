# Component — MovieGridIntegrated

- Percorso: `components/movie-grid-integrated.tsx`

## Scopo
Griglia che integra fetch/dati e presentazione.

## API/Props
- Props: query, onSelect.

## Dipendenze interne
- Services TMDB/catalog; `MovieGrid`.

## Casi bordo
- Errori rete; loading persistente.

## Anti-pattern
- Assenza separazione dati/UI quando scalano i requisiti.

## Esempi d’uso
- Pagine catalog.

## Punti di estensione
- Paginazione e filtri.

## Collegamenti
- Moduli: 09, 10, 15