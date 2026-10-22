/**
 * Static text store removed: the app keeps its bundled datasets only.
 * Kept as no-op stubs so the data layer and the UI compile unchanged — every load
 * returns null and callers keep their local (memory / bundled) data.
 */

export type StoreCollection =
  | "archive-bank"
  | "ads"
  | "announcements"
  | "faqs"
  | "images"
  | "staff"
  | "content";

/** Always null: the shared store no longer exists, callers keep their bundled data. */
export async function loadStoreCollection<T = { id: string }>(_name: StoreCollection): Promise<T[] | null> {
  return null;
}

export type ContentKind = "super_ann" | "home_ann" | "story";

export async function loadContentKind<T extends { id: string }>(_kind: ContentKind): Promise<T[] | null> {
  return null;
}
