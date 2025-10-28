# Middleware — validation.middleware.ts

## Scopo
Validare input e sanitizzare parametri prima degli handler.

## API
- Check schema; normalizza valori; produce errori strutturati.

## Dipendenze
- Schemi di validazione; logger.

## Casi bordo
- Parametri mancanti; tipi errati.

## Anti-pattern
- Validazione sparsa nei controller.

## Esempi
- Applicato a `app/api/catalog/*`.

## Collegamenti
- Moduli: 10, 14