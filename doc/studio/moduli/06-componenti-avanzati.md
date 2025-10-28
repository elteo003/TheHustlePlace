# 06 — Componenti Avanzati

## Obiettivi
- Progettare componenti compositi interattivi (Hero, Carousel, Player UI)
- Isolare complessità tramite hooks e contesti
- Gestire side effects, timers e postMessage iframe

## Teoria
- Boundary di responsabilità: render vs orchestrazione vs side-effect.
- Sincronizzazione con servizi/route: fetch da RSC vs client.
- Comunicazione con iframe: `postMessage`, sicurezza `origin`.

## Esempi
- `HeroSection`: carica trailer YouTube, controlla audio con postMessage, usa `useMovieContext` e hook di interazione.
- `ContentCarousel`: scroll controllato, aggiornamento stato di scorrimento, delega a `MovieCard`.
- `VideoPlayer`: integrazione VixSRC via iframe con controlli overlay e gestione eventi.

## Sequenza interazioni Hero (Mermaid)
```mermaid
sequenceDiagram
  autonumber
  User->>HeroSection: Hover/Click
  HeroSection->>useMovieContext: read featuredMovie
  HeroSection->>/api/tmdb/.../videos: fetch trailer
  HeroSection->>YouTube Iframe: postMessage mute/unMute
  useTrailerTimer-->>HeroSection: trailerEnded
  HeroSection->>UpcomingTrailersSection: mostra UI prossimi film
```

## Domande guida
- Quali effetti meritano cleanup esplicito? (timers, listeners, iframes)
- Come isolare la logica di autoplay dell’episodio in serie?

## Esercizio
- Estendi `VideoPlayer` con controlli tastiera (space, arrows) preservando focus management e sicurezza postMessage.
