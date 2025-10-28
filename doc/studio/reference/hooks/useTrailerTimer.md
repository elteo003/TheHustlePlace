# Hook — useTrailerTimer

- Percorso: `hooks/useTrailerTimer.ts`

## Scopo
Coordinare timers per inizio/fine trailer e transizioni.

## API
- Output: eventi e stato temporale

## Dipendenze
- Timers e visibilità

## Casi bordo
- Tab inactive; molteplici timers

## Anti-pattern
- Mancanza di cleanup su unmount

## Esempi
- `HeroSection`

## Collegamenti
- Moduli: 06, 08