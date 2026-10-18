#!/usr/bin/env python3
"""One-off helper: push items from a JSON list file into a public collection.

  SS_API_URL=https://example.com SS_TOKEN=<superadmin JWT from /api/auth/login> \
  python3 backend/scripts/seed_store.py ads items.json

Each item must have a unique "id". Existing ids are replaced, nothing else is touched.
"""
import json
import os
import sys
import urllib.request


def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__)
        return 1
    coll, path = sys.argv[1], sys.argv[2]
    api, token = os.environ.get("SS_API_URL", "").rstrip("/"), os.environ.get("SS_TOKEN", "")
    if not api.startswith("https://") or not token:
        print("SS_API_URL (https) and SS_TOKEN are required")
        return 1
    with open(path, encoding="utf-8") as fh:
        items = json.load(fh)
    if not isinstance(items, list):
        print("the file must contain a JSON list")
        return 1
    for item in reversed(items):  # reversed: the first item ends up newest
        req = urllib.request.Request(
            f"{api}/api/store/{coll}", data=json.dumps(item).encode("utf-8"), method="POST",
            headers={"content-type": "application/json", "authorization": f"Bearer {token}"})
        with urllib.request.urlopen(req, timeout=60) as resp:  # noqa: S310
            print(item.get("id"), resp.status)
    return 0


if __name__ == "__main__":
    sys.exit(main())
