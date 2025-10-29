# Hook — useAutoplay

- Percorso: `hooks/useAutoplay.ts`

## Scopo
Gestire autoplay di trailer/contenuti con soglie e condizioni di visibilità.

## API
- Input: config {threshold, delay}
- Output: stato autoplay, start/stop

## Dipendenze
- Eventi visibilità, timers

## Casi bordo
- Tab non attiva; ridurre consumo CPU

## Anti-pattern
- Listener senza cleanup, polling

## Esempi
- `HeroSection`

## Collegamenti
- Moduli: 06, 08, 12, 15