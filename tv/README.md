# App TV TheHustlePlace

Interfaccia per **telecomando tradizionale** (frecce, OK, Indietro, 0–9) e guscio **LG webOS**.

Il sito Next resta la sorgente. Sulla TV apri `/living`. Il pacchetto webOS è solo un redirect.

## Cosa c’è qui

```
tv/
  components/     UI 10-foot (profili, home, cerca, player)
  hooks/          spatial nav, back, household
  lib/            path, regole profili, tastiera codice
  webos/          appinfo.json, index.html, icone
```

Route Next: `/living`, `/living/home`, `/living/movies`, `/living/series`, `/living/search`, schede e player.

## Profili familiari

Fino a 5 profili per casa. Il codice a 8 caratteri resta il login:

- **Collega telefono** sulla TV mostra il codice del profilo. Sul telefono: Codice → Unisci (`merge`).
- **Ho un codice** sulla TV importa un profilo già usato (`adopt`) senza cancellare gli altri.

Serve la migration `supabase/migrations/20260910232200_households.sql`.

## Prova dal browser

1. `npm run dev`
2. Apri `http://localhost:3000/living`
3. Usa le frecce della tastiera

`?tv=1` su qualsiasi pagina reindirizza a `/living`. Lo stesso fa lo User-Agent webOS.

## Pacchetto LG

```powershell
npm install -g @webos-tools/cli
cd tv/webos
node generate-icons.mjs
```

In `index.html` l’URL di produzione è `https://the-hustle-place.vercel.app/living`. Per testare in LAN, cambialo con l’IP del PC.

Poi, TV in Developer Mode (stessa rete):

```powershell
ares-package .
ares-setup-device
ares-novacom --device lgtv --getkey
ares-install --device lgtv .\com.thehustleplace.app.tv_1.0.0_all.ipk
ares-launch --device lgtv com.thehustleplace.app.tv
```

Dettagli: account [webOS TV Developer](https://webostv.developer.lge.com/), porta `9922`, user `prisoner`, Key Server acceso solo per il pairing. EXTEND circa ogni 40 giorni. Non usare Clear Cache Data.

Aggiornamenti UI: deploy Vercel, niente nuovo `.ipk`. Nuovo pacchetto solo se cambi icona, id o URL nel guscio.
