"""Cloudflare Python Worker entrypoint (thin glue only; all rules live in ss/).

NOTE: this file is the only part that touches Cloudflare runtime objects. It is
intentionally small. Everything in ss/ is covered by tests/ with in-memory fakes.
"""
import time
from urllib.parse import urlparse, parse_qsl

from js import Object, Request as JsRequest, Response as JsResponse, caches, crypto as js_crypto, fetch as js_fetch
from pyodide.ffi import to_js
from workers import WorkerEntrypoint

from ss.app import App, ConfigError, jr, read_config
from ss.ports import HttpResponse, Req

CACHE_BASE = "https://cache.superstudent.invalid/"


def _js(obj):
    return to_js(obj, dict_converter=Object.fromEntries)


class CfCache:
    """Cloudflare Cache API. Per data-center, and only functional on custom domains.
    On *.workers.dev it silently does nothing: the app then reads from Telegram/Catbox."""

    async def get(self, key):
        try:
            resp = await caches.default.match(JsRequest.new(CACHE_BASE + key))
            if resp is None:
                return None
            return (await resp.arrayBuffer()).to_bytes()
        except Exception:
            return None

    async def put(self, key, value, ttl):
        try:
            resp = JsResponse.new(to_js(value), _js({"headers": {"Cache-Control": f"public, max-age={int(ttl)}"}}))
            await caches.default.put(JsRequest.new(CACHE_BASE + key), resp)
        except Exception:
            pass  # a cache problem must never break a request


class CfHttp:
    async def request(self, method, url, headers=None, body=None, stream=None):
        opts = {"method": method, "headers": {k: v for k, v in (headers or {}).items()
                                              if not (stream is not None and k.lower() == "content-length")}}
        if stream is not None:
            opts["body"] = stream
        elif body is not None:
            opts["body"] = to_js(body)
        resp = await js_fetch(url, _js(opts))
        data = (await resp.arrayBuffer()).to_bytes() if method != "HEAD" else b""
        clen = resp.headers.get("content-length")
        return HttpResponse(int(resp.status), {"content-length": clen} if clen else {}, data)


class CfCrypto:
    async def pbkdf2(self, password, salt, iterations):
        key = await js_crypto.subtle.importKey("raw", to_js(password), "PBKDF2", False, to_js(["deriveBits"]))
        params = _js({"name": "PBKDF2", "hash": "SHA-256", "salt": salt, "iterations": iterations})
        return (await js_crypto.subtle.deriveBits(params, key, 256)).to_bytes()

    async def hmac_sha256(self, key, msg):
        k = await js_crypto.subtle.importKey("raw", to_js(key), _js({"name": "HMAC", "hash": "SHA-256"}),
                                             False, to_js(["sign"]))
        return (await js_crypto.subtle.sign("HMAC", k, to_js(msg))).to_bytes()

    def random_bytes(self, n):
        import secrets
        return secrets.token_bytes(n)


class SysClock:
    def now(self):
        return time.time()


_APP = None


def _env_dict(env):
    keys = ("TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "JWT_SECRET", "PEPPER", "OWNER_EMAIL", "EXPORT_TOKEN",
            "ALLOWED_ORIGIN", "PBKDF2_ITERATIONS", "MAX_UPLOAD_MB")
    out = {}
    for k in keys:
        v = getattr(env, k, None)
        if v is not None:
            out[k] = str(v)
    return out


def _get_app(env):
    global _APP
    if _APP is None:
        _APP = App(read_config(_env_dict(env)), CfCache(), CfHttp(), CfCrypto(), SysClock())
    return _APP


def _to_response(resp):
    body = None if resp.status in (101, 204, 205, 304) else to_js(resp.body)
    return JsResponse.new(body, _js({"status": resp.status, "headers": resp.headers}))


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        raw = getattr(request, "js_object", request)
        url = urlparse(str(raw.url))
        if not url.path.startswith("/api/"):
            return await self.env.ASSETS.fetch(raw)
        try:
            app = _get_app(self.env)
        except ConfigError:
            return _to_response(jr({"success": False, "error": "الخلفية غير مهيّأة بعد"}, 503))
        ctype = raw.headers.get("content-type") or ""
        multipart = ctype.startswith("multipart/form-data")
        if not multipart and int(raw.headers.get("content-length") or 0) > 4 * 1024 * 1024:
            return _to_response(jr({"success": False, "error": "الطلب كبير جداً"}, 413))
        body = b"" if multipart or raw.method in ("GET", "HEAD", "OPTIONS") else (await raw.arrayBuffer()).to_bytes()
        headers = {k: raw.headers.get(k) for k in ("authorization", "content-type", "content-length", "origin",
                                                   "x-export-token") if raw.headers.get(k)}
        req = Req(method=raw.method, path=url.path, query=dict(parse_qsl(url.query)), headers=headers,
                  body=body, ip=raw.headers.get("cf-connecting-ip") or "", stream=raw.body if multipart else None)
        try:
            resp = await app.handle(req)
        except Exception as exc:  # never leak internals / secrets
            print("unhandled error:", type(exc).__name__)
            resp = jr({"success": False, "error": "خطأ داخلي"}, 500)
        return _to_response(resp)
