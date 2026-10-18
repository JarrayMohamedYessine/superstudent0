"""Accounts. Secrets (e-mail, password hash) live ONLY in Telegram, inside small "bucket"
documents (256 buckets, chosen by a keyed hash of the identifier). The head document points
to each bucket; the Cloudflare cache keeps a decoded bucket for one day. No database, no KV."""
from __future__ import annotations

import hmac
import unicodedata

from .ports import Cache, Clock, Crypto
from .state import Head, StateError, load_doc
from .telegram import TelegramClient
from .texts import PEOPLE_CAPACITY
from .util import EMAIL_RE, USERNAME_RE, b64u, clean_str, dumps, loads, norm_email, unb64u

SECRET_CACHE_TTL = 24 * 3600  # one day
TOKEN_TTL = 30 * 24 * 3600
KEEP_OLD = 2
MAX_PENDING = 5000
PBKDF2_MAX = 100_000  # Cloudflare WebCrypto maximum

PROFILE_FIELDS = ("username", "displayName", "avatarUrl", "branch", "gradeLevel", "role")
PUBLIC_FIELDS = ("email", "username", "displayName", "avatar", "avatarUrl", "branch", "gradeLevel",
                 "role", "moderatorRooms", "banned", "bannedUntil", "createdAt", "canUpload")
SELF_EDITABLE = {"displayName": 60, "avatar": 2048, "avatarUrl": 2048, "branch": 40, "gradeLevel": 40}
ROLES = ("member", "elite_student", "teacher", "moderator", "superadmin")


class AccountError(StateError):
    pass


def public_view(rec: dict) -> dict:
    out = {k: rec.get(k) for k in PUBLIC_FIELDS}
    out["id"] = rec["ek"]
    out["moderatorRooms"] = rec.get("moderatorRooms") or []
    out["banned"] = bool(rec.get("banned"))
    out["canUpload"] = bool(rec.get("canUpload"))
    return out


def is_banned(rec: dict, now: float) -> bool:
    until = rec.get("bannedUntil")
    return until > now * 1000 if until else bool(rec.get("banned"))


def _http_url(value):
    return value if isinstance(value, str) and value.startswith("https://") and len(value) <= 2048 else None


def profile_op(rec: dict, seq: int) -> dict:
    """The public part of an account that goes to the people file on the next sync."""
    return {"s": seq, "op": "up", "u": rec["username"], "n": rec["displayName"],
            "a": _http_url(rec.get("avatarUrl")) or _http_url(rec.get("avatar")), "b": rec.get("branch"),
            "g": rec.get("gradeLevel"), "r": rec.get("role"), "c": rec.get("createdAt")}


class AccountStore:
    def __init__(self, head: Head, tg: TelegramClient, cache: Cache, crypto: Crypto, clock: Clock,
                 pepper: str, jwt_secret: str, iterations: int = PBKDF2_MAX):
        if len(jwt_secret) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters")
        self.head, self.tg, self.cache, self.crypto, self.clock = head, tg, cache, crypto, clock
        self._pepper = pepper.encode("utf-8")
        self._jwt = jwt_secret.encode("utf-8")
        self._iters = max(10_000, min(int(iterations), PBKDF2_MAX))

    # ---- keys ----------------------------------------------------------
    async def key(self, ns: str, ident: str) -> str:
        mac = await self.crypto.hmac_sha256(self._pepper, f"{ns}:{ident}".encode("utf-8"))
        return mac.hex()[:20]

    async def email_key(self, email: str) -> str:
        return await self.key("e", norm_email(email))

    async def user_key(self, username: str) -> str:
        return await self.key("u", clean_str(username, 20).lower())

    # ---- passwords / JWT -----------------------------------------------
    async def _prehash(self, password: str) -> bytes:
        return await self.crypto.hmac_sha256(self._pepper, unicodedata.normalize("NFKC", password).encode("utf-8"))

    async def hash_password(self, password: str) -> str:
        salt = self.crypto.random_bytes(16)
        dk = await self.crypto.pbkdf2(await self._prehash(password), salt, self._iters)
        return f"pbkdf2$sha256${self._iters}${b64u(salt)}${b64u(dk)}"

    async def verify_password(self, password: str, stored: str) -> bool:
        try:
            scheme, algo, iters, salt, digest = stored.split("$")
            if scheme != "pbkdf2" or algo != "sha256":
                return False
            dk = await self.crypto.pbkdf2(await self._prehash(password), unb64u(salt), min(int(iters), PBKDF2_MAX))
            return hmac.compare_digest(dk, unb64u(digest))
        except (ValueError, TypeError):
            return False

    async def issue_token(self, rec: dict) -> str:
        now = int(self.clock.now())
        head = b64u(dumps({"alg": "HS256", "typ": "JWT"}))
        body = b64u(dumps({"sub": rec["ek"], "iat": now, "exp": now + TOKEN_TTL}))
        sig = await self.crypto.hmac_sha256(self._jwt, f"{head}.{body}".encode("ascii"))
        return f"{head}.{body}.{b64u(sig)}"

    async def verify_token(self, token: str):
        try:
            head, body, sig = token.split(".")
            expect = await self.crypto.hmac_sha256(self._jwt, f"{head}.{body}".encode("ascii"))
            if not hmac.compare_digest(expect, unb64u(sig)) or loads(unb64u(head)).get("alg") != "HS256":
                return None
            claims = loads(unb64u(body))
            return claims if claims.get("exp", 0) >= self.clock.now() else None
        except (ValueError, TypeError, KeyError):
            return None

    # ---- buckets -------------------------------------------------------
    async def _bucket(self, head: dict, bid: str) -> dict:
        ptr = head["b"].get(bid)
        if not ptr:
            return {"k": {}}
        blob = await load_doc(self.tg, self.cache, f"bkt/{bid}/v{ptr['v']}", ptr["fid"], SECRET_CACHE_TTL)
        return loads(blob)

    async def _put_bucket(self, head: dict, bid: str, doc: dict) -> None:
        old = head["b"].get(bid)
        v = (old["v"] + 1) if old else 1
        blob = dumps(doc)
        sent = await self.tg.send_document(f"bkt-{bid}-v{v}.json", blob, f"#bkt {bid} v{v}")
        prev = (list(old.get("prev", [])) + [old["mid"]]) if old else []
        head["b"][bid] = {"mid": sent["mid"], "fid": sent["fid"], "v": v, "prev": prev[-KEEP_OLD:]}
        head.setdefault("_del", []).extend(prev[:-KEEP_OLD])
        await self.cache.put(f"bkt/{bid}/v{v}", blob, SECRET_CACHE_TTL)

    # ---- reads ---------------------------------------------------------
    async def get_by_key(self, ek: str):
        head = await self.head.read()
        rec = (await self._bucket(head, ek[:2]))["k"].get(ek)
        return rec if isinstance(rec, dict) and "email" in rec else None

    async def find(self, identifier: str):
        ident = clean_str(identifier, 254)
        if "@" in ident:
            return await self.get_by_key(await self.email_key(ident))
        head = await self.head.read()
        uk = await self.user_key(ident)
        entry = (await self._bucket(head, uk[:2]))["k"].get(uk)
        return await self.get_by_key(entry["e"]) if isinstance(entry, dict) and "e" in entry else None

    # ---- writes --------------------------------------------------------
    async def create(self, *, email: str, username: str, password: str, display_name: str,
                     branch: str, grade: str, avatar, role: str = "member") -> dict:
        email_n = norm_email(email)
        if not EMAIL_RE.match(email_n) or len(email_n) > 254:
            raise AccountError(422, "بريد إلكتروني غير صالح")
        uname = clean_str(username, 20)
        if not USERNAME_RE.match(uname):
            raise AccountError(422, "اسم المستخدم غير صالح (3-20 حرفاً)")
        if not isinstance(password, str) or not (6 <= len(password) <= 128):
            raise AccountError(422, "كلمة المرور يجب أن تكون بين 6 و128 حرفاً")
        ek, uk = await self.email_key(email_n), await self.user_key(uname)
        rec = {
            "ek": ek, "email": email_n, "username": uname,
            "displayName": clean_str(display_name, 60) or uname,
            "avatar": clean_str(avatar, 2048) or None, "avatarUrl": None,
            "branch": clean_str(branch, 40) or "math", "gradeLevel": clean_str(grade, 40) or "4eme_bac",
            "role": role if role in ROLES else "member", "moderatorRooms": [],
            "banned": False, "bannedUntil": None, "canUpload": role == "superadmin",
            "createdAt": int(self.clock.now() * 1000),
            "passhash": await self.hash_password(password),
        }
        out: dict = {}

        async def mut(head):
            eb = await self._bucket(head, ek[:2])
            ub = eb if uk[:2] == ek[:2] else await self._bucket(head, uk[:2])
            if ek in eb["k"]:
                raise AccountError(409, "هذا البريد مسجل مسبقاً")
            if uk in ub["k"]:
                raise AccountError(409, "اسم المستخدم مأخوذ")
            if head["n"] >= PEOPLE_CAPACITY:
                raise AccountError(503, "اكتملت سعة الموقع حالياً")
            if len(head["p"]) >= MAX_PENDING:
                raise AccountError(503, "التسجيل متوقف مؤقتاً حتى تتم مزامنة ملفات الموقع")
            eb["k"][ek] = dict(rec)
            ub["k"][uk] = {"e": ek}
            for bid, doc in ({ek[:2]: eb, uk[:2]: ub}).items():
                await self._put_bucket(head, bid, doc)
            head["n"] += 1
            head["s"] += 1
            head["p"].append(profile_op(rec, head["s"]))
            out.clear(); out.update(rec)
            return head

        await self.head.commit(mut)
        return dict(out)

    async def _modify(self, ek: str, change) -> dict:
        out: dict = {}

        async def mut(head):
            bucket = await self._bucket(head, ek[:2])
            rec = bucket["k"].get(ek)
            if not isinstance(rec, dict) or "email" not in rec:
                raise AccountError(404, "الحساب غير موجود")
            before = {f: rec.get(f) for f in PROFILE_FIELDS}
            await change(rec)
            await self._put_bucket(head, ek[:2], bucket)
            if {f: rec.get(f) for f in PROFILE_FIELDS} != before:
                if len(head["p"]) >= MAX_PENDING:
                    raise AccountError(503, "التحديث متوقف مؤقتاً حتى تتم مزامنة ملفات الموقع")
                head["s"] += 1
                head["p"].append(profile_op(rec, head["s"]))
            out.clear(); out.update(rec)
            return head

        await self.head.commit(mut)
        return dict(out)

    async def update_profile(self, ek: str, changes: dict, current_password=None, new_password=None) -> dict:
        async def change(rec):
            for field, max_len in SELF_EDITABLE.items():
                if field in changes:
                    val = clean_str(changes[field], max_len)
                    rec[field] = (val or None) if field in ("avatar", "avatarUrl") else (val or rec.get(field))
            if new_password is not None:
                if not (6 <= len(new_password) <= 128):
                    raise AccountError(422, "كلمة المرور يجب أن تكون بين 6 و128 حرفاً")
                if not current_password or not await self.verify_password(current_password, rec["passhash"]):
                    raise AccountError(403, "كلمة المرور الحالية غير صحيحة")
                rec["passhash"] = await self.hash_password(new_password)

        return await self._modify(ek, change)

    async def admin_update(self, ek: str, changes: dict) -> dict:
        async def change(rec):
            if "role" in changes:
                if changes["role"] not in ROLES:
                    raise AccountError(422, "رتبة غير صالحة")
                rec["role"] = changes["role"]
            for flag in ("canUpload", "banned"):
                if flag in changes:
                    rec[flag] = bool(changes[flag])
            if "bannedUntil" in changes:
                rec["bannedUntil"] = int(changes["bannedUntil"]) if changes["bannedUntil"] else None
            if isinstance(changes.get("moderatorRooms"), list):
                rec["moderatorRooms"] = [clean_str(r, 40) for r in changes["moderatorRooms"][:50]]

        return await self._modify(ek, change)

    async def delete(self, ek: str) -> bool:
        gone = {"ok": False}

        async def mut(head):
            bucket = await self._bucket(head, ek[:2])
            rec = bucket["k"].pop(ek, None)
            if not isinstance(rec, dict):
                return None
            uk = await self.user_key(rec["username"])
            ub = bucket if uk[:2] == ek[:2] else await self._bucket(head, uk[:2])
            ub["k"].pop(uk, None)
            for bid, doc in ({ek[:2]: bucket, uk[:2]: ub}).items():
                await self._put_bucket(head, bid, doc)
            head["n"] = max(0, head["n"] - 1)
            head["s"] += 1
            head["p"].append({"s": head["s"], "op": "del", "u": rec["username"]})
            gone["ok"] = True
            return head

        await self.head.commit(mut)
        return gone["ok"]
