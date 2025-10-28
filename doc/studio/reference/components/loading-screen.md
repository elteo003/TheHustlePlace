# Component — LoadingScreen

- Percorso: `components/loading-screen.tsx`

## Scopo
Schermata di caricamento o skeleton generale.

## API/Props
- Props minime: message, fullscreen.

## Dipendenze interne
- Tailwind per layout e animazioni.

## Casi bordo
- Evitare jank; transizioni tra stati.

## Anti-pattern
- Indicare progresso non reale; bloccare focus.

## Esempi d’uso
- Stati `loading.tsx` o caricamenti lenti.

## Punti di estensione
- Varianti tema; dimensioni.

## Collegamenti
- Moduli: 04, 15