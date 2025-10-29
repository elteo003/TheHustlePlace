# 12 — Video Player e HLS

## Obiettivi
- Integrare HLS/iframe in modo sicuro ed ergonomico
- Progettare controlli UI e recovery da errori
- Ottimizzare UX e performance di playback

## Teoria
- HLS: playlist, segmenti, ABR; eventi player
- Sicurezza iframe: origin, sandbox, postMessage
- UX: autoplay, keyboard controls, focus management

## Esempi dal progetto
- `components/video-player.tsx`, `components/series-player.tsx`, `utils/hls-config.ts`

## Domande guida
- Quali eventi richiedono debounce/throttle? Come gestire buffering?
- Come strutturare messaggi postMessage per minimizzare superfici di attacco?

## Esercizi
- Aggiungi gestione tastiera e feedback visivo di buffering nel player.

## Collegamenti
- reference/components/*, reference/utils-lib-types/*, moduli 06, 08, 15