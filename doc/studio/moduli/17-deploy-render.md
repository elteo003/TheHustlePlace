# 17 — Deploy su Render

## Obiettivi
- Comprendere build/runtime su Render
- Configurare env, health checks e scaling
- Osservare stato del servizio in produzione

## Teoria
- `render.yaml`: servizi, env, build & start
- Variabili d'ambiente e segreti
- Health checks e readiness

## Esempi dal progetto
- `render.yaml`, `app/api/health`

## Domande guida
- Quali differenze tra build-time e runtime su Render?
- Come impostare probe e timeout per evitare false failure?

## Esercizi
- Aggiungi un check di readiness e log di deploy con correlazione.

## Collegamenti
- reference/config/render.yaml, moduli 10, 14, 18