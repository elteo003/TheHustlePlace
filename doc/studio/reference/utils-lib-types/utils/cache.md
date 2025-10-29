# Util — utils/cache.ts

## Scopo
Utility per caching in-memory con interfaccia semplice.

## API
- get, set, del, wrap

## Dipendenze
- Nessuna esterna; logger opzionale.

## Casi bordo
- Cache stampede; TTL scaduti.

## Anti-pattern
- Cache non invalidata;

## Esempi
- Wrap di fetch costose.

## Collegamenti
- moduli 13, 15