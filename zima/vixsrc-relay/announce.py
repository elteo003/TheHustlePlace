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
ANNOUNCE_URL = os.environ.get("ANNOUNCE_URL", "https://the-hustle-place.vercel.app/api/player/relay")
CONTAINER = os.environ.get("TUNNEL_CONTAINER", "hustle-vixsrc-tunnel")


def announce(url: str) -> None:
    request = urllib.request.Request(
        ANNOUNCE_URL,
        data=json.dumps({"url": url}).encode(),
        headers={"Content-Type": "application/json", "x-relay-token": TOKEN},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        print("announced", url, response.status, flush=True)


def scan(text: str, last: str | None) -> str | None:
    match = URL_RE.search(text)
    if not match:
        return last
    url = match.group(0)
    if url == last:
        return last
    try:
        announce(url)
        return url
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as error:
        print("announce fail", error, flush=True)
        return last


def logs(follow: bool, since: str | None = None) -> subprocess.Popen:
    command = ["docker", "logs", CONTAINER]
    if follow:
        command.append("-f")
    if since:
        command.extend(["--since", since])
    return subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)


def main() -> None:
    if not TOKEN:
        raise SystemExit("RELAY_TOKEN mancante")
    last = None
    bootstrap = logs(False)
    out, _ = bootstrap.communicate(timeout=20)
    last = scan(out, last)
    while True:
        proc = logs(True, "2m")
        assert proc.stdout
        for line in proc.stdout:
            last = scan(line, last)
        time.sleep(4)


if __name__ == "__main__":
    main()
