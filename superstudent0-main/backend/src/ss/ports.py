"""Ports (interfaces). The core never touches Cloudflare/Telegram directly,
so every rule below is unit-tested with in-memory fakes."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional, Protocol


@dataclass
class Req:
    method: str
    path: str
    query: dict = field(default_factory=dict)
    headers: dict = field(default_factory=dict)  # lower-case keys
    body: bytes = b""
    ip: str = ""
    stream: Any = None  # opaque raw body stream (Cloudflare adapter only)


@dataclass
class Resp:
    status: int = 200
    headers: dict = field(default_factory=dict)
    body: bytes = b""


@dataclass
class HttpResponse:
    status: int
    headers: dict
    body: bytes


class KV(Protocol):
    async def get(self, key: str) -> Optional[str]: ...
    async def put(self, key: str, value: str) -> None: ...
    async def delete(self, key: str) -> None: ...
    async def list(self, prefix: str) -> list: ...


class Cache(Protocol):
    async def get(self, key: str) -> Optional[bytes]: ...
    async def put(self, key: str, value: bytes, ttl: int) -> None: ...


class Http(Protocol):
    async def request(self, method: str, url: str, headers: Optional[dict] = None,
                      body: Optional[bytes] = None, stream: Any = None) -> HttpResponse: ...


class Crypto(Protocol):
    async def pbkdf2(self, password: bytes, salt: bytes, iterations: int) -> bytes: ...
    async def hmac_sha256(self, key: bytes, msg: bytes) -> bytes: ...
    def random_bytes(self, n: int) -> bytes: ...


class Clock(Protocol):
    def now(self) -> float: ...
