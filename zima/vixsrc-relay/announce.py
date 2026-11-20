#!/usr/bin/env python3
import json
import os
import re
import subprocess
import time
import urllib.error
import urllib.request

URL_RE = re.compile(r"https://[a-z0-9-]+\.trycloudflare\.com")
FATAL_TUNNEL_ERRORS = ("Unauthorized: Tunnel not found",)
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
LOCAL_HEALTH_URL = os.environ.get("LOCAL_HEALTH_URL", "http://relay:8787/health")
HEARTBEAT_INTERVAL = max(15, int(os.environ.get("HEARTBEAT_INTERVAL", "60")))
POLL_INTERVAL = max(5, int(os.environ.get("POLL_INTERVAL", "15")))
HEALTH_TIMEOUT = max(2.0, float(os.environ.get("HEALTH_TIMEOUT", "8")))
MAX_HEALTH_FAILURES = max(1, int(os.environ.get("MAX_HEALTH_FAILURES", "3")))
RESTART_COOLDOWN = max(30, int(os.environ.get("RESTART_COOLDOWN", "120")))


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


def check_health(health_url: str, timeout: float = HEALTH_TIMEOUT) -> bool:
    request = urllib.request.Request(
        health_url,
        headers={"User-Agent": "vixsrc-announcer/1.0"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            if response.status != 200:
                return False
            payload = json.loads(response.read().decode("utf-8", "replace"))
            return isinstance(payload, dict) and payload.get("ok") is True
    except Exception:
        return False


def get_tunnel_started_at() -> str | None:
    try:
        res = subprocess.run(
            ["docker", "inspect", "-f", "{{.State.StartedAt}}", CONTAINER],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if res.returncode != 0:
            return None
        value = (res.stdout or "").strip()
        return value if value and value != "<no value>" else None
    except Exception as error:
        print(f"[TUNNEL INSPECT ERROR] {error}", flush=True)
        return None


def read_tunnel_logs(started_at: str | None = None, tail: int | None = 200) -> str:
    command = ["docker", "logs"]
    if started_at:
        command.extend(["--since", started_at])
    if tail is not None:
        command.extend(["--tail", str(tail)])
    command.append(CONTAINER)
    try:
        res = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=15,
        )
        return (res.stdout or "") + "\n" + (res.stderr or "")
    except Exception as error:
        print(f"[TUNNEL LOG READ ERROR] {error}", flush=True)
        return ""


def extract_tunnel_url(logs_text: str) -> str | None:
    matches = URL_RE.findall(logs_text)
    return matches[-1] if matches else None


def count_fatal_tunnel_errors(logs_text: str) -> int:
    return sum(logs_text.count(pattern) for pattern in FATAL_TUNNEL_ERRORS)


def restart_tunnel() -> bool:
    try:
        res = subprocess.run(
            ["docker", "restart", CONTAINER],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if res.returncode == 0:
            print(f"[RECOVERY] Container '{CONTAINER}' riavviato con successo.", flush=True)
            return True
        err = (res.stderr or res.stdout or "").strip()
        print(f"[RECOVERY FAIL] docker restart '{CONTAINER}' rc={res.returncode}: {err}", flush=True)
        return False
    except Exception as error:
        print(f"[RECOVERY ERROR] {error}", flush=True)
        return False


class Announcer:
    """Monitors the Cloudflare Quick Tunnel, verifies health, and auto-restarts stale tunnels."""

    def __init__(
        self,
        *,
        get_started_at=get_tunnel_started_at,
        read_logs=read_tunnel_logs,
        health_check=check_health,
        send_announce=announce,
        do_restart=restart_tunnel,
    ) -> None:
        self._get_started_at = get_started_at
        self._read_logs = read_logs
        self._health_check = health_check
        self._announce = send_announce
        self._restart = do_restart
        self.last_started_at: str | None = None
        self.current_url: str | None = None
        self.url_verified = False
        self.last_announced_at = 0.0
        self.public_fail_count = 0
        self.last_restart_at: float | None = None

    def _reset_url_state(self) -> None:
        self.current_url = None
        self.url_verified = False
        self.last_announced_at = 0.0
        self.public_fail_count = 0

    def _maybe_restart_tunnel(self, now: float, reason: str) -> bool:
        if self.last_restart_at is not None and (now - self.last_restart_at < RESTART_COOLDOWN):
            remaining = int(RESTART_COOLDOWN - (now - self.last_restart_at))
            print(f"[RECOVERY WAIT] {reason}; cooldown riavvio attivo ({remaining}s).", flush=True)
            return False
        print(f"[RECOVERY] Riavvio '{CONTAINER}': {reason}", flush=True)
        self.last_restart_at = now
        self._reset_url_state()
        return self._restart()

    def tick(self, now: float | None = None) -> None:
        now = time.time() if now is None else now
        started_at = self._get_started_at()
        if started_at and started_at != self.last_started_at:
            if self.last_started_at is not None:
                print(f"[TUNNEL] Rilevato riavvio container ({started_at}), azzero URL.", flush=True)
            self.last_started_at = started_at
            self._reset_url_state()

        recent_logs = self._read_logs(started_at, 200)
        detected = extract_tunnel_url(recent_logs)
        if not detected and not self.current_url:
            # Fallback to all logs of the current container run when URL scrolled past the last 200 lines.
            detected = extract_tunnel_url(self._read_logs(started_at, None))

        if detected and detected != self.current_url:
            print(f"[TUNNEL] Nuovo URL rilevato: {detected}", flush=True)
            self.current_url = detected
            self.url_verified = False
            self.last_announced_at = 0.0
            self.public_fail_count = 0

        fatal_hits = count_fatal_tunnel_errors(recent_logs)
        if fatal_hits >= 2:
            self._maybe_restart_tunnel(now, f"errore fatale nei log ({fatal_hits}x Unauthorized: Tunnel not found)")
            return
        if fatal_hits >= 1 and self.current_url:
            if not self._health_check(f"{self.current_url}/health"):
                self._maybe_restart_tunnel(now, "errore fatale nei log e /health pubblico fallito")
                return

        if not self.current_url:
            print("In attesa dell'URL del tunnel Cloudflare dai log del container...", flush=True)
            return

        needs_check = (
            not self.url_verified
            or self.public_fail_count > 0
            or (now - self.last_announced_at >= HEARTBEAT_INTERVAL)
        )
        if not needs_check:
            return

        if not self._health_check(LOCAL_HEALTH_URL):
            print("[WARN] Relay locale non risponde su /health; salto l'annuncio.", flush=True)
            return

        if self._health_check(f"{self.current_url}/health"):
            if self.public_fail_count > 0:
                print(f"[HEALTH OK] {self.current_url}/health ripristinato.", flush=True)
            self.public_fail_count = 0
            self.url_verified = True
            if self._announce(self.current_url):
                self.last_announced_at = now
            return

        self.public_fail_count += 1
        print(
            f"[HEALTH FAIL] {self.current_url}/health non raggiungibile ({self.public_fail_count}/{MAX_HEALTH_FAILURES})",
            flush=True,
        )
        if self.public_fail_count >= MAX_HEALTH_FAILURES:
            self._maybe_restart_tunnel(
                now,
                f"{self.public_fail_count} health check pubblici consecutivi falliti",
            )


def main() -> None:
    if not TOKEN:
        raise SystemExit("RELAY_TOKEN mancante")

    print(f"Avvio Announcer per tunnel '{CONTAINER}'...", flush=True)
    print(f"Target: {ANNOUNCE_URLS}", flush=True)
    print(f"Local health: {LOCAL_HEALTH_URL} | Heartbeat: {HEARTBEAT_INTERVAL}s | Cooldown: {RESTART_COOLDOWN}s", flush=True)

    announcer = Announcer()
    while True:
        try:
            announcer.tick()
        except Exception as error:
            print(f"[MAIN LOOP ERROR] {error}", flush=True)

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
