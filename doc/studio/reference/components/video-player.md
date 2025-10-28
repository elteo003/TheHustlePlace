# Component — VideoPlayer

- Percorso: `components/video-player.tsx`

## Scopo
Player video basato su iframe/HLS con controlli overlay.

## API/Props
- Props: src, title, onEvent.

## Dipendenze interne
- `utils/hls-config.ts`, servizi player.

## Casi bordo
- Errori rete; playback fallito; focus.

## Anti-pattern
- Messaggi postMessage non validati.

## Esempi d’uso
- Pagine player.

## Punti di estensione
- Telemetria eventi player.

## Collegamenti
- Moduli: 06, 12, 15