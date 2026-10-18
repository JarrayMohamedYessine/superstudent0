import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, "scripts")
import sync_store as S  # noqa: E402


def blob(items):
    return S.dumps({"items": items})


def op(s, u, **kw):
    d = {"s": s, "op": "up", "u": u, "n": u.title(), "a": None, "b": "math", "g": "4eme_bac", "r": "member", "c": s}
    d.update(kw)
    return d


def apply(existing, writes):
    out = dict(existing)
    out.update(writes)
    return out


def plan(existing, exported, ops=(), shard_max=100, slots=5, **kw):
    return S.plan_sync(existing, exported, list(ops), shard_max, slots, now=123, **kw)


class SyncRules(unittest.TestCase):
    def test_writes_only_changed_files_and_manifest(self):
        old = apply({}, plan({}, {"ads.0.json": blob([{"id": "1"}]), "faqs.json": blob([])}))
        w = plan(old, {"ads.0.json": blob([{"id": "1"}, {"id": "2"}]), "faqs.json": blob([])})
        self.assertEqual(set(w), {"ads.0.json", "manifest"})
        man = json.loads(w["manifest"])
        self.assertEqual(man["files"]["ads.0.json"]["n"], 2)

    def test_second_identical_sync_is_no_change(self):
        exp = {"ads.0.json": blob([{"id": "1"}])}
        first = apply({}, plan({}, exp))
        self.assertEqual(S.plan_sync(first, exp, [], 100, 5, now=99999), {})

    def test_never_replaces_items_with_empty(self):
        old = apply({}, plan({}, {"ads.0.json": blob([{"id": "1"}])}))
        with self.assertRaises(S.SyncError):
            plan(old, {"ads.0.json": blob([])})
        self.assertTrue(plan(old, {"ads.0.json": blob([])}, allow_shrink=True))

    def test_refuses_big_shrink(self):
        many = [{"id": str(i)} for i in range(20)]
        old = apply({}, plan({}, {"archive-bank.0.json": blob(many)}))
        with self.assertRaises(S.SyncError):
            plan(old, {"archive-bank.0.json": blob(many[:5])})
        self.assertTrue(plan(old, {"archive-bank.0.json": blob(many[:15])}))

    def test_rejects_unsafe_names(self):
        for bad in ("../x.json", "manifest", "people.0.json", "Evil.json", "a b.json"):
            with self.assertRaises(S.SyncError, msg=bad):
                plan({}, {bad: blob([])})

    def test_people_first_sync_creates_file_without_secrets(self):
        w = plan({}, {"faqs.json": blob([])}, [op(1, "ali"), op(2, "sara")])
        items = json.loads(w["people.0.json"])["items"]
        self.assertEqual([e["u"] for e in items], ["ali", "sara"])
        self.assertEqual(set(items[0]), set(S.PEOPLE_KEYS))
        self.assertEqual(json.loads(w["manifest"])["files"]["people.0.json"]["n"], 2)

    def test_people_update_in_place_delete_and_idempotent_replay(self):
        s1 = apply({}, plan({}, {"faqs.json": blob([])}, [op(1, "ali"), op(2, "sara")]))
        s2 = apply(s1, plan(s1, {"faqs.json": blob([])}, [op(3, "ALI", r="teacher"), op(4, "sara", **{"op": "del"})]))
        items = json.loads(s2["people.0.json"])["items"]
        self.assertEqual([(e["u"], e["r"]) for e in items], [("ALI", "teacher")])
        # replaying the same ops (ack lost) changes nothing
        self.assertEqual(S.plan_sync(s2, {"faqs.json": blob([])}, [op(3, "ALI", r="teacher"), op(4, "sara", **{"op": "del"})],
                                     100, 5, now=1), {})

    def test_new_people_file_opens_automatically_at_the_limit(self):
        ops = [op(i, f"user{i}") for i in range(1, 8)]
        w = plan({}, {"faqs.json": blob([])}, ops, shard_max=3, slots=5)
        self.assertEqual(sorted(n for n in w if n.startswith("people.")), ["people.0.json", "people.1.json", "people.2.json"])
        self.assertEqual([len(json.loads(w[f"people.{i}.json"])["items"]) for i in range(3)], [3, 3, 1])

    def test_refuses_when_no_free_people_slot(self):
        with self.assertRaises(S.SyncError):
            plan({}, {"faqs.json": blob([])}, [op(i, f"u{i}") for i in range(1, 8)], shard_max=3, slots=2)

    def test_total_never_exceeds_20_files(self):
        texts = {f"archive-bank.{i}.json": blob([]) for i in range(10)}
        texts.update({"ads.0.json": blob([]), "ads.1.json": blob([]), "faqs.json": blob([]), "content.json": blob([])})
        ops = [op(i, f"u{i}") for i in range(1, 6)]
        w = plan({}, texts, ops, shard_max=1, slots=5)
        self.assertEqual(len([n for n in w if n.endswith(".json") or n == "manifest"]), 20)  # 14 + 5 + manifest
        with self.assertRaises(S.SyncError):
            plan({}, texts, ops + [op(9, "extra")], shard_max=1, slots=6)

    def test_atomic_write_manifest_last_and_roundtrip(self):
        w = plan({}, {"faqs.json": blob([{"id": "1"}])}, [op(1, "ali")])
        with tempfile.TemporaryDirectory() as d:
            S.write_atomic(d, w)
            self.assertEqual(sorted(os.listdir(d)), ["faqs.json", "manifest", "people.0.json"])
            self.assertEqual(S.plan_sync(S.read_dir(d), {"faqs.json": blob([{"id": "1"}])}, [], 100, 5, now=5), {})

    def test_seed_manifest_is_compatible(self):
        seed = {"manifest": b'{"files":{},"generatedAt":0,"schema":1}'}
        w = plan(seed, {"ads.0.json": blob([{"id": "1"}])})
        self.assertEqual(set(w), {"ads.0.json", "manifest"})


if __name__ == "__main__":
    unittest.main()
