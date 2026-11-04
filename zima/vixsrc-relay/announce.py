#!/usr/bin/env python3
import json
import os
import re
import subprocess
import time
import urllib.error
import urllib.request

URL_RE = re.compile(r"https://[a-z0-9-]+\.trycloudflare\.com")
TOKEN = os.environ.get("RELAY_TOKEN", "")
ANNOUNCE_URLS = [
    u.strip()
    for u in os.environ.get(
        "ANNOUNCE_URLS",
        "https://the-fplace.vercel.app/api/player/relay,https://the-hustle-place.vercel.app/api/player/relay",
    ).split(",")
    if u.strip()
]
CONTAINER = os.environ.get("TUNNEL_CONTAINER", "hustle-vixsrc-tunnel")
HEARTBEAT_INTERVAL = 60


def announce(url: str) -> bool:
    success = False
    for target in ANNOUNCE_URLS:
        request = urllib.request.Request(
            target,
            data=json.dumps({"url": url}).encode("utf-8"),
            headers={"Content-Type": "application/json", "x-relay-token": TOKEN},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                print(f"[ANNOUNCE] {url} -> {target} : {response.status}", flush=True)
                success = True
        except Exception as error:
            print(f"[ANNOUNCE FAIL] -> {target} : {error}", flush=True)
    return success


def fetch_tunnel_url() -> str | None:
    try:
        # Legge gli ultimi log del container tunnel (non bloccante)
        res = subprocess.run(
            ["docker", "logs", "--tail", "200", CONTAINER],
            capture_output=True,
            text=True,
            timeout=10,
        )
        combined = (res.stdout or "") + "\n" + (res.stderr or "")
        matches = URL_RE.findall(combined)
        if matches:
            return matches[-1]
    except Exception as error:
        print(f"[TUNNEL URL READ ERROR] {error}", flush=True)
    return None


def main() -> None:
    if not TOKEN:
        raise SystemExit("RELAY_TOKEN mancante")

    current_url: str | None = None
    last_announced_at = 0.0

    print(f"Avvio Announcer per tunnel '{CONTAINER}'...", flush=True)
    print(f"Target: {ANNOUNCE_URLS}", flush=True)

    while True:
        try:
            detected = fetch_tunnel_url()
            now = time.time()
            if detected:
                # Annuncia se l'URL è nuovo o se è trascorso il periodo di heartbeat (60s)
                if detected != current_url or (now - last_announced_at >= HEARTBEAT_INTERVAL):
                    if announce(detected):
                        current_url = detected
                        last_announced_at = now
            else:
                if not current_url:
                    print("In attesa dell'URL del tunnel Cloudflare dai log del container...", flush=True)
                elif now - last_announced_at >= HEARTBEAT_INTERVAL:
                    # Se non è presente negli ultimi 200 log ma lo avevamo già identificato, mantieni vivo l'heartbeat
                    if announce(current_url):
                        last_announced_at = now
        except Exception as error:
            print(f"[MAIN LOOP ERROR] {error}", flush=True)

        time.sleep(15)


if __name__ == "__main__":
    main()
