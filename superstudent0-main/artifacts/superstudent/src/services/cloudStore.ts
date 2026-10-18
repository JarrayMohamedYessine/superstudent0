/**
 * Static text store loader.
 *
 * Public texts (archive bank, ads, announcements, FAQs, images, staff, stories/polls) are
 * served as a few static JSON files under /store/ (at most 20 files, ever). They are free
 * and unlimited on Cloudflare (no Worker call). /store/manifest carries a content hash
 * per file, so every file URL is versioned (?v=hash): the browser/edge can keep it for a
 * week and a new version is picked up as soon as the manifest changes.
 *
 * Every function here NEVER throws: on any problem it returns null and the caller keeps its
 * previous behaviour.
 */

export type StoreCollection =
  | "archive-bank"
  | "ads"
  | "announcements"
  | "faqs"
  | "images"
  | "staff"
  | "content";

interface StoreManifest {
  schema: number;
  generatedAt: number;
  files: Record<string, { sha: string; n: number; bytes: number }>;
}

const MANIFEST_TTL_MS = 5 * 60 * 1000;
let manifestPromise: Promise<StoreManifest | null> | null = null;
let manifestFetchedAt = 0;
const collectionMemory = new Map<string, { at: number; items: unknown[] }>();

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function getManifest(): Promise<StoreManifest | null> {
  const now = Date.now();
  if (!manifestPromise || now - manifestFetchedAt > MANIFEST_TTL_MS) {
    manifestFetchedAt = now;
    manifestPromise = fetchJson<StoreManifest>(`/store/manifest?t=${Math.floor(now / MANIFEST_TTL_MS)}`);
  }
  return manifestPromise;
}

/**
 * Returns the items of a collection, or null when the static store is unreachable
 * (null means "ask the caller's fallback"; an empty array means "reachable, nothing yet").
 */
export async function loadStoreCollection<T = { id: string }>(name: StoreCollection): Promise<T[] | null> {
  const memo = collectionMemory.get(name);
  if (memo && Date.now() - memo.at < MANIFEST_TTL_MS) return memo.items as T[];

  const manifest = await getManifest();
  if (!manifest || !manifest.files) return null;

  const prefix = `${name}.`;
  const names = Object.keys(manifest.files).filter(
    (f) => f === `${name}.json` || (f.startsWith(prefix) && f.endsWith(".json")),
  );
  if (names.length === 0) return null;

  const parts = await Promise.all(
    names.map((f) => fetchJson<{ items?: T[] }>(`/store/${f}?v=${encodeURIComponent(manifest.files[f].sha)}`)),
  );
  if (parts.some((p) => p === null)) return null;

  const items = parts.flatMap((p) => (p && Array.isArray(p.items) ? p.items : []));
  collectionMemory.set(name, { at: Date.now(), items });
  return items;
}

export type ContentKind = "super_ann" | "home_ann" | "story";

/** Items of the shared "content" file for one kind (announcements, stories), original ids restored. */
export async function loadContentKind<T extends { id: string }>(kind: ContentKind): Promise<T[] | null> {
  const all = await loadStoreCollection<Record<string, unknown>>("content");
  if (all === null) return null;
  return all
    .filter((i) => i.kind === kind)
    .map((i) => {
      const { kind: _k, rid, ...rest } = i;
      return { ...rest, id: String(rid ?? rest.id) } as unknown as T;
    });
}
