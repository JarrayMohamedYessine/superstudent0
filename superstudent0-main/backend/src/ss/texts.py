"""Text collections: Telegram (durable) + Cloudflare cache (7 days) + public static snapshot.

Owner rules enforced here:
  * never one file per user: collections are grouped by TYPE
  * the static snapshot can never exceed MAX_STATIC_FILES files (people shards included)
  * private collections (requests, moderation) are NEVER exported to the snapshot
  * public items can never carry e-mails / passwords (stripped on write)
  * old Telegram versions are kept (last KEEP_VERSIONS) so nothing is destroyed
"""
from __future__ import annotations

from dataclasses import dataclass

from .ports import Cache, Clock
from .state import Head, StateError, load_doc
from .telegram import TelegramClient
from .util import clean_str, dumps, loads, sha256_hex

MAX_STATIC_FILES = 20
MANIFEST_NAME = "manifest"  # extension-less on purpose: short cache, see public/_headers
PEOPLE_SHARD_MAX = 100_000  # a new people file is opened automatically after this many
TEXT_CACHE_TTL = 7 * 24 * 3600  # one week
KEEP_VERSIONS = 3
MAX_ITEM_BYTES = 64 * 1024
MAX_SHARD_BYTES = 15 * 1024 * 1024  # stay below Telegram's 20 MB download limit
FORBIDDEN_PUBLIC_KEYS = {"email", "authoremail", "password", "passhash", "accesscode", "token"}


@dataclass(frozen=True)
class Collection:
    name: str
    shards: int = 1
    public: bool = True
    writers: tuple = ("superadmin", "moderator")


REGISTRY = {
    c.name: c
    for c in (
        Collection("archive-bank", shards=10, writers=("superadmin", "moderator", "teacher", "elite_student")),
        Collection("ads", shards=2),
        Collection("faqs"),
        Collection("content"),  # announcements, success stories, monthly poll, staff list, image links
        Collection("requests", shards=4, public=False),  # applications / feedback / complaints: PRIVATE
        Collection("moderation", public=False),
    )
}


def static_file_names() -> list:
    names = []
    for c in REGISTRY.values():
        if c.public:
            names.extend([f"{c.name}.json"] if c.shards == 1 else [f"{c.name}.{i}.json" for i in range(c.shards)])
    return names


FIXED_FILES = len(static_file_names()) + 1  # + manifest
PEOPLE_SLOTS = MAX_STATIC_FILES - FIXED_FILES
PEOPLE_CAPACITY = PEOPLE_SLOTS * PEOPLE_SHARD_MAX
assert PEOPLE_SLOTS >= 1, "no room left for people files inside the 20-file budget"


class StoreError(StateError):
    pass


def _strip_forbidden(obj):
    if isinstance(obj, dict):
        return {k: _strip_forbidden(v) for k, v in obj.items() if k.lower() not in FORBIDDEN_PUBLIC_KEYS}
    if isinstance(obj, list):
        return [_strip_forbidden(v) for v in obj]
    return obj


class TextStore:
    def __init__(self, head: Head, tg: TelegramClient, cache: Cache, clock: Clock):
        self.head, self.tg, self.cache, self.clock = head, tg, cache, clock

    @staticmethod
    def coll(name: str) -> Collection:
        c = REGISTRY.get(name)
        if not c:
            raise StoreError(404, "مجموعة غير معروفة")
        return c

    @staticmethod
    def shard_of(coll: Collection, item_id: str) -> int:
        return 0 if coll.shards == 1 else int(sha256_hex(item_id)[:8], 16) % coll.shards

    async def _load(self, head: dict, name: str, shard: int):
        ptr = head["t"].get(f"{name}.{shard}")
        if not ptr:
            return None, []
        blob = await load_doc(self.tg, self.cache, f"txt/{name}.{shard}/v{ptr['v']}", ptr["fid"], TEXT_CACHE_TTL)
        return ptr, list(loads(blob).get("items", []))

    async def _put(self, head: dict, name: str, shard: int, ptr, items: list) -> None:
        v = (ptr["v"] + 1) if ptr else 1
        blob = dumps({"v": v, "items": items})
        if len(blob) > MAX_SHARD_BYTES:
            raise StoreError(507, "الملف امتلأ")
        sent = await self.tg.send_document(f"{name}.{shard}-v{v}.json", blob, f"#coll {name}.{shard} v{v}")
        prev = (list(ptr.get("prev", [])) + [ptr["mid"]]) if ptr else []
        head["t"][f"{name}.{shard}"] = {"mid": sent["mid"], "fid": sent["fid"], "v": v, "n": len(items),
                                        "sha": sha256_hex(blob)[:16], "prev": prev[-KEEP_VERSIONS:]}
        head.setdefault("_del", []).extend(prev[:-KEEP_VERSIONS])
        await self.cache.put(f"txt/{name}.{shard}/v{v}", blob, TEXT_CACHE_TTL)

    def _check_item(self, coll: Collection, item) -> dict:
        if not isinstance(item, dict):
            raise StoreError(422, "عنصر غير صالح")
        out = _strip_forbidden(item) if coll.public else dict(item)
        out["id"] = clean_str(out.get("id"), 128)
        if not out["id"]:
            raise StoreError(422, "المعرّف مطلوب")
        if len(dumps(out)) > MAX_ITEM_BYTES:
            raise StoreError(413, "العنصر كبير جداً")
        return out

    # ---- public API ----------------------------------------------------
    async def list_items(self, name: str, fresh: bool = False) -> list:
        coll = self.coll(name)
        head = await self.head.read(fresh=fresh)
        items: list = []
        for s in range(coll.shards):
            items.extend((await self._load(head, name, s))[1])
        items.sort(key=lambda d: d.get("createdAt", 0) if isinstance(d.get("createdAt", 0), (int, float)) else 0,
                   reverse=True)
        return items

    async def get_item(self, name: str, item_id: str):
        coll = self.coll(name)
        head = await self.head.read()
        _, items = await self._load(head, name, self.shard_of(coll, item_id))
        return next((i for i in items if i.get("id") == item_id), None)

    async def upsert(self, name: str, item: dict, merge: bool = False) -> dict:
        coll = self.coll(name)
        item = self._check_item(coll, item)
        shard = self.shard_of(coll, item["id"])
        saved: dict = {}

        async def mut(head):
            ptr, items = await self._load(head, name, shard)
            old = next((i for i in items if i.get("id") == item["id"]), None)
            new_item = {**old, **item} if (merge and old) else item
            saved.clear(); saved.update(new_item)
            await self._put(head, name, shard, ptr, [new_item] + [i for i in items if i.get("id") != item["id"]])
            return head

        await self.head.commit(mut)
        return dict(saved)

    async def remove(self, name: str, item_id: str) -> bool:
        coll = self.coll(name)
        shard = self.shard_of(coll, item_id)
        found = {"ok": False}

        async def mut(head):
            ptr, items = await self._load(head, name, shard)
            kept = [i for i in items if i.get("id") != item_id]
            found["ok"] = len(kept) != len(items)
            if not found["ok"]:
                return None
            await self._put(head, name, shard, ptr, kept)
            return head

        await self.head.commit(mut)
        return found["ok"]

    async def bulk(self, name: str, upserts: list, deletes: list) -> None:
        """Many changes, ONE head commit (a few Telegram uploads instead of one per item)."""
        coll = self.coll(name)
        ups = [self._check_item(coll, u) for u in upserts]
        dels = {clean_str(d, 128) for d in deletes}
        by_shard: dict = {}
        for u in ups:
            by_shard.setdefault(self.shard_of(coll, u["id"]), {"up": [], "del": set()})["up"].append(u)
        for d in dels:
            by_shard.setdefault(self.shard_of(coll, d), {"up": [], "del": set()})["del"].add(d)
        if not by_shard:
            return

        async def mut(head):
            changed = False
            for shard, ch in by_shard.items():
                ptr, items = await self._load(head, name, shard)
                new_ids = {u["id"] for u in ch["up"]}
                kept = [i for i in items if i.get("id") not in ch["del"] and i.get("id") not in new_ids]
                merged = ch["up"] + kept
                if merged != items:
                    await self._put(head, name, shard, ptr, merged)
                    changed = True
            return head if changed else None

        await self.head.commit(mut)

    # ---- static snapshot (people files + manifest are built by the sync script) ----
    async def export_public(self) -> dict:
        head = await self.head.read(fresh=True)
        files: dict = {}
        for coll in REGISTRY.values():
            if not coll.public:
                continue
            for s in range(coll.shards):
                _, items = await self._load(head, coll.name, s)
                fname = f"{coll.name}.json" if coll.shards == 1 else f"{coll.name}.{s}.json"
                files[fname] = dumps({"items": items})
        return files
