# Component — HlsConfigProvider

- Percorso: `components/hls-config-provider.tsx`

## Scopo
Fornire configurazione HLS contestuale al player.

## API/Props
- Props: children, config.

## Dipendenze interne
- `utils/hls-config.ts`.

## Casi bordo
- Config mancante; fallback sensati.

## Anti-pattern
- Stato dentro provider che dipende da UI.

## Esempi d’uso
- Wrappare player.

## Punti di estensione
- Strategie diverse per reti lente.

## Collegamenti
- Moduli: 12, 15