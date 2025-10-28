# Service — player.service.ts

## Scopo
Gestione flussi player: generazione URL, disponibilità, mapping fonti.

## API
- Funzioni: generateUrl, checkAvailability, getTvEpisodeUrl, ecc.

## Dipendenze
- `video-player.service`, `vixsrc-scraper.service`, cache/log.

## Casi bordo
- Fonte non disponibile; timeouts.

## Anti-pattern
- Mescolare policy con UI.

## Esempi d’uso
- API player.

## Punti di estensione
- Telemetria degli eventi, fallback provider.

## Collegamenti
- moduli 12, 14