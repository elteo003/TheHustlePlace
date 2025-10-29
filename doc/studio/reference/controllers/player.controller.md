# Controller — player.controller.ts

## Scopo
Coordinare generazione URL e disponibilità contenuti.

## API
- Funzioni: generateUrl, checkAvailability, ecc.

## Dipendenze
- `services/player.service.ts`, logger.

## Casi bordo
- Parametri mancanti; timeouts; mapping errori.

## Anti-pattern
- Logica di scraping nel controller.

## Esempi d’uso
- API player.

## Punti di estensione
- Policy di fallback per provider.

## Collegamenti
- moduli 12, 14