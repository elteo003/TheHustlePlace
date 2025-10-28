# Service — tmdb-movies.service.ts

## Scopo
Operazioni specializzate TMDB per film (liste, dettagli, trailer).

## API
- Funzioni: getNowPlaying, getLatest, getMovieVideos, ecc.

## Dipendenze
- `tmdb.service`, `lib/tmdb.ts`, cache.

## Casi bordo
- Aggiornamenti frequenti; dati mancanti.

## Anti-pattern
- Duplica logica presente in tmdb.service.

## Esempi d’uso
- Pagine film e caroselli.

## Punti di estensione
- Categorie custom.

## Collegamenti
- moduli 11, 13