"""End to end: users + documents + requests through the API -> export -> sync plan -> exactly what
the frontend loader (cloudStore.ts) expects, then ack."""
import json
import sys
import unittest

sys.path.insert(0, "src"); sys.path.insert(0, "tests"); sys.path.insert(0, "scripts")
import sync_store as S  # noqa: E402
from test_core import call, make, register  # noqa: E402

TOKEN = {"x-export-token": "e" * 30}


class EndToEnd(unittest.TestCase):
    def test_publish_export_sync_ack(self):
        app, w, kv, cache, clock = make()
        owner, _ = register(app, "owner@x.tn", "owner1")
        for i in range(3):
            s, b, _ = call(app, "POST", "/api/documents", {"title": f"Doc {i}", "pdfUrl": f"https://files.catbox.moe/d{i}.pdf"},
                           token=owner)
            self.assertEqual(s, 201, b)
        call(app, "POST", "/api/store/ads", {"id": "ad_1", "title_ar": "إعلان"}, token=owner)
        call(app, "POST", "/api/store/faqs", {"id": "q1", "question": "؟", "authorEmail": "leak@x.tn"}, token=owner)
        stu, _ = register(app, "stu@x.tn", "student1", ip="2.2.2.2")
        call(app, "POST", "/api/requests", {"kind": "elite", "item": {"id": "e1", "email": "stu@x.tn", "reason": "r"}}, token=stu)

        s, exp, _ = call(app, "GET", "/api/admin/export", headers=TOKEN)
        files = {k: v.encode("utf-8") for k, v in exp["files"].items()}
        ops, people = exp["people"]["pending"], exp["people"]
        writes = S.plan_sync({"manifest": b'{"files":{},"generatedAt":0,"schema":1}'}, files, ops,
                             people["shard_max"], people["slots"], now=1)
        applied = {**writes}
        manifest = json.loads(applied["manifest"])
        self.assertLessEqual(len(applied), 20)
        # contract with cloudStore.ts: manifest.files[name].sha and every file = {"items": [...]}
        bank = [n for n in manifest["files"] if n.startswith("archive-bank.")]
        self.assertEqual(len(bank), 10)
        docs = [it for n in bank for it in json.loads(applied[n])["items"]]
        self.assertEqual(sorted(d["title"] for d in docs), ["Doc 0", "Doc 1", "Doc 2"])
        self.assertEqual(sorted(e["u"] for e in json.loads(applied["people.0.json"])["items"]), ["owner1", "student1"])
        everything = json.dumps({k: v.decode() for k, v in applied.items()})
        for secret in ("passhash", "stu@x.tn", "owner@x.tn", "leak@x.tn", "elite", "requests"):
            self.assertNotIn(secret, everything, secret)

        # ack only after the push: nothing is pending afterwards and a re-export keeps the same people
        call(app, "POST", "/api/admin/ack", {"seq": max(o["s"] for o in ops)}, headers=TOKEN)
        s, exp2, _ = call(app, "GET", "/api/admin/export", headers=TOKEN)
        self.assertEqual(exp2["people"]["pending"], [])
        again = S.plan_sync(applied, {k: v.encode() for k, v in exp2["files"].items()}, [], 100000, 5, now=2)
        self.assertEqual(again, {})

    def test_survives_cold_start_all_state_from_telegram(self):
        app, w, kv, cache, clock = make()
        owner, _ = register(app, "owner@x.tn", "owner1")
        call(app, "POST", "/api/documents", {"title": "Keep me", "pdfUrl": "https://files.catbox.moe/k1.pdf"}, token=owner)
        cache.d.clear()  # new isolate / new data center: empty cache
        s, b, _ = call(app, "POST", "/api/auth/login", {"emailOrUsername": "owner@x.tn", "password": "secret123"})
        self.assertEqual(s, 200)
        self.assertEqual(call(app, "GET", "/api/documents")[1][0]["title"], "Keep me")

    def test_site_files_written_by_sync_survive_a_telegram_outage_for_reads(self):
        """Public reads come from static files, so they do not depend on Telegram at all."""
        app, w, kv, cache, clock = make()
        owner, _ = register(app, "owner@x.tn", "owner1")
        call(app, "POST", "/api/store/faqs", {"id": "q1", "question": "؟"}, token=owner)
        s, exp, _ = call(app, "GET", "/api/admin/export", headers=TOKEN)
        applied = S.plan_sync({}, {k: v.encode() for k, v in exp["files"].items()}, exp["people"]["pending"], 100000, 5, now=1)
        w.fail_429_times = 10 ** 6  # Telegram is down from now on
        self.assertEqual(json.loads(applied["faqs.json"])["items"][0]["id"], "q1")


if __name__ == "__main__":
    unittest.main()
