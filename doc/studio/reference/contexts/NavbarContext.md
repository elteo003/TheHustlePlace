# Context — NavbarContext

- Percorso: `contexts/NavbarContext.tsx`

## Scopo
Fornire stato per la navbar (apertura menu, input ricerca).

## API
- Value: { isOpen, toggle, searchValue, setSearchValue }

## Dipendenze
- Componenti Navbar e SearchBar.

## Casi bordo
- Focus management; resize viewport.

## Anti-pattern
- Stato globale inutile.

## Esempi
- `Navbar`, `SearchBar`.

## Collegamenti
- Moduli: 07, 05, 15