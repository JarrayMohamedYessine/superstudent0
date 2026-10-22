/**
 * Browser storage removed (Cache Storage API / IndexedDB tiers): nothing is persisted on the device.
 * Kept as in-memory-only stubs so the data layer and the UI compile unchanged:
 * - cacheFileInBrowser keeps data in RAM for the current page only.
 * - fetchWithSWR returns its fallback directly, without touching the network.
 */

const memoryCache = new Map<string, { data: unknown; timestamp: number }>();
const MEMORY_TTL_MS = 10 * 60 * 1000; // 10 minutes memory retention

/**
 * Stores a file payload in memory for the current session only.
 */
export async function cacheFileInBrowser(urlOrKey: string, blobOrData: Blob | string, contentType = "application/pdf"): Promise<boolean> {
  void contentType;
  memoryCache.set(urlOrKey, { data: blobOrData, timestamp: Date.now() });
  return true;
}

/**
 * Retrieves a cached file from memory only.
 */
export async function getCachedFile(urlOrKey: string): Promise<{ blob?: Blob; text?: string; source: "memory" | "cache-api" | "miss" }> {
  const mem = memoryCache.get(urlOrKey);
  if (mem && Date.now() - mem.timestamp < MEMORY_TTL_MS) {
    if (mem.data instanceof Blob) {
      return { blob: mem.data, source: "memory" };
    }
    if (typeof mem.data === "string") {
      return { text: mem.data, source: "memory" };
    }
  }
  return { source: "miss" };
}

/**
 * Returns the fallback immediately: no network request is made.
 */
export async function fetchWithSWR<T>(url: string, fallbackData?: T): Promise<T> {
  void url;
  return fallbackData as T;
}

/**
 * Clears the in-memory cache
 */
export async function clearPlatformCache(): Promise<void> {
  memoryCache.clear();
}
