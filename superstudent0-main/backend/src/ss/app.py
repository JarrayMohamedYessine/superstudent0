"""HTTP routing + business rules. Pure Python: all I/O goes through ports."""
from __future__ import annotations

import base64
import binascii
import hmac
import json
from urllib.parse import quote

from .accounts import AccountStore, is_banned, public_view
from .catbox import CatboxClient, CatboxError
from .ports import Req, Resp
from .state import Head, StateError
from .telegram import TelegramBusy, TelegramClient, TelegramError
from .texts import (PEOPLE_CAPACITY, PEOPLE_SHARD_MAX, PEOPLE_SLOTS, REGISTRY, TextStore)
from .util import CATBOX_URL_RE, clean_str, loads, norm_email, sha256_hex

STAFF = ("superadmin", "moderator")
FILE_CACHE_TTL = 24 * 3600  # one day
MAX_JSON_UPLOAD = 3 * 1024 * 1024
MAX_FILE_CACHE_BYTES = 25 * 1024 * 1024
IMAGE_MAGIC = (b"\x89PNG", b"\xff\xd8\xff", b"GIF8", b"RIFF")
CONTENT_TYPES = {"pdf": "application/pdf", "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
                 "webp": "image/webp", "gif": "image/gif"}


class ConfigError(Exception):
    pass


class HttpError(Exception):
    def __init__(self, status: int, message: str, headers=None):
        super().__init__(message)
        self.status, self.message, self.headers = status, message, headers or {}


def jr(data, status: int = 200, cache: str = "no-store", extra=None) -> Resp:
    headers = {"content-type": "application/json; charset=utf-8", "cache-control": cache,
               "x-content-type-options": "nosniff"}
    headers.update(extra or {})
    return Resp(status, headers, json.dumps(data, ensure_ascii=False).encode("utf-8"))


def read_config(env: dict) -> dict:
    missing = [k for k in ("TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "JWT_SECRET", "PEPPER") if not env.get(k)]
    if missing:
        raise ConfigError("missing: " + ", ".join(missing))
    return {k: env.get(k, "") for k in ("TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "JWT_SECRET", "PEPPER",
                                         "OWNER_EMAIL", "EXPORT_TOKEN", "ALLOWED_ORIGIN", "PBKDF2_ITERATIONS",
                                         "MAX_UPLOAD_MB")}


class App:
    def __init__(self, cfg: dict, cache, http, crypto, clock, sleep=None):
        self.cfg, self.cache, self.http, self.crypto, self.clock = cfg, cache, http, crypto, clock
        tg_kwargs = {"sleep": sleep} if sleep else {}
        self.tg = TelegramClient(http, crypto, cfg["TELEGRAM_BOT_TOKEN"], cfg["TELEGRAM_CHAT_ID"], **tg_kwargs)
        self.head = Head(self.tg, cache, clock)
        self.texts = TextStore(self.head, self.tg, cache, clock)
        self.accounts = AccountStore(self.head, self.tg, cache, crypto, clock, cfg["PEPPER"], cfg["JWT_SECRET"],
                                     int(cfg.get("PBKDF2_ITERATIONS") or 100_000))
        self.catbox = CatboxClient(http, crypto.random_bytes)
        self.owner = norm_email(cfg.get("OWNER_EMAIL"))
        self.max_upload = int(float(cfg.get("MAX_UPLOAD_MB") or 50) * 1024 * 1024)

    # ---- plumbing ------------------------------------------------------
    async def handle(self, req: Req) -> Resp:
        try:
            resp = await self._route(req)
        except (HttpError, StateError) as e:
            resp = jr({"success": False, "error": e.message}, e.status, extra=getattr(e, "headers", None))
        except TelegramBusy as e:
            resp = jr({"success": False, "error": "الخادم مشغول، أعد المحاولة بعد لحظات"}, 503,
                      extra={"retry-after": str(e.retry_after)})
        except (TelegramError, CatboxError):
            resp = jr({"success": False, "error": "خدمة التخزين غير متاحة مؤقتاً"}, 502)
        return self._cors(req, resp)

    def _cors(self, req: Req, resp: Resp) -> Resp:
        origin = self.cfg.get("ALLOWED_ORIGIN")
        if origin and req.headers.get("origin") == origin:
            resp.headers.update({"access-control-allow-origin": origin, "vary": "Origin",
                                 "access-control-allow-headers": "Content-Type, Authorization"})
        return resp

    async def _rate(self, key: str, limit: int, window: int) -> None:
        raw = await self.cache.get(f"rl/{key}")
        n = int(raw) if raw else 0
        if n >= limit:
            raise HttpError(429, "محاولات كثيرة، حاول لاحقاً", {"retry-after": str(window)})
        await self.cache.put(f"rl/{key}", str(n + 1).encode(), window)

    async def _user(self, req: Req, roles=None) -> dict:
        auth = req.headers.get("authorization", "")
        token = auth[7:] if auth.lower().startswith("bearer ") else ""
        claims = await self.accounts.verify_token(token) if token else None
        if not claims:
            raise HttpError(401, "يلزم تسجيل الدخول")
        rec = await self.accounts.get_by_key(claims["sub"])
        if not rec or is_banned(rec, self.clock.now()):
            raise HttpError(401, "الحساب غير متاح")
        if roles and rec.get("role") not in roles:
            raise HttpError(403, "ليست لديك صلاحية")
        return rec

    @staticmethod
    def _can_publish(rec: dict) -> bool:
        return rec.get("role") in ("superadmin", "moderator", "teacher", "elite_student") or bool(rec.get("canUpload"))

    @staticmethod
    def _json(req: Req, limit: int = 256 * 1024) -> dict:
        if len(req.body or b"") > limit:  # refuse before parsing: keeps CPU/memory bounded
            raise HttpError(413, "الطلب كبير جداً (هل رُفع الملف إلى التخزين أولاً؟)")
        try:
            data = loads(req.body or b"{}")
        except ValueError:
            raise HttpError(400, "طلب غير صالح")
        if not isinstance(data, dict):
            raise HttpError(400, "طلب غير صالح")
        return data

    async def _banlist(self) -> list:
        return await self.texts.list_items("moderation")

    async def _check_not_banned(self, req: Req, *names) -> None:
        bans = {b["id"] for b in await self._banlist()}
        if req.ip and f"ip:{req.ip}" in bans:
            raise HttpError(403, "تم حظر هذا العنوان")
        for n in names:
            if n and f"user:{n.lower()}" in bans:
                raise HttpError(403, "تم حظر هذا الحساب")

    # ---- routing -------------------------------------------------------
    async def _route(self, req: Req) -> Resp:
        m, p = req.method.upper(), req.path.rstrip("/") or "/"
        if m == "OPTIONS":
            return Resp(204, {"cache-control": "public, max-age=86400"})
        if p == "/api/health" and m == "GET":
            return jr({"status": "ok", "backend": "python-worker", "time": int(self.clock.now())})
        table = {
            ("POST", "/api/auth/register"): self._register,
            ("POST", "/api/auth/login"): self._login,
            ("GET", "/api/auth/me"): self._me,
            ("POST", "/api/auth/update"): self._update,
            ("POST", "/api/storage/upload"): self._upload,
            ("POST", "/api/telegram/upload"): self._upload,
            ("GET", "/api/file"): self._file,
            ("GET", "/api/documents"): self._docs_list,
            ("POST", "/api/documents"): self._docs_add,
            ("DELETE", "/api/documents"): self._docs_del,
            ("GET", "/api/admin/export"): self._export,
            ("POST", "/api/admin/ack"): self._ack,
            ("POST", "/api/admin/delete-user"): self._admin_delete_user,
            ("POST", "/api/content/bulk"): self._content_bulk,
            ("POST", "/api/requests"): self._req_add,
            ("GET", "/api/requests"): self._req_list,
            ("POST", "/api/requests/update"): self._req_update,
            ("DELETE", "/api/requests"): self._req_del,
            ("POST", "/api/admin/user"): self._admin_user,
            ("POST", "/api/admin/verify-mirror"): self._verify_mirror,
            ("GET", "/api/admin/health"): self._admin_health,
            ("GET", "/api/moderation/status"): self._mod_status,
            ("POST", "/api/moderation/ban"): self._mod_ban,
            ("POST", "/api/moderation/unban"): self._mod_unban,
            ("GET", "/api/telegram/status"): self._tg_status,
            ("POST", "/api/storage/cleanup"): self._cleanup,
        }
        handler = table.get((m, p))
        if handler:
            return await handler(req)
        if p.startswith("/api/store/"):
            return await self._store(req, p[len("/api/store/"):])
        raise HttpError(404, "المسار غير موجود")

    # ---- auth ----------------------------------------------------------
    async def _register(self, req: Req) -> Resp:
        await self._rate(f"reg:{req.ip}", 5, 3600)
        b = self._json(req)
        email = norm_email(b.get("email"))
        await self._check_not_banned(req, clean_str(b.get("username"), 20))
        role = "superadmin" if self.owner and email == self.owner else "member"
        rec = await self.accounts.create(
            email=email, username=b.get("username", ""), password=b.get("password", ""),
            display_name=b.get("displayName", ""), branch=b.get("branch", ""),
            grade=b.get("gradeLevel", ""), avatar=b.get("avatar"), role=role)
        return jr({"success": True, "user": public_view(rec), "token": await self.accounts.issue_token(rec)}, 201)

    async def _login(self, req: Req) -> Resp:
        b = self._json(req)
        ident = clean_str(b.get("emailOrUsername"), 254)
        pw = b.get("password")
        if not ident or not isinstance(pw, str) or not pw:
            raise HttpError(400, "أدخل بيانات الدخول")
        await self._rate(f"login:{req.ip}:{sha256_hex(ident.lower())[:12]}", 8, 900)
        rec = await self.accounts.find(ident)
        # same answer for unknown user / wrong password (no account enumeration)
        if not rec or not await self.accounts.verify_password(pw, rec["passhash"]):
            raise HttpError(401, "بيانات الدخول غير صحيحة")
        if is_banned(rec, self.clock.now()):
            raise HttpError(403, "هذا الحساب محظور")
        await self._check_not_banned(req, rec["username"], rec["email"])
        return jr({"success": True, "user": public_view(rec), "token": await self.accounts.issue_token(rec)})

    async def _me(self, req: Req) -> Resp:
        return jr({"success": True, "user": public_view(await self._user(req))})

    async def _update(self, req: Req) -> Resp:
        rec = await self._user(req)
        b = self._json(req)
        new = await self.accounts.update_profile(rec["ek"], b, b.get("currentPassword"), b.get("newPassword"))
        return jr({"success": True, "user": public_view(new)})

    # ---- files ---------------------------------------------------------
    async def _upload(self, req: Req) -> Resp:
        user = await self._user(req)
        ctype = req.headers.get("content-type", "")
        name = "file"
        if ctype.startswith("application/json"):
            if len(req.body) > MAX_JSON_UPLOAD:
                raise HttpError(413, "الملف كبير، استخدم الرفع المباشر")
            b = self._json(req, MAX_JSON_UPLOAD)
            folder = clean_str(b.get("folder"), 12) or "images"
            self._check_folder(user, folder)
            name = clean_str(b.get("fileName"), 80) or "upload"
            head, _, payload = str(b.get("dataUrl", "")).partition(",")
            if not head.startswith("data:") or ";base64" not in head:
                raise HttpError(422, "ملف غير صالح")
            try:
                data = base64.b64decode(payload, validate=True)
            except (binascii.Error, ValueError):
                raise HttpError(422, "ملف غير صالح")
            is_pdf = data[:5] == b"%PDF-"
            if not is_pdf and not data.startswith(IMAGE_MAGIC):
                raise HttpError(415, "نوع الملف غير مسموح")
            if is_pdf and folder != "pdfs":
                self._check_folder(user, "pdfs")
            mime = "application/pdf" if is_pdf else "application/octet-stream"
            url = await self.catbox.upload_bytes(name, data, mime)
            size = len(data)
        elif ctype.startswith("multipart/form-data"):
            folder = clean_str(req.query.get("folder"), 12) or "pdfs"
            self._check_folder(user, folder)
            try:
                length = int(req.headers.get("content-length", "0"))
            except ValueError:
                length = 0
            if length <= 0:
                raise HttpError(411, "حجم الملف غير معروف")
            if length > self.max_upload:
                raise HttpError(413, "الملف كبير جداً")
            url = await self.catbox.forward_multipart(req.stream if req.stream is not None else req.body,
                                                      ctype, length)
            size = length
        else:
            raise HttpError(415, "نوع الطلب غير مدعوم")
        return jr({"success": True, "url": url, "proxy_url": f"/api/file?u={quote(url, safe='')}",
                   "provider": "catbox", "fileName": name, "sizeBytes": size})

    def _check_folder(self, user: dict, folder: str) -> None:
        if folder == "pdfs":
            if not self._can_publish(user):
                raise HttpError(403, "رفع الوثائق متاح للمشرفين والمتميزين فقط")
        elif folder not in ("images", "avatars"):
            raise HttpError(422, "مجلد غير معروف")

    async def _file(self, req: Req) -> Resp:
        url = req.query.get("u", "")
        if not CATBOX_URL_RE.match(url):
            raise HttpError(400, "رابط غير مسموح")
        ckey = f"file/{sha256_hex(url)[:32]}"
        body = await self.cache.get(ckey)
        hit = body is not None
        if body is None:
            body = await self.catbox.fetch(url)
            if body is None:
                raise HttpError(404, "الملف غير متاح")
            if len(body) <= MAX_FILE_CACHE_BYTES:
                await self.cache.put(ckey, body, FILE_CACHE_TTL)
        ext = url.rsplit(".", 1)[-1].lower() if "." in url.rsplit("/", 1)[-1] else ""
        return Resp(200, {
            "content-type": CONTENT_TYPES.get(ext, "application/octet-stream"),
            "content-disposition": "inline", "cache-control": "public, max-age=86400",
            "x-content-type-options": "nosniff", "content-security-policy": "sandbox",
            "x-ss-cache": "hit" if hit else "miss"}, body)

    # ---- documents (archive bank) ---------------------------------------
    async def _docs_list(self, req: Req) -> Resp:
        return jr(await self.texts.list_items("archive-bank"), cache="public, max-age=60")

    async def _docs_add(self, req: Req) -> Resp:
        user = await self._user(req)
        if not self._can_publish(user):
            raise HttpError(403, "النشر متاح للمشرفين والمتميزين فقط")
        d = self._json(req)
        if not clean_str(d.get("title"), 200):
            raise HttpError(422, "العنوان مطلوب")
        for key in ("pdfDataUrl", "corrigePdfDataUrl", "pdfUrl", "corrigePdfUrl"):
            val = d.get(key)
            if not isinstance(val, str) or not CATBOX_URL_RE.match(val):
                d.pop(key, None)  # base64 / local-cache links never enter the shared store
        for key in ("pageImages", "corrigePageImages"):
            if any(not isinstance(x, str) or x.startswith("data:") for x in d.get(key) or []):
                d.pop(key, None)
        if not d.get("pdfUrl"):
            raise HttpError(422, "ارفع ملف PDF أولاً (لم يصل رابط الملف)")
        d["pdfDataUrl"] = d["pdfUrl"]
        if d.get("corrigePdfUrl"):
            d["corrigePdfDataUrl"] = d["corrigePdfUrl"]
        now_ms = int(self.clock.now() * 1000)
        did = clean_str(d.get("id"), 64)
        d["id"] = did if did.startswith("doc-") else f"doc-{now_ms}-{sha256_hex(self.crypto.random_bytes(8))[:5]}"
        d["createdAt"] = d.get("createdAt") if isinstance(d.get("createdAt"), int) else now_ms
        d.update({"authorUsername": user["username"], "authorDisplayName": user["displayName"],
                  "authorName": user["displayName"], "authorRole": user["role"],
                  "authorAvatar": user.get("avatarUrl") or user.get("avatar")})
        saved = await self.texts.upsert("archive-bank", d)
        return jr({"success": True, "id": saved["id"]}, 201)

    async def _docs_del(self, req: Req) -> Resp:
        user = await self._user(req)
        did = clean_str(req.query.get("id"), 128)
        cur = await self.texts.get_item("archive-bank", did)
        if not cur:
            raise HttpError(404, "الوثيقة غير موجودة")
        if user["role"] not in STAFF and cur.get("authorUsername", "").lower() != user["username"].lower():
            raise HttpError(403, "ليست لديك صلاحية حذف هذه الوثيقة")
        await self.texts.remove("archive-bank", did)
        return jr({"success": True})

    # ---- generic public text collections --------------------------------
    async def _store(self, req: Req, name: str) -> Resp:
        coll = REGISTRY.get(name)
        if not coll or not coll.public:
            raise HttpError(404, "مجموعة غير معروفة")
        m = req.method.upper()
        if m == "GET":
            return jr({"items": await self.texts.list_items(name)}, cache="public, max-age=60")
        user = await self._user(req)
        if user["role"] not in coll.writers and not (name == "archive-bank" and self._can_publish(user)):
            raise HttpError(403, "ليست لديك صلاحية")
        if m == "POST":
            item = await self.texts.upsert(name, self._json(req))
            return jr({"success": True, "id": item["id"]}, 201)
        if m == "DELETE":
            ok = await self.texts.remove(name, clean_str(req.query.get("id"), 128))
            return jr({"success": ok}, 200 if ok else 404)
        raise HttpError(405, "الطريقة غير مدعومة")

    # ---- admin ---------------------------------------------------------
    def _export_auth(self, req: Req) -> None:
        expected = self.cfg.get("EXPORT_TOKEN", "")
        given = req.headers.get("x-export-token", "")
        if len(expected) < 24 or not hmac.compare_digest(expected.encode(), given.encode()):
            raise HttpError(403, "ممنوع")

    async def _export(self, req: Req) -> Resp:
        self._export_auth(req)
        files = await self.texts.export_public()
        head = await self.head.read(fresh=True)
        return jr({"files": {k: v.decode("utf-8") for k, v in files.items()},
                   "people": {"pending": head["p"], "count": head["n"], "seq": head["s"],
                              "shard_max": PEOPLE_SHARD_MAX, "slots": PEOPLE_SLOTS, "capacity": PEOPLE_CAPACITY}})

    async def _ack(self, req: Req) -> Resp:
        self._export_auth(req)
        seq = self._json(req).get("seq")
        if not isinstance(seq, int) or seq < 0:
            raise HttpError(400, "seq غير صالح")

        async def mut(head):
            head["p"] = [o for o in head["p"] if o["s"] > seq]
            return head

        await self.head.commit(mut)
        return jr({"success": True})

    async def _admin_delete_user(self, req: Req) -> Resp:
        await self._user(req, ("superadmin",))
        ek = await self.accounts.email_key(self._json(req).get("email", ""))
        return jr({"success": await self.accounts.delete(ek)})

    async def _admin_user(self, req: Req) -> Resp:
        await self._user(req, ("superadmin",))
        b = self._json(req)
        rec = await self.accounts.admin_update(await self.accounts.email_key(b.get("email", "")), b)
        return jr({"success": True, "user": public_view(rec)})

    async def _verify_mirror(self, req: Req) -> Resp:
        await self._user(req, STAFF)
        url = clean_str(self._json(req).get("url"), 200)
        if not CATBOX_URL_RE.match(url):
            raise HttpError(400, "رابط غير مسموح")
        resp = await self.http.request("HEAD", url)
        return jr({"verified": resp.status == 200, "url": url,
                   "contentLength": int(resp.headers.get("content-length", 0) or 0)})

    async def _admin_health(self, req: Req) -> Resp:
        await self._user(req, STAFF)
        return jr({"status": "ok", "architecture": "Cloudflare cache + Telegram vault + Catbox",
                   "timestamp": int(self.clock.now() * 1000)})

    # ---- moderation ----------------------------------------------------
    async def _mod_status(self, req: Req) -> Resp:
        await self._user(req, STAFF)
        bans = await self._banlist()
        users = [b["value"] for b in bans if b["kind"] == "user"]
        ips = [b["value"] for b in bans if b["kind"] == "ip"]
        return jr({"totalBannedUsers": len(users), "totalBannedIps": len(ips),
                   "bannedUsers": users, "bannedIps": ips})

    async def _mod_ban(self, req: Req) -> Resp:
        await self._user(req, STAFF)
        b = self._json(req)
        kind, value = ("user", clean_str(b.get("userId"), 254).lower()) if b.get("userId") else \
                      ("ip", clean_str(b.get("ip"), 64))
        if not value:
            raise HttpError(422, "المعرّف مطلوب")
        await self.texts.upsert("moderation", {"id": f"{kind}:{value}", "kind": kind, "value": value,
                                               "reason": clean_str(b.get("reason"), 200),
                                               "createdAt": int(self.clock.now() * 1000)})
        return jr({"success": True})

    async def _mod_unban(self, req: Req) -> Resp:
        await self._user(req, STAFF)
        b = self._json(req)
        key = f"user:{clean_str(b.get('userId'), 254).lower()}" if b.get("userId") else f"ip:{clean_str(b.get('ip'), 64)}"
        await self.texts.remove("moderation", key)
        return jr({"success": True})

    async def _tg_status(self, req: Req) -> Resp:
        await self._user(req, STAFF)
        ok = None
        if req.query.get("probe") == "1":
            try:
                ok = bool((await self.tg.get_me()).get("id"))
            except TelegramError:
                ok = False
        return jr({"botConfigured": True, "reachable": ok, "cachedFilesCount": 0,
                   "totalCachedDiskMb": "0.00", "inMemoryAvatarsCount": 0})

    async def _cleanup(self, req: Req) -> Resp:
        await self._user(req, STAFF)
        return jr({"success": True, "message": "الكاش ينظّف نفسه تلقائياً عند انتهاء مدته (يوم للأسرار والملفات، أسبوع للنصوص)"})

    # ---- private requests (applications, feedback, complaints, tickets) --------
    KINDS = ("elite", "feedback", "complaint", "ticket")
    MUTABLE = ("status", "reviewedAt", "reviewedBy", "resolved")

    def _kind(self, value) -> str:
        kind = clean_str(value, 12)
        if kind not in self.KINDS:
            raise HttpError(422, "نوع الطلب غير معروف")
        return kind

    @staticmethod
    def _out(rec: dict) -> dict:
        out = {k: v for k, v in rec.items() if k not in ("kind", "rid")}
        out["id"] = rec.get("rid", rec["id"])
        return out

    async def _req_add(self, req: Req) -> Resp:
        user = await self._user(req)
        b = self._json(req)
        kind = self._kind(b.get("kind"))
        item = b.get("item")
        if not isinstance(item, dict) or not clean_str(item.get("id"), 100):
            raise HttpError(422, "طلب غير صالح")
        await self._rate(f"reqs:{user['ek']}", 20, 3600)
        rid = clean_str(item["id"], 100)
        item = {k: v for k, v in item.items() if not (isinstance(v, str) and v.startswith("data:"))}
        item.update({"id": f"{kind}:{rid}", "rid": rid, "kind": kind})
        item["reporterUsername" if kind == "complaint" else "username"] = user["username"]
        cur = await self.texts.get_item("requests", item["id"])
        if cur and cur.get("username", cur.get("reporterUsername", "")).lower() != user["username"].lower() \
                and user["role"] not in STAFF:
            raise HttpError(403, "لا يمكنك تعديل طلب غيرك")
        saved = await self.texts.upsert("requests", item)
        return jr({"success": True, "id": saved["rid"]}, 201)

    async def _req_list(self, req: Req) -> Resp:
        await self._user(req, STAFF)
        kind = self._kind(req.query.get("kind"))
        items = [self._out(i) for i in await self.texts.list_items("requests") if i.get("kind") == kind]
        return jr({"items": items})

    async def _req_update(self, req: Req) -> Resp:
        await self._user(req, STAFF)
        b = self._json(req)
        kind, rid = self._kind(b.get("kind")), clean_str(b.get("id"), 100)
        changes = {k: v for k, v in (b.get("changes") or {}).items() if k in self.MUTABLE}
        cur = await self.texts.get_item("requests", f"{kind}:{rid}")
        if not cur:
            raise HttpError(404, "الطلب غير موجود")
        await self.texts.upsert("requests", {"id": cur["id"], **changes}, merge=True)
        return jr({"success": True})

    async def _req_del(self, req: Req) -> Resp:
        await self._user(req, STAFF)
        kind, rid = self._kind(req.query.get("kind")), clean_str(req.query.get("id"), 100)
        ok = await self.texts.remove("requests", f"{kind}:{rid}")
        return jr({"success": ok}, 200 if ok else 404)

    # ---- public "content" (announcements, success stories): one bulk call, rules per kind ----
    CONTENT_KINDS = {"story": None,  # any logged-in user may add one
                     "super_ann": ("superadmin", "moderator", "teacher", "elite_student"),
                     "home_ann": STAFF}
    MAX_BULK = 100

    async def _content_bulk(self, req: Req) -> Resp:
        user = await self._user(req)
        b = self._json(req)
        ups, dels = b.get("upserts") or [], b.get("deletes") or []
        if not isinstance(ups, list) or not isinstance(dels, list) or len(ups) + len(dels) > self.MAX_BULK:
            raise HttpError(422, "طلب غير صالح")
        staff = user["role"] in STAFF
        if dels and not staff:
            raise HttpError(403, "الحذف للمشرفين فقط")
        existing = {i["id"] for i in await self.texts.list_items("content")}
        wrapped, skipped = [], 0
        for u in ups:
            kind = u.get("kind") if isinstance(u, dict) else None
            item = u.get("item") if isinstance(u, dict) else None
            if kind not in self.CONTENT_KINDS or not isinstance(item, dict) or not clean_str(item.get("id"), 100):
                raise HttpError(422, "عنصر غير صالح")
            allowed = self.CONTENT_KINDS[kind]
            if allowed is not None and user["role"] not in allowed:
                raise HttpError(403, "ليست لديك صلاحية لهذا النوع")
            rid = clean_str(item["id"], 100)
            cid = f"{kind}:{rid}"
            if cid in existing and not staff:
                skipped += 1  # only staff may modify what is already published
                continue
            wrapped.append({**item, "id": cid, "rid": rid, "kind": kind})
        drops = []
        for d in dels:
            kind = d.get("kind") if isinstance(d, dict) else None
            if kind not in self.CONTENT_KINDS or not clean_str(d.get("id"), 100):
                raise HttpError(422, "عنصر غير صالح")
            drops.append(f"{kind}:{clean_str(d['id'], 100)}")
        await self.texts.bulk("content", wrapped, drops)
        return jr({"success": True, "saved": len(wrapped), "skipped": skipped, "deleted": len(drops)})
