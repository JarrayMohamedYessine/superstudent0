import hashlib
import hmac as _hmac
import json
import re
from ss.ports import HttpResponse


class Clock:
    def __init__(self, t=1_800_000_000.0):
        self.t = t

    def now(self):
        return self.t

    def advance(self, seconds):
        self.t += seconds


class MemKV:
    def __init__(self):
        self.d, self.writes = {}, 0

    async def get(self, key):
        return self.d.get(key)

    async def put(self, key, value):
        self.writes += 1
        self.d[key] = value

    async def delete(self, key):
        self.d.pop(key, None)

    async def list(self, prefix):
        return sorted(k for k in self.d if k.startswith(prefix))


class MemCache:
    def __init__(self, clock):
        self.clock, self.d = clock, {}

    async def get(self, key):
        v = self.d.get(key)
        if not v or v[1] <= self.clock.now():
            return None
        return v[0]

    async def put(self, key, value, ttl):
        self.d[key] = (value, self.clock.now() + ttl)


class NoCache:
    """Behaves like Cache API on *.workers.dev (does nothing)."""
    async def get(self, key):
        return None

    async def put(self, key, value, ttl):
        pass


class Crypto:
    async def pbkdf2(self, password, salt, iterations):
        return hashlib.pbkdf2_hmac("sha256", password, salt, 1000)  # fast for tests

    async def hmac_sha256(self, key, msg):
        return _hmac.new(key, msg, hashlib.sha256).digest()

    def random_bytes(self, n):
        import os
        return os.urandom(n)


def parse_multipart(body: bytes, ctype: str):
    boundary = ctype.split("boundary=")[1].encode()
    fields, files = {}, {}
    for part in body.split(b"--" + boundary):
        if b"Content-Disposition" not in part:
            continue
        head, _, data = part.partition(b"\r\n\r\n")
        data = data[:-2] if data.endswith(b"\r\n") else data
        name = re.search(rb'name="([^"]+)"', head).group(1).decode()
        fn = re.search(rb'filename="([^"]*)"', head)
        if fn:
            files[name] = (fn.group(1).decode(), data)
        else:
            fields[name] = data.decode()
    return fields, files


class FakeWorld:
    """Fake Telegram Bot API + Catbox on one Http port."""
    TOKEN = "123456:SECRET-TOKEN"

    def __init__(self):
        self.msgs, self.next_mid, self.files = {}, 100, {}
        self.deleted, self.pinned, self.calls = [], None, []
        self.catbox, self.catbox_n = {}, 0
        self.fail_429_times = 0
        self.catbox_down = False
        self.after_pin = None  # hook: simulate another writer pinning a newer head
        self.last_forward = None

    async def request(self, method, url, headers=None, body=None, stream=None):
        self.calls.append((method, url))
        if "api.telegram.org/file/bot" in url:
            path = url.split("/file/bot" + self.TOKEN + "/")[1]
            return HttpResponse(200, {}, self.files[path])
        m = re.match(r"https://api\.telegram\.org/bot([^/]+)/(\w+)", url)
        if m:
            return self._telegram(m.group(1), m.group(2), headers or {}, body)
        if url == "https://catbox.moe/user/api.php":
            if self.catbox_down:
                return HttpResponse(503, {}, b"down")
            if stream is not None:
                self.last_forward = (headers, stream)
                data = stream if isinstance(stream, bytes) else b"streamed"
            else:
                fields, files = parse_multipart(body, headers["content-type"])
                assert fields.get("reqtype") == "fileupload"
                data = files["fileToUpload"][1]
            self.catbox_n += 1
            link = f"https://files.catbox.moe/f{self.catbox_n:04d}.pdf"
            self.catbox[link] = data
            return HttpResponse(200, {}, link.encode())
        if url.startswith("https://files.catbox.moe/"):
            if self.catbox_down or url not in self.catbox:
                return HttpResponse(404, {}, b"")
            return HttpResponse(200, {"content-length": str(len(self.catbox[url]))},
                                b"" if method == "HEAD" else self.catbox[url])
        raise AssertionError("unexpected url " + url)

    def _ok(self, result):
        return HttpResponse(200, {}, json.dumps({"ok": True, "result": result}).encode())

    def _telegram(self, token, api, headers, body):
        if token != self.TOKEN:
            return HttpResponse(401, {}, json.dumps({"ok": False, "error_code": 401, "description": "Unauthorized " + token}).encode())
        if self.fail_429_times > 0:
            self.fail_429_times -= 1
            return HttpResponse(429, {}, json.dumps({"ok": False, "error_code": 429, "description": "Too Many Requests",
                                                      "parameters": {"retry_after": 1}}).encode())
        if api == "sendDocument":
            fields, files = parse_multipart(body, headers["content-type"])
            name, data = files["document"]
            self.next_mid += 1
            fid = f"FID{self.next_mid}"
            self.msgs[self.next_mid] = {"name": name, "caption": fields.get("caption", ""), "fid": fid}
            self.files[f"documents/{fid}"] = data
            self.files_by_fid = getattr(self, "files_by_fid", {})
            self.files_by_fid[fid] = f"documents/{fid}"
            return self._ok({"message_id": self.next_mid, "document": {"file_id": fid, "file_size": len(data)}})
        payload = json.loads(body or b"{}")
        if api == "getFile":
            return self._ok({"file_path": self.files_by_fid[payload["file_id"]], "file_size": 1})
        if api == "deleteMessage":
            self.deleted.append(payload["message_id"])
            return self._ok(True)
        if api == "pinChatMessage":
            self.pinned = payload["message_id"]
            if self.after_pin:
                hook, self.after_pin = self.after_pin, None
                hook(self)
            return self._ok(True)
        if api == "getChat":
            if not self.pinned:
                return self._ok({"id": -1})
            return self._ok({"id": -1, "pinned_message": {"message_id": self.pinned,
                                                         "document": {"file_id": self.msgs[self.pinned]["fid"]}}})
        if api == "getMe":
            return self._ok({"id": 1, "is_bot": True})
        if api == "sendMessage":
            self.next_mid += 1
            return self._ok({"message_id": self.next_mid})
        raise AssertionError(api)

    def inject_foreign_head(self):
        """Another writer uploads and pins its own head right after ours."""
        self.next_mid += 1
        fid = f"FID{self.next_mid}"
        self.msgs[self.next_mid] = {"name": "head-foreign.json", "caption": "#head", "fid": fid}
        self.files[f"documents/{fid}"] = b'{"v":99,"t":{},"b":{},"p":[],"n":0,"s":0,"h":[]}'
        self.files_by_fid = getattr(self, "files_by_fid", {})
        self.files_by_fid[fid] = f"documents/{fid}"
        self.pinned = self.next_mid

    def all_telegram_blobs(self):
        return list(self.files.values())

    def tg_doc_count(self):
        return len(self.msgs)
