# FAQ — Errori Comuni e Troubleshooting

## TMDB/Trakt
- Chiavi API mancanti o invalide: verifica `.env` e log di avvio.
- Rate limit superato: implementa backoff e usa cache intermedia.

## Player/HLS
- Iframe bloccato: controlla `origin` e `sandbox`.
- Buffering prolungato: verifica rete, ABR e segnalazione UI.

## Next.js App Router
- Uso improprio di client components globali: spostare in RSC quando possibile.
- Errori boundary: aggiungi `error.tsx`/`loading.tsx` mirati.
