/**
 * Cloud bridge removed: nothing is ever sent to a server.
 * Kept as no-op stubs so the data layer and the UI compile unchanged — every call
 * reports "unavailable" (false / null) and callers keep their local (memory) data.
 */
import { getCachedRole, getStoredToken } from "./authClient";

export type RequestKind = "elite" | "feedback" | "complaint" | "ticket";

function hasSession(): boolean {
  try {
    return !!getStoredToken();
  } catch {
    return false;
  }
}

export async function pushRequest(kind: RequestKind, item: { id: string }): Promise<boolean> {
  void kind;
  void item;
  return false;
}

/** Staff only. Always null: the private cloud copy no longer exists. */
export async function pullRequests<T extends { id: string }>(kind: RequestKind): Promise<T[] | null> {
  void kind;
  void getCachedRole();
  return null;
}

export async function updateRequestRemote(kind: RequestKind, id: string, changes: Record<string, unknown>): Promise<boolean> {
  void kind;
  void id;
  void changes;
  return false;
}

export async function deleteRequestRemote(kind: RequestKind, id: string): Promise<boolean> {
  void kind;
  void id;
  return false;
}

export async function pushStoreItem(collection: string, item: { id: string }): Promise<boolean> {
  void collection;
  void item;
  return false;
}

export async function deleteStoreItem(collection: string, id: string): Promise<boolean> {
  void collection;
  void id;
  return false;
}

export type ContentKind = "super_ann" | "home_ann" | "story";

export async function pushContent(kind: ContentKind, items: { id: string }[]): Promise<boolean> {
  void kind;
  void items;
  return false;
}

export async function deleteContent(kind: ContentKind, id: string): Promise<boolean> {
  void kind;
  void id;
  return false;
}

export async function syncAdminUser(email: string, changes: Record<string, unknown>): Promise<boolean> {
  void email;
  void changes;
  return false;
}

export async function deleteAccountRemote(email: string): Promise<boolean> {
  void email;
  return false;
}

/** Union by id; with no remote copy this is the identity function. */
export function mergeById<T extends { id: string }>(local: T[], remote: T[] | null): T[] {
  if (!remote) return local;
  const remoteIds = new Set(remote.map((r) => r.id));
  return [...remote, ...local.filter((l) => !remoteIds.has(l.id))];
}
