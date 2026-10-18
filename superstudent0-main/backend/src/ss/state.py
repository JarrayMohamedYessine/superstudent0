"""Durable state WITHOUT any database/KV.

All pointers (Telegram message ids) live in ONE small "head" document that is pinned in the
private Telegram channel. Reads use the Cloudflare cache (30 s); every write re-reads the
head from Telegram, applies its change, uploads the new head, pins it and verifies it won.
Old heads / shard documents are kept (last few versions) so nothing is destroyed.
"""
from __future__ import annotations

import copy

from .ports import Cache, Clock
from .telegram import TelegramClient
from .util import dumps, loads

HEAD_CACHE_TTL = 30
HEAD_KEEP = 3


class StateError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status, self.message = status, message


def empty_head() -> dict:
    # v: version, t: text/private collection shard pointers, b: account bucket pointers,
    # p: pending public-profile ops (waiting for the next site sync), n: people count,
    # s: op sequence counter, h: previous head message ids
    return {"v": 0, "t": {}, "b": {}, "p": [], "n": 0, "s": 0, "h": []}


class Head:
    def __init__(self, tg: TelegramClient, cache: Cache, clock: Clock):
        self.tg, self.cache, self.clock = tg, cache, clock

    async def read(self, fresh: bool = False) -> dict:
        if not fresh:
            cached = await self.cache.get("head/latest")
            if cached is not None:
                return loads(cached)
        pm = (await self.tg.chat()).get("pinned_message") or {}
        doc = pm.get("document")
        if not doc:
            head = empty_head()
        else:
            head = loads(await self.tg.get_file_bytes(doc["file_id"]))
            head["_mid"] = pm["message_id"]
        await self.cache.put("head/latest", dumps(head), HEAD_CACHE_TTL)
        return head

    async def commit(self, mutator, attempts: int = 3) -> dict:
        """mutator(head) -> new head (or None for no change). It must be safe to run again:
        on a write conflict it is re-run on the fresh head. Telegram messages listed in
        head['_del'] are deleted only after the new head is safely pinned."""
        for _ in range(attempts):
            head = await self.read(fresh=True)
            new = await mutator(copy.deepcopy(head))
            if new is None:
                return head
            prev = list(new.get("h", [])) + ([head["_mid"]] if head.get("_mid") else [])
            new["h"] = prev[-HEAD_KEEP:]
            dropped = prev[:-HEAD_KEEP]
            new["v"] = head["v"] + 1
            to_delete = list(new.get("_del", [])) + dropped
            blob = dumps({k: v for k, v in new.items() if not k.startswith("_")})
            sent = await self.tg.send_document(f"head-v{new['v']}.json", blob, "#head")
            await self.tg.pin(sent["mid"])
            pinned = (await self.tg.chat()).get("pinned_message") or {}
            if pinned.get("message_id") == sent["mid"]:
                new["_mid"] = sent["mid"]
                new.pop("_del", None)
                await self.cache.put("head/latest", dumps(new), HEAD_CACHE_TTL)
                for mid in to_delete:
                    await self.tg.delete_message(mid)
                return new
            # someone else pinned a newer head meanwhile: retry on top of theirs
        raise StateError(409, "ازدحام كتابة، أعد المحاولة بعد لحظات")


async def load_doc(tg: TelegramClient, cache: Cache, ckey: str, fid: str, ttl: int) -> bytes:
    blob = await cache.get(ckey)
    if blob is None:
        blob = await tg.get_file_bytes(fid)
        await cache.put(ckey, blob, ttl)
    return blob
