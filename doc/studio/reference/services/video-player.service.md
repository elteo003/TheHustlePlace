# Service — video-player.service.ts

## Scopo
Supporto al player video: costruzione sorgenti e configurazioni.

## API
- Funzioni: buildSource, buildConfig, ecc.

## Dipendenze
- `utils/hls-config.ts`.

## Casi bordo
- Config inconsistenti; rete lenta.

## Anti-pattern
- Logica UI nel servizio.

## Esempi d’uso
- API player e componenti player.

## Punti di estensione
- Profili di rete.

## Collegamenti
- moduli 12, 15