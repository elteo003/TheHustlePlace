# Component — SearchBar

- Percorso: `components/search-bar.tsx`

## Scopo
Input di ricerca con debounce e risultati.

## API/Props
- Props: value, onChange, onSubmit.

## Dipendenze interne
- UI primitives, eventuale hook di debounce.

## Casi bordo
- Input vuoto; rate dei keypress.

## Anti-pattern
- Fetch sincrono nel keydown.

## Esempi d’uso
- Navbar e pagina search.

## Punti di estensione
- Suggerimenti instant.

## Collegamenti
- Moduli: 04, 05, 15