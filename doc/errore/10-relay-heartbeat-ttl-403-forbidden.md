# 10 - Scadenza TTL Relay Domestico e Cascata Errore 403 Forbidden su TV e PC

**Blueprint di Risoluzione:** [relay-resilience-and-error-architecture.md](file:///c:/Users/matti/Documents/TheHustlePlace/doc/blueprints/relay-resilience-and-error-architecture.md)

## Sintomo
All'accensione della Smart TV (LG webOS) o provando ad avviare la riproduzione di film o episodi da PC Desktop, la riproduzione non parte e viene mostrato un messaggio di blocco:
- **Su Smart TV (webOS):** Toast/Overlay rosso con errore:
  > *"API VixSrc non disponibile (403)"*
- **Su PC / Web Player (React):** Toast/Card di errore:
  > *"Contenuto non disponibile su VixSrc"* / *"Stream non disponibile"*

---

## Diagnosi Silenziosa in-vivo (04/11/2026)

Eseguita ispezione passiva a freddo senza risvegliare processi né alterare lo stato del sistema:

1. **Stato del Processo Relay & Tunnel Cloudflare (ZimaBoard):**
   - Interrogando direttamente l'endpoint `/health` del Quick Tunnel (`https://monkey-moscow-nextel-distributors.trycloudflare.com/health`), il server ha risposto immediatamente con codice HTTP 200:
     ```json
     {"ok": true, "inflight": 0, "cache": 29, "limit": 6}
     ```
   - **Esito:** Il relay Python e il tunnel Cloudflare su ZimaBoard erano **attivi, reattivi e funzionanti** (29 voci in cache, nessun crash hardware o di processo).

2. **Stato della Tabella Database (`vixsrc_home_relay` su PostgreSQL/Supabase):**
   - Query in sola lettura:
     ```sql
     select id, url, updated_at, now(), now() - updated_at as age from vixsrc_home_relay;
     ```
   - Risultato rilevato:
     - `url`: `https://monkey-moscow-nextel-distributors.trycloudflare.com`
     - `updated_at`: `2026-11-03 23:56:29.622Z` (ore 00:56:29 ora locale italiana)
     - `age`: **10 ore e 19 minuti fa**.

3. **Logica di Scadenza nel Backend (`lib/db/vixsrc-relay.ts`):**
   - La funzione `getHomeRelayConfig()` filtra i record con la clausola:
     ```sql
     where id = 1 and updated_at > (now() - interval '4 hours')
     ```
   - Essendo trascorsi 10 ore e 19 minuti dall'ultimo ping, il database ha considerato il relay **scaduto / non raggiungibile**, restituendo `null`.
   - L'endpoint `GET /api/player/relay` ha quindi risposto ai client:
     ```json
     {"success": true, "url": null, "token": null}
     ```

4. **Cascata del Fallimento (Fallback Vercel -> Blocco 403):**
   - TV e PC, non trovando un relay attivo registrato, hanno tentato la rotta di riserva: invocare `/api/player/resolve` sui server Vercel.
   - Vercel (dall'IP datacenter di AWS/Cloudflare) ha provato a contattare direttamente `vixsrc.to/api/...`.
   - VixSrc blocca sistematicamente gli IP dei datacenter cloud tramite Cloudflare Turnstile/Bot Protection, restituendo **HTTP 403 Forbidden**.
   - Il backend Next.js in `services/vixsrc-hls.service.ts` ha catturato il rifiuto e sollevato:
     ```typescript
     throw new Error('API VixSrc non disponibile (403)')
     ```
   - La TV ha stampato a schermo la stringa dell'errore (403), mentre il PC ha interpretato il fallimento come assenza del titolo sul catalogo ("Non disponibile su VixSrc").

---

## Causa Radice (Root Cause)

### Perché il segnale si è interrotto esattamente alle 00:56:29?
Il timestamp dell'ultimo aggiornamento registrato (`23:56:29 UTC` = `00:56:29` locali) coincide con l'orario in cui è terminata la sessione di visione serale ed è stata spenta la TV.

Sul server ZimaBoard era rimasta in esecuzione una versione dell'announcer (`hustle-vixsrc-announce`) priva di worker autonomo:
```python
# Vecchia logica accoppiata ai log del container
proc = logs(True, "2m")
assert proc.stdout
for line in proc.stdout:
    last = scan(line, last)
```
1. Quando la TV viene spenta, il tunnel `cloudflared` cessa di trasmettere flussi HLS e **non genera più alcuna riga di log**.
2. Il ciclo `for line in proc.stdout` entra in attesa bloccante a tempo indeterminato.
3. Lo script non invia più richieste HTTP POST a `the-fplace.vercel.app/api/player/relay`.
4. Trascorsi 4 ore di silenzio notturno (verso le 05:00 del mattino), il database Supabase fa scattare l'invalidazione automatica del relay.
5. All'accensione mattutina della TV (ore 11:15), il relay viene marcato assente e la chiamata diretta su Vercel genera il 403.

---

## Soluzione Architetturale

### 1. Disaccoppiamento Completo Heartbeat dai Log (`zima/vixsrc-relay/announce.py`)
Introduzione di un thread worker asincrono indipendente:
```python
def heartbeat_worker() -> None:
    while True:
        try:
            with URL_LOCK:
                url = CURRENT_URL
            if url:
                now = time.time()
                if now - LAST_ANNOUNCED_AT >= HEARTBEAT_INTERVAL: # 60 secondi
                    announce(url)
        except Exception as error:
            print("heartbeat worker error:", error, flush=True)
        time.sleep(5)
```
Il worker invia un ping ogni 60 secondi a prescindere dal traffico video o dallo stato di attività dei log.

### 2. Aggiornamento del Container su Zima
Sul mini-server casalingo ZimaBoard è necessario applicare la versione aggiornata:
```bash
cd /percorso/di/zima/vixsrc-relay
git pull
docker compose restart announcer
```

---

## Spunti per il Futuro Sistema Custom di Gestione Errori

Questo incidente evidenzia punti chiave su cui strutturare la futura architettura di error handling:

1. **Separazione Semantica dei Codici di Errore:**
   - Non mascherare mai un errore infrastrutturale (Relay offline, IP 403, Timeout TLS) con un errore di catalogo ("Contenuto non disponibile" / 404).
   - Introdurre codici di stato applicativi espliciti: `ERR_RELAY_OFFLINE`, `ERR_PROVIDER_BLOCKED_403`, `ERR_STREAM_NOT_FOUND_404`.

2. **Health Check Bidirezionale Lato Client:**
   - Prima di dichiarare il relay non disponibile e tentare Vercel, il client (TV o PC) può eseguire un fast probe (es. 1500ms) direttamente all'ultimo URL noto del relay memorizzato in local storage o sessione.

3. **Telemetry & Notifiche Proattive:**
   - Registrare su log/dashboard l'interruzione dell'heartbeat prima che l'utente accenda la TV, evidenziando chiaramente che il tunnel è vivo ma l'announcer è disallineato.
