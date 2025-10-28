# Component — HeroTrailer

- Percorso: `components/hero-trailer.tsx`

## Scopo
Riproduzione trailer nell'hero con controllo audio e autoplay.

## API/Props
- Props: videoId, muted, autoplay.

## Dipendenze interne
- `useYouTubePlayer`, messaggi postMessage.

## Casi bordo
- Autoplay bloccato da browser; mute.

## Anti-pattern
- Mancanza di cleanup listeners.

## Esempi d’uso
- `HeroSection`.

## Punti di estensione
- Switch a provider HLS.

## Collegamenti
- Moduli: 06, 08, 12