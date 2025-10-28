# Hook — useCleanup

- Percorso: `hooks/useCleanup.ts`

## Scopo
Gestire cleanup deterministico di risorse (timers, listeners).

## API
- Input: factory di cleanup

## Dipendenze
- Effetti React

## Casi bordo
- Cleanup multipli; race conditions

## Anti-pattern
- try/finally mancante, swallow error

## Esempi
- Player e interazioni

## Collegamenti
- Moduli: 08, 12