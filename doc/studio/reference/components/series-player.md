# Component — SeriesPlayer

- Percorso: `components/series-player.tsx`

## Scopo
Riprodurre serie TV con gestione episodio/stagione.

## API/Props
- Props: seriesId, season, episode.

## Dipendenze interne
- Player iframe; servizi player.

## Casi bordo
- Autoplay episodio successivo; assenza sottotitoli.

## Anti-pattern
- Logica di fetch non memoizzata.

## Esempi d’uso
- Pagine `app/player/tv/[id]`.

## Punti di estensione
- Skip intro/recap.

## Collegamenti
- Moduli: 06, 12