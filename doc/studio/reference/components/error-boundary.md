# Component — ErrorBoundary

- Percorso: `components/error-boundary.tsx`

## Scopo
Catturare errori runtime client e mostrare fallback.

## API/Props
- Props: fallback, onError.

## Dipendenze interne
- API React Error Boundary.

## Casi bordo
- Errori asincroni; reset delle boundary.

## Anti-pattern
- Nascondere errori sistemici senza log.

## Esempi d’uso
- Sezioni UI critiche.

## Punti di estensione
- Telemetria integrata.

## Collegamenti
- Moduli: 16