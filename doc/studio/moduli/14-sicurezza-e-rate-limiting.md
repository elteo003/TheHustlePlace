# 14 — Sicurezza e Rate Limiting

## Obiettivi
- Validare input e ridurre superfici d'errore
- Applicare rate limiting coerente con gli use case
- Gestire segreti e configurazioni in sicurezza

## Teoria
- Input validation: schema, sanitizzazione, error surfaces
- Rate limiting: token bucket/fixed window concetti
- Segreti: .env, principi del least privilege

## Esempi dal progetto
- `middlewares/rate-limit.middleware.ts`, `middlewares/validation.middleware.ts`

## Domande guida
- Dove è più efficace validare per prevenire exploit?
- Come dimensionare i limiti per endpoint con pesi diversi?

## Esercizi
- Aggiungi validazione schema-first ad un handler e limita burst in scrittura.

## Collegamenti
- reference/middlewares/*, reference/api/*, moduli 10, 17