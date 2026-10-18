#!/usr/bin/env python3
"""Pull the public text snapshot + pending people profiles from the Worker and write them into
public/store/ (at most 20 JSON files in total).

Safety rules (nothing is ever destroyed by a bad export):
  * never more than 20 files (manifest included); a new people file is opened automatically
    when the last one reaches the shard limit (100,000 people)
  * a text collection that has items is never replaced by an empty one, and never shrinks
    by more than half (unless --allow-shrink is given)
  * files are written atomically (temp file + rename), the manifest last
  * secrets never reach this folder: the Worker only exports public collections, and the
    people entries contain no e-mail / password / pointer
  * pending profile ops are acknowledged to the Worker only AFTER the files are committed
    and pushed (see the workflow), so a failed run loses nothing
Environment: SS_API_URL (https), SS_EXPORT_TOKEN
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
import urllib.request

MAX_FILES = 20
MANIFEST = "manifest"
NAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,40}(\.\d{1,2})?\.json$")
PEOPLE_RE = re.compile(r"^people\.(\d+)\.json$")
PEOPLE_KEYS = ("u", "n", "a", "b", "g", "r", "c")


class SyncError(Exception):
    pass


def dumps(obj) -> bytes:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")


def _items(blob: bytes) -> list:
    data = json.loads(blob.decode("utf-8"))
    if not isinstance(data, dict) or not isinstance(data.get("items"), list):
        raise SyncError("file does not contain an items list")
    return data["items"]


def merge_people(existing: dict, ops: list, shard_max: int, slots: int) -> dict:
    """existing: {name: bytes} (people.N.json only). Returns the full new people files."""
    shards = {}
    for name, blob in existing.items():
        m = PEOPLE_RE.match(name)
        if m:
            shards[int(m.group(1))] = _items(blob)
    order = sorted(shards)
    if order != list(range(len(order))):
        raise SyncError("people files are not numbered 0..N-1")
    shards = [shards[i] for i in order]
    where = {e["u"].lower(): i for i, sh in enumerate(shards) for e in sh}

    for op in sorted(ops, key=lambda o: o["s"]):
        key = str(op.get("u", "")).lower()
        if not key:
            raise SyncError("people op without username")
        if op["op"] == "del":
            idx = where.pop(key, None)
            if idx is not None:
                shards[idx] = [e for e in shards[idx] if e["u"].lower() != key]
            continue
        entry = {k: op.get(k) for k in PEOPLE_KEYS}
        if key in where:
            sh = shards[where[key]]
            sh[:] = [entry if e["u"].lower() == key else e for e in sh]
            continue
        if not shards or len(shards[-1]) >= shard_max:
            if len(shards) >= slots:
                raise SyncError("no free people file left inside the 20-file budget")
            shards.append([])
        shards[-1].append(entry)
        where[key] = len(shards) - 1

    return {f"people.{i}.json": dumps({"items": sh}) for i, sh in enumerate(shards)}


def plan_sync(existing: dict, exported: dict, ops: list, shard_max: int, slots: int,
              allow_shrink: bool = False, now: int = 0) -> dict:
    """existing/exported: {filename: bytes}. Returns {filename: bytes} to write (only changed ones)."""
    for name in exported:
        if not NAME_RE.match(name) or name == MANIFEST or PEOPLE_RE.match(name):
            raise SyncError(f"unsafe or unexpected file name: {name!r}")
    for name, blob in exported.items():
        new_items = _items(blob)
        if name in existing:
            old_items = _items(existing[name])
            if old_items and not new_items and not allow_shrink:
                raise SyncError(f"{name}: refusing to replace {len(old_items)} items with an empty list")
            if len(old_items) >= 10 and len(new_items) < len(old_items) / 2 and not allow_shrink:
                raise SyncError(f"{name}: refusing to shrink from {len(old_items)} to {len(new_items)} items")

    old_people = {n: b for n, b in existing.items() if PEOPLE_RE.match(n)}
    people = merge_people(old_people, ops, shard_max, slots)
    final = {**exported, **people}
    keep_old = {n for n in existing if n != MANIFEST and n not in final}  # never delete what we don't own
    if len(final) + len(keep_old) + 1 > MAX_FILES:
        raise SyncError(f"would exceed {MAX_FILES} files in the store folder")

    writes = {n: b for n, b in final.items() if existing.get(n) != b}
    info = {n: {"sha": hashlib.sha256(b).hexdigest()[:12], "n": len(_items(b)), "bytes": len(b)}
            for n, b in final.items()}
    for n in keep_old:
        info[n] = {"sha": hashlib.sha256(existing[n]).hexdigest()[:12], "n": len(_items(existing[n])),
                   "bytes": len(existing[n])}
    try:
        old_manifest = json.loads(existing[MANIFEST].decode("utf-8")) if MANIFEST in existing else None
    except ValueError:
        old_manifest = None
    if writes or old_manifest is None or old_manifest.get("files") != info:
        writes[MANIFEST] = dumps({"schema": 1, "generatedAt": now or int(time.time()), "files": info})
    return writes


def read_dir(path: str) -> dict:
    out = {}
    if os.path.isdir(path):
        for name in os.listdir(path):
            full = os.path.join(path, name)
            if os.path.isfile(full) and (name.endswith(".json") or name == MANIFEST):
                with open(full, "rb") as fh:
                    out[name] = fh.read()
    return out


def write_atomic(path: str, writes: dict) -> None:
    os.makedirs(path, exist_ok=True)
    for name in sorted(writes, key=lambda n: n == MANIFEST):  # manifest last
        tmp = os.path.join(path, f".{name}.tmp")
        with open(tmp, "wb") as fh:
            fh.write(writes[name])
        os.replace(tmp, os.path.join(path, name))


def _call(api: str, token: str, path: str, payload=None) -> dict:
    req = urllib.request.Request(api.rstrip("/") + path, method="POST" if payload is not None else "GET",
                                 data=json.dumps(payload).encode() if payload is not None else None,
                                 headers={"x-export-token": token, "content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:  # noqa: S310 (https URL from a trusted secret)
        if resp.status != 200:
            raise SyncError(f"{path} returned HTTP {resp.status}")
        return json.loads(resp.read().decode("utf-8"))


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out")
    ap.add_argument("--ack-file", help="where to remember the sequence to acknowledge after the push")
    ap.add_argument("--ack-from", help="acknowledge the sequence stored in this file")
    ap.add_argument("--allow-shrink", action="store_true")
    args = ap.parse_args(argv)
    api, token = os.environ.get("SS_API_URL", ""), os.environ.get("SS_EXPORT_TOKEN", "")
    if not api.startswith("https://") or len(token) < 24:
        print("SS_API_URL (https) and SS_EXPORT_TOKEN (>= 24 chars) are required", file=sys.stderr)
        return 1
    try:
        if args.ack_from:
            with open(args.ack_from) as fh:
                seq = int(fh.read().strip())
            _call(api, token, "/api/admin/ack", {"seq": seq})
            os.remove(args.ack_from)
            print("acknowledged", seq)
            return 0
        data = _call(api, token, "/api/admin/export")
        files = {k: v.encode("utf-8") for k, v in (data.get("files") or {}).items()}
        people = data.get("people") or {}
        if not files:
            raise SyncError("export has no files")
        ops = list(people.get("pending") or [])
        writes = plan_sync(read_dir(args.out), files, ops, int(people["shard_max"]), int(people["slots"]),
                           args.allow_shrink)
    except (SyncError, OSError, ValueError, KeyError) as exc:
        print(f"SYNC ABORTED (nothing was changed): {exc}", file=sys.stderr)
        return 1
    if writes:
        write_atomic(args.out, writes)
        print("CHANGED:", ", ".join(sorted(writes)))
    else:
        print("no changes")
    if args.ack_file and ops:
        with open(args.ack_file, "w") as fh:
            fh.write(str(max(o["s"] for o in ops)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
