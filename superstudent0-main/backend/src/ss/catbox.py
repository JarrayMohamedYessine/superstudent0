"""Catbox client: permanent public links for PDFs/images."""
from __future__ import annotations

from typing import Any, Optional

from .ports import Http
from .telegram import build_multipart
from .util import CATBOX_URL_RE

UPLOAD_URL = "https://catbox.moe/user/api.php"


class CatboxError(Exception):
    pass


def _validated(resp_status: int, body: bytes) -> str:
    text = (body or b"").decode("utf-8", "replace").strip()
    if resp_status != 200 or not CATBOX_URL_RE.match(text):
        raise CatboxError("Catbox did not return a valid file link")
    return text


class CatboxClient:
    def __init__(self, http: Http, random_bytes):
        self._http = http
        self._rand = random_bytes

    async def upload_bytes(self, name: str, data: bytes, mime: str) -> str:
        boundary = "ssc" + self._rand(12).hex()
        body, ctype = build_multipart({"reqtype": "fileupload"}, [("fileToUpload", name, data, mime)], boundary)
        resp = await self._http.request("POST", UPLOAD_URL, {"content-type": ctype}, body)
        return _validated(resp.status, resp.body)

    async def forward_multipart(self, stream: Any, content_type: str, content_length: int) -> str:
        """Pass the browser's multipart body straight to Catbox without reading it
        into Python (keeps Worker CPU/memory near zero for large PDFs)."""
        headers = {"content-type": content_type, "content-length": str(content_length)}
        resp = await self._http.request("POST", UPLOAD_URL, headers, None, stream)
        return _validated(resp.status, resp.body)

    async def fetch(self, url: str) -> Optional[bytes]:
        if not CATBOX_URL_RE.match(url):
            return None
        resp = await self._http.request("GET", url)
        return resp.body if resp.status == 200 else None
