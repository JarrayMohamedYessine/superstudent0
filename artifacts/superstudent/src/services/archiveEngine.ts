/**
 * Zero-Cost Document Archive Platform Engine
 * Strict implementation of specification:
 * - Target: 1,000,000+ daily users
 * - Budget: $0 (Cloudflare Free plan only, Static Assets only, 0 Worker calls for public)
 * - Primary origin: Telegram private channel
 * - Public mirror: Catbox (<=200 MB per file)
 * - Language: Arabic-first + Latin
 */

// ---------------------------------------------------------------------------
// 1. ID System (ULID with Entity Type Prefix)
// ---------------------------------------------------------------------------

export type EntityType = "doc" | "person" | "ad" | "img";

// Crockford Base32 alphabet: 0123456789ABCDEFGHJKMNPQRSTVWXYZ (32 chars, excludes I, L, O, U)
const CROCKFORD_CHARS = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Generates a 26-character Crockford Base32 ULID
 * 10 chars (48 bits timestamp) + 16 chars (80 bits random)
 */
export function ulid(): string {
  const now = Date.now();
  let timeStr = "";
  let tempTime = now;
  for (let i = 0; i < 10; i++) {
    timeStr = CROCKFORD_CHARS[tempTime % 32] + timeStr;
    tempTime = Math.floor(tempTime / 32);
  }

  let randStr = "";
  // In browser or web workers, use crypto.getRandomValues if available
  const randomBytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
    for (let i = 0; i < 16; i++) {
      randStr += CROCKFORD_CHARS[randomBytes[i] % 32];
    }
  } else {
    for (let i = 0; i < 16; i++) {
      randStr += CROCKFORD_CHARS[Math.floor(Math.random() * 32)];
    }
  }

  return timeStr + randStr;
}

/**
 * Generates canonical ID: `${type}_${ulid()}`
 * Examples: doc_01J9Q36P2Z7VN4T8KC6YF5M3AE, person_01J9Q39BGS57NVRCF7A2D0M4WP
 */
export function generateId(type: EntityType): string {
  return `${type}_${ulid()}`;
}

export const ID_REGEX = /^(doc|person|ad|img)_[0-9A-HJKMNP-TV-Z]{26}$/;

export function isValidId(id: string): boolean {
  return ID_REGEX.test(id);
}

/**
 * Sharding rule:
 * Uses the last two Crockford Base32 characters of the ULID random entropy body.
 * This guarantees uniform random distribution across 1024 potential shards (32 * 32 = 1,024),
 * preventing hotspotting in shard "01" (which occurred due to timestamp prefix bias).
 */
export function getShardFromId(id: string): string {
  const parts = id.split("_");
  if (parts.length >= 2 && parts[1].length >= 2) {
    return parts[1].slice(-2).toLowerCase();
  }
  return "01";
}

// ---------------------------------------------------------------------------
// 2. Normalization System (Section 4.2)
// ---------------------------------------------------------------------------

/**
 * Deterministic Arabic and Latin normalization for search and indexing
 * Rules strictly followed from Section 4.2 of specification:
 * - NFKC
 * - Remove tatweel (ـ)
 * - Remove harakat / tashkeel ([ً-ٰٟ])
 * - Unify hamzas: [أإآٱ] -> ا
 * - ى -> ي
 * - [ؤئ] -> ء
 * - Eastern Arabic numerals [٠-٩] -> ASCII 0-9
 * - Remove non-letter/non-number punctuation: [^\p{L}\p{N}\s] -> space
 * - Collapse multiple whitespace
 * - Trim and lowercase (ar locale)
 * - Note: ة is deliberately preserved (NOT converted to ه)
 */
export function normalizeForSearch(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/ـ/g, "")
    .replace(/[\u064B-\u065F\u0670]/g, "") // tashkeel / harakat
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[ؤئ]/g, "ء")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("ar");
}

/**
 * Tokenizes normalized search text (max 8 tokens, min length 2)
 */
export function tokenizeText(text: string): string[] {
  const norm = normalizeForSearch(text);
  if (!norm) return [];
  const words = norm.split(" ").filter((w) => w.length >= 2);
  // Max 8 tokens per query constraint
  return Array.from(new Set(words)).slice(0, 8);
}

/**
 * Determines whether a character is Arabic or Latin
 */
export function getCharShardPath(char: string): { lang: "ar" | "latin"; charKey: string } {
  const isArabic = /[\u0600-\u06FF]/.test(char);
  if (isArabic) {
    return { lang: "ar", charKey: char };
  }
  const cleanLatin = char.toLowerCase().replace(/[^a-z0-9]/g, "misc");
  return { lang: "latin", charKey: cleanLatin || "misc" };
}

// ---------------------------------------------------------------------------
// 3. Document & Record Schemas (Section 2.1)
// ---------------------------------------------------------------------------

export interface MirrorEntry {
  p: "catbox" | string;
  u: string;
  v: boolean; // verified via sha256 + size check
}

export interface TelegramStorage {
  ch: string; // e.g. "-1001234567890"
  m: number;  // message id
  fid?: string; // file_unique_id
}

export interface ArchiveRecord {
  id: string; // doc_...
  t: string;  // title
  d: string;  // description
  p?: string; // person ID (optional)
  s: {
    tg: TelegramStorage;
    mx: MirrorEntry[];
  };
  h: string;  // sha256hex
  z: number;  // size in bytes
  m: string;  // MIME type (application/pdf)
  cat?: string; // category slug (math, physics, etc.)
  year?: number;
}

export interface ArchivePerson {
  id: string; // person_...
  name: string;
  title: string;
  avatar?: string;
  verified: boolean;
}

export interface ShardedRecordMap {
  [docId: string]: ArchiveRecord;
}

export interface InvertedIndexShard {
  [token: string]: string[]; // array of doc_... IDs
}

export interface FileLinksMap {
  [docId: string]: {
    mirrors: MirrorEntry[];
    telegram: TelegramStorage;
    hash: string;
    size: number;
  };
}

// ---------------------------------------------------------------------------
// 4. In-Memory Static Asset Cache for Zero-Worker Client Execution
// ---------------------------------------------------------------------------

const indexShardCache = new Map<string, InvertedIndexShard>();
const recordShardCache = new Map<string, ShardedRecordMap>();
let latestListCache: string[] | null = null;

/**
 * Fetches an inverted index shard from Static Assets (/data/indexes/{lang}/{char}.json)
 * Cached client-side in memory for subsequent zero-latency queries
 */
export async function fetchIndexShard(lang: "ar" | "latin", charKey: string): Promise<InvertedIndexShard> {
  const cacheKey = `${lang}/${charKey}`;
  if (indexShardCache.has(cacheKey)) {
    return indexShardCache.get(cacheKey)!;
  }

  try {
    const encodedChar = encodeURIComponent(charKey);
    const res = await fetch(`/data/indexes/${lang}/${encodedChar}.json`);
    if (!res.ok) {
      return {};
    }
    const data: InvertedIndexShard = await res.json();
    indexShardCache.set(cacheKey, data);
    return data;
  } catch (err) {
    console.warn(`Could not load index shard /data/indexes/${lang}/${charKey}.json:`, err);
    return {};
  }
}

/**
 * Fetches a record shard from Static Assets (/data/records/{shard}.json)
 */
export async function fetchRecordShard(shard: string): Promise<ShardedRecordMap> {
  if (recordShardCache.has(shard)) {
    return recordShardCache.get(shard)!;
  }

  try {
    const res = await fetch(`/data/records/${shard}.json`);
    if (!res.ok) {
      return {};
    }
    const data: ShardedRecordMap = await res.json();
    recordShardCache.set(shard, data);
    return data;
  } catch (err) {
    console.warn(`Could not load record shard /data/records/${shard}.json:`, err);
    return {};
  }
}

/**
 * Fetches latest documents list from Static Assets (/data/lists/latest.json)
 */
export async function fetchLatestDocIds(): Promise<string[]> {
  if (latestListCache) return latestListCache;
  try {
    const res = await fetch("/data/lists/latest.json");
    if (!res.ok) return [];
    const data: string[] = await res.json();
    latestListCache = data;
    return data;
  } catch {
    return [];
  }
}

/**
 * Fetches category documents list from Static Assets (/data/lists/category-{slug}.json)
 */
export async function fetchCategoryDocIds(categorySlug: string): Promise<string[]> {
  try {
    const res = await fetch(`/data/lists/category-${categorySlug}.json`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// 5. Client-Side Sharded Search (Section 4.3)
// ---------------------------------------------------------------------------

export interface SearchOptions {
  category?: string;
  maxResults?: number;
}

/**
 * Pure Client-Side Search Engine
 * - Zero Worker invocations
 * - Reads only necessary index shards from Cloudflare Edge / Static Assets
 * - Intersects document IDs in browser
 * - Reads only required record shards
 * - Limits: max query 100 chars, max tokens 8, max results 5,000
 */
export async function searchArchiveClientSide(
  query: string,
  options: SearchOptions = {}
): Promise<ArchiveRecord[]> {
  const trimmed = query.trim().slice(0, 100);
  if (!trimmed) {
    // If empty query, return latest documents
    const latestIds = options.category
      ? await fetchCategoryDocIds(options.category)
      : await fetchLatestDocIds();
    return resolveRecordsForIds(latestIds.slice(0, options.maxResults || 50));
  }

  const tokens = tokenizeText(trimmed);
  if (tokens.length === 0) {
    return [];
  }

  // Step 1: For each token, identify shard and fetch
  const tokenCandidateMaps: Array<string[]> = [];

  for (const token of tokens) {
    const firstChar = token[0];
    const { lang, charKey } = getCharShardPath(firstChar);
    const indexShard = await fetchIndexShard(lang, charKey);

    // Look for exact match or prefix matches in shard
    const matchingDocIds = new Set<string>();
    for (const [indexedToken, docIds] of Object.entries(indexShard)) {
      if (indexedToken.startsWith(token) || indexedToken === token) {
        for (const id of docIds) {
          matchingDocIds.add(id);
        }
      }
    }

    tokenCandidateMaps.push(Array.from(matchingDocIds));
  }

  if (tokenCandidateMaps.length === 0) return [];

  // Step 2: Intersect ID arrays locally
  let intersectedIds = tokenCandidateMaps[0];
  for (let i = 1; i < tokenCandidateMaps.length; i++) {
    const nextSet = new Set(tokenCandidateMaps[i]);
    intersectedIds = intersectedIds.filter((id) => nextSet.has(id));
    if (intersectedIds.length === 0) break;
  }

  // Enforce Max results limit: 5,000
  const finalIds = intersectedIds.slice(0, Math.min(options.maxResults || 100, 5000));

  // Step 3: Fetch record shards and map
  const records = await resolveRecordsForIds(finalIds);

  // Filter by category if specified
  if (options.category && options.category !== "all") {
    return records.filter((r) => r.cat === options.category);
  }

  return records;
}

/**
 * Resolves full ArchiveRecord objects for a list of document IDs
 * Grouped by shard to minimize network requests
 */
export async function resolveRecordsForIds(ids: string[]): Promise<ArchiveRecord[]> {
  const shardToIds = new Map<string, string[]>();
  for (const id of ids) {
    const shard = getShardFromId(id);
    const list = shardToIds.get(shard) || [];
    list.push(id);
    shardToIds.set(shard, list);
  }

  const resolved: ArchiveRecord[] = [];
  const foundIdSet = new Set<string>();

  for (const [shard, shardIds] of shardToIds.entries()) {
    const recordMap = await fetchRecordShard(shard);
    for (const id of shardIds) {
      if (recordMap[id]) {
        resolved.push(recordMap[id]);
        foundIdSet.add(id);
      }
    }
  }

  // Zero-downtime backward compatibility fallback:
  // For any legacy records authored prior to entropy sharding that reside in shard "01"
  const missingIds = ids.filter((id) => !foundIdSet.has(id));
  if (missingIds.length > 0) {
    const legacyMap = await fetchRecordShard("01");
    for (const id of missingIds) {
      if (legacyMap[id]) {
        resolved.push(legacyMap[id]);
        foundIdSet.add(id);
      }
    }
  }

  return resolved;
}

// ---------------------------------------------------------------------------
// 6. SHA-256 and Integrity Check
// ---------------------------------------------------------------------------

export async function computeSHA256Hex(data: ArrayBuffer): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
}

// ---------------------------------------------------------------------------
// 7. Mirror Delivery & Fallback (Section 2.3 & 11)
// ---------------------------------------------------------------------------

/**
 * Resolves public direct download / view URL for a document
 * Returns Catbox public mirror with fallback to verified mirrors or Telegram channel link
 */
export function resolvePublicMirrorUrl(record: ArchiveRecord): {
  url: string;
  provider: "catbox" | "telegram" | "direct";
  isVerified: boolean;
} {
  // Check verified Catbox mirror first
  const catboxMirror = record.s.mx.find((m) => m.p === "catbox" && m.v);
  if (catboxMirror && catboxMirror.u) {
    return {
      url: catboxMirror.u,
      provider: "catbox",
      isVerified: true,
    };
  }

  // Any verified mirror
  const anyVerified = record.s.mx.find((m) => m.v && m.u);
  if (anyVerified) {
    return {
      url: anyVerified.u,
      provider: anyVerified.p === "catbox" ? "catbox" : "direct",
      isVerified: true,
    };
  }

  // Unverified Catbox mirror
  const unverifiedCatbox = record.s.mx.find((m) => m.p === "catbox" && m.u);
  if (unverifiedCatbox) {
    return {
      url: unverifiedCatbox.u,
      provider: "catbox",
      isVerified: false,
    };
  }

  // Fallback: Telegram reference (does not expose bot token or private invite)
  // Channel format: -1001234567890 -> public link if mapped
  const tg = record.s.tg;
  const channelNumeric = tg.ch.replace(/^-100/, "");
  return {
    url: `https://t.me/c/${channelNumeric}/${tg.m}`,
    provider: "telegram",
    isVerified: true,
  };
}
