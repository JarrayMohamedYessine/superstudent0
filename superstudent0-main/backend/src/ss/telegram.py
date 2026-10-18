"""Telegram Bot API client used as a private vault (texts + secrets)."""
from __future__ import annotations

import asyncio
import json
from typing import Optional

from .ports import Http, Crypto, HttpResponse

API = "https://api.telegram.org"
MAX_GETFILE_BYTES = 20 * 1024 * 1024  # Bot API download limit


class TelegramError(Exception):
    def __init__(self, code: int, description: str):
        super().__init__(f"telegram error {code}: {description}")
        self.code = code
        self.description = description


class TelegramBusy(TelegramError):
    def __init__(self, retry_after: int):
        super().__init__(429, f"retry after {retry_after}s")
        self.retry_after = retry_after


def build_multipart(fields: dict, files: list, boundary: str) -> tuple:
    """files: [(field, filename, data, content_type)] -> (body, content_type)."""
    parts = []
    for name, value in fields.items():
        parts.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode("utf-8")
        )
    for field, filename, data, ctype in files:
        safe = "".join(c for c in filename if c not in '"\r\n\\') or "file"
        parts.append(
            (
                f'--{boundary}\r\nContent-Disposition: form-data; name="{field}"; '
                f'filename="{safe}"\r\nContent-Type: {ctype}\r\n\r\n'
            ).encode("utf-8")
        )
        parts.append(data)
        parts.append(b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode("ascii"))
    return b"".join(parts), f"multipart/form-data; boundary={boundary}"


class TelegramClient:
    def __init__(self, http: Http, crypto: Crypto, token: str, chat_id: str, sleep=asyncio.sleep):
        self._http = http
        self._crypto = crypto
        self._token = token
        self._chat = str(chat_id)
        self._sleep = sleep

    def _url(self, method: str) -> str:
        return f"{API}/bot{self._token}/{method}"

    def _scrub(self, text: str) -> str:
        return text.replace(self._token, "***") if self._token else text

    async def _call(self, method: str, payload: Optional[dict] = None, multipart: Optional[tuple] = None):
        for attempt in range(2):
            if multipart is not None:
                body, ctype = multipart
                headers = {"content-type": ctype}
            else:
                body = json.dumps(payload or {}).encode("utf-8")
                headers = {"content-type": "application/json"}
            resp: HttpResponse = await self._http.request("POST", self._url(method), headers, body)
            try:
                data = json.loads(resp.body or b"{}")
            except ValueError:
                raise TelegramError(resp.status, "invalid response from Telegram")
            if data.get("ok"):
                return data.get("result")
            code = int(data.get("error_code", resp.status))
            if code == 429:
                retry = int((data.get("parameters") or {}).get("retry_after", 1))
                if attempt == 0 and retry <= 2:
                    await self._sleep(retry)
                    continue
                raise TelegramBusy(retry)
            raise TelegramError(code, self._scrub(str(data.get("description", "error"))))
        raise TelegramBusy(1)

    async def send_document(self, name: str, data: bytes, caption: str = "") -> dict:
        boundary = "ssb" + self._crypto.random_bytes(12).hex()
        body = build_multipart(
            {"chat_id": self._chat, "caption": caption[:1000], "disable_notification": "true"},
            [("document", name, data, "application/json")],
            boundary,
        )
        msg = await self._call("sendDocument", multipart=body)
        doc = msg["document"]
        return {"mid": msg["message_id"], "fid": doc["file_id"], "size": doc.get("file_size", len(data))}

    async def get_file_bytes(self, file_id: str) -> bytes:
        info = await self._call("getFile", {"file_id": file_id})
        if info.get("file_size", 0) > MAX_GETFILE_BYTES:
            raise TelegramError(413, "file too large for Bot API download")
        url = f"{API}/file/bot{self._token}/{info['file_path']}"
        resp = await self._http.request("GET", url)
        if resp.status != 200:
            raise TelegramError(resp.status, "could not download file from Telegram")
        return resp.body

    async def delete_message(self, mid: int) -> bool:
        try:
            await self._call("deleteMessage", {"chat_id": self._chat, "message_id": mid})
            return True
        except TelegramError:
            return False

    async def send_text(self, text: str) -> int:
        msg = await self._call("sendMessage", {"chat_id": self._chat, "text": text[:4000],
                                               "disable_notification": True})
        return msg["message_id"]

    async def get_me(self) -> dict:
        return await self._call("getMe", {})

    async def pin(self, mid: int) -> None:
        await self._call("pinChatMessage", {"chat_id": self._chat, "message_id": mid,
                                            "disable_notification": True})

    async def pinned_file_id(self) -> Optional[str]:
        chat = await self._call("getChat", {"chat_id": self._chat})
        return ((chat or {}).get("pinned_message") or {}).get("document", {}).get("file_id")

    async def chat(self) -> dict:
        return await self._call("getChat", {"chat_id": self._chat}) or {}
