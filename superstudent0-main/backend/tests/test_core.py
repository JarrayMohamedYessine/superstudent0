import asyncio
import json
import sys
import unittest

sys.path.insert(0, "src")
sys.path.insert(0, "tests")

from fakes import Clock, Crypto, FakeWorld, MemCache, NoCache, parse_multipart  # noqa: E402
from ss import texts as T  # noqa: E402
from ss.accounts import AccountStore, public_view  # noqa: E402
from ss.state import StateError  # noqa: E402
from ss.app import App, jr  # noqa: E402
from ss.ports import Req  # noqa: E402
from ss.telegram import TelegramBusy, TelegramClient, build_multipart  # noqa: E402

run = lambda c: asyncio.run(c)  # noqa: E731
NOSLEEP = lambda s: asyncio.sleep(0)  # noqa: E731


def make(cache_cls=MemCache, owner="owner@x.tn"):
    clock, world, kv = Clock(), FakeWorld(), None
    cache = cache_cls(clock) if cache_cls is MemCache else cache_cls()
    cfg = {"TELEGRAM_BOT_TOKEN": world.TOKEN, "TELEGRAM_CHAT_ID": "-1001", "JWT_SECRET": "j" * 40,
           "PEPPER": "p" * 40, "OWNER_EMAIL": owner, "EXPORT_TOKEN": "e" * 30, "MAX_UPLOAD_MB": "50",
           "PBKDF2_ITERATIONS": "100000"}
    app = App(cfg, cache, world, Crypto(), clock, sleep=NOSLEEP)
    return app, world, kv, cache, clock


def call(app, method, path, body=None, token=None, query=None, headers=None, ip="1.1.1.1", raw=None, stream=None):
    h = dict(headers or {})
    if token:
        h["authorization"] = "Bearer " + token
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else b"")
    if body is not None:
        h.setdefault("content-type", "application/json")
    r = run(app.handle(Req(method, path, query or {}, h, data, ip, stream)))
    try:
        return r.status, json.loads(r.body or b"{}"), r
    except ValueError:
        return r.status, r.body, r


def register(app, email, username, pw="secret123", ip="1.1.1.1"):
    s, b, _ = call(app, "POST", "/api/auth/register",
                   {"email": email, "username": username, "password": pw, "displayName": username,
                    "branch": "math", "gradeLevel": "4eme_bac", "avatar": None}, ip=ip)
    assert s == 201, b
    return b["token"], b["user"]


class StaticRules(unittest.TestCase):
    def test_static_budget_never_exceeds_20(self):
        self.assertLessEqual(T.FIXED_FILES + T.PEOPLE_SLOTS, 20)
        self.assertEqual(T.PEOPLE_CAPACITY, T.PEOPLE_SLOTS * 100_000)

    def test_owner_split_10_archive_2_ads_1_faq(self):
        names = T.static_file_names()
        self.assertEqual(len([n for n in names if n.startswith("archive-bank.")]), 10)
        self.assertEqual(len([n for n in names if n.startswith("ads.")]), 2)
        self.assertIn("faqs.json", names)

    def test_private_collections_not_in_static(self):
        names = " ".join(T.static_file_names())
        self.assertNotIn("requests", names)
        self.assertNotIn("moderation", names)

    def test_no_kv_anywhere(self):
        import pathlib
        root = pathlib.Path("src")
        for f in list(root.rglob("*.py")) + [pathlib.Path("wrangler.toml")]:
            text = f.read_text(encoding="utf-8").lower()
            self.assertNotIn("kv_namespaces", text, f)
            self.assertNotIn("env.kv", text, f)
            self.assertNotIn("cfkv", text, f)


class Multipart(unittest.TestCase):
    def test_roundtrip_binary(self):
        data = bytes(range(256)) * 3
        body, ct = build_multipart({"a": "1"}, [("f", 'we"ird\r\nname.pdf', data, "application/pdf")], "BND")
        fields, files = parse_multipart(body, ct)
        self.assertEqual(fields["a"], "1")
        self.assertEqual(files["f"][1], data)
        self.assertNotIn('"', files["f"][0].replace("weird", ""))


class Telegram(unittest.TestCase):
    def test_retry_on_429_then_ok(self):
        w = FakeWorld(); w.fail_429_times = 1
        tg = TelegramClient(w, Crypto(), w.TOKEN, "-1", sleep=NOSLEEP)
        self.assertEqual(run(tg.send_document("a.json", b"{}"))["mid"], 101)

    def test_busy_when_429_persists(self):
        w = FakeWorld(); w.fail_429_times = 5
        tg = TelegramClient(w, Crypto(), w.TOKEN, "-1", sleep=NOSLEEP)
        with self.assertRaises(TelegramBusy):
            run(tg.send_document("a.json", b"{}"))

    def test_token_never_leaks_in_error(self):
        w = FakeWorld()
        tg = TelegramClient(w, Crypto(), w.TOKEN, "-1", sleep=NOSLEEP)
        tg._token = w.TOKEN  # valid; now simulate scrub with a bad token echo
        bad = TelegramClient(w, Crypto(), "999:BAD", "-1", sleep=NOSLEEP)
        try:
            run(bad.get_me())
        except Exception as e:
            self.assertNotIn("999:BAD", str(e))


class TextStoreTests(unittest.TestCase):
    def setUp(self):
        self.app, self.w, self.kv, self.cache, self.clock = make()
        self.ts = self.app.texts

    def head(self):
        return run(self.app.head.read(fresh=True))

    def test_upsert_list_remove_and_sharding(self):
        for i in range(25):
            run(self.ts.upsert("archive-bank", {"id": f"doc-{i}", "title": f"t{i}", "createdAt": i}))
        items = run(self.ts.list_items("archive-bank"))
        self.assertEqual([d["id"] for d in items][:2], ["doc-24", "doc-23"])
        used = [k for k in self.head()["t"] if k.startswith("archive-bank.")]
        self.assertGreater(len(used), 3)
        self.assertTrue(run(self.ts.remove("archive-bank", "doc-3")))
        self.assertFalse(run(self.ts.remove("archive-bank", "doc-3")))
        self.assertEqual(len(run(self.ts.list_items("archive-bank"))), 24)

    def test_keeps_last_versions_and_deletes_older(self):
        for i in range(8):
            run(self.ts.upsert("ads", {"id": "a1", "n": i}))
        ptrs = [p for k, p in self.head()["t"].items() if k.startswith("ads.")]
        self.assertEqual(len(ptrs), 1)
        self.assertEqual(ptrs[0]["v"], 8)
        self.assertEqual(len(ptrs[0]["prev"]), T.KEEP_VERSIONS)
        # old shard versions beyond KEEP_VERSIONS were removed from Telegram, newer ones kept
        shard_msgs = [m for m, v in self.w.msgs.items() if v["name"].startswith("ads.") and m not in self.w.deleted]
        self.assertEqual(len(shard_msgs), T.KEEP_VERSIONS + 1)

    def test_head_is_pinned_and_old_heads_trimmed(self):
        for i in range(8):
            run(self.ts.upsert("faqs", {"id": f"f{i}"}))
        head = self.head()
        self.assertEqual(self.w.pinned, head["_mid"])
        live_heads = [m for m, v in self.w.msgs.items() if v["name"].startswith("head-") and m not in self.w.deleted]
        self.assertLessEqual(len(live_heads), 4)

    def test_read_uses_cache_then_telegram_after_a_week(self):
        run(self.ts.upsert("faqs", {"id": "f1", "q": "x"}))
        self.w.calls.clear()
        run(self.ts.list_items("faqs"))
        self.assertFalse([c for c in self.w.calls if "getFile" in c[1]])  # cache hit
        self.clock.advance(7 * 24 * 3600 + 1)
        self.assertEqual(run(self.ts.list_items("faqs"))[0]["id"], "f1")
        self.assertTrue([c for c in self.w.calls if "getFile" in c[1]])  # re-read from Telegram

    def test_works_without_cache_workers_dev(self):
        app, w, kv, cache, clock = make(NoCache)
        run(app.texts.upsert("faqs", {"id": "f1"}))
        self.assertEqual(run(app.texts.list_items("faqs"))[0]["id"], "f1")

    def test_export_public_rules(self):
        run(self.ts.upsert("ads", {"id": "a1", "title": "x"}))
        run(self.ts.upsert("moderation", {"id": "user:bad", "kind": "user", "value": "bad"}))
        run(self.ts.upsert("requests", {"id": "elite:1", "email": "private@x.tn"}))
        files = run(self.ts.export_public())
        self.assertEqual(sorted(files), sorted(T.static_file_names()))
        joined = b"".join(files.values())
        self.assertNotIn(b"user:bad", joined)
        self.assertNotIn(b"private@x.tn", joined)
        self.assertEqual(json.loads(files["ads.0.json"])["items"] + json.loads(files["ads.1.json"])["items"],
                         [{"id": "a1", "title": "x"}])

    def test_public_items_never_carry_emails_or_passwords(self):
        run(self.ts.upsert("faqs", {"id": "f1", "question": "q", "authorEmail": "a@b.co",
                                    "nested": {"Password": "x", "ok": 1}}))
        files = run(self.ts.export_public())
        blob = files["faqs.json"].decode()
        self.assertNotIn("a@b.co", blob)
        self.assertNotIn("Password", blob)
        self.assertIn('"ok":1', blob)

    def test_item_validation(self):
        with self.assertRaises(T.StoreError):
            run(self.ts.upsert("ads", {"title": "no id"}))
        with self.assertRaises(T.StoreError):
            run(self.ts.upsert("ads", {"id": "big", "x": "a" * 70000}))
        with self.assertRaises(T.StoreError):
            run(self.ts.upsert("nope", {"id": "1"}))

    def test_conflicting_writer_is_retried_not_lost(self):
        run(self.ts.upsert("ads", {"id": "a"}))
        self.w.after_pin = FakeWorld.inject_foreign_head  # another writer pins a newer head once
        run(self.ts.upsert("ads", {"id": "b"}))
        ids = sorted(i["id"] for i in run(self.ts.list_items("ads", fresh=True)))
        self.assertIn("b", ids)

    def test_persistent_conflict_gives_409(self):
        def always(w):
            w.inject_foreign_head()
            w.after_pin = always
        self.w.after_pin = always
        with self.assertRaises(StateError) as ctx:
            run(self.ts.upsert("ads", {"id": "x"}))
        self.assertEqual(ctx.exception.status, 409)


class AccountTests(unittest.TestCase):
    def setUp(self):
        self.app, self.w, self.kv, self.cache, self.clock = make()

    def test_register_login_me_update(self):
        token, user = register(self.app, "Ali@Mail.com", "ali_1")
        self.assertNotIn("passhash", user)
        self.assertEqual(user["role"], "member")
        s, b, _ = call(self.app, "POST", "/api/auth/login", {"emailOrUsername": "ali_1", "password": "secret123"})
        self.assertEqual(s, 200)
        s, b, _ = call(self.app, "GET", "/api/auth/me", token=b["token"])
        self.assertEqual(b["user"]["email"], "ali@mail.com")
        s, b, _ = call(self.app, "POST", "/api/auth/update", {"displayName": "Ali B", "role": "superadmin"}, token=token)
        self.assertEqual(b["user"]["displayName"], "Ali B")
        self.assertEqual(b["user"]["role"], "member")  # role cannot be self-assigned

    def test_owner_email_is_superadmin_others_not(self):
        _, u = register(self.app, "owner@x.tn", "owner1")
        self.assertEqual(u["role"], "superadmin")
        _, u2 = register(self.app, "second@x.tn", "second1")
        self.assertEqual(u2["role"], "member")

    def test_duplicates_rejected(self):
        register(self.app, "a@b.co", "user_a")
        s, b, _ = call(self.app, "POST", "/api/auth/register",
                       {"email": "A@B.co", "username": "other", "password": "secret123"})
        self.assertEqual(s, 409)
        s, b, _ = call(self.app, "POST", "/api/auth/register",
                       {"email": "z@b.co", "username": "USER_A", "password": "secret123"})
        self.assertEqual(s, 409)

    def test_secrets_only_in_telegram_hashed(self):
        register(self.app, "s@s.co", "sec_user", pw="MyPlainPassw0rd")
        blobs = b"".join(self.w.all_telegram_blobs())
        self.assertIn(b"passhash", blobs)
        self.assertNotIn(b"MyPlainPassw0rd", blobs)
        # the e-mail exists only inside the account bucket, never in the head / texts / export
        for mid, m in self.w.msgs.items():
            if not m["name"].startswith("bkt-"):
                self.assertNotIn(b"s@s.co", self.w.files[f"documents/{m['fid']}"], m["name"])
        s, b, _ = call(self.app, "GET", "/api/admin/export", headers={"x-export-token": "e" * 30})
        self.assertNotIn("s@s.co", json.dumps(b))
        self.assertNotIn("passhash", json.dumps(b))

    def test_wrong_password_and_unknown_user_same_error(self):
        register(self.app, "w@w.co", "wuser")
        s1, b1, _ = call(self.app, "POST", "/api/auth/login", {"emailOrUsername": "wuser", "password": "bad-pass"})
        s2, b2, _ = call(self.app, "POST", "/api/auth/login", {"emailOrUsername": "ghost", "password": "bad-pass"})
        self.assertEqual((s1, b1), (s2, b2))
        self.assertEqual(s1, 401)

    def test_login_rate_limit(self):
        register(self.app, "r@r.co", "ruser")
        codes = [call(self.app, "POST", "/api/auth/login", {"emailOrUsername": "ruser", "password": "bad-pass"})[0]
                 for _ in range(10)]
        self.assertEqual(codes[:8], [401] * 8)
        self.assertEqual(codes[8], 429)

    def test_secret_cache_one_day(self):
        token, _ = register(self.app, "c@c.co", "cuser")
        self.w.calls.clear()
        call(self.app, "GET", "/api/auth/me", token=token)
        self.assertFalse([c for c in self.w.calls if "getFile" in c[1]])  # served from cache
        self.clock.advance(24 * 3600 + 5)
        s, _, _ = call(self.app, "GET", "/api/auth/me", token=token)
        self.assertEqual(s, 200)
        self.assertTrue([c for c in self.w.calls if "getFile" in c[1]])  # cache expired -> Telegram again

    def test_token_tamper_and_expiry(self):
        token, _ = register(self.app, "t@t.co", "tuser")
        bad = token[:-3] + ("AAA" if not token.endswith("AAA") else "BBB")
        self.assertEqual(call(self.app, "GET", "/api/auth/me", token=bad)[0], 401)
        self.assertEqual(call(self.app, "GET", "/api/auth/me")[0], 401)
        self.clock.advance(31 * 24 * 3600)
        self.assertEqual(call(self.app, "GET", "/api/auth/me", token=token)[0], 401)

    def test_signup_cost_and_login_is_read_only(self):
        def uploads():
            return len([c for c in self.w.calls if c[1].endswith("sendDocument")])
        before = uploads()
        register(self.app, "k@k.co", "kuser")
        self.assertLessEqual(uploads() - before, 3)  # up to 2 buckets + the head
        before = uploads()
        call(self.app, "POST", "/api/auth/login", {"emailOrUsername": "kuser", "password": "secret123"})
        call(self.app, "POST", "/api/auth/login", {"emailOrUsername": "k@k.co", "password": "secret123"})
        self.assertEqual(uploads(), before)

    def test_many_users_login_by_email_and_username(self):
        for i in range(30):
            register(self.app, f"user{i}@x.co", f"user_{i:02d}", ip=f"5.5.5.{i}")
        self.app.cache.d.clear()  # cold isolate
        for i in (0, 13, 29):
            self.assertEqual(call(self.app, "POST", "/api/auth/login",
                                  {"emailOrUsername": f"USER_{i:02d}", "password": "secret123"})[0], 200)
            self.assertEqual(call(self.app, "POST", "/api/auth/login",
                                  {"emailOrUsername": f"User{i}@X.co", "password": "secret123"})[0], 200)

    def test_pending_people_ops_have_no_secrets_and_ack_clears_them(self):
        register(self.app, "pp@x.co", "pp_user", pw="TopSecret99")
        s, b, _ = call(self.app, "GET", "/api/admin/export", headers={"x-export-token": "e" * 30})
        ops = b["people"]["pending"]
        self.assertEqual([o["u"] for o in ops], ["pp_user"])
        self.assertEqual(set(ops[0]) - {"s", "op", "u", "n", "a", "b", "g", "r", "c"}, set())
        self.assertNotIn("pp@x.co", json.dumps(ops))
        self.assertNotIn("TopSecret99", json.dumps(ops))
        seq = b["people"]["seq"]
        self.assertEqual(call(self.app, "POST", "/api/admin/ack", {"seq": seq}, headers={"x-export-token": "e" * 30})[0], 200)
        s, b, _ = call(self.app, "GET", "/api/admin/export", headers={"x-export-token": "e" * 30})
        self.assertEqual(b["people"]["pending"], [])
        self.assertEqual(b["people"]["count"], 1)
        self.assertEqual(call(self.app, "POST", "/api/admin/ack", {"seq": 1})[0], 403)

    def test_profile_update_and_delete_generate_ops(self):
        token, user = register(self.app, "up@x.co", "up_user")
        call(self.app, "POST", "/api/auth/update", {"avatarUrl": "https://files.catbox.moe/av1.png"}, token=token)
        owner, _ = register(self.app, "owner@x.tn", "owner1", ip="2.2.2.2")
        call(self.app, "POST", "/api/admin/user", {"email": "up@x.co", "role": "teacher"}, token=owner)
        s, b, _ = call(self.app, "GET", "/api/admin/export", headers={"x-export-token": "e" * 30})
        mine = [o for o in b["people"]["pending"] if o["u"] == "up_user"]
        self.assertEqual(mine[-1]["r"], "teacher")
        self.assertEqual(mine[-1]["a"], "https://files.catbox.moe/av1.png")
        s, _, _ = call(self.app, "POST", "/api/admin/delete-user", {"email": "up@x.co"}, token=owner)
        self.assertEqual(s, 200)
        self.assertEqual(call(self.app, "POST", "/api/auth/login", {"emailOrUsername": "up_user", "password": "secret123"})[0], 401)
        s, b, _ = call(self.app, "GET", "/api/admin/export", headers={"x-export-token": "e" * 30})
        self.assertEqual(b["people"]["pending"][-1]["op"], "del")
        self.assertEqual(b["people"]["count"], 1)

    def test_capacity_and_pending_limits_refuse_signups_cleanly(self):
        async def fill(head):
            head["n"] = T.PEOPLE_CAPACITY
            return head
        run(self.app.head.commit(fill))
        s, b, _ = call(self.app, "POST", "/api/auth/register", {"email": "z@z.co", "username": "zuser", "password": "secret123"})
        self.assertEqual(s, 503)

        async def unfill(head):
            head["n"] = 0
            head["p"] = [{"s": i, "op": "up", "u": f"x{i}"} for i in range(5000)]
            return head
        run(self.app.head.commit(unfill))
        s, b, _ = call(self.app, "POST", "/api/auth/register", {"email": "y@z.co", "username": "yuser", "password": "secret123"}, ip="8.8.8.8")
        self.assertEqual(s, 503)

    def test_password_change(self):
        token, _ = register(self.app, "p@p.co", "puser")
        s, _, _ = call(self.app, "POST", "/api/auth/update", {"newPassword": "newsecret1"}, token=token)
        self.assertEqual(s, 403)
        s, _, _ = call(self.app, "POST", "/api/auth/update",
                       {"newPassword": "newsecret1", "currentPassword": "secret123"}, token=token)
        self.assertEqual(s, 200)
        self.assertEqual(call(self.app, "POST", "/api/auth/login",
                              {"emailOrUsername": "puser", "password": "newsecret1"})[0], 200)

    def test_short_jwt_secret_refused(self):
        with self.assertRaises(ValueError):
            AccountStore(self.app.head, self.app.tg, self.cache, Crypto(), self.clock, "p" * 40, "short")


class FilesAndDocs(unittest.TestCase):
    def setUp(self):
        self.app, self.w, self.kv, self.cache, self.clock = make()
        self.owner, _ = register(self.app, "owner@x.tn", "owner1")
        self.member, _ = register(self.app, "m@x.tn", "member1", ip="2.2.2.2")

    def mp(self):
        body, ct = build_multipart({"reqtype": "fileupload"}, [("fileToUpload", "a.pdf", b"%PDF-1.4 hi", "application/pdf")], "B1")
        return body, ct

    def test_pdf_upload_requires_publisher_and_streams(self):
        body, ct = self.mp()
        hdr = {"content-type": ct, "content-length": str(len(body))}
        s, b, _ = call(self.app, "POST", "/api/storage/upload", token=self.member, headers=hdr, raw=b"", stream=body,
                       query={"folder": "pdfs"})
        self.assertEqual(s, 403)
        s, b, _ = call(self.app, "POST", "/api/storage/upload", headers=hdr, raw=b"", stream=body, query={"folder": "pdfs"})
        self.assertEqual(s, 401)
        s, b, _ = call(self.app, "POST", "/api/storage/upload", token=self.owner, headers=hdr, raw=b"", stream=body,
                       query={"folder": "pdfs"})
        self.assertEqual(s, 200, b)
        self.assertTrue(b["url"].startswith("https://files.catbox.moe/"))
        self.assertIsNotNone(self.w.last_forward)  # body was forwarded untouched
        self.assertNotIn("content-length: 0", str(self.w.last_forward[0]))

    def test_upload_size_and_length_rules(self):
        hdr = {"content-type": "multipart/form-data; boundary=B1", "content-length": str(60 * 1024 * 1024)}
        s, _, _ = call(self.app, "POST", "/api/storage/upload", token=self.owner, headers=hdr, raw=b"", stream=b"x")
        self.assertEqual(s, 413)
        hdr = {"content-type": "multipart/form-data; boundary=B1"}
        s, _, _ = call(self.app, "POST", "/api/storage/upload", token=self.owner, headers=hdr, raw=b"", stream=b"x")
        self.assertEqual(s, 411)

    def test_json_upload_images_for_members_but_only_real_files(self):
        import base64
        png = b"\x89PNG\r\n\x1a\n" + b"0" * 20
        du = "data:image/png;base64," + base64.b64encode(png).decode()
        s, b, _ = call(self.app, "POST", "/api/storage/upload", {"dataUrl": du, "fileName": "av.png", "folder": "avatars"},
                       token=self.member)
        self.assertEqual(s, 200, b)
        evil = "data:text/html;base64," + base64.b64encode(b"<script>alert(1)</script>").decode()
        s, _, _ = call(self.app, "POST", "/api/storage/upload", {"dataUrl": evil, "fileName": "x.html", "folder": "images"},
                       token=self.member)
        self.assertEqual(s, 415)
        pdf = "data:application/pdf;base64," + base64.b64encode(b"%PDF-1.4 x").decode()
        s, _, _ = call(self.app, "POST", "/api/storage/upload", {"dataUrl": pdf, "fileName": "x.pdf", "folder": "images"},
                       token=self.member)
        self.assertEqual(s, 403)  # a PDF disguised as an image still needs publisher rights

    def test_catbox_down_gives_502_not_crash(self):
        self.w.catbox_down = True
        body, ct = self.mp()
        s, b, _ = call(self.app, "POST", "/api/storage/upload", token=self.owner, raw=b"", stream=body,
                       headers={"content-type": ct, "content-length": str(len(body))}, query={"folder": "pdfs"})
        self.assertEqual(s, 502)
        self.assertNotIn(self.w.TOKEN, json.dumps(b))

    def test_file_proxy_cache_one_day_and_allowlist(self):
        link = run(self.app.catbox.upload_bytes("a.pdf", b"%PDF-1.4 body", "application/pdf"))
        s, body, r = call(self.app, "GET", "/api/file", query={"u": link})
        self.assertEqual((s, r.headers["x-ss-cache"], r.headers["content-type"]), (200, "miss", "application/pdf"))
        self.w.catbox_down = True  # Catbox dies; the cached copy still serves
        s, body, r = call(self.app, "GET", "/api/file", query={"u": link})
        self.assertEqual((s, r.headers["x-ss-cache"]), (200, "hit"))
        self.clock.advance(24 * 3600 + 1)
        self.assertEqual(call(self.app, "GET", "/api/file", query={"u": link})[0], 404)
        for evil in ("http://169.254.169.254/x", "https://evil.com/f.pdf", "https://files.catbox.moe.evil.com/a.pdf"):
            self.assertEqual(call(self.app, "GET", "/api/file", query={"u": evil})[0], 400)

    def doc(self, **kw):
        d = {"title": "Bac Math 2025", "subjectId": "math", "branchIds": ["math"], "type": "devoir",
             "pdfUrl": "https://files.catbox.moe/abc123.pdf", "pdfDataUrl": "https://files.catbox.moe/abc123.pdf",
             "authorUsername": "FAKE", "authorRole": "superadmin"}
        d.update(kw)
        return d

    def test_documents_publish_strips_base64_and_forged_author(self):
        s, b, _ = call(self.app, "POST", "/api/documents", self.doc(pdfDataUrl="data:application/pdf;base64," + "A" * 1000),
                       token=self.owner)
        self.assertEqual(s, 201, b)
        s, lst, r = call(self.app, "GET", "/api/documents")
        self.assertEqual(len(lst), 1)
        self.assertEqual(lst[0]["authorUsername"], "owner1")  # forged author ignored
        self.assertEqual(lst[0]["authorRole"], "superadmin")
        self.assertNotIn("data:", json.dumps(lst))
        self.assertIn("max-age=60", r.headers["cache-control"])

    def test_documents_require_real_link_and_rights(self):
        s, _, _ = call(self.app, "POST", "/api/documents", self.doc(pdfUrl="local-doc://abc/x.pdf", pdfDataUrl="data:x"),
                       token=self.owner)
        self.assertEqual(s, 422)
        self.assertEqual(call(self.app, "POST", "/api/documents", self.doc(), token=self.member)[0], 403)
        self.assertEqual(call(self.app, "POST", "/api/documents", self.doc())[0], 401)

    def test_huge_document_body_rejected_before_parsing(self):
        s, b, _ = call(self.app, "POST", "/api/documents", self.doc(note="A" * 300_000), token=self.owner)
        self.assertEqual(s, 413)
        s, b, _ = call(self.app, "POST", "/api/documents", self.doc(pdfUrl="data:application/pdf;base64," + "A" * 400_000),
                       token=self.owner)
        self.assertEqual(s, 413)

    def test_documents_delete_permissions(self):
        s, b, _ = call(self.app, "POST", "/api/documents", self.doc(), token=self.owner)
        did = b["id"]
        self.assertEqual(call(self.app, "DELETE", "/api/documents", token=self.member, query={"id": did})[0], 403)
        self.assertEqual(call(self.app, "DELETE", "/api/documents", token=self.owner, query={"id": did})[0], 200)
        self.assertEqual(call(self.app, "GET", "/api/documents")[1], [])

    def test_export_needs_token_and_has_no_secrets(self):
        call(self.app, "POST", "/api/documents", self.doc(), token=self.owner)
        self.assertEqual(call(self.app, "GET", "/api/admin/export")[0], 403)
        self.assertEqual(call(self.app, "GET", "/api/admin/export", headers={"x-export-token": "wrong" * 8})[0], 403)
        s, b, _ = call(self.app, "GET", "/api/admin/export", headers={"x-export-token": "e" * 30})
        self.assertEqual(s, 200)
        blob = json.dumps(b)
        self.assertNotIn("passhash", blob)
        self.assertNotIn("owner@x.tn", blob)
        self.assertLessEqual(len(b["files"]), 20)

    def test_export_disabled_when_token_short(self):
        self.app.cfg["EXPORT_TOKEN"] = "short"
        self.assertEqual(call(self.app, "GET", "/api/admin/export", headers={"x-export-token": "short"})[0], 403)

    def test_generic_store_permissions_and_private_hidden(self):
        s, _, _ = call(self.app, "POST", "/api/store/ads", {"id": "ad1", "title": "x"}, token=self.member)
        self.assertEqual(s, 403)
        s, _, _ = call(self.app, "POST", "/api/store/ads", {"id": "ad1", "title": "x"}, token=self.owner)
        self.assertEqual(s, 201)
        self.assertEqual(call(self.app, "GET", "/api/store/ads")[1]["items"][0]["id"], "ad1")
        self.assertEqual(call(self.app, "GET", "/api/store/moderation")[0], 404)

    def test_moderation_flow_blocks_login_and_register(self):
        s, _, _ = call(self.app, "POST", "/api/moderation/ban", {"userId": "member1"}, token=self.member)
        self.assertEqual(s, 403)
        s, _, _ = call(self.app, "POST", "/api/moderation/ban", {"userId": "member1", "reason": "spam"}, token=self.owner)
        self.assertEqual(s, 200)
        s, b, _ = call(self.app, "GET", "/api/moderation/status", token=self.owner)
        self.assertEqual((b["totalBannedUsers"], b["bannedUsers"]), (1, ["member1"]))
        s, _, _ = call(self.app, "POST", "/api/auth/login", {"emailOrUsername": "member1", "password": "secret123"})
        self.assertEqual(s, 403)
        call(self.app, "POST", "/api/moderation/ban", {"ip": "9.9.9.9"}, token=self.owner)
        s, _, _ = call(self.app, "POST", "/api/auth/register",
                       {"email": "n@n.co", "username": "newone", "password": "secret123"}, ip="9.9.9.9")
        self.assertEqual(s, 403)
        call(self.app, "POST", "/api/moderation/unban", {"userId": "member1"}, token=self.owner)
        s, _, _ = call(self.app, "POST", "/api/auth/login", {"emailOrUsername": "member1", "password": "secret123"})
        self.assertEqual(s, 200)

    def test_admin_ban_by_flag_blocks_existing_token(self):
        s, _, _ = call(self.app, "POST", "/api/admin/user", {"email": "m@x.tn", "banned": True}, token=self.owner)
        self.assertEqual(s, 200)
        self.assertEqual(call(self.app, "GET", "/api/auth/me", token=self.member)[0], 401)

    def test_health_telegram_status_cleanup(self):
        self.assertEqual(call(self.app, "GET", "/api/health")[1]["status"], "ok")
        s, b, _ = call(self.app, "GET", "/api/telegram/status", token=self.owner, query={"probe": "1"})
        self.assertEqual((s, b["botConfigured"], b["reachable"]), (200, True, True))
        self.assertEqual(call(self.app, "GET", "/api/telegram/status", token=self.member)[0], 403)
        self.assertEqual(call(self.app, "POST", "/api/storage/cleanup", token=self.owner)[0], 200)

    def test_unknown_route_and_options(self):
        self.assertEqual(call(self.app, "GET", "/api/nope")[0], 404)
        self.assertEqual(call(self.app, "OPTIONS", "/api/documents")[0], 204)

    def test_telegram_busy_becomes_503_with_retry_after(self):
        self.w.fail_429_times = 99
        s, b, r = call(self.app, "POST", "/api/store/ads", {"id": "x"}, token=self.owner)
        self.assertEqual(s, 503)
        self.assertIn("retry-after", r.headers)


class RequestsPrivate(unittest.TestCase):
    def setUp(self):
        self.app, self.w, self.kv, self.cache, self.clock = make()
        self.owner, _ = register(self.app, "owner@x.tn", "owner1")
        self.stu, _ = register(self.app, "stu@x.tn", "student1", ip="2.2.2.2")
        self.other, _ = register(self.app, "oth@x.tn", "student2", ip="3.3.3.3")

    def elite(self, **kw):
        d = {"id": "elite-app-1", "username": "FORGED", "displayName": "Stu", "email": "stu@x.tn",
             "discordUsername": "stu#1", "reason": "please", "status": "approved",
             "proofImageUrl": "https://files.catbox.moe/proof1.jpg"}
        d.update(kw)
        return d

    def test_user_submits_staff_reads_and_username_is_forced(self):
        s, b, _ = call(self.app, "POST", "/api/requests", {"kind": "elite", "item": self.elite()}, token=self.stu)
        self.assertEqual(s, 201, b)
        self.assertEqual(call(self.app, "GET", "/api/requests", token=self.stu, query={"kind": "elite"})[0], 403)
        self.assertEqual(call(self.app, "GET", "/api/requests", query={"kind": "elite"})[0], 401)
        s, b, _ = call(self.app, "GET", "/api/requests", token=self.owner, query={"kind": "elite"})
        self.assertEqual(len(b["items"]), 1)
        item = b["items"][0]
        self.assertEqual((item["id"], item["username"]), ("elite-app-1", "student1"))
        self.assertEqual(item["proofImageUrl"], "https://files.catbox.moe/proof1.jpg")
        self.assertNotIn("rid", item)

    def test_base64_proof_dropped_and_requests_never_public(self):
        call(self.app, "POST", "/api/requests", {"kind": "elite", "item": self.elite(proofImageUrl="data:image/jpeg;base64," + "A" * 500)},
             token=self.stu)
        s, b, _ = call(self.app, "GET", "/api/requests", token=self.owner, query={"kind": "elite"})
        self.assertNotIn("proofImageUrl", b["items"][0])
        s, exp, _ = call(self.app, "GET", "/api/admin/export", headers={"x-export-token": "e" * 30})
        self.assertNotIn("stu@x.tn", json.dumps(exp))
        self.assertNotIn("stu#1", json.dumps(exp))
        self.assertEqual(call(self.app, "GET", "/api/store/requests")[0], 404)

    def test_cannot_overwrite_someone_elses_request(self):
        call(self.app, "POST", "/api/requests", {"kind": "feedback", "item": {"id": "fb1", "comment": "mine"}}, token=self.stu)
        s, _, _ = call(self.app, "POST", "/api/requests", {"kind": "feedback", "item": {"id": "fb1", "comment": "hijack"}},
                       token=self.other)
        self.assertEqual(s, 403)

    def test_staff_update_and_delete_and_kinds(self):
        call(self.app, "POST", "/api/requests", {"kind": "complaint", "item": {"id": "c1", "reason": "x", "status": "pending"}},
             token=self.stu)
        s, _, _ = call(self.app, "POST", "/api/requests/update",
                       {"kind": "complaint", "id": "c1", "changes": {"status": "resolved", "username": "evil"}}, token=self.owner)
        self.assertEqual(s, 200)
        items = call(self.app, "GET", "/api/requests", token=self.owner, query={"kind": "complaint"})[1]["items"]
        self.assertEqual((items[0]["status"], items[0]["reporterUsername"]), ("resolved", "student1"))
        self.assertEqual(call(self.app, "GET", "/api/requests", token=self.owner, query={"kind": "elite"})[1]["items"], [])
        self.assertEqual(call(self.app, "DELETE", "/api/requests", token=self.stu, query={"kind": "complaint", "id": "c1"})[0], 403)
        self.assertEqual(call(self.app, "DELETE", "/api/requests", token=self.owner, query={"kind": "complaint", "id": "c1"})[0], 200)
        self.assertEqual(call(self.app, "POST", "/api/requests", {"kind": "bogus", "item": {"id": "1"}}, token=self.stu)[0], 422)


class ContentBulk(unittest.TestCase):
    def setUp(self):
        self.app, self.w, self.kv, self.cache, self.clock = make()
        self.owner, _ = register(self.app, "owner@x.tn", "owner1")
        self.stu, _ = register(self.app, "stu@x.tn", "student1", ip="2.2.2.2")
        call(self.app, "POST", "/api/admin/user", {"email": "stu@x.tn", "role": "elite_student"}, token=self.owner)

    def up(self, kind, rid, **kw):
        return {"kind": kind, "item": {"id": rid, "title": kw.pop("title", "t"), **kw}}

    def items(self):
        return call(self.app, "GET", "/api/store/content")[1]["items"]

    def test_staff_bulk_is_one_commit_and_content_is_public(self):
        before = len([c for c in self.w.calls if c[1].endswith("sendDocument")])
        s, b, _ = call(self.app, "POST", "/api/content/bulk",
                       {"upserts": [self.up("home_ann", f"h{i}") for i in range(30)]}, token=self.owner)
        self.assertEqual((s, b["saved"]), (200, 30))
        uploads = len([c for c in self.w.calls if c[1].endswith("sendDocument")]) - before
        self.assertLessEqual(uploads, 2)  # one shard document + one head, not 30 writes
        self.assertEqual(len(self.items()), 30)
        self.assertEqual(self.items()[0]["kind"], "home_ann")

    def test_per_kind_permissions(self):
        s, _, _ = call(self.app, "POST", "/api/content/bulk", {"upserts": [self.up("home_ann", "h1")]}, token=self.stu)
        self.assertEqual(s, 403)  # elite student cannot publish homepage announcements
        s, _, _ = call(self.app, "POST", "/api/content/bulk", {"upserts": [self.up("super_ann", "a1")]}, token=self.stu)
        self.assertEqual(s, 200)
        plain, _ = register(self.app, "plain@x.tn", "plain1", ip="3.3.3.3")
        s, _, _ = call(self.app, "POST", "/api/content/bulk", {"upserts": [self.up("super_ann", "a2")]}, token=plain)
        self.assertEqual(s, 403)
        s, _, _ = call(self.app, "POST", "/api/content/bulk", {"upserts": [self.up("story", "s1")]}, token=plain)
        self.assertEqual(s, 200)
        self.assertEqual(call(self.app, "POST", "/api/content/bulk", {"upserts": [self.up("story", "s2")]})[0], 401)

    def test_non_staff_cannot_modify_or_delete_published_items(self):
        call(self.app, "POST", "/api/content/bulk", {"upserts": [self.up("story", "s1", title="original")]}, token=self.owner)
        s, b, _ = call(self.app, "POST", "/api/content/bulk", {"upserts": [self.up("story", "s1", title="hijacked")]}, token=self.stu)
        self.assertEqual((s, b["skipped"]), (200, 1))
        self.assertEqual(self.items()[0]["title"], "original")
        s, _, _ = call(self.app, "POST", "/api/content/bulk", {"deletes": [{"kind": "story", "id": "s1"}]}, token=self.stu)
        self.assertEqual(s, 403)
        s, _, _ = call(self.app, "POST", "/api/content/bulk", {"deletes": [{"kind": "story", "id": "s1"}]}, token=self.owner)
        self.assertEqual(s, 200)
        self.assertEqual(self.items(), [])

    def test_validation_and_no_emails_in_public_content(self):
        self.assertEqual(call(self.app, "POST", "/api/content/bulk", {"upserts": [self.up("bogus", "x")]}, token=self.owner)[0], 422)
        self.assertEqual(call(self.app, "POST", "/api/content/bulk",
                              {"upserts": [self.up("home_ann", f"h{i}") for i in range(101)]}, token=self.owner)[0], 422)
        call(self.app, "POST", "/api/content/bulk", {"upserts": [self.up("home_ann", "h1", authorEmail="x@y.tn")]}, token=self.owner)
        self.assertNotIn("x@y.tn", json.dumps(self.items()))


if __name__ == "__main__":
    unittest.main(verbosity=1)
