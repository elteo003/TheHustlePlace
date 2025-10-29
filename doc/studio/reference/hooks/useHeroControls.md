# Hook — useHeroControls

- Percorso: `hooks/useHeroControls.ts`

## Scopo
Coordinare interazioni dell’hero (audio, riproduzione, overlay).

## API
- Output: controls {mute, play, pause}

## Dipendenze
- YouTube iframe, context

## Casi bordo
- Autoplay policy; focus

## Anti-pattern
- Effetti non memoizzati

## Esempi
- `HeroSection`

## Collegamenti
- Moduli: 06, 08, 12