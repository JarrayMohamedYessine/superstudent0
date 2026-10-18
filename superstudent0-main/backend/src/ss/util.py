from __future__ import annotations

import base64
import hashlib
import json
import re

EMAIL_RE = re.compile(r"^[^\s@'\"/\\]+@[^\s@'\"/\\]+\.[^\s@'\"/\\]+$")
USERNAME_RE = re.compile(r"^[a-zA-Z0-9_\u0600-\u06FF-]{3,20}$")
CATBOX_URL_RE = re.compile(r"^https://files\.catbox\.moe/[A-Za-z0-9._-]{3,64}$")


def b64u(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def unb64u(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def sha256_hex(data) -> str:
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def norm_email(email) -> str:
    return (email or "").strip().lower()


def email_key(email) -> str:
    """Stable, non-reversible key for an e-mail (used in KV keys & cache keys)."""
    return sha256_hex(norm_email(email))[:32]


def dumps(obj) -> bytes:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")


def loads(data):
    if isinstance(data, (bytes, bytearray)):
        data = bytes(data).decode("utf-8")
    return json.loads(data)


def clean_str(value, max_len: int) -> str:
    if value is None:
        return ""
    s = str(value)
    s = "".join(ch for ch in s if ch >= " " or ch in "\n\t")
    return s.strip()[:max_len]
