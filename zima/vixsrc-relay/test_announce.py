import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import announce


class AnnouncerTest(unittest.TestCase):
    def test_healthy_flow_and_heartbeat_interval(self) -> None:
        announced: list[str] = []
        health_calls: list[str] = []
        restarts: list[bool] = []

        def fake_health(url: str) -> bool:
            health_calls.append(url)
            return True

        ann = announce.Announcer(
            get_started_at=lambda: "2026-11-15T10:00:00Z",
            read_logs=lambda started_at, tail: "INF | https://alpha-beta-gamma.trycloudflare.com |",
            health_check=fake_health,
            send_announce=lambda url: announced.append(url) or True,
            do_restart=lambda: restarts.append(True) or True,
        )

        ann.tick(now=1000.0)
        self.assertEqual(announced, ["https://alpha-beta-gamma.trycloudflare.com"])
        self.assertEqual(
            health_calls,
            ["http://relay:8787/health", "https://alpha-beta-gamma.trycloudflare.com/health"],
        )

        # Within heartbeat interval (<60s): no extra health check or announce
        health_calls.clear()
        ann.tick(now=1030.0)
        self.assertEqual(health_calls, [])
        self.assertEqual(len(announced), 1)

        # After heartbeat interval (>=60s): verifies health and re-announces
        ann.tick(now=1060.0)
        self.assertEqual(len(announced), 2)
        self.assertEqual(restarts, [])

    def test_restarts_on_unauthorized_tunnel_not_found_when_public_health_fails(self) -> None:
        announced: list[str] = []
        restarts = 0
        started_at = "2026-11-15T10:00:00Z"
        logs_by_run = {
            "2026-11-15T10:00:00Z": (
                "INF | https://dead-tunnel-one.trycloudflare.com |\n"
                'ERR Register tunnel error from server side error="Unauthorized: Tunnel not found"\n'
            ),
            "2026-11-15T10:01:00Z": "INF | https://fresh-tunnel-two.trycloudflare.com |\n",
        }

        def fake_health(url: str) -> bool:
            if "dead-tunnel-one" in url:
                return False
            return True

        def fake_restart() -> bool:
            nonlocal restarts, started_at
            restarts += 1
            started_at = "2026-11-15T10:01:00Z"
            return True

        ann = announce.Announcer(
            get_started_at=lambda: started_at,
            read_logs=lambda sa, tail: logs_by_run[sa],
            health_check=fake_health,
            send_announce=lambda url: announced.append(url) or True,
            do_restart=fake_restart,
        )

        ann.tick(now=1000.0)
        self.assertEqual(restarts, 1)
        self.assertEqual(announced, [])

        # Next tick after restart detects new StartedAt and announces fresh healthy URL
        ann.tick(now=1015.0)
        self.assertEqual(restarts, 1)
        self.assertEqual(announced, ["https://fresh-tunnel-two.trycloudflare.com"])

    def test_restarts_after_consecutive_public_health_failures_without_announcing_dead_url(self) -> None:
        announced: list[str] = []
        restarts = 0
        public_ok = True

        def fake_health(url: str) -> bool:
            if url == announce.LOCAL_HEALTH_URL:
                return True
            return public_ok

        def fake_restart() -> bool:
            nonlocal restarts
            restarts += 1
            return True

        ann = announce.Announcer(
            get_started_at=lambda: "2026-11-15T10:00:00Z",
            read_logs=lambda sa, tail: "INF | https://silent-hang.trycloudflare.com |",
            health_check=fake_health,
            send_announce=lambda url: announced.append(url) or True,
            do_restart=fake_restart,
        )

        # Initial healthy announce
        ann.tick(now=1000.0)
        self.assertEqual(len(announced), 1)

        # Tunnel silently stops routing traffic
        public_ok = False
        ann.tick(now=1060.0)  # fail 1/3
        ann.tick(now=1075.0)  # fail 2/3
        self.assertEqual(restarts, 0)
        self.assertEqual(len(announced), 1)

        ann.tick(now=1090.0)  # fail 3/3 -> restarts
        self.assertEqual(restarts, 1)
        self.assertEqual(len(announced), 1)

    def test_does_not_restart_or_announce_when_local_relay_is_down(self) -> None:
        announced: list[str] = []
        restarts = 0

        def fake_restart() -> bool:
            nonlocal restarts
            restarts += 1
            return True

        ann = announce.Announcer(
            get_started_at=lambda: "2026-11-15T10:00:00Z",
            read_logs=lambda sa, tail: "INF | https://local-down.trycloudflare.com |",
            health_check=lambda url: False,
            send_announce=lambda url: announced.append(url) or True,
            do_restart=fake_restart,
        )

        ann.tick(now=1000.0)
        ann.tick(now=1015.0)
        ann.tick(now=1030.0)
        self.assertEqual(announced, [])
        self.assertEqual(restarts, 0)

    def test_cooldown_prevents_restart_flapping(self) -> None:
        restarts = 0

        def fake_restart() -> bool:
            nonlocal restarts
            restarts += 1
            return True

        ann = announce.Announcer(
            get_started_at=lambda: "2026-11-15T10:00:00Z",
            read_logs=lambda sa, tail: (
                'ERR "Unauthorized: Tunnel not found"\n'
                'ERR "Unauthorized: Tunnel not found"\n'
            ),
            health_check=lambda url: False,
            send_announce=lambda url: True,
            do_restart=fake_restart,
        )

        ann.tick(now=1000.0)
        ann.tick(now=1015.0)
        ann.tick(now=1100.0)
        self.assertEqual(restarts, 1)

        ann.tick(now=1120.0)
        self.assertEqual(restarts, 2)

    def test_fallback_to_full_logs_when_url_scrolled_past_tail_200(self) -> None:
        announced: list[str] = []

        def fake_logs(started_at, tail):
            if tail == 200:
                return "INF heartbeat / connection noise without URL\n"
            return "INF | https://scrolled-past.trycloudflare.com |\n"

        ann = announce.Announcer(
            get_started_at=lambda: "2026-11-15T10:00:00Z",
            read_logs=fake_logs,
            health_check=lambda url: True,
            send_announce=lambda url: announced.append(url) or True,
            do_restart=lambda: True,
        )

        ann.tick(now=1000.0)
        self.assertEqual(announced, ["https://scrolled-past.trycloudflare.com"])


if __name__ == "__main__":
    unittest.main()
